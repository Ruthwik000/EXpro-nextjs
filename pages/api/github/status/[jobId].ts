import type { NextApiRequest, NextApiResponse } from 'next';
import { ingestionService } from '@/lib/services/IngestionService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobId } = req.query;

    if (typeof jobId !== 'string') {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const job = await ingestionService.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.status(200).json({
      jobId: job.id,
      repoId: job.repoId,
      status: job.status,
      progress: job.progress,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error,
      stats: job.stats,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
