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
  assert.match(frontend, /\/(\\bid\\b\|reference\|awb\|sku\|code\|number\|subject\|ticket)\/i/);
  assert.doesNotMatch(frontend, /\\\\bid\\\\b/);
});
