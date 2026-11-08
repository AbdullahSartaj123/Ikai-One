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

test("order status changes and audit events are written in one atomic SQL statement", () => {
  const update = worker.indexOf("WITH updated AS (");
  const audit = worker.indexOf("INSERT INTO ikai.organization_audit_events", update);
  const result = worker.indexOf("SELECT id, order_number, status, updated_at FROM updated", update);
  const routeEnd = worker.indexOf('if (url.pathname === "/api/shipments" || url.pathname.startsWith("/api/shipments/"))', update);
  const orderStatusRoute = worker.slice(update, routeEnd === -1 ? worker.length : routeEnd);
  const separateAudit = orderStatusRoute.indexOf("await sql`INSERT INTO ikai.organization_audit_events");
  assert.ok(update >= 0, "status update must use a data-modifying CTE");
  assert.ok(audit > update && result > audit, "audit insert must share the update statement");
  assert.equal(separateAudit, -1, "status changes must not write audit events in a second query");
  assert.match(orderStatusRoute, /FROM updated/);
});
