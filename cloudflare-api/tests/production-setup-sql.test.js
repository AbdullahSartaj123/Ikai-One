import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const allInOne = await readFile(new URL("../migrations/production_setup_all_in_one.sql", import.meta.url), "utf8");
const workflowMigration = await readFile(new URL("../migrations/0007_workflow_records.sql", import.meta.url), "utf8");

test("all-in-one SQL creates workflow records before verifying required tables", () => {
  const createAt = allInOne.indexOf("CREATE TABLE IF NOT EXISTS ikai.workflow_records");
  const verifyAt = allInOne.indexOf("-- Verify all required operational tables exist before committing.");
  assert.notEqual(createAt, -1, "workflow_records table definition must exist");
  assert.notEqual(verifyAt, -1, "required-table verification must exist");
  assert.ok(createAt < verifyAt, "table creation must precede verification");
});

test("all-in-one SQL has a valid workflow key constraint and checks every operational table", () => {
  assert.match(allInOne, /workflow_key text NOT NULL CHECK \(workflow_key ~ '\^\[a-z0-9-\]\{1,80\}\$'\)/);
  for (const table of [
    "cod_reconciliations", "organization_audit_events", "inventory_items",
    "inventory_movements", "orders", "order_items", "shipment_records",
    "shipment_events", "workflow_records",
  ]) {
    assert.ok(allInOne.includes("('" + table + "')"), "verification must include " + table);
  }
});

test("production setup is additive and keeps authentication tables as preflight dependencies", () => {
  assert.match(allInOne, /to_regclass\('ikai\.organizations'\)/);
  assert.match(allInOne, /to_regclass\('ikai\.users'\)/);
  assert.doesNotMatch(allInOne, /\bDROP\s+(TABLE|SCHEMA|DATABASE)\b/i);
  assert.match(allInOne, /CREATE TABLE IF NOT EXISTS ikai\.workflow_records/);
});

test("standalone workflow migration matches the workflow key constraint", () => {
  assert.match(workflowMigration, /workflow_key text NOT NULL CHECK \(workflow_key ~ '\^\[a-z0-9-\]\{1,80\}\$'\)/);
  assert.match(workflowMigration, /CREATE INDEX IF NOT EXISTS workflow_records_payload_gin_idx/);
  assert.doesNotMatch(workflowMigration, /\bDROP\s+(TABLE|SCHEMA|DATABASE)\b/i);
});
