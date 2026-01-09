import { z } from 'zod';

export const ingestRequestSchema = z.object({
    repoUrl: z.string().url().regex(/github\.com/, 'Must be a GitHub URL'),
    branch: z.string().default('main'),
    githubToken: z.string().optional(),  // Accept token from request body
});

export const queryRequestSchema = z.object({
    repoId: z.string().min(1, 'Repository ID is required'),
    query: z.string().min(1, 'Query is required'),
    scope: z
        .object({
            type: z.enum(['repo', 'folder', 'file']),
            path: z.string().optional(),
        })
        .optional(),
    topK: z.number().int().min(1).max(20).default(5),
    minScore: z.number().min(0).max(1).default(0.7),
    githubToken: z.string().optional(),  // Accept token from request body
});

export type IngestRequest = z.infer<typeof ingestRequestSchema>;
export type QueryRequest = z.infer<typeof queryRequestSchema>;
