/**
 * printAreaConfig.ts
 *
 * Calibrated print-safe zones for the 2D apparel customizer.
 *
 * Coordinates are absolute pixels relative to a fixed CANVAS reference of 1000 × 1200 px.
 * The canvas renderer scales these down to the actual display canvas size via a scaleFactor.
 *
 * Physical print area dimensions (industry standard DTG limits):
 *  - Regular Tee  : 12" × 16" front, 12" × 16" back
 *  - Oversized Tee: 13" × 17" front, 13" × 17" back  (slightly larger canvas)
 *  - Hoodie       : 11" × 14" front, 11" × 14" back
 *
 * At 300 DPI the print-ready offscreen canvas sizes are:
 *  - Tee front/back   : 3600 × 4800 px
 *  - Oversized front/back: 3900 × 5100 px
 *  - Hoodie front/back: 3300 × 4200 px
 */

export type GarmentType = 'tee' | 'oversized-tee' | 'hoodie';
export type GarmentView = 'front' | 'back';

export interface GarmentColor {
  id: string;
  label: string;
  /** Hex used for the color swatch chip */
  hex: string;
  /**
   * Path to the flat mockup PNG for this color × view combo.
   * If null → no real asset yet; a CSS multiply tint is applied to the neutral base.
   * TODO: replace null entries with real flat-shot assets when photography is available.
   */
  mockupImage: string | null;
}

export interface PrintAreaConfig {
  garment: GarmentType;
  view: GarmentView;
  /**
   * Print-safe zone in canvas reference coordinates (1000 × 1200 px).
   * x, y = top-left corner of printable area.
   */
  printArea: { x: number; y: number; width: number; height: number };
  /** Default scale applied to newly-dropped design (fraction of printArea width) */
  defaultDesignScale: number;
  /**
   * Physical print dimensions at 300 DPI for the offscreen print-ready export.
   * widthPx  = inches × 300
   * heightPx = inches × 300
   */
  printExport: { widthPx: number; heightPx: number };
}

/** Reference canvas dimensions (all print areas are calibrated to these) */
export const CANVAS_REF_WIDTH = 1000;
export const CANVAS_REF_HEIGHT = 1200;

export const PRINT_AREA_CONFIGS: PrintAreaConfig[] = [
  // ─────────────── REGULAR TEE ───────────────
  {
    garment: 'tee',
    view: 'front',
    printArea: { x: 310, y: 280, width: 380, height: 500 },
    defaultDesignScale: 0.65,
    printExport: { widthPx: 3600, heightPx: 4800 },
  },
  {
    garment: 'tee',
    view: 'back',
    printArea: { x: 310, y: 260, width: 380, height: 520 },
    defaultDesignScale: 0.65,
    printExport: { widthPx: 3600, heightPx: 4800 },
  },

  // ─────────────── OVERSIZED TEE ───────────────
  {
    garment: 'oversized-tee',
    view: 'front',
    printArea: { x: 290, y: 260, width: 420, height: 540 },
    defaultDesignScale: 0.65,
    printExport: { widthPx: 3900, heightPx: 5100 },
  },
  {
    garment: 'oversized-tee',
    view: 'back',
    printArea: { x: 290, y: 240, width: 420, height: 550 },
    defaultDesignScale: 0.65,
    printExport: { widthPx: 3900, heightPx: 5100 },
  },

  // ─────────────── HOODIE ───────────────
  {
    garment: 'hoodie',
    view: 'front',
    // Hoodie front print area avoids the pouch pocket — sits above it
    printArea: { x: 325, y: 270, width: 350, height: 420 },
    defaultDesignScale: 0.6,
    printExport: { widthPx: 3300, heightPx: 4200 },
  },
  {
    garment: 'hoodie',
    view: 'back',
    printArea: { x: 315, y: 240, width: 370, height: 480 },
    defaultDesignScale: 0.6,
    printExport: { widthPx: 3300, heightPx: 4200 },
  },
];

export function getPrintAreaConfig(garment: GarmentType, view: GarmentView): PrintAreaConfig {
  const config = PRINT_AREA_CONFIGS.find((c) => c.garment === garment && c.view === view);
  if (!config) throw new Error(`No print area config for ${garment} ${view}`);
  return config;
}

// ─────────────── COLOR PALETTES ───────────────
//
// AVAILABLE REAL MOCKUP IMAGES (confirmed in /public/images/mockups/):
//   tee-black-front.png       ✓
//   tee-black-back.png        ✓
//   tee-white-front.png       ✓
//   tee-white-back.png        ✓
//   oversized-tee-black-front.png  ✓
//   oversized-tee-black-back.png   ✓
//   oversized-tee-white-front.png  ✓  (back not available — tint used)
//   hoodie-black-front.png    ✓
//   hoodie-black-back.png     ✓
//   hoodie-white-front.png    ✓     (back not available — tint used)
//
// Colors with mockupImage: null use CSS multiply tinting on the WHITE base mockup.
// WHITE base × color.hex = color.hex (correct tinting).
// BLACK base × any color = black (incorrect — never use black as tinting base).
//
// ─── Normal T-Shirt colors ───────────────────────────────────────────────────
//   Black #000000 | White #FFFFFF | Cornflower Blue #BAB9F1
//   Light Pink #FF91AF | Olive Drab Green #446D23
//
// ─── Oversized T-Shirt colors ────────────────────────────────────────────────
//   Black #000000 | White #FFFFFF | Charcoal Grey #4A4A4A
//   Caramel #C8935A | Lime Cream #E5F5B0
//
// ─── Hoodie / Acid Wash colors ───────────────────────────────────────────────
//   Acid Black #1C1C1C | Burnt Orange #C5522D | Brown/Coffee #6B4E3D

// Tee: full black+white front+back available
const TEE_COLORS = (view: GarmentView): GarmentColor[] => [
  {
    id: 'black',
    label: 'Black',
    hex: '#000000',
    mockupImage: `/images/mockups/tee-black-${view}.png`,
  },
  {
    id: 'white',
    label: 'White',
    hex: '#FFFFFF',
    mockupImage: `/images/mockups/tee-white-${view}.png`,
  },
  {
    id: 'cornflower-blue',
    label: 'Cornflower Blue',
    hex: '#BAB9F1',
    mockupImage: null, // CSS multiply tint on white base
  },
  {
    id: 'light-pink',
    label: 'Light Pink',
    hex: '#FF91AF',
    mockupImage: null,
  },
  {
    id: 'olive-drab',
    label: 'Olive Drab Green',
    hex: '#446D23',
    mockupImage: null,
  },
];

// Oversized: black front+back, white front only (back uses tint)
const OVERSIZED_TEE_COLORS = (view: GarmentView): GarmentColor[] => [
  {
    id: 'black',
    label: 'Black',
    hex: '#000000',
    // Both front and back real assets exist
    mockupImage: `/images/mockups/oversized-tee-black-${view}.png`,
  },
  {
    id: 'white',
    label: 'White',
    hex: '#FFFFFF',
    // Only front real asset; back uses CSS tint (white shirt, so tint = white = fine)
    mockupImage: view === 'front' ? '/images/mockups/oversized-tee-white-front.png' : null,
  },
  {
    id: 'charcoal-grey',
    label: 'Charcoal Grey',
    hex: '#4A4A4A',
    mockupImage: null,
  },
  {
    id: 'caramel',
    label: 'Caramel',
    hex: '#C8935A',
    mockupImage: null,
  },
  {
    id: 'lime-cream',
    label: 'Lime Cream',
    hex: '#E5F5B0',
    mockupImage: null,
  },
];

// Hoodie: black front+back, white front only (back uses tint)
const HOODIE_COLORS = (view: GarmentView): GarmentColor[] => [
  {
    id: 'acid-black',
    label: 'Acid Black',
    hex: '#1C1C1C',
    mockupImage: `/images/mockups/hoodie-black-${view}.png`,
  },
  {
    id: 'burnt-orange',
    label: 'Burnt Orange',
    hex: '#C5522D',
    mockupImage: null,
  },
  {
    id: 'brown-coffee',
    label: 'Brown / Coffee',
    hex: '#6B4E3D',
    mockupImage: null,
  },
];

export const GARMENT_COLORS: Record<GarmentType, Record<GarmentView, GarmentColor[]>> = {
  tee: {
    front: TEE_COLORS('front'),
    back: TEE_COLORS('back'),
  },
  'oversized-tee': {
    front: OVERSIZED_TEE_COLORS('front'),
    back: OVERSIZED_TEE_COLORS('back'),
  },
  hoodie: {
    front: HOODIE_COLORS('front'),
    back: HOODIE_COLORS('back'),
  },
};

/**
 * White-base mockup used when a per-colour real image is not available.
 *
 * CRITICAL: Must be WHITE (not black).
 * CSS multiply blend:  white × target_color = target_color  ✓ (correct tinting)
 *                      black × target_color = black          ✗ (no tinting possible)
 */
export const NEUTRAL_BASE_MOCKUP: Record<GarmentType, Record<GarmentView, string>> = {
  tee: {
    front: '/images/mockups/tee-white-front.png',
    back: '/images/mockups/tee-white-back.png',
  },
  'oversized-tee': {
    // Only front white available — back uses front as approximation until asset delivered
    front: '/images/mockups/oversized-tee-white-front.png',
    back: '/images/mockups/oversized-tee-white-front.png',
  },
  hoodie: {
    // Only front white available — back uses front as approximation until asset delivered
    front: '/images/mockups/hoodie-white-front.png',
    back: '/images/mockups/hoodie-white-front.png',
  },
};
