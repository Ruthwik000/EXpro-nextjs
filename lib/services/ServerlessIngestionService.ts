import { v4 as uuidv4 } from 'uuid';
import { IngestionJob, CodeChunk, EmbeddingRecord } from '../types';
import { config } from '../config';
import logger from '../logger';
import {
    shouldIgnorePath,
    isBinaryFile,
    isCodeFile,
    normalizeRepoId,
} from '../utils';
import { GitHubAPIService } from './GitHubAPIService';
import { chunkingService } from './ChunkingService';
import { embeddingService } from './EmbeddingService';
import { vectorStoreService } from './VectorStoreService';
import cacheService from './CacheService';

/**
 * Serverless-friendly ingestion service that uses GitHub API
 * instead of cloning repositories to disk
 */
export class ServerlessIngestionService {
    private maxFileSizeMB: number;
    private maxRepoSizeMB: number;
    private githubAPI: GitHubAPIService;

    constructor(userToken?: string) {
        this.maxFileSizeMB = config.storage.maxFileSizeMB;
        this.maxRepoSizeMB = config.storage.maxRepoSizeMB;
        this.githubAPI = new GitHubAPIService(userToken);
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
            // Update status: fetching
            job.status = 'cloning'; // Keep same status for compatibility
            job.progress = 10;
            await this.updateJob(job);

            logger.info({ repoId: job.repoId, repoUrl: job.repoUrl }, 'Starting to fetch repository info');

            // Get repository info
            const repoInfo = await this.githubAPI.getRepositoryInfo(job.repoUrl);
            const actualBranch = job.branch || repoInfo.defaultBranch;

            logger.info({ repoId: job.repoId, branch: actualBranch, defaultBranch: repoInfo.defaultBranch }, 'Repository info fetched, fetching tree...');

            // Get repository tree
            const tree = await this.githubAPI.getRepositoryTree(job.repoUrl, actualBranch);
            
            logger.info({ repoId: job.repoId, totalFiles: tree.length }, 'Repository tree fetched');

            // Filter files with detailed logging
            const allFiles = tree.filter(f => f.type === 'file');
            const nonIgnored = allFiles.filter(f => !shouldIgnorePath(f.path));
            const nonBinary = nonIgnored.filter(f => !isBinaryFile(f.path));
            const codeFiles = nonBinary.filter(f => isCodeFile(f.path));
            
            logger.info({
                repoId: job.repoId,
                totalFiles: tree.length,
                filesOnly: allFiles.length,
                afterIgnoreFilter: nonIgnored.length,
                afterBinaryFilter: nonBinary.length,
                finalCodeFiles: codeFiles.length,
                samplePaths: codeFiles.slice(0, 5).map(f => f.path)
            }, 'File filtering results');

            // Final size check
            const processableFiles = codeFiles.filter(file => {
                const fileSizeMB = file.size / (1024 * 1024);
                if (fileSizeMB > this.maxFileSizeMB) {
                    logger.warn({ file: file.path, sizeMB: fileSizeMB }, 'Skipping large file');
                    return false;
                }
                return true;
            });

            if (processableFiles.length === 0) {
                logger.error({
                    repoId: job.repoId,
                    totalFiles: tree.length,
                    filesOnly: allFiles.length,
                    afterFilters: codeFiles.length,
                    sampleAllFiles: allFiles.slice(0, 10).map(f => ({ path: f.path, size: f.size }))
                }, 'No processable files found - detailed breakdown');
                throw new Error('No processable files found in repository');
            }

            logger.info({ repoId: job.repoId, fileCount: processableFiles.length }, 'Files to process');

            // Update status: chunking
            job.status = 'chunking';
            job.progress = 30;
            await this.updateJob(job);

            // Fetch and chunk files in batches
            const chunks = await this.chunkFiles(processableFiles, job.repoId, job.repoUrl, actualBranch);

            if (chunks.length === 0) {
                throw new Error('No chunks created from repository files');
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
                filesProcessed: processableFiles.length,
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
                branch: actualBranch,
                lastProcessedAt: new Date(),
                stats: job.stats,
            });

            logger.info({ jobId: job.id, repoId: job.repoId, stats: job.stats }, 'Ingestion completed');
        } catch (error) {
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : 'Unknown error';
            job.completedAt = new Date();
            await this.updateJob(job);

            logger.error({ 
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                jobId: job.id, 
                repoId: job.repoId,
                repoUrl: job.repoUrl,
                branch: job.branch
            }, 'Ingestion failed with detailed error');
        }
    }

    private async chunkFiles(
        files: any[],
        repoId: string,
        repoUrl: string,
        branch: string
    ): Promise<CodeChunk[]> {
        const allChunks: CodeChunk[] = [];
        const batchSize = 10; // Process 10 files at a time

        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const filePaths = batch.map(f => f.path);

            try {
                // Fetch multiple files in parallel
                const fileContents = await this.githubAPI.getMultipleFiles(
                    repoUrl,
                    filePaths,
                    branch
                );

                // Chunk each file
                for (const [filePath, content] of fileContents.entries()) {
                    try {
                        const chunks = chunkingService.chunkFile(
                            repoId,
                            filePath,
                            content,
                            filePath
                        );
                        allChunks.push(...chunks);
                    } catch (error) {
                        logger.warn({ error, file: filePath }, 'Failed to chunk file');
                    }
                }

                logger.info(
                    { processed: i + batch.length, total: files.length },
                    'File processing progress'
                );
            } catch (error) {
                logger.warn({ error, batch: filePaths }, 'Failed to fetch file batch');
            }
        }

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

            // Delete from cache
            await cacheService.delete(`repo:${repoId}`);

            logger.info({ repoId }, 'Repository deleted');
        } catch (error) {
            logger.error({ error, repoId }, 'Failed to delete repository');
            throw error;
        }
    }
}

export const serverlessIngestionService = new ServerlessIngestionService();
export default serverlessIngestionService;
