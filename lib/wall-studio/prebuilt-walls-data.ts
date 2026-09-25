import type { PrebuiltWallProductData } from './types';

/**
 * PREBUILT THEMED WALL PRODUCTS
 *
 * Ready-made walls for direct checkout or one-click "Customize This Wall" inside Wall Studio.
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
    layoutId: 'stepped-hero-05',
    basePrice: 1699,
    compareAtPrice: 2299,
    heroImage:
      'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1200&q=85',
    roomPhoto:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
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
      'slot-sh-hero-1': {
        slotId: 'slot-sh-hero-1',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower (Left)',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        splitGroupId: 'split-sh-hero',
        panelIndex: 0,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-sh-hero-2': {
        slotId: 'slot-sh-hero-2',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower (Center)',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        splitGroupId: 'split-sh-hero',
        panelIndex: 1,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-sh-hero-3': {
        slotId: 'slot-sh-hero-3',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower (Right)',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        splitGroupId: 'split-sh-hero',
        panelIndex: 2,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-sh-sup-1': {
        slotId: 'slot-sh-sup-1',
        artworkId: 'art-dc-02',
        title: 'Vengeance in the Shadows',
        imageUrl:
          'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=1200&q=85',
        physicalSize: 'A4',
        price: 199,
      },
      'slot-sh-sup-2': {
        slotId: 'slot-sh-sup-2',
        artworkId: 'art-dc-03',
        title: 'Why So Serious Monochrome',
        imageUrl:
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=85',
        physicalSize: 'A4',
        price: 149,
      },
      'slot-sh-sup-4': {
        slotId: 'slot-sh-sup-4',
        artworkId: 'art-qte-01',
        title: 'MEMENTO MORI // VIRTUE IS SUFFICIENT',
        imageUrl:
          'https://images.unsplash.com/photo-1505682634904-d7c8d95cdc50?auto=format&fit=crop&w=1200&q=85',
        physicalSize: 'A5',
        price: 149,
      },
    },
  },
  {
    id: 'prebuilt-porsche-cinema',
    slug: 'porsche-911-gt3-rs-cinema-wall',
    title: 'Porsche 911 GT3 RS Cinema Setup',
    tagline: '13-Piece Wide Trackside Telemetry Wall',
    description:
      'Engineered for entertainment & media setups. A seamless 5-piece continuous A3 horizontal split capturing the Porsche 911 GT3 RS in mid-apex, flanked by tachometer telemetry charts and Weissach package detail studies.',
    themeSlug: 'cars',
    layoutId: 'cinema-07',
    basePrice: 1899,
    compareAtPrice: 2499,
    heroImage:
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=85',
    roomPhoto:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
    material: '280 GSM Lustre Anti-Glare Archival Paper with UltraChrome HD Pigments',
    whatsIncluded: [
      '5 × A3 Wide Horizontal Split Panels (Continuous GT3 RS Apex Panorama)',
      '4 × A4 Flanking Supporting Prints (Ferrari F40 & Telemetry Specs)',
      '4 × A5 Cockpit & Gauge Accent Artworks',
      'Fregoro Zero-Gap Precision Wall Alignment Rail Template',
      'Commercial-Grade Mounting Hardware',
    ],
    featured: true,
    rating: 4.98,
    reviewCount: 38,
    presetSelections: {
      'slot-cn-h1': {
        slotId: 'slot-cn-h1',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS (Panel 1)',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        splitGroupId: 'split-cn-hero',
        panelIndex: 0,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-cn-h2': {
        slotId: 'slot-cn-h2',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS (Panel 2)',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        splitGroupId: 'split-cn-hero',
        panelIndex: 1,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-cn-h3': {
        slotId: 'slot-cn-h3',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS (Panel 3)',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        splitGroupId: 'split-cn-hero',
        panelIndex: 2,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-cn-h4': {
        slotId: 'slot-cn-h4',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS (Panel 4)',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        splitGroupId: 'split-cn-hero',
        panelIndex: 3,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-cn-h5': {
        slotId: 'slot-cn-h5',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS (Panel 5)',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        splitGroupId: 'split-cn-hero',
        panelIndex: 4,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-cn-l1': {
        slotId: 'slot-cn-l1',
        artworkId: 'art-car-02',
        title: 'Ferrari F40 Twin-Turbo Louvers',
        imageUrl:
          'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=85',
        physicalSize: 'A4',
        price: 199,
      },
      'slot-cn-r1': {
        slotId: 'slot-cn-r1',
        artworkId: 'art-car-03',
        title: '9000 RPM Telemetry Blueprint',
        imageUrl:
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85',
        physicalSize: 'A4',
        price: 149,
      },
    },
  },
  {
    id: 'prebuilt-cyberpunk-night-city',
    slug: 'night-city-cyberpunk-large-hero',
    title: 'Night City 2099 Cyberpunk Setup',
    tagline: '15-Piece Panoramic Cybernetic Wall',
    description:
      'Immerse your space in the neon rain of Night City. Features an ultra-wide panoramic cityscape split with floating glitch glyphs, samurai katana portraits, and retro arcade typography.',
    themeSlug: 'gaming',
    layoutId: 'large-hero-04',
    basePrice: 1799,
    compareAtPrice: 2399,
    heroImage:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=85',
    roomPhoto:
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=85',
    material: '280 GSM Matte Archival Paper with High-Vibrancy Neon Gamut Inks',
    whatsIncluded: [
      '3 × A3 Panoramic Night City Split Centerpiece',
      '4 × A4 Ronin & Katana Supporting Prints',
      '8 × A5 Cyberpunk Glitch & Tech Accents',
      'Fregoro Magnetic Levitation Hanging System',
    ],
    featured: true,
    rating: 4.92,
    reviewCount: 31,
    presetSelections: {},
  },
  {
    id: 'prebuilt-bauhaus-core',
    slug: 'bauhaus-minimal-core-wall',
    title: 'Bauhaus Minimal Core Setup',
    tagline: '5-Piece Pure Geometric Elegance',
    description:
      'For minimalist interiors that demand quiet power. A monolithic 3-panel continuous A3 Bauhaus arch split framed by brutalist concrete architectural studies.',
    themeSlug: 'minimal',
    layoutId: 'core-14',
    basePrice: 999,
    compareAtPrice: 1399,
    heroImage:
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85',
    roomPhoto:
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85',
    material: '310 GSM Hahnemühle German Etching Textured Rag',
    whatsIncluded: [
      '3 × A3 Continuous Minimalist Split Panels',
      '2 × A4 Brutalist Concrete Architectural Studies',
      'Architectural Hanging Kit with White-Glove Handling Cotton Gloves',
    ],
    featured: true,
    rating: 4.97,
    reviewCount: 26,
    presetSelections: {},
  },
];

export function getPrebuiltWallBySlug(slug: string): PrebuiltWallProductData | undefined {
  return FREGORO_PREBUILT_WALLS.find((p) => p.slug === slug || p.id === slug);
}
