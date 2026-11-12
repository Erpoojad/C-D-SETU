# C&D Setu

**A construction & demolition (C&D) waste exchange for Indian cities — linking the people who generate rubble with the transporters, recyclers and buyers who can use it, and producing the paperwork the C&D Waste Management Rules, 2016 require.**

India generates C&D waste in the tens of millions of tonnes a year, and most of it is dumped unsegregated on roadsides, drains and open plots. The material isn't the problem — crushed concrete and masonry can replace virgin aggregate under IS 383:2016 — the problem is that generators, transporters and recyclers can't find each other, and nobody gets paid for segregating. C&D Setu is a prototype of the missing marketplace.

> **Status: frontend prototype.** Every screen works, but all data is mock data held in browser memory (`src/data/mockData.ts`). Nothing is persisted, there is no backend or authentication, and the "AI scanner" returns preset samples rather than analysing a photo. See [Roadmap](#roadmap).

## What it does

| Module | For | What it shows |
|---|---|---|
| **Waste & carbon calculator** | Generators, planners | Tonnage, material split, loose volume, tipper trips, salvage value and CO₂ avoided from plan area and project type |
| **Material marketplace** | Buyers, contractors | Recycled aggregates, reclaimed bricks and steel with IS 383 lab data (AIV, ACV, water absorption, silt) |
| **Tipper booking & tracking** | Generators, transporters | Vehicle choice, pooled small-lot pickups, salvage credit vs transport fee, status timeline |
| **Compliance manifest** | Generators, ULBs | CPCB-style waste movement manifest with net weight and destination facility |
| **Decentralised GIS network** | ULB planners | Micro-crushers and ward-level collection points for Tier-2/3 cities, not just one central plant |
| **Smart routing** | Transporters | Nearest-facility routing by material and capacity |
| **Illegal dumping reporter** | Citizens, ward officers | Report a dumping hotspot and follow it to clearance |
| **Stakeholder dashboards & reputation** | All roles | Role-specific views and points for verified diversion |

## Engineering basis

All tonnage, money and carbon figures come from one module, [`src/lib/cdFactors.ts`](src/lib/cdFactors.ts), and are covered by unit tests. Each factor is labelled in the source:

- **Sourced** — the composition of Indian C&D waste by mass (TIFAC, 2001): soil/sand/gravel 36%, brick & masonry 31%, concrete 23%, metals 5%, bitumen 2%, wood 2%, others 1%. Demolition generation rates are set within TIFAC's ~300–500 kg/m² band for pucca buildings.
- **Indicative** — salvage prices, disposal fees, freight (₹42 per tonne-km), loose rubble density (1.4 t/m³) and CO₂ avoided per tonne. These are reasonable 2026 assumptions for a prototype, **not** citable values; replace them with referenced figures before quoting any output in a report.

Aggregate lab values follow IS 383:2016 / IS 2386 (Part 4) conventions: Aggregate Impact Value and Aggregate Crushing Value are percentages (≤30% for wearing surfaces).

## Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Erpoojad/c-d-setu)

Deploys as a free Render static site using [`render.yaml`](render.yaml): `npm ci && npm run build`, published from `build/`. Every push to `main` redeploys automatically.

## Run it locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command | Does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build into `build/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | TypeScript type check |
| `npm test` | Unit tests for the engineering factors |
| `npm run check` | Type check + tests + build — what CI runs |

## Project structure

```
src/
  App.tsx              Top-level state and modal wiring
  lib/cdFactors.ts     Engineering factors and calculations (single source of truth)
  data/mockData.ts     Mock listings, fleet, pickups, facilities, users
  types/index.ts       Domain types
  components/          One file per section or modal
  assets/images.ts     Image imports (so they ship in production builds)
```

## Roadmap

1. **Persistence and backend** — store listings, pickups and manifests in a database instead of React state.
2. **Real material scanner** — classify an uploaded rubble photo (the project was scaffolded with a Gemini API key in `.env.example` for this; it is not wired up yet).
3. **Real maps** — replace the illustrative SVG maps with OpenStreetMap/Leaflet and live facility coordinates.
4. **Cited factors** — replace every *indicative* factor with a referenced Indian value, and expose the reference in the UI.
5. **Authentication and roles** — real accounts for generators, transporters, recyclers and ULB officers.

## Regulatory context

- Construction & Demolition Waste Management Rules, 2016 (MoEFCC)
- CPCB Guidelines on Environmental Management of C&D Wastes, 2017
- IS 383:2016 — Coarse and Fine Aggregate for Concrete (permits recycled aggregates)
