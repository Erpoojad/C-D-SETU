import express, { type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';
import type pg from 'pg';
import { pool, q, one, tx } from './db';
import { clearSession, loadUser, requireAuth, requireRole, setSession, USER_COLUMNS, type Role } from './auth';
import { scanImage, scannerConfigured } from './scan';
import { CO2_AVOIDED_KG_PER_T, co2AvoidedKg, freightInr, salvageValueInr } from '../src/lib/cdFactors';

const ROLES = ['generator', 'buyer', 'transporter', 'recycler', 'authority'] as const;
const MATERIALS = ['concrete', 'brick_masonry', 'soil_gravel', 'metals', 'bitumen', 'wood', 'others'] as const;
const UNITS = ['MT', 'CFT', 'Nos'] as const;
const CONDITIONS = ['Segregated & Graded', 'Clean Demolition', 'Crushed Aggregates', 'Raw Rubble'] as const;
const FACILITY_TYPES = ['Centralized Plant', 'Decentralized Micro-Crusher', 'Direct Reuse Site', 'Ward Collection Point'] as const;
const VEHICLE_TYPES = ['Tractor Trolley', 'Tata 407 (Medium)', '6-Wheeler Tipper', '10-Wheeler Heavy Tipper'] as const;

const str = (max = 200) => z.string().trim().min(1).max(max);
const optStr = (max = 500) => z.string().trim().max(max).optional().default('');
const lat = z.number().min(-90).max(90).nullable().optional();
const lng = z.number().min(-180).max(180).nullable().optional();

/** Parse a body with a zod schema; on failure send 400 and return null. */
function parse<T extends z.ZodTypeAny>(schema: T, data: unknown, res: Response): z.infer<T> | null {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  const first = r.error.issues[0];
  res.status(400).json({ error: `${first.path.join('.') || 'input'}: ${first.message}` });
  return null;
}

type Db = Pick<pg.PoolClient, 'query'>;
async function award(db: Db, userId: string, points: number, title: string, reason: string) {
  await db.query('UPDATE users SET points = points + $2 WHERE id = $1', [userId, points]);
  await db.query('INSERT INTO reputation_events (user_id, points, title, reason) VALUES ($1,$2,$3,$4)', [
    userId,
    points,
    title,
    reason,
  ]);
}

const timelineEntry = (status: string, by: string, note = '') => ({ status, at: new Date().toISOString(), by, note });

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '8mb' }));
  app.use(cookieParser());
  app.use(loadUser);

  const api = express.Router();
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
  const scanLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 30,
    keyGenerator: (req) => req.user?.id ?? 'anon',
  });

  api.get('/health', async (_req, res) => {
    await pool.query('SELECT 1');
    res.json({ ok: true, scanner: scannerConfigured() });
  });

  /* ------------------------------ auth ------------------------------ */

  const signupSchema = z.object({
    name: str(80),
    email: z.string().trim().toLowerCase().email().max(120),
    password: z.string().min(8, 'must be at least 8 characters').max(128),
    phone: optStr(20),
    role: z.enum(ROLES),
    city: str(60),
    company: optStr(120),
    invite_code: z.string().trim().max(100).optional(),
  });

  api.post('/auth/signup', authLimiter, async (req, res) => {
    const b = parse(signupSchema, req.body, res);
    if (!b) return;
    // Authority accounts see every pickup (with phone numbers) in their city and
    // close dumping reports, so they cannot be self-assigned.
    if (b.role === 'authority') {
      const code = process.env.AUTHORITY_INVITE_CODE;
      const digest = (s: string) => crypto.createHash('sha256').update(s).digest();
      if (!code || !b.invite_code || !crypto.timingSafeEqual(digest(b.invite_code), digest(code))) {
        return res.status(403).json({ error: 'Municipal authority accounts need a valid invite code from the platform admin.' });
      }
    }
    if (await one('SELECT 1 FROM users WHERE email = $1', [b.email])) {
      return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });
    }
    const hash = await bcrypt.hash(b.password, 11);
    const user = await one(
      `INSERT INTO users (email, password_hash, name, phone, role, city, company)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING ${USER_COLUMNS}`,
      [b.email, hash, b.name, b.phone, b.role, b.city, b.company],
    );
    setSession(res, user.id);
    res.status(201).json({ user });
  });

  api.post('/auth/login', authLimiter, async (req, res) => {
    const b = parse(z.object({ email: z.string().trim().toLowerCase(), password: z.string() }), req.body, res);
    if (!b) return;
    const row = await one(`SELECT ${USER_COLUMNS}, password_hash FROM users WHERE email = $1`, [b.email]);
    if (!row || !(await bcrypt.compare(b.password, row.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    delete row.password_hash;
    setSession(res, row.id);
    res.json({ user: row });
  });

  api.post('/auth/logout', (_req, res) => {
    clearSession(res);
    res.json({ ok: true });
  });

  api.get('/me', (req, res) => res.json({ user: req.user ?? null }));

  api.patch('/me', requireAuth, async (req, res) => {
    const b = parse(
      z.object({ name: str(80), phone: optStr(20), city: str(60), company: optStr(120) }),
      req.body,
      res,
    );
    if (!b) return;
    const user = await one(
      `UPDATE users SET name=$2, phone=$3, city=$4, company=$5 WHERE id=$1 RETURNING ${USER_COLUMNS}`,
      [req.user!.id, b.name, b.phone, b.city, b.company],
    );
    res.json({ user });
  });

  api.get('/me/events', requireAuth, async (req, res) => {
    res.json(
      await q('SELECT * FROM reputation_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [req.user!.id]),
    );
  });

  /* ------------------------------ photos ------------------------------ */

  api.post('/photos', requireAuth, async (req, res) => {
    const b = parse(
      z.object({ mime: z.enum(['image/jpeg', 'image/png', 'image/webp']), data: z.string().min(10) }),
      req.body,
      res,
    );
    if (!b) return;
    const buf = Buffer.from(b.data, 'base64');
    if (buf.length > 2_000_000) return res.status(413).json({ error: 'Photo is too large (max 2 MB).' });
    const row = await one('INSERT INTO photos (owner_id, mime, data) VALUES ($1,$2,$3) RETURNING id', [
      req.user!.id,
      b.mime,
      buf,
    ]);
    res.status(201).json({ id: row.id });
  });

  api.get('/photos/:id', async (req, res) => {
    if (!z.uuid().safeParse(req.params.id).success) return res.status(404).end();
    const row = await one('SELECT mime, data FROM photos WHERE id=$1', [req.params.id]);
    if (!row) return res.status(404).end();
    res.setHeader('Content-Type', row.mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(row.data);
  });

  /* ------------------------------ scanner ------------------------------ */

  api.post('/scan', requireAuth, scanLimiter, async (req, res) => {
    if (!scannerConfigured()) {
      return res.status(503).json({ error: 'The photo scanner is not set up yet (GEMINI_API_KEY is missing on the server).' });
    }
    const b = parse(
      z.object({
        mime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
        data: z.string().min(10),
        volumeM3: z.number().positive().max(10000).optional(),
      }),
      req.body,
      res,
    );
    if (!b) return;
    try {
      res.json(await scanImage(b.data, b.mime, b.volumeM3));
    } catch (e) {
      console.error('scan failed', e);
      res.status(502).json({ error: 'The photo could not be analysed right now. Try again in a minute.' });
    }
  });

  /* ------------------------------ listings ------------------------------ */

  const LISTING_SELECT = `
    SELECT l.*, u.name AS seller_name, u.company AS seller_company, u.role AS seller_role
    FROM listings l JOIN users u ON u.id = l.seller_id`;

  api.get('/listings', async (req, res) => {
    const { city, category, free, q: text, mine } = req.query as Record<string, string | undefined>;
    const where: string[] = [];
    const params: unknown[] = [];
    if (mine === '1') {
      if (!req.user) return res.status(401).json({ error: 'Please sign in first.' });
      params.push(req.user.id);
      where.push(`l.seller_id = $${params.length}`);
    } else {
      where.push(`l.status = 'active'`);
    }
    if (city) {
      params.push(city.toLowerCase());
      where.push(`lower(l.city) = $${params.length}`);
    }
    if (category && (MATERIALS as readonly string[]).includes(category)) {
      params.push(category);
      where.push(`l.category = $${params.length}`);
    }
    if (free === '1') where.push('l.price_per_unit = 0');
    if (text) {
      params.push(`%${text.toLowerCase()}%`);
      where.push(`(lower(l.title) LIKE $${params.length} OR lower(l.description) LIKE $${params.length})`);
    }
    res.json(await q(`${LISTING_SELECT} WHERE ${where.join(' AND ')} ORDER BY l.created_at DESC LIMIT 200`, params));
  });

  const listingSchema = z.object({
    title: str(120),
    category: z.enum(MATERIALS),
    grade: optStr(80),
    quantity: z.number().positive().max(1_000_000),
    unit: z.enum(UNITS),
    price_per_unit: z.number().min(0).max(10_000_000),
    location: str(200),
    city: str(60),
    lat,
    lng,
    condition: z.enum(CONDITIONS),
    is_is383: z.boolean().default(false),
    lab_specs: z
      .object({ aiv: optStr(20), acv: optStr(20), water_absorption: optStr(20), silt: optStr(20) })
      .nullable()
      .optional(),
    description: optStr(1000),
    photo_id: z.uuid().nullable().optional(),
  });

  api.post('/listings', requireRole('generator', 'recycler', 'buyer', 'transporter'), async (req, res) => {
    const b = parse(listingSchema, req.body, res);
    if (!b) return;
    if (b.is_is383 && !(b.lab_specs?.aiv || b.lab_specs?.acv)) {
      return res.status(400).json({ error: 'An IS 383 claim needs at least an AIV or ACV test result.' });
    }
    const listing = await tx(async (c) => {
      const { rows } = await c.query(
        `INSERT INTO listings (seller_id,title,category,grade,quantity,unit,price_per_unit,location,city,lat,lng,
           condition,is_is383,lab_specs,description,photo_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
        [
          req.user!.id, b.title, b.category, b.grade, b.quantity, b.unit, b.price_per_unit, b.location, b.city,
          b.lat ?? null, b.lng ?? null, b.condition, b.is_is383, b.lab_specs ?? null, b.description, b.photo_id ?? null,
        ],
      );
      await award(c, req.user!.id, 20, 'Listed material for reuse', b.title);
      return rows[0];
    });
    res.status(201).json(listing);
  });

  api.patch('/listings/:id', requireAuth, async (req, res) => {
    const b = parse(
      z.object({
        quantity: z.number().min(0).optional(),
        price_per_unit: z.number().min(0).optional(),
        status: z.enum(['active', 'sold_out', 'withdrawn']).optional(),
      }),
      req.body,
      res,
    );
    if (!b) return;
    const row = await one(
      `UPDATE listings SET quantity = COALESCE($3, quantity), price_per_unit = COALESCE($4, price_per_unit),
         status = COALESCE($5, status)
       WHERE id = $1 AND seller_id = $2 RETURNING *`,
      [req.params.id, req.user!.id, b.quantity ?? null, b.price_per_unit ?? null, b.status ?? null],
    );
    if (!row) return res.status(404).json({ error: 'Listing not found.' });
    res.json(row);
  });

  /* ------------------------------ orders ------------------------------ */

  const ORDER_SELECT = `
    SELECT o.*, l.title AS listing_title, l.unit, l.category, l.price_per_unit, l.city AS listing_city,
      l.location AS listing_location, l.seller_id,
      s.name AS seller_name, s.phone AS seller_phone, s.company AS seller_company,
      b.name AS buyer_name, b.phone AS buyer_phone, b.company AS buyer_company
    FROM orders o JOIN listings l ON l.id = o.listing_id
    JOIN users s ON s.id = l.seller_id JOIN users b ON b.id = o.buyer_id`;

  api.get('/orders', requireAuth, async (req, res) => {
    const scope = req.query.scope === 'sold' ? 'sold' : 'bought';
    const col = scope === 'sold' ? 'l.seller_id' : 'o.buyer_id';
    res.json(await q(`${ORDER_SELECT} WHERE ${col} = $1 ORDER BY o.created_at DESC LIMIT 200`, [req.user!.id]));
  });

  api.post('/orders', requireAuth, async (req, res) => {
    const b = parse(
      z.object({
        listing_id: z.uuid(),
        quantity: z.number().positive(),
        delivery_site: str(200),
        distance_km: z.number().min(0).max(2000).default(0),
        note: optStr(500),
      }),
      req.body,
      res,
    );
    if (!b) return;
    const listing = await one(`SELECT * FROM listings WHERE id=$1 AND status='active'`, [b.listing_id]);
    if (!listing) return res.status(404).json({ error: 'This listing is no longer available.' });
    if (listing.seller_id === req.user!.id) return res.status(400).json({ error: 'You cannot order your own listing.' });
    if (b.quantity > listing.quantity) {
      return res.status(400).json({ error: `Only ${listing.quantity} ${listing.unit} available.` });
    }
    const materialCost = Math.round(b.quantity * listing.price_per_unit);
    const freight = listing.unit === 'MT' ? freightInr(b.quantity, b.distance_km) : 0;
    const order = await one(
      `INSERT INTO orders (listing_id,buyer_id,quantity,delivery_site,distance_km,material_cost,freight_cost,note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [b.listing_id, req.user!.id, b.quantity, b.delivery_site, b.distance_km, materialCost, freight, b.note],
    );
    res.status(201).json(order);
  });

  api.patch('/orders/:id', requireAuth, async (req, res) => {
    const b = parse(z.object({ action: z.enum(['accept', 'reject', 'deliver', 'cancel']) }), req.body, res);
    if (!b) return;
    const uid = req.user!.id;
    const result = await tx(async (c) => {
      const { rows } = await c.query(
        `SELECT o.*, l.seller_id, l.quantity AS available, l.unit, l.category, l.title
         FROM orders o JOIN listings l ON l.id=o.listing_id WHERE o.id=$1 FOR UPDATE OF o, l`,
        [req.params.id],
      );
      const o = rows[0];
      if (!o) return { status: 404, error: 'Order not found.' };
      const isSeller = o.seller_id === uid;
      const isBuyer = o.buyer_id === uid;
      const set = (s: string) => c.query('UPDATE orders SET status=$2, updated_at=now() WHERE id=$1', [o.id, s]);

      if (b.action === 'cancel') {
        if (!isBuyer || o.status !== 'requested') return { status: 400, error: 'Only a pending order can be cancelled by the buyer.' };
        await set('cancelled');
      } else if (b.action === 'reject') {
        if (!isSeller || o.status !== 'requested') return { status: 400, error: 'Only the seller can reject a pending order.' };
        await set('rejected');
      } else if (b.action === 'accept') {
        if (!isSeller || o.status !== 'requested') return { status: 400, error: 'Only the seller can accept a pending order.' };
        if (o.quantity > o.available) return { status: 400, error: `Only ${o.available} ${o.unit} left; reject or edit the listing.` };
        const left = Math.round((o.available - o.quantity) * 1000) / 1000;
        await c.query(`UPDATE listings SET quantity=$2::numeric, status=CASE WHEN $2::numeric <= 0 THEN 'sold_out' ELSE status END WHERE id=$1`, [
          o.listing_id,
          left,
        ]);
        await set('accepted');
      } else {
        if (!isSeller || o.status !== 'accepted') return { status: 400, error: 'Only the seller can mark an accepted order delivered.' };
        await set('delivered');
        await award(c, o.buyer_id, 30, 'Bought recycled material', `${o.quantity} ${o.unit} of ${o.title}`);
        await award(c, o.seller_id, 30, 'Delivered recycled material', `${o.quantity} ${o.unit} of ${o.title}`);
      }
      return { status: 200 };
    });
    if (result.status !== 200) return res.status(result.status).json({ error: result.error });
    res.json(await one(`${ORDER_SELECT} WHERE o.id=$1`, [req.params.id]));
  });

  /* ------------------------------ vehicles ------------------------------ */

  api.get('/vehicles', requireRole('transporter'), async (req, res) => {
    res.json(await q('SELECT * FROM vehicles WHERE owner_id=$1 ORDER BY created_at', [req.user!.id]));
  });

  const vehicleSchema = z.object({
    category: z.enum(VEHICLE_TYPES),
    registration: z.string().trim().toUpperCase().min(4).max(20),
    capacity_t: z.number().positive().max(60),
    base_fare: z.number().min(0).max(100000),
    rate_per_km: z.number().min(0).max(1000),
    driver_name: str(80),
    driver_phone: str(20),
  });

  api.post('/vehicles', requireRole('transporter'), async (req, res) => {
    const b = parse(vehicleSchema, req.body, res);
    if (!b) return;
    res.status(201).json(
      await one(
        `INSERT INTO vehicles (owner_id,category,registration,capacity_t,base_fare,rate_per_km,driver_name,driver_phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [req.user!.id, b.category, b.registration, b.capacity_t, b.base_fare, b.rate_per_km, b.driver_name, b.driver_phone],
      ),
    );
  });

  api.patch('/vehicles/:id', requireRole('transporter'), async (req, res) => {
    const b = parse(z.object({ active: z.boolean() }), req.body, res);
    if (!b) return;
    const row = await one('UPDATE vehicles SET active=$3 WHERE id=$1 AND owner_id=$2 RETURNING *', [
      req.params.id,
      req.user!.id,
      b.active,
    ]);
    if (!row) return res.status(404).json({ error: 'Vehicle not found.' });
    res.json(row);
  });

  /* ------------------------------ facilities ------------------------------ */

  api.get('/facilities', async (req, res) => {
    const city = (req.query.city as string | undefined)?.toLowerCase();
    res.json(
      await q(
        `SELECT f.*, u.name AS owner_name, u.phone AS owner_phone FROM facilities f JOIN users u ON u.id=f.owner_id
         ${city ? 'WHERE lower(f.city) = $1' : ''} ORDER BY f.city, f.name`,
        city ? [city] : [],
      ),
    );
  });

  const facilitySchema = z.object({
    name: str(120),
    type: z.enum(FACILITY_TYPES),
    address: str(200),
    city: str(60),
    lat,
    lng,
    capacity_tpd: z.number().min(0).max(100000),
    accepted_materials: z.array(z.enum(MATERIALS)).min(1, 'pick at least one material'),
    processing_cost_per_t: z.number().min(0).max(100000),
    ulb_authorization: optStr(80),
  });

  api.post('/facilities', requireRole('recycler', 'authority'), async (req, res) => {
    const b = parse(facilitySchema, req.body, res);
    if (!b) return;
    res.status(201).json(
      await one(
        `INSERT INTO facilities (owner_id,name,type,address,city,lat,lng,capacity_tpd,accepted_materials,processing_cost_per_t,ulb_authorization)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [
          req.user!.id, b.name, b.type, b.address, b.city, b.lat ?? null, b.lng ?? null, b.capacity_tpd,
          b.accepted_materials, b.processing_cost_per_t, b.ulb_authorization,
        ],
      ),
    );
  });

  api.delete('/facilities/:id', requireRole('recycler', 'authority'), async (req, res) => {
    const row = await one('DELETE FROM facilities WHERE id=$1 AND owner_id=$2 RETURNING id', [req.params.id, req.user!.id]);
    if (!row) return res.status(404).json({ error: 'Facility not found.' });
    res.json({ ok: true });
  });

  /* ------------------------------ pickups ------------------------------ */

  const PICKUP_SELECT = `
    SELECT p.*,
      g.name AS generator_name, g.company AS generator_company, g.phone AS generator_phone,
      t.name AS transporter_name, t.company AS transporter_company, t.phone AS transporter_phone,
      v.category AS vehicle_category, v.registration AS vehicle_registration, v.capacity_t AS vehicle_capacity_t,
      v.driver_name, v.driver_phone,
      f.name AS facility_name, f.address AS facility_address, f.city AS facility_city, f.ulb_authorization,
      f.owner_id AS facility_owner_id
    FROM pickups p
    JOIN users g ON g.id = p.generator_id
    LEFT JOIN users t ON t.id = p.transporter_id
    LEFT JOIN vehicles v ON v.id = p.vehicle_id
    LEFT JOIN facilities f ON f.id = p.facility_id`;

  /** Hide the generator's phone from transporters until they accept the job. */
  function redact(p: any, user: { id: string; role: Role }) {
    const party = p.generator_id === user.id || p.transporter_id === user.id || p.facility_owner_id === user.id || user.role === 'authority';
    if (!party) p.generator_phone = null;
    p.estimated_salvage_inr = salvageValueInr(p.material, Number(p.estimated_tons), p.segregated);
    p.co2_avoided_kg = p.net_t ? co2AvoidedKg(p.material, Number(p.net_t)) : null;
    return p;
  }

  api.get('/pickups', requireAuth, async (req, res) => {
    const u = req.user!;
    const scope = String(req.query.scope || 'mine');
    let rows: any[];
    if (scope === 'open') {
      if (u.role !== 'transporter') return res.status(403).json({ error: 'Only transporters can view open pickup requests.' });
      const city = String(req.query.city || u.city).toLowerCase();
      rows = await q(`${PICKUP_SELECT} WHERE p.status='requested' AND lower(p.city)=$1 ORDER BY p.created_at`, [city]);
    } else if (scope === 'city') {
      if (u.role !== 'authority') return res.status(403).json({ error: 'Only authority accounts can view all city pickups.' });
      rows = await q(`${PICKUP_SELECT} WHERE lower(p.city)=lower($1) ORDER BY p.created_at DESC LIMIT 300`, [u.city]);
    } else if (scope === 'facility') {
      rows = await q(`${PICKUP_SELECT} WHERE f.owner_id=$1 ORDER BY p.updated_at DESC LIMIT 300`, [u.id]);
    } else {
      rows = await q(
        `${PICKUP_SELECT} WHERE p.generator_id=$1 OR p.transporter_id=$1 ORDER BY p.updated_at DESC LIMIT 300`,
        [u.id],
      );
    }
    res.json(rows.map((r) => redact(r, u)));
  });

  api.post('/pickups', requireRole('generator', 'recycler', 'buyer', 'authority'), async (req, res) => {
    const b = parse(
      z.object({
        site_name: str(120),
        address: str(200),
        city: str(60),
        lat,
        lng,
        material: z.enum(MATERIALS),
        segregated: z.boolean(),
        estimated_tons: z.number().positive().max(5000),
        preferred_time: z.string().datetime({ offset: true }).nullable().optional(),
        notes: optStr(500),
      }),
      req.body,
      res,
    );
    if (!b) return;
    const row = await one(
      `INSERT INTO pickups (generator_id,site_name,address,city,lat,lng,material,segregated,estimated_tons,preferred_time,notes,timeline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [
        req.user!.id, b.site_name, b.address, b.city, b.lat ?? null, b.lng ?? null, b.material, b.segregated,
        b.estimated_tons, b.preferred_time ?? null, b.notes,
        JSON.stringify([timelineEntry('requested', req.user!.name)]),
      ],
    );
    res.status(201).json(redact(await one(`${PICKUP_SELECT} WHERE p.id=$1`, [row.id]), req.user!));
  });

  const pickupAction = z.discriminatedUnion('action', [
    z.object({
      action: z.literal('accept'),
      vehicle_id: z.uuid(),
      facility_id: z.uuid().nullable().optional(),
      transport_fee: z.number().min(0).max(1_000_000),
    }),
    z.object({ action: z.literal('release') }),
    z.object({ action: z.literal('cancel') }),
    z.object({ action: z.literal('en_route') }),
    z.object({
      action: z.literal('picked_up'),
      gross_t: z.number().positive().max(100).nullable().optional(),
      tare_t: z.number().positive().max(100).nullable().optional(),
    }),
    z.object({
      action: z.literal('complete'),
      facility_id: z.uuid().nullable().optional(),
      net_t: z.number().positive().max(100).nullable().optional(),
    }),
  ]);

  api.patch('/pickups/:id', requireAuth, async (req, res) => {
    const b = parse(pickupAction, req.body, res);
    if (!b) return;
    const u = req.user!;
    const result = await tx(async (c) => {
      const { rows } = await c.query('SELECT * FROM pickups WHERE id=$1 FOR UPDATE', [req.params.id]);
      const p = rows[0];
      if (!p) return { status: 404, error: 'Pickup not found.' };
      const isTransporter = p.transporter_id === u.id;
      const fail = (error: string) => ({ status: 400, error });
      const push = (status: string, note = '') => JSON.stringify([...p.timeline, timelineEntry(status, u.name, note)]);

      switch (b.action) {
        case 'accept': {
          if (u.role !== 'transporter') return fail('Only transporters can accept pickups.');
          if (p.status !== 'requested') return fail('This pickup has already been taken.');
          const v = (await c.query('SELECT * FROM vehicles WHERE id=$1 AND owner_id=$2 AND active', [b.vehicle_id, u.id])).rows[0];
          if (!v) return fail('Choose one of your active vehicles.');
          if (b.facility_id && !(await c.query('SELECT 1 FROM facilities WHERE id=$1', [b.facility_id])).rowCount) {
            return fail('Destination facility not found.');
          }
          const trips = Math.ceil(Number(p.estimated_tons) / Number(v.capacity_t));
          await c.query(
            `UPDATE pickups SET status='scheduled', transporter_id=$2, vehicle_id=$3, facility_id=$4, transport_fee=$5,
               timeline=$6, updated_at=now() WHERE id=$1`,
            [p.id, u.id, v.id, b.facility_id ?? null, b.transport_fee, push('scheduled', `${v.category} ${v.registration}, ${trips} trip(s), ₹${b.transport_fee}`)],
          );
          break;
        }
        case 'release': {
          if (!isTransporter || p.status !== 'scheduled') return fail('Only the assigned transporter can release a scheduled pickup.');
          await c.query(
            `UPDATE pickups SET status='requested', transporter_id=NULL, vehicle_id=NULL, transport_fee=NULL, timeline=$2, updated_at=now() WHERE id=$1`,
            [p.id, push('requested', 'Released by transporter')],
          );
          break;
        }
        case 'cancel': {
          if (p.generator_id !== u.id) return fail('Only the person who requested this pickup can cancel it.');
          if (!['requested', 'scheduled'].includes(p.status)) return fail('A pickup cannot be cancelled once the truck is on its way.');
          await c.query(`UPDATE pickups SET status='cancelled', timeline=$2, updated_at=now() WHERE id=$1`, [p.id, push('cancelled')]);
          break;
        }
        case 'en_route': {
          if (!isTransporter || p.status !== 'scheduled') return fail('Only the assigned transporter can start a scheduled pickup.');
          await c.query(`UPDATE pickups SET status='en_route', timeline=$2, updated_at=now() WHERE id=$1`, [p.id, push('en_route')]);
          break;
        }
        case 'picked_up': {
          if (!isTransporter || p.status !== 'en_route') return fail('Mark the truck en route first.');
          if (b.gross_t && b.tare_t && b.tare_t >= b.gross_t) return fail('Tare weight must be less than gross weight.');
          await c.query(
            `UPDATE pickups SET status='picked_up', gross_t=$2, tare_t=$3, timeline=$4, updated_at=now() WHERE id=$1`,
            [p.id, b.gross_t ?? null, b.tare_t ?? null, push('picked_up')],
          );
          break;
        }
        case 'complete': {
          if (!isTransporter || p.status !== 'picked_up') return fail('Mark the load picked up first.');
          const facilityId = b.facility_id ?? p.facility_id;
          if (!facilityId) return fail('Choose the facility the load was delivered to.');
          const net =
            b.net_t ?? (p.gross_t && p.tare_t ? Math.round((Number(p.gross_t) - Number(p.tare_t)) * 100) / 100 : null);
          if (!net) return fail('Enter the net weight from the weighbridge slip.');
          const city3 = String(p.city).replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase() || 'IND';
          const manifest = `CDS-${new Date().getFullYear()}-${city3}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
          await c.query(
            `UPDATE pickups SET status='completed', facility_id=$2, net_t=$3, manifest_no=$4, completed_at=now(),
               timeline=$5, updated_at=now() WHERE id=$1`,
            [p.id, facilityId, net, manifest, push('completed', `Manifest ${manifest}, ${net} t net`)],
          );
          const pts = p.segregated ? 50 : 25;
          await award(c, p.generator_id, pts, p.segregated ? 'Segregated waste diverted' : 'Waste disposed responsibly', `${net} t, manifest ${manifest}`);
          await award(c, u.id, 30, 'Completed a manifested pickup', `${net} t, manifest ${manifest}`);
          break;
        }
      }
      return { status: 200 };
    });
    if (result.status !== 200) return res.status(result.status).json({ error: result.error });
    res.json(redact(await one(`${PICKUP_SELECT} WHERE p.id=$1`, [req.params.id]), u));
  });

  /** Public manifest verification (for the QR/number printed on the manifest). */
  api.get('/manifests/:no', async (req, res) => {
    const p = await one(
      `${PICKUP_SELECT} WHERE p.manifest_no = $1 AND p.status = 'completed'`,
      [String(req.params.no).toUpperCase()],
    );
    if (!p) return res.status(404).json({ error: 'No completed manifest with this number.' });
    res.json({
      manifest_no: p.manifest_no,
      completed_at: p.completed_at,
      generator: p.generator_company || p.generator_name,
      site_name: p.site_name,
      address: p.address,
      city: p.city,
      material: p.material,
      segregated: p.segregated,
      gross_t: p.gross_t,
      tare_t: p.tare_t,
      net_t: p.net_t,
      transporter: p.transporter_company || p.transporter_name,
      vehicle_registration: p.vehicle_registration,
      vehicle_category: p.vehicle_category,
      facility: p.facility_name,
      facility_address: p.facility_address,
      ulb_authorization: p.ulb_authorization,
      co2_avoided_kg: co2AvoidedKg(p.material, Number(p.net_t)),
    });
  });

  /* ------------------------------ dumping reports ------------------------------ */

  api.get('/reports', requireAuth, async (req, res) => {
    const city = String(req.query.city || req.user!.city).toLowerCase();
    res.json(
      await q(
        `SELECT r.*, u.name AS reporter_name FROM reports r JOIN users u ON u.id=r.reporter_id
         WHERE lower(r.city)=$1 ORDER BY r.created_at DESC LIMIT 300`,
        [city],
      ),
    );
  });

  api.post('/reports', requireAuth, async (req, res) => {
    const b = parse(
      z.object({
        location: str(200),
        landmark: optStr(120),
        ward: optStr(20),
        city: str(60),
        lat,
        lng,
        est_tonnage: optStr(40),
        remarks: optStr(1000),
        photo_id: z.uuid().nullable().optional(),
      }),
      req.body,
      res,
    );
    if (!b) return;
    res.status(201).json(
      await one(
        `INSERT INTO reports (reporter_id,location,landmark,ward,city,lat,lng,est_tonnage,remarks,photo_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [req.user!.id, b.location, b.landmark, b.ward, b.city, b.lat ?? null, b.lng ?? null, b.est_tonnage, b.remarks, b.photo_id ?? null],
      ),
    );
  });

  api.patch('/reports/:id', requireRole('authority'), async (req, res) => {
    const b = parse(
      z.object({ status: z.enum(['reported', 'inspected', 'dispatched', 'cleared']), authority_note: optStr(500) }),
      req.body,
      res,
    );
    if (!b) return;
    const out = await tx(async (c) => {
      const prev = (await c.query('SELECT * FROM reports WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
      if (!prev) return null;
      const { rows } = await c.query(
        'UPDATE reports SET status=$2, authority_note=$3, updated_at=now() WHERE id=$1 RETURNING *',
        [prev.id, b.status, b.authority_note],
      );
      if (b.status === 'cleared' && prev.status !== 'cleared') {
        await award(c, prev.reporter_id, 25, 'Dumping report cleared', prev.location);
      }
      return rows[0];
    });
    if (!out) return res.status(404).json({ error: 'Report not found.' });
    res.json(out);
  });

  /* ------------------------------ stats ------------------------------ */

  api.get('/stats', async (req, res) => {
    const platform = await one(`
      SELECT
        (SELECT count(*)::int FROM users) AS users,
        (SELECT count(*)::int FROM listings WHERE status='active') AS active_listings,
        (SELECT count(*)::int FROM facilities) AS facilities,
        (SELECT coalesce(sum(net_t),0) FROM pickups WHERE status='completed') AS tonnes_diverted,
        (SELECT count(*)::int FROM pickups WHERE status='completed') AS pickups_completed,
        (SELECT count(*)::int FROM reports WHERE status='cleared') AS reports_cleared`);
    let me = null;
    if (req.user) {
      const done = await q(
        `SELECT material, net_t FROM pickups WHERE status='completed' AND (generator_id=$1 OR transporter_id=$1)`,
        [req.user.id],
      );
      const bought = await q(
        `SELECT l.category, o.quantity FROM orders o JOIN listings l ON l.id=o.listing_id
         WHERE o.status='delivered' AND l.unit='MT' AND o.buyer_id=$1`,
        [req.user.id],
      );
      const tonnes = done.reduce((s, r) => s + Number(r.net_t), 0) + bought.reduce((s, r) => s + Number(r.quantity), 0);
      const co2 =
        done.reduce((s, r) => s + co2AvoidedKg(r.material, Number(r.net_t)), 0) +
        bought.reduce((s, r) => s + Math.round(Number(r.quantity) * (CO2_AVOIDED_KG_PER_T as any)[r.category]), 0);
      me = { tonnes: Math.round(tonnes * 10) / 10, co2_kg: co2, points: req.user.points };
    }
    res.json({ platform, me });
  });

  api.get('/leaderboard', async (_req, res) => {
    res.json(
      await q(`SELECT name, company, role, city, points FROM users WHERE points > 0 ORDER BY points DESC LIMIT 10`),
    );
  });

  api.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

  app.use('/api', api);

  /* ------------------------------ frontend ------------------------------ */

  const dist = path.resolve(import.meta.dirname, '..', 'build');
  if (fs.existsSync(dist)) {
    app.use(
      express.static(dist, {
        index: false,
        setHeaders: (res, file) => {
          if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        },
      }),
    );
    app.get(/.*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use((err: any, _req: Request, res: Response, _next: express.NextFunction) => {
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Upload is too large.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  return app;
}
