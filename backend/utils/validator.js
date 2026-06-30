// ============================================================
// validator.js — Input validation and sanitization
// ============================================================
// Always validate user input before storing it in the database.
// This protects against bad data and injection attacks.
// ============================================================

const fs = require('fs');
const path = require('path');

// Load simple leaked passwords dictionary into memory
let leakedPasswords = new Set();
try {
  const filePath = path.join(__dirname, '..', 'leaked_passwords.txt');
  const data = fs.readFileSync(filePath, 'utf8');
  data.split(/\r?\n/).forEach(line => {
    const pwd = line.trim();
    if (pwd) leakedPasswords.add(pwd);
  });
} catch (err) {
  console.warn('Could not load leaked_passwords.txt. Leaked password checking is disabled.');
}

// Check if email format is valid (e.g. user@example.com)
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Username: only letters, numbers, underscores. Length 3-30.
function validateUsername(username) {
  const regex = /^[a-zA-Z0-9_]{3,30}$/;
  return regex.test(username);
}

// Check if password exists in our leaked passwords file
function isLeakedPassword(password) {
  return leakedPasswords.has(password);
}

// Password must be at least 8 characters and contain:
// - at least 1 uppercase letter
// - at least 1 lowercase letter
// - at least 1 number
// - at least 1 special character
function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;  // uppercase
  if (!/[a-z]/.test(password)) return false;  // lowercase
  if (!/[0-9]/.test(password)) return false;  // digit
  if (!/[^a-zA-Z0-9]/.test(password)) return false; // special char
  return true;
}

// Returns a user-friendly message about what's missing from the password
function getPasswordErrors(password) {
  const errors = [];
  if (typeof password !== 'string') return ['Password is required.'];
  if (password.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('a number');
  if (!/[^a-zA-Z0-9]/.test(password)) errors.push('a special character');
  return errors;
}

// Sanitize input to prevent XSS (cross-site scripting)
// This escapes HTML special characters like < > & " '
function sanitize(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Password strength checker — returns 'weak', 'medium', or 'strong'
// Used on the frontend to show a live strength indicator
function checkPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)              score++; // basic length
  if (password.length >= 12)             score++; // longer = better
  if (/[A-Z]/.test(password))            score++; // has uppercase
  if (/[0-9]/.test(password))            score++; // has number
  if (/[^a-zA-Z0-9]/.test(password))    score++; // has special char

  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

module.exports = {
  validateEmail,
  validateUsername,
  validatePassword,
  getPasswordErrors,
  isLeakedPassword,
  sanitize,
  checkPasswordStrength,
};
