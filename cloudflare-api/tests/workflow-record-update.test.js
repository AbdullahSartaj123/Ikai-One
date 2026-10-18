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
