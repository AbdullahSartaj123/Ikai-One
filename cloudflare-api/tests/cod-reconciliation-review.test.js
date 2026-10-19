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
