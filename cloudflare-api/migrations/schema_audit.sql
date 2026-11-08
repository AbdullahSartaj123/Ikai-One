-- Ikai.One PostgreSQL read-only schema audit.
-- Run in Neon SQL Editor against the target database. This script does not change application data or schema.
-- Capture all result sets before declaring a database environment audited.

-- 1. Confirm the schema and whether a migration ledger exists.
SELECT
  current_database() AS database_name,
  current_schema() AS session_schema,
  to_regnamespace('ikai') IS NOT NULL AS ikai_schema_exists,
  to_regclass('ikai.organizations') IS NOT NULL AS organizations_exists,
  to_regclass('ikai.users') IS NOT NULL AS users_exists,
  to_regclass('ikai.schema_migrations') IS NOT NULL AS migration_ledger_exists;

-- 2. Application tables and estimated row counts (catalog estimates, not exact counts).
SELECT
  schemaname,
  relname AS tablename,
  n_live_tup AS estimated_live_rows,
  n_dead_tup AS estimated_dead_rows,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'ikai'
ORDER BY tablename;

-- 3. Complete column inventory, including nullability, defaults and generated/identity attributes.
SELECT
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  character_maximum_length,
  numeric_precision,
  numeric_scale,
  is_nullable,
  column_default,
  is_identity,
  is_generated
FROM information_schema.columns
WHERE table_schema = 'ikai'
ORDER BY table_name, ordinal_position;

-- 4. Primary keys, unique constraints, check constraints and foreign keys.
SELECT
  table_name,
  constraint_name,
  constraint_type,
  is_deferrable,
  initially_deferred
FROM information_schema.table_constraints
WHERE table_schema = 'ikai'
ORDER BY table_name, constraint_type, constraint_name;

-- 5. Full index definitions, including predicates and validity.
SELECT
  table_name,
  index_name,
  index_definition,
  indisvalid AS is_valid,
  indisready AS is_ready
FROM (
  SELECT
    t.relname AS table_name,
    i.relname AS index_name,
    pg_get_indexdef(i.oid) AS index_definition,
    ix.indisvalid,
    ix.indisready
  FROM pg_class t
  JOIN pg_namespace n ON n.oid = t.relnamespace
  JOIN pg_index ix ON ix.indrelid = t.oid
  JOIN pg_class i ON i.oid = ix.indexrelid
  WHERE n.nspname = 'ikai'
) indexes
ORDER BY table_name, index_name;

-- 6. Foreign-key column mapping and validation state.
SELECT
  child.relname AS child_table,
  constraint_row.conname AS foreign_key,
  pg_get_constraintdef(constraint_row.oid) AS definition,
  constraint_row.convalidated AS is_validated,
  parent.relname AS parent_table
FROM pg_constraint constraint_row
JOIN pg_class child ON child.oid = constraint_row.conrelid
JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
JOIN pg_class parent ON parent.oid = constraint_row.confrelid
WHERE constraint_row.contype = 'f'
  AND child_ns.nspname = 'ikai'
ORDER BY child_table, foreign_key;

-- 7. Detect the three known cross-tenant relationship risks before migration 0009.
-- If a required table is missing, report that the check could not run instead of failing.
DO $tenant_audit$
DECLARE
  required_tables text[] := ARRAY[
    'inventory_items', 'inventory_movements', 'orders',
    'shipment_records', 'shipment_events'
  ];
  missing_tables text;
  inventory_mismatch bigint;
  shipment_mismatch bigint;
  event_mismatch bigint;
BEGIN
  SELECT string_agg(required.table_name, ', ' ORDER BY required.table_name)
    INTO missing_tables
  FROM unnest(required_tables) AS required(table_name)
  WHERE to_regclass('ikai.' || required.table_name) IS NULL;

  IF missing_tables IS NOT NULL THEN
    RAISE NOTICE 'Cross-tenant relationship checks NOT RUN. Missing tables: %', missing_tables;
    RETURN;
  END IF;

  EXECUTE 'SELECT count(*) FROM ikai.inventory_movements m JOIN ikai.inventory_items i ON i.id = m.item_id WHERE i.organization_id <> m.organization_id'
    INTO inventory_mismatch;
  EXECUTE 'SELECT count(*) FROM ikai.shipment_records s JOIN ikai.orders o ON o.id = s.order_id WHERE o.organization_id <> s.organization_id'
    INTO shipment_mismatch;
  EXECUTE 'SELECT count(*) FROM ikai.shipment_events e JOIN ikai.shipment_records s ON s.id = e.shipment_id WHERE s.organization_id <> e.organization_id'
    INTO event_mismatch;

  RAISE NOTICE 'Cross-tenant reference counts: inventory_movements=%, shipment_records=%, shipment_events=%',
    inventory_mismatch, shipment_mismatch, event_mismatch;
END
$tenant_audit$;

-- 8. Migration tracking cannot be reconstructed from file presence alone.
-- If this returns false, compare the database catalog to each migration manually;
-- do not assume a migration ran merely because its SQL file exists in Git.
SELECT to_regclass('ikai.schema_migrations') IS NOT NULL AS migration_ledger_exists;
