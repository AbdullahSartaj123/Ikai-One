import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");

test("shipper approval schema bootstrap is restricted to the isolated staging test Worker", () => {
  assert.match(worker, /url\.pathname === "\/api\/testing\/apply-shipper-approval-migration"/);
  assert.match(worker, /env\.STAGING_BEARER_MODE !== "true"[\s\S]*env\.ENABLE_TEST_HELPERS !== "true"[\s\S]*env\.DISABLE_EMAIL !== "true"/);
  assert.match(worker, /request\.headers\.get\("X-Testing-Verification-Secret"\) !== env\.TEST_HELPER_SECRET/);
});

test("staging schema bootstrap is additive and idempotently creates all shipper approval objects", () => {
  assert.match(worker, /ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'/);
  assert.match(worker, /organizations_approval_status_check/);
  assert.match(worker, /CREATE INDEX IF NOT EXISTS organizations_approval_status_created_idx/);
  assert.match(worker, /CREATE TABLE IF NOT EXISTS ikai\.platform_admins/);
  assert.match(worker, /CREATE TABLE IF NOT EXISTS ikai\.platform_audit_events/);
  assert.match(worker, /CREATE INDEX IF NOT EXISTS platform_audit_events_created_idx/);
  assert.match(worker, /CREATE INDEX IF NOT EXISTS platform_audit_events_target_org_idx/);
  assert.match(worker, /approval_column_exists/);
  assert.match(worker, /platform_admins_exists/);
  assert.match(worker, /platform_audit_events_exists/);
});
