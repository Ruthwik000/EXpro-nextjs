import logger from "../logger";

interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

/**
 * In-memory cache service (fallback when Redis is not available)
 * This provides a simple caching mechanism without external dependencies
 */
class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private hashCache: Map<string, Map<string, any>> = new Map();
  private setCache: Map<string, Set<string>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isConnected: boolean = true;

  constructor() {
    logger.info("Using in-memory cache (Redis not required)");

    // Start cleanup interval to remove expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Run every minute
  }

  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.debug({ expiredCount }, "Cleaned up expired cache entries");
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        return null;
      }

      // Check if expired
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        this.cache.delete(key);
        return null;
      }

      return entry.value as T;
    } catch (error) {
      logger.error({ error, key }, "Cache get error");
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
      };

      this.cache.set(key, entry);
    } catch (error) {
      logger.error({ error, key }, "Cache set error");
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.cache.delete(key);
      this.hashCache.delete(key);
      this.setCache.delete(key);
    } catch (error) {
      logger.error({ error, key }, "Cache delete error");
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      // Convert glob pattern to regex
      const regexPattern = pattern.replace(/\*/g, ".*").replace(/\?/g, ".");
      const regex = new RegExp(`^${regexPattern}$`);

      const keysToDelete: string[] = [];

      // Check simple cache
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      }

      // Check hash cache
      for (const key of this.hashCache.keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      }

      // Check set cache
      for (const key of this.setCache.keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      }

      // Delete all matching keys
      for (const key of keysToDelete) {
        await this.delete(key);
      }

      logger.debug(
        { pattern, deletedCount: keysToDelete.length },
        "Deleted keys by pattern",
      );
    } catch (error) {
      logger.error({ error, pattern }, "Cache delete pattern error");
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (this.cache.has(key)) {
        const entry = this.cache.get(key);
        // Check if expired
        if (entry && entry.expiresAt && entry.expiresAt < Date.now()) {
          this.cache.delete(key);
          return false;
        }
        return true;
      }
      return this.hashCache.has(key) || this.setCache.has(key);
    } catch (error) {
      logger.error({ error, key }, "Cache exists error");
      return false;
    }
  }

  async increment(key: string): Promise<number> {
    try {
      const current = await this.get<number>(key);
      const newValue = (current || 0) + 1;
      await this.set(key, newValue);
      return newValue;
    } catch (error) {
      logger.error({ error, key }, "Cache increment error");
      return 0;
    }
  }

  async setHash(key: string, field: string, value: any): Promise<void> {
    try {
      if (!this.hashCache.has(key)) {
        this.hashCache.set(key, new Map());
      }
      const hash = this.hashCache.get(key)!;
      hash.set(field, value);
    } catch (error) {
      logger.error({ error, key, field }, "Cache setHash error");
    }
  }

  async getHash<T>(key: string, field: string): Promise<T | null> {
    try {
      const hash = this.hashCache.get(key);
      if (!hash) return null;
      const value = hash.get(field);
      return value !== undefined ? (value as T) : null;
    } catch (error) {
      logger.error({ error, key, field }, "Cache getHash error");
      return null;
    }
  }

  async getAllHash<T>(key: string): Promise<Record<string, T>> {
    try {
      const hash = this.hashCache.get(key);
      if (!hash) return {};

      const result: Record<string, T> = {};
      for (const [field, value] of hash.entries()) {
        result[field] = value as T;
      }
      return result;
    } catch (error) {
      logger.error({ error, key }, "Cache getAllHash error");
      return {};
    }
  }

  async addToSet(key: string, ...members: string[]): Promise<void> {
    try {
      if (!this.setCache.has(key)) {
        this.setCache.set(key, new Set());
      }
      const set = this.setCache.get(key)!;
      for (const member of members) {
        set.add(member);
      }
    } catch (error) {
      logger.error({ error, key }, "Cache addToSet error");
    }
  }

  async getSet(key: string): Promise<string[]> {
    try {
      const set = this.setCache.get(key);
      return set ? Array.from(set) : [];
    } catch (error) {
      logger.error({ error, key }, "Cache getSet error");
      return [];
    }
  }

  async isInSet(key: string, member: string): Promise<boolean> {
    try {
      const set = this.setCache.get(key);
      return set ? set.has(member) : false;
    } catch (error) {
      logger.error({ error, key, member }, "Cache isInSet error");
      return false;
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
    this.hashCache.clear();
    this.setCache.clear();
    logger.info("In-memory cache closed");
  }

  // Get cache statistics (useful for monitoring)
  getStats(): { size: number; hashCount: number; setCount: number } {
    return {
      size: this.cache.size,
      hashCount: this.hashCache.size,
      setCount: this.setCache.size,
    };
  }
}

export const cacheService = new CacheService();
export default cacheService;
