import logger from "../logger";
import { chunkArray } from "../utils";

class EmbeddingService {
  private pipeline: any = null;
  private modelLoaded: boolean = false;

  constructor() {
    logger.info("Using local embeddings (Xenova/transformers.js)");
    logger.info("No external API calls - embeddings run on your machine");
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Lazy load the pipeline on first use
      if (!this.pipeline) {
        await this.loadModel();
      }

      // Truncate text if too long
      const maxLength = 500;
      const truncatedText =
        text.length > maxLength ? text.substring(0, maxLength) : text;

      // Generate embedding locally
      const output = await this.pipeline(truncatedText, {
        pooling: "mean",
        normalize: true,
      });

      // Convert to regular array
      const embedding = Array.from(output.data) as number[];

      // Normalize to 1024 dimensions for Pinecone compatibility
      return this.normalizeEmbedding(embedding, 1024);
    } catch (error) {
      logger.error({ error }, "Failed to generate embedding");
      throw error;
    }
  }

  private async loadModel(): Promise<void> {
    if (this.modelLoaded) return;

    try {
      logger.info("Loading local embedding model (first time only, ~50MB)...");
      const { pipeline } = await import("@xenova/transformers");
      this.pipeline = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
      );
      this.modelLoaded = true;
      logger.info("✓ Local embedding model loaded successfully");
    } catch (error) {
      logger.error({ error }, "Failed to load local embedding model");
      throw error;
    }
  }

  private normalizeEmbedding(
    embedding: number[],
    targetSize: number,
  ): number[] {
    const currentSize = embedding.length;

    if (currentSize === targetSize) {
      return embedding;
    }

    if (currentSize < targetSize) {
      // Pad with zeros
      return [...embedding, ...new Array(targetSize - currentSize).fill(0)];
    } else {
      // Truncate
      return embedding.slice(0, targetSize);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      // Load model if not already loaded
      if (!this.pipeline) {
        await this.loadModel();
      }

      // Process in small batches to show progress
      const batchSize = 5;
      const batches = chunkArray(texts, batchSize);
      const allEmbeddings: number[][] = [];

      logger.info(
        { totalTexts: texts.length, mode: "Local" },
        "Starting embedding generation",
      );

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        const embeddings = await Promise.all(
          batch.map((text) => this.generateEmbedding(text)),
        );
        allEmbeddings.push(...embeddings);

        // Log progress every 10 batches
        if ((i + 1) % 10 === 0 || i === batches.length - 1) {
          logger.info(
            {
              progress: `${i + 1}/${batches.length}`,
              percentage: Math.round(((i + 1) / batches.length) * 100),
              processed: allEmbeddings.length,
            },
            "Embedding generation progress",
          );
        }
      }

      logger.info(
        {
          count: texts.length,
          mode: "Local",
          model: "Xenova/all-MiniLM-L6-v2",
        },
        "Generated embeddings successfully",
      );
      return allEmbeddings;
    } catch (error) {
      logger.error(
        { error, count: texts.length },
        "Failed to generate embeddings",
      );
      throw error;
    }
  }

  async generateEmbeddingsWithRetry(
    texts: string[],
    maxRetries: number = 3,
  ): Promise<number[][]> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.generateEmbeddings(texts);
      } catch (error: any) {
        lastError = error as Error;

        const isLastAttempt = attempt === maxRetries - 1;

        logger.warn(
          {
            error: error.message,
            attempt: attempt + 1,
            maxRetries,
            willRetry: !isLastAttempt,
          },
          "Embedding generation failed",
        );

        if (!isLastAttempt) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          logger.info({ delayMs: Math.round(delay) }, "Waiting before retry");
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Failed to generate embeddings after retries");
  }
}

export const embeddingService = new EmbeddingService();
export default embeddingService;
