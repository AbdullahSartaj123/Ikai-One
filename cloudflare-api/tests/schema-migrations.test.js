import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationPaths = Array.from({ length: 9 }, (_, index) =>
  new URL("../migrations/" + String(index + 1).padStart(4, "0") + "_" + [
    "authentication.sql",
    "auth_rate_limits.sql",
    "operational_persistence.sql",
    "inventory_persistence.sql",
    "order_persistence.sql",
    "shipment_workflow.sql",
    "workflow_records.sql",
    "shipper_approval.sql",
    "tenant_integrity_constraints.sql",
  ][index], import.meta.url)
);
const migrations = await Promise.all(migrationPaths.map(path => readFile(path, "utf8")));

test("all numbered PostgreSQL migrations are transactional", () => {
  for (let index = 0; index < migrations.length; index++) {
    const sql = migrations[index];
    assert.match(sql, /^--[\s\S]*?BEGIN;/, "migration " + (index + 1) + " must begin a transaction");
    assert.match(sql.trimEnd(), /COMMIT;$/, "migration " + (index + 1) + " must commit only after successful DDL");
  }
});

test("migrations that depend on the manually provisioned foundation fail with a clear preflight error", () => {
  for (const index of [0, 2, 3, 4, 5, 6, 7, 8]) {
    assert.match(migrations[index], /DO \$preflight\$/);
    assert.match(migrations[index], /to_regnamespace\('ikai'\)/);
  }
});

test("tenant integrity migration is the final numbered migration and preserves existing records", () => {
  assert.match(migrations[8], /Cross-tenant references found/);
  assert.match(migrations[8], /FOREIGN KEY \(item_id, organization_id\)/);
  assert.match(migrations[8], /FOREIGN KEY \(order_id, organization_id\)/);
  assert.match(migrations[8], /FOREIGN KEY \(shipment_id, organization_id\)/);
  assert.doesNotMatch(migrations[8], /\bDROP\s+(TABLE|SCHEMA|DATABASE|CONSTRAINT)\b/i);
});
