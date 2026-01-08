import type { NextApiRequest, NextApiResponse } from 'next';
import { ragService } from '@/lib/services/RAGService';
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

    logger.info(
      {
        repoId: validatedData.repoId,
        query: validatedData.query,
        scope: validatedData.scope,
      },
      'Query requested'
    );

    const result = await ragService.query(validatedData);

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
