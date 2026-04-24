const isProd = process.env.NODE_ENV === 'production';

// IMPORTANT: Must include /api prefix to match backend route mounting:
// server.js: app.use('/api/shipments', ...) and app.use('/api/hubs', ...)
export const API_BASE = isProd
  ? 'https://flowsight-backend-969140599829.asia-south1.run.app/api'
  : 'https://flowsight-backend-969140599829.asia-south1.run.app/api';

export const SOCKET_URL = isProd
  ? 'https://flowsight-backend-969140599829.asia-south1.run.app'
  : 'https://flowsight-backend-969140599829.asia-south1.run.app';