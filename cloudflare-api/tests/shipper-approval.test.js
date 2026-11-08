import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const migration = await readFile(new URL("../migrations/0008_shipper_approval.sql", import.meta.url), "utf8");
const authContext = await readFile(new URL("../../src/context/AuthContext.jsx", import.meta.url), "utf8");
const verifyPage = await readFile(new URL("../../src/pages/VerifyOTP.jsx", import.meta.url), "utf8");
const adminPage = await readFile(new URL("../../src/pages/AdminConsole.jsx", import.meta.url), "utf8");
const router = await readFile(new URL("../../src/main.jsx", import.meta.url), "utf8");
const appShell = await readFile(new URL("../../src/App.jsx", import.meta.url), "utf8");

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

test("platform administrators have a visible entry to the admin console on desktop and mobile", () => {
  assert.match(appShell, /user\?\.isPlatformAdmin && <Link className="mobile-admin-nav-link" to="\/admin"/);
  assert.match(appShell, /user\?\.isPlatformAdmin && <Link to="\/admin"/);
  assert.match(router, /<Route path="\/admin" element={<AdminConsole\/>}\/>/);
});

test("admin console route redirects authenticated non-admins away from platform controls", () => {
  assert.match(router, /import \{[^}]*Outlet[^}]*\} from 'react-router-dom'/);
  assert.match(router, /function PlatformAdminRoute\(\)/);
  assert.match(router, /if \(!user\?\.isPlatformAdmin\) return <Navigate to="\/app\/dashboard" replace \/>/);
  assert.match(router, /<Route element={<PlatformAdminRoute\/>}>[\s\S]*?<Route path="\/admin" element={<AdminConsole\/>}\/>/);
});

test("every platform admin endpoint is behind the shared authentication and role guard", () => {
  const guardStart = worker.indexOf('if (url.pathname.startsWith("/api/admin/"))');
  const authGuard = worker.indexOf('if (!user) return json(request, { error: "Authentication required." }, 401);', guardStart);
  const roleGuard = worker.indexOf('if (!user.isPlatformAdmin) return json(request, { error: "Platform administrator access is required." }, 403);', guardStart);
  assert.ok(guardStart >= 0, "admin routes must use a shared prefix guard");
  assert.ok(authGuard > guardStart, "authentication must run inside the shared admin guard");
  assert.ok(roleGuard > authGuard, "platform role authorization must follow authentication");
  for (const route of [
    '/api/admin/overview',
    '/api/admin/records',
    '/api/admin/audit',
    '/api/admin/organizations',
  ]) {
    const routeIndex = worker.indexOf(`url.pathname === "${route}"`, guardStart);
    assert.ok(routeIndex > roleGuard, `${route} must be dispatched only after authorization`);
  }
  assert.ok(worker.indexOf('/decision', guardStart) > roleGuard, "approval decisions must also follow the shared role guard");
});

test("platform administrator access cannot be self-provisioned or granted by public signup", () => {
  assert.ok(!migration.includes("INSERT INTO ikai.platform_admins"));
  assert.ok(!worker.includes("INSERT INTO ikai.platform_admins"));
  assert.ok(migration.includes("provisioned manually by a trusted database operator"));
  assert.ok(worker.includes("isPlatformAdmin: row.is_platform_admin === true"));
  assert.ok(worker.includes("EXISTS (SELECT 1 FROM ikai.platform_admins pa WHERE pa.user_id = u.id)"));
  assert.ok(!/admin@ikai\.one|password123|defaultAdminPassword/i.test(worker));
});

test("platform approval routes require an explicitly provisioned platform admin", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS ikai\.platform_admins/);
  assert.match(worker, /if \(!user\.isPlatformAdmin\) return json\(request, \{ error: "Platform administrator access is required\." \}, 403\)/);
  assert.match(worker, /\/api\/admin\/organizations/);
  assert.match(worker, /const limit = Math\.min\(100, Math\.max\(1, Number\.parseInt\(url\.searchParams\.get\("limit"\) \|\| "25"/);
  assert.match(worker, /pagination: \{ total, limit, offset, has_more:/);
  assert.match(adminPage, /applicationTotal\.toLocaleString\(\)/);
  assert.match(worker, /const search = String\(url\.searchParams\.get\("q"\) \|\| ""\)\.trim\(\)\.slice\(0, 100\)/);
  assert.match(worker, /o\.name ILIKE .*o\.slug ILIKE/);
  assert.match(adminPage, /Search shipper organisations/);
  assert.ok(adminPage.includes("if (applicationQuery) params.set('q', applicationQuery)"));
  assert.match(adminPage, /setApplicationOffset\(applicationOffset \+ 25\)/);
  assert.match(worker, /approval_status = 'pending'/);
  assert.match(worker, /INSERT INTO ikai\.platform_audit_events/);
  assert.match(adminPage, /Approve shipper/);
  assert.match(adminPage, /Reject application/);
});

test("admin console prevents decisions before email verification and requires rejection reasons", () => {
  assert.match(adminPage, /disabled=\{Boolean\(busyId\) \|\| !application\.email_verified\} onClick=\{\(\) => decide\(application, 'approved'\)\}/);
  assert.match(adminPage, /disabled=\{Boolean\(busyId\) \|\| !application\.email_verified \|\| !String\(notes\[application\.id\] \|\| ''\)\.trim\(\)\} onClick=\{\(\) => decide\(application, 'rejected'\)\}/);
  assert.match(adminPage, /The applicant must verify their email before you can approve or reject the application/);
  assert.match(worker, /if \(!applicant\[0\]\.email_verified\)/);
});

test("admin console ignores stale responses when filters change quickly", () => {
  assert.match(adminPage, /const applicationsRequest = useRef\(0\)/);
  assert.match(adminPage, /if \(requestId !== applicationsRequest\.current\) return/);
  assert.match(adminPage, /if \(requestId !== recordsRequest\.current\) return/);
  assert.match(adminPage, /if \(requestId !== auditRequest\.current\) return/);
  assert.match(adminPage, /if \(requestId !== overviewRequest\.current\) return/);
});

test("admin console clears the reviewed application note after a successful decision", () => {
  assert.match(adminPage, /setNotes\(previous => \{[\s\S]*?delete next\[application\.id\][\s\S]*?return next/);
});

test("authentication rate limits cover registration, login, verification, and password recovery", () => {
  const policies = worker.slice(worker.indexOf("const AUTH_RATE_LIMITS = {"), worker.indexOf("};", worker.indexOf("const AUTH_RATE_LIMITS = {")) + 2);
  for (const endpoint of [
    '"/api/auth/register": { limit: 5, windowSeconds: 3600 }',
    '"/api/auth/login": { limit: 10, windowSeconds: 60 }',
    '"/api/auth/verify-email": { limit: 10, windowSeconds: 600 }',
    '"/api/auth/resend-verification": { limit: 5, windowSeconds: 3600 }',
    '"/api/auth/forgot-password": { limit: 5, windowSeconds: 3600 }',
    '"/api/auth/reset-password": { limit: 10, windowSeconds: 600 }',
  ]) assert.ok(policies.includes(endpoint), `missing or weakened auth rate-limit policy: ${endpoint}`);
});

test("authentication rate limits apply only to POST and return a stable 429 response", () => {
  const start = worker.indexOf("async function applyAuthRateLimit");
  const end = worker.indexOf("\nasync function register", start);
  const limiter = worker.slice(start, end);
  assert.match(limiter, /if \(request\.method !== "POST"\) return null/);
  assert.match(limiter, /request\.headers\.get\("CF-Connecting-IP"\)/);
  assert.match(limiter, /INSERT INTO ikai\.auth_rate_limits/);
  assert.match(limiter, /ON CONFLICT \(bucket_key\) DO UPDATE/);
  assert.match(limiter, /request_count/);
  assert.match(limiter, /code: "RATE_LIMITED"/);
  assert.match(worker, /if \(rateLimitError\) return json\(request, rateLimitError, 429\)/);
});

test("platform admin global refresh reloads metrics, applications, records, and audit history", () => {
  assert.match(adminPage, /onClick=\{\(\) => \{ loadApplications\(\); loadOverview\(\); loadRecords\(\); loadAudit\(\) \}\}/);
});

test("admin approval decisions refresh both the application queue and platform overview", () => {
  assert.match(adminPage, /await Promise\.all\(\[loadApplications\(\), loadOverview\(\), loadAudit\(\)\]\)/);
});

test("shipper decision route validates the full UUID shape before database casts", () => {
  assert.ok(worker.includes('url.pathname.match(/^\\/api\\/admin\\/organizations\\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\\/decision$/i)'));
  assert.ok(!worker.includes('([0-9a-f-]{36})\\/decision'));
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
  assert.match(worker, /Customer-level PII is excluded from the overview/);
});


test("platform audit search includes event details and review notes", () => {
  assert.equal((worker.match(/COALESCE\(e\.details::text, ''\) ILIKE/g) || []).length, 2);
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


test("all inventory, COD, workflow, order and shipment ID routes validate UUID structure before database casts", () => {
  const strictUuid = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
  assert.ok(worker.split(strictUuid).length - 1 >= 6, "strict UUID validation should remain in the affected API routes");
  assert.ok(!worker.includes("([0-9a-f-]{36})"));
  for (const route of [
    "/api/inventory/",
    "/api/cod-reconciliations/",
    "/api/orders/",
    "/api/shipments/",
  ]) {
    assert.ok(worker.includes(route), "expected route remains covered: " + route);
  }
});


test("platform workflow record browsing omits unneeded raw payload data", () => {
  assert.match(worker, /SELECT w\.id, w\.organization_id, org\.name AS organization_name, w\.workflow_key,[\s\S]*?w\.reference, w\.title, w\.status, w\.created_at, w\.updated_at/);
  assert.ok(!worker.includes("w.status, w.payload, w.created_at"), "raw workflow payloads should not be exposed by the admin list endpoint");
  assert.doesNotMatch(adminPage, /workflow:\s*\[[^\]]*payload/);
});


test("all platform-admin routes remain behind the shared authentication and role guard", () => {
  const guardStart = worker.indexOf('if (url.pathname.startsWith("/api/admin/"))');
  const adminEnd = worker.indexOf('\n        if (url.pathname === "/api/inventory" || url.pathname.startsWith("/api/inventory/"))', guardStart);
  assert.ok(guardStart >= 0 && adminEnd > guardStart, "admin guard must be a separate route block");

  const adminBlock = worker.slice(guardStart, adminEnd);
  const authCheck = adminBlock.indexOf('if (!user) return json(request, { error: "Authentication required." }, 401);');
  const roleCheck = adminBlock.indexOf('if (!user.isPlatformAdmin) return json(request, { error: "Platform administrator access is required." }, 403);');
  assert.ok(authCheck >= 0 && roleCheck > authCheck, "authentication must precede role authorization");

  for (const route of [
    'url.pathname === "/api/admin/overview"',
    'url.pathname === "/api/admin/records"',
    'url.pathname === "/api/admin/audit"',
    'url.pathname === "/api/admin/organizations"',
    'const decisionMatch = url.pathname.match(/^\\/api\\/admin\\/organizations\\/'
  ]) {
    assert.ok(adminBlock.indexOf(route) > roleCheck, "route must be dispatched after the shared guard: " + route);
  }

  assert.ok(adminBlock.indexOf("await sql") > roleCheck, "database queries must occur after authorization");
  assert.ok(adminBlock.includes('return json(request, { error: "Admin route not found." }, 404);'), "unknown admin routes must be rejected");
});

test("admin prefix guard closes before tenant inventory routes", () => {
  const guardStart = worker.indexOf('if (url.pathname.startsWith("/api/admin/"))');
  const adminEnd = worker.indexOf('\n        if (url.pathname === "/api/inventory" || url.pathname.startsWith("/api/inventory/"))', guardStart);
  assert.ok(guardStart >= 0 && adminEnd > guardStart);
  const adminBlock = worker.slice(guardStart, adminEnd);
  assert.ok(adminBlock.endsWith('return json(request, { error: "Admin route not found." }, 404);\n        }\n'));
  const inventoryStart = worker.indexOf('if (url.pathname === "/api/inventory" || url.pathname.startsWith("/api/inventory/"))', adminEnd);
  assert.ok(inventoryStart > adminEnd);
  assert.ok(!worker.slice(inventoryStart, inventoryStart + 300).includes("isPlatformAdmin"), "tenant inventory routes must not inherit the platform-admin guard");
});


test("staging verification helper can test the pending-approval gate before isolated test approval", () => {
  const helperStart = worker.indexOf('if (url.pathname === "/api/testing/verify-email" && request.method === "POST")');
  const helperEnd = worker.indexOf('if (url.pathname === "/api/testing/check-password-reset" && request.method === "POST")', helperStart);
  assert.ok(helperStart >= 0 && helperEnd > helperStart, "verification test helper must be a distinct endpoint block");
  const helper = worker.slice(helperStart, helperEnd);
  assert.match(helper, /env\.ENABLE_TEST_HELPERS !== "true" \|\| !env\.TEST_HELPER_SECRET/);
  assert.match(helper, /request\.headers\.get\("X-Testing-Verification-Secret"\) !== env\.TEST_HELPER_SECRET/);
  assert.match(helper, /const applyTestApproval = body\.approve !== false/);
  assert.match(helper, /if \(applyTestApproval\) \{[\s\S]*?SET approval_status = 'approved'/);
  assert.match(helper, /approvalStatus: applyTestApproval \? "approved" : "pending"/);
  assert.match(helper, /Testing account email verified; shipper approval remains pending/);
});

test("staging authentication E2E explicitly expects pending shippers to be denied login", async () => {
  const workflow = await readFile(new URL("../../.github/workflows/staging-auth-e2e.yml", import.meta.url), "utf8");
  assert.match(workflow, /email:\$email,approve:false/);
  assert.match(workflow, /ACCOUNT_PENDING_APPROVAL/);
  assert.match(workflow, /email:\$email,approve:true/);
});
