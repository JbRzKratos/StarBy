import type { PrebuiltWallProductData } from './types';

/**
 * PREBUILT THEMED WALL PRODUCTS
 *
 * Ready-made walls for direct checkout or one-click "Customize This Wall" inside Wall Studio.
 * All preview images and preset selections sourced from local print masters in https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/.
 */

export const FREGORO_PREBUILT_WALLS: PrebuiltWallProductData[] = [
  {
    id: 'prebuilt-batman-archive',
    slug: 'batman-dark-knight-archive',
    title: 'The Dark Knight Archive Setup',
    tagline: '15-Piece Gotham Noir Architectural Wall',
    description:
      'A commanding 15-print tribute to the Dark Knight. Features a continuous 3-panel A3 Stepped Hero centerpiece of Gotham’s skyline, framed by shadow portraits, iconic Bat-insignias, and high-contrast typography.',
    themeSlug: 'dc',
    layoutId: 'hybrid-stepped-triptych-flank-5',
    basePrice: 1699,
    compareAtPrice: 2299,
    heroImage:
      'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Hyper_realistic_live_action_Batman_in_a_grounde_bf178dca-168c-46e9-8095-9a28417bb7d0.webp',
    roomPhoto:
      'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp',
    material: '280 GSM Museum Archival Fine Art Matte Paper with Giclée Pigment Inks',
    whatsIncluded: [
      '3 × A3 Stepped Split Panels (Continuous Gotham Panorama)',
      '6 × A4 Supporting Artworks (Character & Architecture)',
      '6 × A5 High-Density Accent & Typography Prints',
      'Fregoro Precision Laser Hanging Template with 20mm Spacing Guides',
      'Damage-Free Ultra-Hold Adhesive Hanging Strips (No Drilling Needed)',
      'Numbered Assembly Certificate & Print Manifest',
    ],
    featured: true,
    rating: 4.95,
    reviewCount: 42,
    presetSelections: {
      'slot-stf5-split-1': {
        slotId: 'slot-stf5-split-1',
        artworkId: 'art-dc-01',
        title: 'The Batman — Gotham Rain Nocturne Totem',
        imageUrl:
          'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp',
        splitGroupId: 'split-stf5-hero',
        panelIndex: 0,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-stf5-split-2': {
        slotId: 'slot-stf5-split-2',
        artworkId: 'art-dc-01',
        title: 'The Batman — Gotham Rain Nocturne Totem',
        imageUrl:
          'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp',
        splitGroupId: 'split-stf5-hero',
        panelIndex: 1,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-stf5-split-3': {
        slotId: 'slot-stf5-split-3',
        artworkId: 'art-dc-01',
        title: 'The Batman — Gotham Rain Nocturne Totem',
        imageUrl:
          'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp',
        splitGroupId: 'split-stf5-hero',
        panelIndex: 2,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-stf5-left-a4': {
        slotId: 'slot-stf5-left-a4',
        artworkId: 'art-dc-02',
        title: 'Batman — The Dark Knight of Gotham',
        imageUrl:
          'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Hyper_realistic_live_action_Batman_in_a_grounde_bf178dca-168c-46e9-8095-9a28417bb7d0.webp',
        physicalSize: 'A4',
        price: 199,
      },
      'slot-stf5-right-a4': {
        slotId: 'slot-stf5-right-a4',
        artworkId: 'art-dc-03',
        title: 'The Joker — Throne of Chaos Gotham Arkham',
        imageUrl:
          'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_7a96d29f-220e-44f0-97d1-cc2a7096708f_3.webp',
        physicalSize: 'A4',
        price: 199,
      },
    },
  },
  {
    id: 'prebuilt-porsche-cinema',
    slug: 'toyota-supra-jdm-smoke-drift-wall',
    title: 'Toyota Supra MK4 Smoke Drift Cinema Setup',
    tagline: '13-Piece Wide Trackside Telemetry Wall',
    description:
      'Engineered for entertainment & media setups. A seamless multi-piece continuous split capturing the Toyota Supra MK4 in mid-drift smoke, flanked by JDM performance studies.',
    themeSlug: 'cars',
    layoutId: 'hybrid-classic3-horizon-sandwich-9',
    basePrice: 1899,
    compareAtPrice: 2499,
    heroImage:
      'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp',
    roomPhoto:
      'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_ecff18b4-fb76-4237-9b23-996bfdfef59f_3.webp',
    material: '280 GSM Lustre Anti-Glare Archival Paper with UltraChrome HD Pigments',
    whatsIncluded: [
      '3 × A3 Wide Horizontal Split Panels (Continuous Supra Drift Panorama)',
      '4 × A4 Flanking Supporting Prints (Supercar Telemetry Specs)',
      '2 × A5 Cockpit & Gauge Accent Artworks',
      'Fregoro Zero-Gap Precision Wall Alignment Rail Template',
      'Commercial-Grade Mounting Hardware',
    ],
    featured: true,
    rating: 4.98,
    reviewCount: 38,
    presetSelections: {},
  },
  {
    id: 'prebuilt-cyberpunk-night-city',
    slug: 'cod-warzone-ghost-recon-setup',
    title: 'Call of Duty Warzone Ghost Tactical Setup',
    tagline: '15-Piece Tactical Warfare Battlefield Wall',
    description:
      'Immerse your space in battlefield intensity. Features a continuous panoramic split of Simon Ghost Riley, surrounded by combat loadouts and night-vision tactical reconnaissance.',
    themeSlug: 'gamers',
    layoutId: 'hybrid-stepped-wave-flank-9',
    basePrice: 1799,
    compareAtPrice: 2399,
    heroImage:
      'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_f0134bff-f4ac-4ae8-89ff-3ce9931423a3_3.webp',
    roomPhoto:
      'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp',
    material: '280 GSM Matte Archival Paper with High-Vibrancy Neon Gamut Inks',
    whatsIncluded: [
      '5 × A3 Stepped Wave Ghost Recon Centerpiece',
      '4 × A4 Tactical Weapon & Operative Supporting Prints',
      'Fregoro Magnetic Levitation Hanging System',
    ],
    featured: true,
    rating: 4.92,
    reviewCount: 31,
    presetSelections: {},
  },
  {
    id: 'prebuilt-spider-man-symbiote',
    slug: 'spider-man-venom-symbiote-setup',
    title: 'Spider-Man vs Venom Symbiote Duality Setup',
    tagline: 'Signature 5-Piece Stepped Split Hero',
    description:
      'The eternal struggle between Peter Parker and the Venom symbiote. High-contrast split panels with raw comic ink and explosive dynamic composition.',
    themeSlug: 'marvel',
    layoutId: 'hybrid-stepped-triptych-flank-5',
    basePrice: 1599,
    compareAtPrice: 2199,
    heroImage:
      'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp',
    roomPhoto:
      'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_2097d66e-d042-46a0-a7ac-2fa51c635caf_3.webp',
    material: '310 GSM Fine Art Archival Giclée Cotton Rag',
    whatsIncluded: [
      '3 × Continuous Stepped Symbiote Split Panels',
      '2 × A4 Iron Man & Captain America Museum Flanks',
      'Laser Alignment Template & Damage-Free Strips',
    ],
    featured: true,
    rating: 4.97,
    reviewCount: 45,
    presetSelections: {},
  },
];

export function getPrebuiltWallBySlug(slug: string): PrebuiltWallProductData | undefined {
  return FREGORO_PREBUILT_WALLS.find((p) => p.slug === slug || p.id === slug);
}
