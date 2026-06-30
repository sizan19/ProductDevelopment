// ============================================================
// validate.js — Express-validator validation rules + middleware
// ============================================================
// Centralizes request validation so controllers stay clean.
// Each route can pick the validation chain it needs.
// ============================================================

const { body, query, validationResult } = require('express-validator');

// Middleware: run after validation chains — returns 400 if any field is invalid
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    return res.status(400).json({ message: messages[0], errors: messages });
  }
  next();
}

// ---- Auth validation chains --------------------------------

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address.'),
  body('password')
    .notEmpty().withMessage('Password is required.'),
  body('turnstileToken')
    .notEmpty().withMessage('CAPTCHA token is required.'),
];

const verifyOtpRules = [
  body('userId')
    .notEmpty().withMessage('User ID is required.')
    .isInt({ min: 1 }).withMessage('Invalid user ID.'),
  body('otp')
    .notEmpty().withMessage('OTP is required.')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.')
    .isNumeric().withMessage('OTP must be numeric.'),
];

const requestOtpRules = [
  body('userId')
    .notEmpty().withMessage('User ID is required.')
    .isInt({ min: 1 }).withMessage('Invalid user ID.'),
];

const changePasswordRules = [
  body('oldPassword')
    .notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('New password must contain an uppercase letter.')
    .matches(/[a-z]/).withMessage('New password must contain a lowercase letter.')
    .matches(/[0-9]/).withMessage('New password must contain a number.')
    .matches(/[^a-zA-Z0-9]/).withMessage('New password must contain a special character.'),
];

const forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address.'),
];

const resetPasswordRules = [
  body('userId')
    .notEmpty().withMessage('User ID is required.')
    .isInt({ min: 1 }).withMessage('Invalid user ID.'),
  body('otp')
    .notEmpty().withMessage('OTP is required.')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.')
    .isNumeric().withMessage('OTP must be numeric.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('New password must contain an uppercase letter.')
    .matches(/[a-z]/).withMessage('New password must contain a lowercase letter.')
    .matches(/[0-9]/).withMessage('New password must contain a number.')
    .matches(/[^a-zA-Z0-9]/).withMessage('New password must contain a special character.'),
];

const verifyChangePwdLinkRules = [
  body('id')
    .notEmpty().withMessage('User ID is required.'),
  body('token')
    .notEmpty().withMessage('Token is required.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('New password must contain an uppercase letter.')
    .matches(/[a-z]/).withMessage('New password must contain a lowercase letter.')
    .matches(/[0-9]/).withMessage('New password must contain a number.')
    .matches(/[^a-zA-Z0-9]/).withMessage('New password must contain a special character.'),
];

// ---- Public "Contact Us" validation chain ------------------

const contactRules = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ max: 120 }).withMessage('Full name is too long.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 40 }).withMessage('Phone number is too long.'),
  body('company')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 160 }).withMessage('Company name is too long.'),
  body('country')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 }).withMessage('Country is too long.'),
  body('job_title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 120 }).withMessage('Job title is too long.'),
  body('job_details')
    .trim()
    .notEmpty().withMessage('Please tell us about your requirements.')
    .isLength({ min: 5, max: 5000 }).withMessage('Job details must be 5-5000 characters.'),
  body('turnstileToken')
    .notEmpty().withMessage('Please complete the CAPTCHA challenge.'),
];

// ---- Admin validation chains --------------------------------

const adminLogsRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100.'),
  query('action').optional().isString().trim(),
  query('status').optional().isIn(['success', 'failed', 'warning']).withMessage('Status must be success, failed, or warning.'),
  query('search').optional().isString().trim(),
];

module.exports = {
  handleValidationErrors,
  loginRules,
  verifyOtpRules,
  requestOtpRules,
  changePasswordRules,
  forgotPasswordRules,
  resetPasswordRules,
  verifyChangePwdLinkRules,
  contactRules,
  adminLogsRules,
};
