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
