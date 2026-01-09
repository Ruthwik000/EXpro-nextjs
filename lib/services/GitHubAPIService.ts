import axios from "axios";
import logger from "../logger";
import { config } from "../config";
import { normalizeRepoId } from "../utils";

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: "file" | "dir";
  content?: string;
  encoding?: string;
}

/**
 * GitHub API Service - Fetches repository content without cloning
 * This is serverless-friendly and works on Vercel
 */
export class GitHubAPIService {
  private token?: string;
  private baseUrl = "https://api.github.com";

  constructor(token?: string) {
    this.token = token || config.github.token;
    
    if (this.token) {
      logger.info({ hasToken: true, tokenPrefix: this.token.substring(0, 7) }, "GitHubAPIService initialized with token");
    } else {
      logger.warn("GitHubAPIService initialized WITHOUT token - rate limited to 60 req/hr");
    }
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  /**
   * Parse GitHub URL to extract owner and repo
   */
  private parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error("Invalid GitHub repository URL");
    }
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ""),
    };
  }

  /**
   * Fetch repository tree (list of all files)
   */
  async getRepositoryTree(
    repoUrl: string,
    branch: string = "main"
  ): Promise<GitHubFile[]> {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers: this.getHeaders() }
      );
      
      return response.data.tree;
    } catch (error: any) {
      if (error.response?.status === 404 && branch === "main") {
        // Try master branch
        logger.info({ repoUrl }, "Branch 'main' not found, trying 'master'");
        return this.getRepositoryTree(repoUrl, "master");
      }
      throw error;
    }
  }

  /**
   * Fetch file content from GitHub
   */
  async getFileContent(
    repoUrl: string,
    filePath: string,
    branch: string = "main"
  ): Promise<string> {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
        { headers: this.getHeaders() }
      );
      
      if (response.data.content) {
        // Content is base64 encoded
        return Buffer.from(response.data.content, "base64").toString("utf-8");
      }
      
      throw new Error("No content in response");
    } catch (error: any) {
      if (error.response?.status === 404 && branch === "main") {
        logger.info({ repoUrl, filePath }, "Branch 'main' not found, trying 'master'");
        return this.getFileContent(repoUrl, filePath, "master");
      }
      throw error;
    }
  }

  /**
   * Fetch multiple files in parallel
   */
  async getMultipleFiles(
    repoUrl: string,
    filePaths: string[],
    branch: string = "main"
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    const promises = filePaths.map(async (filePath) => {
      try {
        const content = await this.getFileContent(repoUrl, filePath, branch);
        results.set(filePath, content);
      } catch (error) {
        logger.warn({ filePath, error }, "Failed to fetch file");
      }
    });
    
    await Promise.all(promises);
    return results;
  }

  /**
   * Get repository info
   */
  async getRepositoryInfo(repoUrl: string) {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    const response = await axios.get(
      `${this.baseUrl}/repos/${owner}/${repo}`,
      { headers: this.getHeaders() }
    );
    
    return {
      name: response.data.name,
      fullName: response.data.full_name,
      description: response.data.description,
      defaultBranch: response.data.default_branch,
      size: response.data.size,
      language: response.data.language,
      stars: response.data.stargazers_count,
    };
  }

  /**
   * Get repository issues
   */
  async getIssues(
    repoUrl: string,
    options: {
      state?: "open" | "closed" | "all";
      labels?: string[];
      assignee?: string;
      since?: string;
      per_page?: number;
      page?: number;
    } = {}
  ) {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    const params = new URLSearchParams();
    if (options.state) params.append("state", options.state);
    if (options.labels) params.append("labels", options.labels.join(","));
    if (options.assignee) params.append("assignee", options.assignee);
    if (options.since) params.append("since", options.since);
    params.append("per_page", String(options.per_page || 30));
    params.append("page", String(options.page || 1));
    
    const response = await axios.get(
      `${this.baseUrl}/repos/${owner}/${repo}/issues?${params}`,
      { headers: this.getHeaders() }
    );
    
    return response.data.map((issue: any) => ({
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      user: {
        login: issue.user.login,
        avatar: issue.user.avatar_url,
      },
      assignees: issue.assignees.map((a: any) => ({
        login: a.login,
        avatar: a.avatar_url,
      })),
      labels: issue.labels.map((l: any) => ({
        name: l.name,
        color: l.color,
      })),
      comments: issue.comments,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at,
      htmlUrl: issue.html_url,
    }));
  }

  /**
   * Get a specific issue
   */
  async getIssue(repoUrl: string, issueNumber: number) {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    const response = await axios.get(
      `${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`,
      { headers: this.getHeaders() }
    );
    
    const issue = response.data;
    return {
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      user: {
        login: issue.user.login,
        avatar: issue.user.avatar_url,
      },
      assignees: issue.assignees.map((a: any) => ({
        login: a.login,
        avatar: a.avatar_url,
      })),
      labels: issue.labels.map((l: any) => ({
        name: l.name,
        color: l.color,
      })),
      comments: issue.comments,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at,
      htmlUrl: issue.html_url,
    };
  }

  /**
   * Get issue comments
   */
  async getIssueComments(repoUrl: string, issueNumber: number) {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    const response = await axios.get(
      `${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      { headers: this.getHeaders() }
    );
    
    return response.data.map((comment: any) => ({
      id: comment.id,
      body: comment.body,
      user: {
        login: comment.user.login,
        avatar: comment.user.avatar_url,
      },
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      htmlUrl: comment.html_url,
    }));
  }

  /**
   * Search issues across repository
   */
  async searchIssues(
    repoUrl: string,
    query: string,
    options: {
      state?: "open" | "closed";
      labels?: string[];
      assignee?: string;
    } = {}
  ) {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    let searchQuery = `repo:${owner}/${repo} ${query}`;
    if (options.state) searchQuery += ` state:${options.state}`;
    if (options.labels) searchQuery += ` label:${options.labels.join(",")}`;
    if (options.assignee) searchQuery += ` assignee:${options.assignee}`;
    
    const response = await axios.get(
      `${this.baseUrl}/search/issues?q=${encodeURIComponent(searchQuery)}`,
      { headers: this.getHeaders() }
    );
    
    return {
      total: response.data.total_count,
      items: response.data.items.map((issue: any) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        user: {
          login: issue.user.login,
          avatar: issue.user.avatar_url,
        },
        assignees: issue.assignees?.map((a: any) => ({
          login: a.login,
          avatar: a.avatar_url,
        })) || [],
        labels: issue.labels.map((l: any) => ({
          name: l.name,
          color: l.color,
        })),
        comments: issue.comments,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        closedAt: issue.closed_at,
        htmlUrl: issue.html_url,
      })),
    };
  }
}

export const githubAPIService = new GitHubAPIService();
export default githubAPIService;
