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
    const [vectorStats, cacheStats] = await Promise.all([
      vectorStoreService.getStats(),
      Promise.resolve(cacheService.getStats()),
    ]);

    res.status(200).json({
      vectorStore: vectorStats,
      cache: cacheStats,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
