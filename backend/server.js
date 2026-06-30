// ============================================================
// server.js — Main Express server entry point
// ============================================================

// Load environment variables from the single root .env file
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// ---- Validate required environment variables at startup -----
const REQUIRED_ENV = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET', 'TURNSTILE_SECRET_KEY'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  console.error('Please check your .env file.');
  process.exit(1);
}

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const crypto       = require('crypto');
const pool         = require('./db');

const authRoutes   = require('./routes/authRoutes');
const adminRoutes  = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// ---- Security: HTTP headers --------------------------------
app.use(helmet());

// ---- CORS: Only allow requests from our React frontend -----
// FRONTEND_URL may be a comma-separated list of allowed origins.
// In development we also allow any localhost / 127.0.0.1 port so the
// dev server can run on 3000, 5001, etc. without breaking fetches.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser clients (curl, server-to-server) with no Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ---- Body Parser: Read JSON from request body --------------
app.use(express.json());

// ---- Cookie Parser: Read cookies from requests -------------
app.use(cookieParser());

// ---- CSRF Protection (Double Submit Cookie) ----------------
// Generate a CSRF token and set it as a readable cookie.
// The frontend must send it back in the X-CSRF-Token header.
// This protects state-changing endpoints from cross-site attacks.
app.use((req, res, next) => {
  // Only enforce CSRF on state-changing methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  if (safeMethods.includes(req.method)) {
    // For safe methods, issue/refresh the CSRF cookie if missing
    if (!req.cookies.csrfToken) {
      const csrfToken = crypto.randomBytes(32).toString('hex');
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('csrfToken', csrfToken, {
        httpOnly: false, // frontend JS needs to read this
        secure:   isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge:   24 * 60 * 60 * 1000, // 24 hours
      });
    }
    return next();
  }

  // For POST/PUT/PATCH/DELETE: validate the CSRF token
  const cookieToken = req.cookies.csrfToken;
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'CSRF token validation failed.' });
  }

  next();
});

// ---- Rate Limiting: Max 100 requests per 15 minutes --------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests. Please wait and try again.' },
});
app.use(limiter);

// ---- Routes -----------------------------------------------
app.use('/api/auth',  authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api',       publicRoutes);   // /api/contact, /api/chat, /api/content/*

// ---- Health check route ------------------------------------
app.get('/', (req, res) => {
  res.json({ message: 'AI-Solutions API is running!' });
});

// ---- Centralized Error Handler -----------------------------
// All controllers call next(err) instead of handling errors inline.
// This middleware catches them all in one place.
app.use((err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} — Error:`, err.message);

  // Don't leak internal details in production
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    message: isProduction ? 'Server error. Please try again.' : err.message || 'Server error.',
  });
});

// ---- Session Cleanup: Remove expired sessions --------------
// Runs every hour. Deletes sessions older than 1 hour (matching JWT expiry)
// and sessions whose refresh tokens have expired (7 days).
function cleanupExpiredSessions() {
  pool.query(
    `DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '7 days'`
  ).then(result => {
    if (result.rowCount > 0) {
      console.log(`[Session Cleanup] Removed ${result.rowCount} expired session(s).`);
    }
  }).catch(err => {
    console.error('[Session Cleanup] Error:', err.message);
  });
}

// Run cleanup on startup and then every hour
cleanupExpiredSessions();
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL);

// ---- Start Server ------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server is running at http://localhost:${PORT}`);
});
