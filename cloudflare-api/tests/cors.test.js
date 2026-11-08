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


test("API responses include defensive browser security headers", async () => {
  const response = await preflight("https://ikai.one");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("X-Frame-Options"), "DENY");
  assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(response.headers.get("Permissions-Policy"), "camera=(), microphone=(), geolocation=()");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("ordinary API error responses retain security headers and reject unapproved browser origins", async () => {
  const request = new Request("https://api.example.test/not-a-real-endpoint", {
    headers: { Origin: "https://attacker.example" },
  });
  const response = await worker.fetch(request, {});
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  assert.equal(response.headers.get("X-Frame-Options"), "DENY");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(response.headers.get("Permissions-Policy"), "camera=(), microphone=(), geolocation=()");
});
