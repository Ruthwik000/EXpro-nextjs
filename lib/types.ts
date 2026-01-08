export interface Repository {
    id: string;
    url: string;
    branch: string;
    owner: string;
    name: string;
    clonedAt?: Date;
    lastProcessedAt?: Date;
    status: 'pending' | 'cloning' | 'processing' | 'completed' | 'failed';
    error?: string;
    stats?: RepositoryStats;
}

export interface RepositoryStats {
    totalFiles: number;
    processedFiles: number;
    totalChunks: number;
    totalSize: number;
    fileTypes: Record<string, number>;
}

export interface FileMetadata {
    repoId: string;
    filePath: string;
    relativePath: string;
    extension: string;
    size: number;
    language?: string;
    lastModified?: Date;
}

export interface CodeChunk {
    id: string;
    repoId: string;
    filePath: string;
    content: string;
    startLine: number;
    endLine: number;
    chunkIndex: number;
    metadata: ChunkMetadata;
}

export interface ChunkMetadata {
    language?: string;
    fileType: string;
    extension: string;
    relativePath: string;
    size: number;
    isCode: boolean;
    context?: string;
}

export interface EmbeddingRecord {
    id: string;
    chunkId: string;
    repoId: string;
    filePath: string;
    embedding: number[];
    metadata: EmbeddingMetadata;
}

export interface EmbeddingMetadata extends ChunkMetadata {
    content: string;
    startLine: number;
    endLine: number;
    chunkIndex: number;
}

export interface IngestionJob {
    id: string;
    repoId: string;
    repoUrl: string;
    branch: string;
    status: 'queued' | 'cloning' | 'chunking' | 'embedding' | 'indexing' | 'completed' | 'failed';
    progress: number;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
    stats?: IngestionStats;
}

export interface IngestionStats {
    filesProcessed: number;
    chunksCreated: number;
    embeddingsGenerated: number;
    tokensUsed: number;
    durationMs: number;
}

export interface QueryRequest {
    repoId: string;
    query: string;
    scope?: QueryScope;
    topK?: number;
    minScore?: number;
}

export interface QueryScope {
    type: 'repo' | 'folder' | 'file';
    path?: string;
}

export interface QueryResponse {
    answer: string;
    sources: SourceReference[];
    metadata: QueryMetadata;
}

export interface SourceReference {
    file: string;
    chunk: string;
    score: number;
    startLine: number;
    endLine: number;
    language?: string;
}

export interface QueryMetadata {
    tokensUsed: number;
    latencyMs: number;
    model: string;
    retrievedChunks: number;
}

export interface SearchResult {
    id: string;
    score: number;
    content: string;
    metadata: EmbeddingMetadata;
}

export type SupportedLanguage =
    | 'typescript'
    | 'javascript'
    | 'python'
    | 'java'
    | 'go'
    | 'rust'
    | 'cpp'
    | 'c'
    | 'csharp'
    | 'ruby'
    | 'php'
    | 'swift'
    | 'kotlin'
    | 'scala'
    | 'markdown'
    | 'json'
    | 'yaml'
    | 'xml'
    | 'html'
    | 'css'
    | 'sql'
    | 'other';

export interface CacheEntry<T> {
    key: string;
    value: T;
    expiresAt?: Date;
}
