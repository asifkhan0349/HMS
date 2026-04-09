const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Routes mounted under /api/auth
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Also add a fallback for the body-based token if we want to support both, 
// but let's stick to the URL param as requested for "clean code".
// router.post('/reset-password', authController.resetPassword); 

module.exports = router;
