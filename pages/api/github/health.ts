import type { NextApiRequest, NextApiResponse } from 'next';
import { vectorStoreService } from '@/lib/services/VectorStoreService';
import { cacheService } from '@/lib/services/CacheService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        vectorStore: vectorStoreService.isHealthy(),
        cache: cacheService.isHealthy(),
      },
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
