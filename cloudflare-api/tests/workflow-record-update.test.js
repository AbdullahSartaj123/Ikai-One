import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const frontend = await readFile(new URL("../../src/pages/OperationsHub.jsx", import.meta.url), "utf8");

test("workflow update endpoint validates and persists reference and title", () => {
  assert.match(worker, /body\.reference === undefined \? null : String\(body\.reference \|\| ""\)/);
  assert.match(worker, /body\.title === undefined \? null : String\(body\.title \|\| ""\)/);
  assert.match(worker, /reference = COALESCE\(\$\{reference\}, reference\)/);
  assert.match(worker, /title = COALESCE\(\$\{title\}, title\)/);
  assert.match(worker, /WHERE id = \$\{recordMatch\[1\]\}::uuid AND organization_id = \$\{user\.organizationId\}::uuid/);
});

test("workflow update endpoint keeps audit logging and organization isolation", () => {
  assert.match(worker, /'workflow_record_updated', 'workflow_record'/);
  assert.match(worker, /actor_user_id, event_type, entity_type, entity_reference, details/);
  assert.match(worker, /WHERE id = \$\{recordMatch\[1\]\}::uuid AND organization_id = \$\{user\.organizationId\}::uuid/);
});

test("frontend edit submits the saved reference, title, status and payload", () => {
  assert.match(frontend, /body:\{status:editRecord\.raw\?\.status\|\|String\(editRecord\.cells\.at\(-1\)\|\|'Open'\),reference,title,payload:form\}/);
  assert.match(frontend, /Record details updated and saved to your organization workspace\./);
});

test("frontend edit reference field matcher uses word boundaries correctly", () => {
  assert.ok(frontend.includes("\\bid\\b"));
  assert.ok(frontend.includes("reference|awb|sku|code|number|subject|ticket"));
  assert.ok(frontend.includes("field.toLowerCase()!=='order id'"), "linked order IDs must not replace a workflow record reference");
  assert.ok(!frontend.includes("\\\\bid\\\\b"));
});

test("shipment status endpoint enforces lifecycle transitions and terminal states", async () => {
  const api = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
  assert.match(api, /"Label pending": \["Ready to ship", "Booked", "Exception"\]/);
  assert.match(api, /"In transit": \["Out for delivery", "Delivered", "Exception", "Returned"\]/);
  assert.match(api, /"Delivered": \[\]/);
  assert.match(api, /"Returned": \[\]/);
  assert.match(api, /Shipment status cannot move from/);
  assert.match(api, /AND status = \$\{currentStatus\}/);
  assert.match(api, /Shipment changed concurrently/);
  assert.match(api, /'shipment_status_changed', 'shipment'/);
});

test("shipment status UI only offers transitions allowed by the API", async () => {
  const shipments = await readFile(new URL("../../src/pages/Shipments.jsx", import.meta.url), "utf8");
  assert.match(shipments, /const shipmentTransitions=\{/);
  assert.match(shipments, /const allowedStatusOptions=\[shipment\?\.status,\.\.\.\(shipmentTransitions\[shipment\?\.status\]\|\|\[\]\)\]/);
  assert.match(shipments, /statusDraft===shipment\.status\?'Choose next status':'Save internal status'/);
  assert.match(shipments, /'Delivered':\[\]/);
  assert.match(shipments, /'Returned':\[\]/);
});

test("returns must link to a saved order and persist the organization order UUID", async () => {
  const hub = await readFile(new URL("../../src/pages/OperationsHub.jsx", import.meta.url), "utf8");
  assert.ok(hub.includes("/api/orders?limit=100"));
  assert.ok(hub.includes("Source order UUID"));
  assert.ok(hub.includes("Select a saved order before creating a return request."));
  assert.ok(hub.includes("no courier pickup is triggered"));
});

test("shipment exception panel is available for persisted Exception status", async () => {
  const shipments = await readFile(new URL("../../src/pages/Shipments.jsx", import.meta.url), "utf8");
  assert.match(shipments, /\['Exception','Undelivered','Lost\/Damaged'\]\.includes\(shipment\.status\)/);
  assert.match(shipments, /const nextStatus=exceptionAction==='Return to sender'\?'Returned':'Ready to ship'/);
  assert.match(shipments, /No courier instruction was sent/);
  assert.match(shipments, /Action saved to shipment history/);
  assert.match(shipments, /Saved as an internal Ikai\.One event/);
  assert.match(shipments, /source:event\.source\|\|'internal'/);
  assert.match(shipments, /event\.source==='courier'\?'Courier-reported event':'Internal Ikai\.One event'/);
});

test("return workflow validates saved order and shipment links within the same organization", () => {
  assert.match(worker, /async function validateReturnLinks\(sql, organizationId, payload\)/);
  assert.match(worker, /SELECT id\s+FROM ikai\.orders\s+WHERE id = \$\{orderId\}::uuid AND organization_id = \$\{organizationId\}::uuid/);
  assert.match(worker, /AND order_id = \$\{orderId\}::uuid\s+AND organization_id = \$\{organizationId\}::uuid/);
  assert.match(worker, /workflowKey === "returns"/);
  assert.match(worker, /existingRows\[0\]\.workflow_key === "returns"/);
  assert.match(worker, /The selected shipment does not belong to the selected order in your organization\./);
});

test("shipment list can create a persisted shipment from a saved order without booking a courier", async () => {
  const shipmentsPage = await readFile(new URL("../../src/pages/Shipments.jsx", import.meta.url), "utf8");
  const api = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
  assert.match(shipmentsPage, /apiRequest\('\/api\/orders\?limit=100'\)/);
  assert.match(shipmentsPage, /apiRequest\('\/api\/shipments'/);
  assert.match(shipmentsPage, /orderId:shipmentDraft\.orderId/);
  assert.match(shipmentsPage, /disabled=\{loading\|\|dataSource==='demo'\}/);
  assert.match(shipmentsPage, /This creates an internal shipment record and history event only/);
  assert.match(api, /courierBookingConfirmed', false/);
  assert.match(api, /Shipment record saved\. Courier booking has not been performed\./);
});

test("shipment lifecycle status updates synchronize linked order status and audit the order change", () => {
  assert.match(worker, /order_sync AS \(/);
  assert.match(worker, /WHEN \$\{status\} = 'Ready to ship' THEN 'Ready to Ship'/);
  assert.match(worker, /WHEN \$\{status\} IN \('Booked', 'Picked up', 'In transit', 'Out for delivery'\) THEN 'Shipped'/);
  assert.match(worker, /WHEN \$\{status\} = 'Delivered' THEN 'Delivered'/);
  assert.match(worker, /WHEN \$\{status\} = 'Exception' THEN 'NDR raised'/);
  assert.match(worker, /WHEN \$\{status\} = 'Returned' THEN 'RTO'/);
  assert.match(worker, /o\.organization_id = changed\.organization_id/);
  assert.match(worker, /'order_status_synced_from_shipment', 'order'/);
  assert.match(worker, /o\.status IS DISTINCT FROM CASE/);
});

test("NDR records require a saved shipment in the current organization", async () => {
  const api = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
  const hub = await readFile(new URL("../../src/pages/OperationsHub.jsx", import.meta.url), "utf8");
  assert.match(api, /async function validateNdrLinks\(sql, organizationId, payload\)/);
  assert.match(api, /\["ndr", "ndr-followups"\]\.includes\(workflowKey\)/);
  assert.match(api, /\["ndr", "ndr-followups"\]\.includes\(existingRows\[0\]\.workflow_key\)/);
  assert.match(api, /The selected shipment was not found in your organization\./);
  assert.match(hub, /slug==='ndr'&&!form\['Source shipment UUID'\]/);
  assert.match(hub, /Select a saved shipment/);
  assert.match(hub, /Log an NDR response against a saved shipment; no courier action is triggered\./);
});

test("customer follow-ups require a saved shipment in the current organization", async () => {
  const api = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
  const hub = await readFile(new URL("../../src/pages/OperationsHub.jsx", import.meta.url), "utf8");
  assert.match(api, /\["ndr", "ndr-followups"\]\.includes\(workflowKey\)/);
  assert.match(api, /\["ndr", "ndr-followups"\]\.includes\(existingRows\[0\]\.workflow_key\)/);
  assert.match(hub, /slug==='ndr-followups'&&!form\['Source shipment UUID'\]/);
  assert.match(hub, /field==='Shipment ID'\?\<input required readOnly/);
  assert.match(hub, /internal follow-up only; it does not contact a courier/);
});
test("contact customer exception creates a saved internal customer follow-up linked to the shipment", async () => {
  const shipments = await readFile(new URL("../../src/pages/Shipments.jsx", import.meta.url), "utf8");
  assert.match(shipments, /if\(exceptionAction==='Contact customer'\)/);
  assert.match(shipments, /workflowKey:'ndr-followups'/);
  assert.match(shipments, /'Source shipment UUID':shipment\.shipmentId/);
  assert.match(shipments, /'Contact channel':'Pending — not contacted'/);
  assert.match(shipments, /'Buyer response':'Pending contact'/);
  assert.match(shipments, /No customer message or call was sent/);
  assert.match(shipments, /Saved to Customer Follow-ups\. No customer was contacted\./);
});

test("customer follow-ups have an explicit persisted lifecycle instead of generic Reviewed status", () => {
  assert.match(frontend, /'ndr-followups': \{'open':'In progress','in progress':'Awaiting response','awaiting response':'Reattempt scheduled','reattempt scheduled':'Resolved','resolved':null\}/);
  assert.match(frontend, /apiRequest\('\/api\/workflows\/'\+row\.id\+'\/status'/);
  assert.match(frontend, /Status updated to '\+nextStatus\+' and saved to your organization workspace\./);
});

test("COD reconciliation is restricted to a saved delivered COD shipment in the same organization", () => {
  assert.match(worker, /o\.organization_id = \$\{user\.organizationId\}::uuid/);
  assert.match(worker, /o\.order_number = \$\{orderReference\}/);
  assert.match(worker, /s\.shipment_number = \$\{awb\}/);
  assert.doesNotMatch(worker, /s\.tracking_number = \$\{awb\}/);
  assert.match(worker, /linked\.payment_mode !== "COD"/);
  assert.match(worker, /linked\.shipment_status !== "Delivered"/);
  assert.match(worker, /linked\.shipment_courier !== courierName/);
  assert.match(worker, /Number\(linked\.order_amount\) !== codExpected/);
  assert.match(worker, /amountRemitted > codExpected/);
  assert.match(worker, /const effectiveDeliveredAt = linked\.shipment_delivered_at \|\| deliveredAt/);
});

test("COD remittance UI selects eligible saved delivered COD shipments instead of free-text references", async () => {
  const billing = await readFile(new URL("../../src/pages/Billing.jsx", import.meta.url), "utf8");
  assert.match(billing, /apiRequest\('\/api\/shipments\?limit=100'\)/);
  assert.match(billing, /String\(s\.payment_mode\|\|''\)\.toUpperCase\(\)==='COD'/);
  assert.match(billing, /String\(s\.status\|\|''\)\.toLowerCase\(\)==='delivered'/);
  assert.match(billing, /Saved delivered COD shipment/);
  assert.match(billing, /No courier or payment provider is contacted/);
  assert.match(billing, /Number\(form\.amountRemitted\)>Number\(form\.codExpected\)/);
});


test("COD reconciliation action accurately describes moving a record into review", async () => {
  const billing = await readFile(new URL("../../src/pages/Billing.jsx", import.meta.url), "utf8");
  assert.match(billing, /Send to review/);
  assert.match(billing, /submitted for review/);
  assert.doesNotMatch(billing, /Mark reviewed|value="reviewed"|\['Matched','Resolved','Reviewed'\]/);
});

 
test("return workflow enforces allowed lifecycle transitions server-side", () => {
  assert.match(worker, /New return requests must start in Requested status/);
  assert.match(worker, /"Requested": \["Pickup pending"\]/);
  assert.match(worker, /"Pickup pending": \["In transit"\]/);
  assert.match(worker, /"In transit": \["Completed"\]/);
  assert.match(worker, /const label = isReturn \? "Return" : "Customer follow-up"/);
  assert.match(worker, /AND \(\$\{!\["returns", "ndr-followups"\]\.includes\(existingRows\[0\]\.workflow_key\)\} OR status = \$\{existingRows\[0\]\.status\}\)/);
  assert.match(worker, /Return status changed concurrently/);
});

 
test("return lifecycle updates remain organization-scoped and audited", () => {
  assert.match(worker, /SELECT workflow_key, status, payload\s+FROM ikai\.workflow_records\s+WHERE id = \$\{recordMatch\[1\]\}::uuid AND organization_id = \$\{user\.organizationId\}::uuid/);
  assert.match(worker, /'workflow_record_updated', 'workflow_record'/);
  assert.match(worker, /jsonb_build_object\('workflowKey', \$\{rows\[0\]\.workflow_key\}, 'status', \$\{status\}\)/);
});

 
test("return details can be edited without changing lifecycle status", () => {
  assert.match(worker, /if \(status !== currentStatus && !\(allowedNext\[currentStatus\] \|\| \[\]\)\.includes\(status\)\)/);
  assert.match(worker, /SET status = \$\{status\},[\s\S]*payload = CASE WHEN \$\{payload !== null\}/);
  assert.match(worker, /'workflow_record_updated', 'workflow_record'/);
});


test("customer follow-up lifecycle is enforced server-side and permits same-status detail edits", () => {
  assert.match(worker, /New customer follow-ups must start in Open status/);
  assert.match(worker, /"Open": \["In progress"\]/);
  assert.match(worker, /"In progress": \["Awaiting response"\]/);
  assert.match(worker, /"Awaiting response": \["Reattempt scheduled"\]/);
  assert.match(worker, /"Reattempt scheduled": \["Resolved"\]/);
  assert.match(worker, /const label = isReturn \? "Return" : "Customer follow-up"/);
  assert.match(worker, /existingRows\[0\]\.workflow_key === "ndr-followups" \? "Customer follow-up status changed concurrently/);
  assert.match(worker, /AND \(\$\{!\["returns", "ndr-followups"\]\.includes\(existingRows\[0\]\.workflow_key\)\} OR status = \$\{existingRows\[0\]\.status\}\)/);
  assert.match(worker, /'workflow_record_updated', 'workflow_record'/);
});

test("customer follow-up transitions retain shipment link validation and organization isolation", () => {
  assert.match(worker, /async function validateNdrLinks\(sql, organizationId, payload\)/);
  assert.match(worker, /\["ndr", "ndr-followups"\]\.includes\(existingRows\[0\]\.workflow_key\)/);
  assert.match(worker, /WHERE id = \$\{recordMatch\[1\]\}::uuid AND organization_id = \$\{user\.organizationId\}::uuid/);
});


test("shipment and linked-order status changes share one guarded SQL statement", () => {
  const statusStart = worker.indexOf('const statusMatch = url.pathname.match');
  const statusEnd = worker.indexOf('return json(request, { error: "Method or shipment route not supported." }, 405);', statusStart);
  assert.ok(statusStart >= 0 && statusEnd > statusStart, "shipment status route must exist");
  const route = worker.slice(statusStart, statusEnd);
  const changed = route.indexOf("WITH changed AS (");
  const shipmentUpdate = route.indexOf("UPDATE ikai.shipment_records SET status", changed);
  const orderSync = route.indexOf("order_sync AS (", changed);
  const orderAudit = route.indexOf("order_audit AS (", changed);
  const result = route.indexOf("SELECT changed.* FROM changed", changed);
  assert.ok(changed >= 0 && shipmentUpdate > changed && orderSync > shipmentUpdate && orderAudit > orderSync && result > orderAudit,
    "shipment update, order sync, and order audit must be part of the same SQL statement");
  assert.match(route, /WHERE id = \\$\\{statusMatch\\[1\\]\\}::uuid[\\s\\S]*AND organization_id = \\$\\{user\\.organizationId\\}::uuid[\\s\\S]*AND status = \\$\\{currentStatus\\}/);
  assert.match(route, /FROM order_sync JOIN changed ON changed\\.order_id = order_sync\\.id/);
});

test("shipment lifecycle mapping updates only the linked order when its status actually differs", () => {
  const statusStart = worker.indexOf('const statusMatch = url.pathname.match');
  const statusEnd = worker.indexOf('return json(request, { error: "Method or shipment route not supported." }, 405);', statusStart);
  const route = worker.slice(statusStart, statusEnd);
  assert.match(route, /o\\.id = changed\\.order_id/);
  assert.match(route, /o\\.organization_id = changed\\.organization_id/);
  assert.match(route, /o\\.status IS DISTINCT FROM CASE/);
  assert.match(route, /'order_status_synced_from_shipment', 'order'/);
  assert.match(route, /jsonb_build_object\\('status', order_sync\\.status, 'sourceShipment', changed\\.shipment_number\\)/);
});
