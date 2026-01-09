import type { NextApiRequest, NextApiResponse } from 'next';
import { enhancedRAGService } from '@/lib/services/EnhancedRAGService';
import { queryRequestSchema } from '@/lib/validation';
import logger from '@/lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedData = queryRequestSchema.parse(req.body);
    
    // Get token from body (preferred) or header (fallback)
    const userToken = validatedData.githubToken || req.headers['x-github-token'] as string | undefined;

    logger.info(
      {
        repoId: validatedData.repoId,
        query: validatedData.query,
        scope: validatedData.scope,
        hasUserToken: !!userToken,
      },
      'Query requested'
    );

    // TODO: Pass userToken to enhancedRAGService if needed for issues API
    const result = await enhancedRAGService.query(validatedData);

    res.status(200).json(result);
  } catch (error: any) {
    logger.error({ error }, 'Query request failed');

    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
