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
- `/login` — email or phone + password
- `/signup` — company signup
- `/verify-otp` — six-digit mock OTP verification
- `/onboarding` — Company profile → Pickup address → Bank/KYC → Couriers → Done
- `/app/dashboard` — protected seller dashboard
- `/app/orders`, `/app/shipments`, `/app/returns`, `/app/ndr`, `/app/couriers`, `/app/pickup-addresses`, `/app/shipping-rules`, `/app/billing`, `/app/reports`, `/app/integrations`, `/app/support`, `/app/settings`

## Sample login accounts
- Store owner: `demo@ikai.one` / `IkaiDemo123!`
- Operations manager: `ops@ikai.one` / `OpsDemo123!`
- Finance viewer: `finance@ikai.one` / `Finance123!`

## Mock signup flow
1. Create an account at `/signup`.
2. Use demo OTP `123456` on `/verify-otp`.
3. Complete the five onboarding steps.
4. You will enter the protected dashboard. Use the user dropdown to sign out.

Google sign-in and password reset are placeholders. No email or SMS is sent. Demo accounts and session details are stored in browser storage only; this is not production authentication. Do not enter real banking, CNIC, tax, or other sensitive information.

## Netlify
Build command: `npm run build`; publish directory: `dist`; Node 20. SPA route fallback is configured in `netlify.toml`.
