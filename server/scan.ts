import { GoogleGenAI } from '@google/genai';
import type { MaterialCategory } from '../src/types';
import {
  COMPOSITION,
  LOOSE_RUBBLE_DENSITY_T_PER_M3,
  co2AvoidedKg,
  salvageValueInr,
  MIXED_DISPOSAL_INR_PER_T,
} from '../src/lib/cdFactors';

const MATERIALS = Object.keys(COMPOSITION) as MaterialCategory[];

export const scannerConfigured = () => Boolean(process.env.GEMINI_API_KEY);

const SCHEMA = {
  type: 'object',
  properties: {
    isConstructionWaste: {
      type: 'boolean',
      description: 'True only if the photo mainly shows construction or demolition debris.',
    },
    composition: {
      type: 'object',
      description: 'Estimated share of each material by mass, as whole-number percentages summing to 100.',
      properties: Object.fromEntries(MATERIALS.map((m) => [m, { type: 'number' }])),
      required: MATERIALS,
    },
    estimatedVolumeM3: {
      type: ['number', 'null'],
      description:
        'Estimated loose (bulked) volume of the visible heap in cubic metres, or null if there is nothing in the photo to judge scale by.',
    },
    scaleReference: {
      type: 'string',
      description: 'What in the photo was used to judge size (a person, a door, a vehicle, bricks), or "none".',
    },
    segregated: { type: 'boolean', description: 'True if the heap is predominantly one material.' },
    contaminants: {
      type: 'array',
      items: { type: 'string' },
      description: 'Visible contaminants that hurt recycling: plastic, wood, gypsum, household waste, etc.',
    },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    advice: {
      type: 'string',
      description: 'One or two practical sentences on segregating this heap before pickup.',
    },
  },
  required: [
    'isConstructionWaste',
    'composition',
    'estimatedVolumeM3',
    'scaleReference',
    'segregated',
    'contaminants',
    'confidence',
    'advice',
  ],
};

const PROMPT = `You are a civil engineer assessing a construction & demolition (C&D) waste heap in India from one photo.
Material categories: concrete (incl. RCC rubble, mortar lumps), brick_masonry (clay bricks, blocks, tiles),
soil_gravel (soil, sand, aggregate fines), metals (rebar, steel sections), bitumen (asphalt), wood, others (plastic, gypsum, glass, mixed refuse).
Estimate composition by MASS, not by visible area: dense concrete and steel weigh more than they look.
Only estimate volume if there is a real scale reference in the frame; otherwise return null. Be conservative.`;

export interface ScanResult {
  isConstructionWaste: boolean;
  composition: Record<MaterialCategory, number>;
  estimatedVolumeM3: number | null;
  scaleReference: string;
  segregated: boolean;
  contaminants: string[];
  confidence: 'low' | 'medium' | 'high';
  advice: string;
  // derived with the app's engineering factors, not by the model
  estimatedTonnes: number | null;
  dominantMaterial: MaterialCategory;
  salvageInrIfSegregated: number | null;
  mixedDisposalInr: number | null;
  co2AvoidedKg: number | null;
  model: string;
}

function normalise(comp: Record<string, number>): Record<MaterialCategory, number> {
  const raw = MATERIALS.map((m) => Math.max(0, Number(comp?.[m]) || 0));
  const total = raw.reduce((a, b) => a + b, 0) || 1;
  return Object.fromEntries(MATERIALS.map((m, i) => [m, Math.round((raw[i] / total) * 100)])) as Record<
    MaterialCategory,
    number
  >;
}

export async function scanImage(base64: string, mimeType: string, volumeOverrideM3?: number): Promise<ScanResult> {
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64 } }, { text: PROMPT }] }],
    config: { responseMimeType: 'application/json', responseJsonSchema: SCHEMA, temperature: 0.2 },
  });

  const text = response.text;
  if (!text) throw new Error('The model returned no result.');
  const parsed = JSON.parse(text);

  const composition = normalise(parsed.composition);
  const dominantMaterial = MATERIALS.reduce((a, b) => (composition[b] > composition[a] ? b : a));
  const volume =
    volumeOverrideM3 && volumeOverrideM3 > 0
      ? volumeOverrideM3
      : typeof parsed.estimatedVolumeM3 === 'number' && parsed.estimatedVolumeM3 > 0
        ? parsed.estimatedVolumeM3
        : null;
  const tonnes = volume ? Math.round(volume * LOOSE_RUBBLE_DENSITY_T_PER_M3 * 10) / 10 : null;

  const share = (m: MaterialCategory) => (tonnes ?? 0) * (composition[m] / 100);
  return {
    isConstructionWaste: Boolean(parsed.isConstructionWaste),
    composition,
    estimatedVolumeM3: volume,
    scaleReference: String(parsed.scaleReference || 'none'),
    segregated: Boolean(parsed.segregated),
    contaminants: Array.isArray(parsed.contaminants) ? parsed.contaminants.map(String).slice(0, 8) : [],
    confidence: ['low', 'medium', 'high'].includes(parsed.confidence) ? parsed.confidence : 'low',
    advice: String(parsed.advice || ''),
    estimatedTonnes: tonnes,
    dominantMaterial,
    salvageInrIfSegregated: tonnes ? MATERIALS.reduce((s, m) => s + salvageValueInr(m, share(m), true), 0) : null,
    mixedDisposalInr: tonnes ? Math.round(tonnes * MIXED_DISPOSAL_INR_PER_T) : null,
    co2AvoidedKg: tonnes ? MATERIALS.reduce((s, m) => s + co2AvoidedKg(m, share(m)), 0) : null,
    model,
  };
}
