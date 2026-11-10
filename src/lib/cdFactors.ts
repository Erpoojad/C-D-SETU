/**
 * C&D waste engineering factors — the single source of truth.
 *
 * Before this module existed the same quantity had different values in
 * different components (steel salvage was ₹42,000/t in the calculator and
 * ₹3,800/t in the booking flow; every material, including steel, was
 * credited a flat 42 kg CO₂/t). Every number the UI shows about tonnage,
 * money or carbon must come from here.
 *
 * Status of each factor:
 *   SOURCED   — taken from a published Indian reference (cited inline).
 *   INDICATIVE — a market or engineering assumption for the prototype.
 *                Replace with a cited value before using results in a report.
 */

import type { MaterialCategory } from '../types';

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

/**
 * SOURCED — Indian C&D waste composition by mass, TIFAC (2001), as
 * reproduced in CPCB/BMTPC guidance. Shares sum to 1.
 */
export const COMPOSITION: Record<MaterialCategory, number> = {
  soil_gravel: 0.36,
  brick_masonry: 0.31,
  concrete: 0.23,
  metals: 0.05,
  bitumen: 0.02,
  wood: 0.02,
  others: 0.01,
};

export const MATERIAL_LABELS: Record<MaterialCategory, string> = {
  soil_gravel: 'Soil, Sand & Gravel',
  brick_masonry: 'Brick & Masonry',
  concrete: 'Concrete',
  metals: 'Steel & Rebar',
  bitumen: 'Bitumen',
  wood: 'Wood',
  others: 'Others',
};

/* ------------------------------------------------------------------ */
/* Generation rates                                                    */
/* ------------------------------------------------------------------ */

export type ProjectType = 'demolition' | 'renovation' | 'road';
export type StructureType = 'rcc' | 'brick_loadbearing';

const SQFT_PER_M2 = 10.7639;

/**
 * Waste generated per unit plan area, kg/m².
 * Demolition: SOURCED order of magnitude — TIFAC gives ~300–500 kg/m² for
 *   demolition of pucca buildings; RCC frames sit at the top of that band.
 * Renovation / road: INDICATIVE.
 */
export const GENERATION_KG_PER_M2 = {
  demolition_rcc: 540,
  demolition_brick_loadbearing: 475,
  renovation: 150,
  road: 915, // full-depth removal ≈ 0.4 m × 2.3 t/m³
} as const;

export function generationRateKgPerM2(project: ProjectType, structure: StructureType): number {
  if (project === 'renovation') return GENERATION_KG_PER_M2.renovation;
  if (project === 'road') return GENERATION_KG_PER_M2.road;
  return structure === 'brick_loadbearing'
    ? GENERATION_KG_PER_M2.demolition_brick_loadbearing
    : GENERATION_KG_PER_M2.demolition_rcc;
}

export function generationRateKgPerSqFt(project: ProjectType, structure: StructureType): number {
  return generationRateKgPerM2(project, structure) / SQFT_PER_M2;
}

/* ------------------------------------------------------------------ */
/* Economics (INDICATIVE, ₹ per tonne, 2026 Indian market)             */
/* ------------------------------------------------------------------ */

/** What a recycler/buyer pays for segregated material at the gate. */
export const SALVAGE_INR_PER_T: Record<MaterialCategory, number> = {
  concrete: 650,
  brick_masonry: 480,
  soil_gravel: 180,
  metals: 38000, // heavy-melting steel scrap; was wrongly ₹3,800 in the booking flow
  bitumen: 250,
  wood: 1200,
  others: 0,
};

/** Mixed (unsegregated) loads are rejected for resale: no salvage credit. */
export const MIXED_LOAD_SALVAGE_INR_PER_T = 0;

/** Tipping + haulage a generator pays to dump mixed rubble. */
export const MIXED_DISPOSAL_INR_PER_T = 950;

/** Road freight for bulk aggregates, ₹ per tonne-km. */
export const FREIGHT_INR_PER_T_KM = 42;

/* ------------------------------------------------------------------ */
/* Carbon (INDICATIVE, kg CO₂e avoided per tonne recycled vs virgin)   */
/* ------------------------------------------------------------------ */

export const CO2_AVOIDED_KG_PER_T: Record<MaterialCategory, number> = {
  concrete: 42,
  brick_masonry: 42,
  soil_gravel: 5,
  metals: 1650, // scrap-EAF route vs BF-BOF primary steel
  bitumen: 30,
  wood: 0,
  others: 0,
};

/* ------------------------------------------------------------------ */
/* Haulage                                                             */
/* ------------------------------------------------------------------ */

/** INDICATIVE — loose (bulked) mixed rubble, t/m³. Solid concrete is ~2.4. */
export const LOOSE_RUBBLE_DENSITY_T_PER_M3 = 1.4;
const CFT_PER_M3 = 35.3147;

export const STANDARD_TIPPER_PAYLOAD_T = 8;

/* ------------------------------------------------------------------ */
/* Calculations                                                        */
/* ------------------------------------------------------------------ */

const round1 = (n: number) => Math.round(n * 10) / 10;

export function co2AvoidedKg(material: MaterialCategory, tonnes: number): number {
  return Math.round(tonnes * CO2_AVOIDED_KG_PER_T[material]);
}

export function salvageValueInr(material: MaterialCategory, tonnes: number, segregated: boolean): number {
  const rate = segregated ? SALVAGE_INR_PER_T[material] : MIXED_LOAD_SALVAGE_INR_PER_T;
  return Math.round(tonnes * rate);
}

export function freightInr(tonnes: number, distanceKm: number): number {
  return Math.round(tonnes * distanceKm * FREIGHT_INR_PER_T_KM);
}

export interface GenerationEstimate {
  rateKgPerSqFt: number;
  totalTonnes: number;
  byMaterial: Record<MaterialCategory, number>;
  looseVolumeCft: number;
  tipperTrips: number;
  salvageInr: number;
  avoidedDumpingInr: number;
  /** Salvage earned + dumping fee avoided, versus sending it all mixed to a dump. */
  benefitVsMixedDumpingInr: number;
  co2AvoidedKg: number;
}

export function estimateGeneration(
  areaSqFt: number,
  project: ProjectType,
  structure: StructureType,
): GenerationEstimate {
  const area = Math.max(0, areaSqFt || 0);
  const rateKgPerSqFt = generationRateKgPerSqFt(project, structure);
  const totalTonnes = round1((area * rateKgPerSqFt) / 1000);

  const byMaterial = Object.fromEntries(
    (Object.keys(COMPOSITION) as MaterialCategory[]).map((m) => [m, round1(totalTonnes * COMPOSITION[m])]),
  ) as Record<MaterialCategory, number>;

  const materials = Object.keys(COMPOSITION) as MaterialCategory[];
  const salvageInr = materials.reduce((s, m) => s + salvageValueInr(m, totalTonnes * COMPOSITION[m], true), 0);
  const co2 = materials.reduce((s, m) => s + co2AvoidedKg(m, totalTonnes * COMPOSITION[m]), 0);
  const avoidedDumpingInr = Math.round(totalTonnes * MIXED_DISPOSAL_INR_PER_T);

  return {
    rateKgPerSqFt: round1(rateKgPerSqFt),
    totalTonnes,
    byMaterial,
    looseVolumeCft: Math.round((totalTonnes / LOOSE_RUBBLE_DENSITY_T_PER_M3) * CFT_PER_M3),
    tipperTrips: Math.ceil(totalTonnes / STANDARD_TIPPER_PAYLOAD_T),
    salvageInr,
    avoidedDumpingInr,
    benefitVsMixedDumpingInr: salvageInr + avoidedDumpingInr,
    co2AvoidedKg: co2,
  };
}
