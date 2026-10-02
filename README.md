# LogiFlow

Production-oriented multi-tenant courier aggregator + e-commerce operating system built as a modular monolith on **Next.js 15 App Router + TypeScript + Prisma 7 + PostgreSQL + Auth.js v5 + Upstash Redis**.

## Architecture

```text
Browser / Mobile / External API
          |
          v
Next.js App Router
  |-- Seller workspace
  |-- Courier partner workspace
  |-- Super-admin workspace
  |-- Public tracking /track/[awb]
  |-- REST + webhook handlers /api + /api/v1
          |
          +--------------------+
          |                    |
          v                    v
     Domain services       Server Actions / Route Handlers
          |
          +--> Orders / OMS
          +--> Inventory / Warehouses
          +--> Courier adapter layer
          +--> Serviceability + rate engine
          +--> RTO risk scoring
          +--> Shipment / AWB / label / manifest
          +--> Tracking / NDR / RTO / returns / disputes
          +--> Wallet / double-entry ledger / COD
          +--> Notifications / webhooks / audit
          |
          v
      Prisma 7 client
          |
          v
   PostgreSQL (Neon/Supabase)

Background jobs: Upstash Redis -> /api/jobs/process -> label generation / notifications / polling hooks
External integrations: Resend/Nodemailer, Twilio/WhatsApp placeholders, Shopify/WooCommerce placeholders
Deployment: Netlify + Next.js runtime / OpenNext adapter
```

```mermaid
flowchart LR
    U[Merchant / Courier / Admin] --> N[Next.js 15 App Router]
    N --> AUTH[Auth.js v5 + RBAC]
    N --> DOM[Domain Services]
    N --> API[REST /api + /api/v1 + Webhooks]
    DOM --> ORD[OMS + Inventory]
    DOM --> COU[Courier Adapter Layer]
    DOM --> SHP[Shipment + AWB + Label + Manifest]
    DOM --> T[Tracking + NDR + RTO + Returns]
    DOM --> FIN[Wallet + Double-entry Ledger + COD]
    DOM --> NOTIF[Notifications + Webhook Dispatcher]
    DOM --> AUD[Audit + Feature Flags]
    DOM --> P[Prisma 7]
    P --> PG[(PostgreSQL)]
    JOB[Upstash Redis Queue] --> PROC[/api/jobs/process]
    PROC --> DOM
    COU --> C1[SwiftExpress]
    COU --> C2[CityLogistics]
    COU --> C3[NationalParcel]
    COU --> C4[MetroShip]
    COU --> C5[QuickRoute]
```

## Data model

The Prisma schema covers these core entities:

`User`, `Organization`, `OrganizationMember`, `Plan`, `Subscription`, `Address`, `Warehouse`, `Product`, `InventoryItem`, `Order`, `OrderItem`, `CourierPartner`, `CourierMember`, `CourierAccount`, `RateCard`, `ServiceabilityRule`, `Shipment`, `ShipmentEvent`, `Manifest`, `ManifestShipment`, `NDRCase`, `Return`, `ReturnItem`, `WeightDispute`, `Wallet`, `LedgerAccount`, `LedgerTransaction`, `LedgerLine`, `CodRemittance`, `NotificationTemplate`, `Notification`, `ApiKey`, `WebhookEndpoint`, `WebhookDelivery`, `AuditLog`, `Invoice`, `ChannelIntegration`, `FeatureFlag`, `CourierPerformance`.

Money values use PostgreSQL `numeric(18,2)` through Prisma `Decimal`. All merchant-owned records carry `organizationId`; authorization helpers enforce the tenant boundary before reads/writes.

## Local setup

1. Copy `.env.example` to `.env` and set `AUTH_SECRET`, `API_KEY_PEPPER`, `CRON_SECRET`.
2. Start local infrastructure:

```bash
docker compose up -d postgres redis
```

3. Install dependencies:

```bash
npm install
```

4. Validate, generate, migrate, and seed:

```bash
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

### Seed accounts

Seller: `owner1@logiflow.local` / `Demo@12345`

Platform admin: `admin@logiflow.local` / `Demo@12345`

Courier accounts follow `<code>@logiflow.local`, e.g. `swift@logiflow.local`, using the same password.

OTP login uses the mocked development OTP `123456`.

## Phase map

### Phase 1 — Auth, tenancy, schema, seed
- Auth.js credentials + mocked OTP
- Seller organizations + membership RBAC
- Courier members
- Platform roles
- PostgreSQL schema + migration
- Realistic seed: 10 sellers, 5 couriers, 200 orders, shipments, NDR, returns, disputes, ledger balances

### Phase 2 — Seller workspace
- Overview KPIs and analytics
- Orders, manual creation, CSV/XLSX import, search, cancellation/hold
- Product CRUD API + inventory listing
- Seller shell/settings/integrations/developer views

### Phase 3 — Courier aggregation
- Courier interface + 5 deterministic mock adapters
- Serviceability/rate engine
- Multi-factor courier recommendation
- Shipment creation, AWB, label PDF with QR, manifest PDF
- Courier webhook normalization

### Phase 4 — Tracking, NDR, RTO, returns
- Unified shipment timeline
- Public branded tracking
- NDR reattempt/contact/RTO workflow
- Reverse logistics / returns / exchanges
- Weight-dispute workflow
- RTO risk scoring model designed for future ML model replacement

### Phase 5 — Wallet, billing, COD
- Seller wallet
- Double-entry-style ledger lines
- Wallet top-ups
- COD remittance records
- Invoice model ready for billing automation

### Phase 6 — Analytics and operations
- Seller analytics
- Courier performance view
- Super-admin seller/courier/operations/finance/system/audit views
- Feature flags, subscriptions, plan records

### Phase 7 — External integrations
- Public tracking
- Email + mock SMS/WhatsApp notification transport
- API keys with peppered hashing
- REST v1 endpoints
- Webhook endpoints + OpenAPI-style schema
- Cron/job processor endpoint for Netlify Scheduled Functions / external cron

## Netlify deployment

Build command:

```bash
npm run build
```

Set these environment variables in Netlify:

- `DATABASE_URL`
- `DIRECT_URL` (optional when using the same Neon/Supabase URL)
- `AUTH_SECRET`
- `NEXTAUTH_URL` (or rely on Auth.js `trustHost`)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `API_KEY_PEPPER`
- `CRON_SECRET`

Netlify should run Prisma generation as part of `npm run build`; database schema deployment is a release step:

```bash
npx prisma migrate deploy
```

Use a managed PostgreSQL service (Neon or Supabase) for production. Use Upstash Redis when durable queueing/rate limiting is required. The code has a local in-memory queue fallback for development only.

## API

- `GET /api/health`
- `GET /api/openapi`
- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `POST /api/v1/shipments`
- `GET /api/v1/tracking?awb=...`
- `POST /api/courier/webhook`
- `POST /api/shipments/manifest`

Bearer auth for `/api/v1/*` uses a LogiFlow API key. Keys are stored as a SHA-256 hash plus prefix; the raw key is only returned on creation.

## Important production storage note

The local implementation stores generated PDFs as data URLs so the demo is self-contained. For production, replace `labelUrl` and `Manifest.pdfUrl` persistence with object storage (S3, Cloudflare R2, Supabase Storage, or Netlify Blobs) and keep only the object URL/key in PostgreSQL.

## Extending to real courier APIs

Implement `CourierAdapter` in `src/lib/couriers/adapter.ts`, register it in `src/lib/couriers/index.ts`, and connect the adapter to the courier’s auth/rate/AWB/manifest/tracking endpoints. Keep provider-specific payloads inside the adapter; return the normalized shipment statuses used by LogiFlow. Store provider credentials per `CourierAccount` and rotate them through environment/secret storage rather than source control.

For each new courier, add contract tests around: serviceability, rate calculation, AWB booking, cancellation, label download, manifest close, tracking event mapping, NDR reason mapping, RTO state mapping, COD remittance reconciliation, and timeout/retry behavior.

## Six-month roadmap

**Month 1:** harden auth/RBAC, observability, tenant isolation tests, migrations, backups, object storage.

**Month 2:** production courier integrations, webhook retries, scheduled tracking polling, rate-card versioning.

**Month 3:** Shopify/WooCommerce live connectors, bulk order sync, inventory reservations, warehouse transfer workflows.

**Month 4:** ML-backed RTO model, address normalization/geocoding, courier score calibration, automated NDR playbooks.

**Month 5:** payment gateway recharge, automated COD reconciliation, invoicing/tax workflows, subscription billing.

**Month 6:** SLA analytics, advanced BI, event streaming, multi-region readiness, mobile operational apps, enterprise SSO.
