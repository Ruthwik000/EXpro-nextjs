import Groq from "groq-sdk";
import { config } from "../config";
import logger from "../logger";
import {
  QueryRequest,
  QueryResponse,
  SourceReference,
  QueryMetadata,
  SearchResult,
} from "../types";
import { embeddingService } from "./EmbeddingService";
import { vectorStoreService } from "./VectorStoreService";

export class RAGService {
  private client: Groq;
  private model: string;

  constructor() {
    this.client = new Groq({
      apiKey: config.groq.apiKey,
    });
    this.model = config.groq.model;
  }

  async query(request: QueryRequest): Promise<QueryResponse> {
    const startTime = Date.now();

    try {
      logger.info(
        {
          repoId: request.repoId,
          query: request.query,
          requestedMinScore: request.minScore,
          requestedTopK: request.topK,
        },
        "Query request received",
      );

      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(
        request.query,
      );

      logger.info(
        {
          queryLength: request.query.length,
          embeddingDim: queryEmbedding.length,
        },
        "Generated query embedding",
      );

      // Build filter based on scope
      const filter = this.buildFilter(request.scope);

      // Search for relevant chunks
      const topK = request.topK || 5;
      const searchResults = await vectorStoreService.search(
        queryEmbedding,
        request.repoId,
        topK,
        filter,
      );

      logger.info(
        {
          query: request.query,
          resultsFound: searchResults.length,
          scores: searchResults.map((r) => r.score.toFixed(3)),
          topFiles: searchResults.map((r) => r.metadata.relativePath),
        },
        "Search results from Pinecone",
      );

      // Filter by minimum score if specified (lowered for local embeddings)
      const minScore = request.minScore || 0.15;  // Lowered from 0.3 to 0.15 for local embeddings
      const relevantResults = searchResults.filter(
        (result) => result.score >= minScore,
      );

      logger.info(
        {
          beforeFilter: searchResults.length,
          afterFilter: relevantResults.length,
          minScore,
        },
        "Filtered results by score",
      );

      if (relevantResults.length === 0) {
        logger.warn(
          {
            query: request.query,
            totalResults: searchResults.length,
            minScore,
            highestScore: searchResults[0]?.score || 0,
          },
          "No results passed minimum score threshold",
        );
        return {
          answer:
            "I could not find relevant information to answer your question.",
          sources: [],
          metadata: {
            tokensUsed: 0,
            latencyMs: Date.now() - startTime,
            model: this.model,
            retrievedChunks: 0,
          },
        };
      }

      // Generate answer using RAG
      const answer = await this.generateAnswer(request.query, relevantResults);

      // Calculate tokens used (rough estimate)
      const tokensUsed = this.estimateTokens(
        request.query,
        relevantResults,
        answer,
      );

      // Build source references
      const sources = this.buildSourceReferences(relevantResults);

      const metadata: QueryMetadata = {
        tokensUsed,
        latencyMs: Date.now() - startTime,
        model: this.model,
        retrievedChunks: relevantResults.length,
      };

      logger.info(
        {
          repoId: request.repoId,
          query: request.query,
          sources: sources.length,
          metadata,
        },
        "Query completed",
      );

      return {
        answer,
        sources,
        metadata,
      };
    } catch (error) {
      logger.error({ error, request }, "Query failed");
      throw error;
    }
  }

  private buildFilter(
    scope?: QueryRequest["scope"],
  ): Record<string, any> | undefined {
    if (!scope) return undefined;

    const filter: Record<string, any> = {};

    if (scope.type === "folder" && scope.path) {
      // Match files that start with the folder path
      filter.relativePath = { $regex: `^${scope.path}` };
    } else if (scope.type === "file" && scope.path) {
      // Match exact file path
      filter.relativePath = { $eq: scope.path };
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  private async generateAnswer(
    query: string,
    results: SearchResult[],
  ): Promise<string> {
    // Build context from search results - limit to avoid token overflow
    const context = results
      .slice(0, 5)  // Only use top 5 results to stay under 6000 token limit
      .map((result, index) => {
        const fileInfo = `File: ${result.metadata.relativePath} (lines ${result.metadata.startLine}-${result.metadata.endLine})`;
        // Truncate code to 400 chars per chunk to fit Groq's 6000 token limit
        const code = result.content.substring(0, 400);
        return `[${index + 1}] ${fileInfo}\n\`\`\`${result.metadata.language || ""}\n${code}\n\`\`\``;
      })
      .join("\n\n");

    const systemPrompt = `You are an expert code assistant helping developers understand codebases.
You will be given code snippets from a repository and a question about the code.
Provide clear, accurate answers based on the code provided.
If the code doesn't contain enough information to answer the question, say so.
Reference specific files and line numbers when relevant.
Format code snippets using markdown code blocks.`;

    const userPrompt = `Based on the following code snippets from the repository, please answer this question:

Question: ${query}

Code Context:
${context}

Please provide a detailed answer based on the code above.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      return (
        response.choices[0]?.message?.content || "Unable to generate answer."
      );
    } catch (error) {
      logger.error({ error }, "Failed to generate answer");
      throw error;
    }
  }

  private buildSourceReferences(results: SearchResult[]): SourceReference[] {
    return results.map((result) => ({
      file: result.metadata.relativePath,
      chunk:
        result.content.substring(0, 200) +
        (result.content.length > 200 ? "..." : ""),
      score: Math.round(result.score * 100) / 100,
      startLine: result.metadata.startLine,
      endLine: result.metadata.endLine,
      language: result.metadata.language,
    }));
  }

  private estimateTokens(
    query: string,
    results: SearchResult[],
    answer: string,
  ): number {
    // Rough estimate: 1 token ≈ 4 characters
    const queryTokens = Math.ceil(query.length / 4);
    const contextTokens = Math.ceil(
      results.reduce((sum, r) => sum + r.content.length, 0) / 4,
    );
    const answerTokens = Math.ceil(answer.length / 4);
    const systemPromptTokens = 100; // Rough estimate

    return queryTokens + contextTokens + answerTokens + systemPromptTokens;
  }
}

export const ragService = new RAGService();
export default ragService;
