-- Shipment records and event history for Ikai.One.
BEGIN;

DO $preflight$
BEGIN
  IF to_regnamespace('ikai') IS NULL OR NOT (to_regclass('ikai.organizations') IS NOT NULL AND to_regclass('ikai.users') IS NOT NULL AND to_regclass('ikai.orders') IS NOT NULL) THEN
    RAISE EXCEPTION 'Expected Ikai.One prerequisite tables are missing: organizations, users, orders.';
  END IF;
END
$preflight$;
CREATE TABLE IF NOT EXISTS ikai.shipment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ikai.organizations(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES ikai.orders(id) ON DELETE CASCADE,
  shipment_number text NOT NULL,
  courier text NOT NULL DEFAULT 'Not booked',
  status text NOT NULL DEFAULT 'Label pending',
  origin text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  destination_postal_code text NOT NULL DEFAULT '',
  weight numeric(10,2) NOT NULL DEFAULT 0 CHECK (weight >= 0),
  amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  payment_mode text NOT NULL DEFAULT 'COD',
  tracking_number text,
  courier_booking_confirmed boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, shipment_number),
  UNIQUE (organization_id, order_id)
);
CREATE INDEX IF NOT EXISTS shipment_records_org_created_idx
  ON ikai.shipment_records (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS shipment_records_org_status_idx
  ON ikai.shipment_records (organization_id, status);

CREATE TABLE IF NOT EXISTS ikai.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ikai.organizations(id) ON DELETE CASCADE,
  shipment_id uuid NOT NULL REFERENCES ikai.shipment_records(id) ON DELETE CASCADE,
  status text NOT NULL,
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'internal',
  created_by uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shipment_events_org_shipment_time_idx
  ON ikai.shipment_events (organization_id, shipment_id, created_at DESC);

COMMIT;
