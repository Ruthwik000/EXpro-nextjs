// API Configuration for Chrome Extension

// Production API URL (deployed on Vercel)
const PRODUCTION_API_URL = 'https://e-xpro-nextjs.vercel.app/api/github';
const DEVELOPMENT_API_URL = 'http://localhost:3000/api/github';

// Automatically detect environment
// For production extension, use deployed API
// For development, use localhost
export const API_CONFIG = {
  // Set to true to use production API
  isProduction: true,
  
  baseUrl: true ? PRODUCTION_API_URL : DEVELOPMENT_API_URL,
  
  timeout: 30000, // 30 seconds
};

// API Endpoints
export const ENDPOINTS = {
  health: '/health',
  stats: '/stats',
  ingest: '/ingest',
  query: '/query',
  status: (jobId) => `/status/${jobId}`,
  deleteRepo: (repoId) => `/repo/${encodeURIComponent(repoId)}`,
};

// Helper to get full URL
export function getApiUrl(endpoint) {
  return `${API_CONFIG.baseUrl}${endpoint}`;
}
