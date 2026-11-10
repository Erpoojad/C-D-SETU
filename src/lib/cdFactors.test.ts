import { describe, expect, it } from 'vitest';
import {
  COMPOSITION,
  CO2_AVOIDED_KG_PER_T,
  SALVAGE_INR_PER_T,
  co2AvoidedKg,
  estimateGeneration,
  freightInr,
  generationRateKgPerSqFt,
  salvageValueInr,
} from './cdFactors';

describe('composition', () => {
  it('shares sum to 100%', () => {
    const total = Object.values(COMPOSITION).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('covers every material category with salvage and CO2 factors', () => {
    for (const m of Object.keys(COMPOSITION)) {
      expect(SALVAGE_INR_PER_T).toHaveProperty(m);
      expect(CO2_AVOIDED_KG_PER_T).toHaveProperty(m);
    }
  });
});

describe('generation rate', () => {
  it('RCC demolition sits near 50 kg/sq.ft (≈540 kg/m²)', () => {
    expect(generationRateKgPerSqFt('demolition', 'rcc')).toBeCloseTo(50.2, 1);
  });

  it('orders road > RCC demolition > masonry demolition > renovation', () => {
    const road = generationRateKgPerSqFt('road', 'rcc');
    const rcc = generationRateKgPerSqFt('demolition', 'rcc');
    const brick = generationRateKgPerSqFt('demolition', 'brick_loadbearing');
    const reno = generationRateKgPerSqFt('renovation', 'rcc');
    expect(road).toBeGreaterThan(rcc);
    expect(rcc).toBeGreaterThan(brick);
    expect(brick).toBeGreaterThan(reno);
  });
});

describe('salvage', () => {
  it('pays nothing for mixed loads', () => {
    expect(salvageValueInr('metals', 10, false)).toBe(0);
  });

  it('values steel scrap far above aggregates (regression: was ₹3,800/t in booking)', () => {
    expect(SALVAGE_INR_PER_T.metals).toBeGreaterThan(20000);
    expect(salvageValueInr('metals', 1, true)).toBeGreaterThan(30 * salvageValueInr('concrete', 1, true));
  });
});

describe('carbon', () => {
  it('credits steel far more than concrete (regression: was a flat 42 kg/t)', () => {
    expect(co2AvoidedKg('metals', 1)).toBeGreaterThan(co2AvoidedKg('concrete', 1) * 10);
  });
});

describe('freight', () => {
  it('scales with tonne-km', () => {
    expect(freightInr(10, 5)).toBe(2 * freightInr(5, 5));
  });
});

describe('estimateGeneration', () => {
  const est = estimateGeneration(2400, 'demolition', 'rcc');

  it('produces a plausible tonnage for a 2,400 sq.ft RCC demolition', () => {
    expect(est.totalTonnes).toBeGreaterThan(100);
    expect(est.totalTonnes).toBeLessThan(140);
  });

  it('material split adds back to the total within rounding', () => {
    const sum = Object.values(est.byMaterial).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - est.totalTonnes)).toBeLessThan(0.5);
  });

  it('trip count covers the full load', () => {
    expect(est.tipperTrips * 8).toBeGreaterThanOrEqual(est.totalTonnes);
    expect((est.tipperTrips - 1) * 8).toBeLessThan(est.totalTonnes);
  });

  it('keeps small jobs non-zero (regression: Math.round zeroed loads under 0.5 t)', () => {
    expect(estimateGeneration(40, 'renovation', 'rcc').totalTonnes).toBeGreaterThan(0);
  });

  it('treats negative or empty area as zero', () => {
    expect(estimateGeneration(-50, 'demolition', 'rcc').totalTonnes).toBe(0);
    expect(estimateGeneration(NaN, 'demolition', 'rcc').totalTonnes).toBe(0);
  });
});
