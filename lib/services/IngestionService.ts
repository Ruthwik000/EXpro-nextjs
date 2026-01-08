import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IngestionJob, CodeChunk, EmbeddingRecord } from '../types';
import { config } from '../config';
import logger from '../logger';
import {
    shouldIgnorePath,
    isBinaryFile,
    isCodeFile,
    sanitizePath,
    normalizeRepoId,
} from '../utils';
import { gitService } from './GitService';
import { chunkingService } from './ChunkingService';
import { embeddingService } from './EmbeddingService';
import { vectorStoreService } from './VectorStoreService';
import cacheService from './CacheService';

export class IngestionService {
    private maxFileSizeMB: number;
    private maxRepoSizeMB: number;

    constructor() {
        this.maxFileSizeMB = config.storage.maxFileSizeMB;
        this.maxRepoSizeMB = config.storage.maxRepoSizeMB;
    }

    async ingestRepository(repoUrl: string, branch: string = 'main'): Promise<IngestionJob> {
        const jobId = uuidv4();
        const repoId = normalizeRepoId(repoUrl);

        const job: IngestionJob = {
            id: jobId,
            repoId,
            repoUrl,
            branch,
            status: 'queued',
            progress: 0,
            startedAt: new Date(),
        };

        // Store job in cache
        await cacheService.setHash('ingestion:jobs', jobId, job);

        // Start ingestion asynchronously
        this.processIngestion(job).catch(error => {
            logger.error({ error, jobId }, 'Ingestion failed');
        });

        return job;
    }

    private async processIngestion(job: IngestionJob): Promise<void> {
        const startTime = Date.now();

        try {
            // Update status: cloning
            job.status = 'cloning';
            job.progress = 10;
            await this.updateJob(job);

            const repoPath = await gitService.cloneRepository(job.repoUrl, job.branch);

            // Check repository size
            const repoSize = await gitService.getRepositorySize(repoPath);
            const repoSizeMB = repoSize / (1024 * 1024);

            if (repoSizeMB > this.maxRepoSizeMB) {
                throw new Error(
                    `Repository size (${repoSizeMB.toFixed(2)}MB) exceeds maximum allowed size (${this.maxRepoSizeMB}MB)`
                );
            }

            // Update status: chunking
            job.status = 'chunking';
            job.progress = 30;
            await this.updateJob(job);

            const chunks = await this.chunkRepository(repoPath, job.repoId);

            if (chunks.length === 0) {
                throw new Error('No processable files found in repository');
            }

            logger.info({ repoId: job.repoId, chunkCount: chunks.length }, 'Repository chunked');

            // Update status: embedding
            job.status = 'embedding';
            job.progress = 50;
            await this.updateJob(job);

            const embeddings = await this.generateEmbeddings(chunks);

            logger.info({ repoId: job.repoId, embeddingCount: embeddings.length }, 'Embeddings generated');

            // Update status: indexing
            job.status = 'indexing';
            job.progress = 80;
            await this.updateJob(job);

            await vectorStoreService.upsert(embeddings);

            // Update status: completed
            job.status = 'completed';
            job.progress = 100;
            job.completedAt = new Date();
            job.stats = {
                filesProcessed: new Set(chunks.map(c => c.filePath)).size,
                chunksCreated: chunks.length,
                embeddingsGenerated: embeddings.length,
                tokensUsed: this.estimateTokens(chunks),
                durationMs: Date.now() - startTime,
            };

            await this.updateJob(job);

            // Cache repository metadata
            await cacheService.set(`repo:${job.repoId}`, {
                repoId: job.repoId,
                url: job.repoUrl,
                branch: job.branch,
                lastProcessedAt: new Date(),
                stats: job.stats,
            });

            logger.info({ jobId: job.id, repoId: job.repoId, stats: job.stats }, 'Ingestion completed');
        } catch (error) {
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : 'Unknown error';
            job.completedAt = new Date();
            await this.updateJob(job);

            logger.error({ error, jobId: job.id, repoId: job.repoId }, 'Ingestion failed');
        }
    }

    private async chunkRepository(repoPath: string, repoId: string): Promise<CodeChunk[]> {
        const allChunks: CodeChunk[] = [];
        const maxFileSizeMB = this.maxFileSizeMB;

        async function processDirectory(dirPath: string, relativePath: string = ''): Promise<void> {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const relPath = sanitizePath(path.join(relativePath, entry.name));

                // Skip ignored paths
                if (shouldIgnorePath(relPath)) {
                    continue;
                }

                if (entry.isDirectory()) {
                    await processDirectory(fullPath, relPath);
                } else if (entry.isFile()) {
                    try {
                        // Skip binary files
                        if (isBinaryFile(fullPath)) {
                            continue;
                        }

                        // Check file size
                        const stats = await fs.stat(fullPath);
                        const fileSizeMB = stats.size / (1024 * 1024);

                        if (fileSizeMB > maxFileSizeMB) {
                            logger.warn({ file: relPath, sizeMB: fileSizeMB }, 'Skipping large file');
                            continue;
                        }

                        // Only process code files
                        if (!isCodeFile(fullPath)) {
                            continue;
                        }

                        // Read and chunk file
                        const content = await fs.readFile(fullPath, 'utf-8');
                        const chunks = chunkingService.chunkFile(repoId, fullPath, content, relPath);
                        allChunks.push(...chunks);
                    } catch (error) {
                        logger.warn({ error, file: relPath }, 'Failed to process file');
                    }
                }
            }
        }

        await processDirectory(repoPath);
        return allChunks;
    }

    private async generateEmbeddings(chunks: CodeChunk[]): Promise<EmbeddingRecord[]> {
        const embeddings: EmbeddingRecord[] = [];

        // Process in batches to avoid memory issues
        const batchSize = 50;
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            const texts = batch.map(chunk => {
                // Create context-aware text for embedding
                const context = chunk.metadata.context ? `${chunk.metadata.context}\n\n` : '';
                return `${context}${chunk.content}`;
            });

            const embeddingVectors = await embeddingService.generateEmbeddingsWithRetry(texts);

            for (let j = 0; j < batch.length; j++) {
                embeddings.push({
                    id: batch[j].id,
                    chunkId: batch[j].id,
                    repoId: batch[j].repoId,
                    filePath: batch[j].filePath,
                    embedding: embeddingVectors[j],
                    metadata: {
                        ...batch[j].metadata,
                        content: batch[j].content,
                        startLine: batch[j].startLine,
                        endLine: batch[j].endLine,
                        chunkIndex: batch[j].chunkIndex,
                    },
                });
            }

            logger.info(
                { processed: embeddings.length, total: chunks.length },
                'Embedding progress'
            );
        }

        return embeddings;
    }

    private estimateTokens(chunks: CodeChunk[]): number {
        // Rough estimate: 1 token ≈ 4 characters
        const totalChars = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0);
        return Math.ceil(totalChars / 4);
    }

    private async updateJob(job: IngestionJob): Promise<void> {
        await cacheService.setHash('ingestion:jobs', job.id, job);
    }

    async getJob(jobId: string): Promise<IngestionJob | null> {
        return await cacheService.getHash<IngestionJob>('ingestion:jobs', jobId);
    }

    async deleteRepository(repoId: string): Promise<void> {
        try {
            // Delete from vector store
            await vectorStoreService.deleteByRepo(repoId);

            // Delete from disk
            await gitService.deleteRepository(repoId);

            // Delete from cache
            await cacheService.delete(`repo:${repoId}`);

            logger.info({ repoId }, 'Repository deleted');
        } catch (error) {
            logger.error({ error, repoId }, 'Failed to delete repository');
            throw error;
        }
    }
}

export const ingestionService = new IngestionService();
export default ingestionService;
