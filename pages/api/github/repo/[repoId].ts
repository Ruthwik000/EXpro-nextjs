import type { NextApiRequest, NextApiResponse } from 'next';
import { serverlessIngestionService } from '@/lib/services/ServerlessIngestionService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { repoId } = req.query;

    if (typeof repoId !== 'string') {
      return res.status(400).json({ error: 'Invalid repository ID' });
    }

    // Decode the repoId (it comes URL-encoded)
    const decodedRepoId = decodeURIComponent(repoId);

    await serverlessIngestionService.deleteRepository(decodedRepoId);

    res.status(200).json({
      message: 'Repository deleted successfully',
      repoId: decodedRepoId,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
