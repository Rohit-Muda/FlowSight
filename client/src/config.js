const isProd = process.env.NODE_ENV === 'production';

// IMPORTANT: Must include /api prefix to match backend route mounting:
// server.js: app.use('/api/shipments', ...) and app.use('/api/hubs', ...)
export const API_BASE = isProd
  ? 'https://flowsight-production.up.railway.app/api'
  : 'http://localhost:5000/api';

export const SOCKET_URL = isProd
  ? 'https://flowsight-production.up.railway.app'
  : 'http://localhost:5000';