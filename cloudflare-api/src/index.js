import { neon } from "@neondatabase/serverless";

const ALLOWED_ORIGINS = new Set([
  "https://ikai.one",
  "https://www.ikai.one",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
const PASSWORD_ITERATIONS = 100000;

function headersFor(request) {
  const origin = request.headers.get("Origin");
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  // Only echo an explicitly allowlisted origin; never grant a fallback origin.
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(request, data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: headersFor(request) });
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function newToken() {
  return base64url(randomBytes(32));
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64url(new Uint8Array(digest));
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PASSWORD_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${base64url(salt)}$${base64url(new Uint8Array(bits))}`;
}

async function verifyPassword(password, stored) {
  try {
    const [algorithm, iterationText, saltText, expectedText] = String(stored).split("$");
    const iterations = Number(iterationText);
    if (algorithm !== "pbkdf2-sha256" || !Number.isInteger(iterations) || iterations < 100000 || iterations > 1000000) return false;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: fromBase64url(saltText), iterations, hash: "SHA-256" },
      key,
      256,
    );
    const actual = new Uint8Array(bits);
    const expected = fromBase64url(expectedText);
    if (actual.length !== expected.length) return false;
    let difference = 0;
    for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
    return difference === 0;
  } catch {
    return false;
  }
}

function validEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function validPassword(value) {
  return typeof value === "string" && value.length >= 12 && value.length <= 128;
}

function safeName(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function appUrl(env) {
  return String(env.APP_URL || "https://ikai.one").replace(/\/+$/, "");
}

async function sendEmail(env, { to, subject, html }) {
  // Testing Workers must never send real messages.
  if (env.DISABLE_EMAIL === "true") return false;
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, html }),
    });
    if (!response.ok) {
      console.error("Email provider rejected a message:", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email delivery failed:", error?.message || "unknown error");
    return false;
  }
}

async function sendVerificationEmail(env, email, name, token) {
  const link = `${appUrl(env)}/verify-otp?token=${encodeURIComponent(token)}`;
  return sendEmail(env, {
    to: email,
    subject: "Verify your Ikai.One account",
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#15212b"><h1>Welcome to Ikai.One</h1><p>Hello ${safeName(name)},</p><p>Confirm your email address to activate your workspace.</p><p><a href="${link}" style="display:inline-block;padding:13px 20px;background:#173f35;color:#fff;text-decoration:none;border-radius:8px">Verify email address</a></p><p>This link expires in 30 minutes and can only be used once.</p><p>If you did not create this account, you can ignore this message.</p></div>`,
  });
}

async function sendPasswordResetEmail(env, email, name, token) {
  const link = `${appUrl(env)}/verify-otp?mode=reset&token=${encodeURIComponent(token)}`;
  return sendEmail(env, {
    to: email,
    subject: "Reset your Ikai.One password",
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#15212b"><h1>Password reset</h1><p>Hello ${safeName(name)},</p><p>Use the secure link below to choose a new password.</p><p><a href="${link}" style="display:inline-block;padding:13px 20px;background:#173f35;color:#fff;text-decoration:none;border-radius:8px">Reset password</a></p><p>This link expires in 30 minutes and can only be used once. If you did not request a reset, ignore this message.</p></div>`,
  });
}

function userFromRow(row) {
  return {
    id: row.user_id || row.id,
    name: row.full_name,
    email: row.email,
    role: row.role || "organization_admin",
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    organizationSlug: row.organization_slug,
  };
}

async function createSession(sql, user) {
  const token = newToken();
  const tokenHash = await sha256(token);
  const rows = await sql`
    INSERT INTO ikai.auth_sessions (user_id, token_hash, expires_at)
    VALUES (${user.id}::uuid, ${tokenHash}, now() + interval '7 days')
    RETURNING expires_at
  `;
  return { token, expiresAt: rows[0].expires_at, user };
}

async function authenticate(request, env) {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+([A-Za-z0-9_-]{30,100})$/);
  if (!match || !env.DATABASE_URL) return null;
  const tokenHash = await sha256(match[1]);
  const sql = neon(env.DATABASE_URL);
  const rows = await sql`
    SELECT u.id AS user_id, u.organization_id, u.full_name, u.email, u.role,
      o.name AS organization_name, o.slug AS organization_slug
    FROM ikai.auth_sessions s
    JOIN ikai.users u ON u.id = s.user_id
    JOIN ikai.organizations o ON o.id = u.organization_id
    JOIN ikai.auth_identities ai ON ai.user_id = u.id
    WHERE s.token_hash = ${tokenHash}
      AND s.revoked_at IS NULL
      AND s.expires_at > now()
      AND ai.email_verified_at IS NOT NULL
      AND u.status = 'active'
      AND o.status = 'active'
    LIMIT 1
  `;
  return rows[0] ? userFromRow(rows[0]) : null;
}

export async function readJson(request) {
  const maxBytes = 20000;
  const lengthHeader = request.headers.get("Content-Length");
  if (lengthHeader && Number(lengthHeader) > maxBytes) {
    throw new Error("Request body is too large.");
  }

  // Enforce the limit while reading too; Content-Length may be absent.
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Request body must be valid JSON.");

  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new Error("Request body is too large.");
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error?.message === "Request body is too large.") throw error;
    throw new Error("Request body must be valid JSON.");
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function emailConfigurationReady(env) {
  if (env.ENABLE_TEST_HELPERS === "true" && env.DISABLE_EMAIL === "true") return true;
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

const AUTH_RATE_LIMITS = {
  "/api/auth/register": { limit: 5, windowSeconds: 3600 },
  "/api/auth/login": { limit: 10, windowSeconds: 60 },
  "/api/auth/verify-email": { limit: 10, windowSeconds: 600 },
  "/api/auth/resend-verification": { limit: 5, windowSeconds: 3600 },
  "/api/auth/forgot-password": { limit: 5, windowSeconds: 3600 },
  "/api/auth/reset-password": { limit: 10, windowSeconds: 600 },
};

async function applyAuthRateLimit(request, pathname, sql) {
  if (request.method !== "POST") return null;
  const policy = AUTH_RATE_LIMITS[pathname];
  if (!policy) return null;

  const ip = request.headers.get("CF-Connecting-IP")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  const bucketKey = await sha256(`${ip}:${pathname}`);
  const rows = await sql`
    INSERT INTO ikai.auth_rate_limits (bucket_key, window_started_at, request_count, updated_at)
    VALUES (${bucketKey}, now(), 1, now())
    ON CONFLICT (bucket_key) DO UPDATE SET
      request_count = CASE
        WHEN ikai.auth_rate_limits.window_started_at <= now() - (${policy.windowSeconds} * interval '1 second') THEN 1
        ELSE ikai.auth_rate_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN ikai.auth_rate_limits.window_started_at <= now() - (${policy.windowSeconds} * interval '1 second') THEN now()
        ELSE ikai.auth_rate_limits.window_started_at
      END,
      updated_at = now()
    RETURNING request_count
  `;
  if (Math.random() < 0.01) {
    await sql`DELETE FROM ikai.auth_rate_limits WHERE updated_at < now() - interval '2 days'`;
  }
  if (Number(rows[0]?.request_count || 0) > policy.limit) {
    return {
      error: "Too many requests. Please wait before trying again.",
      code: "RATE_LIMITED",
    };
  }
  return null;
}

async function register(request, env, sql) {
  const body = await readJson(request);
  const email = validEmail(body.email);
  const companyName = String(body.companyName || "").trim().slice(0, 120);
  const fullName = String(body.fullName || "").trim().slice(0, 120);
  const businessType = String(body.businessType || "shipper").trim().slice(0, 80);
  const password = body.password;
  if (!email || !companyName || !fullName) return json(request, { error: "Enter your name, company name, and a valid business email." }, 400);
  if (!validPassword(password)) return json(request, { error: "Use a password between 12 and 128 characters." }, 400);
  if (!emailConfigurationReady(env)) {
    return json(request, { error: "Account email is not configured yet. The platform administrator must configure the verification email service before registration can continue.", code: "EMAIL_NOT_CONFIGURED" }, 503);
  }

  const passwordHash = await hashPassword(password);
  const rawToken = newToken();
  const tokenHash = await sha256(rawToken);
  const slugBase = companyName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "workspace";
  const slug = `${slugBase}-${base64url(randomBytes(4)).toLowerCase()}`;
  let rows;
  try {
    rows = await sql`
      WITH new_org AS (
        INSERT INTO ikai.organizations (name, slug, organization_type, status)
        VALUES (${companyName}, ${slug}, 'shipper', 'active')
        RETURNING id, name, slug
      ),
      new_user AS (
        INSERT INTO ikai.users (organization_id, full_name, email, role, status)
        SELECT id, ${fullName}, ${email}, 'organization_admin', 'active' FROM new_org
        RETURNING id, organization_id, full_name, email, role
      ),
      new_identity AS (
        INSERT INTO ikai.auth_identities (user_id, email, password_hash)
        SELECT id, email, ${passwordHash} FROM new_user
        RETURNING user_id
      ),
      new_verification AS (
        INSERT INTO ikai.auth_tokens (user_id, token_hash, purpose, expires_at)
        SELECT id, ${tokenHash}, 'verify_email', now() + interval '30 minutes' FROM new_user
        RETURNING user_id
      )
      SELECT u.id AS user_id, u.organization_id, u.full_name, u.email, u.role,
        o.name AS organization_name, o.slug AS organization_slug
      FROM new_user u JOIN new_org o ON o.id = u.organization_id
    `;
  } catch (error) {
    console.error("Account registration failed:", error?.message || "unknown error");
    if (error?.code === "23505") {
      return json(request, { error: "An account with this email already exists. Sign in or request a password reset." }, 409);
    }
    if (env.ENABLE_TEST_HELPERS === "true" && env.DISABLE_EMAIL === "true" &&
        request.headers.get("X-Testing-Verification-Secret") === env.TEST_HELPER_SECRET) {
      let roleConstraint = null;
      try {
        const constraints = await sql`
          SELECT pg_get_constraintdef(c.oid) AS definition
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          WHERE n.nspname = 'ikai' AND t.relname = 'users' AND c.conname = 'users_role_check'
          LIMIT 1
        `;
        roleConstraint = constraints[0]?.definition || null;
      } catch { /* diagnostic must not mask the original error */ }
      return json(request, { error: "Testing registration diagnostic.", databaseCode: error?.code || null, databaseMessage: String(error?.message || "unknown").slice(0, 300), roleConstraint }, 503);
    }
    return json(request, { error: "Account creation is temporarily unavailable. Confirm the authentication migration has been applied, then try again." }, 503);
  }

  const user = userFromRow(rows[0]);
  const emailSent = await sendVerificationEmail(env, email, fullName, rawToken);
  return json(request, {
    message: emailSent ? "Account created. Check your email to verify your address." : "Account created, but the verification email could not be delivered. Request a new verification email after the mail service is checked.",
    emailSent,
    email: user.email,
  }, 201);
}

async function verifyEmail(request, env, sql) {
  const body = await readJson(request);
  const rawToken = String(body.token || "");
  if (rawToken.length < 30 || rawToken.length > 100) return json(request, { error: "This verification link is invalid or has expired." }, 400);
  const tokenHash = await sha256(rawToken);
  const rows = await sql`
    WITH consumed AS (
      UPDATE ikai.auth_tokens
      SET consumed_at = now()
      WHERE token_hash = ${tokenHash}
        AND purpose = 'verify_email'
        AND consumed_at IS NULL
        AND expires_at > now()
      RETURNING user_id
    ),
    verified AS (
      UPDATE ikai.auth_identities ai
      SET email_verified_at = COALESCE(ai.email_verified_at, now()), updated_at = now()
      FROM consumed c
      WHERE ai.user_id = c.user_id
      RETURNING ai.user_id
    )
    SELECT u.id AS user_id, u.organization_id, u.full_name, u.email, u.role,
      o.name AS organization_name, o.slug AS organization_slug
    FROM verified v
    JOIN ikai.users u ON u.id = v.user_id
    JOIN ikai.organizations o ON o.id = u.organization_id
    LIMIT 1
  `;
  if (!rows[0]) return json(request, { error: "This verification link is invalid, expired, or already used. Request a new one." }, 400);
  const session = await createSession(sql, userFromRow(rows[0]));
  return json(request, { message: "Email verified successfully.", ...session });
}

async function resendVerification(request, env, sql) {
  const body = await readJson(request);
  const email = validEmail(body.email);
  if (!email) return json(request, { error: "Enter a valid email address." }, 400);
  if (!emailConfigurationReady(env)) return json(request, { error: "The verification email service is not configured yet.", code: "EMAIL_NOT_CONFIGURED" }, 503);
  const rows = await sql`
    SELECT ai.user_id, ai.email, u.full_name
    FROM ikai.auth_identities ai
    JOIN ikai.users u ON u.id = ai.user_id
    WHERE lower(ai.email) = ${email} AND ai.email_verified_at IS NULL
    LIMIT 1
  `;
  if (rows[0]) {
    const token = newToken();
    const tokenHash = await sha256(token);
    await sql`
      INSERT INTO ikai.auth_tokens (user_id, token_hash, purpose, expires_at)
      VALUES (${rows[0].user_id}::uuid, ${tokenHash}, 'verify_email', now() + interval '30 minutes')
    `;
    await sendVerificationEmail(env, email, rows[0].full_name, token);
  }
  return json(request, { message: "If the account exists and still needs verification, a new email will be sent." });
}

async function login(request, env, sql) {
  const body = await readJson(request);
  const email = validEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || password.length > 128) return json(request, { error: "Enter your email and password." }, 400);
  const rows = await sql`
    SELECT u.id AS user_id, u.organization_id, u.full_name, u.email, u.role,
      o.name AS organization_name, o.slug AS organization_slug,
      ai.password_hash, ai.email_verified_at
    FROM ikai.auth_identities ai
    JOIN ikai.users u ON u.id = ai.user_id
    JOIN ikai.organizations o ON o.id = u.organization_id
    WHERE lower(ai.email) = ${email}
      AND u.status = 'active'
      AND o.status = 'active'
    LIMIT 1
  `;
  const row = rows[0];
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return json(request, { error: "Email or password is incorrect." }, 401);
  }
  if (!row.email_verified_at) return json(request, { error: "Verify your email before signing in.", code: "EMAIL_NOT_VERIFIED", email: row.email }, 403);
  const user = userFromRow(row);
  const session = await createSession(sql, user);
  return json(request, session);
}

async function forgotPassword(request, env, sql) {
  const body = await readJson(request);
  const email = validEmail(body.email);
  if (!email) return json(request, { error: "Enter a valid email address." }, 400);
  if (!emailConfigurationReady(env)) return json(request, { error: "The password recovery email service is not configured yet.", code: "EMAIL_NOT_CONFIGURED" }, 503);
  const rows = await sql`
    SELECT ai.user_id, ai.email, u.full_name
    FROM ikai.auth_identities ai
    JOIN ikai.users u ON u.id = ai.user_id
    WHERE lower(ai.email) = ${email} AND ai.email_verified_at IS NOT NULL
    LIMIT 1
  `;
  if (rows[0]) {
    const token = newToken();
    const tokenHash = await sha256(token);
    await sql`
      INSERT INTO ikai.auth_tokens (user_id, token_hash, purpose, expires_at)
      VALUES (${rows[0].user_id}::uuid, ${tokenHash}, 'password_reset', now() + interval '30 minutes')
    `;
    await sendPasswordResetEmail(env, rows[0].email, rows[0].full_name, token);
  }
  return json(request, { message: "If a verified account exists for that email, a password reset link will be sent." });
}

async function resetPassword(request, env, sql) {
  const body = await readJson(request);
  const rawToken = String(body.token || "");
  const password = body.password;
  if (rawToken.length < 30 || rawToken.length > 100) return json(request, { error: "This reset link is invalid or has expired." }, 400);
  if (!validPassword(password)) return json(request, { error: "Use a password between 12 and 128 characters." }, 400);
  const tokenHash = await sha256(rawToken);
  const passwordHash = await hashPassword(password);
  const rows = await sql`
    WITH consumed AS (
      UPDATE ikai.auth_tokens
      SET consumed_at = now()
      WHERE token_hash = ${tokenHash}
        AND purpose = 'password_reset'
        AND consumed_at IS NULL
        AND expires_at > now()
      RETURNING user_id
    ),
    updated AS (
      UPDATE ikai.auth_identities ai
      SET password_hash = ${passwordHash}, updated_at = now()
      FROM consumed c
      WHERE ai.user_id = c.user_id
      RETURNING ai.user_id
    ),
    revoked AS (
      UPDATE ikai.auth_sessions s
      SET revoked_at = now()
      FROM updated u
      WHERE s.user_id = u.user_id AND s.revoked_at IS NULL
      RETURNING s.id
    )
    SELECT user_id FROM updated LIMIT 1
  `;
  if (!rows[0]) return json(request, { error: "This reset link is invalid, expired, or already used. Request a new one." }, 400);
  return json(request, { message: "Password updated. You can now sign in with your new password." });
}


async function validateReturnLinks(sql, organizationId, payload) {
  const orderId = String(payload?.["Source order UUID"] || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    return "Return requests must reference a valid saved order.";
  }
  const orders = await sql`
    SELECT id
    FROM ikai.orders
    WHERE id = ${orderId}::uuid AND organization_id = ${organizationId}::uuid
    LIMIT 1
  `;
  if (!orders[0]) return "The selected order was not found in your organization.";

  const shipmentId = String(payload?.["Source shipment UUID"] || "").trim();
  if (!shipmentId) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(shipmentId)) {
    return "The linked shipment ID is invalid.";
  }
  const shipments = await sql`
    SELECT id
    FROM ikai.shipment_records
    WHERE id = ${shipmentId}::uuid
      AND order_id = ${orderId}::uuid
      AND organization_id = ${organizationId}::uuid
    LIMIT 1
  `;
  if (!shipments[0]) return "The selected shipment does not belong to the selected order in your organization.";
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(request) });
    if (url.pathname === "/" || url.pathname === "/health") {
      return json(request, { name: "Ikai.One API", status: "running", version: "2.0.0" });
    }
    if (url.pathname === "/api") {
      return json(request, {
        platform: "Ikai.One",
        modules: ["authentication", "organizations", "users", "customers", "courier-partners", "shipments", "tracking", "pickup-requests", "returns", "cash-on-delivery", "invoices", "reconciliation"],
      });
    }
    if (url.pathname === "/health/database") {
      if (!env.DATABASE_URL) return json(request, { status: "not_configured", message: "DATABASE_URL is not configured." }, 503);
      try {
        const sql = neon(env.DATABASE_URL);
        const rows = await sql`
          SELECT current_database() AS database,
            EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'ikai') AS ikai_schema_exists,
            NOW() AS checked_at
        `;
        return json(request, { status: "connected", database: rows[0].database, ikaiSchemaExists: rows[0].ikai_schema_exists, checkedAt: rows[0].checked_at });
      } catch (error) {
        console.error("Database health check failed:", error?.message || "unknown error");
        return json(request, { status: "disconnected", message: "Database connection failed. Check Worker secrets and Neon settings." }, 503);
      }
    }

    if (url.pathname.startsWith("/api/auth/") || url.pathname === "/api/shipments" || url.pathname === "/api/inventory" || url.pathname.startsWith("/api/inventory/") || url.pathname === "/api/orders" || url.pathname.startsWith("/api/orders/") || url.pathname === "/api/cod-reconciliations" || url.pathname.startsWith("/api/cod-reconciliations/") || url.pathname === "/api/workflows" || /^\/api\/workflows\/[0-9a-f-]{36}(?:\/status)?$/i.test(url.pathname) || url.pathname === "/api/testing/verify-email" || url.pathname === "/api/testing/check-password-reset") {
      if (!env.DATABASE_URL) return json(request, { error: "Database is not configured." }, 503);
      let sql;
      try {
        sql = neon(env.DATABASE_URL);
        const rateLimitError = await applyAuthRateLimit(request, url.pathname, sql);
        if (rateLimitError) return json(request, rateLimitError, 429);
        if (url.pathname === "/api/testing/verify-email" && request.method === "POST") {
          if (env.ENABLE_TEST_HELPERS !== "true" || !env.TEST_HELPER_SECRET) {
            return json(request, { error: "Endpoint not found." }, 404);
          }
          if (request.headers.get("X-Testing-Verification-Secret") !== env.TEST_HELPER_SECRET) {
            return json(request, { error: "Not found." }, 404);
          }
          const body = await readJson(request);
          const email = validEmail(body.email);
          if (!email) return json(request, { error: "Enter a valid email address." }, 400);
          const rows = await sql`
            UPDATE ikai.auth_identities ai
            SET email_verified_at = COALESCE(ai.email_verified_at, now()), updated_at = now()
            FROM ikai.users u
            WHERE u.id = ai.user_id AND lower(ai.email) = ${email}
            RETURNING ai.user_id
          `;
          if (!rows[0]) return json(request, { error: "No account found for that email." }, 404);
          await sql`
            UPDATE ikai.auth_tokens
            SET consumed_at = COALESCE(consumed_at, now())
            WHERE user_id = ${rows[0].user_id} AND purpose = 'verify_email' AND consumed_at IS NULL
          `;
          return json(request, { message: "Testing account email verified." });
        }
        if (url.pathname === "/api/testing/check-password-reset" && request.method === "POST") {
          if (env.ENABLE_TEST_HELPERS !== "true" || env.DISABLE_EMAIL !== "true" || !env.TEST_HELPER_SECRET) {
            return json(request, { error: "Endpoint not found." }, 404);
          }
          if (request.headers.get("X-Testing-Verification-Secret") !== env.TEST_HELPER_SECRET) {
            return json(request, { error: "Not found." }, 404);
          }
          const body = await readJson(request);
          const email = validEmail(body.email);
          const newPassword = body.newPassword;
          if (!email || !validPassword(newPassword)) return json(request, { error: "Provide a valid email and a password between 12 and 128 characters." }, 400);
          const rows = await sql`
            SELECT ai.user_id
            FROM ikai.auth_identities ai
            WHERE lower(ai.email) = ${email} AND ai.email_verified_at IS NOT NULL
            LIMIT 1
          `;
          if (!rows[0]) return json(request, { error: "No verified account found for that email." }, 404);
          const token = newToken();
          const tokenHash = await sha256(token);
          await sql`
            INSERT INTO ikai.auth_tokens (user_id, token_hash, purpose, expires_at)
            VALUES (${rows[0].user_id}::uuid, ${tokenHash}, 'password_reset', now() + interval '30 minutes')
          `;
          const resetRequest = () => new Request("https://testing.invalid/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password: newPassword }),
          });
          const firstReset = await resetPassword(resetRequest(), env, sql);
          const firstResetBody = await firstReset.json();
          const reusedReset = await resetPassword(resetRequest(), env, sql);
          return json(request, {
            firstResetStatus: firstReset.status,
            firstResetMessage: firstResetBody.message || null,
            reuseStatus: reusedReset.status,
          });
        }

        if (url.pathname === "/api/auth/register" && request.method === "POST") return await register(request, env, sql);
        if (url.pathname === "/api/auth/login" && request.method === "POST") return await login(request, env, sql);
        if (url.pathname === "/api/auth/verify-email" && request.method === "POST") return await verifyEmail(request, env, sql);
        if (url.pathname === "/api/auth/resend-verification" && request.method === "POST") return await resendVerification(request, env, sql);
        if (url.pathname === "/api/auth/forgot-password" && request.method === "POST") return await forgotPassword(request, env, sql);
        if (url.pathname === "/api/auth/reset-password" && request.method === "POST") return await resetPassword(request, env, sql);

        if (url.pathname === "/api/auth/me" && request.method === "GET") {
          const user = await authenticate(request, env);
          if (!user) return json(request, { error: "Your session is invalid or expired. Please sign in again." }, 401);
          return json(request, { user });
        }
        if (url.pathname === "/api/auth/logout" && request.method === "POST") {
          const header = request.headers.get("Authorization") || "";
          const match = header.match(/^Bearer\s+([A-Za-z0-9_-]{30,100})$/);
          if (match) {
            const tokenHash = await sha256(match[1]);
            await sql`UPDATE ikai.auth_sessions SET revoked_at = now() WHERE token_hash = ${tokenHash} AND revoked_at IS NULL`;
          }
          return json(request, { message: "Signed out." });
        }
        if (url.pathname === "/api/inventory" || url.pathname.startsWith("/api/inventory/")) {
          const user = await authenticate(request, env);
          if (!user) return json(request, { error: "Authentication required." }, 401);

          if (url.pathname === "/api/inventory" && request.method === "GET") {
            const requestedLimit = Number(url.searchParams.get("limit") || "100");
            if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) {
              return json(request, { error: "limit must be an integer between 1 and 100." }, 400);
            }
            const search = String(url.searchParams.get("search") || "").trim().slice(0, 120);
            const rows = search
              ? await sql`SELECT id, sku, name, variant, warehouse, quantity_on_hand, reorder_level, unit_cost, (quantity_on_hand * unit_cost) AS stock_value, CASE WHEN quantity_on_hand = 0 THEN 'out_of_stock' WHEN quantity_on_hand <= reorder_level THEN 'low_stock' ELSE 'in_stock' END AS stock_status, created_at, updated_at FROM ikai.inventory_items WHERE organization_id = ${user.organizationId}::uuid AND (sku ILIKE ${'%' + search + '%'} OR name ILIKE ${'%' + search + '%'} OR warehouse ILIKE ${'%' + search + '%'}) ORDER BY updated_at DESC LIMIT ${requestedLimit}`
              : await sql`SELECT id, sku, name, variant, warehouse, quantity_on_hand, reorder_level, unit_cost, (quantity_on_hand * unit_cost) AS stock_value, CASE WHEN quantity_on_hand = 0 THEN 'out_of_stock' WHEN quantity_on_hand <= reorder_level THEN 'low_stock' ELSE 'in_stock' END AS stock_status, created_at, updated_at FROM ikai.inventory_items WHERE organization_id = ${user.organizationId}::uuid ORDER BY updated_at DESC LIMIT ${requestedLimit}`;
            return json(request, { data: rows, count: rows.length, limit: requestedLimit });
          }

          if (url.pathname === "/api/inventory" && request.method === "POST") {
            const body = await readJson(request);
            const sku = String(body.sku || "").trim().slice(0, 100);
            const name = String(body.name || "").trim().slice(0, 200);
            const variant = String(body.variant || "").trim().slice(0, 160) || null;
            const warehouse = String(body.warehouse || "Main warehouse").trim().slice(0, 160);
            const quantity = Number(body.quantityOnHand ?? 0);
            const reorderLevel = Number(body.reorderLevel ?? 0);
            const unitCost = Number(body.unitCost ?? 0);
            if (!sku || !name || !warehouse || !Number.isSafeInteger(quantity) || quantity < 0 ||
                !Number.isSafeInteger(reorderLevel) || reorderLevel < 0 || !Number.isFinite(unitCost) || unitCost < 0) {
              return json(request, { error: "Provide SKU, product name, warehouse, non-negative whole-number stock/reorder level and a valid unit cost." }, 400);
            }
            const rows = await sql`
              INSERT INTO ikai.inventory_items
                (organization_id, sku, name, variant, warehouse, quantity_on_hand, reorder_level, unit_cost, created_by, updated_by)
              VALUES
                (${user.organizationId}::uuid, ${sku}, ${name}, ${variant}, ${warehouse}, ${quantity}, ${reorderLevel}, ${unitCost}, ${user.id}::uuid, ${user.id}::uuid)
              RETURNING id, sku, name, variant, warehouse, quantity_on_hand, reorder_level, unit_cost, created_at, updated_at
            `;
            if (quantity > 0) {
              await sql`
                INSERT INTO ikai.inventory_movements
                  (organization_id, item_id, movement_type, quantity_delta, quantity_before, quantity_after, reason, actor_user_id)
                VALUES
                  (${user.organizationId}::uuid, ${rows[0].id}::uuid, 'opening_balance', ${quantity}, 0, ${quantity}, 'Opening stock recorded when item was created', ${user.id}::uuid)
              `;
            }
            await sql`INSERT INTO ikai.organization_audit_events (organization_id, actor_user_id, event_type, entity_type, entity_reference, details) VALUES (${user.organizationId}::uuid, ${user.id}::uuid, 'inventory_item_created', 'inventory_item', ${sku}, jsonb_build_object('quantityOnHand', ${quantity}, 'warehouse', ${warehouse}))`;
            return json(request, { data: rows[0] }, 201);
          }

          const adjustMatch = url.pathname.match(/^\/api\/inventory\/([0-9a-f-]{36})\/adjust$/i);
          if (adjustMatch && request.method === "POST") {
            const body = await readJson(request);
            const delta = Number(body.quantityDelta);
            const reason = String(body.reason || "").trim().slice(0, 500);
            const reference = String(body.reference || "").trim().slice(0, 120) || null;
            if (!Number.isSafeInteger(delta) || delta === 0 || !reason) {
              return json(request, { error: "Enter a non-zero whole-number quantity change and a reason." }, 400);
            }
            const movementType = String(body.movementType || (delta > 0 ? "adjustment_in" : "adjustment_out"));
            if (!["receipt", "adjustment_in", "adjustment_out", "correction"].includes(movementType) ||
                (delta > 0 && movementType === "adjustment_out") || (delta < 0 && ["receipt", "adjustment_in"].includes(movementType))) {
              return json(request, { error: "Movement type does not match the quantity change." }, 400);
            }
            const rows = await sql`
              WITH changed AS (
                UPDATE ikai.inventory_items
                SET quantity_on_hand = quantity_on_hand + ${delta}, updated_by = ${user.id}::uuid, updated_at = now()
                WHERE id = ${adjustMatch[1]}::uuid
                  AND organization_id = ${user.organizationId}::uuid
                  AND quantity_on_hand + ${delta} >= 0
                RETURNING id, sku, name, warehouse, quantity_on_hand, reorder_level, unit_cost,
                  quantity_on_hand - ${delta} AS quantity_before
              ), logged AS (
                INSERT INTO ikai.inventory_movements
                  (organization_id, item_id, movement_type, quantity_delta, quantity_before, quantity_after, reason, reference, actor_user_id)
                SELECT ${user.organizationId}::uuid, id, ${movementType}, ${delta}, quantity_before, quantity_on_hand, ${reason}, ${reference}, ${user.id}::uuid
                FROM changed
                RETURNING id, item_id, movement_type, quantity_delta, quantity_before, quantity_after, reason, reference, created_at
              )
              SELECT changed.*, logged.id AS movement_id, logged.movement_type, logged.quantity_delta, logged.quantity_before, logged.quantity_after
              FROM changed JOIN logged ON logged.item_id = changed.id
            `;
            if (!rows[0]) {
              const exists = await sql`SELECT id, quantity_on_hand FROM ikai.inventory_items WHERE id = ${adjustMatch[1]}::uuid AND organization_id = ${user.organizationId}::uuid LIMIT 1`;
              if (!exists[0]) return json(request, { error: "Inventory item not found." }, 404);
              return json(request, { error: "This adjustment would make stock negative. Current stock: " + exists[0].quantity_on_hand }, 409);
            }
            await sql`INSERT INTO ikai.organization_audit_events (organization_id, actor_user_id, event_type, entity_type, entity_reference, details) VALUES (${user.organizationId}::uuid, ${user.id}::uuid, 'inventory_stock_adjusted', 'inventory_item', ${rows[0].sku}, jsonb_build_object('delta', ${delta}, 'quantityBefore', ${rows[0].quantity_before}, 'quantityAfter', ${rows[0].quantity_after}, 'reason', ${reason}))`;
            return json(request, { data: rows[0] });
          }

          const movementsMatch = url.pathname.match(/^\/api\/inventory\/([0-9a-f-]{36})\/movements$/i);
          if (movementsMatch && request.method === "GET") {
            const requestedLimit = Number(url.searchParams.get("limit") || "50");
            if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) return json(request, { error: "limit must be an integer between 1 and 100." }, 400);
            const rows = await sql`
              SELECT m.id, m.movement_type, m.quantity_delta, m.quantity_before, m.quantity_after, m.reason, m.reference, m.created_at, u.full_name AS actor_name
              FROM ikai.inventory_movements m
              LEFT JOIN ikai.users u ON u.id = m.actor_user_id
              WHERE m.organization_id = ${user.organizationId}::uuid AND m.item_id = ${movementsMatch[1]}::uuid
              ORDER BY m.created_at DESC LIMIT ${requestedLimit}
            `;
            const item = await sql`SELECT id FROM ikai.inventory_items WHERE id = ${movementsMatch[1]}::uuid AND organization_id = ${user.organizationId}::uuid LIMIT 1`;
            if (!item[0]) return json(request, { error: "Inventory item not found." }, 404);
            return json(request, { data: rows, count: rows.length, limit: requestedLimit });
          }
          return json(request, { error: "Method or inventory route not supported." }, 405);
        }

        if (url.pathname === "/api/cod-reconciliations" || url.pathname.startsWith("/api/cod-reconciliations/")) {
          const user = await authenticate(request, env);
          if (!user) return json(request, { error: "Authentication required." }, 401);

          if (url.pathname === "/api/cod-reconciliations" && request.method === "GET") {
            const requestedLimit = Number(url.searchParams.get("limit") || "50");
            if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) {
              return json(request, { error: "limit must be an integer between 1 and 100." }, 400);
            }
            const status = String(url.searchParams.get("status") || "").trim();
            const allowedStatuses = ["pending", "matched", "short_paid", "under_review", "resolved"];
            if (status && !allowedStatuses.includes(status)) {
              return json(request, { error: "Invalid reconciliation status." }, 400);
            }
            const rows = status
              ? await sql`SELECT id, order_reference, awb, courier_name, delivered_at, cod_expected, amount_remitted, (cod_expected - amount_remitted) AS difference, status, follow_up_note, remittance_reference, reviewed_at, created_at, updated_at FROM ikai.cod_reconciliations WHERE organization_id = ${user.organizationId}::uuid AND status = ${status} ORDER BY updated_at DESC LIMIT ${requestedLimit}`
              : await sql`SELECT id, order_reference, awb, courier_name, delivered_at, cod_expected, amount_remitted, (cod_expected - amount_remitted) AS difference, status, follow_up_note, remittance_reference, reviewed_at, created_at, updated_at FROM ikai.cod_reconciliations WHERE organization_id = ${user.organizationId}::uuid ORDER BY updated_at DESC LIMIT ${requestedLimit}`;
            return json(request, { data: rows, count: rows.length, limit: requestedLimit });
          }

          if (url.pathname === "/api/cod-reconciliations" && request.method === "POST") {
            const body = await readJson(request);
            const orderReference = String(body.orderReference || "").trim().slice(0, 100);
            const awb = String(body.awb || "").trim().slice(0, 100) || null;
            const courierName = String(body.courierName || "").trim().slice(0, 100);
            const codExpected = Number(body.codExpected);
            const amountRemitted = body.amountRemitted === undefined ? 0 : Number(body.amountRemitted);
            const deliveredAt = body.deliveredAt ? new Date(body.deliveredAt) : null;
            const note = String(body.followUpNote || "").trim().slice(0, 2000) || null;
            const remittanceReference = String(body.remittanceReference || "").trim().slice(0, 100) || null;
            if (!orderReference || !courierName || !Number.isFinite(codExpected) || codExpected < 0 ||
                !Number.isFinite(amountRemitted) || amountRemitted < 0 ||
                (deliveredAt && Number.isNaN(deliveredAt.getTime()))) {
              return json(request, { error: "Provide a valid order reference, courier, non-negative COD amounts and optional delivery date." }, 400);
            }
            const status = amountRemitted === 0 ? "pending" : amountRemitted === codExpected ? "matched" : "short_paid";
            const rows = await sql`
              INSERT INTO ikai.cod_reconciliations
                (organization_id, order_reference, awb, courier_name, delivered_at, cod_expected, amount_remitted, status, follow_up_note, remittance_reference, created_by)
              VALUES
                (${user.organizationId}::uuid, ${orderReference}, ${awb}, ${courierName}, ${deliveredAt}, ${codExpected}, ${amountRemitted}, ${status}, ${note}, ${remittanceReference}, ${user.id}::uuid)
              ON CONFLICT (organization_id, order_reference) DO UPDATE SET
                awb = EXCLUDED.awb, courier_name = EXCLUDED.courier_name,
                delivered_at = EXCLUDED.delivered_at, cod_expected = EXCLUDED.cod_expected,
                amount_remitted = EXCLUDED.amount_remitted, status = EXCLUDED.status,
                follow_up_note = EXCLUDED.follow_up_note, remittance_reference = EXCLUDED.remittance_reference,
                updated_at = now()
              RETURNING id, order_reference, awb, courier_name, delivered_at, cod_expected, amount_remitted, (cod_expected - amount_remitted) AS difference, status, follow_up_note, remittance_reference, created_at, updated_at
            `;
            await sql`
              INSERT INTO ikai.organization_audit_events (organization_id, actor_user_id, event_type, entity_type, entity_reference, details)
              VALUES (${user.organizationId}::uuid, ${user.id}::uuid, 'cod_reconciliation_saved', 'cod_reconciliation', ${orderReference}, jsonb_build_object('status', ${status}, 'codExpected', ${codExpected}, 'amountRemitted', ${amountRemitted}))
            `;
            return json(request, { data: rows[0] }, 201);
          }

          const reviewMatch = url.pathname.match(/^\/api\/cod-reconciliations\/([0-9a-f-]{36})\/review$/i);
          if (reviewMatch && request.method === "POST") {
            const body = await readJson(request);
            const note = String(body.followUpNote || "").trim().slice(0, 2000) || null;
            const rows = await sql`
              UPDATE ikai.cod_reconciliations
              SET status = 'under_review', follow_up_note = COALESCE(${note}, follow_up_note),
                  reviewed_by = ${user.id}::uuid, reviewed_at = now(), updated_at = now()
              WHERE id = ${reviewMatch[1]}::uuid AND organization_id = ${user.organizationId}::uuid
              RETURNING id, order_reference, status, follow_up_note, reviewed_at, updated_at
            `;
            if (!rows[0]) return json(request, { error: "Reconciliation record not found." }, 404);
            await sql`
              INSERT INTO ikai.organization_audit_events (organization_id, actor_user_id, event_type, entity_type, entity_reference, details)
              VALUES (${user.organizationId}::uuid, ${user.id}::uuid, 'cod_reconciliation_reviewed', 'cod_reconciliation', ${rows[0].order_reference}, jsonb_build_object('status', 'under_review'))
            `;
            return json(request, { data: rows[0] });
          }
          return json(request, { error: "Method or reconciliation route not supported." }, 405);
        }

        if (url.pathname === "/api/workflows" || /^\/api\/workflows\/[0-9a-f-]{36}(?:\/status)?$/i.test(url.pathname)) {
          const user = await authenticate(request, env);
          if (!user) return json(request, { error: "Authentication required." }, 401);

          if (url.pathname === "/api/workflows" && request.method === "GET") {
            const workflowKey = String(url.searchParams.get("workflow") || "").trim().toLowerCase();
            const requestedLimit = Number(url.searchParams.get("limit") || "100");
            const search = String(url.searchParams.get("search") || "").trim().slice(0, 120);
            const status = String(url.searchParams.get("status") || "").trim();
            if (!/^[a-z0-9-]{1,80}$/.test(workflowKey)) return json(request, { error: "A valid workflow key is required." }, 400);
            if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) return json(request, { error: "limit must be an integer between 1 and 100." }, 400);
            const rows = await sql`
              SELECT id, workflow_key, reference, title, status, payload, created_at, updated_at
              FROM ikai.workflow_records
              WHERE organization_id = ${user.organizationId}::uuid
                AND workflow_key = ${workflowKey}
                AND (${search} = '' OR reference ILIKE '%' || ${search} || '%' OR title ILIKE '%' || ${search} || '%' OR payload::text ILIKE '%' || ${search} || '%')
                AND (${status} = '' OR status = ${status})
              ORDER BY updated_at DESC LIMIT ${requestedLimit}
            `;
            return json(request, { data: rows, count: rows.length, limit: requestedLimit, workflow: workflowKey });
          }

          if (url.pathname === "/api/workflows" && request.method === "POST") {
            const body = await readJson(request);
            const workflowKey = String(body.workflowKey || "").trim().toLowerCase();
            const reference = String(body.reference || "").trim().slice(0, 160);
            const title = String(body.title || "").trim().slice(0, 200);
            const status = String(body.status || "Open").trim().slice(0, 60) || "Open";
            const payload = body.payload && typeof body.payload === "object" && !Array.isArray(body.payload) ? body.payload : {};
            if (!/^[a-z0-9-]{1,80}$/.test(workflowKey) || !reference || !title) {
              return json(request, { error: "Provide a valid workflow key, reference and title." }, 400);
            }
            if (JSON.stringify(payload).length > 20000) return json(request, { error: "Workflow details are too large." }, 413);
            if (workflowKey === "returns") {
              const linkError = await validateReturnLinks(sql, user.organizationId, payload);
              if (linkError) return json(request, { error: linkError }, 400);
            }
            const rows = await sql`
              INSERT INTO ikai.workflow_records
                (organization_id, workflow_key, reference, title, status, payload, created_by, updated_by)
              VALUES
                (${user.organizationId}::uuid, ${workflowKey}, ${reference}, ${title}, ${status}, ${JSON.stringify(payload)}::jsonb, ${user.id}::uuid, ${user.id}::uuid)
              RETURNING id, workflow_key, reference, title, status, payload, created_at, updated_at
            `;
            await sql`
              INSERT INTO ikai.organization_audit_events
                (organization_id, actor_user_id, event_type, entity_type, entity_reference, details)
              VALUES
                (${user.organizationId}::uuid, ${user.id}::uuid, 'workflow_record_created', 'workflow_record', ${reference},
                 jsonb_build_object('workflowKey', ${workflowKey}, 'status', ${status}))
            `;
            return json(request, { data: rows[0] }, 201);
          }

          const recordMatch = url.pathname.match(/^\/api\/workflows\/([0-9a-f-]{36})\/status$/i);
          if (recordMatch && request.method === "POST") {
            const body = await readJson(request);
            const status = String(body.status || "").trim().slice(0, 60);
            const reference = body.reference === undefined ? null : String(body.reference || "").trim().slice(0, 160);
            const title = body.title === undefined ? null : String(body.title || "").trim().slice(0, 200);
            const payload = body.payload && typeof body.payload === "object" && !Array.isArray(body.payload) ? body.payload : null;
            if (!status) return json(request, { error: "A non-empty status is required." }, 400);
            if (reference !== null && !reference) return json(request, { error: "Reference cannot be empty." }, 400);
            if (title !== null && !title) return json(request, { error: "Title cannot be empty." }, 400);
            if (payload && JSON.stringify(payload).length > 20000) return json(request, { error: "Workflow details are too large." }, 413);
            const existingRows = await sql`
              SELECT workflow_key, payload
              FROM ikai.workflow_records
              WHERE id = ${recordMatch[1]}::uuid AND organization_id = ${user.organizationId}::uuid
              LIMIT 1
            `;
            if (!existingRows[0]) return json(request, { error: "Workflow record not found." }, 404);
            if (existingRows[0].workflow_key === "returns") {
              const mergedPayload = { ...(existingRows[0].payload || {}), ...(payload || {}) };
              const linkError = await validateReturnLinks(sql, user.organizationId, mergedPayload);
              if (linkError) return json(request, { error: linkError }, 400);
            }
            const rows = await sql`
              UPDATE ikai.workflow_records
              SET status = ${status},
                  reference = COALESCE(${reference}, reference),
                  title = COALESCE(${title}, title),
                  payload = CASE WHEN ${payload !== null} THEN payload || ${JSON.stringify(payload || {})}::jsonb ELSE payload END,
                  updated_by = ${user.id}::uuid, updated_at = now()
              WHERE id = ${recordMatch[1]}::uuid AND organization_id = ${user.organizationId}::uuid
              RETURNING id, workflow_key, reference, title, status, payload, created_at, updated_at
            `;
            if (!rows[0]) return json(request, { error: "Workflow record not found." }, 404);
            await sql`
              INSERT INTO ikai.organization_audit_events
                (organization_id, actor_user_id, event_type, entity_type, entity_reference, details)
              VALUES
                (${user.organizationId}::uuid, ${user.id}::uuid, 'workflow_record_updated', 'workflow_record', ${rows[0].reference},
                 jsonb_build_object('workflowKey', ${rows[0].workflow_key}, 'status', ${status}))
            `;
            return json(request, { data: rows[0] });
          }
          return json(request, { error: "Method or workflow route not supported." }, 405);
        }

        if (url.pathname === "/api/orders" || url.pathname.startsWith("/api/orders/")) {
          const user = await authenticate(request, env);
          if (!user) return json(request, { error: "Authentication required." }, 401);

          if (url.pathname === "/api/orders" && request.method === "GET") {
            const requestedLimit = Number(url.searchParams.get("limit") || "100");
            if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) return json(request, { error: "limit must be an integer between 1 and 100." }, 400);
            const search = String(url.searchParams.get("search") || "").trim().slice(0, 120);
            const status = String(url.searchParams.get("status") || "").trim();
            const rows = await sql`
              SELECT o.id, o.order_number, o.customer_name, o.phone, o.email, o.address, o.pincode, o.city, o.state,
                o.channel, o.payment_mode, o.courier, o.weight, o.length_cm, o.width_cm, o.height_cm, o.notes,
                o.amount, o.status, o.created_at, o.updated_at,
                COALESCE(jsonb_agg(jsonb_build_object('sku', i.sku, 'name', i.product_name, 'quantity', i.quantity, 'price', i.unit_price))
                  FILTER (WHERE i.id IS NOT NULL), '[]'::jsonb) AS items
              FROM ikai.orders o LEFT JOIN ikai.order_items i
                ON i.order_id = o.id AND i.organization_id = o.organization_id
              WHERE o.organization_id = ${user.organizationId}::uuid
                AND (${search} = '' OR o.order_number ILIKE '%' || ${search} || '%' OR o.customer_name ILIKE '%' || ${search} || '%' OR o.phone ILIKE '%' || ${search} || '%' OR o.city ILIKE '%' || ${search} || '%')
                AND (${status} = '' OR o.status = ${status})
              GROUP BY o.id ORDER BY o.created_at DESC LIMIT ${requestedLimit}
            `;
            return json(request, { data: rows, count: rows.length, limit: requestedLimit });
          }

          if (url.pathname === "/api/orders" && request.method === "POST") {
            const body = await readJson(request);
            const customerName = String(body.customer || body.customerName || "").trim().slice(0, 200);
            const phone = String(body.phone || "").trim().slice(0, 40);
            const email = String(body.email || "").trim().slice(0, 254) || null;
            const address = String(body.address || "").trim().slice(0, 2000);
            const pincode = String(body.pincode || "").trim().slice(0, 12);
            const city = String(body.city || "").trim().slice(0, 120);
            const state = String(body.state || "").trim().slice(0, 120);
            const channel = String(body.channel || "Manual").trim().slice(0, 40);
            const paymentMode = String(body.paymentMode || "COD");
            const courier = String(body.courier || "").trim().slice(0, 100) || null;
            const weight = Number(body.weight);
            const length = Number(body.length || 1), width = Number(body.width || 1), height = Number(body.height || 1);
            const notes = String(body.notes || "").trim().slice(0, 2000) || null;
            const items = Array.isArray(body.products) ? body.products : [];
            if (!customerName || !phone || !address || !pincode || !city || !state ||
                !["COD", "Prepaid"].includes(paymentMode) || !Number.isFinite(weight) || weight <= 0 ||
                !Number.isFinite(length) || length <= 0 || !Number.isFinite(width) || width <= 0 ||
                !Number.isFinite(height) || height <= 0 || !items.length || items.length > 100 ||
                items.some(item => !String(item.name || "").trim() || !Number.isSafeInteger(Number(item.quantity)) || Number(item.quantity) < 1 || !Number.isFinite(Number(item.price)) || Number(item.price) < 0)) {
              return json(request, { error: "Complete customer, address, package and product details with valid quantities and prices." }, 400);
            }
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(request, { error: "Enter a valid email address." }, 400);
            const total = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price), 0);
            const orderNumber = "IKO-" + Date.now().toString(36).toUpperCase() + "-" + Array.from(crypto.getRandomValues(new Uint8Array(3)), byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
            const itemJson = JSON.stringify(items.map(item => ({ sku: String(item.sku || "").trim().slice(0, 100) || null, name: String(item.name).trim().slice(0, 200), quantity: Number(item.quantity), price: Number(item.price) })));
            const rows = await sql`
              WITH new_order AS (
                INSERT INTO ikai.orders
                  (organization_id, order_number, customer_name, phone, email, address, pincode, city, state, channel, payment_mode, courier, weight, length_cm, width_cm, height_cm, notes, amount, created_by, updated_by)
                VALUES
                  (${user.organizationId}::uuid, ${orderNumber}, ${customerName}, ${phone}, ${email}, ${address}, ${pincode}, ${city}, ${state}, ${channel}, ${paymentMode}, ${courier}, ${weight}, ${length}, ${width}, ${height}, ${notes}, ${total}, ${user.id}::uuid, ${user.id}::uuid)
                RETURNING *
              ), new_items AS (
                INSERT INTO ikai.order_items (organization_id, order_id, sku, product_name, quantity, unit_price)
                SELECT n.organization_id, n.id, x.sku, x.name, x.quantity, x.price
                FROM new_order n CROSS JOIN jsonb_to_recordset(${itemJson}::jsonb) AS x(sku text, name text, quantity integer, price numeric)
                RETURNING order_id, sku, product_name, quantity, unit_price
              ), audit AS (
                INSERT INTO ikai.organization_audit_events (organization_id, actor_user_id, event_type, entity_type, entity_reference, details)
                SELECT organization_id, ${user.id}::uuid, 'order_created', 'order', order_number,
                  jsonb_build_object('amount', amount, 'itemCount', (SELECT count(*) FROM new_items))
                FROM new_order RETURNING id
              )
              SELECT n.id, n.order_number, n.customer_name, n.phone, n.email, n.address, n.pincode, n.city, n.state,
                n.channel, n.payment_mode, n.courier, n.weight, n.length_cm, n.width_cm, n.height_cm, n.notes,
                n.amount, n.status, n.created_at, n.updated_at,
                (SELECT jsonb_agg(jsonb_build_object('sku', sku, 'name', product_name, 'quantity', quantity, 'price', unit_price)) FROM new_items) AS items
              FROM new_order n
            `;
            return json(request, { data: rows[0], message: "Order saved. Courier booking has not been performed." }, 201);
          }

          const statusMatch = url.pathname.match(/^\/api\/orders\/([0-9a-f-]{36})\/status$/i);
          if (statusMatch && request.method === "POST") {
            const body = await readJson(request);
            const status = String(body.status || "");
            const allowedStatuses = ["New", "Ready to Ship", "Processing", "Shipped", "Delivered", "Cancelled", "NDR raised", "RTO"];
            if (!allowedStatuses.includes(status)) return json(request, { error: "Invalid order status." }, 400);
            const rows = await sql`
              UPDATE ikai.orders SET status = ${status}, updated_by = ${user.id}::uuid, updated_at = now()
              WHERE id = ${statusMatch[1]}::uuid AND organization_id = ${user.organizationId}::uuid
              RETURNING id, order_number, status, updated_at
            `;
            if (!rows[0]) return json(request, { error: "Order not found." }, 404);
            await sql`INSERT INTO ikai.organization_audit_events (organization_id, actor_user_id, event_type, entity_type, entity_reference, details)
              VALUES (${user.organizationId}::uuid, ${user.id}::uuid, 'order_status_changed', 'order', ${rows[0].order_number}, jsonb_build_object('status', ${status}))`;
            return json(request, { data: rows[0] });
          }
          return json(request, { error: "Method or order route not supported." }, 405);
        }

        if (url.pathname === "/api/shipments" || url.pathname.startsWith("/api/shipments/")) {
          const user = await authenticate(request, env);
          if (!user) return json(request, { error: "Authentication required." }, 401);

          if (url.pathname === "/api/shipments" && request.method === "GET") {
            const requestedLimit = Number(url.searchParams.get("limit") || "100");
            if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) return json(request, { error: "limit must be an integer between 1 and 100." }, 400);
            const search = String(url.searchParams.get("search") || "").trim().slice(0, 120);
            const status = String(url.searchParams.get("status") || "").trim();
            const rows = await sql`
              SELECT s.*, o.order_number,
                COALESCE((SELECT jsonb_agg(jsonb_build_object('status', e.status, 'description', e.description, 'location', e.location, 'source', e.source, 'created_at', e.created_at) ORDER BY e.created_at DESC)
                  FROM ikai.shipment_events e WHERE e.shipment_id = s.id AND e.organization_id = s.organization_id), '[]'::jsonb) AS events
              FROM ikai.shipment_records s JOIN ikai.orders o ON o.id = s.order_id AND o.organization_id = s.organization_id
              WHERE s.organization_id = ${user.organizationId}::uuid
                AND (${search} = '' OR s.shipment_number ILIKE '%' || ${search} || '%' OR o.order_number ILIKE '%' || ${search} || '%' OR s.destination ILIKE '%' || ${search} || '%')
                AND (${status} = '' OR s.status = ${status})
              ORDER BY s.created_at DESC LIMIT ${requestedLimit}
            `;
            return json(request, { data: rows, count: rows.length, limit: requestedLimit });
          }

          if (url.pathname === "/api/shipments" && request.method === "POST") {
            const body = await readJson(request);
            const orderId = String(body.orderId || body.order_id || "").trim();
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
              return json(request, { error: "Choose a valid saved order before creating a shipment." }, 400);
            }
            const existingShipment = await sql`
              SELECT shipment_number FROM ikai.shipment_records
              WHERE order_id = ${orderId}::uuid AND organization_id = ${user.organizationId}::uuid
              LIMIT 1
            `;
            if (existingShipment[0]) {
              return json(request, { error: "A shipment record already exists for this order.", shipmentNumber: existingShipment[0].shipment_number }, 409);
            }
            const rows = await sql`
              WITH chosen_order AS (
                SELECT * FROM ikai.orders WHERE id = ${orderId}::uuid AND organization_id = ${user.organizationId}::uuid
              ), created AS (
                INSERT INTO ikai.shipment_records
                  (organization_id, order_id, shipment_number, courier, status, origin, destination, destination_postal_code, weight, amount, payment_mode, created_by)
                SELECT organization_id, id, ${"IKS-" + ""} || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
                  COALESCE(NULLIF(${String(body.courier || "").trim().slice(0,100)}, ''), 'Not booked'),
                  'Label pending', ${String(body.origin || "").trim().slice(0,160)},
                  ${String(body.destination || "").trim().slice(0,200)}, ${String(body.destinationPostalCode || body.pincode || "").trim().slice(0,12)},
                  GREATEST(weight, 0), amount, payment_mode, ${user.id}::uuid
                FROM chosen_order
                ON CONFLICT (organization_id, order_id) DO NOTHING
                RETURNING *
              ), event AS (
                INSERT INTO ikai.shipment_events (organization_id, shipment_id, status, description, location, source, created_by)
                SELECT organization_id, id, status, 'Shipment record created. Courier booking has not been performed.', destination, 'internal', ${user.id}::uuid
                FROM created RETURNING id
              ), audit AS (
                INSERT INTO ikai.organization_audit_events (organization_id, actor_user_id, event_type, entity_type, entity_reference, details)
                SELECT organization_id, ${user.id}::uuid, 'shipment_created', 'shipment', shipment_number, jsonb_build_object('orderId', order_id, 'courierBookingConfirmed', false)
                FROM created RETURNING id
              )
              SELECT created.*, chosen_order.order_number FROM created CROSS JOIN chosen_order
            `;
            if (!rows[0]) {
              const [existing, order] = await Promise.all([
                sql`SELECT shipment_number FROM ikai.shipment_records WHERE order_id = ${orderId}::uuid AND organization_id = ${user.organizationId}::uuid LIMIT 1`,
                sql`SELECT id FROM ikai.orders WHERE id = ${orderId}::uuid AND organization_id = ${user.organizationId}::uuid LIMIT 1`
              ]);
              if (existing[0]) return json(request, { error: "A shipment record already exists for this order.", shipmentNumber: existing[0].shipment_number }, 409);
              if (!order[0]) return json(request, { error: "Order not found in this organization." }, 404);
              return json(request, { error: "Shipment could not be created. Please retry." }, 409);
            }
            return json(request, { data: rows[0], message: "Shipment record saved. Courier booking has not been performed." }, 201);
          }

          const eventMatch = url.pathname.match(/^\/api\/shipments\/([0-9a-f-]{36})\/events$/i);
          if (eventMatch && request.method === "GET") {
            const rows = await sql`SELECT id, status, description, location, source, created_at FROM ikai.shipment_events WHERE shipment_id = ${eventMatch[1]}::uuid AND organization_id = ${user.organizationId}::uuid ORDER BY created_at DESC LIMIT 100`;
            return json(request, { data: rows, count: rows.length });
          }

          const statusMatch = url.pathname.match(/^\/api\/shipments\/([0-9a-f-]{36})\/status$/i);
          if (statusMatch && request.method === "POST") {
            const body = await readJson(request);
            const status = String(body.status || "").trim();
            const allowed = ["Label pending", "Ready to ship", "Booked", "Picked up", "In transit", "Out for delivery", "Delivered", "Exception", "Returned"];
            if (!allowed.includes(status)) return json(request, { error: "Invalid internal shipment status." }, 400);
            const description = String(body.description || "Internal status updated. This does not contact a courier.").trim().slice(0,500);
            const location = String(body.location || "").trim().slice(0,200);
            const currentRows = await sql`
              SELECT id, status FROM ikai.shipment_records
              WHERE id = ${statusMatch[1]}::uuid AND organization_id = ${user.organizationId}::uuid
              LIMIT 1
            `;
            if (!currentRows[0]) return json(request, { error: "Shipment not found." }, 404);
            const currentStatus = currentRows[0].status;
            const transitions = {
              "Label pending": ["Ready to ship", "Booked", "Exception"],
              "Ready to ship": ["Booked", "Picked up", "Exception"],
              "Booked": ["Picked up", "In transit", "Exception"],
              "Picked up": ["In transit", "Out for delivery", "Exception", "Returned"],
              "In transit": ["Out for delivery", "Delivered", "Exception", "Returned"],
              "Out for delivery": ["Delivered", "Exception", "Returned"],
              "Exception": ["Ready to ship", "Booked", "Picked up", "In transit", "Out for delivery", "Returned"],
              "Delivered": [],
              "Returned": []
            };
            if (status !== currentStatus && !(transitions[currentStatus] || []).includes(status)) {
              return json(request, { error: `Shipment status cannot move from "${currentStatus}" to "${status}". Refresh the shipment and choose a valid next step.` }, 409);
            }
            const rows = await sql`
              WITH changed AS (
                UPDATE ikai.shipment_records SET status = ${status}, updated_at = now()
                WHERE id = ${statusMatch[1]}::uuid
                  AND organization_id = ${user.organizationId}::uuid
                  AND status = ${currentStatus}
                RETURNING *
              ), event AS (
                INSERT INTO ikai.shipment_events (organization_id, shipment_id, status, description, location, source, created_by)
                SELECT organization_id, id, ${status}, ${description}, ${location}, 'internal', ${user.id}::uuid FROM changed
                RETURNING id
              ), order_sync AS (
                UPDATE ikai.orders o
                SET status = CASE
                    WHEN ${status} = 'Ready to ship' THEN 'Ready to Ship'
                    WHEN ${status} IN ('Booked', 'Picked up', 'In transit', 'Out for delivery') THEN 'Shipped'
                    WHEN ${status} = 'Delivered' THEN 'Delivered'
                    WHEN ${status} = 'Exception' THEN 'NDR raised'
                    WHEN ${status} = 'Returned' THEN 'RTO'
                  END,
                  updated_by = ${user.id}::uuid,
                  updated_at = now()
                FROM changed
                WHERE o.id = changed.order_id
                  AND o.organization_id = changed.organization_id
                  AND ${status} IN ('Ready to ship', 'Booked', 'Picked up', 'In transit', 'Out for delivery', 'Delivered', 'Exception', 'Returned')
                  AND o.status IS DISTINCT FROM CASE
                    WHEN ${status} = 'Ready to ship' THEN 'Ready to Ship'
                    WHEN ${status} IN ('Booked', 'Picked up', 'In transit', 'Out for delivery') THEN 'Shipped'
                    WHEN ${status} = 'Delivered' THEN 'Delivered'
                    WHEN ${status} = 'Exception' THEN 'NDR raised'
                    WHEN ${status} = 'Returned' THEN 'RTO'
                  END
                RETURNING o.id, o.organization_id, o.order_number, o.status
              ), order_audit AS (
                INSERT INTO ikai.organization_audit_events (organization_id, actor_user_id, event_type, entity_type, entity_reference, details)
                SELECT order_sync.organization_id, ${user.id}::uuid, 'order_status_synced_from_shipment', 'order',
                  order_sync.order_number,
                  jsonb_build_object('status', order_sync.status, 'sourceShipment', changed.shipment_number)
                FROM order_sync JOIN changed ON changed.order_id = order_sync.id
                RETURNING id
              )
              SELECT changed.* FROM changed
            `;
            if (!rows[0]) return json(request, { error: "Shipment changed concurrently. Refresh and try again." }, 409);
            await sql`INSERT INTO ikai.organization_audit_events (organization_id, actor_user_id, event_type, entity_type, entity_reference, details)
              VALUES (${user.organizationId}::uuid, ${user.id}::uuid, 'shipment_status_changed', 'shipment', ${rows[0].shipment_number}, jsonb_build_object('status', ${status}, 'courierBookingConfirmed', false))`;
            return json(request, { data: rows[0], message: "Internal status saved. No courier was contacted." });
          }
          return json(request, { error: "Method or shipment route not supported." }, 405);
        }
        return json(request, { error: "Endpoint not found", path: url.pathname }, 404);
      } catch (error) {
        console.error("API request failed:", error?.message || "unknown error");
        if (error?.message === "Request body must be valid JSON." || error?.message === "Request body is too large.") {
          return json(request, { error: error.message }, 400);
        }
        if (env.ENABLE_TEST_HELPERS === "true" && env.DISABLE_EMAIL === "true" &&
            env.TEST_HELPER_SECRET && request.headers.get("X-Testing-Verification-Secret") === env.TEST_HELPER_SECRET) {
          return json(request, { error: "Testing API diagnostic.", databaseCode: error?.code || null, databaseMessage: String(error?.message || "unknown").slice(0, 300) }, 500);
        }
        return json(request, { error: "The request could not be completed. Check the request details and service configuration." }, 500);
      }
    }
    return json(request, { error: "Endpoint not found", path: url.pathname }, 404);
  },
};
