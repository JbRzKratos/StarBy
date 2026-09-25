import * as fs from 'fs';
import * as path from 'path';
import { generateAllCatalogHybridLayouts } from './build-catalog-hybrid-layouts';
import type { WallLayoutData, SlotSelection, PosterSize } from '../lib/wall-studio/types';
import { FREGORO_ARTWORKS } from '../lib/wall-studio/artworks-data';

// ─── 1. FETCH CATALOG HYBRID LAYOUTS ───
const newHybridLayouts = generateAllCatalogHybridLayouts();

// ─── 2. CURATED GALLERY WALLS (From existing library) ───
// We load existing layouts and retain the 7 pristine curated gallery layouts
const existingLayoutsPath = path.join(__dirname, '../lib/wall-studio/layouts-data.ts');
const existingContent = fs.readFileSync(existingLayoutsPath, 'utf8');

// Curated gallery layouts to preserve
const galleryIds = [
  'compact-01',
  'classic-02',
  'studio-03',
  'matrix-3x3-18',
  'salon-asymmetric-19',
  'vertical-tower-21',
  'quad-accent-22',
];

// Read existing layouts using tsx eval or import
const { FREGORO_LAYOUTS } = require('../lib/wall-studio/layouts-data');
const curatedGalleryLayouts: WallLayoutData[] = FREGORO_LAYOUTS.filter((l: WallLayoutData) =>
  galleryIds.includes(l.id),
);

// Combine: 16 New Catalog Hybrid Layouts + 7 Curated Gallery Walls
const ALL_LAYOUTS: WallLayoutData[] = [...newHybridLayouts, ...curatedGalleryLayouts];

console.log(
  `Compiled ${ALL_LAYOUTS.length} total layouts (${newHybridLayouts.length} hybrid + ${curatedGalleryLayouts.length} gallery).`,
);

// Helper to find artwork by theme or fallback
function findArt(themeSlug: string, isSplit = false, index = 0) {
  const matching = FREGORO_ARTWORKS.filter((a) => {
    if (a.themeSlug !== themeSlug) return false;
    return isSplit ? a.isSplitCompatible : true;
  });

  if (matching.length > 0) {
    return matching[index % matching.length];
  }

  // Fallback to any split or standard
  const fallbacks = FREGORO_ARTWORKS.filter((a) => (isSplit ? a.isSplitCompatible : true));
  return fallbacks[index % fallbacks.length];
}

// ─── 3. BUILD CURATED DESIGN PLACEMENTS ───
interface PlacementDef {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  themeSlug: string;
  themeName: string;
  layoutId: string;
  accentColor: string;
  badge: string;
  splitArtTheme: string;
  splitArtIndex?: number;
  surroundTheme: string;
}

const PLACEMENT_DEFINITIONS: PlacementDef[] = [
  {
    id: 'placement-stepped-gotham-nocturne',
    slug: 'stepped-gotham-nocturne-5',
    title: 'The Dark Knight: Gotham Nocturne',
    tagline: '5-Piece Stepped Split Hero & Gotham Flank Gallery',
    description:
      'Commanding 5-print hybrid wall art. Features a 3-panel stepped split (6×9", 6×11", 6×9") of Gotham’s skyline flanked by dual vertical A4 shadow portraits of Batman.',
    themeSlug: 'dc',
    themeName: 'DC / Gotham Noir',
    layoutId: 'hybrid-stepped-triptych-flank-5',
    accentColor: '#3B5EFF',
    badge: 'Stepped Dual-Pillar',
    splitArtTheme: 'dc',
    splitArtIndex: 0,
    surroundTheme: 'dc',
  },
  {
    id: 'placement-stepped-avengers-midtown',
    slug: 'stepped-avengers-midtown-5',
    title: 'Avengers: Midtown Vanguard',
    tagline: '5-Piece Stepped Split Hero & Iron Man Vanguard',
    description:
      'Dynamic Marvel hybrid showcase. Features a 3-panel stepped split of Spider-Man overlooking Queens, flanked by Iron Man Mark LXXXV and Captain America’s Vibranium Shield.',
    themeSlug: 'marvel',
    themeName: 'Marvel / Avengers',
    layoutId: 'hybrid-stepped-triptych-flank-5',
    accentColor: '#E62429',
    badge: 'Stepped Dual-Pillar',
    splitArtTheme: 'marvel',
    splitArtIndex: 0,
    surroundTheme: 'marvel',
  },
  {
    id: 'placement-stepped-apex-velocity',
    slug: 'stepped-apex-velocity-7',
    title: 'Apex Velocity: Stuttgart Motorsport',
    tagline: '7-Piece Stepped Triptych with 13×19" Panorama Crown',
    description:
      'High-octane motorsport gallery featuring a 3-panel stepped split hypercar, crowned by a grand 13×19" Porsche 911 GT3 RS track panorama and framed by Ferrari Daytona SP3 and McLaren Senna.',
    themeSlug: 'cars',
    themeName: 'Supercars / Motorsport',
    layoutId: 'hybrid-stepped-triptych-crown-7',
    accentColor: '#FF3366',
    badge: 'Crown Showcase',
    splitArtTheme: 'cars',
    splitArtIndex: 0,
    surroundTheme: 'cars',
  },
  {
    id: 'placement-stepped-anime-titan',
    slug: 'stepped-anime-titan-9',
    title: 'Shingeki Vanguard: 5-Panel Stepped Wave',
    tagline: '9-Piece Stepped Wave Split & Shonen Flank Wings',
    description:
      'Immersive anime installation featuring our signature 5-panel stepped wave split (reduced 50%) framed symmetrically by stacked Demon Slayer Hinokami Kagura and Jujutsu Kaisen domain prints.',
    themeSlug: 'anime',
    themeName: 'Anime / Shonen',
    layoutId: 'hybrid-stepped-wave-flank-9',
    accentColor: '#FF6B00',
    badge: 'Stepped Wave Flank',
    splitArtTheme: 'anime',
    splitArtIndex: 0,
    surroundTheme: 'anime',
  },
  {
    id: 'placement-stepped-cyberpunk-nightcity',
    slug: 'stepped-cyberpunk-nightcity-9',
    title: 'Night City: Neon Horizon Wave',
    tagline: '9-Piece Stepped Wave Split & Cyberpunk Megacity',
    description:
      'Atmospheric cyberpunk composition with a 5-panel stepped wave split of Night City’s skyscrapers, flanked by Elden Ring Erdtree and Ghost of Tsushima portraits.',
    themeSlug: 'gaming',
    themeName: 'Gaming / Cyberpunk',
    layoutId: 'hybrid-stepped-wave-flank-9',
    accentColor: '#00E5FF',
    badge: 'Stepped Wave Flank',
    splitArtTheme: 'gaming',
    splitArtIndex: 0,
    surroundTheme: 'gaming',
  },
  {
    id: 'placement-stepped-heritage-twin-vigilantes',
    slug: 'stepped-heritage-twin-vigilantes-11',
    title: 'Twin Vigilantes: Gotham & Manhattan Heritage',
    tagline: '11-Piece Grand Heritage with 13×19" Monoliths',
    description:
      'Monumental 11-print crossover featuring a central 5-panel stepped wave split framed by dual 13×19" vertical monoliths of Batman Noir and Spider-Man, with 4 A5 horizon frames.',
    themeSlug: 'dc',
    themeName: 'DC & Marvel / Crossover',
    layoutId: 'hybrid-stepped-wave-heritage-11',
    accentColor: '#7C4DFF',
    badge: 'Grand Heritage',
    splitArtTheme: 'dc',
    splitArtIndex: 0,
    surroundTheme: 'marvel',
  },
  {
    id: 'placement-grid2x2-nordic-minimal',
    slug: 'grid2x2-nordic-minimal-6',
    title: 'Nordic Horizon: 2×2 Salon with 13×19 Pillars',
    tagline: '6-Piece Architectural Grid & Monumental Anchors',
    description:
      'Serene Scandinavian design featuring a 2×2 windowpane grid split of minimalist architectural photography flanked by dual flagship 13×19" monochrome prints.',
    themeSlug: 'minimal',
    themeName: 'Minimalist / Architecture',
    layoutId: 'hybrid-grid2x2-heritage-6',
    accentColor: '#E0E0E0',
    badge: 'Curated Salon',
    splitArtTheme: 'minimal',
    splitArtIndex: 0,
    surroundTheme: 'minimal',
  },
  {
    id: 'placement-grid3x2-neon-nexus',
    slug: 'grid3x2-neon-nexus-10',
    title: 'Neon Nexus: 3×2 Mosaic Grid Enclave',
    tagline: '10-Piece Continuous Mosaic Grid with Framing A4s',
    description:
      'Detailed 6-panel mosaic grid split (A6 panels) framed on all four sides by curated high-definition gaming and cyberpunk concept art.',
    themeSlug: 'gaming',
    themeName: 'Gaming / Concept Art',
    layoutId: 'hybrid-grid3x2-panoramic-10',
    accentColor: '#FF0055',
    badge: 'Mosaic Enclave',
    splitArtTheme: 'gaming',
    splitArtIndex: 0,
    surroundTheme: 'gaming',
  },
  {
    id: 'placement-grid3x3-gargantua-matrix',
    slug: 'grid3x3-gargantua-matrix-11',
    title: 'Cosmic Matrix: Gargantua Event Horizon',
    tagline: '11-Piece High-Impact 9-Panel Core with 13×19" Guardians',
    description:
      'Breathtaking 3×3 matrix grid continuous split depicting deep space and gravitational horizons, safeguarded on both wings by towering 13×19" vertical sci-fi monuments.',
    themeSlug: 'cinema',
    themeName: 'Cinema & Sci-Fi',
    layoutId: 'hybrid-grid3x3-matrix-11',
    accentColor: '#00F0FF',
    badge: 'High Impact Matrix',
    splitArtTheme: 'cars',
    splitArtIndex: 0,
    surroundTheme: 'minimal',
  },
  {
    id: 'placement-classic3-monaco-sandwich',
    slug: 'classic3-monaco-sandwich-9',
    title: 'Monaco GP: Apex Horizon Sandwich',
    tagline: '9-Piece Triptych with Symmetrical Companion Rows',
    description:
      'Symmetrically aligned motorsport gallery featuring a central 3-panel A4 horizontal split of Circuit de Monaco, sandwiched between top and bottom rows of Formula 1 liveries.',
    themeSlug: 'f1',
    themeName: 'Formula 1 / Racing',
    layoutId: 'hybrid-classic3-horizon-sandwich-9',
    accentColor: '#E10600',
    badge: 'Architectural Grid',
    splitArtTheme: 'f1',
    splitArtIndex: 0,
    surroundTheme: 'f1',
  },
  {
    id: 'placement-classic4-hypercar-cinema',
    slug: 'classic4-hypercar-cinema-8',
    title: 'Cinema-4: Hypercar Sanctuary',
    tagline: '8-Piece Widescreen 4-Panel Split & Dual Headers',
    description:
      'Widescreen 4-panel split horizon crowned by dual horizontal A4 prints of the Porsche 911 GT3 RS and Ferrari SP3 Daytona, framed by vertical pillars.',
    themeSlug: 'cars',
    themeName: 'Supercars / Hypercars',
    layoutId: 'hybrid-classic4-cinema-8',
    accentColor: '#FFB300',
    badge: 'Cinema Widescreen',
    splitArtTheme: 'cars',
    splitArtIndex: 0,
    surroundTheme: 'cars',
  },
  {
    id: 'placement-classic5-marvel-infinity',
    slug: 'classic5-marvel-infinity-9',
    title: 'Marvel Infinity: Grand 5-Panel Ultrawide',
    tagline: '9-Piece Grand Ultrawide with 13×19" Monuments & A3 Headers',
    description:
      'Our most expansive Marvel arrangement. A continuous 5-panel split artwork flanked by 13×19" vertical monoliths of Iron Man and Captain America, crowned by dual A3 horizontal prints.',
    themeSlug: 'marvel',
    themeName: 'Marvel / Infinity Saga',
    layoutId: 'hybrid-classic5-grand-panorama-9',
    accentColor: '#E62429',
    badge: 'Epic Ultrawide',
    splitArtTheme: 'marvel',
    splitArtIndex: 0,
    surroundTheme: 'marvel',
  },
  {
    id: 'placement-vertical3-titan-spire',
    slug: 'vertical3-titan-spire-7',
    title: 'Shonen Spire: Titan Column Totem',
    tagline: '7-Piece 3-Tier Vertical Split with Dual Flanks',
    description:
      'Dramatic vertical column composed of a 3-tier stacked split totem, framed symmetrically by 4 vertical A4 portraits of iconic anime heroes.',
    themeSlug: 'anime',
    themeName: 'Anime / Shonen Heroes',
    layoutId: 'hybrid-vertical3-totem-flank-7',
    accentColor: '#FF5722',
    badge: 'Vertical Totem',
    splitArtTheme: 'anime',
    splitArtIndex: 0,
    surroundTheme: 'anime',
  },
  {
    id: 'placement-vertical4-megabuilding-monolith',
    slug: 'vertical4-megabuilding-monolith-8',
    title: 'Night City: Megabuilding Monolith',
    tagline: '8-Piece 4-Tier Vertical Spire with Flanking Columns',
    description:
      'Futuristic vertical composition featuring a 4-tier stacked horizontal A5 continuous split framed by 4 vertical A4 portraits of cybernetic characters.',
    themeSlug: 'gaming',
    themeName: 'Cyberpunk & Gaming',
    layoutId: 'hybrid-vertical4-monolith-8',
    accentColor: '#00E676',
    badge: 'Vertical Monolith',
    splitArtTheme: 'gaming',
    splitArtIndex: 0,
    surroundTheme: 'gaming',
  },
  {
    id: 'placement-stepped-gotham-salon-enclave',
    slug: 'stepped-gotham-salon-enclave-9',
    title: 'Gotham Noir: Full Salon Enclave',
    tagline: '9-Piece Stepped Triptych with 4-Way Symmetrical Enclosure',
    description:
      'Masterwork salon arrangement enclosing a central 3-panel stepped split with dual vertical A5 wings and horizontal A4 header/footer anchors.',
    themeSlug: 'dc',
    themeName: 'DC / Gotham Universe',
    layoutId: 'hybrid-stepped-triptych-quadwing-9',
    accentColor: '#2979FF',
    badge: 'Salon Enclave',
    splitArtTheme: 'dc',
    splitArtIndex: 0,
    surroundTheme: 'dc',
  },
  {
    id: 'placement-grid2x2-zen-windowpane',
    slug: 'grid2x2-zen-windowpane-8',
    title: 'Zen Horizon: 2×2 Surrounded Windowpane',
    tagline: '8-Piece Landscape Grid Enclosed by Symmetrical Frames',
    description:
      'Harmonious 2×2 landscape grid split enclosed on all four cardinal directions by A4 portrait and landscape gallery frames.',
    themeSlug: 'minimal',
    themeName: 'Minimalist & Zen Nature',
    layoutId: 'hybrid-grid2x2-windowpane-8',
    accentColor: '#8D6E63',
    badge: 'Surrounded Salon',
    splitArtTheme: 'minimal',
    splitArtIndex: 0,
    surroundTheme: 'minimal',
  },
  {
    id: 'placement-classic3-silverstone-triptych',
    slug: 'classic3-silverstone-triptych-7',
    title: 'Silverstone Grand Prix: Copse Apex Triptych',
    tagline: '7-Piece Large-Format A3 Triptych with Vertical A5 Wings',
    description:
      'Commanding A3 triptych split artwork capturing full-speed racing dynamics, balanced on both flanks by curated vertical A5 team emblems.',
    themeSlug: 'f1',
    themeName: 'Formula 1 / Grand Prix',
    layoutId: 'hybrid-classic3-cinema-a3-7',
    accentColor: '#FF1744',
    badge: 'Grand Triptych',
    splitArtTheme: 'f1',
    splitArtIndex: 0,
    surroundTheme: 'f1',
  },
  {
    id: 'placement-vertical5-neotokyo-spire',
    slug: 'vertical5-neotokyo-spire-11',
    title: 'Neo-Tokyo Rain: 5-Tier High-Rise Spire',
    tagline: '11-Piece High-Rise Spire with Towering Gallery Columns',
    description:
      'Architectural vertical statement wall featuring a 5-tier stacked split spire framed by towering 3-piece vertical columns.',
    themeSlug: 'gaming',
    themeName: 'Cyberpunk & Neo-Tokyo',
    layoutId: 'hybrid-vertical5-spire-11',
    accentColor: '#D500F9',
    badge: 'High-Rise Spire',
    splitArtTheme: 'gaming',
    splitArtIndex: 0,
    surroundTheme: 'gaming',
  },
];

// Build actual placements
const ALL_PLACEMENTS = PLACEMENT_DEFINITIONS.map((def) => {
  const layout = ALL_LAYOUTS.find((l) => l.id === def.layoutId);
  if (!layout) {
    throw new Error(`Layout ${def.layoutId} not found for placement ${def.id}`);
  }

  const splitArt = findArt(def.splitArtTheme, true, def.splitArtIndex || 0);
  const surroundArtPool = FREGORO_ARTWORKS.filter((a) => a.themeSlug === def.surroundTheme);
  const generalPool = FREGORO_ARTWORKS;

  const selections: Record<string, SlotSelection> = {};
  let surroundCounter = 0;

  layout.slots.forEach((slot) => {
    if (slot.splitGroupId) {
      // Split slot
      selections[slot.id] = {
        slotId: slot.id,
        artworkId: splitArt.id,
        title: splitArt.title,
        imageUrl: splitArt.imageUrl,
        thumbnailUrl: splitArt.thumbnailUrl,
        splitGroupId: slot.splitGroupId,
        panelIndex: slot.panelIndex ?? null,
        physicalSize: slot.size,
        price: splitArt.price,
      };
    } else {
      // Individual surrounding slot
      // Pick matching orientation if possible
      let chosen = surroundArtPool.find(
        (a) =>
          a.orientation === slot.orientation &&
          !Object.values(selections).some((s) => s.artworkId === a.id),
      );
      if (!chosen) {
        chosen = surroundArtPool[surroundCounter % surroundArtPool.length];
      }
      if (!chosen) {
        chosen = generalPool[surroundCounter % generalPool.length];
      }
      surroundCounter++;

      selections[slot.id] = {
        slotId: slot.id,
        artworkId: chosen.id,
        title: chosen.title,
        imageUrl: chosen.imageUrl,
        thumbnailUrl: chosen.thumbnailUrl,
        splitGroupId: null,
        panelIndex: null,
        physicalSize: slot.size,
        price: chosen.price,
      };
    }
  });

  return {
    id: def.id,
    slug: def.slug,
    title: def.title,
    tagline: def.tagline,
    description: def.description,
    themeSlug: def.themeSlug,
    themeName: def.themeName,
    layoutId: def.layoutId,
    layoutSlug: layout.slug,
    physicalPrintCount: layout.physicalPrintCount,
    coverageLabel: layout.coverageLabel,
    accentColor: def.accentColor,
    previewImageUrl: splitArt.imageUrl,
    badge: def.badge,
    selections,
  };
});

console.log(`Generated ${ALL_PLACEMENTS.length} curated design placements.`);

// ─── 4. WRITE UPDATED layouts-data.ts ───
const layoutsFileContent = `import type { WallLayoutData } from './types';
import { PHYSICAL_SIZES_MM } from './types';

/**
 * ARCHITECTURALLY ENGINEERED FREGORO SIGNATURE LAYOUTS
 *
 * Distinct categories:
 * 1. HYBRID COMBOS: Central continuous split poster framed by surrounding individual posters (Horizontal flanks, vertical rows, or full surround).
 * 2. MULTI-PANEL SPLIT ART: Pure, uninterrupted continuous split artworks.
 * 3. CURATED GALLERY WALLS: Collections of distinct artworks with balanced museum negative space.
 */

export const FREGORO_LAYOUTS: WallLayoutData[] = ${JSON.stringify(ALL_LAYOUTS, null, 2)};

export function getLayoutById(idOrSlug: string): WallLayoutData | undefined {
  if (!idOrSlug) return undefined;
  const normalized = idOrSlug.trim();

  // Direct match
  const exact = FREGORO_LAYOUTS.find((l) => l.id === normalized || l.slug === normalized);
  if (exact) return exact;

  // Intelligent legacy aliases redirecting to enhanced hybrid or split layouts
  if (normalized === 'stepped-hero-05' || normalized === 'stepped-hero') {
    return FREGORO_LAYOUTS.find((l) => l.id === 'hybrid-stepped-triptych-flank-5') || exact;
  }
  if (normalized === 'stepped-grand-06') {
    return FREGORO_LAYOUTS.find((l) => l.id === 'hybrid-stepped-wave-flank-9') || exact;
  }
  if (normalized === 'cinema-07' || normalized === 'cinema') {
    return FREGORO_LAYOUTS.find((l) => l.id === 'hybrid-classic4-cinema-8') || exact;
  }
  if (normalized === 'panorama-08' || normalized === 'panorama') {
    return FREGORO_LAYOUTS.find((l) => l.id === 'hybrid-classic5-grand-panorama-9') || exact;
  }
  if (normalized === 'large-hero-04' || normalized === 'large-hero') {
    return FREGORO_LAYOUTS.find((l) => l.id === 'hybrid-stepped-wave-heritage-11') || exact;
  }

  return undefined;
}
`;

fs.writeFileSync(
  path.join(__dirname, '../lib/wall-studio/layouts-data.ts'),
  layoutsFileContent,
  'utf8',
);
console.log('✓ Successfully written lib/wall-studio/layouts-data.ts');

// ─── 5. WRITE UPDATED design-placements.ts ───
const placementsFileContent = `/**
 * FREGORO WALL STUDIO - CURATED DESIGN PLACEMENTS
 *
 * Pre-composed, art-directed wall design placements combining:
 * 1. HYBRID SPLIT + FRAME COMBOS: Central continuous multi-panel split artwork flanked by curated individual prints.
 * 2. CURATED GALLERY WALLS: Harmonious collections of distinct artworks.
 */

import type { SlotSelection, PosterSize } from './types';
import { FREGORO_ARTWORKS } from './artworks-data';

export interface DesignPlacement {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  themeSlug: string;
  themeName: string;
  layoutId: string;
  layoutSlug: string;
  physicalPrintCount: number;
  coverageLabel: string;
  accentColor: string;
  previewImageUrl: string;
  badge?: string;
  selections: Record<string, SlotSelection>;
}

export const FREGORO_DESIGN_PLACEMENTS: DesignPlacement[] = ${JSON.stringify(ALL_PLACEMENTS, null, 2)};

export function getDesignPlacementById(id: string): DesignPlacement | undefined {
  return FREGORO_DESIGN_PLACEMENTS.find((p) => p.id === id || p.slug === id);
}

export function getPlacementsByLayout(layoutId: string): DesignPlacement[] {
  return FREGORO_DESIGN_PLACEMENTS.filter((p) => p.layoutId === layoutId);
}

export function getPlacementsByTheme(themeSlug: string): DesignPlacement[] {
  if (!themeSlug || themeSlug === 'all') return FREGORO_DESIGN_PLACEMENTS;
  return FREGORO_DESIGN_PLACEMENTS.filter((p) => p.themeSlug === themeSlug);
}
`;

fs.writeFileSync(
  path.join(__dirname, '../lib/wall-studio/design-placements.ts'),
  placementsFileContent,
  'utf8',
);
console.log('✓ Successfully written lib/wall-studio/design-placements.ts');
