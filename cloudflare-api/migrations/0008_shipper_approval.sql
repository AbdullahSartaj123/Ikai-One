-- Ikai.One shipper application approval and platform administrator registry.
-- Existing organizations default to approved to avoid locking out current customers; new public signups explicitly start pending.
-- Platform administrator membership is provisioned manually by a trusted database operator; there is no self-service elevation endpoint.
BEGIN;
DO $preflight$
BEGIN
  IF to_regnamespace('ikai') IS NULL OR to_regclass('ikai.organizations') IS NULL OR to_regclass('ikai.users') IS NULL THEN
    RAISE EXCEPTION 'Preflight failed: expected Ikai.One schema and authentication tables are missing.';
  END IF;
END
$preflight$;

ALTER TABLE ikai.organizations
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approval_reviewed_by uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approval_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_note text;

DO $constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'ikai.organizations'::regclass
      AND conname = 'organizations_approval_status_check'
  ) THEN
    ALTER TABLE ikai.organizations
      ADD CONSTRAINT organizations_approval_status_check
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END
$constraint$;

CREATE INDEX IF NOT EXISTS organizations_approval_status_created_idx
  ON ikai.organizations (approval_status, created_at DESC)
  WHERE organization_type = 'shipper';

CREATE TABLE IF NOT EXISTS ikai.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES ikai.users(id) ON DELETE CASCADE,
  created_by uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ikai.platform_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES ikai.users(id) ON DELETE RESTRICT,
  target_organization_id uuid REFERENCES ikai.organizations(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (length(event_type) BETWEEN 1 AND 100),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_audit_events_created_idx
  ON ikai.platform_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS platform_audit_events_target_org_idx
  ON ikai.platform_audit_events (target_organization_id, created_at DESC);

COMMIT;
