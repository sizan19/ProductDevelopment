-- ============================================================
-- schema.sql — Database tables for the AI-Solutions website
-- ============================================================
-- Database: ai_solutions (or reuse the existing auth_db).
-- Apply with:
--   psql -U postgres -d auth_db -f database/schema.sql
-- Then seed sample data + admin with:
--   node backend/seed.js
-- ============================================================

-- ============================================================
-- AUTH / ADMIN TABLES
-- ============================================================
-- There are NO public user accounts. The only accounts are
-- administrators, created by the seed script (not self-service
-- registration). RBAC is therefore unnecessary — every row is
-- an admin — but the role column is kept for defense-in-depth.
-- ============================================================

-- Admin accounts
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(30) UNIQUE NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            VARCHAR(10) DEFAULT 'admin' CHECK (role IN ('admin')),
  failed_attempts INTEGER DEFAULT 0,
  locked_until    TIMESTAMP,
  email_verified      BOOLEAN DEFAULT true,    -- admins are pre-verified by the seed script
  password_changed_at TIMESTAMP DEFAULT NOW(), -- tracks when password was last changed (expires after 90 days)
  otp_code            TEXT,                    -- stores bcrypt hash of the login OTP
  otp_expires_at  TIMESTAMP,
  otp_attempts    INTEGER DEFAULT 0,           -- tracks wrong OTP guesses (max 3)
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Password history — prevents reuse of the last 5 passwords
CREATE TABLE IF NOT EXISTS password_history (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Sessions — tracks every logged-in admin device
CREATE TABLE IF NOT EXISTS sessions (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  jti          VARCHAR(64) NOT NULL,          -- JWT ID for access token
  refresh_jti  VARCHAR(64),                   -- JWT ID for refresh token
  ip_address   VARCHAR(45),
  device_info  TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW()
);

-- Activity logs — full audit trail
CREATE TABLE IF NOT EXISTS logs (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(50) NOT NULL,
  status     VARCHAR(10) NOT NULL CHECK (status IN ('success', 'failed', 'warning')),
  details    TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PUBLIC WEBSITE CONTENT TABLES
-- ============================================================

-- Customer inquiries — submitted via the public "Contact Us" form.
-- Captures the 7 CSE fields. No account/password is required to submit.
CREATE TABLE IF NOT EXISTS inquiries (
  id          SERIAL PRIMARY KEY,
  full_name   VARCHAR(120) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(40),
  company     VARCHAR(160),
  country     VARCHAR(80),
  job_title   VARCHAR(120),
  job_details TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Software solutions / services offered to customers
CREATE TABLE IF NOT EXISTS solutions (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(160) NOT NULL,
  summary     VARCHAR(300) NOT NULL,
  description TEXT,
  icon        VARCHAR(40)  DEFAULT 'robot',  -- icon key used by the frontend
  sort_order  INTEGER      DEFAULT 0,
  is_active   BOOLEAN      DEFAULT true,
  created_at  TIMESTAMP    DEFAULT NOW()
);

-- Case studies — "highlights of past industry solutions"
CREATE TABLE IF NOT EXISTS case_studies (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR(180) NOT NULL,
  client     VARCHAR(160),
  industry   VARCHAR(120),
  summary    VARCHAR(400) NOT NULL,
  outcome    TEXT,
  image_url  TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer feedback with star ratings
CREATE TABLE IF NOT EXISTS feedback (
  id            SERIAL PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  company       VARCHAR(160),
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT NOT NULL,
  is_published  BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Promotional articles
CREATE TABLE IF NOT EXISTS articles (
  id           SERIAL PRIMARY KEY,
  slug         VARCHAR(180) UNIQUE NOT NULL,
  title        VARCHAR(200) NOT NULL,
  excerpt      VARCHAR(400),
  body         TEXT NOT NULL,
  cover_image  TEXT,
  author       VARCHAR(120) DEFAULT 'AI-Solutions Team',
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMP DEFAULT NOW(),
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Promotional + upcoming events
CREATE TABLE IF NOT EXISTS events (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  location    VARCHAR(180),
  event_date  DATE,
  is_upcoming BOOLEAN DEFAULT false,
  cover_image TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Photo gallery — images optionally tied to an event
CREATE TABLE IF NOT EXISTS gallery_images (
  id         SERIAL PRIMARY KEY,
  event_id   INTEGER REFERENCES events(id) ON DELETE SET NULL,
  image_url  TEXT NOT NULL,
  caption    VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_id     ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_jti         ON sessions(jti);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_jti ON sessions(refresh_jti);
CREATE INDEX IF NOT EXISTS idx_logs_created_at      ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_id         ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action          ON logs(action);
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solutions_active     ON solutions(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_feedback_published   ON feedback(is_published);
CREATE INDEX IF NOT EXISTS idx_articles_slug        ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published   ON articles(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_date          ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_event        ON gallery_images(event_id);
