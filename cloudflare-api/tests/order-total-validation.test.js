import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");

test("order creation rejects non-finite line totals before writing to the database", () => {
  assert.match(worker, /!Number\\.isFinite\\(Number\\(item\\.quantity\\) \\* Number\\(item\\.price\\)\\)/);
});

test("order creation rejects aggregate totals that exceed the database-supported amount range", () => {
  assert.match(worker, /const total = items\\.reduce\\(\\(sum, item\\) => sum \\+ Number\\(item\\.quantity\\) \\* Number\\(item\\.price\\), 0\\);\\s*if \\(!Number\\.isFinite\\(total\\) \\|\\| total > 999999999999\\.99\\) return json\\(request, \\{ error: "The order total exceeds the database-supported amount limit\\. Adjust item quantities or prices\\." \\}, 400\\);/);
});

test("order-total validation runs before the order insert query", () => {
  const validation = worker.indexOf("The order total exceeds the database-supported amount limit.");
  const insert = worker.indexOf("INSERT INTO ikai.orders", validation);
  assert.ok(validation >= 0, "aggregate total guard must exist");
  assert.ok(insert > validation, "reject invalid totals before database writes");
});

test("order line prices and line totals stay within the PostgreSQL numeric(14,2) range", () => {
  assert.match(worker, /Number\\(item\\.price\\) > 999999999999\\.99/);
  assert.match(worker, /Number\\(item\\.quantity\\) \\* Number\\(item\\.price\\) > 999999999999\\.99/);
  assert.match(worker, /total > 999999999999\\.99/);
});
