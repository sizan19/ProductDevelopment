// ============================================================
// authController.js — All authentication logic
// ============================================================

const axios  = require('axios');
const jwt    = require('jsonwebtoken');
const pool   = require('../db');
const crypto = require('crypto');

const { hashPassword, verifyPassword, generateSalt } = require('../utils/hash');
const { generateOTP, getOTPExpiry, hashOTP, verifyOTPHash } = require('../utils/otp');
const { sendOTPEmail, sendChangePasswordLink, sendNewDeviceAlert } = require('../utils/email');
const { log, ACTIONS }                               = require('../utils/logger');
const { parseDevice }                                = require('../utils/deviceParser');
const {
  validateEmail,
  validatePassword,
  getPasswordErrors,
  isLeakedPassword,
  sanitize,
} = require('../utils/validator');

const isDev = process.env.NODE_ENV !== 'production';

// Max OTP verification attempts before OTP is invalidated
const MAX_OTP_ATTEMPTS = 3;

// Minimum seconds between OTP resend requests per user
const OTP_RESEND_COOLDOWN_SEC = 60;

// Password expires after 90 days — user must change it
const PASSWORD_MAX_AGE_DAYS = 90;

// Helper: get client IP
function getIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

// ============================================================
// HELPER: Verify Cloudflare Turnstile CAPTCHA token
// ============================================================
async function verifyTurnstile(token) {
  try {
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret:   process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data.success === true;
  } catch (err) {
    console.error('Turnstile verification error:', err.message);
    return false;
  }
}

// Helper: password validation error message
function passwordErrorMessage(password) {
  const errors = getPasswordErrors(password);
  if (errors.length === 0) return null;
  return `Password must contain ${errors.join(', ')}.`;
}

// ============================================================
// POST /api/auth/login
// ============================================================
async function login(req, res, next) {
  try {
    let { email, password, turnstileToken } = req.body;
    email = sanitize(email || '').toLowerCase().trim();

    // Verify CAPTCHA
    const captchaOk = await verifyTurnstile(turnstileToken);
    if (!captchaOk) {
      await log(null, ACTIONS.CAPTCHA_FAILED, 'failed', `CAPTCHA failed on login for: "${email}"`, req);
      return res.status(400).json({ message: 'CAPTCHA verification failed. Please try again.' });
    }

    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      await log(null, ACTIONS.LOGIN_FAILED, 'failed', `Login attempt for unknown email: "${email}"`, req);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const user = result.rows[0];

    // Block login if email is not verified
    if (user.email_verified === false) {
      await log(user.id, ACTIONS.LOGIN_FAILED, 'failed', `Login blocked — email not verified for "${email}"`, req);
      return res.status(403).json({
        message: 'Email not verified. Please verify your email with the OTP sent during registration.',
        requireEmailVerification: true,
        userId: user.id,
      });
    }

    // Check account lock
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      const minsLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      await log(user.id, ACTIONS.ACCOUNT_LOCKED, 'warning', `Login blocked — account locked for ${minsLeft} more min(s)`, req);
      return res.status(423).json({ message: `Account is locked. Try again in ${minsLeft} minute(s).` });
    }

    // Verify password
    const passwordOk = verifyPassword(password, user.password_hash);
    if (!passwordOk) {
      const newAttempts = user.failed_attempts + 1;
      let lockUntil = null;

      if (newAttempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await pool.query(
        'UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3',
        [newAttempts, lockUntil, user.id]
      );

      if (lockUntil) {
        await log(user.id, ACTIONS.ACCOUNT_LOCKED, 'warning', `Account locked after 5 failed attempts`, req);
        return res.status(423).json({ message: 'Account locked for 15 minutes after 5 failed attempts.' });
      }

      const remaining = 5 - newAttempts;
      await log(user.id, ACTIONS.LOGIN_FAILED, 'failed', `Wrong password — attempt ${newAttempts}/5 (${remaining} left)`, req);
      return res.status(401).json({ message: `Invalid password. ${remaining} attempt(s) remaining before lockout.` });
    }

    // Password correct — reset failed attempts
    await pool.query(
      'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1',
      [user.id]
    );

    // Check password expiry (90 days)
    if (user.password_changed_at) {
      const daysSinceChange = (Date.now() - new Date(user.password_changed_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceChange >= PASSWORD_MAX_AGE_DAYS) {
        await log(user.id, ACTIONS.PASSWORD_EXPIRED, 'warning',
          `Password expired (${Math.floor(daysSinceChange)} days old) for "${user.email}"`, req);
        return res.status(403).json({
          message: `Your password has expired (last changed ${Math.floor(daysSinceChange)} days ago). Please reset your password.`,
          passwordExpired: true,
          userId: user.id,
        });
      }
    }

    // Generate OTP, hash it, and store the hash in DB
    const otp       = generateOTP();
    const otpExpiry = getOTPExpiry();
    const otpHash   = hashOTP(otp);
    await pool.query(
      'UPDATE users SET otp_code = $1, otp_expires_at = $2, otp_attempts = 0 WHERE id = $3',
      [otpHash, otpExpiry, user.id]
    );

    // Send OTP via email
    try {
      await sendOTPEmail(user.email, user.username, otp);
      if (isDev) console.log(`[OTP] Sent to ${user.email} — Code: ${otp}`);
    } catch (emailErr) {
      console.error('[OTP] Email failed:', emailErr.message);
      if (isDev) console.log(`[OTP] Fallback — User: ${user.username} | Code: ${otp}`);
    }

    await log(user.id, ACTIONS.OTP_SENT, 'success', `OTP sent to ${user.email} after password verified`, req);

    return res.json({
      message:    `OTP sent to your email (${user.email}).`,
      userId:     user.id,
      requireOTP: true,
    });

  } catch (err) {
    next(err);
  }
}

// ============================================================
// POST /api/auth/request-otp  (resend)
// ============================================================
async function requestOTP(req, res, next) {
  try {
    const { userId } = req.body;

    const result = await pool.query(
      'SELECT id, username, email, otp_expires_at FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const user = result.rows[0];

    // Rate-limit: enforce cooldown between OTP resends
    // OTP expiry is 5 min from issue. If last OTP was issued less than
    // OTP_RESEND_COOLDOWN_SEC ago, reject the request.
    if (user.otp_expires_at) {
      const issuedAt = new Date(user.otp_expires_at).getTime() - 5 * 60 * 1000; // when OTP was issued
      const elapsed  = (Date.now() - issuedAt) / 1000;
      if (elapsed < OTP_RESEND_COOLDOWN_SEC) {
        const wait = Math.ceil(OTP_RESEND_COOLDOWN_SEC - elapsed);
        return res.status(429).json({
          message: `Please wait ${wait} second(s) before requesting a new OTP.`,
        });
      }
    }

    // Generate new OTP, hash it, reset attempts
    const otp       = generateOTP();
    const otpExpiry = getOTPExpiry();
    const otpHash   = hashOTP(otp);
    await pool.query(
      'UPDATE users SET otp_code = $1, otp_expires_at = $2, otp_attempts = 0 WHERE id = $3',
      [otpHash, otpExpiry, userId]
    );

    try {
      await sendOTPEmail(user.email, user.username, otp);
      if (isDev) console.log(`[OTP] Resent to ${user.email} — Code: ${otp}`);
    } catch (emailErr) {
      console.error('[OTP] Email failed:', emailErr.message);
      if (isDev) console.log(`[OTP] Fallback — User: ${user.username} | Code: ${otp}`);
    }

    await log(user.id, ACTIONS.OTP_RESENT, 'success', `OTP resent to ${user.email}`, req);
    return res.json({ message: `New OTP sent to ${user.email}.` });

  } catch (err) {
    next(err);
  }
}

// ============================================================
// POST /api/auth/verify-otp
// ============================================================
async function verifyOTP(req, res, next) {
  try {
    const { userId, otp } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const user = result.rows[0];

    // Check OTP expiry first
    if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
      await log(user.id, ACTIONS.OTP_EXPIRED, 'failed', `OTP expired`, req);
      return res.status(401).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Brute-force protection: check attempt count
    const attempts = user.otp_attempts || 0;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      // Invalidate the OTP
      await pool.query(
        'UPDATE users SET otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0 WHERE id = $1',
        [user.id]
      );
      await log(user.id, ACTIONS.OTP_FAILED, 'failed', `OTP invalidated after ${MAX_OTP_ATTEMPTS} failed attempts`, req);
      return res.status(401).json({
        message: `Too many wrong attempts. OTP has been invalidated. Please request a new one.`,
      });
    }

    // Verify OTP hash
    let otpValid = false;
    try {
      otpValid = user.otp_code && verifyOTPHash(otp, user.otp_code);
    } catch {
      otpValid = false;
    }

    if (!otpValid) {
      // Increment attempt counter
      await pool.query(
        'UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = $1',
        [user.id]
      );
      const remaining = MAX_OTP_ATTEMPTS - (attempts + 1);
      await log(user.id, ACTIONS.OTP_FAILED, 'failed', `Wrong OTP entered (${remaining} attempt(s) remaining)`, req);
      return res.status(401).json({
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
      });
    }

    // Clear OTP
    await pool.query(
      'UPDATE users SET otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0 WHERE id = $1',
      [user.id]
    );

    // Generate a unique session ID (jti = JWT ID)
    const jti = crypto.randomBytes(16).toString('hex');

    // Issue JWT — includes jti so we can match it to a session row
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, jti },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Issue refresh token (longer lived)
    const refreshJti = crypto.randomBytes(16).toString('hex');
    const refreshToken = jwt.sign(
      { id: user.id, jti: refreshJti, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save session to DB with device + IP info, including refresh token jti
    const deviceInfo = parseDevice(req.headers['user-agent']);
    const clientIP   = getIP(req);

    // Check if this device + IP combo has been seen before for this user
    const knownDevice = await pool.query(
      `SELECT id FROM sessions
       WHERE user_id = $1 AND device_info = $2 AND ip_address = $3
       LIMIT 1`,
      [user.id, deviceInfo, clientIP]
    );
    const isNewDevice = knownDevice.rows.length === 0;

    await pool.query(
      `INSERT INTO sessions (user_id, jti, refresh_jti, ip_address, device_info)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, jti, refreshJti, clientIP, deviceInfo]
    );

    // Send new device alert email (non-blocking — don't fail login if email fails)
    if (isNewDevice) {
      sendNewDeviceAlert(user.email, user.username, deviceInfo, clientIP, new Date())
        .then(() => {
          if (isDev) console.log(`[NEW DEVICE] Alert sent to ${user.email} for "${deviceInfo}"`);
        })
        .catch((err) => {
          console.error('[NEW DEVICE] Alert email failed:', err.message);
        });
      await log(user.id, ACTIONS.NEW_DEVICE_LOGIN, 'warning',
        `New device login: ${deviceInfo} from ${clientIP}`, req);
    }

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure:   isProduction,
      maxAge:   60 * 60 * 1000, // 1 hour
      sameSite: isProduction ? 'strict' : 'lax',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   isProduction,
      maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: isProduction ? 'strict' : 'lax',
      path:     '/api/auth/refresh-token', // only sent to refresh endpoint
    });

    await log(user.id, ACTIONS.LOGIN_SUCCESS, 'success',
      `Login completed — role: ${user.role} — device: ${deviceInfo}`, req);
    return res.json({
      message: 'Login successful! Welcome.',
      user:    { id: user.id, username: user.username, role: user.role },
    });

  } catch (err) {
    next(err);
  }
}

// ============================================================
// POST /api/auth/refresh-token  (public, requires refresh cookie)
// ============================================================
async function refreshToken(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'No refresh token.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token. Please login again.' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type.' });
    }

    // Check session still exists by refresh_jti
    const session = await pool.query(
      'SELECT s.*, u.username, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.refresh_jti = $1',
      [decoded.jti]
    );
    if (session.rows.length === 0) {
      return res.status(401).json({ message: 'Session revoked. Please login again.' });
    }

    const sess = session.rows[0];

    // Issue a new access token
    const newJti = crypto.randomBytes(16).toString('hex');
    const newToken = jwt.sign(
      { id: sess.user_id, username: sess.username, role: sess.role, jti: newJti },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Update session jti
    await pool.query(
      'UPDATE sessions SET jti = $1, last_used_at = NOW() WHERE id = $2',
      [newJti, sess.id]
    );

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', newToken, {
      httpOnly: true,
      secure:   isProduction,
      maxAge:   60 * 60 * 1000,
      sameSite: isProduction ? 'strict' : 'lax',
    });

    return res.json({ message: 'Token refreshed.', user: { id: sess.user_id, username: sess.username, role: sess.role } });

  } catch (err) {
    next(err);
  }
}

// ============================================================
// POST /api/auth/change-password  (protected)
// ============================================================
async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!validatePassword(newPassword)) {
      const msg = passwordErrorMessage(newPassword) || 'Password does not meet requirements.';
      return res.status(400).json({ message: msg });
    }
    if (isLeakedPassword(newPassword)) {
      await log(userId, ACTIONS.CHANGE_PASSWORD_FAILED, 'failed', `Leaked password used for change password`, req);
      return res.status(400).json({ message: 'This password is commonly used and easy to crack. Please choose a stronger password.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const user = result.rows[0];

    // Verify old password
    const oldPasswordOk = verifyPassword(oldPassword, user.password_hash);
    if (!oldPasswordOk) {
      await log(userId, ACTIONS.CHANGE_PASSWORD_FAILED, 'failed', `Wrong current password provided`, req);
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    // Check password history (last 5)
    const history = await pool.query(
      `SELECT password_hash FROM password_history
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );
    for (const record of history.rows) {
      if (verifyPassword(newPassword, record.password_hash)) {
        await log(userId, ACTIONS.CHANGE_PASSWORD_FAILED, 'failed', `Attempted to reuse a recent password`, req);
        return res.status(400).json({ message: 'Cannot reuse a recent password. Please choose a different one.' });
      }
    }

    // Hash and save new password + update password_changed_at
    const newSalt         = generateSalt();
    const newPasswordHash = hashPassword(newPassword, newSalt);

    await pool.query(
      'UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );
    await pool.query(
      'INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)',
      [userId, newPasswordHash]
    );

    // Invalidate ALL sessions (forces re-login on all devices)
    const deleted = await pool.query(
      'DELETE FROM sessions WHERE user_id = $1 RETURNING id',
      [userId]
    );

    await log(userId, ACTIONS.CHANGE_PASSWORD, 'success',
      `Password changed — ${deleted.rowCount} session(s) invalidated`, req);
    res.clearCookie('token');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh-token' });
    return res.json({
      message: 'Password changed successfully! You have been logged out of all devices for security.',
      loggedOut: true,
    });

  } catch (err) {
    next(err);
  }
}

// ============================================================
// POST /api/auth/forgot-password  (public)
// ============================================================
async function forgotPassword(req, res, next) {
  try {
    let { email } = req.body;
    email = sanitize(email || '').toLowerCase().trim();

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      await log(null, ACTIONS.FORGOT_PASSWORD_FAILED, 'failed',
        `Reset requested for unknown email: "${email}"`, req);
      return res.json({ message: 'If that email is registered, an OTP has been sent.' });
    }

    const user = result.rows[0];

    // Rate-limit: enforce cooldown between OTP resends
    if (user.otp_expires_at) {
      const issuedAt = new Date(user.otp_expires_at).getTime() - 5 * 60 * 1000;
      const elapsed  = (Date.now() - issuedAt) / 1000;
      if (elapsed < OTP_RESEND_COOLDOWN_SEC) {
        return res.json({ message: 'If that email is registered, an OTP has been sent.' });
      }
    }

    // Generate OTP, hash it, and store
    const otp       = generateOTP();
    const otpExpiry = getOTPExpiry();
    const otpHash   = hashOTP(otp);
    await pool.query(
      'UPDATE users SET otp_code = $1, otp_expires_at = $2, otp_attempts = 0 WHERE id = $3',
      [otpHash, otpExpiry, user.id]
    );

    try {
      await sendOTPEmail(user.email, user.username, otp);
      if (isDev) console.log(`[RESET OTP] Sent to ${user.email} — Code: ${otp}`);
    } catch (emailErr) {
      console.error('[RESET OTP] Email failed:', emailErr.message);
      if (isDev) console.log(`[RESET OTP] Fallback — User: ${user.username} | Code: ${otp}`);
    }

    await log(user.id, ACTIONS.FORGOT_PASSWORD, 'success',
      `Password reset OTP sent to ${user.email}`, req);

    return res.json({
      message: 'OTP sent to your email. Enter it below to reset your password.',
      userId:  user.id,
    });

  } catch (err) {
    next(err);
  }
}

// ============================================================
// POST /api/auth/reset-password  (public)
// ============================================================
async function resetPassword(req, res, next) {
  try {
    const { userId, otp, newPassword } = req.body;

    if (!validatePassword(newPassword)) {
      const msg = passwordErrorMessage(newPassword) || 'Password does not meet requirements.';
      return res.status(400).json({ message: msg });
    }
    if (isLeakedPassword(newPassword)) {
      await log(userId, ACTIONS.RESET_PASSWORD_FAILED, 'failed', `Leaked password used for reset password`, req);
      return res.status(400).json({ message: 'This password is commonly used and easy to crack. Please choose a stronger password.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const user = result.rows[0];

    // Check OTP expiry
    if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
      await log(user.id, ACTIONS.RESET_PASSWORD_FAILED, 'failed', `Expired OTP on password reset`, req);
      return res.status(401).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Brute-force protection
    const attempts = user.otp_attempts || 0;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await pool.query(
        'UPDATE users SET otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0 WHERE id = $1',
        [user.id]
      );
      await log(user.id, ACTIONS.RESET_PASSWORD_FAILED, 'failed', `OTP invalidated after ${MAX_OTP_ATTEMPTS} failed attempts`, req);
      return res.status(401).json({
        message: `Too many wrong attempts. OTP has been invalidated. Please request a new one.`,
      });
    }

    // Verify OTP hash
    let otpValid = false;
    try {
      otpValid = user.otp_code && verifyOTPHash(otp, user.otp_code);
    } catch {
      otpValid = false;
    }

    if (!otpValid) {
      await pool.query(
        'UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = $1',
        [user.id]
      );
      const remaining = MAX_OTP_ATTEMPTS - (attempts + 1);
      await log(user.id, ACTIONS.RESET_PASSWORD_FAILED, 'failed', `Wrong OTP on password reset (${remaining} attempt(s) remaining)`, req);
      return res.status(401).json({ message: `Invalid OTP. ${remaining} attempt(s) remaining.` });
    }

    // Check password history
    const history = await pool.query(
      `SELECT password_hash FROM password_history
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );
    for (const record of history.rows) {
      if (verifyPassword(newPassword, record.password_hash)) {
        await log(user.id, ACTIONS.RESET_PASSWORD_FAILED, 'failed',
          `Attempted to reuse a recent password during reset`, req);
        return res.status(400).json({
          message: 'Cannot reuse a recent password. Please choose a different one.',
        });
      }
    }

    // Hash and save the new password
    const newSalt         = generateSalt();
    const newPasswordHash = hashPassword(newPassword, newSalt);

    await pool.query('UPDATE users SET password_hash = $1, otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0, password_changed_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]);
    await pool.query(
      'INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)',
      [userId, newPasswordHash]
    );

    await log(user.id, ACTIONS.RESET_PASSWORD, 'success',
      `Password reset successfully via OTP for "${user.username}"`, req);

    return res.json({ message: 'Password reset successful! You can now login with your new password.' });

  } catch (err) {
    next(err);
  }
}

// ============================================================
// POST /api/auth/logout  (protected)
// ============================================================
async function logout(req, res, next) {
  try {
    await pool.query('DELETE FROM sessions WHERE jti = $1', [req.userJti]);
    await log(req.user.id, ACTIONS.LOGOUT, 'success', `User logged out from one device`, req);
    res.clearCookie('token');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh-token' });
    return res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// POST /api/auth/logout-all  (protected)
// ============================================================
async function logoutAll(req, res, next) {
  try {
    const result = await pool.query(
      'DELETE FROM sessions WHERE user_id = $1 RETURNING id',
      [req.user.id]
    );
    const count = result.rowCount;
    await log(req.user.id, ACTIONS.LOGOUT_ALL, 'success',
      `Logged out from all ${count} device(s)`, req);
    res.clearCookie('token');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh-token' });
    return res.json({ message: `Logged out from all ${count} device(s).` });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// GET /api/auth/sessions  (protected)
// ============================================================
async function getSessions(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, jti, ip_address, device_info, created_at, last_used_at
       FROM sessions
       WHERE user_id = $1
       ORDER BY last_used_at DESC`,
      [req.user.id]
    );
    const sessions = result.rows.map(s => ({
      ...s,
      isCurrent: s.jti === req.userJti,
    }));
    return res.json({ sessions });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// GET /api/auth/me  (protected)
// ============================================================
async function getMe(req, res) {
  return res.json({ user: req.user });
}

// ============================================================
// POST /api/auth/request-change-password-link  (protected)
// ============================================================
async function requestChangePasswordLink(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await pool.query('SELECT username, email, password_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' });

    const user = result.rows[0];

    const secret = process.env.JWT_SECRET + user.password_hash;
    const token = jwt.sign({ id: userId, type: 'change-password-link' }, secret, { expiresIn: '15m' });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5002';
    const link = `${frontendUrl}/set-new-password?token=${token}&id=${userId}`;

    try {
      await sendChangePasswordLink(user.email, user.username, link);
      if (isDev) console.log(`[CHANGE PWD LINK] Sent to ${user.email} — Link: ${link}`);
    } catch (emailErr) {
      console.error('[CHANGE PWD LINK] Email failed:', emailErr.message);
      if (isDev) console.log(`[CHANGE PWD LINK] Fallback — User: ${user.username} | Link: ${link}`);
    }

    await log(userId, ACTIONS.CHANGE_PASSWORD, 'success', `Change password link sent to ${user.email}`, req);

    return res.json({ message: 'A secure password change link has been sent to your email. Please check your inbox.' });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// POST /api/auth/verify-change-password-link  (public, but requires token)
// ============================================================
async function verifyChangePasswordLink(req, res, next) {
  try {
    const { id, token, newPassword } = req.body;

    if (!validatePassword(newPassword)) {
      const msg = passwordErrorMessage(newPassword) || 'Password does not meet requirements.';
      return res.status(400).json({ message: msg });
    }
    if (isLeakedPassword(newPassword)) {
      await log(id, ACTIONS.CHANGE_PASSWORD_FAILED, 'failed', `Leaked password used for email link reset`, req);
      return res.status(400).json({ message: 'This password is commonly used and easy to crack. Please choose a stronger password.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' });

    const user = result.rows[0];
    const secret = process.env.JWT_SECRET + user.password_hash;

    try {
      const decoded = jwt.verify(token, secret);
      if (decoded.id !== parseInt(id) || decoded.type !== 'change-password-link') {
        throw new Error('Invalid token payload');
      }
    } catch (tokenErr) {
      await log(id, ACTIONS.CHANGE_PASSWORD_FAILED, 'failed', `Invalid or expired password change link`, req);
      return res.status(400).json({ message: 'The secure link is invalid or has expired. Please request a new one.' });
    }

    // Check password history (last 5)
    const history = await pool.query(
      `SELECT password_hash FROM password_history
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [id]
    );
    for (const record of history.rows) {
      if (verifyPassword(newPassword, record.password_hash)) {
        await log(user.id, ACTIONS.CHANGE_PASSWORD_FAILED, 'failed', `Attempted to reuse a recent password during link reset`, req);
        return res.status(400).json({ message: 'Cannot reuse a recent password. Please choose a different one.' });
      }
    }

    // Hash and save new password
    const newSalt         = generateSalt();
    const newPasswordHash = hashPassword(newPassword, newSalt);

    await pool.query('UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2', [newPasswordHash, id]);
    await pool.query(
      'INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)',
      [id, newPasswordHash]
    );

    // Logout all active sessions for security
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [id]);

    await log(id, ACTIONS.CHANGE_PASSWORD, 'success', `Password changed successfully via email link`, req);

    return res.json({ message: 'Password changed successfully! You will now be logged out of all devices.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login, requestOTP, verifyOTP, refreshToken,
  changePassword, forgotPassword, resetPassword,
  requestChangePasswordLink, verifyChangePasswordLink,
  logout, logoutAll, getSessions, getMe,
};
