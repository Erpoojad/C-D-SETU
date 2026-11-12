import { describe, expect, it, vi } from 'vitest';

const reply = {
  isConstructionWaste: true,
  composition: { concrete: 120, brick_masonry: 60, soil_gravel: 20, metals: 0, bitumen: 0, wood: 0, others: 0 },
  estimatedVolumeM3: 5,
  scaleReference: 'a person standing beside the heap',
  segregated: false,
  contaminants: ['plastic bags'],
  confidence: 'medium',
  advice: 'Pull out the plastic before loading.',
};

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: async () => ({ text: JSON.stringify(reply) }) };
  },
}));

describe('scanImage', () => {
  it('normalises composition to 100% and derives tonnes from loose density', async () => {
    process.env.GEMINI_API_KEY = 'test';
    const { scanImage } = await import('./scan');
    const r = await scanImage('AAAA', 'image/jpeg');
    expect(Object.values(r.composition).reduce((a, b) => a + b, 0)).toBe(100);
    expect(r.composition.concrete).toBe(60);
    expect(r.dominantMaterial).toBe('concrete');
    expect(r.estimatedTonnes).toBe(7); // 5 m³ × 1.4 t/m³
    expect(r.salvageInrIfSegregated).toBeGreaterThan(0);
  });

  it('uses the user-supplied volume over the model estimate', async () => {
    const { scanImage } = await import('./scan');
    const r = await scanImage('AAAA', 'image/jpeg', 10);
    expect(r.estimatedTonnes).toBe(14);
  });
});
