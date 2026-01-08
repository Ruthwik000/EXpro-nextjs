import { z } from "zod";

const envSchema = z.object({
  // Server
  PORT: z.string().default("3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // GitHub (Optional - for private repositories)
  GITHUB_TOKEN: z.string().optional(),

  // Groq (LLM)
  GROQ_API_KEY: z.string().min(1, "Groq API key is required"),
  GROQ_MODEL: z.string().default("llama3-70b-8192"),

  // Pinecone
  PINECONE_API_KEY: z.string().min(1, "Pinecone API key is required"),
  PINECONE_ENVIRONMENT: z.string().min(1, "Pinecone environment is required"),
  PINECONE_INDEX_NAME: z.string().default("github-code-search"),

  // Redis (optional - will use in-memory cache if not available)
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().optional(),

  // Storage
  CACHE_DIR: z.string().default("./cache"),
  MAX_FILE_SIZE_MB: z.string().default("10"),
  MAX_REPO_SIZE_MB: z.string().default("1000"),

  // Chunking
  CHUNK_SIZE: z.string().default("1000"),
  CHUNK_OVERLAP: z.string().default("200"),
  MAX_CHUNKS_PER_FILE: z.string().default("100"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default("900000"),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100"),

  // Logging
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

const env = envSchema.parse(process.env);

export const config = {
  server: {
    port: parseInt(env.PORT, 10),
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === "development",
    isProduction: env.NODE_ENV === "production",
  },
  github: {
    token: env.GITHUB_TOKEN,
  },
  groq: {
    apiKey: env.GROQ_API_KEY,
    model: env.GROQ_MODEL,
  },
  pinecone: {
    apiKey: env.PINECONE_API_KEY,
    environment: env.PINECONE_ENVIRONMENT,
    indexName: env.PINECONE_INDEX_NAME,
  },
  redis: {
    host: env.REDIS_HOST || "localhost",
    port: parseInt(env.REDIS_PORT || "6379", 10),
    password: env.REDIS_PASSWORD,
    db: parseInt(env.REDIS_DB || "0", 10),
    enabled: !!env.REDIS_HOST,
  },
  storage: {
    cacheDir: env.CACHE_DIR,
    maxFileSizeMB: parseInt(env.MAX_FILE_SIZE_MB, 10),
    maxRepoSizeMB: parseInt(env.MAX_REPO_SIZE_MB, 10),
  },
  chunking: {
    chunkSize: parseInt(env.CHUNK_SIZE, 10),
    chunkOverlap: parseInt(env.CHUNK_OVERLAP, 10),
    maxChunksPerFile: parseInt(env.MAX_CHUNKS_PER_FILE, 10),
  },
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  logging: {
    level: env.LOG_LEVEL,
  },
} as const;

export type Config = typeof config;
