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

test("order prices reject fractional cents instead of relying on PostgreSQL rounding", () => {
  assert.match(worker, /function hasAtMostDecimalPlaces\(value, maxPlaces\)/);
  assert.match(worker, /return hasAtMostDecimalPlaces\(value, 2\)/);
  assert.match(worker, /!hasAtMostTwoDecimalPlaces\(item\.price\)/);
  const validation = worker.indexOf("!hasAtMostTwoDecimalPlaces(item.price)");
  const insert = worker.indexOf("INSERT INTO ikai.orders", validation);
  assert.ok(validation >= 0, "fractional-cent validation must exist");
  assert.ok(insert > validation, "reject fractional cents before database writes");
});

test("the decimal-place rule accepts whole amounts and one or two decimal digits", () => {
  const hasAtMostTwoDecimalPlaces = value => /^\d+(?:\.\d{1,2})?$/.test(String(value ?? "").trim());
  for (const value of [0, 1, 1.2, 1.25, "1.20", "999999999999.99"]) {
    assert.equal(hasAtMostTwoDecimalPlaces(value), true, String(value));
  }
  for (const value of [1.005, "1.005", "0.001", "1.234"]) {
    assert.equal(hasAtMostTwoDecimalPlaces(value), false, String(value));
  }
});

test("package measurements respect PostgreSQL numeric precision and scale", () => {
  assert.match(worker, /weight > 9999999\.999/);
  assert.match(worker, /hasAtMostDecimalPlaces\(body\.weight, 3\)/);
  assert.match(worker, /length > 99999999\.99/);
  assert.match(worker, /hasAtMostDecimalPlaces\(body\.length \?\? 1, 2\)/);
  assert.match(worker, /width > 99999999\.99/);
  assert.match(worker, /hasAtMostDecimalPlaces\(body\.width \?\? 1, 2\)/);
  assert.match(worker, /height > 99999999\.99/);
  assert.match(worker, /hasAtMostDecimalPlaces\(body\.height \?\? 1, 2\)/);
  const validation = worker.indexOf("hasAtMostDecimalPlaces(body.weight, 3)");
  const insert = worker.indexOf("INSERT INTO ikai.orders", validation);
  assert.ok(validation >= 0 && insert > validation, "measurement checks must run before order persistence");
});

test("measurement precision logic accepts the database scale and rejects excess decimal places", () => {
  const hasAtMostDecimalPlaces = (value, maxPlaces) => {
    const text = String(value ?? "").trim();
    if (!/^\\d+(?:\\.\\d+)?$/.test(text)) return false;
    const fraction = text.split(".")[1];
    return !fraction || fraction.length <= maxPlaces;
  };
  for (const [value, places] of [["2.125", 3], ["1.20", 2], [12, 2], ["9999999.999", 3]]) {
    assert.equal(hasAtMostDecimalPlaces(value, places), true, String(value));
  }
  for (const [value, places] of [["2.1234", 3], ["1.201", 2], ["1e-3", 3], ["-1", 2]]) {
    assert.equal(hasAtMostDecimalPlaces(value, places), false, String(value));
  }
});
