const jwt = require('jsonwebtoken');

/**
 * Middleware to enforce authentication via Authorization header.
 * Verifies the JWT and attaches user information to the request.
 */
const protect = (req, res, next) => {
  let token;

  // Check for Authorization header starting with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (Bearer <token>)
      token = req.headers.authorization.split(' ')[1];

      // Use the HMS_SECRET_KEY from environment variables
      const secret = process.env.HMS_SECRET_KEY || 'dev-insecure-secret-change-me-in-production-please';
      
      // Verify token
      const decoded = jwt.verify(token, secret);

      // Attach user info to request (matches current user_id structure)
      req.user = {
        id: decoded.sub,
        jti: decoded.jti
      };

      next();
    } catch (error) {
      console.error('Auth Error:', error.message);
      return res.status(401).json({
        detail: "Invalid or expired token. Please sign in again.",
        message: "Authentication failed"
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      detail: "Missing or malformed authorization header. Please sign in again.",
      message: "Not authorized"
    });
  }
};

module.exports = { protect };
