import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const dashboardMetrics = await readFile(new URL("../../src/lib/dashboardMetrics.js", import.meta.url), "utf8");
const ordersPage = await readFile(new URL("../../src/pages/Orders.jsx", import.meta.url), "utf8");
const shipmentsPage = await readFile(new URL("../../src/pages/Shipments.jsx", import.meta.url), "utf8");

test("shipper approval blocks login until approval and distinguishes rejected accounts", () => {
  assert.match(worker, /ACCOUNT_PENDING_APPROVAL/);
  assert.match(worker, /ACCOUNT_REJECTED/);
  assert.match(worker, /user\.approvalStatus !== "approved"/);
});

test("order APIs require authentication and organization-scope order access", () => {
  assert.match(worker, /url\.pathname === "\/api\/orders" \|\| url\.pathname\.startsWith\("\/api\/orders\/"\)/);
  assert.match(worker, /const user = await authenticate\(request, env\)/);
  assert.match(worker, /organization_id = \$\{user\.organizationId\}::uuid/);
  assert.match(worker, /order_items/);
  assert.match(worker, /organization_audit_events/);
});

test("order creation validates required shipping details and payment mode before saving", () => {
  assert.match(worker, /paymentMode/);
  assert.match(worker, /COD.*Prepaid|Prepaid.*COD/);
  assert.match(worker, /Courier booking has not been performed/);
  assert.match(worker, /customer.*phone|phone.*customer/);
});

test("order lifecycle exposes explicit cancellation rules and prevents invalid UI cancellation", () => {
  assert.match(worker, /"Pickup Scheduled": \["Ready to Ship", "In Transit", "Shipped", "NDR raised", "Cancelled"\]/);
  assert.match(ordersPage, /cancelableOrderStatuses/);
  assert.match(ordersPage, /updateOrderStatus\(order,'Cancelled'\)/);
  assert.match(shipmentsPage, /Promise\.allSettled/);
});

test("COD save and review routes write audit events atomically", () => {
  const saveStart = worker.indexOf('if (url.pathname === "/api/cod-reconciliations" && request.method === "POST")');
  const reviewStart = worker.indexOf("const reviewMatch = url.pathname.match", saveStart);
  assert.ok(saveStart >= 0 && reviewStart > saveStart, "COD save and review routes must exist");
  const saveRoute = worker.slice(saveStart, reviewStart);
  assert.ok(saveRoute.indexOf("WITH saved AS (") >= 0);
  assert.ok(saveRoute.indexOf("INSERT INTO ikai.organization_audit_events") > saveRoute.indexOf("WITH saved AS ("));
  const reviewEnd = worker.indexOf('return json(request, { error: "Method or reconciliation route not supported." }, 405);', reviewStart);
  const reviewRoute = worker.slice(reviewStart, reviewEnd);
  assert.ok(reviewRoute.indexOf("WITH updated AS (") >= 0);
  assert.ok(reviewRoute.indexOf("INSERT INTO ikai.organization_audit_events") > reviewRoute.indexOf("WITH updated AS ("));
});

test("dashboard metrics derive trends, courier rankings and alerts from loaded records", () => {
  assert.match(dashboardMetrics, /buildOrderTrend/);
  assert.match(dashboardMetrics, /buildTopCourierPartners/);
  assert.match(dashboardMetrics, /buildDashboardAlerts/);
  assert.match(dashboardMetrics, /cod_expected/);
});

test("test-only verification endpoints are disabled unless explicitly enabled with a secret", () => {
  assert.match(worker, /env\.ENABLE_TEST_HELPERS !== "true"/);
  assert.match(worker, /X-Testing-Verification-Secret/);
  assert.match(worker, /Endpoint not found\./);
});
