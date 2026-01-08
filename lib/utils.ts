import { SupportedLanguage } from './types';

const extensionMap: Record<string, SupportedLanguage> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.cxx': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.cs': 'csharp',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.kts': 'kotlin',
    '.scala': 'scala',
    '.md': 'markdown',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.xml': 'xml',
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'css',
    '.sass': 'css',
    '.sql': 'sql',
};

const binaryExtensions = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
    '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
    '.exe', '.dll', '.so', '.dylib',
    '.mp3', '.mp4', '.avi', '.mov', '.wav',
    '.ttf', '.woff', '.woff2', '.eot',
    '.class', '.jar', '.war',
    '.pyc', '.pyo',
]);

const ignoredPaths = new Set([
    'node_modules',
    '.git',
    '.svn',
    '.hg',
    'dist',
    'build',
    'out',
    'target',
    'bin',
    'obj',
    '.next',
    '.nuxt',
    'coverage',
    '.cache',
    '.vscode',
    '.idea',
    '__pycache__',
    'vendor',
    'deps',
    '_build',
]);

export function getLanguageFromExtension(extension: string): SupportedLanguage {
    return extensionMap[extension.toLowerCase()] || 'other';
}

export function isBinaryFile(filePath: string): boolean {
    const ext = getFileExtension(filePath);
    return binaryExtensions.has(ext.toLowerCase());
}

export function shouldIgnorePath(path: string): boolean {
    const parts = path.split(/[/\\]/);
    return parts.some(part => ignoredPaths.has(part));
}

export function getFileExtension(filePath: string): string {
    const match = filePath.match(/\.[^.]+$/);
    return match ? match[0] : '';
}

export function isCodeFile(filePath: string): boolean {
    const ext = getFileExtension(filePath);
    return extensionMap.hasOwnProperty(ext.toLowerCase()) && !isBinaryFile(filePath);
}

export function normalizeRepoId(url: string): string {
    const match = url.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (!match) {
        throw new Error(`Invalid GitHub URL: ${url}`);
    }
    return `${match[1]}/${match[2]}`;
}

export function sanitizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/^\/+/, '');
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
