# ikai.one Logistics Workspace — Frontend Prototype

A React + Vite + Tailwind UI concept for a Pakistani multi-courier logistics aggregator. This is frontend-only; operational records and performance figures are mock data.

## Start locally

```bash
npm install
npm run dev
```

Build for static hosting:

```bash
npm run build
npm run preview
```

## Frontend areas

- **Authentication**: responsive sign-in mock and demo workspace entry
- **Brand onboarding**: three-step business, pickup address, and courier preference flow
- **First-session tour**: welcome, shipment workflow, and reporting highlights
- **Dashboard**: KPI cards, 7-day delivery trend, shipment status mix, quick statistics and recent shipments
- **Shipments**: searchable, filterable list and bulk selection affordances; create-shipment modal
- **Tracking**: sample tracking lookup, status timeline, shipment overview and illustrative route panel
- **Reports**: daily, weekly, monthly, courier, geographic and revenue report templates plus custom report form
- **Billing & invoices**: sample Growth plan, usage meters, invoice history, payment-method layout
- **Integrations**: example courier, Shopify/WooCommerce and webhook cards
- **Settings**: company profile, courier preferences, API key placeholders, notification preferences, team and security panels
- **Help & support**: searchable FAQs and a local-only support form
- **Workspace shell**: collapsible responsive sidebar, global search, notification/profile popovers, dark mode and toast messages

## Design tokens

Primary blue: `#2E75D6`; accent orange: `#FF6B35`; success: `#27AE60`; danger: `#E74C3C`; warning: `#F39C12`. Use the Tailwind tokens defined in `tailwind.config.js` and CSS variables at the top of `src/styles.css`.

The icon library is [Lucide React](https://lucide.dev/), with [Recharts](https://recharts.org/) for dashboard graphs.

## Important production gaps

The app does **not** include a backend or real authentication. Shipment data, metrics, plan values, courier status, invoices and integrations are illustrative. Live courier booking/tracking, GPS, COD remittance, exports/PDF generation, payment processing, API-key issuance, persistent preferences, SMS/email and account security need authenticated server-side services. Demo key strings are placeholders and are not working credentials. Do not use this prototype to store real customer, address, payment or courier credentials.

## Responsive design

Layouts include desktop, tablet and mobile media queries, horizontally scrollable data tables, touch-sized controls and a mobile navigation drawer. Manually review at 320px, 768px, 1024px and 1920px before production release.
