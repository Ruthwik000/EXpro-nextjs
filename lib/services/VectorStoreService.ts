import { Pinecone } from "@pinecone-database/pinecone";
import { config } from "../config";
import logger from "../logger";
import { EmbeddingRecord, SearchResult } from "../types";

class VectorStoreService {
  private client: Pinecone;
  private indexName: string;
  private initialized: boolean = false;

  constructor() {
    this.client = new Pinecone({
      apiKey: config.pinecone.apiKey,
    });
    this.indexName = config.pinecone.indexName;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if index exists
      const indexes = await this.client.listIndexes();
      const indexExists = indexes.indexes?.some(
        (idx) => idx.name === this.indexName,
      );

      if (!indexExists) {
        logger.info({ indexName: this.indexName }, "Creating Pinecone index");
        await this.client.createIndex({
          name: this.indexName,
          dimension: 1024, // Local embedding dimension
          metric: "cosine",
          spec: {
            serverless: {
              cloud: "aws",
              region: "us-east-1",
            },
          },
        });

        // Wait for index to be ready
        await this.waitForIndexReady();
      }

      this.initialized = true;
      logger.info({ indexName: this.indexName }, "Pinecone initialized");
    } catch (error) {
      logger.error({ error }, "Failed to initialize Pinecone");
      throw error;
    }
  }

  private async waitForIndexReady(): Promise<void> {
    const maxAttempts = 30;
    const delayMs = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const index = this.client.index(this.indexName);
        const stats = await index.describeIndexStats();
        if (stats) {
          logger.info("Pinecone index is ready");
          return;
        }
      } catch (error) {
        // Index not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error("Pinecone index creation timeout");
  }

  async upsert(records: EmbeddingRecord[]): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const index = this.client.index(this.indexName);

      // Convert to Pinecone format with metadata truncation
      const vectors = records.map((record) => {
        // Truncate content to avoid Pinecone 40KB metadata limit
        const maxContentLength = 10000; // ~10KB for content
        const maxContextLength = 5000;  // ~5KB for context
        
        const truncatedContent = record.metadata.content.length > maxContentLength
          ? record.metadata.content.substring(0, maxContentLength) + '...[truncated]'
          : record.metadata.content;
        
        const truncatedContext = (record.metadata.context || '').length > maxContextLength
          ? (record.metadata.context || '').substring(0, maxContextLength) + '...[truncated]'
          : record.metadata.context || '';

        return {
          id: record.id,
          values: record.embedding,
          metadata: {
            repoId: record.repoId,
            filePath: record.filePath,
            content: truncatedContent,
            language: record.metadata.language || "",
            fileType: record.metadata.fileType,
            extension: record.metadata.extension,
            relativePath: record.metadata.relativePath,
            startLine: record.metadata.startLine,
            endLine: record.metadata.endLine,
            chunkIndex: record.metadata.chunkIndex,
            isCode: record.metadata.isCode,
            context: truncatedContext,
          },
        };
      });

      logger.info({ totalVectors: vectors.length }, "Starting Pinecone upsert");

      // Batch upsert in chunks of 100 with retry logic
      const batchSize = 100;
      let successCount = 0;

      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(vectors.length / batchSize);

        await this.upsertBatchWithRetry(index, batch, batchNum, totalBatches);
        successCount += batch.length;

        logger.info(
          {
            progress: `${successCount}/${vectors.length}`,
            percentage: Math.round((successCount / vectors.length) * 100),
          },
          "Upsert progress",
        );
      }

      logger.info({ count: records.length }, "Upserted vectors to Pinecone");
    } catch (error: any) {
      logger.error(
        { error, errorName: error?.name, errorMessage: error?.message },
        "Failed to upsert vectors",
      );
      throw error;
    }
  }

  private async upsertBatchWithRetry(
    index: any,
    batch: any[],
    batchNum: number,
    totalBatches: number,
    maxRetries: number = 3,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await index.upsert(batch);
        return; // Success
      } catch (error: any) {
        lastError = error;
        const isLastAttempt = attempt === maxRetries - 1;

        logger.warn(
          {
            error: error.message,
            errorName: error.name,
            batchNum,
            totalBatches,
            attempt: attempt + 1,
            maxRetries,
            willRetry: !isLastAttempt,
          },
          "Pinecone upsert batch failed",
        );

        if (!isLastAttempt) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = 2000 * Math.pow(2, attempt);
          logger.info({ delayMs: delay }, "Waiting before retry");
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw new Error(
      `Failed to upsert batch ${batchNum}/${totalBatches} after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`,
    );
  }

  async search(
    embedding: number[],
    repoId: string,
    topK: number = 5,
    filter?: Record<string, any>,
  ): Promise<SearchResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const index = this.client.index(this.indexName);

      const queryFilter: Record<string, any> = {
        repoId: { $eq: repoId },
        ...filter,
      };

      logger.info(
        {
          repoId,
          topK,
          filter: queryFilter,
          embeddingDim: embedding.length,
        },
        "Searching Pinecone with filter",
      );

      const results = await index.query({
        vector: embedding,
        topK,
        filter: queryFilter,
        includeMetadata: true,
      });

      logger.info(
        {
          repoId,
          matchesFound: results.matches?.length || 0,
          topScores: results.matches?.slice(0, 3).map((m) => m.score) || [],
        },
        "Pinecone search completed",
      );

      // If no results with filter, try without filter to debug
      if (!results.matches || results.matches.length === 0) {
        logger.warn(
          { repoId, filter: queryFilter },
          "No results with filter, trying without filter to debug",
        );

        const debugResults = await index.query({
          vector: embedding,
          topK: 3,
          includeMetadata: true,
        });

        logger.info(
          {
            totalVectorsFound: debugResults.matches?.length || 0,
            sampleRepoIds: debugResults.matches
              ?.slice(0, 3)
              .map((m) => m.metadata?.repoId) || [],
          },
          "Debug: Vectors in index (without filter)",
        );
      }

      return (
        results.matches?.map((match) => ({
          id: match.id,
          score: match.score || 0,
          content: (match.metadata?.content as string) || "",
          metadata: {
            content: (match.metadata?.content as string) || "",
            language: match.metadata?.language as string,
            fileType: (match.metadata?.fileType as string) || "",
            extension: (match.metadata?.extension as string) || "",
            relativePath: (match.metadata?.relativePath as string) || "",
            size: 0,
            isCode: (match.metadata?.isCode as boolean) || false,
            context: match.metadata?.context as string,
            startLine: (match.metadata?.startLine as number) || 0,
            endLine: (match.metadata?.endLine as number) || 0,
            chunkIndex: (match.metadata?.chunkIndex as number) || 0,
          },
        })) || []
      );
    } catch (error) {
      logger.error({ error }, "Failed to search vectors");
      throw error;
    }
  }

  async deleteByRepo(repoId: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const index = this.client.index(this.indexName);
      await index.deleteMany({
        repoId: { $eq: repoId },
      });
      logger.info({ repoId }, "Deleted vectors for repo");
    } catch (error) {
      logger.error({ error, repoId }, "Failed to delete vectors");
      throw error;
    }
  }

  async deleteByFile(repoId: string, filePath: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const index = this.client.index(this.indexName);
      await index.deleteMany({
        repoId: { $eq: repoId },
        filePath: { $eq: filePath },
      });
      logger.info({ repoId, filePath }, "Deleted vectors for file");
    } catch (error) {
      logger.error({ error, repoId, filePath }, "Failed to delete vectors");
      throw error;
    }
  }

  async getStats(): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const index = this.client.index(this.indexName);
      return await index.describeIndexStats();
    } catch (error) {
      logger.error({ error }, "Failed to get index stats");
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.initialized;
  }
}

export const vectorStoreService = new VectorStoreService();
export default vectorStoreService;
