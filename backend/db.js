// ============================================================
// db.js — PostgreSQL database connection
// ============================================================
// We use the 'pg' package to talk to PostgreSQL.
// A "Pool" keeps multiple connections open so requests don't
// have to wait for a single connection to free up.
// ============================================================

const { Pool } = require('pg');

// Read database settings from .env file
const pool = new Pool({
  host:     process.env.DB_HOST,     // e.g. 'localhost'
  port:     process.env.DB_PORT,     // e.g. 5432
  database: process.env.DB_NAME,     // e.g. 'auth_db'
  user:     process.env.DB_USER,     // e.g. 'postgres'
  password: process.env.DB_PASSWORD, // your postgres password
});

// Test the connection when the server starts
pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to PostgreSQL database!');
  }
});

module.exports = pool;
