import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("../migrations/0009_tenant_integrity_constraints.sql", import.meta.url), "utf8");

test("tenant integrity migration preflights all required tables and rejects cross-tenant legacy rows", () => {
  for (const table of ["organizations", "users", "inventory_items", "inventory_movements", "orders", "shipment_records", "shipment_events"]) {
    assert.ok(migration.includes("('" + table + "')"), "preflight must require " + table);
  }
  assert.match(migration, /mismatched_inventory/);
  assert.match(migration, /mismatched_shipments/);
  assert.match(migration, /mismatched_events/);
  assert.match(migration, /Cross-tenant references found/);
});

test("inventory movements are constrained to inventory items owned by the same organization", () => {
  assert.match(migration, /UNIQUE \(id, organization_id\)/);
  assert.match(migration, /CONSTRAINT inventory_movements_item_org_fk[\s\S]*FOREIGN KEY \(item_id, organization_id\)[\s\S]*REFERENCES ikai\.inventory_items \(id, organization_id\)/);
});

test("shipment records are constrained to orders owned by the same organization", () => {
  assert.match(migration, /CONSTRAINT shipment_records_order_org_fk[\s\S]*FOREIGN KEY \(order_id, organization_id\)[\s\S]*REFERENCES ikai\.orders \(id, organization_id\)/);
});

test("shipment events are constrained to shipments owned by the same organization", () => {
  assert.match(migration, /CONSTRAINT shipment_events_shipment_org_fk[\s\S]*FOREIGN KEY \(shipment_id, organization_id\)[\s\S]*REFERENCES ikai\.shipment_records \(id, organization_id\)/);
});

test("tenant integrity constraints are idempotently installed and verified before commit", () => {
  assert.equal((migration.match(/IF NOT EXISTS \(/g) || []).length, 5);
  assert.match(migration, /AND contype = 'f' AND convalidated/);
  assert.match(migration, /BEGIN;[\s\S]*COMMIT;/);
  assert.doesNotMatch(migration, /\bDROP\s+(TABLE|SCHEMA|DATABASE|CONSTRAINT)\b/i);
});
