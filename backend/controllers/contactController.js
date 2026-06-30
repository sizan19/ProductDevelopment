// ============================================================
// contactController.js — Public "Contact Us" inquiry submission
// ============================================================
// Customers do NOT need an account or password to submit an
// inquiry. The 7 CSE fields are validated (see validate.js),
// sanitised, stored in the `inquiries` table, and logged.
// ============================================================

const pool                  = require('../db');
const { log }               = require('../utils/logger');
const { sanitize }          = require('../utils/validator');
const { verifyTurnstile }   = require('../utils/turnstile');

// POST /api/contact
async function submitInquiry(req, res, next) {
  try {
    // Protect the public form with the existing Cloudflare Turnstile.
    const captchaOk = await verifyTurnstile(req.body.turnstileToken);
    if (!captchaOk) {
      await log(null, 'CAPTCHA_FAILED', 'failed', 'Turnstile failed on Contact Us submission', req);
      return res.status(400).json({ message: 'CAPTCHA verification failed. Please try again.' });
    }

    const full_name   = sanitize(req.body.full_name || '');
    const email       = sanitize(req.body.email     || '').toLowerCase().trim();
    const phone       = sanitize(req.body.phone     || '');
    const company     = sanitize(req.body.company   || '');
    const country     = sanitize(req.body.country   || '');
    const job_title   = sanitize(req.body.job_title || '');
    const job_details = sanitize(req.body.job_details || '');

    const result = await pool.query(
      `INSERT INTO inquiries (full_name, email, phone, company, country, job_title, job_details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [full_name, email, phone || null, company || null, country || null, job_title || null, job_details]
    );

    await log(
      null,
      'INQUIRY_RECEIVED',
      'success',
      `New customer inquiry from "${full_name}" (${email})${company ? ` @ ${company}` : ''}`,
      req
    );

    return res.status(201).json({
      message: 'Thank you! Your inquiry has been received. Our team will be in touch shortly.',
      inquiryId: result.rows[0].id,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitInquiry };
