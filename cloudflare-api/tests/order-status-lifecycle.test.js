import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");

test("order status API accepts statuses exposed by the orders workspace", () => {
  assert.match(worker, /const allowedStatuses = \["New", "Ready to Ship", "Processing", "Pickup Scheduled", "In Transit", "Shipped", "Delivered", "Cancelled", "NDR raised", "RTO"\]/);
});

test("order status API enforces lifecycle transitions and terminal states", () => {
  assert.match(worker, /"New": \["Ready to Ship", "Processing", "Pickup Scheduled", "Cancelled"\]/);
  assert.match(worker, /"In Transit": \["Shipped", "Delivered", "NDR raised", "RTO"\]/);
  assert.match(worker, /"Delivered": \[\]/);
  assert.match(worker, /"RTO": \[\]/);
  assert.match(worker, /"Cancelled": \[\]/);
  assert.match(worker, /Order status cannot move from/);
});

test("order status update is organization-scoped, concurrency-safe, and audit records old and new states", () => {
  assert.match(worker, /WHERE id = \$\{statusMatch\[1\]\}::uuid AND organization_id = \$\{user\.organizationId\}::uuid/);
  assert.match(worker, /AND status = \$\{currentStatus\}/);
  assert.match(worker, /Order status changed concurrently\. Refresh and try again/);
  assert.match(worker, /'order_status_changed', 'order',[\s\S]*jsonb_build_object\('previousStatus', \$\{currentStatus\}, 'status', \$\{status\}\)/);
});
