-- Honnibear commission tracking schema
--
-- Order lifecycle: pending_review -> approved -> paid -> in_progress -> delivered
-- (or pending_review -> declined, a terminal state)

CREATE TABLE IF NOT EXISTS admins (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id                   BIGSERIAL PRIMARY KEY,
  order_code           TEXT NOT NULL UNIQUE,
  stripe_session_id    TEXT UNIQUE,
  stripe_payment_intent TEXT,
  product_slug         TEXT NOT NULL,
  product_name         TEXT NOT NULL,
  amount_cents         INTEGER,
  currency             TEXT NOT NULL DEFAULT 'usd',
  customer_name        TEXT,
  customer_email       TEXT,
  notes                TEXT,
  status               TEXT NOT NULL DEFAULT 'pending_review'
                         CHECK (status IN ('pending_review','approved','declined','paid','in_progress','delivered')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Re-run on every boot (see bootstrap.js) so an existing deployment's table
-- picks up schema changes that CREATE TABLE IF NOT EXISTS alone can't apply.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending_review';
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending_review','approved','declined','paid','in_progress','delivered'));

CREATE INDEX IF NOT EXISTS idx_orders_email ON orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders (order_code);

CREATE TABLE IF NOT EXISTS commission_details (
  id           BIGSERIAL PRIMARY KEY,
  order_id     BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  details      JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_details_order ON commission_details (order_id);

CREATE TABLE IF NOT EXISTS reference_files (
  id            BIGSERIAL PRIMARY KEY,
  order_id      BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  original_name TEXT,
  stored_path   TEXT NOT NULL,
  mime_type     TEXT,
  size_bytes    INTEGER,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reference_files_order ON reference_files (order_id);
