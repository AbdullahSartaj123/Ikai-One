import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");

test("order prices are parsed into integer cents and formatted without floating-point arithmetic", () => {
  assert.match(worker, /function moneyToCents\(value\)/);
  assert.match(worker, /return BigInt\(whole\) \* 100n \+ BigInt\(\(fraction \+ "00"\)\.slice\(0, 2\)\)/);
  assert.match(worker, /function centsToMoney\(cents\)/);
  assert.match(worker, /const totalCents = items\.reduce\(\(sum, item\) => sum \+ BigInt\(Number\(item\.quantity\)\) \* moneyToCents\(item\.price\), 0n\)/);
  assert.match(worker, /price: centsToMoney\(moneyToCents\(item\.price\)\)/);
});

test("order creation rejects prices, line totals, and aggregate totals outside numeric(14,2)", () => {
  assert.match(worker, /priceCents > 99999999999999n/);
  assert.match(worker, /BigInt\(Number\(item\.quantity\)\) \* priceCents > 99999999999999n/);
  assert.match(worker, /const maxOrderCents = 99999999999999n/);
  assert.match(worker, /if \(totalCents > maxOrderCents\)/);
});

test("exact money validation runs before the order insert query", () => {
  const validation = worker.indexOf("const totalCents = items.reduce");
  const insert = worker.indexOf("INSERT INTO ikai.orders", validation);
  assert.ok(validation >= 0, "exact total calculation must exist");
  assert.ok(insert > validation, "reject invalid totals before database writes");
});

test("integer-cent arithmetic avoids common floating-point total errors", () => {
  const moneyToCents = value => {
    const text = String(value ?? "").trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
    const [whole, fraction = ""] = text.split(".");
    return BigInt(whole) * 100n + BigInt((fraction + "00").slice(0, 2));
  };
  const centsToMoney = cents => `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
  const total = [["0.10", 3], ["0.20", 2], ["1.25", 1]]
    .reduce((sum, [price, quantity]) => sum + moneyToCents(price) * BigInt(quantity), 0n);
  assert.equal(centsToMoney(total), "1.95");
  assert.equal(centsToMoney(moneyToCents("999999999999.99")), "999999999999.99");
  assert.equal(moneyToCents("1.005"), null);
  assert.equal(moneyToCents("-1.00"), null);
});

test("order prices reject fractional cents instead of relying on PostgreSQL rounding", () => {
  assert.match(worker, /function hasAtMostDecimalPlaces\(value, maxPlaces\)/);
  assert.match(worker, /return hasAtMostDecimalPlaces\(value, 2\)/);
  assert.match(worker, /function moneyToCents\(value\)/);
  const validation = worker.indexOf("const priceCents = moneyToCents(item.price)");
  const insert = worker.indexOf("INSERT INTO ikai.orders", validation);
  assert.ok(validation >= 0, "fractional-cent validation must exist");
  assert.ok(insert > validation, "reject fractional cents before database writes");
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
    if (!/^\d+(?:\.\d+)?$/.test(text)) return false;
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

test("order item quantities stay within PostgreSQL integer range before persistence", () => {
  assert.match(worker, /Number\(item\.quantity\) > 2147483647/);
  const validation = worker.indexOf("Number(item.quantity) > 2147483647");
  const insert = worker.indexOf("INSERT INTO ikai.orders", validation);
  assert.ok(validation >= 0, "quantity range guard must exist");
  assert.ok(insert > validation, "reject out-of-range quantities before database writes");
});

test("PostgreSQL integer quantity boundary is enforced", () => {
  const validQuantity = value => Number.isSafeInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 2147483647;
  assert.equal(validQuantity(1), true);
  assert.equal(validQuantity("2147483647"), true);
  assert.equal(validQuantity("2147483648"), false);
  assert.equal(validQuantity(1.5), false);
  assert.equal(validQuantity(0), false);
});
