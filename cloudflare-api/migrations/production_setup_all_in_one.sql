-- Ikai.One production operational database setup (single-run script)
-- Run manually in Neon SQL Editor against database "neondb", production branch.
-- Safe intent: create missing operational tables/indexes only; never DROP or replace existing tables.
-- Requires the existing authentication foundation: ikai.organizations and ikai.users.
-- Take a Neon restore point/backup before running on production.
BEGIN;

DO $preflight$
BEGIN
  IF to_regnamespace('ikai') IS NULL THEN
    RAISE EXCEPTION 'Preflight failed: schema ikai does not exist. No operational tables were created.';
  END IF;
  IF to_regclass('ikai.organizations') IS NULL THEN
    RAISE EXCEPTION 'Preflight failed: ikai.organizations is missing. No operational tables were created.';
  END IF;
  IF to_regclass('ikai.users') IS NULL THEN
    RAISE EXCEPTION 'Preflight failed: ikai.users is missing. No operational tables were created.';
  END IF;
END
$preflight$;

-- 1. COD reconciliation and organization audit trail
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
  ON ikai.cod_reconciliations (organization_id, awb) WHERE awb IS NOT NULL;

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

-- 2. Inventory and stock movement history
CREATE TABLE IF NOT EXISTS ikai.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ikai.organizations(id) ON DELETE CASCADE,
  sku varchar(100) NOT NULL,
  name varchar(200) NOT NULL,
  variant varchar(160),
  warehouse varchar(160) NOT NULL DEFAULT 'Main warehouse',
  quantity_on_hand integer NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  reorder_level integer NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  unit_cost numeric(14,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  created_by uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_items_org_sku_unique UNIQUE (organization_id, sku)
);
CREATE INDEX IF NOT EXISTS inventory_items_org_updated_idx
  ON ikai.inventory_items (organization_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS inventory_items_org_stock_idx
  ON ikai.inventory_items (organization_id, quantity_on_hand, reorder_level);

CREATE TABLE IF NOT EXISTS ikai.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ikai.organizations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES ikai.inventory_items(id) ON DELETE CASCADE,
  movement_type varchar(32) NOT NULL CHECK (movement_type IN ('opening_balance','receipt','adjustment_in','adjustment_out','correction')),
  quantity_delta integer NOT NULL CHECK (quantity_delta <> 0),
  quantity_before integer NOT NULL CHECK (quantity_before >= 0),
  quantity_after integer NOT NULL CHECK (quantity_after >= 0),
  reason varchar(500) NOT NULL,
  reference varchar(120),
  actor_user_id uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_movement_math CHECK (quantity_after = quantity_before + quantity_delta)
);
CREATE INDEX IF NOT EXISTS inventory_movements_org_item_time_idx
  ON ikai.inventory_movements (organization_id, item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_movements_org_time_idx
  ON ikai.inventory_movements (organization_id, created_at DESC);

-- 3. Orders and order line items
CREATE TABLE IF NOT EXISTS ikai.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ikai.organizations(id) ON DELETE CASCADE,
  order_number varchar(40) NOT NULL,
  customer_name varchar(200) NOT NULL,
  phone varchar(40) NOT NULL,
  email varchar(254),
  address text NOT NULL,
  pincode varchar(12) NOT NULL,
  city varchar(120) NOT NULL,
  state varchar(120) NOT NULL,
  channel varchar(40) NOT NULL DEFAULT 'Manual',
  payment_mode varchar(20) NOT NULL CHECK (payment_mode IN ('COD','Prepaid')),
  courier varchar(100),
  weight numeric(10,3) NOT NULL CHECK (weight > 0),
  length_cm numeric(10,2) NOT NULL DEFAULT 1 CHECK (length_cm > 0),
  width_cm numeric(10,2) NOT NULL DEFAULT 1 CHECK (width_cm > 0),
  height_cm numeric(10,2) NOT NULL DEFAULT 1 CHECK (height_cm > 0),
  notes text,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  status varchar(32) NOT NULL DEFAULT 'New' CHECK (status IN ('New','Ready to Ship','Processing','Shipped','Delivered','Cancelled','NDR raised','RTO')),
  created_by uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_org_number_unique UNIQUE (organization_id, order_number),
  CONSTRAINT orders_id_org_unique UNIQUE (id, organization_id)
);
CREATE INDEX IF NOT EXISTS orders_org_created_idx
  ON ikai.orders (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_org_status_idx
  ON ikai.orders (organization_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS ikai.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ikai.organizations(id) ON DELETE CASCADE,
  order_id uuid NOT NULL,
  sku varchar(100),
  product_name varchar(200) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_items_order_org_fk FOREIGN KEY (order_id, organization_id)
    REFERENCES ikai.orders(id, organization_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS order_items_org_order_idx
  ON ikai.order_items (organization_id, order_id);

-- 4. Shipment records and internal event history (does not integrate/book couriers)
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

-- 5. Organization-scoped operational workflow register
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

-- Verify all required operational tables exist before committing.
DO $verify$
DECLARE
  missing_tables text;
BEGIN
  SELECT string_agg(t.table_name, ', ' ORDER BY t.table_name)
    INTO missing_tables
  FROM (VALUES
    ('cod_reconciliations'),
    ('organization_audit_events'),
    ('inventory_items'),
    ('inventory_movements'),
    ('orders'),
    ('order_items'),
    ('shipment_records'),
    ('shipment_events'),
    ('workflow_records')
  ) AS t(table_name)
  WHERE to_regclass('ikai.' || t.table_name) IS NULL;

  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Verification failed; missing tables: %', missing_tables;
  END IF;
END
$verify$;

-- After successful execution, verify with:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'ikai'
-- AND table_name IN ('cod_reconciliations','organization_audit_events',
-- 'inventory_items','inventory_movements','orders','order_items',
-- 'shipment_records','shipment_events','workflow_records')
-- ORDER BY table_name;

COMMIT;

-- After successful execution, verify with:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'ikai'
-- AND table_name IN ('cod_reconciliations','organization_audit_events',
-- 'inventory_items','inventory_movements','orders','order_items',
-- 'shipment_records','shipment_events')
-- ORDER BY table_name;
