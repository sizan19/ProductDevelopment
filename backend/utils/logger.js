// ============================================================
// logger.js — Save activity logs to the database
// ============================================================
// Every important action (login, register, OTP, etc.) calls
// this function to leave a record in the logs table.
// ============================================================

const pool = require('../db');

// Actions — use these constants everywhere so spelling is consistent
const ACTIONS = {
  REGISTER_SUCCESS:      'REGISTER_SUCCESS',
  REGISTER_FAILED:       'REGISTER_FAILED',
  LOGIN_SUCCESS:         'LOGIN_SUCCESS',
  LOGIN_FAILED:          'LOGIN_FAILED',
  ACCOUNT_LOCKED:        'ACCOUNT_LOCKED',
  OTP_SENT:              'OTP_SENT',
  OTP_RESENT:            'OTP_RESENT',
  OTP_VERIFIED:          'OTP_VERIFIED',
  OTP_FAILED:            'OTP_FAILED',
  OTP_EXPIRED:           'OTP_EXPIRED',
  LOGOUT:                'LOGOUT',
  CHANGE_PASSWORD:       'CHANGE_PASSWORD',
  CHANGE_PASSWORD_FAILED:'CHANGE_PASSWORD_FAILED',
  ADMIN_UNLOCK_USER:     'ADMIN_UNLOCK_USER',
  ADMIN_DELETE_USER:     'ADMIN_DELETE_USER',
  ADMIN_CHANGE_ROLE:     'ADMIN_CHANGE_ROLE',
  CAPTCHA_FAILED:        'CAPTCHA_FAILED',
  LOGOUT_ALL:            'LOGOUT_ALL',
  FORGOT_PASSWORD:       'FORGOT_PASSWORD',
  FORGOT_PASSWORD_FAILED:'FORGOT_PASSWORD_FAILED',
  RESET_PASSWORD:        'RESET_PASSWORD',
  RESET_PASSWORD_FAILED: 'RESET_PASSWORD_FAILED',
  PASSWORD_EXPIRED:      'PASSWORD_EXPIRED',
  NEW_DEVICE_LOGIN:      'NEW_DEVICE_LOGIN',
};

// Get IP address from the request object
function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

// Write a log entry to the database
// userId  — can be null (e.g. failed login where user doesn't exist)
// action  — use ACTIONS constants above
// status  — 'success' | 'failed' | 'warning'
// details — any extra human-readable info
async function log(userId, action, status, details, req) {
  try {
    const ip = req ? getIP(req) : 'system';
    await pool.query(
      `INSERT INTO logs (user_id, action, status, details, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId || null, action, status, details || null, ip]
    );
  } catch (err) {
    // Never crash the app because logging failed
    console.error('[Logger] Failed to write log:', err.message);
  }
}

module.exports = { log, ACTIONS };
