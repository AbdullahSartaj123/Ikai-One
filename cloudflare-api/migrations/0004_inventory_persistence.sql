-- Ikai.One inventory persistence foundation.
-- Apply this migration in the production Neon SQL Editor before enabling inventory writes.
BEGIN;

DO $preflight$
BEGIN
  IF to_regnamespace('ikai') IS NULL OR NOT (to_regclass('ikai.organizations') IS NOT NULL AND to_regclass('ikai.users') IS NOT NULL) THEN
    RAISE EXCEPTION 'Expected Ikai.One prerequisite tables are missing: organizations, users.';
  END IF;
END
$preflight$;
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

COMMIT;
