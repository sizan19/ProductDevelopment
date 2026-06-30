// ============================================================
// hash.js — Password hashing using bcrypt
// ============================================================

const bcrypt = require('bcryptjs');

function generateSalt() {
  return bcrypt.genSaltSync(10);
}

function hashPassword(password, salt) {
  return bcrypt.hashSync(password, salt);
}

function verifyPassword(inputPassword, storedHash) {
  return bcrypt.compareSync(inputPassword, storedHash);
}

module.exports = { generateSalt, hashPassword, verifyPassword };
