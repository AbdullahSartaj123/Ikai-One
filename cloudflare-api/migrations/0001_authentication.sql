-- Ikai.One Phase 1 authentication tables.
-- Run once in Neon SQL Editor before enabling registration.
BEGIN;

CREATE TABLE IF NOT EXISTS ikai.auth_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES ikai.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  email_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ikai.auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES ikai.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  purpose text NOT NULL CHECK (purpose IN ('verify_email', 'password_reset')),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ikai.auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES ikai.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

CREATE INDEX IF NOT EXISTS auth_tokens_user_purpose_idx
  ON ikai.auth_tokens (user_id, purpose, expires_at DESC);
CREATE INDEX IF NOT EXISTS auth_sessions_user_expiry_idx
  ON ikai.auth_sessions (user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS auth_sessions_active_idx
  ON ikai.auth_sessions (token_hash, expires_at)
  WHERE revoked_at IS NULL;

COMMIT;
