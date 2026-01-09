import type { NextApiRequest, NextApiResponse } from 'next';
import { githubAPIService } from '@/lib/services/GitHubAPIService';
import logger from '@/lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { repoUrl, state, labels, assignee, issueNumber, search } = req.query;

    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ error: 'repoUrl is required' });
    }

    // Get specific issue
    if (issueNumber) {
      const issue = await githubAPIService.getIssue(
        repoUrl,
        parseInt(issueNumber as string)
      );
      
      // Also get comments
      const comments = await githubAPIService.getIssueComments(
        repoUrl,
        parseInt(issueNumber as string)
      );
      
      return res.status(200).json({
        issue,
        comments,
      });
    }

    // Search issues
    if (search && typeof search === 'string') {
      const results = await githubAPIService.searchIssues(repoUrl, search, {
        state: state as "open" | "closed" | undefined,
        labels: labels ? (labels as string).split(',') : undefined,
        assignee: assignee as string | undefined,
      });
      
      return res.status(200).json(results);
    }

    // List issues
    const issues = await githubAPIService.getIssues(repoUrl, {
      state: (state as "open" | "closed" | "all") || "open",
      labels: labels ? (labels as string).split(',') : undefined,
      assignee: assignee as string | undefined,
    });

    res.status(200).json({
      issues,
      count: issues.length,
    });
  } catch (error: any) {
    logger.error({ error }, 'Failed to fetch issues');
    
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
