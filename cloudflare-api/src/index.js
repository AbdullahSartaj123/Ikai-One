import { neon } from "@neondatabase/serverless";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return json({
        name: "Ikai.One API",
        status: "running",
        version: "1.0.0",
      });
    }

    if (url.pathname === "/api") {
      return json({
        platform: "Ikai.One",
        modules: [
          "organizations",
          "users",
          "customers",
          "courier-partners",
          "shipments",
          "tracking",
          "pickup-requests",
          "returns",
          "cash-on-delivery",
          "invoices",
          "reconciliation",
        ],
      });
    }

    if (url.pathname === "/health/database") {
      if (!env.DATABASE_URL) {
        return json({
          status: "not_configured",
          message: "DATABASE_URL is not configured for this environment.",
        }, 503);
      }

      try {
        const sql = neon(env.DATABASE_URL);
        const rows = await sql`
          SELECT
            current_database() AS database,
            EXISTS (
              SELECT 1
              FROM information_schema.schemata
              WHERE schema_name = 'ikai'
            ) AS ikai_schema_exists,
            NOW() AS checked_at
        `;

        return json({
          status: "connected",
          database: rows[0].database,
          ikaiSchemaExists: rows[0].ikai_schema_exists,
          checkedAt: rows[0].checked_at,
        });
      } catch (error) {
        console.error("Database health check failed:", error?.message || "unknown error");
        return json({
          status: "disconnected",
          message: "Database connection failed. Check the Cloudflare secret and Neon connection string.",
        }, 503);
      }
    }

    return json({ error: "Endpoint not found", path: url.pathname }, 404);
  },
};
