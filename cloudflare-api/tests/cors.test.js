import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

async function preflight(origin) {
  const request = new Request("https://api.example.test/api/auth/login", {
    method: "OPTIONS",
    headers: origin ? { Origin: origin } : {},
  });
  return worker.fetch(request, {});
}

test("CORS allows an explicitly approved website origin", async () => {
  const response = await preflight("https://ikai.one");
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://ikai.one");
  assert.equal(response.headers.get("Vary"), "Origin");
});

test("CORS does not return Access-Control-Allow-Origin for an unapproved origin", async () => {
  const response = await preflight("https://attacker.example");
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
});

test("CORS does not return Access-Control-Allow-Origin when Origin is absent", async () => {
  const response = await preflight(null);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
});
