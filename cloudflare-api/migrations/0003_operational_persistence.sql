-- Ikai.One Phase 5 operational persistence foundation.
-- Apply in Neon SQL Editor after the authentication migrations.
-- Stores reconciliation records and audit events per organization; no payment credentials are stored here.
BEGIN;

DO $preflight$
BEGIN
  IF to_regnamespace('ikai') IS NULL OR NOT (to_regclass('ikai.organizations') IS NOT NULL AND to_regclass('ikai.users') IS NOT NULL) THEN
    RAISE EXCEPTION 'Preflight failed: expected Ikai.One schema and prerequisite tables (organizations, users) are missing.';
  END IF;
END
$preflight$;

CREATE TABLE IF NOT EXISTS ikai.cod_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ikai.organizations(id) ON DELETE CASCADE,
  order_reference text NOT NULL,
  awb text,
  courier_name text NOT NULL,
  delivered_at timestamptz,
  cod_expected numeric(12,2) NOT NULL CHECK (cod_expected >= 0),
  amount_remitted numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount_remitted >= 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'matched', 'short_paid', 'under_review', 'resolved')),
  follow_up_note text,
  remittance_reference text,
  created_by uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, order_reference)
);

CREATE INDEX IF NOT EXISTS cod_reconciliations_org_status_idx
  ON ikai.cod_reconciliations (organization_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS cod_reconciliations_org_awb_idx
  ON ikai.cod_reconciliations (organization_id, awb)
  WHERE awb IS NOT NULL;

CREATE TABLE IF NOT EXISTS ikai.organization_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ikai.organizations(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (length(event_type) BETWEEN 1 AND 100),
  entity_type text NOT NULL CHECK (length(entity_type) BETWEEN 1 AND 100),
  entity_reference text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organization_audit_events_org_created_idx
  ON ikai.organization_audit_events (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS organization_audit_events_entity_idx
  ON ikai.organization_audit_events (organization_id, entity_type, entity_reference);

COMMIT;
