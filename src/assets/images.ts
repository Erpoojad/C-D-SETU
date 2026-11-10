// Images are imported as modules so Vite fingerprints them and copies them
// into dist/. Plain "/src/assets/..." string paths only work on the dev
// server and break in every production build.
import heroCdRecycling from './images/hero_cd_recycling_1791642672171.jpg';
import recycledAggregates from './images/material_recycled_aggregates_1791642686421.jpg';
import reclaimedBricks from './images/material_reclaimed_bricks_1791642698748.jpg';

export const IMAGES = {
  heroCdRecycling,
  recycledAggregates,
  reclaimedBricks,
} as const;
