-- Phase 1 authentication rate limits.
-- Each key stores a fixed-window counter for one source IP and authentication endpoint.
BEGIN;

DO $preflight$
BEGIN
  IF to_regnamespace('ikai') IS NULL THEN
    RAISE EXCEPTION 'Schema ikai is missing.';
  END IF;
END
$preflight$;
CREATE TABLE IF NOT EXISTS ikai.auth_rate_limits (
  bucket_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_rate_limits_updated_at_idx
  ON ikai.auth_rate_limits (updated_at);

COMMIT;
