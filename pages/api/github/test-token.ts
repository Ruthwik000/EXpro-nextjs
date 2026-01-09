import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import logger from '@/lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Test token by fetching user info
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    // Get rate limit info
    const rateLimitResponse = await axios.get('https://api.github.com/rate_limit', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    res.status(200).json({
      valid: true,
      user: response.data.login,
      name: response.data.name,
      rateLimit: {
        limit: rateLimitResponse.data.rate.limit,
        remaining: rateLimitResponse.data.rate.remaining,
        reset: new Date(rateLimitResponse.data.rate.reset * 1000).toISOString(),
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Token validation failed');

    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired',
      });
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
