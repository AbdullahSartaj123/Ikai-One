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
