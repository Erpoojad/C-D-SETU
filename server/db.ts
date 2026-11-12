import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Render's external URLs require TLS; internal URLs and localhost do not.
const needsSsl = /render\.com/.test(connectionString) || process.env.PGSSL === 'true';

export const pool = new pg.Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  max: 5,
});

// numeric -> JS number (values here are tonnes and rupees, well within float range)
pg.types.setTypeParser(1700, (v) => parseFloat(v));

export async function q<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function one<T = any>(text: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await q<T>(text, params);
  return rows[0];
}

export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  role text NOT NULL CHECK (role IN ('generator','buyer','transporter','recycler','authority')),
  city text NOT NULL,
  company text NOT NULL DEFAULT '',
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reputation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points integer NOT NULL,
  title text NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  mime text NOT NULL,
  data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  grade text NOT NULL DEFAULT '',
  quantity numeric NOT NULL CHECK (quantity >= 0),
  unit text NOT NULL,
  price_per_unit numeric NOT NULL CHECK (price_per_unit >= 0),
  location text NOT NULL,
  city text NOT NULL,
  lat double precision,
  lng double precision,
  condition text NOT NULL,
  is_is383 boolean NOT NULL DEFAULT false,
  lab_specs jsonb,
  description text NOT NULL DEFAULT '',
  photo_id uuid REFERENCES photos(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold_out','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity numeric NOT NULL CHECK (quantity > 0),
  delivery_site text NOT NULL,
  distance_km numeric NOT NULL DEFAULT 0,
  material_cost numeric NOT NULL,
  freight_cost numeric NOT NULL,
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','accepted','rejected','delivered','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category text NOT NULL,
  registration text NOT NULL,
  capacity_t numeric NOT NULL CHECK (capacity_t > 0),
  base_fare numeric NOT NULL DEFAULT 0,
  rate_per_km numeric NOT NULL DEFAULT 0,
  driver_name text NOT NULL,
  driver_phone text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  lat double precision,
  lng double precision,
  capacity_tpd numeric NOT NULL DEFAULT 0,
  accepted_materials text[] NOT NULL DEFAULT '{}',
  processing_cost_per_t numeric NOT NULL DEFAULT 0,
  ulb_authorization text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pickups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  lat double precision,
  lng double precision,
  material text NOT NULL,
  segregated boolean NOT NULL,
  estimated_tons numeric NOT NULL CHECK (estimated_tons > 0),
  preferred_time timestamptz,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','scheduled','en_route','picked_up','completed','cancelled')),
  transporter_id uuid REFERENCES users(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  facility_id uuid REFERENCES facilities(id) ON DELETE SET NULL,
  transport_fee numeric,
  gross_t numeric,
  tare_t numeric,
  net_t numeric,
  manifest_no text UNIQUE,
  timeline jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location text NOT NULL,
  landmark text NOT NULL DEFAULT '',
  ward text NOT NULL DEFAULT '',
  city text NOT NULL,
  lat double precision,
  lng double precision,
  est_tonnage text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT '',
  photo_id uuid REFERENCES photos(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'reported' CHECK (status IN ('reported','inspected','dispatched','cleared')),
  authority_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listings_city_idx ON listings (lower(city), status);
CREATE INDEX IF NOT EXISTS pickups_city_status_idx ON pickups (lower(city), status);
CREATE INDEX IF NOT EXISTS pickups_generator_idx ON pickups (generator_id);
CREATE INDEX IF NOT EXISTS pickups_transporter_idx ON pickups (transporter_id);
CREATE INDEX IF NOT EXISTS orders_buyer_idx ON orders (buyer_id);
CREATE INDEX IF NOT EXISTS reports_city_idx ON reports (lower(city));
`;

export async function migrate(): Promise<void> {
  await pool.query(SCHEMA);
}
