-- Honnibear commission tracking schema

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
  customer_email       TEXT,
  status               TEXT NOT NULL DEFAULT 'paid'
                         CHECK (status IN ('paid','details_submitted','in_progress','delivered')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
