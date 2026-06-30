// ============================================================
// authMiddleware.js — JWT + session validation
// ============================================================
// Every protected route runs this middleware first.
// It checks two things:
//   1. Is the JWT signature valid and not expired?
//   2. Does this session (jti) still exist in the sessions table?
//      → If "logout all devices" was called, all sessions are
//        deleted, so even a valid JWT gets rejected here.
// ============================================================

const jwt  = require('jsonwebtoken');
const pool = require('../db');

async function authenticate(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated. Please login.' });
  }

  try {
    // Step 1: Verify JWT signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 2: Check this session still exists in the DB
    // This is what makes "logout all devices" work —
    // deleting sessions from DB invalidates all existing tokens
    const session = await pool.query(
      'SELECT id FROM sessions WHERE jti = $1',
      [decoded.jti]
    );

    if (session.rows.length === 0) {
      return res.status(401).json({ message: 'Session expired or signed out. Please login again.' });
    }

    // Step 3: Update last_used_at to track device activity
    await pool.query(
      'UPDATE sessions SET last_used_at = NOW() WHERE jti = $1',
      [decoded.jti]
    );

    req.user    = decoded;      // { id, username, role, jti }
    req.userJti = decoded.jti;  // shortcut for logout
    next();

  } catch (err) {
    return res.status(401).json({ message: 'Session expired. Please login again.' });
  }
}

// Middleware: Check if the user has admin role
// Must be used AFTER 'authenticate'
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
