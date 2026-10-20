import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../../src/pages/Orders.jsx", import.meta.url), "utf8");

test("bulk cancellation persists each eligible saved order through the status API", () => {
  const start = source.indexOf("async function bulkAction(action)");
  const end = source.indexOf("\n  function openFilters()", start);
  assert.notEqual(start, -1, "bulk action handler should exist");
  assert.notEqual(end, -1, "bulk action handler should end before filter handlers");
  const handler = source.slice(start, end);
  assert.match(handler, /selectedOrders\.filter\(order => order\.uuid/);
  assert.match(handler, /apiRequest\('\/api\/orders\/' \+ order\.uuid \+ '\/status'/);
  assert.match(handler, /Promise\.allSettled/);
  assert.match(handler, /status: 'Cancelled'/);
  assert.match(handler, /window\.confirm/);
  assert.match(handler, /setOrders\(current => current\.map/);
  assert.doesNotMatch(handler, /Demo: cancellation requested/);
});

test("bulk cancellation excludes delivered, RTO and already-cancelled orders", () => {
  assert.match(source, /!\['Delivered','RTO','Cancelled'\]\.includes\(order\.status\)/);
  assert.match(source, /No selected saved orders can be cancelled/);
});

test("row cancellation uses saved-order status update and disables terminal or unsaved rows", () => {
  assert.match(source, /disabled=\{!order\.uuid\|\|\['Delivered','RTO','Cancelled'\]\.includes\(order\.status\)\}/);
  assert.match(source, /updateOrderStatus\(order,'Cancelled'\)/);
});

const workerSource = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

test("order status API validates transitions, protects terminal orders and detects concurrent changes", () => {
  const start = workerSource.indexOf('const statusMatch = url.pathname.match(/^\\/api\\/orders');
  const end = workerSource.indexOf('return json(request, { error: "Method or order route not supported." }, 405);', start);
  assert.notEqual(start, -1, "order status route should exist");
  assert.notEqual(end, -1, "order status route should end before unsupported-route response");
  const handler = workerSource.slice(start, end);
  assert.ok(handler.includes("SELECT id, status FROM ikai.orders"));
  assert.ok(handler.includes("WHERE id = ${statusMatch[1]}::uuid AND organization_id = ${user.organizationId}::uuid"));
  assert.ok(handler.includes('const allowedNextStatuses = {'));
  assert.ok(handler.includes('"Delivered": []'));
  assert.ok(handler.includes('"RTO": []'));
  assert.ok(handler.includes('"Cancelled": []'));
  assert.ok(handler.includes('if (status !== currentStatus && !(allowedNextStatuses[currentStatus] || []).includes(status))'));
  assert.ok(handler.includes("AND status = ${currentStatus}"));
  assert.ok(handler.includes("Order status changed concurrently"));
});
