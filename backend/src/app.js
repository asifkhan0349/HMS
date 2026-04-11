const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authRoutes = require('./routes/authRoutes');
const { protect } = require('./middleware/authMiddleware');

const app = express();
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// Global Middlewares
app.use(cors());

// Auth Routes (Specific handler for public auth actions)
app.use('/api/auth', authRoutes);

/**
 * Proxy Middleware for everything else
 * Enforces authentication for all routes except public endpoints
 */
const publicPaths = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/health'
];

app.use('/', (req, res, next) => {
  // Allow public paths to pass through to the proxy without authentication
  if (publicPaths.includes(req.path)) {
    return next();
  }
  // Enforce authentication for all other resources
  return protect(req, res, next);
}, createProxyMiddleware({
  target: FASTAPI_URL,
  changeOrigin: true
}));

module.exports = app;
