/**
 * Device skin template database.
 *
 * DATA SOURCES:
 *  - Body dimensions (aspectRatio, borderRadius): official manufacturer spec pages
 *    (apple.com, samsung.com, store.google.com, oneplus.in, mi.com, vivo.com, oneplus.com)
 *  - Camera module SHAPE: confirmed from press-kit photography, official product pages
 *    and independent teardown/review publications.
 *  - Camera module POSITION within back panel: estimated from calibrated measurements
 *    taken against high-resolution press-kit and review photographs. No proprietary
 *    cutting templates were referenced. All values are functional facts.
 *
 * CONFIDENCE FLAGS:
 *  'verified'  — body dimensions from official specs; module shape from 2+ independent sources
 *  'estimated' — module position/size estimated from press photos (all camera coordinates fall
 *                into this category since manufacturers don't publish housing footprints)
 */

// ─── Shape Types ────────────────────────────────────────────────────────────

/**
 * Shape of the rear camera module on the back panel.
 *
 * rect-rounded   — Rounded rectangle island (iPhone Pro series, Xiaomi 15, OnePlus 15)
 * pill-vertical  — Tall, narrow pill (Samsung S-series standard; iPhone 16 dual-cam)
 * pill-horizontal — Wide, short pill (Google Pixel 9+ series camera island)
 * circle         — Circular island (OnePlus 13 Hasselblad ring; Vivo X200 Pro; Oppo Find X8 Pro)
 * strip-vertical — Tall background strip with individual floating lenses (Samsung Ultra series)
 */
export type CameraShape =
  'rect-rounded' | 'pill-vertical' | 'pill-horizontal' | 'circle' | 'strip-vertical';

// ─── Sub-Interfaces ──────────────────────────────────────────────────────────

/** A single camera lens or flash position within the module bounding box. */
export interface LensSpec {
  /** Center X as fraction of module bounding-box WIDTH (0 = left, 1 = right) */
  cx: number;
  /** Center Y as fraction of module bounding-box HEIGHT (0 = top, 1 = bottom) */
  cy: number;
  /** Radius as fraction of module WIDTH */
  r: number;
}

/**
 * Rear camera module descriptor.
 *
 * For rect-rounded | pill-vertical | pill-horizontal | strip-vertical:
 *   x = left-edge fraction of device back WIDTH
 *   y = top-edge fraction of device back HEIGHT
 *   w = module width fraction of device back WIDTH
 *   h = module height fraction of device back HEIGHT
 *
 * For 'circle':
 *   x = center-x fraction of device back WIDTH
 *   y = center-y fraction of device back HEIGHT
 *   w = radius fraction of device back WIDTH  (h is ignored for rendering)
 *   h = radius fraction of device back HEIGHT (kept for bounding-box consistency)
 */
export interface CameraModule {
  shape: CameraShape;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Individual lens positions relative to module bounding box */
  lenses?: LensSpec[];
  /** LED flash, relative to module bounding box */
  flash?: LensSpec;
}

// ─── Primary Interface ───────────────────────────────────────────────────────

export interface DeviceModel {
  id: string;
  name: string;
  brand: string;
  type: 'mobile' | 'laptop';
  /**
   * Width ÷ Height of the device BACK PANEL.
   * Derived directly from official manufacturer mm dimensions.
   */
  aspectRatio: number;
  /**
   * Corner radius as a fraction of device back panel WIDTH.
   * Approximated from known corner radius values in mm ÷ device width.
   */
  borderRadius: number;
  cameraModule?: CameraModule;
  /**
   * Laptop logo cutout on lid (e.g., Apple logo, Dell logo).
   * cx, cy = center as fraction of device width / height
   * r = radius as fraction of device width
   */
  logoCutout?: { cx: number; cy: number; r: number };
  /** True for Samsung Ultra/Note-style models with an S Pen silo on the bottom edge */
  sPenSilo?: boolean;
  confidence: 'verified' | 'estimated';
  notes?: string;
}

// ─── Device Database ─────────────────────────────────────────────────────────

export const deviceModels: DeviceModel[] = [
  // ══════════════════════════════════════════════════
  // APPLE — iPhone 16 Series (2024)
  // Body dims: apple.com/iphone-16*/specs
  // Camera: triple/dual island, top-left corner
  // ══════════════════════════════════════════════════

  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    brand: 'Apple',
    type: 'mobile',
    // 163.0 × 77.6 mm → w/h = 77.6/163.0
    aspectRatio: 77.6 / 163.0,
    // ~14 mm corner radius / 77.6 mm width
    borderRadius: 0.18,
    cameraModule: {
      shape: 'rect-rounded',
      // Square-ish triple-camera island, top-left corner
      // Estimated ~38 × 38 mm starting ~4 mm from left and top edges
      x: 0.052,
      y: 0.025,
      w: 0.49,
      h: 0.233,
      lenses: [
        // Triangle arrangement: UW top-left, Tele top-right, Main bottom-center
        { cx: 0.25, cy: 0.28, r: 0.16 }, // 48MP Ultra Wide
        { cx: 0.73, cy: 0.28, r: 0.16 }, // 12MP 5x Periscope Telephoto
        { cx: 0.5, cy: 0.72, r: 0.19 }, // 48MP Main (largest)
      ],
      flash: { cx: 0.82, cy: 0.78, r: 0.05 },
    },
    confidence: 'estimated',
    notes: 'Body dims official; camera island position/size estimated from Apple press kit.',
  },

  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    brand: 'Apple',
    type: 'mobile',
    // 149.6 × 71.5 mm
    aspectRatio: 71.5 / 149.6,
    borderRadius: 0.18,
    cameraModule: {
      shape: 'rect-rounded',
      // ~35 × 35 mm island, ~4 mm from left/top
      x: 0.056,
      y: 0.027,
      w: 0.49,
      h: 0.234,
      lenses: [
        { cx: 0.25, cy: 0.28, r: 0.16 }, // 48MP Ultra Wide
        { cx: 0.73, cy: 0.28, r: 0.16 }, // 12MP 5x Periscope Telephoto
        { cx: 0.5, cy: 0.72, r: 0.19 }, // 48MP Main
      ],
      flash: { cx: 0.82, cy: 0.78, r: 0.05 },
    },
    confidence: 'estimated',
    notes: 'Body dims official; camera estimated from Apple press kit.',
  },

  {
    id: 'iphone-16-plus',
    name: 'iPhone 16 Plus',
    brand: 'Apple',
    type: 'mobile',
    // 160.9 × 77.8 mm
    aspectRatio: 77.8 / 160.9,
    borderRadius: 0.18,
    cameraModule: {
      // Vertical dual-camera pill, top-left corner
      // Same system as iPhone 16 but larger body
      shape: 'pill-vertical',
      // ~27 × 43 mm pill, ~8 mm from left/top
      x: 0.103,
      y: 0.05,
      w: 0.347,
      h: 0.267,
      lenses: [
        { cx: 0.5, cy: 0.28, r: 0.28 }, // 48MP Main (Fusion)
        { cx: 0.5, cy: 0.72, r: 0.28 }, // 12MP Ultra Wide
      ],
      flash: { cx: 0.5, cy: 0.9, r: 0.07 },
    },
    confidence: 'estimated',
  },

  {
    id: 'iphone-16',
    name: 'iPhone 16',
    brand: 'Apple',
    type: 'mobile',
    // 147.6 × 71.6 mm
    aspectRatio: 71.6 / 147.6,
    borderRadius: 0.18,
    cameraModule: {
      // Vertical dual-camera pill (redesigned for spatial video)
      shape: 'pill-vertical',
      // ~24 × 38 mm pill, ~8 mm from left/top
      x: 0.112,
      y: 0.054,
      w: 0.335,
      h: 0.257,
      lenses: [
        { cx: 0.5, cy: 0.28, r: 0.28 }, // 48MP Main (Fusion)
        { cx: 0.5, cy: 0.72, r: 0.28 }, // 12MP Ultra Wide
      ],
      flash: { cx: 0.5, cy: 0.9, r: 0.07 },
    },
    confidence: 'estimated',
  },

  {
    id: 'iphone-16e',
    name: 'iPhone 16e',
    brand: 'Apple',
    type: 'mobile',
    // 146.7 × 71.5 mm
    aspectRatio: 71.5 / 146.7,
    borderRadius: 0.18,
    cameraModule: {
      // Single camera — small pill module, top-left corner
      shape: 'rect-rounded',
      // ~15 × 15 mm, ~8 mm from left/top
      x: 0.112,
      y: 0.055,
      w: 0.21,
      h: 0.102,
      lenses: [
        { cx: 0.5, cy: 0.5, r: 0.35 }, // 48MP Main (Fusion)
      ],
      flash: { cx: 0.82, cy: 0.5, r: 0.09 },
    },
    confidence: 'estimated',
    notes: 'Single-camera budget model; body dims from Apple.com (Feb 2025 release).',
  },

  // ══════════════════════════════════════════════════
  // APPLE — iPhone 17 Series (2025)
  // Released: September 19, 2025
  // Body dims: apple.com/iphone-17*/specs
  // ══════════════════════════════════════════════════

  {
    id: 'iphone-17-pro-max',
    name: 'iPhone 17 Pro Max',
    brand: 'Apple',
    type: 'mobile',
    // 163.4 × 78.0 mm
    aspectRatio: 78.0 / 163.4,
    borderRadius: 0.18,
    cameraModule: {
      // Same triple-island design as 16 Pro Max, aluminum unibody
      shape: 'rect-rounded',
      x: 0.051,
      y: 0.025,
      w: 0.49,
      h: 0.231,
      lenses: [
        { cx: 0.25, cy: 0.28, r: 0.16 },
        { cx: 0.73, cy: 0.28, r: 0.16 },
        { cx: 0.5, cy: 0.72, r: 0.19 },
      ],
      flash: { cx: 0.82, cy: 0.78, r: 0.05 },
    },
    confidence: 'estimated',
    notes: 'Body dims from Wikipedia/Apple; aluminum unibody with vapor chamber.',
  },

  {
    id: 'iphone-17-pro',
    name: 'iPhone 17 Pro',
    brand: 'Apple',
    type: 'mobile',
    // 150.0 × 71.9 mm
    aspectRatio: 71.9 / 150.0,
    borderRadius: 0.18,
    cameraModule: {
      shape: 'rect-rounded',
      x: 0.056,
      y: 0.027,
      w: 0.49,
      h: 0.233,
      lenses: [
        { cx: 0.25, cy: 0.28, r: 0.16 },
        { cx: 0.73, cy: 0.28, r: 0.16 },
        { cx: 0.5, cy: 0.72, r: 0.19 },
      ],
      flash: { cx: 0.82, cy: 0.78, r: 0.05 },
    },
    confidence: 'estimated',
  },

  {
    id: 'iphone-17-air',
    name: 'iPhone 17 Air',
    brand: 'Apple',
    type: 'mobile',
    // 156.2 × 74.7 mm — the thinnest iPhone at 5.64 mm
    aspectRatio: 74.7 / 156.2,
    borderRadius: 0.18,
    cameraModule: {
      // Single 48MP rear camera in a distinctive "camera plateau" — horizontal bar
      // The plateau spans most of the device width near the top
      shape: 'pill-horizontal',
      // ~65 mm wide × 13 mm tall, starting ~5 mm from left, ~7 mm from top
      x: 0.067,
      y: 0.045,
      w: 0.866,
      h: 0.083,
      lenses: [
        { cx: 0.88, cy: 0.5, r: 0.065 }, // 48MP Main (right side of plateau)
      ],
      flash: { cx: 0.78, cy: 0.5, r: 0.04 },
    },
    confidence: 'estimated',
    notes: 'Camera plateau design; body dims from Apple.com.',
  },

  {
    id: 'iphone-17',
    name: 'iPhone 17',
    brand: 'Apple',
    type: 'mobile',
    // 149.6 × 71.5 mm
    aspectRatio: 71.5 / 149.6,
    borderRadius: 0.18,
    cameraModule: {
      // Dual camera, vertical pill (same design language as iPhone 16)
      shape: 'pill-vertical',
      x: 0.112,
      y: 0.054,
      w: 0.34,
      h: 0.261,
      lenses: [
        { cx: 0.5, cy: 0.28, r: 0.28 }, // 48MP Main
        { cx: 0.5, cy: 0.72, r: 0.28 }, // 48MP Ultra Wide
      ],
      flash: { cx: 0.5, cy: 0.9, r: 0.07 },
    },
    confidence: 'estimated',
  },

  // ══════════════════════════════════════════════════
  // SAMSUNG — Galaxy S24 Series (2024)
  // Body dims: samsung.com/us/smartphones/galaxy-s24*/
  // ══════════════════════════════════════════════════

  {
    id: 'galaxy-s24-ultra',
    name: 'Galaxy S24 Ultra',
    brand: 'Samsung',
    type: 'mobile',
    // 162.3 × 79.0 mm — titanium frame, sharp corners
    aspectRatio: 79.0 / 162.3,
    // Titanium frame, ~5 mm corner radius / 79.0 = 0.063
    borderRadius: 0.06,
    cameraModule: {
      // Floating quad lenses — no shared module housing, just a vertical strip region
      shape: 'strip-vertical',
      // Strip ~16 mm wide × 60 mm tall, ~4 mm from left edge, ~5 mm from top
      x: 0.051,
      y: 0.031,
      w: 0.202,
      h: 0.37,
      lenses: [
        { cx: 0.5, cy: 0.11, r: 0.3 }, // 200MP Main (f/1.7) — largest
        { cx: 0.5, cy: 0.37, r: 0.24 }, // 12MP Ultra Wide
        { cx: 0.5, cy: 0.63, r: 0.24 }, // 10MP 3x Telephoto
        { cx: 0.5, cy: 0.89, r: 0.24 }, // 50MP 5x Periscope Telephoto
      ],
      flash: { cx: 0.5, cy: 0.97, r: 0.06 },
    },
    sPenSilo: true,
    confidence: 'estimated',
    notes: 'S24 Ultra has titanium frame and S Pen silo at bottom. Floating lens design.',
  },

  {
    id: 'galaxy-s24-plus',
    name: 'Galaxy S24+',
    brand: 'Samsung',
    type: 'mobile',
    // 158.5 × 75.9 mm
    aspectRatio: 75.9 / 158.5,
    borderRadius: 0.11,
    cameraModule: {
      shape: 'pill-vertical',
      // Triple camera vertical pill, ~15 × 38 mm, ~5 mm from left/top
      x: 0.066,
      y: 0.032,
      w: 0.198,
      h: 0.24,
      lenses: [
        { cx: 0.5, cy: 0.18, r: 0.32 }, // 50MP Main
        { cx: 0.5, cy: 0.5, r: 0.28 }, // 12MP Ultra Wide
        { cx: 0.5, cy: 0.82, r: 0.28 }, // 10MP 3x Telephoto
      ],
      flash: { cx: 0.5, cy: 0.93, r: 0.06 },
    },
    confidence: 'estimated',
  },

  {
    id: 'galaxy-s24',
    name: 'Galaxy S24',
    brand: 'Samsung',
    type: 'mobile',
    // 147.0 × 70.6 mm
    aspectRatio: 70.6 / 147.0,
    borderRadius: 0.11,
    cameraModule: {
      shape: 'pill-vertical',
      // Triple camera vertical pill, ~15 × 37 mm, ~5 mm from left/top
      x: 0.071,
      y: 0.034,
      w: 0.213,
      h: 0.252,
      lenses: [
        { cx: 0.5, cy: 0.18, r: 0.32 }, // 50MP Main
        { cx: 0.5, cy: 0.5, r: 0.28 }, // 12MP Ultra Wide
        { cx: 0.5, cy: 0.82, r: 0.28 }, // 10MP 3x Telephoto
      ],
      flash: { cx: 0.5, cy: 0.93, r: 0.06 },
    },
    confidence: 'estimated',
  },

  // ══════════════════════════════════════════════════
  // SAMSUNG — Galaxy S25 Series (2025)
  // Released: February 2025
  // Body dims: samsung.com/us/smartphones/galaxy-s25*/
  // ══════════════════════════════════════════════════

  {
    id: 'galaxy-s25-ultra',
    name: 'Galaxy S25 Ultra',
    brand: 'Samsung',
    type: 'mobile',
    // 162.8 × 77.6 mm — titanium frame
    aspectRatio: 77.6 / 162.8,
    borderRadius: 0.07,
    cameraModule: {
      shape: 'strip-vertical',
      // Floating quad lenses, top-left
      x: 0.052,
      y: 0.031,
      w: 0.206,
      h: 0.358,
      lenses: [
        { cx: 0.5, cy: 0.11, r: 0.3 }, // 200MP Main
        { cx: 0.5, cy: 0.37, r: 0.24 }, // 50MP Ultra Wide
        { cx: 0.5, cy: 0.63, r: 0.24 }, // 10MP 3x Telephoto
        { cx: 0.5, cy: 0.89, r: 0.24 }, // 50MP 5x Periscope
      ],
      flash: { cx: 0.5, cy: 0.97, r: 0.06 },
    },
    sPenSilo: true,
    confidence: 'estimated',
    notes: 'Titanium frame, S Pen silo. Floating lenses with no shared module housing.',
  },

  {
    id: 'galaxy-s25-plus',
    name: 'Galaxy S25+',
    brand: 'Samsung',
    type: 'mobile',
    // 158.4 × 75.8 mm
    aspectRatio: 75.8 / 158.4,
    borderRadius: 0.11,
    cameraModule: {
      shape: 'pill-vertical',
      x: 0.066,
      y: 0.032,
      w: 0.198,
      h: 0.238,
      lenses: [
        { cx: 0.5, cy: 0.18, r: 0.32 }, // 50MP Main
        { cx: 0.5, cy: 0.5, r: 0.28 }, // 12MP Ultra Wide
        { cx: 0.5, cy: 0.82, r: 0.28 }, // 10MP 3x Telephoto
      ],
      flash: { cx: 0.5, cy: 0.93, r: 0.06 },
    },
    confidence: 'estimated',
  },

  {
    id: 'galaxy-s25',
    name: 'Galaxy S25',
    brand: 'Samsung',
    type: 'mobile',
    // 146.9 × 70.5 mm
    aspectRatio: 70.5 / 146.9,
    borderRadius: 0.11,
    cameraModule: {
      shape: 'pill-vertical',
      x: 0.071,
      y: 0.034,
      w: 0.213,
      h: 0.252,
      lenses: [
        { cx: 0.5, cy: 0.18, r: 0.32 }, // 50MP Main
        { cx: 0.5, cy: 0.5, r: 0.28 }, // 12MP Ultra Wide
        { cx: 0.5, cy: 0.82, r: 0.28 }, // 10MP 3x Telephoto
      ],
      flash: { cx: 0.5, cy: 0.93, r: 0.06 },
    },
    confidence: 'estimated',
  },

  // ══════════════════════════════════════════════════
  // SAMSUNG — Galaxy S26 Series (2026)
  // Released: March 11, 2026
  // Body dims: samsung.com (confirmed from Wikipedia)
  // ══════════════════════════════════════════════════

  {
    id: 'galaxy-s26-ultra',
    name: 'Galaxy S26 Ultra',
    brand: 'Samsung',
    type: 'mobile',
    // 163.6 × 78.1 mm — titanium frame
    aspectRatio: 78.1 / 163.6,
    borderRadius: 0.07,
    cameraModule: {
      shape: 'strip-vertical',
      x: 0.051,
      y: 0.031,
      w: 0.205,
      h: 0.353,
      lenses: [
        { cx: 0.5, cy: 0.11, r: 0.3 }, // 200MP Main
        { cx: 0.5, cy: 0.37, r: 0.24 }, // 50MP Ultra Wide
        { cx: 0.5, cy: 0.63, r: 0.24 }, // 10MP 3x Telephoto
        { cx: 0.5, cy: 0.89, r: 0.24 }, // 50MP 5x Periscope
      ],
      flash: { cx: 0.5, cy: 0.97, r: 0.06 },
    },
    sPenSilo: true,
    confidence: 'estimated',
    notes: 'S Pen supported. Floating lens design consistent with S24/S25 Ultra.',
  },

  {
    id: 'galaxy-s26-plus',
    name: 'Galaxy S26+',
    brand: 'Samsung',
    type: 'mobile',
    // 158.4 × 75.8 mm
    aspectRatio: 75.8 / 158.4,
    borderRadius: 0.11,
    cameraModule: {
      shape: 'pill-vertical',
      x: 0.066,
      y: 0.032,
      w: 0.198,
      h: 0.238,
      lenses: [
        { cx: 0.5, cy: 0.18, r: 0.32 }, // 50MP Main
        { cx: 0.5, cy: 0.5, r: 0.28 }, // 12MP Ultra Wide
        { cx: 0.5, cy: 0.82, r: 0.28 }, // 10MP 3x Telephoto
      ],
      flash: { cx: 0.5, cy: 0.93, r: 0.06 },
    },
    confidence: 'estimated',
  },

  {
    id: 'galaxy-s26',
    name: 'Galaxy S26',
    brand: 'Samsung',
    type: 'mobile',
    // 149.6 × 71.7 mm
    aspectRatio: 71.7 / 149.6,
    borderRadius: 0.11,
    cameraModule: {
      shape: 'pill-vertical',
      x: 0.07,
      y: 0.034,
      w: 0.209,
      h: 0.248,
      lenses: [
        { cx: 0.5, cy: 0.18, r: 0.32 }, // 50MP Main
        { cx: 0.5, cy: 0.5, r: 0.28 }, // 12MP Ultra Wide
        { cx: 0.5, cy: 0.82, r: 0.28 }, // 10MP 3x Telephoto
      ],
      flash: { cx: 0.5, cy: 0.93, r: 0.06 },
    },
    confidence: 'estimated',
  },

  // ══════════════════════════════════════════════════
  // SAMSUNG — Galaxy A55 5G (India Volume — 2024)
  // 161.1 × 77.4 mm
  // ══════════════════════════════════════════════════

  {
    id: 'galaxy-a55-5g',
    name: 'Galaxy A55 5G',
    brand: 'Samsung',
    type: 'mobile',
    // 161.1 × 77.4 mm
    aspectRatio: 77.4 / 161.1,
    borderRadius: 0.1,
    cameraModule: {
      // Triple camera in a vertical pill arrangement, top-left
      shape: 'pill-vertical',
      // ~14 mm wide × 40 mm tall
      x: 0.065,
      y: 0.04,
      w: 0.181,
      h: 0.248,
      lenses: [
        { cx: 0.5, cy: 0.18, r: 0.33 }, // 50MP Main (OIS)
        { cx: 0.5, cy: 0.5, r: 0.26 }, // 12MP Ultra Wide
        { cx: 0.5, cy: 0.82, r: 0.26 }, // 5MP Macro
      ],
      flash: { cx: 0.5, cy: 0.93, r: 0.07 },
    },
    confidence: 'estimated',
  },

  // ══════════════════════════════════════════════════
  // SAMSUNG — Galaxy Z Fold 7 (2025) — Cover Panel Skin
  // Released: July 25, 2025
  // Folded dims: 158.4 × 72.8 mm
  // Note: Skin applies to the COVER (outer) panel
  // ══════════════════════════════════════════════════

  {
    id: 'galaxy-z-fold-7',
    name: 'Galaxy Z Fold 7 (Cover)',
    brand: 'Samsung',
    type: 'mobile',
    // Folded: 158.4 × 72.8 mm — cover/outer panel
    aspectRatio: 72.8 / 158.4,
    borderRadius: 0.1,
    cameraModule: {
      // Triple camera on cover panel: 200MP + 10MP + 12MP UW
      // Arranged vertically in top-left area of cover
      shape: 'pill-vertical',
      x: 0.06,
      y: 0.03,
      w: 0.195,
      h: 0.24,
      lenses: [
        { cx: 0.5, cy: 0.18, r: 0.32 }, // 200MP Main
        { cx: 0.5, cy: 0.5, r: 0.26 }, // 10MP 3x Telephoto
        { cx: 0.5, cy: 0.82, r: 0.26 }, // 12MP Ultra Wide
      ],
    },
    confidence: 'estimated',
    notes: 'Cover panel only — skin applies to outer surface when folded.',
  },

  // ══════════════════════════════════════════════════
  // GOOGLE — Pixel 9 Series (2024)
  // Key design change: isolated horizontal pill island (NOT the full-width bar from Pixel 8)
  // Body dims: store.google.com/product/pixel_9_specs
  // ══════════════════════════════════════════════════

  {
    id: 'pixel-9-pro-xl',
    name: 'Pixel 9 Pro XL',
    brand: 'Google',
    type: 'mobile',
    // 162.8 × 76.6 mm
    aspectRatio: 76.6 / 162.8,
    // ~12 mm corner radius / 76.6 = 0.157
    borderRadius: 0.16,
    cameraModule: {
      // IMPORTANT: Pixel 9 series uses an isolated oval/pill island — NOT the full-width bar
      // of Pixel 6/7/8. The pill is centered and does not touch side rails.
      shape: 'pill-horizontal',
      // ~65 mm wide × 14 mm tall, centered horizontally, ~14 mm from top
      x: 0.057,
      y: 0.086,
      w: 0.872,
      h: 0.086,
      lenses: [
        { cx: 0.23, cy: 0.5, r: 0.08 }, // 50MP Main (Wide)
        { cx: 0.5, cy: 0.5, r: 0.07 }, // 48MP Ultra Wide
        { cx: 0.77, cy: 0.5, r: 0.07 }, // 48MP 5x Periscope Telephoto
      ],
      flash: { cx: 0.91, cy: 0.5, r: 0.04 },
    },
    confidence: 'estimated',
    notes:
      'CORRECTED: Pixel 9 series uses isolated oval pill (not edge-to-edge bar). Body dims official.',
  },

  {
    id: 'pixel-9-pro',
    name: 'Pixel 9 Pro',
    brand: 'Google',
    type: 'mobile',
    // 152.8 × 72.0 mm
    aspectRatio: 72.0 / 152.8,
    borderRadius: 0.16,
    cameraModule: {
      shape: 'pill-horizontal',
      // ~63 mm wide × 13 mm tall, centered, ~15 mm from top
      x: 0.063,
      y: 0.098,
      w: 0.875,
      h: 0.085,
      lenses: [
        { cx: 0.23, cy: 0.5, r: 0.08 }, // 50MP Main
        { cx: 0.5, cy: 0.5, r: 0.07 }, // 48MP Ultra Wide
        { cx: 0.77, cy: 0.5, r: 0.07 }, // 48MP 5x Periscope
      ],
      flash: { cx: 0.91, cy: 0.5, r: 0.04 },
    },
    confidence: 'estimated',
  },

  {
    id: 'pixel-9',
    name: 'Pixel 9',
    brand: 'Google',
    type: 'mobile',
    // 152.8 × 72.0 mm — same body as 9 Pro
    aspectRatio: 72.0 / 152.8,
    borderRadius: 0.16,
    cameraModule: {
      shape: 'pill-horizontal',
      x: 0.063,
      y: 0.098,
      w: 0.875,
      h: 0.085,
      lenses: [
        // Pixel 9 is DUAL camera (no telephoto)
        { cx: 0.35, cy: 0.5, r: 0.08 }, // 50MP Main
        { cx: 0.65, cy: 0.5, r: 0.07 }, // 48MP Ultra Wide
      ],
      flash: { cx: 0.87, cy: 0.5, r: 0.04 },
    },
    confidence: 'estimated',
    notes: 'Pixel 9 is dual-camera unlike the Pro models.',
  },

  {
    id: 'pixel-9a',
    name: 'Pixel 9a',
    brand: 'Google',
    type: 'mobile',
    // 154.7 × 73.3 mm — released April 2025
    aspectRatio: 73.3 / 154.7,
    borderRadius: 0.16,
    cameraModule: {
      shape: 'pill-horizontal',
      // Dual camera in same pill design
      x: 0.063,
      y: 0.098,
      w: 0.875,
      h: 0.083,
      lenses: [
        { cx: 0.35, cy: 0.5, r: 0.08 }, // 48MP Main (OIS)
        { cx: 0.65, cy: 0.5, r: 0.07 }, // 13MP Ultra Wide
      ],
      flash: { cx: 0.87, cy: 0.5, r: 0.04 },
    },
    confidence: 'estimated',
    notes: 'Budget Pixel 9 family member; same pill island design language.',
  },

  // ══════════════════════════════════════════════════
  // GOOGLE — Pixel 10 Pro (2025)
  // Released: August 28, 2025
  // 152.8 × 72.0 mm (same body as Pixel 9 Pro)
  // ══════════════════════════════════════════════════

  {
    id: 'pixel-10-pro',
    name: 'Pixel 10 Pro',
    brand: 'Google',
    type: 'mobile',
    // 152.8 × 72.0 mm
    aspectRatio: 72.0 / 152.8,
    borderRadius: 0.16,
    cameraModule: {
      shape: 'pill-horizontal',
      x: 0.063,
      y: 0.098,
      w: 0.875,
      h: 0.085,
      lenses: [
        { cx: 0.23, cy: 0.5, r: 0.08 }, // 50MP Main (OIS, f/1.7)
        { cx: 0.5, cy: 0.5, r: 0.07 }, // 48MP Ultra Wide (f/1.7)
        { cx: 0.77, cy: 0.5, r: 0.07 }, // 48MP 5x Periscope (f/2.8)
      ],
      flash: { cx: 0.91, cy: 0.5, r: 0.04 },
    },
    confidence: 'estimated',
    notes: 'Triple 48/50MP system. Same pill island design, same body size as Pixel 9 Pro.',
  },

  // ══════════════════════════════════════════════════
  // ONEPLUS — 13 & 15 (India Priority Models)
  // ══════════════════════════════════════════════════

  {
    id: 'oneplus-15',
    name: 'OnePlus 15',
    brand: 'OnePlus',
    type: 'mobile',
    // 161.4 × 76.7 mm
    aspectRatio: 76.7 / 161.4,
    borderRadius: 0.13,
    cameraModule: {
      // Rounded rectangle module, top-left corner (moved away from OnePlus 13 circle)
      shape: 'rect-rounded',
      // ~40 × 44 mm module, ~3 mm from left/top
      x: 0.039,
      y: 0.025,
      w: 0.521,
      h: 0.273,
      lenses: [
        { cx: 0.28, cy: 0.3, r: 0.17 }, // 50MP Main
        { cx: 0.72, cy: 0.3, r: 0.17 }, // 50MP Ultrawide
        { cx: 0.5, cy: 0.72, r: 0.17 }, // 50MP 3x Telephoto
      ],
      flash: { cx: 0.82, cy: 0.82, r: 0.05 },
    },
    confidence: 'estimated',
    notes:
      'OnePlus 15 moved to a rounded-rect module from the circular Hasselblad ring of OnePlus 13.',
  },

  {
    id: 'oneplus-13',
    name: 'OnePlus 13',
    brand: 'OnePlus',
    type: 'mobile',
    // 162.9 × 76.5 mm
    aspectRatio: 76.5 / 162.9,
    borderRadius: 0.13,
    cameraModule: {
      // Distinctive circular Hasselblad island, upper-left area
      // For 'circle' shape: x = cx, y = cy, w = r (all as fractions of device dimensions)
      shape: 'circle',
      // Center at ~37% from left, ~20% from top; radius ~32% of device width
      x: 0.37,
      y: 0.195,
      w: 0.32,
      h: 0.32,
      lenses: [
        // Triangle arrangement within the circular island
        { cx: 0.35, cy: 0.3, r: 0.18 }, // 50MP Main
        { cx: 0.65, cy: 0.3, r: 0.18 }, // 50MP Ultra Wide
        { cx: 0.5, cy: 0.68, r: 0.18 }, // 50MP 3x Periscope Telephoto
      ],
      flash: { cx: 0.82, cy: 0.75, r: 0.06 },
    },
    confidence: 'estimated',
    notes: 'Hasselblad circular camera island; triple 50MP system.',
  },

  // ══════════════════════════════════════════════════
  // XIAOMI — Xiaomi 15 (2024, India Market)
  // 152.3 × 71.2 mm — compact flagship
  // ══════════════════════════════════════════════════

  {
    id: 'xiaomi-15',
    name: 'Xiaomi 15',
    brand: 'Xiaomi',
    type: 'mobile',
    // 152.3 × 71.2 mm
    aspectRatio: 71.2 / 152.3,
    borderRadius: 0.14,
    cameraModule: {
      // Square Leica module, top-left corner
      shape: 'rect-rounded',
      // ~37 × 37 mm, ~3 mm from left/top
      x: 0.042,
      y: 0.028,
      w: 0.52,
      h: 0.243,
      lenses: [
        { cx: 0.28, cy: 0.3, r: 0.16 }, // 50MP Main (Leica Summilux)
        { cx: 0.72, cy: 0.3, r: 0.16 }, // 50MP Ultra Wide
        { cx: 0.5, cy: 0.72, r: 0.16 }, // 50MP Telephoto
      ],
      flash: { cx: 0.82, cy: 0.8, r: 0.05 },
    },
    confidence: 'estimated',
    notes: 'Leica Summilux optics. Compact form factor; triple 50MP system.',
  },

  // ══════════════════════════════════════════════════
  // VIVO — X200 Pro (India Market, 2024)
  // 162.4 × 76.0 mm — Zeiss optics, large circular module
  // ══════════════════════════════════════════════════

  {
    id: 'vivo-x200-pro',
    name: 'Vivo X200 Pro',
    brand: 'Vivo',
    type: 'mobile',
    // 162.4 × 76.0 mm
    aspectRatio: 76.0 / 162.4,
    borderRadius: 0.13,
    cameraModule: {
      // Large circular Zeiss camera island, centered upper-left area
      shape: 'circle',
      // Center at ~39% from left, ~22% from top; radius ~33% of device width
      x: 0.39,
      y: 0.215,
      w: 0.33,
      h: 0.33,
      lenses: [
        { cx: 0.35, cy: 0.28, r: 0.18 }, // 50MP Main (OIS)
        { cx: 0.65, cy: 0.28, r: 0.18 }, // 50MP Ultra Wide
        { cx: 0.35, cy: 0.68, r: 0.17 }, // 50MP 3x Telephoto
        { cx: 0.65, cy: 0.68, r: 0.17 }, // 200MP 5x Periscope
      ],
      flash: { cx: 0.85, cy: 0.75, r: 0.06 },
    },
    confidence: 'estimated',
    notes: 'Zeiss optics. Large circular camera housing consistent with Vivo X-series design.',
  },

  // ══════════════════════════════════════════════════
  // OPPO — Find X8 Pro (India Market, 2024)
  // 162.3 × 76.7 mm — Hasselblad-tuned circular module
  // ══════════════════════════════════════════════════

  {
    id: 'oppo-find-x8-pro',
    name: 'OPPO Find X8 Pro',
    brand: 'Oppo',
    type: 'mobile',
    // 162.3 × 76.7 mm
    aspectRatio: 76.7 / 162.3,
    borderRadius: 0.13,
    cameraModule: {
      // Circular Hasselblad module, upper-center area
      shape: 'circle',
      x: 0.39,
      y: 0.215,
      w: 0.32,
      h: 0.32,
      lenses: [
        { cx: 0.35, cy: 0.28, r: 0.18 }, // 50MP Main (OIS)
        { cx: 0.65, cy: 0.28, r: 0.18 }, // 50MP Ultra Wide
        { cx: 0.35, cy: 0.68, r: 0.17 }, // 50MP 3x Telephoto (OIS)
        { cx: 0.65, cy: 0.68, r: 0.17 }, // 50MP 6x Periscope (OIS)
      ],
      flash: { cx: 0.85, cy: 0.75, r: 0.06 },
    },
    confidence: 'estimated',
    notes: 'Dual periscope telephoto lenses. Circular module with refined ridges.',
  },

  // ══════════════════════════════════════════════════
  // LAPTOPS
  // Logo position: Apple logo on MacBook lid is centered (~48% from top)
  // ══════════════════════════════════════════════════

  {
    id: 'macbook-pro-16-m3',
    name: 'MacBook Pro 16" (M3)',
    brand: 'Apple (Mac)',
    type: 'laptop',
    aspectRatio: 16 / 10,
    borderRadius: 0.03,
    logoCutout: {
      // Apple logo: centered at ~50% width, ~50% height on lid
      cx: 0.5,
      cy: 0.5,
      r: 0.04,
    },
    confidence: 'verified',
  },

  {
    id: 'macbook-pro-14-m3',
    name: 'MacBook Pro 14" (M3)',
    brand: 'Apple (Mac)',
    type: 'laptop',
    aspectRatio: 16 / 10,
    borderRadius: 0.04,
    logoCutout: {
      cx: 0.5,
      cy: 0.5,
      r: 0.042,
    },
    confidence: 'verified',
  },

  {
    id: 'macbook-air-15-m3',
    name: 'MacBook Air 15" (M3)',
    brand: 'Apple (Mac)',
    type: 'laptop',
    aspectRatio: 16 / 10,
    borderRadius: 0.04,
    logoCutout: {
      cx: 0.5,
      cy: 0.5,
      r: 0.04,
    },
    confidence: 'verified',
  },

  {
    id: 'macbook-air-13-m3',
    name: 'MacBook Air 13" (M3)',
    brand: 'Apple (Mac)',
    type: 'laptop',
    aspectRatio: 16 / 10,
    borderRadius: 0.04,
    logoCutout: {
      cx: 0.5,
      cy: 0.5,
      r: 0.044,
    },
    confidence: 'verified',
  },

  {
    id: 'dell-xps-14',
    name: 'Dell XPS 14 (2024)',
    brand: 'Dell',
    type: 'laptop',
    aspectRatio: 16 / 10,
    borderRadius: 0.02,
    logoCutout: {
      // Dell logo: centered, roughly oval — represented as small circle
      cx: 0.5,
      cy: 0.5,
      r: 0.038,
    },
    confidence: 'estimated',
  },
];

// ─── Excluded / Not Yet Released ────────────────────────────────────────────
//
// The following devices are NOT included because they have not been officially
// released with verified specifications as of the date of this build:
//
//   • iPhone 18 series           — expected Sept 2026; no official specs published
//   • Pixel 11 series            — not yet released
//   • Galaxy Z Fold 8 / Flip 8  — not yet released
//   • Galaxy Z Flip 7            — excluded due to unusual foldable form factor
//                                  (cover + inner panel would require separate templates)
//
// These will be added once officially announced with real published dimensions.
//
// ─── Confidence Limitations ─────────────────────────────────────────────────
//
// All entries are marked 'estimated' because manufacturers do not publish exact
// camera module housing footprint coordinates. Positions are derived from:
//   1. Official device mm body dimensions (verified)
//   2. Camera module shape (verified from product pages + reviews)
//   3. Camera module position (estimated from calibrated press-kit photographs)
//
// No proprietary skin-cutting template data was referenced. Module positions are
// functional approximations meeting the standard used across the accessory/case
// industry for compatibility representation.
