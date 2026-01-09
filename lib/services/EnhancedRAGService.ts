import Groq from "groq-sdk";
import { config } from "../config";
import logger from "../logger";
import { QueryRequest, QueryResponse, QueryMetadata } from "../types";
import { ragService } from "./RAGService";
import { githubAPIService } from "./GitHubAPIService";
import { normalizeRepoId } from "../utils";

/**
 * Enhanced RAG Service that can answer questions about:
 * - Code (using vector search)
 * - Issues (using GitHub API)
 * - Combined context
 */
export class EnhancedRAGService {
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
      // Detect if query is about issues
      const isIssueQuery = this.detectIssueQuery(request.query);

      if (isIssueQuery) {
        return await this.queryWithIssues(request, startTime);
      }

      // Default to code-only query
      return await ragService.query(request);
    } catch (error) {
      logger.error({ error, request }, "Enhanced query failed");
      throw error;
    }
  }

  private detectIssueQuery(query: string): boolean {
    const issueKeywords = [
      "issue",
      "issues",
      "bug",
      "bugs",
      "assigned",
      "assignee",
      "open issue",
      "closed issue",
      "pull request",
      "pr",
      "ticket",
      "task",
      "who is working on",
      "what issues",
    ];

    const lowerQuery = query.toLowerCase();
    return issueKeywords.some((keyword) => lowerQuery.includes(keyword));
  }

  private async queryWithIssues(
    request: QueryRequest,
    startTime: number
  ): Promise<QueryResponse> {
    try {
      // Reconstruct repo URL from repoId
      const repoUrl = `https://github.com/${request.repoId}`;

      // Fetch issues
      const issues = await githubAPIService.getIssues(repoUrl, {
        state: "all",
        per_page: 30,
      });

      logger.info(
        { repoId: request.repoId, issueCount: issues.length },
        "Fetched issues for query"
      );

      // Also get code context if relevant
      let codeContext = "";
      let codeSources: any[] = [];

      try {
        const codeResult = await ragService.query({
          ...request,
          topK: 3, // Fewer code results when combining with issues
        });
        codeContext = codeResult.answer;
        codeSources = codeResult.sources;
      } catch (error) {
        logger.warn({ error }, "Failed to get code context, continuing with issues only");
      }

      // Generate answer combining issues and code
      const answer = await this.generateAnswerWithIssues(
        request.query,
        issues,
        codeContext
      );

      const metadata: QueryMetadata = {
        tokensUsed: this.estimateTokens(request.query, issues, answer),
        latencyMs: Date.now() - startTime,
        model: this.model,
        retrievedChunks: issues.length,
      };

      // Build sources from issues
      const issueSources = issues.slice(0, 5).map((issue: any) => ({
        file: `Issue #${issue.number}`,
        chunk: `${issue.title}\n${issue.body?.substring(0, 200) || ""}...`,
        score: 1.0,
        startLine: 0,
        endLine: 0,
        language: "markdown",
        issueNumber: issue.number,
        issueState: issue.state,
        assignees: issue.assignees.map((a: any) => a.login),
      }));

      return {
        answer,
        sources: [...issueSources, ...codeSources],
        metadata,
      };
    } catch (error) {
      logger.error({ error }, "Failed to query with issues");
      throw error;
    }
  }

  private async generateAnswerWithIssues(
    query: string,
    issues: any[],
    codeContext: string
  ): Promise<string> {
    // Build issue context
    const issueContext = issues
      .slice(0, 10) // Top 10 issues
      .map((issue, index) => {
        const assignees = issue.assignees.length > 0
          ? `Assigned to: ${issue.assignees.map((a: any) => a.login).join(", ")}`
          : "Unassigned";
        
        const labels = issue.labels.length > 0
          ? `Labels: ${issue.labels.map((l: any) => l.name).join(", ")}`
          : "";

        return `[Issue #${issue.number}] ${issue.state.toUpperCase()}
Title: ${issue.title}
${assignees}
${labels}
Created: ${new Date(issue.createdAt).toLocaleDateString()}
${issue.body ? `Description: ${issue.body.substring(0, 300)}...` : ""}
URL: ${issue.htmlUrl}`;
      })
      .join("\n\n---\n\n");

    const systemPrompt = `You are an expert GitHub repository assistant helping developers understand their projects.
You have access to both the codebase and GitHub issues.
Provide clear, accurate answers based on the information provided.
When discussing issues, mention issue numbers, assignees, and current status.
Format your responses clearly with proper markdown.`;

    let userPrompt = `Based on the following information from the repository, please answer this question:

Question: ${query}

GitHub Issues:
${issueContext}`;

    if (codeContext) {
      userPrompt += `\n\nCode Context:
${codeContext}`;
    }

    userPrompt += `\n\nPlease provide a detailed answer based on the information above.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      return (
        response.choices[0]?.message?.content || "Unable to generate answer."
      );
    } catch (error) {
      logger.error({ error }, "Failed to generate answer with issues");
      throw error;
    }
  }

  private estimateTokens(query: string, issues: any[], answer: string): number {
    const queryTokens = Math.ceil(query.length / 4);
    const issueTokens = Math.ceil(
      issues.reduce((sum, i) => sum + (i.title?.length || 0) + (i.body?.length || 0), 0) / 4
    );
    const answerTokens = Math.ceil(answer.length / 4);
    return queryTokens + issueTokens + answerTokens + 200;
  }
}

export const enhancedRAGService = new EnhancedRAGService();
export default enhancedRAGService;
