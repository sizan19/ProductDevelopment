// ============================================================
// turnstile.js — Cloudflare Turnstile CAPTCHA verification
// ============================================================
// Shared helper so both the auth flow and the public Contact Us
// form can validate Turnstile tokens server-side against the
// existing TURNSTILE_SECRET_KEY. The browser never bypasses this.
// ============================================================

const axios = require('axios');

async function verifyTurnstile(token) {
  // If no token supplied, fail closed.
  if (!token) return false;
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

module.exports = { verifyTurnstile };
