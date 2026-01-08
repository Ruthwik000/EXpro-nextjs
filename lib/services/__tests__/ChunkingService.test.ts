import { chunkingService } from '../ChunkingService';

describe('ChunkingService', () => {
    describe('chunkFile', () => {
        it('should chunk a simple text file', () => {
            const content = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
            const chunks = chunkingService.chunkFile(
                'test/repo',
                '/path/to/file.txt',
                content,
                'file.txt'
            );

            expect(chunks.length).toBeGreaterThan(0);
            expect(chunks[0].repoId).toBe('test/repo');
            expect(chunks[0].filePath).toBe('/path/to/file.txt');
            expect(chunks[0].metadata.relativePath).toBe('file.txt');
        });

        it('should chunk a TypeScript file with functions', () => {
            const content = `
function hello() {
  console.log('Hello');
}

function world() {
  console.log('World');
}
      `.trim();

            const chunks = chunkingService.chunkFile(
                'test/repo',
                '/path/to/file.ts',
                content,
                'file.ts'
            );

            expect(chunks.length).toBeGreaterThan(0);
            expect(chunks[0].metadata.language).toBe('typescript');
            expect(chunks[0].metadata.isCode).toBe(true);
        });

        it('should handle empty files', () => {
            const chunks = chunkingService.chunkFile(
                'test/repo',
                '/path/to/empty.txt',
                '',
                'empty.txt'
            );

            expect(chunks.length).toBe(0);
        });

        it('should include chunk metadata', () => {
            const content = 'Test content';
            const chunks = chunkingService.chunkFile(
                'test/repo',
                '/path/to/file.js',
                content,
                'file.js'
            );

            expect(chunks[0].metadata).toHaveProperty('language');
            expect(chunks[0].metadata).toHaveProperty('fileType');
            expect(chunks[0].metadata).toHaveProperty('extension');
            expect(chunks[0].metadata).toHaveProperty('isCode');
        });
    });
});
