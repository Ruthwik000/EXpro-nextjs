import { CodeChunk, ChunkMetadata } from '../types';
import { config } from '../config';
import { getLanguageFromExtension, getFileExtension, isCodeFile } from '../utils';
import { v4 as uuidv4 } from 'uuid';

export class ChunkingService {
    private chunkSize: number;
    private chunkOverlap: number;
    private maxChunksPerFile: number;

    constructor() {
        this.chunkSize = config.chunking.chunkSize;
        this.chunkOverlap = config.chunking.chunkOverlap;
        this.maxChunksPerFile = config.chunking.maxChunksPerFile;
    }

    chunkFile(
        repoId: string,
        filePath: string,
        content: string,
        relativePath: string
    ): CodeChunk[] {
        const extension = getFileExtension(filePath);
        const language = getLanguageFromExtension(extension);
        const isCode = isCodeFile(filePath);

        const metadata: Omit<ChunkMetadata, 'context'> = {
            language,
            fileType: extension.slice(1) || 'unknown',
            extension,
            relativePath,
            size: content.length,
            isCode,
        };

        // For code files, try semantic chunking
        if (isCode) {
            return this.semanticChunk(repoId, filePath, content, metadata);
        }

        // For non-code files, use simple line-based chunking
        return this.simpleChunk(repoId, filePath, content, metadata);
    }

    private semanticChunk(
        repoId: string,
        filePath: string,
        content: string,
        metadata: Omit<ChunkMetadata, 'context'>
    ): CodeChunk[] {
        const chunks: CodeChunk[] = [];
        const lines = content.split('\n');

        // Try to identify logical blocks (functions, classes, etc.)
        const blocks = this.identifyCodeBlocks(lines, metadata.language || 'other');

        for (const block of blocks) {
            if (chunks.length >= this.maxChunksPerFile) break;

            const chunkContent = lines.slice(block.startLine, block.endLine + 1).join('\n');

            if (chunkContent.trim().length === 0) continue;

            chunks.push({
                id: uuidv4(),
                repoId,
                filePath,
                content: chunkContent,
                startLine: block.startLine,
                endLine: block.endLine,
                chunkIndex: chunks.length,
                metadata: {
                    ...metadata,
                    context: block.context,
                },
            });
        }

        // If no blocks found or chunks are too large, fall back to simple chunking
        if (chunks.length === 0 || chunks.some(c => c.content.length > this.chunkSize * 2)) {
            return this.simpleChunk(repoId, filePath, content, metadata);
        }

        return chunks;
    }

    private identifyCodeBlocks(
        lines: string[],
        _language: string
    ): Array<{ startLine: number; endLine: number; context: string }> {
        const blocks: Array<{ startLine: number; endLine: number; context: string }> = [];

        // Simple heuristic-based block detection
        let currentBlock: { startLine: number; context: string } | null = null;
        let braceDepth = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Detect function/class declarations
            const isFunctionOrClass =
                /^(function|class|def|func|fn|pub fn|async fn|interface|type|struct|impl)\s+\w+/.test(line) ||
                /^(export\s+)?(async\s+)?function\s+\w+/.test(line) ||
                /^(public|private|protected|static)\s+(class|interface|enum)/.test(line);

            if (isFunctionOrClass && !currentBlock) {
                const context = line.split(/[{(]/)[0].trim();
                currentBlock = { startLine: i, context };
                braceDepth = 0;
            }

            // Track braces for block boundaries
            braceDepth += (line.match(/{/g) || []).length;
            braceDepth -= (line.match(/}/g) || []).length;

            // End of block
            if (currentBlock && braceDepth === 0 && line.includes('}')) {
                blocks.push({
                    startLine: currentBlock.startLine,
                    endLine: i,
                    context: currentBlock.context,
                });
                currentBlock = null;
            }

            // Prevent blocks from getting too large
            if (currentBlock && i - currentBlock.startLine > 200) {
                blocks.push({
                    startLine: currentBlock.startLine,
                    endLine: i,
                    context: currentBlock.context,
                });
                currentBlock = null;
            }
        }

        // Close any remaining block
        if (currentBlock) {
            blocks.push({
                startLine: currentBlock.startLine,
                endLine: lines.length - 1,
                context: currentBlock.context,
            });
        }

        // If no blocks found, create one large block
        if (blocks.length === 0) {
            blocks.push({
                startLine: 0,
                endLine: lines.length - 1,
                context: 'file',
            });
        }

        return blocks;
    }

    private simpleChunk(
        repoId: string,
        filePath: string,
        content: string,
        metadata: Omit<ChunkMetadata, 'context'>
    ): CodeChunk[] {
        const chunks: CodeChunk[] = [];
        const lines = content.split('\n');

        let currentLine = 0;
        let chunkIndex = 0;

        while (currentLine < lines.length && chunkIndex < this.maxChunksPerFile) {
            const chunkLines: string[] = [];
            let chunkCharCount = 0;
            const startLine = currentLine;

            // Collect lines until we reach chunk size
            while (currentLine < lines.length && chunkCharCount < this.chunkSize) {
                chunkLines.push(lines[currentLine]);
                chunkCharCount += lines[currentLine].length + 1; // +1 for newline
                currentLine++;
            }

            const chunkContent = chunkLines.join('\n');

            if (chunkContent.trim().length > 0) {
                chunks.push({
                    id: uuidv4(),
                    repoId,
                    filePath,
                    content: chunkContent,
                    startLine,
                    endLine: currentLine - 1,
                    chunkIndex,
                    metadata: {
                        ...metadata,
                        context: `lines ${startLine + 1}-${currentLine}`,
                    },
                });
                chunkIndex++;
            }

            // Apply overlap by backing up
            if (currentLine < lines.length) {
                const overlapLines = Math.floor(this.chunkOverlap / 50); // Rough estimate
                currentLine = Math.max(startLine + 1, currentLine - overlapLines);
            }
        }

        return chunks;
    }
}

export const chunkingService = new ChunkingService();
export default chunkingService;
