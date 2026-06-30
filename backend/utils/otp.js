// ============================================================
// otp.js — One-Time Password (OTP) generator
// ============================================================

const crypto  = require('crypto');
const bcrypt  = require('bcryptjs');

// Generate a random 6-digit OTP using crypto.randomInt()
function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

// Get the expiry time: 5 minutes from now
function getOTPExpiry() {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 5);
  return expiry;
}

// Hash an OTP with bcrypt before storing in DB
function hashOTP(otp) {
  return bcrypt.hashSync(String(otp), 10);
}

// Verify an OTP against a stored bcrypt hash
function verifyOTPHash(inputOTP, storedHash) {
  return bcrypt.compareSync(String(inputOTP), storedHash);
}

module.exports = { generateOTP, getOTPExpiry, hashOTP, verifyOTPHash };
