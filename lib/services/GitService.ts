import simpleGit, { SimpleGit } from "simple-git";
import * as fs from "fs/promises";
import * as path from "path";
import { config } from "../config";
import logger from "../logger";
import { normalizeRepoId } from "../utils";

export class GitService {
  private cacheDir: string;
  private githubToken?: string;

  constructor() {
    this.cacheDir = config.storage.cacheDir;
    this.githubToken = config.github.token;

    if (this.githubToken) {
      logger.info("GitHub token configured - can access private repositories");
    } else {
      logger.info("No GitHub token - can only access public repositories");
    }
  }

  private getAuthenticatedUrl(repoUrl: string): string {
    if (!this.githubToken) {
      return repoUrl;
    }

    // Convert https://github.com/user/repo to https://token@github.com/user/repo
    try {
      const url = new URL(repoUrl);
      if (url.hostname === "github.com") {
        // Use token:x-oauth-basic@ format for better compatibility
        return repoUrl.replace('https://', `https://${this.githubToken}:x-oauth-basic@`);
      }
    } catch (error) {
      logger.warn({ repoUrl }, "Failed to parse repo URL for authentication");
    }

    return repoUrl;
  }

  async cloneRepository(
    repoUrl: string,
    branch: string = "main",
  ): Promise<string> {
    const repoId = normalizeRepoId(repoUrl);
    const repoPath = path.join(this.cacheDir, repoId.replace("/", "_"));

    try {
      // Ensure cache directory exists
      await fs.mkdir(this.cacheDir, { recursive: true });

      // Check if repo already exists
      const exists = await this.repositoryExists(repoPath);

      if (exists) {
        logger.info(
          { repoId, repoPath },
          "Repository already cloned, pulling latest",
        );
        await this.pullRepository(repoPath, branch);
        return repoPath;
      }

      // Try cloning without auth first (for public repos)
      logger.info(
        { repoUrl, branch, repoPath },
        "Cloning repository (public)",
      );
      
      const git: SimpleGit = simpleGit();
      let cloneSuccessful = false;

      try {
        // First attempt: Clone without authentication (public repos)
        await git.clone(repoUrl, repoPath, {
          "--depth": 1,
          "--single-branch": null,
          "--branch": branch,
        });
        cloneSuccessful = true;
        logger.info({ repoId }, "Cloned public repository successfully");
      } catch (publicError: any) {
        logger.warn(
          { error: publicError.message, repoUrl },
          "Public clone failed, trying with authentication",
        );

        // Second attempt: Try with authentication (private repos)
        if (this.githubToken) {
          try {
            const authenticatedUrl = this.getAuthenticatedUrl(repoUrl);
            await git.clone(authenticatedUrl, repoPath, {
              "--depth": 1,
              "--single-branch": null,
              "--branch": branch,
            });
            cloneSuccessful = true;
            logger.info({ repoId }, "Cloned private repository successfully");
          } catch (privateError: any) {
            // Third attempt: Try master branch if main failed
            if (branch === "main") {
              logger.warn(
                { repoUrl },
                "Branch 'main' not found, trying 'master'",
              );
              const authenticatedUrl = this.getAuthenticatedUrl(repoUrl);
              await git.clone(authenticatedUrl, repoPath, {
                "--depth": 1,
                "--single-branch": null,
                "--branch": "master",
              });
              cloneSuccessful = true;
              logger.info({ repoId }, "Cloned with 'master' branch");
            } else {
              throw privateError;
            }
          }
        } else {
          // No token available, try master branch
          if (branch === "main") {
            logger.warn(
              { repoUrl },
              "Branch 'main' not found, trying 'master'",
            );
            await git.clone(repoUrl, repoPath, {
              "--depth": 1,
              "--single-branch": null,
              "--branch": "master",
            });
            cloneSuccessful = true;
            logger.info({ repoId }, "Cloned with 'master' branch");
          } else {
            throw publicError;
          }
        }
      }

      if (!cloneSuccessful) {
        throw new Error("Failed to clone repository after all attempts");
      }

      logger.info({ repoId, repoPath }, "Repository cloned successfully");
      return repoPath;
    } catch (error: any) {
      logger.error(
        {
          error: error.message,
          stack: error.stack,
          repoUrl,
          branch,
        },
        "Failed to clone repository",
      );
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  async pullRepository(
    repoPath: string,
    branch: string = "main",
  ): Promise<void> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      await git.checkout(branch);
      await git.pull("origin", branch);
      logger.info({ repoPath, branch }, "Repository updated");
    } catch (error) {
      logger.error({ error, repoPath, branch }, "Failed to pull repository");
      throw error;
    }
  }

  async repositoryExists(repoPath: string): Promise<boolean> {
    try {
      await fs.access(path.join(repoPath, ".git"));
      return true;
    } catch {
      return false;
    }
  }

  async deleteRepository(repoId: string): Promise<void> {
    const repoPath = path.join(this.cacheDir, repoId.replace("/", "_"));

    try {
      await fs.rm(repoPath, { recursive: true, force: true });
      logger.info({ repoId, repoPath }, "Repository deleted");
    } catch (error) {
      logger.error({ error, repoId }, "Failed to delete repository");
      throw error;
    }
  }

  getRepositoryPath(repoId: string): string {
    return path.join(this.cacheDir, repoId.replace("/", "_"));
  }

  async getRepositorySize(repoPath: string): Promise<number> {
    try {
      let totalSize = 0;

      async function calculateSize(dirPath: string): Promise<void> {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            // Skip .git directory
            if (entry.name === ".git") continue;
            await calculateSize(fullPath);
          } else {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
          }
        }
      }

      await calculateSize(repoPath);
      return totalSize;
    } catch (error) {
      logger.error({ error, repoPath }, "Failed to calculate repository size");
      return 0;
    }
  }
}

export const gitService = new GitService();
export default gitService;
