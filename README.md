# IKAI One

Responsive landing page plus a frontend-only shipper portal and dashboard.

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
- `/login` — sample shipper login
- `/app/dashboard` — seller dashboard
- `/app/orders`, `/app/shipments`, `/app/returns`, `/app/ndr`, `/app/couriers`, `/app/pickup-addresses`, `/app/shipping-rules`, `/app/billing`, `/app/reports`, `/app/integrations`, `/app/support`, `/app/settings`

## Sample login accounts
- Store owner: `demo@ikai.one` / `IkaiDemo123!`
- Operations manager: `ops@ikai.one` / `OpsDemo123!`
- Finance viewer: `finance@ikai.one` / `Finance123!`

Demo credentials only. The login uses sessionStorage and does not provide real authentication or backend security. Dashboard figures and courier entries are mock data.

## Netlify
Build command: `npm run build`; publish directory: `dist`; Node 20. SPA route fallback is configured in `netlify.toml`.
