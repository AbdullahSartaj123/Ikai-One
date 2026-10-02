# Netlify deployment note

The build must be able to run `prisma generate` even when DATABASE_URL has not been configured yet. `prisma.config.ts` therefore uses a local placeholder URL only for Prisma client generation.

For a working production deployment, add these Netlify environment variables before using the application:

- DATABASE_URL — Neon/Supabase pooled PostgreSQL URL
- AUTH_SECRET — 32+ character random secret
- API_KEY_PEPPER — 32+ character random secret
- CRON_SECRET — 32+ character random secret

Optional integrations are documented in `.env.example`.

Build command: `npm run build`
Publish directory: `.next`
Node: 22
