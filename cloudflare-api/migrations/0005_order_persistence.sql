-- Organization-scoped order records. Apply in Neon before enabling order writes.
BEGIN;

DO $preflight$
BEGIN
  IF to_regnamespace('ikai') IS NULL OR NOT (to_regclass('ikai.organizations') IS NOT NULL AND to_regclass('ikai.users') IS NOT NULL) THEN
    RAISE EXCEPTION 'Expected Ikai.One prerequisite tables are missing: organizations, users.';
  END IF;
END
$preflight$;
CREATE TABLE IF NOT EXISTS ikai.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ikai.organizations(id) ON DELETE CASCADE,
  order_number varchar(40) NOT NULL,
  customer_name varchar(200) NOT NULL,
  phone varchar(40) NOT NULL,
  email varchar(254),
  address text NOT NULL,
  pincode varchar(12) NOT NULL,
  city varchar(120) NOT NULL,
  state varchar(120) NOT NULL,
  channel varchar(40) NOT NULL DEFAULT 'Manual',
  payment_mode varchar(20) NOT NULL CHECK (payment_mode IN ('COD','Prepaid')),
  courier varchar(100),
  weight numeric(10,3) NOT NULL CHECK (weight > 0),
  length_cm numeric(10,2) NOT NULL DEFAULT 1 CHECK (length_cm > 0),
  width_cm numeric(10,2) NOT NULL DEFAULT 1 CHECK (width_cm > 0),
  height_cm numeric(10,2) NOT NULL DEFAULT 1 CHECK (height_cm > 0),
  notes text,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  status varchar(32) NOT NULL DEFAULT 'New' CHECK (status IN ('New','Ready to Ship','Processing','Shipped','Delivered','Cancelled','NDR raised','RTO')),
  created_by uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES ikai.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_org_number_unique UNIQUE (organization_id, order_number),
  CONSTRAINT orders_id_org_unique UNIQUE (id, organization_id)
);
CREATE INDEX IF NOT EXISTS orders_org_created_idx ON ikai.orders (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_org_status_idx ON ikai.orders (organization_id, status, created_at DESC);
CREATE TABLE IF NOT EXISTS ikai.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ikai.organizations(id) ON DELETE CASCADE,
  order_id uuid NOT NULL,
  sku varchar(100),
  product_name varchar(200) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_items_order_org_fk FOREIGN KEY (order_id, organization_id)
    REFERENCES ikai.orders(id, organization_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS order_items_org_order_idx ON ikai.order_items (organization_id, order_id);

COMMIT;
