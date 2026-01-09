import type { NextApiRequest, NextApiResponse } from 'next';
import { serverlessIngestionService } from '@/lib/services/ServerlessIngestionService';
import { ingestRequestSchema } from '@/lib/validation';
import logger from '@/lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedData = ingestRequestSchema.parse(req.body);

    logger.info(
      { repoUrl: validatedData.repoUrl, branch: validatedData.branch },
      'Ingestion requested'
    );

    const job = await serverlessIngestionService.ingestRepository(
      validatedData.repoUrl,
      validatedData.branch
    );

    res.status(202).json({
      jobId: job.id,
      status: job.status,
      repoId: job.repoId,
      message: 'Ingestion started',
    });
  } catch (error: any) {
    logger.error({ error }, 'Ingestion request failed');
    
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
