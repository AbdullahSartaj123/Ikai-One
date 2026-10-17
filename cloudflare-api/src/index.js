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
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://ikai.one";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
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
    role: row.role || "owner",
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
        SELECT id, ${fullName}, ${email}, 'owner', 'active' FROM new_org
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
      return json(request, { error: "Testing registration diagnostic.", databaseCode: error?.code || null, databaseMessage: String(error?.message || "unknown").slice(0, 300) }, 503);
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

    if (url.pathname.startsWith("/api/auth/") || url.pathname === "/api/shipments" || url.pathname === "/api/testing/verify-email") {
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
        if (url.pathname === "/api/shipments" && request.method === "GET") {
          const user = await authenticate(request, env);
          if (!user) return json(request, { error: "Authentication required." }, 401);
          const requestedLimit = Number(url.searchParams.get("limit") || "25");
          if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) return json(request, { error: "limit must be an integer between 1 and 100." }, 400);
          const rows = await sql`
            SELECT *
            FROM ikai.shipments
            WHERE organization_id = ${user.organizationId}::uuid
            ORDER BY created_at DESC
            LIMIT ${requestedLimit}
          `;
          return json(request, { data: rows, count: rows.length, limit: requestedLimit });
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
