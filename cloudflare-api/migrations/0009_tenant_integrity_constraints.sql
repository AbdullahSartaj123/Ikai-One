-- Ikai.One tenant-integrity constraints for inventory and shipment relationships.
-- Apply after migrations 0001-0008. This migration is additive and never changes or deletes existing rows.
BEGIN;

DO $preflight$
DECLARE
  missing_tables text;
  mismatched_inventory bigint;
  mismatched_shipments bigint;
  mismatched_events bigint;
BEGIN
  SELECT string_agg(required.table_name, ', ' ORDER BY required.table_name)
    INTO missing_tables
  FROM (VALUES
    ('organizations'), ('users'), ('inventory_items'), ('inventory_movements'),
    ('orders'), ('shipment_records'), ('shipment_events')
  ) AS required(table_name)
  WHERE to_regclass('ikai.' || required.table_name) IS NULL;

  IF to_regnamespace('ikai') IS NULL OR missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Tenant integrity migration preflight failed. Missing Ikai.One tables: %',
      COALESCE(missing_tables, 'schema ikai');
  END IF;

  SELECT count(*) INTO mismatched_inventory
  FROM ikai.inventory_movements movement
  JOIN ikai.inventory_items item ON item.id = movement.item_id
  WHERE item.organization_id <> movement.organization_id;

  SELECT count(*) INTO mismatched_shipments
  FROM ikai.shipment_records shipment
  JOIN ikai.orders orders ON orders.id = shipment.order_id
  WHERE orders.organization_id <> shipment.organization_id;

  SELECT count(*) INTO mismatched_events
  FROM ikai.shipment_events event
  JOIN ikai.shipment_records shipment ON shipment.id = event.shipment_id
  WHERE shipment.organization_id <> event.organization_id;

  IF mismatched_inventory > 0 OR mismatched_shipments > 0 OR mismatched_events > 0 THEN
    RAISE EXCEPTION
      'Tenant integrity migration stopped without modifying data. Cross-tenant references found: inventory_movements=%, shipment_records=%, shipment_events=%. Review and reconcile these rows before retrying.',
      mismatched_inventory, mismatched_shipments, mismatched_events;
  END IF;
END
$preflight$;

-- Composite candidate keys allow child records to prove tenant ownership in their foreign keys.
DO $constraints$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'ikai.inventory_items'::regclass
      AND conname = 'inventory_items_id_org_unique'
  ) THEN
    ALTER TABLE ikai.inventory_items
      ADD CONSTRAINT inventory_items_id_org_unique UNIQUE (id, organization_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'ikai.shipment_records'::regclass
      AND conname = 'shipment_records_id_org_unique'
  ) THEN
    ALTER TABLE ikai.shipment_records
      ADD CONSTRAINT shipment_records_id_org_unique UNIQUE (id, organization_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'ikai.inventory_movements'::regclass
      AND conname = 'inventory_movements_item_org_fk'
  ) THEN
    ALTER TABLE ikai.inventory_movements
      ADD CONSTRAINT inventory_movements_item_org_fk
      FOREIGN KEY (item_id, organization_id)
      REFERENCES ikai.inventory_items (id, organization_id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'ikai.shipment_records'::regclass
      AND conname = 'shipment_records_order_org_fk'
  ) THEN
    ALTER TABLE ikai.shipment_records
      ADD CONSTRAINT shipment_records_order_org_fk
      FOREIGN KEY (order_id, organization_id)
      REFERENCES ikai.orders (id, organization_id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'ikai.shipment_events'::regclass
      AND conname = 'shipment_events_shipment_org_fk'
  ) THEN
    ALTER TABLE ikai.shipment_events
      ADD CONSTRAINT shipment_events_shipment_org_fk
      FOREIGN KEY (shipment_id, organization_id)
      REFERENCES ikai.shipment_records (id, organization_id)
      ON DELETE CASCADE;
  END IF;
END
$constraints$;

DO $verify$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'ikai.inventory_movements'::regclass
      AND conname = 'inventory_movements_item_org_fk'
      AND contype = 'f' AND convalidated
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'ikai.shipment_records'::regclass
      AND conname = 'shipment_records_order_org_fk'
      AND contype = 'f' AND convalidated
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'ikai.shipment_events'::regclass
      AND conname = 'shipment_events_shipment_org_fk'
      AND contype = 'f' AND convalidated
  ) THEN
    RAISE EXCEPTION 'Tenant integrity verification failed: one or more composite foreign keys are missing or not validated.';
  END IF;
END
$verify$;

COMMIT;
