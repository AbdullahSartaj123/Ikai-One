import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const wrapper = await readFile(new URL("../cookie-wrapper.js", import.meta.url), "utf8");

test("session tokens are generated randomly and only their SHA-256 hashes are persisted", () => {
  assert.match(worker, /function newToken\(\)\s*\{\s*return base64url\(randomBytes\(32\)\);/);
  assert.match(worker, /async function sha256\(value\)/);
  assert.match(worker, /const tokenHash = await sha256\(token\)/);
  assert.match(worker, /INSERT INTO ikai\.auth_sessions \(user_id, token_hash, expires_at\)/);
  assert.doesNotMatch(worker, /INSERT INTO ikai\.auth_sessions\s*\([^)]*\btoken\b/i);
});

test("session creation sets a finite seven-day expiry", () => {
  assert.match(worker, /VALUES \(\$\{user\.id\}::uuid, \$\{tokenHash\}, now\(\) \+ interval '7 days'\)/);
});

test("authentication rejects revoked and expired sessions before returning a user", () => {
  assert.match(worker, /WHERE s\.token_hash = \$\{tokenHash\}[\s\S]{0,220}AND s\.revoked_at IS NULL[\s\S]{0,100}AND s\.expires_at > now\(\)/);
  assert.match(worker, /if \(!user\) return json\(request, \{ error: "Your session is invalid or expired\. Please sign in again\." \}, 401\)/);
});

test("logout revokes only the presented session token on the server", () => {
  assert.match(worker, /if \(url\.pathname === "\/api\/auth\/logout" && request\.method === "POST"\)[\s\S]{0,450}UPDATE ikai\.auth_sessions SET revoked_at = now\(\) WHERE token_hash = \$\{tokenHash\} AND revoked_at IS NULL/);
  assert.doesNotMatch(worker, /UPDATE ikai\.auth_sessions SET revoked_at = now\(\) WHERE user_id/);
});

test("browser session cookie uses secure attributes and logout clears it", () => {
  assert.match(wrapper, /const SESSION_COOKIE = "__Host-ikai_session"/);
  assert.match(wrapper, /Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800/);
  assert.match(wrapper, /function clearCookie\(\)[\s\S]{0,140}HttpOnly; Secure; SameSite=Lax; Max-Age=0/);
  assert.match(wrapper, /delete payload\.token/);
  assert.match(wrapper, /url\.pathname === "\/api\/auth\/logout" && request\.method === "POST"[\s\S]{0,100}setCookie = clearCookie\(\)/);
});

test("multiple sessions are supported independently rather than enforcing one session per user", () => {
  assert.match(worker, /INSERT INTO ikai\.auth_sessions \(user_id, token_hash, expires_at\)/);
  assert.match(worker, /WHERE s\.token_hash = \$\{tokenHash\}/);
  assert.doesNotMatch(worker, /DELETE FROM ikai\.auth_sessions WHERE user_id/);
  assert.doesNotMatch(worker, /UPDATE ikai\.auth_sessions SET revoked_at = now\(\) WHERE user_id/);
});

test("logout clears the browser cookie even when the API cannot reach its database", async () => {
  const { default: wrapper } = await import("../cookie-wrapper.js");
  const request = new Request("https://api.example.test/api/auth/logout", {
    method: "POST",
    headers: {
      Cookie: "__Host-ikai_session=not-a-real-token",
      Origin: "https://ikai.one",
    },
  });
  const response = await wrapper.fetch(request, {});
  const setCookie = response.headers.get("Set-Cookie") || "";
  assert.match(setCookie, /^__Host-ikai_session=;/);
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Lax/);
  assert.match(setCookie, /Max-Age=0/);
});

test("session cookie is not scoped to a parent domain and is host-only", () => {
  assert.match(wrapper, /const SESSION_COOKIE = "__Host-ikai_session"/);
  assert.doesNotMatch(wrapper, /Domain=ikai\.one/i);
});

const stagingWorkflow = await readFile(new URL("../../.github/workflows/staging-auth-e2e.yml", import.meta.url), "utf8");
const stagingConfig = await readFile(new URL("../wrangler.staging.toml", import.meta.url), "utf8");

test("forced-expiry test helper is isolated behind disabled email, test flag, and secret", () => {
  assert.match(worker, /url\.pathname === "\/api\/testing\/expire-session" && request\.method === "POST"/);
  assert.match(worker, /env\.ENABLE_TEST_HELPERS !== "true" \|\| env\.DISABLE_EMAIL !== "true" \|\| !env\.TEST_HELPER_SECRET/);
  assert.match(worker, /X-Testing-Verification-Secret/);
  assert.match(worker, /SET expires_at = LEAST\(expires_at, now\(\) - interval '1 second'\)/);
  assert.match(wrapper, /url\.pathname === "\/api\/testing\/expire-session" && request\.method === "POST"/);
  assert.match(stagingConfig, /DISABLE_EMAIL = "true"/);
  assert.match(stagingConfig, /ENABLE_TEST_HELPERS = "true"/);
  assert.match(stagingConfig, /STAGING_BEARER_MODE = "true"/);
});

test("staging E2E covers two concurrent sessions, per-session logout revocation, and expiry", () => {
  assert.match(stagingWorkflow, /COOKIE_A/);
  assert.match(stagingWorkflow, /COOKIE_B/);
  assert.match(stagingWorkflow, /expire-session/);
  assert.match(stagingWorkflow, /Session A should remain active after session B logout/);
  assert.match(stagingWorkflow, /Session B bearer token should be revoked after logout/);
  assert.match(stagingWorkflow, /Expired session A should be rejected/);
});
