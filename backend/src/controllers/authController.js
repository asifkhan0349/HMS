const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const { query, run, isPostgres } = require('../config/db');
const transporter = require('../config/mail');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Check if user exists
  const users = await query(
    isPostgres 
      ? 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)' 
      : 'SELECT * FROM users WHERE LOWER(email) = LOWER(?)', 
    [email]
  );
  
  if (users.length === 0) {
    // For security, don't reveal existence
    return res.json({ message: "If an account exists with that email, a reset link has been sent." });
  }

  const user = users[0];

  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  // Store token and expiry in DB
  if (isPostgres) {
    await run(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [resetToken, tokenExpiry, user.id]
    );
  } else {
    await run(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      [resetToken, tokenExpiry.toISOString(), user.id]
    );
  }

  const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"HMS Support" <${process.env.EMAIL}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #0d6efd;">Reset Your Password</h2>
        <p>You requested a password reset for your Hospital Management System account.</p>
        <p>This link is valid for 15 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #0d6efd; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #888;">HMS Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "If an account exists with that email, a reset link has been sent." });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({ message: "Error sending email. Please try again later." });
  }
});

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { new_password } = req.body;

  if (!new_password) {
    return res.status(400).json({ message: "New password is required" });
  }

  // Find user with valid token and not expired
  // Postgres handles date comparison directly; SQLite depends on how it's stored
  let users;
  if (isPostgres) {
    users = await query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [token]
    );
  } else {
    users = await query(
      'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > ?',
      [token, new Date().toISOString()]
    );
  }

  if (users.length === 0) {
    return res.status(400).json({ message: "Invalid or expired reset token." });
  }

  const user = users[0];
  const hashedPassword = await bcrypt.hash(new_password, 10);

  // Update password and clear token
  if (isPostgres) {
    await run(
      'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );
  } else {
    await run(
      'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );
  }

  res.json({ message: "Password has been successfully updated. You can now login with your new password." });
});

module.exports = {
  forgotPassword,
  resetPassword
};
