# C&D Setu

**A working construction & demolition (C&D) waste exchange for Indian cities.** It connects people with rubble to dispose of, the transporters who carry it, the plants that process it and the builders who buy recycled material. Every delivery produces a manifest that anyone can verify, as the C&D Waste Management Rules, 2016 expect.

The app starts empty. Everything you see in it was entered by real accounts.

## Who does what

| Account | Can do |
|---|---|
| **Waste generator** (builder, contractor, homeowner) | Request pickups, follow the truck through each stage, get a manifest, sell or give away reusable material, scan a debris heap |
| **Transporter** | Register tippers and drivers, accept open pickup jobs in their city, record weighbridge weights, deliver to a facility and issue the manifest |
| **Recycler / plant** | Register facilities with accepted materials, capacity, gate fee and ULB authorisation; see incoming loads; sell recycled aggregate with IS 383 test data |
| **Material buyer** | Browse and order recycled aggregate, bricks and steel; freight is estimated from distance |
| **Municipal authority** | See every pickup in the city, inspect and clear dumping reports. **Sign-up needs an invite code** (`AUTHORITY_INVITE_CODE`) so nobody can self-appoint as an officer |

Anyone signed in can report illegal dumping with a photo and map pin. Anyone, signed in or not, can verify a manifest at `/#/manifest/<number>`.

### Pickup lifecycle

`requested → scheduled (transporter, vehicle and fee fixed) → en route → picked up (gross/tare) → completed (facility + net weight → manifest number)`

The generator can cancel until the truck leaves. The transporter can release a job back to the open list. Points are awarded only on verified outcomes: completed manifests, delivered orders, new listings and cleared dumping reports.

## Engineering basis

All tonnage, money and carbon figures come from [`src/lib/cdFactors.ts`](src/lib/cdFactors.ts), which has unit tests. Each factor is labelled:

- **Sourced**: composition of Indian C&D waste by mass (TIFAC, 2001) and demolition generation rates within TIFAC's ~300–500 kg/m² band.
- **Indicative**: salvage prices, disposal fees, freight (₹42 per tonne-km), loose rubble density (1.4 t/m³), CO₂ avoided per tonne and road circuity (1.3). These are reasonable assumptions, **not** citable values; replace them with referenced figures before quoting any output in a report.

Aggregate test values follow IS 383:2016 / IS 2386 (Part 4): AIV and ACV are percentages (≤ 30% for wearing surfaces). Listings can only claim IS 383 compliance if they include an AIV or ACV result.

The optional **photo scanner** sends the picture to Google Gemini to estimate composition and, if something in the frame shows scale, volume. Weight and value are then calculated with the factors above, not by the model. A measured volume overrides the model's guess.

## Architecture

```
server/          Express API (TypeScript, run with tsx)
  app.ts         Routes, validation (zod), role checks, pickup state machine
  db.ts          Postgres pool + schema (created on start-up)
  auth.ts        bcrypt passwords, signed httpOnly session cookie
  scan.ts        Gemini photo analysis
src/             React + Vite + Tailwind frontend
  views/         One screen per route
  lib/           Engineering factors, formatting, session/routing
```

The server serves the built frontend, so the whole app is one web service plus one Postgres database.

## Run locally

Needs Node.js 22+ and PostgreSQL.

```bash
cp .env.example .env          # set DATABASE_URL and SESSION_SECRET
npm install
npm run build
set -a; . ./.env; set +a
npm start                     # http://localhost:8080
```

For development with hot reload, run `npm run dev:api` (API on :8080) and `npm run dev` (frontend on :3000, proxies `/api`).

| Command | Does |
|---|---|
| `npm start` | Production server (API + frontend) |
| `npm run dev` / `npm run dev:api` | Frontend / API with hot reload |
| `npm run build` | Build the frontend into `build/` |
| `npm run lint` | TypeScript type check |
| `npm test` | Unit tests; API tests too when `TEST_DATABASE_URL` is set (that database is wiped) |
| `npm run check` | Type check + tests + build (what CI runs, with a Postgres service) |

## Deploy on Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Erpoojad/c-d-setu)

[`render.yaml`](render.yaml) creates a free Node web service and a free Postgres database in Singapore. You set `AUTHORITY_INVITE_CODE`, and optionally `GEMINI_API_KEY`. Notes on the free tier:

- The web service sleeps after 15 minutes without traffic; the first request after that takes about a minute.
- **Render deletes free Postgres databases 30 days after creation** unless upgraded. Upgrade the database before relying on it.

## Limitations

- Photos are stored in Postgres, capped at 2 MB each after in-browser compression. Fine for a pilot, not for scale.
- Notifications are in-app only (no SMS or email). Phone numbers are shared once a job or order is accepted.
- Distances are straight-line × 1.3 from map pins, not road routing.

## Regulatory context

- Construction & Demolition Waste Management Rules, 2016 (MoEFCC)
- CPCB Guidelines on Environmental Management of C&D Wastes, 2017
- IS 383:2016, Coarse and Fine Aggregate for Concrete (permits recycled aggregates)
