const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authRoutes = require('./routes/authRoutes');
const { protect } = require('./middleware/authMiddleware');

const app = express();
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// Global Middlewares
app.use(cors());

const onProxyReq = (proxyReq, req, res) => {
  if (req.body && Object.keys(req.body).length) {
    const bodyData = JSON.stringify(req.body);
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  }
};

const proxyOptions = {
  target: FASTAPI_URL,
  changeOrigin: true,
  onProxyReq,
  onError: (err, req, res) => {
    console.error('[Proxy Error]:', err);
    res.status(500).send('Proxy Error');
  }
};

// Node-handled auth endpoints (forgot/reset password)
app.use('/api/auth/forgot-password', authRoutes);
app.use('/api/auth/reset-password', authRoutes);

/**
 * Individual-Endpoint Authorization
 * We apply the 'protect' middleware explicitly to each API endpoint resource.
 */
app.use('/api/patients', protect);
app.use('/api/appointments', protect);
app.use('/api/records', protect);
app.use('/api/invoices', protect);
app.use('/api/medicines', protect);
app.use('/api/tests', protect);
app.use('/api/staff', protect);
app.use('/api/dashboard', protect);
app.use('/api/beds', protect);
app.use('/api/blood_inventory', protect);
app.use('/api/blood_activities', protect);
app.use('/api/inventory', protect);

/**
 * Global Catch-all Proxy
 * Handles all other /api calls (including login/signup), SPA, and other non-api routes.
 */
app.use('/', createProxyMiddleware(proxyOptions));

module.exports = app;
