# IKAI One

Ikai.One courier-aggregator SaaS frontend (React + Vite), Cloudflare Workers API, and Neon PostgreSQL. Phase 1 introduces server-backed authentication, email verification, password recovery, and organization-scoped API access.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Routes
- `/` — IKAI One marketing landing page
- `/blog` — IKAI One insights and blog listing (three editorial posts)
- `/blog/ecommerce-shipping-playbook-2026` — 2026 e-commerce shipping playbook
- `/blog/cod-cash-flow-without-spreadsheets` — COD cash-flow and reconciliation guide
- `/blog/courier-performance-scorecard` — courier performance scorecard guide
- `/login` — verified business email + password sign-in
- `/signup` — company name, business email, phone, tax number, business type
- `/verify-otp` — one-time email verification and password recovery links
- `/onboarding` — Company profile → Pickup address → Bank/KYC → Couriers → Done
- `/app/dashboard` — protected seller dashboard
- `/app/orders`, `/app/shipments`, `/app/returns`, `/app/ndr`, `/app/couriers`, `/app/rate-calculator`, `/app/pickup-addresses`, `/app/shipping-rules`, `/app/billing`, `/app/reports`, `/app/integrations`, `/app/support`, `/app/settings`

## Phase 1 authentication

- `/signup` creates a real organization and owner account through the API.
- `/verify-otp` handles a one-time email verification link. Links expire after 30 minutes and are single-use.
- `/login` requires a verified email and a valid password.
- `/verify-otp?mode=reset` requests a password reset; reset links are single-use and expire after 30 minutes.
- Authenticated browser sessions use an `HttpOnly`, `Secure`, `SameSite=Lax` cookie set by the API wrapper; the raw session token is not exposed to frontend JavaScript. The API validates sessions against PostgreSQL.
- `GET /api/shipments` derives `organization_id` from the authenticated session. Clients cannot select another tenant by passing an organization ID.

### Required one-time setup

1. Confirm the pre-existing foundation tables `ikai.organizations` and `ikai.users` exist. Their baseline DDL is not yet tracked in this repository, so do not assume a fresh database can be built from the numbered migrations alone.
2. Apply the numbered migrations in order, `0001_authentication.sql` through `0009_tenant_integrity_constraints.sql`, in the Neon SQL Editor. Take a Neon restore point first and verify each migration before continuing. The operational alternative `production_setup_all_in_one.sql` covers operational tables from 0003–0007 only; do not run it as a substitute for migrations 0001, 0002, 0008 or 0009, and do not blindly run it alongside 0003–0007.
2. In Cloudflare Worker settings, configure secrets/variables: `RESEND_API_KEY` (secret), `EMAIL_FROM` (verified sender, e.g. `Ikai.One <no-reply@your-verified-domain>`), and `APP_URL` = `https://ikai.one`. Keep `DATABASE_URL` as a secret. Do not put secrets in Vite environment variables or frontend code.
3. Verify the sender domain with Resend before expecting verification/reset email delivery.
4. The Worker is deployed by `.github/workflows/deploy-cloudflare-worker.yml` after the changes are merged to `main`; the frontend deploys through `.github/workflows/deploy.yml`. The authentication PR is not production-active until it is merged and deployment completes.

For a read-only catalog of the actual Neon schema, columns, constraints, foreign keys, indexes, and known cross-tenant reference counts, run `cloudflare-api/migrations/schema_audit.sql` in the target Neon SQL Editor. Git migration files alone cannot prove which migrations are already installed; this repository does not yet maintain a migration ledger.

Registration is intentionally unavailable until the email service is configured. Existing demo credentials are removed. Do not collect bank account, IBAN, CNIC, or KYC data until those workflows have dedicated security controls.

## Netlify
Build command: `npm run build`; publish directory: `dist`; Node 20. SPA route fallback is configured in `netlify.toml`.


## Expanded seller portal menu

Additional frontend routes use local mock data and session-only interactions:
- Dispatch: `/app/manifests`, `/app/pickup-performance`
- Delivery tools: `/app/courier-priority`, `/app/pincode-zones`, `/app/international`
- Catalog: `/app/products`, `/app/channel-products`, `/app/inventory`, `/app/catalog`, `/app/warehouse`
- Finance: `/app/scheduled-reports`, `/app/tax-classes`
- Operations: `/app/bulk-actions`, `/app/tracking-page`, `/app/post-ship`, `/app/activity`
- Developer: `/app/api`, `/app/courier-settings`

These additional pages are frontend-only. Add a backend and provider integrations before using them for real shipping, payments, inventory or customer notifications.


## Nested seller-central menus

The sidebar now has expandable submenus for order imports and risk review; shipment tracking, labels and SLA monitoring; pickup requests and manifest history; reverse pickups and return rules; NDR rules and buyer follow-ups; courier serviceability, scorecards and claims; zone rates and surcharges; channel settings and sync history; product categories and package profiles; stock adjustments and fulfilment; revenue/courier/returns reports; import/export jobs; tracking events and notification templates; team activity; API/webhook logs; and team, security and notification settings.

All submenu destinations are registered as React Router routes. The new pages use sample records and session-only actions; no carrier, marketplace, finance or messaging provider is connected. Netlify remains configured to build from GitHub with `npm run build`, publish `dist`, and route SPA paths to `index.html`.


## Operational reporting and exports

Operations and submenu views now include a shared report workspace with a 30-day sample dataset (48 rows per view), filterable by date range, status, region/city, business segment and text search. KPI cards and trend/status charts update from the current selection. Export options include:
- **Export data:** Excel-compatible CSV containing the filtered records and report metadata.
- **Export summary:** CSV with the selected filters, headline metrics, status distribution and 7-day activity trend.
- **Print / PDF:** Opens the browser print dialog so the report can be saved as PDF.

These values are illustrative frontend mock data, not live courier, finance, order or inventory records. Dedicated Orders, Shipments and Billing pages retain their own workflows and table exports. The reporting UI is designed for backend data-source integration later; no real data connection is enabled.
