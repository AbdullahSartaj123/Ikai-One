import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");

test("COD reconciliation review is organization-scoped and cannot be submitted twice", () => {
  assert.match(worker, /SELECT id, order_reference, status[\s\S]*FROM ikai\.cod_reconciliations[\s\S]*WHERE id = \$\{reviewMatch\[1\]\}::uuid AND organization_id = \$\{user\.organizationId\}::uuid/);
  assert.match(worker, /existingRows\[0\]\.status === "under_review"/);
  assert.match(worker, /This reconciliation is already under review/);
  assert.match(worker, /AND status = \$\{existingRows\[0\]\.status\}/);
  assert.match(worker, /Reconciliation changed concurrently\. Refresh and try again/);
  assert.match(worker, /'cod_reconciliation_reviewed', 'cod_reconciliation'/);
});

test("COD reconciliation review records audit only after a successful conditional update", () => {
  const reviewStart = worker.indexOf('const reviewMatch = url.pathname.match');
  const reviewEnd = worker.indexOf('return json(request, { error: "Method or reconciliation route not supported." }, 405);', reviewStart);
  assert.ok(reviewStart >= 0 && reviewEnd > reviewStart, "review route must exist");
  const reviewRoute = worker.slice(reviewStart, reviewEnd);
  assert.ok(reviewRoute.indexOf("if (!rows[0]) return json(request, { error: \"Reconciliation changed concurrently.") < reviewRoute.indexOf("cod_reconciliation_reviewed"));
});


test("COD reconciliation save cannot overwrite under-review or resolved records", () => {
  const saveStart = worker.indexOf('if (url.pathname === "/api/cod-reconciliations" && request.method === "POST")');
  const reviewStart = worker.indexOf('const reviewMatch = url.pathname.match', saveStart);
  assert.ok(saveStart >= 0 && reviewStart > saveStart, "COD save route must exist");
  const saveRoute = worker.slice(saveStart, reviewStart);
  assert.match(saveRoute, /WHERE ikai\.cod_reconciliations\.status NOT IN \('under_review', 'resolved'\)/);
  assert.match(saveRoute, /This reconciliation is under review or resolved and cannot be overwritten/);
  assert.ok(saveRoute.indexOf("if (!rows[0])") < saveRoute.indexOf("return json(request, { data: rows[0] }, 201)"), "conflict must be handled before the success response");
});

test("COD reconciliation save preserves existing follow-up notes and remittance references when omitted", () => {
  const saveStart = worker.indexOf('if (url.pathname === "/api/cod-reconciliations" && request.method === "POST")');
  const reviewStart = worker.indexOf('const reviewMatch = url.pathname.match', saveStart);
  const saveRoute = worker.slice(saveStart, reviewStart);
  assert.match(saveRoute, /follow_up_note = COALESCE\(EXCLUDED\.follow_up_note, ikai\.cod_reconciliations\.follow_up_note\)/);
  assert.match(saveRoute, /remittance_reference = COALESCE\(EXCLUDED\.remittance_reference, ikai\.cod_reconciliations\.remittance_reference\)/);
});

test("COD reconciliation save and audit event are written atomically", () => {
  const saveStart = worker.indexOf('if (url.pathname === "/api/cod-reconciliations" && request.method === "POST")');
  const reviewStart = worker.indexOf('const reviewMatch = url.pathname.match', saveStart);
  assert.ok(saveStart >= 0 && reviewStart > saveStart, "COD save route must exist");
  const saveRoute = worker.slice(saveStart, reviewStart);
  const saved = saveRoute.indexOf("WITH saved AS (");
  const audit = saveRoute.indexOf("INSERT INTO ikai.organization_audit_events", saved);
  const result = saveRoute.indexOf("SELECT * FROM saved", saved);
  const separateAudit = saveRoute.indexOf("await sql`INSERT INTO ikai.organization_audit_events");
  assert.ok(saved >= 0 && audit > saved && result > audit, "audit insert must share the reconciliation save statement");
  assert.equal(separateAudit, -1, "reconciliation audit must not be written in a separate query");
  assert.ok(saveRoute.indexOf("if (!rows[0])") < result + saveRoute.indexOf("return json(request, { data: rows[0] }, 201)"), "conflict must be handled before success response");
});
