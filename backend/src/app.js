const express = require('express');
const cors = require('cors');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const authRoutes = require('./routes/authRoutes');

const app = express();
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// Global Middlewares
app.use(cors());

// Auth Routes (Port 8001 handler)
app.use('/api/auth', authRoutes);

// Proxy Middleware for everything else (Port 8000 forwarder)
app.use('/', createProxyMiddleware({
  target: FASTAPI_URL,
  changeOrigin: true
}));

module.exports = app;
