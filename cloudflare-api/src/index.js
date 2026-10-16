import { neon } from "@neondatabase/serverless";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function authorized(request, env) {
  const expected = env.API_ACCESS_TOKEN;
  const supplied = request.headers.get("Authorization") || "";
  return Boolean(expected && supplied === `Bearer ${expected}`);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return json({ name: "Ikai.One API", status: "running", version: "1.1.0" });
    }

    if (url.pathname === "/api") {
      return json({
        platform: "Ikai.One",
        modules: [
          "organizations", "users", "customers", "courier-partners",
          "shipments", "tracking", "pickup-requests", "returns",
          "cash-on-delivery", "invoices", "reconciliation"
        ]
      });
    }

    if (url.pathname === "/health/database") {
      if (!env.DATABASE_URL) {
        return json({ status: "not_configured", message: "DATABASE_URL is not configured." }, 503);
      }
      try {
        const sql = neon(env.DATABASE_URL);
        const rows = await sql`
          SELECT current_database() AS database,
            EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'ikai') AS ikai_schema_exists,
            NOW() AS checked_at
        `;
        return json({
          status: "connected",
          database: rows[0].database,
          ikaiSchemaExists: rows[0].ikai_schema_exists,
          checkedAt: rows[0].checked_at
        });
      } catch (error) {
        console.error("Database health check failed:", error?.message || "unknown error");
        return json({ status: "disconnected", message: "Database connection failed. Check Worker secrets and Neon settings." }, 503);
      }
    }

    if (url.pathname === "/api/shipments" && request.method === "GET") {
      if (!authorized(request, env)) {
        return json({ error: "Unauthorized. A valid Bearer token is required." }, 401);
      }
      if (!env.DATABASE_URL) {
        return json({ error: "Database is not configured." }, 503);
      }

      const organizationId = url.searchParams.get("organization_id");
      if (!organizationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(organizationId)) {
        return json({ error: "Provide a valid organization_id UUID." }, 400);
      }

      const requestedLimit = Number(url.searchParams.get("limit") || "25");
      if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) {
        return json({ error: "limit must be an integer between 1 and 100." }, 400);
      }

      try {
        const sql = neon(env.DATABASE_URL);
        const rows = await sql`
          SELECT *
          FROM ikai.shipments
          WHERE organization_id = ${organizationId}::uuid
          ORDER BY created_at DESC
          LIMIT ${requestedLimit}
        `;
        return json({ data: rows, count: rows.length, limit: requestedLimit });
      } catch (error) {
        console.error("Shipment query failed:", error?.message || "unknown error");
        return json({
          error: "Could not retrieve shipments. Confirm the ikai.shipments table and columns exist."
        }, 500);
      }
    }

    return json({ error: "Endpoint not found", path: url.pathname }, 404);
  }
};
