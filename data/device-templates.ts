export type SourceTier =
  'official-design-guideline' | 'teardown-corroborated' | 'single-source-low-confidence';

export interface MeasurementSource {
  url: string;
  retrievedDate: string;
  tier?: SourceTier; // made optional for dimensions which might just be standard sources
  note?: string;
}

export interface DeviceCutout {
  id: string; // e.g. 'camera-module', 'mic-hole', 'logo-window', 'speaker-grille'
  path: string; // SVG path data, in the same coordinate space as the panel outline
  label: string; // for admin/debug overlay only, not shown to customer
  sources: MeasurementSource[];
  confidenceTier: SourceTier; // lowest tier among its sources
  physicallyVerified: boolean; // false until spot-checked against the real device
}

export interface DevicePanel {
  panelId: 'phone-back' | 'laptop-lid';
  outlinePath: string; // SVG path — the exact physical silhouette of this panel, corner radius included
  cutouts: DeviceCutout[];
  printAreaBounds: { width: number; height: number }; // real-world mm, for DPI calc on export
}

export interface DeviceDimensions {
  heightMm: number;
  widthMm: number;
  thicknessMm: number;
  weightG?: number;
  sources: MeasurementSource[];
  conflicting?: boolean;
}

export interface DeviceTemplate {
  id: string; // Unique identifier for the template
  deviceType: 'phone' | 'laptop';
  brand: string;
  model: string;
  variant: string; // e.g. storage/camera config that changes cutout layout
  panels: DevicePanel[];
  sourceVerified: boolean; // true only after physical measurement/verification, never default true
  dimensions?: DeviceDimensions;
}

// ── Placeholder Templates ──
// These are unverified SVG paths used ONLY for building the engine until actual templates are sourced.
// All templates MUST remain `sourceVerified: false`.

export const deviceTemplates: DeviceTemplate[] = [
  {
    id: 'iphone-15-pro-base',
    deviceType: 'phone',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    variant: 'Standard',
    sourceVerified: false,
    dimensions: {
      heightMm: 146.6,
      widthMm: 70.6,
      thicknessMm: 8.25,
      weightG: 187,
      conflicting: false,
      sources: [
        {
          url: 'https://www.apple.com/iphone-15-pro/specs/',
          retrievedDate: '2026-08-05T07:00:00Z',
          note: 'Official spec sheet: 146.6 x 70.6 x 8.25 mm. Weight 187g.',
        },
        {
          url: 'https://www.gsmarena.com/apple_iphone_15_pro-12557.php',
          retrievedDate: '2026-08-05T07:00:12Z',
          note: 'GSMArena: 146.6 x 70.6 x 8.3 mm. Rounded to 1 decimal place, matches Apple spec.',
        },
      ],
    },
    panels: [
      {
        panelId: 'phone-back',
        // Example: A generic rounded rectangle path for the phone back (width: 70.6mm, height: 146.6mm scaled to some coordinate space)
        // 0,0 top-left, drawing a rounded rect
        outlinePath:
          'M 10 0 L 60 0 Q 70 0 70 10 L 70 136 Q 70 146 60 146 L 10 146 Q 0 146 0 136 L 0 10 Q 0 0 10 0 Z',
        printAreaBounds: { width: 70.6, height: 146.6 },
        cutouts: [
          {
            id: 'camera-module',
            label: 'Main Camera Array',
            // Example: A generic rounded rectangle for the top-left camera bump
            path: 'M 5 5 L 25 5 Q 30 5 30 10 L 30 30 Q 30 35 25 35 L 5 35 Q 0 35 0 30 L 0 10 Q 0 5 5 5 Z',
            sources: [
              {
                url: 'https://developer.apple.com/accessories/dimensional-drawings/',
                retrievedDate: '2026-08-05T07:10:15Z',
                tier: 'official-design-guideline',
                note: 'Apple MFi Accessory Design Guidelines PDF contains exact camera module bounding boxes. (Pending physical coordinate extraction to this SVG path)',
              },
            ],
            confidenceTier: 'official-design-guideline',
            physicallyVerified: false,
          },
        ],
      },
    ],
  },
  {
    id: 'macbook-pro-14-m3',
    deviceType: 'laptop',
    brand: 'Apple',
    model: 'MacBook Pro 14"',
    variant: 'M3 (2023)',
    sourceVerified: false,
    dimensions: {
      heightMm: 221.2,
      widthMm: 312.6,
      thicknessMm: 15.5,
      weightG: 1550,
      conflicting: false,
      sources: [
        {
          url: 'https://www.apple.com/macbook-pro/specs/',
          retrievedDate: '2026-08-05T07:00:24Z',
          note: 'Official Apple spec: Width 31.26 cm, Depth 22.12 cm, Height 1.55 cm. Apple lists Depth for height when closed, and Height for thickness.',
        },
        {
          url: 'https://www.notebookcheck.net/Apple-MacBook-Pro-14-2023-M3-Review-The-base-model-now-without-a-Pro-SoC.767909.0.html',
          retrievedDate: '2026-08-05T07:00:43Z',
          note: 'NotebookCheck matches exactly: 15.5 x 312.6 x 221.2 mm.',
        },
      ],
    },
    panels: [
      {
        panelId: 'laptop-lid',
        // Example: A large generic rounded rectangle path for the laptop lid (width: 312.6mm, height: 221.2mm)
        outlinePath:
          'M 15 0 L 297 0 Q 312 0 312 15 L 312 206 Q 312 221 297 221 L 15 221 Q 0 221 0 206 L 0 15 Q 0 0 15 0 Z',
        printAreaBounds: { width: 312.6, height: 221.2 },
        cutouts: [
          {
            id: 'apple-logo',
            label: 'Apple Logo Cutout',
            // Example: A simple placeholder circle for the logo in the center
            path: 'M 156 110 A 10 10 0 1 0 156 111 Z',
            sources: [
              {
                url: 'https://www.apple.com',
                retrievedDate: '2026-08-05T07:10:43Z',
                tier: 'single-source-low-confidence',
                note: 'Apple does not provide official logo hole CADs. Requires physical tracing/measurement.',
              },
            ],
            confidenceTier: 'single-source-low-confidence',
            physicallyVerified: false,
          },
        ],
      },
    ],
  },
];

// Helper functions for the UI
// In production, we strictly exclude any device templates that haven't been physically verified
const getActiveTemplates = () => {
  if (process.env.NODE_ENV === 'production') {
    return deviceTemplates.filter((t) => t.sourceVerified);
  }
  return deviceTemplates;
};

export function getUniqueBrands(deviceType: 'phone' | 'laptop'): string[] {
  const brands = getActiveTemplates()
    .filter((t) => t.deviceType === deviceType)
    .map((t) => t.brand);
  return Array.from(new Set(brands));
}

export function getModelsByBrand(brand: string): string[] {
  const models = getActiveTemplates()
    .filter((t) => t.brand === brand)
    .map((t) => t.model);
  return Array.from(new Set(models));
}

export function getVariantsByModel(model: string): DeviceTemplate[] {
  return getActiveTemplates().filter((t) => t.model === model);
}
