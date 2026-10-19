import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const migration = await readFile(new URL("../migrations/0008_shipper_approval.sql", import.meta.url), "utf8");
const authContext = await readFile(new URL("../../src/context/AuthContext.jsx", import.meta.url), "utf8");
const verifyPage = await readFile(new URL("../../src/pages/VerifyOTP.jsx", import.meta.url), "utf8");
const adminPage = await readFile(new URL("../../src/pages/AdminConsole.jsx", import.meta.url), "utf8");

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

test("platform approval routes require an explicitly provisioned platform admin", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS ikai\.platform_admins/);
  assert.match(worker, /if \(!user\.isPlatformAdmin\) return json\(request, \{ error: "Platform administrator access is required\." \}, 403\)/);
  assert.match(worker, /\/api\/admin\/organizations/);
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
});


test("platform overview exposes aggregate operations metrics only to platform admins", () => {
  assert.match(worker, /url\.pathname === "\/api\/admin\/overview"/);
  assert.match(worker, /total_shippers/);
  assert.match(worker, /total_orders/);
  assert.match(worker, /total_shipments/);
  assert.match(worker, /confirmed_courier_bookings/);
  assert.match(worker, /cod_attention_records/);
  assert.match(worker, /if \(!user\.isPlatformAdmin\) return json\(request, \{ error: "Platform administrator access is required\." \}, 403\)/);
  assert.match(worker, /Customer-level PII is deliberately not included/);
});


test("platform admins can browse bounded operational records across shipper organisations", () => {
  assert.match(worker, /url\.pathname === "\/api\/admin\/records"/);
  assert.match(worker, /const allowedTypes = \["orders", "shipments", "cod", "inventory", "workflow"\]/);
  assert.match(worker, /Math\.min\(100, Math\.max\(1/);
  assert.match(worker, /Math\.min\(100000, Math\.max\(0/);
  assert.match(worker, /platform_records_viewed/);
  assert.match(worker, /organization_type = 'shipper'/);
  assert.match(worker, /tracking_number/);
  assert.match(adminPage, /Operational records/);
  assert.match(adminPage, /recordTypes\.map/);
  assert.match(adminPage, /recordPagination|recordTotal/);
});
