
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin: (process.env.FRONTEND_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "1mb" }));

let pool;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  pool.on("error", (error) => {
    console.error("Unexpected database pool error:", error.message);
  });
}

app.get("/", (_req, res) => {
  res.json({
    name: "Ikai.One API",
    status: "running",
    version: "1.0.0",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/health/database", async (_req, res) => {
  if (!pool) {
    return res.status(503).json({
      status: "not_configured",
      message: "Database connection is not configured.",
    });
  }

  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        current_schema() AS current_schema,
        NOW() AS checked_at
    `);

    res.json({
      status: "connected",
      database: result.rows[0].database,
      schema: "ikai",
      checkedAt: result.rows[0].checked_at,
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);
    res.status(503).json({
      status: "disconnected",
      message: "Database connection failed.",
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Ikai.One API listening on port ${PORT}`);
});

async function shutdown() {
  server.close(async () => {
    if (pool) await pool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
