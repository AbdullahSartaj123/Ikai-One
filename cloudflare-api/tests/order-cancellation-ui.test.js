import test from "node:test";
import assert from "node:assert/strict";
import { escapeCsvCell, toCsv } from "../../src/lib/csv.js";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../../src/pages/Orders.jsx", import.meta.url), "utf8");
const workerSource = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

test("Pickup Scheduled orders remain visible and cancelable under the backend lifecycle", () => {
  assert.match(source, /const savedOrderStatuses = \['New', 'Processing', 'Ready to Ship', 'Pickup Scheduled', 'In Transit'/);
  assert.match(source, /const cancelableOrderStatuses = \['New', 'Processing', 'Ready to Ship', 'Pickup Scheduled'\]/);
  assert.match(workerSource, /"Pickup Scheduled": \["Ready to Ship", "In Transit", "Shipped", "NDR raised", "Cancelled"\]/);
});
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

test("bulk cancellation only includes statuses accepted by the order cancellation lifecycle", () => {
  assert.match(source, /const cancelableOrderStatuses = \['New', 'Processing', 'Ready to Ship', 'Pickup Scheduled'\]/);
  assert.match(source, /cancelableOrderStatuses\.includes\(order\.status\)/);
  assert.match(source, /Only New, Processing, Ready to Ship and Pickup Scheduled orders are eligible/);
});

test("row cancellation is disabled for statuses the API will reject", () => {
  assert.match(source, /disabled=\{!order\.uuid\|\|updatingOrderIds\.includes\(order\.uuid\)\|\|!cancelableOrderStatuses\.includes\(order\.status\)\}/);
  assert.match(source, /updateOrderStatus\(order,'Cancelled'\)/);
});

const shipmentPageSource = readFileSync(new URL("../../src/pages/Shipments.jsx", import.meta.url), "utf8");

test("bulk order cancellation prevents overlapping requests and keeps selection stable while running", () => {
  assert.ok(source.includes("const [bulkActionInProgress,setBulkActionInProgress] = useState(false)"));
  const start = source.indexOf("async function bulkAction(action)");
  const end = source.indexOf("\\n  function openFilters()", start);
  const handler = source.slice(start, end);
  assert.ok(handler.includes("if (bulkActionInProgress) return"));
  assert.ok(handler.includes("setBulkActionInProgress(true)"));
  assert.ok(handler.includes("setBulkActionInProgress(false)"));
  assert.ok(handler.includes("try {"));
  assert.ok(handler.includes("finally {"));
  assert.ok(source.includes("disabled={bulkActionInProgress} onClick={()=>{setBulkMenuOpen(false);bulkAction(label)}}"));
  assert.ok(source.includes('disabled={bulkActionInProgress} onClick={()=>setSelected([])}>Clear selection</button>'));
});

test("partial bulk cancellation failures reload saved statuses and report refresh outcome", () => {
  const loadStart = source.indexOf("async function loadOrders(showLoading = false)");
  const loadEnd = source.indexOf("\\n  useEffect(() => {", loadStart);
  const loader = source.slice(loadStart, loadEnd);
  assert.ok(loader.includes("return true"));
  assert.ok(loader.includes("return false"));
  const start = source.indexOf("async function bulkAction(action)");
  const end = source.indexOf("\\n  function openFilters()", start);
  const handler = source.slice(start, end);
  assert.ok(handler.includes("const refreshed = await loadOrders()"));
  assert.ok(handler.includes("Latest saved statuses reloaded."));
  assert.ok(handler.includes("Saved statuses could not be refreshed; use Refresh and retry."));
});

test("bulk cancellation skips orders with a status update already in progress", () => {
  assert.match(source, /selectedOrders\.filter\(order => order\.uuid && !updatingOrderIds\.includes\(order\.uuid\) && cancelableOrderStatuses\.includes\(order\.status\)\)/);
  assert.match(source, /disabled=\{!order\.uuid\|\|updatingOrderIds\.includes\(order\.uuid\)\|\|!cancelableOrderStatuses\.includes\(order\.status\)\}/);
});

test("CSV serialization neutralizes spreadsheet formulas and preserves CSV escaping", () => {
  assert.equal(escapeCsvCell("=1+1"), "\"'=1+1\"");
  assert.equal(escapeCsvCell("  @SUM(A1:A2)"), "\"'  @SUM(A1:A2)\"");
  assert.equal(escapeCsvCell("\t-2+3"), "\"'\t-2+3\"");
  assert.equal(escapeCsvCell("+cmd"), "\"'+cmd\"");
  assert.equal(escapeCsvCell('Customer "A", Inc.'), '"Customer ""A"", Inc."');
  assert.equal(escapeCsvCell(null), "\"\"");
  assert.equal(toCsv([["Order ID", "Customer"], ["123", "=1+1"]]).split(String.fromCharCode(10)).length, 2);
});
