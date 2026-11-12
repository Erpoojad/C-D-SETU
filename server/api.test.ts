/**
 * End-to-end API test against a real Postgres. Runs only when TEST_DATABASE_URL
 * is set (it wipes that database's tables), e.g.
 *   TEST_DATABASE_URL=postgres://setu:setu@localhost/setu npm test
 */
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('C&D Setu API', () => {
  let app: any;
  const gen = request.agent('');
  let agents: Record<string, ReturnType<typeof request.agent>>;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.AUTHORITY_INVITE_CODE = 'ulb-test-code';
    const db = await import('./db');
    await db.pool.query(
      'DROP TABLE IF EXISTS reports, pickups, facilities, vehicles, orders, listings, photos, reputation_events, users CASCADE',
    );
    await db.migrate();
    app = (await import('./app')).createApp();
    agents = {
      generator: request.agent(app),
      transporter: request.agent(app),
      recycler: request.agent(app),
      buyer: request.agent(app),
      authority: request.agent(app),
    };
    void gen;
  });

  const signup = (role: string) =>
    agents[role]
      .post('/api/auth/signup')
      .send({ name: `${role} user`, email: `${role}@test.in`, password: 'password123', role, city: 'Nashik', phone: '9800000000', invite_code: role === 'authority' ? 'ulb-test-code' : undefined });

  it('signs up every role and keeps a session', async () => {
    for (const r of Object.keys(agents)) expect((await signup(r)).status).toBe(201);
    const me = await agents.generator.get('/api/me');
    expect(me.body.user.role).toBe('generator');
    expect(me.body.user).not.toHaveProperty('password_hash');
  });

  it('refuses authority sign-up without the invite code', async () => {
    const r = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Fake officer', email: 'fake@test.in', password: 'password123', role: 'authority', city: 'Nashik', invite_code: 'guess' });
    expect(r.status).toBe(403);
  });

  it('rejects duplicate email and wrong password', async () => {
    expect((await signup('generator')).status).toBe(409);
    const bad = await request(app).post('/api/auth/login').send({ email: 'generator@test.in', password: 'nope' });
    expect(bad.status).toBe(401);
  });

  it('starts empty', async () => {
    const s = await request(app).get('/api/stats');
    expect(s.body.platform.active_listings).toBe(0);
    expect(s.body.platform.tonnes_diverted).toBe(0);
  });

  it('runs a full pickup to a verifiable manifest', async () => {
    const fac = await agents.recycler.post('/api/facilities').send({
      name: 'Ambad Micro-Crusher', type: 'Decentralized Micro-Crusher', address: 'MIDC Ambad', city: 'Nashik',
      lat: 19.96, lng: 73.73, capacity_tpd: 50, accepted_materials: ['concrete', 'brick_masonry'],
      processing_cost_per_t: 150, ulb_authorization: 'NMC/CD/2026/014',
    });
    expect(fac.status).toBe(201);

    const veh = await agents.transporter.post('/api/vehicles').send({
      category: '6-Wheeler Tipper', registration: 'mh15ab1234', capacity_t: 8, base_fare: 900, rate_per_km: 45,
      driver_name: 'Ramesh', driver_phone: '9811111111',
    });
    expect(veh.status).toBe(201);
    expect(veh.body.registration).toBe('MH15AB1234');

    const pk = await agents.generator.post('/api/pickups').send({
      site_name: 'College Road bungalow', address: 'College Road', city: 'Nashik', material: 'concrete',
      segregated: true, estimated_tons: 6,
    });
    expect(pk.status).toBe(201);
    const id = pk.body.id;

    const open = await agents.transporter.get('/api/pickups?scope=open');
    expect(open.body.map((p: any) => p.id)).toContain(id);
    expect(open.body[0].generator_phone).toBeNull(); // hidden before accepting

    // generator cannot drive transporter steps
    expect((await agents.generator.patch(`/api/pickups/${id}`).send({ action: 'en_route' })).status).toBe(400);

    const acc = await agents.transporter
      .patch(`/api/pickups/${id}`)
      .send({ action: 'accept', vehicle_id: veh.body.id, facility_id: fac.body.id, transport_fee: 1800 });
    expect(acc.status).toBe(200);
    expect(acc.body.generator_phone).toBe('9800000000');

    expect((await agents.transporter.patch(`/api/pickups/${id}`).send({ action: 'en_route' })).status).toBe(200);
    const bad = await agents.transporter.patch(`/api/pickups/${id}`).send({ action: 'picked_up', gross_t: 5, tare_t: 9 });
    expect(bad.status).toBe(400);
    expect(
      (await agents.transporter.patch(`/api/pickups/${id}`).send({ action: 'picked_up', gross_t: 14.2, tare_t: 8.1 })).status,
    ).toBe(200);
    const done = await agents.transporter.patch(`/api/pickups/${id}`).send({ action: 'complete' });
    expect(done.status).toBe(200);
    expect(done.body.net_t).toBeCloseTo(6.1);
    expect(done.body.manifest_no).toMatch(/^CDS-\d{4}-NAS-[0-9A-F]{6}$/);

    const ver = await request(app).get(`/api/manifests/${done.body.manifest_no}`);
    expect(ver.status).toBe(200);
    expect(ver.body.ulb_authorization).toBe('NMC/CD/2026/014');
    expect(ver.body).not.toHaveProperty('generator_phone');

    const fview = await agents.recycler.get('/api/pickups?scope=facility');
    expect(fview.body).toHaveLength(1);

    const me = await agents.generator.get('/api/stats');
    expect(me.body.me.tonnes).toBeCloseTo(6.1);
    expect(me.body.me.points).toBe(50);
  });

  it('runs a marketplace order and decrements stock', async () => {
    const l = await agents.recycler.post('/api/listings').send({
      title: '20mm Recycled Concrete Aggregate', category: 'concrete', quantity: 50, unit: 'MT', price_per_unit: 600,
      location: 'MIDC Ambad', city: 'Nashik', condition: 'Crushed Aggregates', is_is383: true,
      lab_specs: { aiv: '22%', acv: '26%', water_absorption: '3.4%', silt: '0.8%' },
    });
    expect(l.status).toBe(201);
    expect((await agents.recycler.post('/api/orders').send({ listing_id: l.body.id, quantity: 5, delivery_site: 'x' })).status).toBe(400);
    expect((await agents.buyer.post('/api/orders').send({ listing_id: l.body.id, quantity: 80, delivery_site: 'x' })).status).toBe(400);

    const o = await agents.buyer.post('/api/orders').send({ listing_id: l.body.id, quantity: 20, delivery_site: 'Site A', distance_km: 10 });
    expect(o.status).toBe(201);
    expect(o.body.material_cost).toBe(12000);
    expect(o.body.freight_cost).toBe(8400);

    expect((await agents.buyer.patch(`/api/orders/${o.body.id}`).send({ action: 'accept' })).status).toBe(400);
    expect((await agents.recycler.patch(`/api/orders/${o.body.id}`).send({ action: 'accept' })).status).toBe(200);
    expect((await agents.recycler.patch(`/api/orders/${o.body.id}`).send({ action: 'deliver' })).body.status).toBe('delivered');

    const mine = await agents.recycler.get('/api/listings?mine=1');
    expect(mine.body[0].quantity).toBe(30);
  });

  it('lets citizens report dumping and only authorities resolve it', async () => {
    const r = await agents.buyer.post('/api/reports').send({ location: 'Godavari bank, Ramkund', city: 'Nashik' });
    expect(r.status).toBe(201);
    expect((await agents.generator.patch(`/api/reports/${r.body.id}`).send({ status: 'cleared' })).status).toBe(403);
    expect((await agents.authority.patch(`/api/reports/${r.body.id}`).send({ status: 'cleared' })).status).toBe(200);
    const ev = await agents.buyer.get('/api/me/events');
    expect(ev.body.some((e: any) => e.title === 'Dumping report cleared')).toBe(true);
  });

  it('requires sign-in for writes and returns 503 for an unconfigured scanner', async () => {
    expect((await request(app).post('/api/pickups').send({})).status).toBe(401);
    delete process.env.GEMINI_API_KEY;
    const s = await agents.generator.post('/api/scan').send({ mime: 'image/jpeg', data: 'aGVsbG8gd29ybGQ=' });
    expect(s.status).toBe(503);
  });
});
