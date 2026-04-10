const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Routes mounted under /api/auth
// Apply express.json() ONLY to these specific routes
router.post('/forgot-password', express.json(), authController.forgotPassword);
router.post('/reset-password/:token', express.json(), authController.resetPassword);

module.exports = router;
