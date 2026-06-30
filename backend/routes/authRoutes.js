// ============================================================
// authRoutes.js — All authentication API routes
// ============================================================

const express    = require('express');
const router     = express.Router();

const {
  login,
  requestOTP,
  verifyOTP,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  requestChangePasswordLink,
  verifyChangePasswordLink,
  logout,
  logoutAll,
  getSessions,
  getMe,
} = require('../controllers/authController');

const { authenticate } = require('../middleware/authMiddleware');

const {
  handleValidationErrors,
  loginRules,
  verifyOtpRules,
  requestOtpRules,
  changePasswordRules,
  forgotPasswordRules,
  resetPasswordRules,
  verifyChangePwdLinkRules,
} = require('../middleware/validate');

// POST /api/auth/login       — Check email + password, send OTP
router.post('/login', loginRules, handleValidationErrors, login);

// POST /api/auth/request-otp — Resend OTP to user (for "resend" button)
router.post('/request-otp', requestOtpRules, handleValidationErrors, requestOTP);

// POST /api/auth/verify-otp  — Submit OTP to complete login
router.post('/verify-otp', verifyOtpRules, handleValidationErrors, verifyOTP);

// POST /api/auth/refresh-token — Get a new access token using refresh token
router.post('/refresh-token', refreshToken);

// POST /api/auth/change-password — Change password (must be logged in)
router.post('/change-password', authenticate, changePasswordRules, handleValidationErrors, changePassword);

// POST /api/auth/request-change-password-link — Send email link
router.post('/request-change-password-link', authenticate, requestChangePasswordLink);

// POST /api/auth/verify-change-password-link  — Set new password from link
router.post('/verify-change-password-link', verifyChangePwdLinkRules, handleValidationErrors, verifyChangePasswordLink);

// POST /api/auth/forgot-password — Send OTP to email for password reset
router.post('/forgot-password', forgotPasswordRules, handleValidationErrors, forgotPassword);

// POST /api/auth/reset-password  — Verify OTP and set new password
router.post('/reset-password', resetPasswordRules, handleValidationErrors, resetPassword);

// GET  /api/auth/sessions     — List all active sessions for this user
router.get('/sessions',    authenticate, getSessions);

// POST /api/auth/logout       — Logout this device only
router.post('/logout',     authenticate, logout);

// POST /api/auth/logout-all   — Logout ALL devices
router.post('/logout-all', authenticate, logoutAll);

// GET  /api/auth/me           — Get current user info (must be logged in)
router.get('/me', authenticate, getMe);

module.exports = router;
