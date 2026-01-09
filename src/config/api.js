// API Configuration for Chrome Extension

// Change this to your deployed URL when ready
const PRODUCTION_API_URL = 'https://your-app-name.vercel.app/api/github';
const DEVELOPMENT_API_URL = 'http://localhost:3000/api/github';

// Automatically detect environment
// For production extension, use deployed API
// For development, use localhost
export const API_CONFIG = {
  // Set to true when building for production
  isProduction: false, // Change to true after deploying
  
  baseUrl: false ? PRODUCTION_API_URL : DEVELOPMENT_API_URL,
  
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
