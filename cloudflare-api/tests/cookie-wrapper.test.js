import test from "node:test";
import assert from "node:assert/strict";
import wrapper from "../cookie-wrapper.js";

async function preflight(origin) {
  const request = new Request("https://api.example.test/api/auth/login", {
    method: "OPTIONS",
    headers: origin ? { Origin: origin } : {},
  });
  return wrapper.fetch(request, {});
}

test("cookie wrapper enables credentialed CORS for the production website", async () => {
  const response = await preflight("https://ikai.one");
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://ikai.one");
  assert.equal(response.headers.get("Access-Control-Allow-Credentials"), "true");
  assert.match(response.headers.get("Vary") || "", /origin/i);
});

test("cookie wrapper does not allow credentials for an unapproved origin", async () => {
  const response = await preflight("https://attacker.example");
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  assert.equal(response.headers.get("Access-Control-Allow-Credentials"), null);
});

test("cookie wrapper does not grant credentialed CORS without an Origin header", async () => {
  const response = await preflight(null);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  assert.equal(response.headers.get("Access-Control-Allow-Credentials"), null);
});
