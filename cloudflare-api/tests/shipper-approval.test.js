import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const migration = await readFile(new URL("../migrations/0008_shipper_approval.sql", import.meta.url), "utf8");
const authContext = await readFile(new URL("../../src/context/AuthContext.jsx", import.meta.url), "utf8");
const verifyPage = await readFile(new URL("../../src/pages/VerifyOTP.jsx", import.meta.url), "utf8");
const adminPage = await readFile(new URL("../../src/pages/AdminConsole.jsx", import.meta.url), "utf8");
const router = await readFile(new URL("../../src/main.jsx", import.meta.url), "utf8");

test("new shipper applications start pending while existing organizations remain approved by default", () => {
  assert.match(migration, /ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'/);
  assert.match(worker, /organization_type, status, approval_status\)[\s\S]*'shipper', 'active', 'pending'/);
  assert.match(worker, /approvalStatus: "pending"/);
});

test("email verification does not issue a session to a pending or rejected shipper", () => {
  assert.match(worker, /if \(!user\.isPlatformAdmin && user\.approvalStatus !== "approved"\)/);
  assert.match(worker, /emailVerified: true/);
  assert.match(worker, /const session = await createSession\(sql, user\)/);
  assert.match(authContext, /setSession\(result\.token && result\.user \? \{ user: result\.user \} : null\)/);
  assert.match(verifyPage, /awaiting Ikai\.One administrator approval/);
  assert.match(verifyPage, /verified && canContinue/);
});

test("login and existing sessions enforce approval status server-side", () => {
  assert.match(worker, /code: "ACCOUNT_PENDING_APPROVAL"/);
  assert.match(worker, /code: "ACCOUNT_REJECTED"/);
  assert.match(worker, /o\.approval_status = 'approved' OR EXISTS \(SELECT 1 FROM ikai\.platform_admins/);
});

test("admin console route redirects authenticated non-admins away from platform controls", () => {
  assert.match(router, /import \{[^}]*Outlet[^}]*\} from 'react-router-dom'/);
  assert.match(router, /function PlatformAdminRoute\(\)/);
  assert.match(router, /if \(!user\?\.isPlatformAdmin\) return <Navigate to="\/app\/dashboard" replace \/>/);
  assert.match(router, /<Route element={<PlatformAdminRoute\/>}>[\s\S]*?<Route path="\/admin" element={<AdminConsole\/>}\/>/);
});

test("platform approval routes require an explicitly provisioned platform admin", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS ikai\.platform_admins/);
  assert.match(worker, /if \(!user\.isPlatformAdmin\) return json\(request, \{ error: "Platform administrator access is required\." \}, 403\)/);
  assert.match(worker, /\/api\/admin\/organizations/);
  assert.match(worker, /const limit = Math\.min\(100, Math\.max\(1, Number\.parseInt\(url\.searchParams\.get\("limit"\) \|\| "25"/);
  assert.match(worker, /pagination: \{ total, limit, offset, has_more:/);
  assert.match(adminPage, /applicationTotal\.toLocaleString\(\)/);
  assert.match(adminPage, /setApplicationOffset\(applicationOffset \+ 25\)/);
  assert.match(worker, /approval_status = 'pending'/);
  assert.match(worker, /INSERT INTO ikai\.platform_audit_events/);
  assert.match(adminPage, /Approve shipper/);
  assert.match(adminPage, /Reject application/);
});

test("admin decision requires a rejection reason and rejects duplicate or stale decisions", () => {
  assert.match(worker, /if \(decision === "rejected" && !note\)/);
  assert.match(worker, /This application is no longer pending/);
  assert.match(worker, /approval_reviewed_by = \$\{user\.id\}::uuid/);
});

test("platform-admin-owned organizations are excluded from both the queue and direct decisions", () => {
  assert.match(worker, /NOT EXISTS \([\s\S]*?FROM ikai\.users pu[\s\S]*?JOIN ikai\.platform_admins pa ON pa\.user_id = pu\.id[\s\S]*?WHERE pu\.organization_id = o\.id[\s\S]*?\)/);
  assert.match(worker, /AS has_platform_admin_owner/);
  assert.match(worker, /if \(applicant\[0\]\.has_platform_admin_owner\) \{[\s\S]*?Platform administrator organizations cannot be reviewed/);
  assert.match(worker, /UPDATE ikai\.organizations[\s\S]*?approval_status = 'pending'[\s\S]*?NOT EXISTS \([\s\S]*?JOIN ikai\.platform_admins pa ON pa\.user_id = pu\.id[\s\S]*?WHERE pu\.organization_id = ikai\.organizations\.id/);
});


test("platform overview exposes aggregate operations metrics only to platform admins", () => {
  assert.match(worker, /url\.pathname === "\/api\/admin\/overview"/);
  assert.match(worker, /total_shippers/);
  assert.match(worker, /total_orders/);
  assert.match(worker, /total_shippers[\s\S]*?NOT EXISTS \(SELECT 1 FROM ikai\.users pu JOIN ikai\.platform_admins pa/);
  assert.match(worker, /total_shipments/);
  assert.match(worker, /confirmed_courier_bookings/);
  assert.match(worker, /cod_attention_records/);
  assert.match(worker, /if \(!user\.isPlatformAdmin\) return json\(request, \{ error: "Platform administrator access is required\." \}, 403\)/);
  assert.match(worker, /Customer-level PII is deliberately not included/);
});


test("platform administrators can search bounded read-only audit history", () => {
  assert.match(worker, /url\.pathname === "\/api\/admin\/audit"/);
  assert.match(worker, /FROM ikai\.platform_audit_events e/);
  assert.match(worker, /ORDER BY e\.created_at DESC, e\.id DESC/);
  assert.match(worker, /const limit = Math\.min\(100, Math\.max\(1/);
  assert.match(worker, /const offset = Math\.min\(100000, Math\.max\(0/);
  assert.match(adminPage, /Platform audit history/);
  assert.match(adminPage, /api\/admin\/audit/);
  assert.match(adminPage, /auditData\.map/);
});

test("platform admins can browse bounded operational records across shipper organisations", () => {
  assert.match(worker, /url\.pathname === "\/api\/admin\/records"/);
  assert.match(worker, /const allowedTypes = \["orders", "shipments", "cod", "inventory", "workflow"\]/);
  assert.match(worker, /Math\.min\(100, Math\.max\(1/);
  assert.match(worker, /Math\.min\(100000, Math\.max\(0/);
  assert.match(worker, /platform_records_viewed/);
  assert.match(worker, /INSERT INTO ikai\.platform_audit_events \(actor_user_id, target_organization_id, event_type, details\)[\s\S]*?\$\{organizationId \|\| null\}::uuid, 'platform_records_viewed'/);
  assert.match(worker, /organization_type = 'shipper'/);
  assert.match(worker, /tracking_number/);
  assert.match(adminPage, /Operational records/);
  assert.match(adminPage, /recordTypes\.map/);
  assert.match(adminPage, /Shipper organisation/);
  assert.match(adminPage, /organization_id/);
  assert.match(adminPage, /recordPagination|recordTotal/);
});


test("approval checks happen before session creation in both login and email verification", () => {
  const loginStart = worker.indexOf("async function login(");
  const loginEnd = worker.indexOf("\nasync function forgotPassword(", loginStart);
  const loginBody = worker.slice(loginStart, loginEnd);
  assert.ok(loginStart >= 0 && loginEnd > loginStart);
  assert.ok(loginBody.indexOf("if (!row.email_verified_at)") < loginBody.indexOf("if (!user.isPlatformAdmin && user.approvalStatus !== \"approved\")"));
  assert.ok(loginBody.indexOf("if (!user.isPlatformAdmin && user.approvalStatus !== \"approved\")") < loginBody.indexOf("const session = await createSession(sql, user)"));

  const verifyStart = worker.indexOf("async function verifyEmail(");
  const verifyEnd = worker.indexOf("\nasync function resendVerification(", verifyStart);
  const verifyBody = worker.slice(verifyStart, verifyEnd);
  assert.ok(verifyStart >= 0 && verifyEnd > verifyStart);
  assert.ok(verifyBody.indexOf("if (!user.isPlatformAdmin && user.approvalStatus !== \"approved\")") < verifyBody.indexOf("const session = await createSession(sql, user)"));
});

test("authenticated sessions are rejected immediately when shipper approval is revoked", () => {
  const authStart = worker.indexOf("async function authenticate(");
  const authEnd = worker.indexOf("\nexport async function readJson(", authStart);
  const authBody = worker.slice(authStart, authEnd);
  assert.ok(authStart >= 0 && authEnd > authStart);
  assert.match(authBody, /AND \(o\.approval_status = 'approved' OR EXISTS \(SELECT 1 FROM ikai\.platform_admins pa WHERE pa\.user_id = u\.id\)\)/);
  assert.match(authBody, /AND s\.revoked_at IS NULL/);
  assert.match(authBody, /AND s\.expires_at > now\(\)/);
});
