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

  // ── Nothing ──────────────────────────────────────────────────────────────
  // Source: GSMArena / official Nothing spec pages (Aug 2026)
  // Camera cutouts: pending physical dieline trace — cutouts: [] until verified
  {
    id: 'nothing-phone-1',
    deviceType: 'phone',
    brand: 'Nothing',
    model: 'Phone (1)',
    variant: 'Standard',
    sourceVerified: false,
    dimensions: { heightMm: 159.2, widthMm: 75.8, thicknessMm: 8.3, sources: [{ url: 'https://www.gsmarena.com/nothing_phone_(1)-11461.php', retrievedDate: '2026-08-07T00:00:00Z' }] },
    panels: [{ panelId: 'phone-back', outlinePath: 'M 10 0 L 65 0 Q 75 0 75 10 L 75 149 Q 75 159 65 159 L 10 159 Q 0 159 0 149 L 0 10 Q 0 0 10 0 Z', printAreaBounds: { width: 75.8, height: 159.2 }, cutouts: [] }],
  },
  {
    id: 'nothing-phone-2',
    deviceType: 'phone',
    brand: 'Nothing',
    model: 'Phone (2)',
    variant: 'Standard',
    sourceVerified: false,
    dimensions: { heightMm: 162.1, widthMm: 76.4, thicknessMm: 8.1, sources: [{ url: 'https://www.gsmarena.com/nothing_phone_(2)-12061.php', retrievedDate: '2026-08-07T00:00:00Z' }] },
    panels: [{ panelId: 'phone-back', outlinePath: 'M 10 0 L 66 0 Q 76 0 76 10 L 76 152 Q 76 162 66 162 L 10 162 Q 0 162 0 152 L 0 10 Q 0 0 10 0 Z', printAreaBounds: { width: 76.4, height: 162.1 }, cutouts: [] }],
  },
  {
    id: 'nothing-phone-2a',
    deviceType: 'phone',
    brand: 'Nothing',
    model: 'Phone (2a)',
    variant: 'Standard',
    sourceVerified: false,
    dimensions: { heightMm: 161.7, widthMm: 76.3, thicknessMm: 8.55, sources: [{ url: 'https://www.gsmarena.com/nothing_phone_(2a)-12305.php', retrievedDate: '2026-08-07T00:00:00Z' }] },
    panels: [{ panelId: 'phone-back', outlinePath: 'M 10 0 L 66 0 Q 76 0 76 10 L 76 151 Q 76 161 66 161 L 10 161 Q 0 161 0 151 L 0 10 Q 0 0 10 0 Z', printAreaBounds: { width: 76.3, height: 161.7 }, cutouts: [] }],
  },
  {
    id: 'nothing-phone-2a-plus',
    deviceType: 'phone',
    brand: 'Nothing',
    model: 'Phone (2a) Plus',
    variant: 'Standard',
    sourceVerified: false,
    dimensions: { heightMm: 161.74, widthMm: 76.32, thicknessMm: 8.55, sources: [{ url: 'https://www.gsmarena.com/nothing_phone_(2a)_plus-12490.php', retrievedDate: '2026-08-07T00:00:00Z' }] },
    panels: [{ panelId: 'phone-back', outlinePath: 'M 10 0 L 66 0 Q 76 0 76 10 L 76 151 Q 76 161 66 161 L 10 161 Q 0 161 0 151 L 0 10 Q 0 0 10 0 Z', printAreaBounds: { width: 76.32, height: 161.74 }, cutouts: [] }],
  },
  {
    id: 'nothing-phone-3a',
    deviceType: 'phone',
    brand: 'Nothing',
    model: 'Phone (3a)',
    variant: 'Standard',
    sourceVerified: false,
    dimensions: { heightMm: 163.5, widthMm: 77.5, thicknessMm: 8.4, sources: [{ url: 'https://www.gsmarena.com/nothing_phone_(3a)-12774.php', retrievedDate: '2026-08-07T00:00:00Z' }] },
    panels: [{ panelId: 'phone-back', outlinePath: 'M 10 0 L 67 0 Q 77 0 77 10 L 77 153 Q 77 163 67 163 L 10 163 Q 0 163 0 153 L 0 10 Q 0 0 10 0 Z', printAreaBounds: { width: 77.5, height: 163.5 }, cutouts: [] }],
  },

  // ── Redmi ─────────────────────────────────────────────────────────────────
  {
    id: 'redmi-note-13',
    deviceType: 'phone',
    brand: 'Redmi',
    model: 'Note 13',
    variant: '4G',
    sourceVerified: false,
    dimensions: { heightMm: 162.3, widthMm: 75.6, thicknessMm: 8.0, sources: [{ url: 'https://www.gsmarena.com/xiaomi_redmi_note_13-12247.php', retrievedDate: '2026-08-07T00:00:00Z' }] },
    panels: [{ panelId: 'phone-back', outlinePath: 'M 10 0 L 65 0 Q 75 0 75 10 L 75 152 Q 75 162 65 162 L 10 162 Q 0 162 0 152 L 0 10 Q 0 0 10 0 Z', printAreaBounds: { width: 75.6, height: 162.3 }, cutouts: [] }],
  },
  {
    id: 'redmi-note-13-pro-5g',
    deviceType: 'phone',
    brand: 'Redmi',
    model: 'Note 13 Pro 5G',
    variant: 'Standard',
    sourceVerified: false,
    dimensions: { heightMm: 161.2, widthMm: 74.2, thicknessMm: 8.0, sources: [{ url: 'https://www.gsmarena.com/xiaomi_redmi_note_13_pro+-12248.php', retrievedDate: '2026-08-07T00:00:00Z' }] },
    panels: [{ panelId: 'phone-back', outlinePath: 'M 10 0 L 64 0 Q 74 0 74 10 L 74 151 Q 74 161 64 161 L 10 161 Q 0 161 0 151 L 0 10 Q 0 0 10 0 Z', printAreaBounds: { width: 74.2, height: 161.2 }, cutouts: [] }],
  },
  {
    id: 'redmi-13c',
    deviceType: 'phone',
    brand: 'Redmi',
    model: '13C',
    variant: 'Standard',
    sourceVerified: false,
    dimensions: { heightMm: 168.0, widthMm: 78.0, thicknessMm: 8.09, sources: [{ url: 'https://www.gsmarena.com/xiaomi_redmi_13c-12215.php', retrievedDate: '2026-08-07T00:00:00Z' }] },
    panels: [{ panelId: 'phone-back', outlinePath: 'M 10 0 L 68 0 Q 78 0 78 10 L 78 158 Q 78 168 68 168 L 10 168 Q 0 168 0 158 L 0 10 Q 0 0 10 0 Z', printAreaBounds: { width: 78.0, height: 168.0 }, cutouts: [] }],
  },
  {
    id: 'redmi-note-14-5g',
    deviceType: 'phone',
    brand: 'Redmi',
    model: 'Note 14 5G',
    variant: 'India',
    sourceVerified: false,
    dimensions: { heightMm: 162.4, widthMm: 75.7, thicknessMm: 8.0, sources: [{ url: 'https://www.gsmarena.com/xiaomi_redmi_note_14-12596.php', retrievedDate: '2026-08-07T00:00:00Z' }] },
    panels: [{ panelId: 'phone-back', outlinePath: 'M 10 0 L 65 0 Q 75 0 75 10 L 75 152 Q 75 162 65 162 L 10 162 Q 0 162 0 152 L 0 10 Q 0 0 10 0 Z', printAreaBounds: { width: 75.7, height: 162.4 }, cutouts: [] }],
  },

  // ── Vivo ──────────────────────────────────────────────────────────────────
  {
    id: 'vivo-v40',
    deviceType: 'phone',
    brand: 'Vivo',
    model: 'V40',
    variant: 'Standard',
    sourceVerified: false,
    dimensions: { heightMm: 164.2, widthMm: 75.0, thicknessMm: 7.6, sources: [{ url: 'https://www.gsmarena.com/vivo_v40-12462.php', retrievedDate: '2026-08-07T00:00:00Z' }] },
    panels: [{ panelId: 'phone-back', outlinePath: 'M 10 0 L 65 0 Q 75 0 75 10 L 75 154 Q 75 164 65 164 L 10 164 Q 0 164 0 154 L 0 10 Q 0 0 10 0 Z', printAreaBounds: { width: 75.0, height: 164.2 }, cutouts: [] }],
  },
  {
    id: 'vivo-v40e',
    deviceType: 'phone',
    brand: 'Vivo',
    model: 'V40e',
    variant: 'Standard',
    sourceVerified: false,
    dimensions: { heightMm: 163.7, widthMm: 75.0, thicknessMm: 7.5, sources: [{ url: 'https://www.gsmarena.com/vivo_v40e-12566.php', retrievedDate: '2026-08-07T00:00:00Z' }] },
    panels: [{ panelId: 'phone-back', outlinePath: 'M 10 0 L 65 0 Q 75 0 75 10 L 75 153 Q 75 163 65 163 L 10 163 Q 0 163 0 153 L 0 10 Q 0 0 10 0 Z', printAreaBounds: { width: 75.0, height: 163.7 }, cutouts: [] }],
  },
  {
    id: 'vivo-v50',
    deviceType: 'phone',
    brand: 'Vivo',
    model: 'V50',
    variant: 'Standard',
    sourceVerified: false,
    dimensions: { heightMm: 163.29, widthMm: 76.72, thicknessMm: 7.39, sources: [{ url: 'https://www.gsmarena.com/vivo_v50-12697.php', retrievedDate: '2026-08-07T00:00:00Z' }] },
    panels: [{ panelId: 'phone-back', outlinePath: 'M 10 0 L 66 0 Q 76 0 76 10 L 76 153 Q 76 163 66 163 L 10 163 Q 0 163 0 153 L 0 10 Q 0 0 10 0 Z', printAreaBounds: { width: 76.72, height: 163.29 }, cutouts: [] }],
  },

  // ── Oppo ──────────────────────────────────────────────────────────────────
  {
    id: 'oppo-reno13',
    deviceType: 'phone',
    brand: 'Oppo',
    model: 'Reno 13',
    variant: 'India / Global',
    sourceVerified: false,
    dimensions: { heightMm: 157.9, widthMm: 74.7, thicknessMm: 7.2, sources: [{ url: 'https://www.gsmarena.com/oppo_reno13-12625.php', retrievedDate: '2026-08-07T00:00:00Z' }] },
    panels: [{ panelId: 'phone-back', outlinePath: 'M 10 0 L 64 0 Q 74 0 74 10 L 74 147 Q 74 157 64 157 L 10 157 Q 0 157 0 147 L 0 10 Q 0 0 10 0 Z', printAreaBounds: { width: 74.7, height: 157.9 }, cutouts: [] }],
  },
  {
    id: 'oppo-reno3-5g',
    deviceType: 'phone',
    brand: 'Oppo',
    model: 'Reno 3 5G',
    variant: 'Legacy',
    sourceVerified: false,
    dimensions: { heightMm: 160.3, widthMm: 74.3, thicknessMm: 8.0, sources: [{ url: 'https://www.gsmarena.com/oppo_reno3_5g-9957.php', retrievedDate: '2026-08-07T00:00:00Z' }] },
    panels: [{ panelId: 'phone-back', outlinePath: 'M 10 0 L 64 0 Q 74 0 74 10 L 74 150 Q 74 160 64 160 L 10 160 Q 0 160 0 150 L 0 10 Q 0 0 10 0 Z', printAreaBounds: { width: 74.3, height: 160.3 }, cutouts: [] }],
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
