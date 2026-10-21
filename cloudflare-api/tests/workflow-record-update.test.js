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
  assert.match(api, /"Label pending": \["Ready to ship", "Booked", "Exception", "Cancelled"\]/);
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
  assert.match(shipments, /'Label pending':\['Ready to ship','Booked','Exception','Cancelled'\]/);
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
  assert.match(shipmentsPage, /disabled=\{loading\|\|dataSource==='unavailable'\}/);
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
  assert.ok(route.includes("WHERE id = ${statusMatch[1]}::uuid"));
  assert.ok(route.includes("AND organization_id = ${user.organizationId}::uuid"));
  assert.ok(route.includes("AND status = ${currentStatus}"));
  assert.ok(route.includes("FROM order_sync JOIN changed ON changed.order_id = order_sync.id"));
});

test("shipment lifecycle mapping updates only the linked order when its status actually differs", () => {
  const statusStart = worker.indexOf('const statusMatch = url.pathname.match');
  const statusEnd = worker.indexOf('return json(request, { error: "Method or shipment route not supported." }, 405);', statusStart);
  const route = worker.slice(statusStart, statusEnd);
  assert.ok(route.includes("o.id = changed.order_id"));
  assert.ok(route.includes("o.organization_id = changed.organization_id"));
  assert.ok(route.includes("o.status IS DISTINCT FROM CASE"));
  assert.ok(route.includes("'order_status_synced_from_shipment', 'order'"));
  assert.ok(route.includes("jsonb_build_object('status', order_sync.status, 'sourceShipment', changed.shipment_number)"));
});

test("shipment detail loads only saved API records and exposes retry states", async () => {
  const shipments = await readFile(new URL("../../src/pages/Shipments.jsx", import.meta.url), "utf8");
  const start = shipments.indexOf("function ShipmentDetail()");
  const end = shipments.indexOf("function SelectedTracking()", start);
  const detail = shipments.slice(start, end);
  assert.ok(detail.includes("const [shipment,setShipment]=useState(null)"), "detail must not initialize from mock shipments");
  assert.ok(detail.includes("setShipmentLoadState('unavailable')"));
  assert.ok(detail.includes("No demo records are shown."));
  assert.ok(detail.includes("onClick={reloadShipment}"));
  assert.ok(detail.includes("setShipmentLoadState('not-found')"));
});

test("shipment status conflicts reload the latest saved shipment state", async () => {
  const shipments = await readFile(new URL("../../src/pages/Shipments.jsx", import.meta.url), "utf8");
  const start = shipments.indexOf("const saveInternalStatus=async()=>");
  const end = shipments.indexOf("const [exceptionAction", start);
  const save = shipments.slice(start, end);
  assert.ok(save.includes("if(error.status===409)"));
  assert.ok(save.includes("await reloadShipment()"));
  assert.ok(save.includes("Latest saved state reloaded."));
  assert.ok(save.includes("setStatusDraft(latest?.status||'Label pending')"));
});

test("orders workspace refreshes saved orders when the tab regains focus", async () => {
  const orders = await readFile(new URL("../../src/pages/Orders.jsx", import.meta.url), "utf8");
  const listStart = orders.indexOf("function OrdersList()");
  const detailStart = orders.indexOf("function OrderDetail()");
  const list = orders.slice(listStart, detailStart);
  assert.ok(list.includes("window.addEventListener('focus', refresh)"));
  assert.ok(list.includes("document.addEventListener('visibilitychange', refresh)"));
  assert.ok(list.includes("refresh()"));
});

test("order detail refreshes order and linked shipment state together on demand and on focus", async () => {
  const orders = await readFile(new URL("../../src/pages/Orders.jsx", import.meta.url), "utf8");
  const start = orders.indexOf("function OrderDetail()");
  const detail = orders.slice(start);
  assert.ok(detail.includes("const [refreshKey,setRefreshKey]=useState(0)"));
  assert.ok(detail.includes("},[orderId,refreshKey])"), "order and shipment reads should rerun after refresh");
  assert.ok(detail.includes("const refreshRecords=()=>{setRefreshingRecords(true);setRefreshKey(key=>key+1)}"));
  assert.ok(detail.includes("onClick={refreshRecords}"));
  assert.ok(detail.includes("window.addEventListener('focus',refresh)"));
  assert.ok(detail.includes("document.addEventListener('visibilitychange',refresh)"));
});

test("order activity endpoint combines tenant-scoped order audit and shipment events", async () => {
  const workerSource = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
  const start = workerSource.indexOf("const activityMatch = url.pathname.match");
  const end = workerSource.indexOf("const statusMatch = url.pathname.match", start);
  const route = workerSource.slice(start, end);
  assert.ok(start >= 0 && end > start, "order activity route must exist before the order status route");
  assert.ok(route.includes("organization_id = ${user.organizationId}::uuid"));
  assert.ok(route.includes("entity_type = 'order'"));
  assert.ok(route.includes("FROM ikai.shipment_events e"));
  assert.ok(route.includes("s.order_id = ${order.id}::uuid"));
  assert.ok(route.includes("ORDER BY created_at DESC LIMIT 100"));
  assert.ok(route.includes("ORDER BY e.created_at DESC LIMIT 100"));
  assert.ok(route.includes("return json(request, { data: activity, count: activity.length, orderStatus: order.status })"));
});

test("order detail timeline renders persisted activity and linked shipment events", async () => {
  const orders = await readFile(new URL("../../src/pages/Orders.jsx", import.meta.url), "utf8");
  const start = orders.indexOf("function OrderDetail()");
  const detail = orders.slice(start);
  assert.ok(detail.includes("apiRequest('/api/orders/'+encodeURIComponent(savedOrder.uuid)+'/activity')"));
  assert.ok(detail.includes("event.type==='shipment'"));
  assert.ok(detail.includes("event.event==='order_status_synced_from_shipment'") || detail.includes("event.detail?.sourceShipment"));
  assert.ok(detail.includes("activityTimeline.map((event,index)"));
  assert.ok(detail.includes("activityError"));
});

test("order activity distinguishes an empty history from an unavailable activity service", async () => {
  const orders = await readFile(new URL("../../src/pages/Orders.jsx", import.meta.url), "utf8");
  const start = orders.indexOf("function OrderDetail()");
  const detail = orders.slice(start);
  assert.ok(detail.includes("activityError?'Unavailable'"));
  assert.ok(detail.includes("Retry activity"));
  assert.ok(detail.includes("No activity recorded yet."));
  assert.ok(detail.includes("no order-status or shipment-history events were returned."));
  assert.ok(!detail.includes("? (activityEvents.length ? activityEvents.map"), "timeline mapper should not fabricate events when saved history is empty");
  assert.ok(detail.includes(": orderFallbackTimeline(orderId)"), "demo orders retain their demo timeline");
});

test("order detail does not show demo records when the saved order service fails", async () => {
  const orders = await readFile(new URL("../../src/pages/Orders.jsx", import.meta.url), "utf8");
  const start = orders.indexOf("function OrderDetail()");
  const detail = orders.slice(start);
  assert.ok(detail.includes("setDetailLoadError(error.message||'Saved order could not be loaded.')"));
  assert.ok(detail.includes("savedOrder||(!detailLoadError?mockOrders.find(item=>item.id===orderId):null)"));
  assert.ok(detail.includes("No demo order is shown when saved records cannot be reached."));
  assert.ok(detail.includes("Retry loading"));
});

test("order detail does not offer shipment creation when shipment lookup is unavailable", async () => {
  const orders = await readFile(new URL("../../src/pages/Orders.jsx", import.meta.url), "utf8");
  const start = orders.indexOf("function OrderDetail()");
  const detail = orders.slice(start);
  assert.ok(detail.includes("setShipmentLoadError(error.message||'Saved shipment could not be loaded.')"));
  assert.ok(detail.includes("Shipment availability is unknown until the service responds."));
  assert.ok(detail.includes("Retry shipment lookup"));
  const panelStart = detail.indexOf("DELIVERY</span><h2>Shipment information</h2>");
  const panelEnd = detail.indexOf("Internal record only.", panelStart);
  const panel = detail.slice(panelStart, panelEnd);
  assert.ok(panel.indexOf("shipmentLoadError?") < panel.indexOf("Create shipment record"));
});

test("order activity timeline exposes shipment reference, location, and source metadata", async () => {
  const orders = await readFile(new URL("../../src/pages/Orders.jsx", import.meta.url), "utf8");
  const start = orders.indexOf("function OrderDetail()");
  const detail = orders.slice(start);
  assert.ok(detail.includes("reference:event.reference||''"));
  assert.ok(detail.includes("location:event.location||''"));
  assert.ok(detail.includes("source:event.type==='shipment'?'Shipment':'Order'"));
  assert.ok(detail.includes("Reference: {event.reference}"));
  assert.ok(detail.includes("Location: {event.location}"));
  assert.ok(detail.includes("event.eventName.replaceAll('_',' ')"));
});

test("shipment lifecycle blocks reopening cancelled and other terminal shipments", async () => {
  const workerSource = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
  const start = workerSource.indexOf('const statusMatch = url.pathname.match(/^\\/api\\/shipments');
  const end = workerSource.indexOf('const exceptionMatch', start);
  const route = workerSource.slice(start, end > start ? end : start + 12000);
  assert.ok(route.includes('"Cancelled": []'));
  assert.ok(route.includes('"Delivered": []'));
  assert.ok(route.includes('"Returned": []'));
  assert.ok(route.includes('if (status !== currentStatus && !(transitions[currentStatus] || []).includes(status))'));
  assert.ok(route.includes('Shipment status cannot move from'));
  assert.ok(route.includes('status === currentStatus'));
});

test("repeating the current shipment status does not create duplicate history events", async () => {
  const workerSource = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
  const start = workerSource.indexOf('const statusMatch = url.pathname.match(/^\\/api\\/shipments');
  const end = workerSource.indexOf('const exceptionMatch', start);
  const route = workerSource.slice(start, end > start ? end : start + 12000);
  assert.ok(route.includes('if (status === currentStatus)'));
  assert.ok(route.includes('no duplicate event was recorded'));
  const noOp = route.indexOf('if (status === currentStatus)');
  const eventInsert = route.indexOf('INSERT INTO ikai.shipment_events');
  assert.ok(noOp >= 0 && eventInsert > noOp, "same-status no-op must return before history insertion");
});

test("resolving a shipment exception can return its linked NDR order to Ready to Ship", async () => {
  const api = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
  assert.match(api, /"NDR raised": \["Ready to Ship", "Shipped", "Delivered", "RTO"\]/);
  assert.match(api, /"Exception": \["Ready to ship", "Booked", "Picked up", "In transit", "Out for delivery", "Returned"\]/);
  assert.match(api, /WHEN \$\{status\} = 'Ready to ship' THEN 'Ready to Ship'/);
  assert.match(api, /Shipment status would move the linked order from/);
});
