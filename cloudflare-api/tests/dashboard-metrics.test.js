import test from "node:test";
import assert from "node:assert/strict";
import { buildDashboardAlerts, buildOrderTrend, buildTopCourierPartners } from "../../src/lib/dashboardMetrics.js";

test("order trends aggregate actual records by selected calendar period", () => {
  const now = new Date("2026-10-20T12:00:00");
  const orders = [
    { created_at: "2026-10-20T09:15:00" },
    { created_at: "2026-10-20T09:45:00" },
    { created_at: "2026-10-19T14:00:00" },
    { created_at: "2026-09-01T12:00:00" },
    { created_at: "not-a-date" },
  ];
  const today = buildOrderTrend(orders, "Today", "", "", now);
  assert.equal(today.length, 24);
  assert.equal(today.find(point => point.label === "9 AM")?.orders, 2);
  assert.equal(today.reduce((sum, point) => sum + point.orders, 0), 2);
  const week = buildOrderTrend(orders, "7 days", "", "", now);
  assert.equal(week.length, 7);
  assert.equal(week.reduce((sum, point) => sum + point.orders, 0), 3);
});

test("custom date trends include both selected calendar dates and reject invalid ranges", () => {
  const orders = [
    { created_at: "2026-10-01T12:00:00" },
    { created_at: "2026-10-02T12:00:00" },
    { created_at: "2026-10-03T00:00:00" },
  ];
  const points = buildOrderTrend(orders, "Custom", "2026-10-01", "2026-10-02", new Date("2026-10-20T12:00:00"));
  assert.equal(points.length, 2);
  assert.equal(points.reduce((sum, point) => sum + point.orders, 0), 2);
  assert.deepEqual(buildOrderTrend(orders, "Custom", "2026-10-03", "2026-10-01"), []);
});

test("courier rankings are derived from saved shipment records and ignore unassigned rows", () => {
  assert.deepEqual(buildTopCourierPartners([
    { courier: "TCS" }, { courier: "PostEx" }, { courier: "TCS" },
    { courier: "Not assigned" }, { courier: "" }, { courier: "PostEx" }, { courier: "Leopards" },
  ]), [
    { name: "PostEx", shipments: 2 },
    { name: "TCS", shipments: 2 },
    { name: "Leopards", shipments: 1 },
  ]);
});

test("dashboard alerts are based on loaded shipment exceptions and COD balances", () => {
  const alerts = buildDashboardAlerts([
    { status: "NDR raised" }, { status: "Delivered" }, { status: "exception" },
  ], [
    { status: "pending", cod_expected: 1000, amount_remitted: 700 },
    { status: "matched", cod_expected: 500, amount_remitted: 500 },
  ]);
  assert.equal(alerts.length, 2);
  assert.match(alerts[0].description, /2 loaded shipment/);
  assert.match(alerts[1].description, /1 loaded COD/);
  assert.match(alerts[1].description, /Rs 300/);
  assert.deepEqual(buildDashboardAlerts([], []), []);
});
