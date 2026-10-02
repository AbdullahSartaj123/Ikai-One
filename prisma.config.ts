import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` runs during Netlify's build before runtime secrets are
// necessarily available. Prisma only needs a syntactically valid URL for
// client generation; migrations/deployments still require the real
// DATABASE_URL to be supplied in the environment.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://logiflow:logiflow@localhost:5432/logiflow?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: databaseUrl
  }
});
