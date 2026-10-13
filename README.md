# IKAI One

Responsive landing page, frontend-only shipper portal, mock authentication, and five-step onboarding wizard.

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
- `/login` — email or phone + password demo sign-in
- `/signup` — company name, business email, phone, tax number, business type
- `/verify-otp` — six-digit mock OTP verification
- `/onboarding` — Company profile → Pickup address → Bank/KYC → Couriers → Done
- `/app/dashboard` — protected seller dashboard
- `/app/orders`, `/app/shipments`, `/app/returns`, `/app/ndr`, `/app/couriers`, `/app/rate-calculator`, `/app/pickup-addresses`, `/app/shipping-rules`, `/app/billing`, `/app/reports`, `/app/integrations`, `/app/support`, `/app/settings`

## Sample login accounts
- Store owner: `demo@ikai.one` / `IkaiDemo123!`
- Operations manager: `ops@ikai.one` / `OpsDemo123!`
- Finance viewer: `finance@ikai.one` / `Finance123!`

## Mock signup flow
1. Create an account at `/signup`.
2. Use demo OTP `123456` on `/verify-otp`.
3. Complete the five onboarding steps.
4. You will enter the protected dashboard. Use the user dropdown to sign out.

Google sign-in and password reset are placeholders. No email or SMS is sent. Authentication is a frontend demo, not production security. The signup wizard keeps its in-progress form in the browser tab and does not persist bank, KYC, or pickup-address fields. After signing out, use one of the sample demo accounts. Do not enter real banking, CNIC, tax, or other sensitive information.

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
