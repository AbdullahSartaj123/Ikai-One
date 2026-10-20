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
const shipmentPageSource = readFileSync(new URL("../../src/pages/Shipments.jsx", import.meta.url), "utf8");

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
  assert.ok(handler.includes("jsonb_build_object('fromStatus', ${currentStatus}, 'status', ${status})"), "order audit should retain the prior status");
});

test("direct order status changes are blocked when a shipment is linked", () => {
  const start = workerSource.indexOf('const statusMatch = url.pathname.match(/^\\/api\\/orders');
  const end = workerSource.indexOf('return json(request, { error: "Method or order route not supported." }, 405);', start);
  const handler = workerSource.slice(start, end);
  assert.ok(handler.includes('if (status !== currentStatus)'));
  assert.ok(handler.includes("SELECT status FROM ikai.shipment_records"));
  assert.ok(handler.includes("WHERE order_id = ${statusMatch[1]}::uuid"));
  assert.ok(handler.includes("AND organization_id = ${user.organizationId}::uuid"));
  assert.ok(handler.includes("Order cancellation is blocked until shipment cancellation is supported"));
  assert.ok(handler.includes("Update the shipment status to advance its linked order"));
  assert.ok(handler.includes("}, 409)"));
});

test("saved-order status controls offer only API-supported statuses and valid next steps", () => {
  assert.ok(source.includes("const savedOrderStatuses = ['New', 'Processing', 'Ready to Ship', 'Shipped', 'NDR raised', 'Delivered', 'RTO', 'Cancelled']"));
  assert.ok(source.includes("const allowedOrderStatusChanges = {"));
  assert.ok(source.includes("(allowedOrderStatusChanges[order.status] || [order.status]).map(status=>"));
  assert.ok(source.includes("const tabs=['All', ...savedOrderStatuses]"));
  assert.ok(!source.includes("orderStatuses.filter(status=>status!=='All').map(status=>"));
});

test("shipment status API cannot change a terminal linked order", () => {
  const start = workerSource.indexOf('const statusMatch = url.pathname.match(/^\\/api\\/shipments');
  const end = workerSource.indexOf('return json(request, { error: "Method or shipment route not supported." }, 405);', start);
  assert.notEqual(start, -1, "shipment status route should exist");
  assert.notEqual(end, -1, "shipment status route should end before unsupported-route response");
  const handler = workerSource.slice(start, end);
  assert.ok(handler.includes("o.status AS order_status"));
  assert.ok(handler.includes('["Delivered", "RTO", "Cancelled"].includes(currentRows[0].order_status)'));
  assert.ok(handler.includes("The linked order is already"));
  assert.ok(handler.includes("AND o.organization_id = s.organization_id"));
});

test("shipment status sync cannot bypass the linked order lifecycle", () => {
  const start = workerSource.indexOf('const statusMatch = url.pathname.match(/^\\/api\\/shipments');
  const end = workerSource.indexOf('return json(request, { error: "Method or shipment route not supported." }, 405);', start);
  const handler = workerSource.slice(start, end);
  assert.ok(handler.includes("const allowedOrderNextStatuses = {"));
  assert.ok(handler.includes('"New": ["Processing", "Ready to Ship", "Cancelled"]'));
  assert.ok(handler.includes("!(allowedOrderNextStatuses[linkedOrderStatus] || []).includes(synchronizedOrderStatus)"));
  assert.ok(handler.includes("which is not an allowed order transition"));
  assert.ok(handler.includes("jsonb_build_object('fromStatus', ${currentStatus}, 'status', ${status}, 'courierBookingConfirmed', false)"), "shipment audit should retain the prior status");
});


test("shipment list does not present mock records when the API is unavailable", () => {
  assert.ok(shipmentPageSource.includes("const [shipments,setShipments]=useState([])"));
  assert.ok(shipmentPageSource.includes("setShipments([]);setDataSource('unavailable');setLoading(false)"));
  assert.ok(shipmentPageSource.includes("No demo records are shown"));
  assert.ok(shipmentPageSource.includes("disabled={loading||dataSource==='unavailable'}"));
  assert.ok(!shipmentPageSource.includes("setShipments(mockShipments)"), "shipment list must not fall back to demo records");
});


test("orders list clears stale records and explains API failure after refresh", () => {
  assert.match(source, /setOrders\(\[\]\)\s+setSelected\(\[\]\)\s+setOrdersSource\('unavailable'\)/);
  assert.ok(source.includes("Saved orders are unavailable"));
  assert.ok(source.includes("no stale records are shown"));
});

test("order status UI prevents overlapping updates for the same saved order", () => {
  assert.ok(source.includes("const [updatingOrderIds,setUpdatingOrderIds] = useState([])"));
  assert.ok(source.includes("if (updatingOrderIds.includes(order.uuid))"));
  assert.ok(source.includes("setUpdatingOrderIds(current => [...current, order.uuid])"));
  assert.ok(source.includes("setUpdatingOrderIds(current => current.filter(id => id !== order.uuid))"));
  assert.ok(source.includes("disabled={updatingOrderIds.includes(order.uuid)}"));
});

test("order status conflict reloads the saved server state instead of restoring a stale status", () => {
  const start = source.indexOf("async function updateOrderStatus(order, status)");
  const end = source.indexOf("const activeOrders = orders", start);
  const handler = source.slice(start, end);
  assert.ok(handler.includes("if (error.status === 409)"));
  assert.ok(handler.includes("await loadOrders()"));
  assert.ok(handler.includes("Latest saved statuses reloaded."));
  assert.ok(handler.includes("setOrders(current => current.map(item => item.id === order.id ? {...item,status:previousStatus} : item))"));
});
