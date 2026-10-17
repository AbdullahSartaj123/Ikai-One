# Ikai.One API staging

This configuration is intentionally separate from the production Worker.

## Safety boundaries

- Worker name: `ikai-one-api-staging`
- Database: the Neon project `ikai-one-staging`, database `neondb`
- Email sending is disabled by `DISABLE_EMAIL = "true"`.
- `APP_URL` is localhost for isolated local frontend testing.
- Do not add production database URLs, production Resend keys, or production secrets to this Worker.
- Do not deploy this config with the production `wrangler.toml`.

## Required staging-only Worker secret

Set `DATABASE_URL` as a **Secret** on the `ikai-one-api-staging` Worker, using the Neon connection string from the staging project only. Never commit it to GitHub or paste it into chat.

To test the no-email verification helpers, create a long random `TEST_HELPER_SECRET` as a **Secret** on this staging Worker. Keep it private. The helper routes are enabled only when `ENABLE_TEST_HELPERS` and `DISABLE_EMAIL` are both set to `"true"` where required by the API. Do not use these helpers on production.

No `RESEND_API_KEY` is needed while email is disabled.

## Deploy

Deploy from this directory with the staging config explicitly selected:

```sh
npm install
npx wrangler deploy --config wrangler.staging.toml
```

Verify `https://ikai-one-api-staging.<your-workers-dev-subdomain>.workers.dev/health` and then `/health/database`. The database health endpoint must report the staging database. If it does not, stop and do not test registration.

## Isolated browser testing

Use the frontend locally on `http://localhost:5173` and set its local-only `VITE_API_BASE_URL` to the staging Worker URL. Do not change the production site's environment variables. The API and cookie wrapper already allow localhost origins for development.

## Database migrations

The staging Neon database should have the base `ikai.organizations` and `ikai.users` tables before the authentication migrations. Apply `migrations/0001_authentication.sql` and `migrations/0002_auth_rate_limits.sql` only to the staging database; they are idempotent for the authentication tables already created by the comprehensive staging schema.
