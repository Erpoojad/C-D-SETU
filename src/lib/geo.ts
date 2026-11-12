/** Great-circle distance in km between two lat/lng points (haversine). */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Road distance is longer than straight-line distance. 1.3 is a typical
 * circuity factor for Indian urban road networks (INDICATIVE).
 */
export const ROAD_CIRCUITY = 1.3;

export function roadKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  return Math.round(distanceKm(aLat, aLng, bLat, bLng) * ROAD_CIRCUITY * 10) / 10;
}
