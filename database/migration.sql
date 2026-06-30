-- ============================================================
-- migration.sql — Run this on an existing auth_db to add new columns
-- ============================================================

-- Add OTP brute-force attempt counter to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0;

-- Add email verification flag (default true for existing users who already logged in)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT true;

-- Add password expiry tracking (default NOW so existing users get 90 days from migration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT NOW();

-- Add refresh token JTI to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS refresh_jti VARCHAR(64);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_jti         ON sessions(jti);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_jti ON sessions(refresh_jti);
CREATE INDEX IF NOT EXISTS idx_logs_created_at      ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_id         ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action          ON logs(action);
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);
