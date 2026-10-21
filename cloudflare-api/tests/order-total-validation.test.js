import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");

test("order creation rejects non-finite line totals before writing to the database", () => {
  assert.match(
    worker,
    /!Number\.isFinite\(Number\(item\.quantity\) \* Number\(item\.price\)\)/,
  );
});

test("order creation rejects an aggregate total that overflows JavaScript numeric range", () => {
  assert.match(
    worker,
    /const total = items\.reduce\(\(sum, item\) => sum \+ Number\(item\.quantity\) \* Number\(item\.price\), 0\);\s*if \(!Number\.isFinite\(total\)\) return json\(request, \{ error: "The order total is outside the supported range\. Adjust item quantities or prices\." \}, 400\);/,
  );
});

test("order-total validation runs before the order insert query", () => {
  const validation = worker.indexOf("The order total is outside the supported range.");
  const insert = worker.indexOf("INSERT INTO ikai.orders", validation);
  assert.ok(validation >= 0, "aggregate total guard must exist");
  assert.ok(insert > validation, "reject invalid totals before database writes");
});
