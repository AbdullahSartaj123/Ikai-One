# Shipper approval and platform administrator setup

## Migration order

1. Review and apply `cloudflare-api/migrations/0008_shipper_approval.sql` to the relevant Neon database before deploying the Worker code that references the new columns and tables.
2. Apply the migration to staging before deploying the branch to staging. Apply it to production before merging/deploying this change to production; the migration is additive and preserves existing organizations as approved.
3. Keep `ENABLE_TEST_HELPERS` disabled in production. The test verification helper auto-approves only when the test-only helper is enabled and its secret is supplied.

## Provision the two platform administrators

Platform administrator membership is intentionally not self-service. No email address, password, or default administrator credential is hardcoded in the application.

1. Have each intended administrator register with their own verified business email through the normal signup form.
2. In the trusted Neon SQL Editor, identify the exact account and confirm the email belongs to the intended administrator:

```sql
SELECT u.id AS user_id, ai.email, u.full_name, o.name AS organization_name, ai.email_verified_at
FROM ikai.users u
JOIN ikai.auth_identities ai ON ai.user_id = u.id
JOIN ikai.organizations o ON o.id = u.organization_id
WHERE lower(ai.email) = lower('REPLACE_WITH_VERIFIED_ADMIN_EMAIL');
```

3. After independently verifying the identity and returned `user_id`, grant platform access using that exact UUID. Repeat for the second administrator:

```sql
INSERT INTO ikai.platform_admins (user_id)
VALUES ('REPLACE_WITH_VERIFIED_USER_UUID'::uuid)
ON CONFLICT (user_id) DO NOTHING;
```

Do not expose this SQL as an API or allow a user to grant themselves platform access. Only trusted database operators should manage this table.

## Behavior

- New shipper registrations start with `approval_status = 'pending'`; verifying an email does not create an authenticated dashboard session.
- Only explicitly provisioned platform administrators can use `/api/admin/organizations`, the decision endpoint, `/api/admin/overview`, and `/api/admin/records`.
- The platform overview reports aggregate shipper/order/shipment/COD/inventory counts and per-organization activity counts, using the same exclusion of platform-admin-owned workspaces. The read-only operational records browser supports orders, shipments, COD reconciliation, inventory, and workflow records with bounded pagination, search, and an optional shipper-organisation filter. Orders may include customer names and phone numbers because the two platform administrators are intended to oversee operational records; access is server-side admin-only and each records view is written to `ikai.platform_audit_events`. Platform-admin-owned organizations are excluded.
- Courier booking counts include only rows explicitly marked `courier_booking_confirmed = true`; a shipment record by itself is not proof that a courier accepted a booking.
- Administrators can approve a pending application, or reject it with a reason. Decisions are conditional on the application still being pending and are written to `ikai.platform_audit_events`.
- Rejected and pending shipper accounts cannot log in or use existing sessions. Existing organizations are backfilled as approved by the migration to avoid interrupting current customers.
- Platform admin workspaces are excluded from the shipper review queue to prevent self-review.
- The admin console includes an aggregate operations overview and a read-only cross-shipper records browser. It does not trigger courier bookings, payments, COD payouts, or record mutations.

## Deployment safety

Do not merge or deploy the Worker changes until the migration has been applied to the corresponding database. Do not change production DNS or Worker secrets as part of this workflow.
