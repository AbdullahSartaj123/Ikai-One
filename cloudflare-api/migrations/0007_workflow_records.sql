-- Adds organization-scoped persistence for operational workflow registers.
-- Safe to run after the existing Ikai.One production setup. No existing tables are altered or dropped.
BEGIN;
DO $preflight$
BEGIN
  IF to_regnamespace('ikai') IS NULL OR to_regclass('ikai.organizations') IS NULL OR to_regclass('ikai.users') IS NULL THEN
    RAISE EXCEPTION 'Preflight failed: expected Ikai.One schema and authentication tables are missing.';
  END IF;
END
$preflight$;
CREATE TABLE IF NOT EXISTS ikai.workflow_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ikai.organizations(id) ON DELETE CASCADE,
  workflow_key text NOT NULL CHECK (workflow_key ~ '^[a-z0-9-]{1,80}$'),
  reference text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Open',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workflow_records_org_key_updated_idx
  ON ikai.workflow_records (organization_id, workflow_key, updated_at DESC);
CREATE INDEX IF NOT EXISTS workflow_records_org_key_status_idx
  ON ikai.workflow_records (organization_id, workflow_key, status);
CREATE INDEX IF NOT EXISTS workflow_records_payload_gin_idx
  ON ikai.workflow_records USING gin (payload);
COMMIT;
