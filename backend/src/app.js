const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authRoutes = require('./routes/authRoutes');

const app = express();
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// Global Middlewares
app.use(cors());
app.use(express.json());

// Auth Routes (Port 8001 handler)
app.use('/api/auth', authRoutes);

// Proxy Middleware for everything else (Port 8000 forwarder)
app.use('/', createProxyMiddleware({
  target: FASTAPI_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Body parsing fix for proxied requests
    if (!req.body || !Object.keys(req.body).length) return;
    const contentType = req.header('Content-Type');
    const writeBody = (bodyData) => {
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    };
    if (contentType && contentType.includes('application/json')) {
      writeBody(JSON.stringify(req.body));
    }
  }
}));

module.exports = app;
