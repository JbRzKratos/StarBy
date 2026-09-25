/**
 * FREGORO WALL STUDIO - CURATED DESIGN PLACEMENTS
 *
 * Pre-composed, art-directed wall design placements combining:
 * 1. HYBRID SPLIT + FRAME COMBOS: Central continuous multi-panel split artwork flanked by curated individual prints.
 * 2. CURATED GALLERY WALLS: Harmonious collections of distinct artworks.
 */

import type { SlotSelection } from './types';

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

export const FREGORO_DESIGN_PLACEMENTS: DesignPlacement[] = [
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
    layoutSlug: 'hybrid-stepped-triptych-flank',
    physicalPrintCount: 5,
    coverageLabel: '93 × 30 cm',
    accentColor: '#3B5EFF',
    previewImageUrl:
      'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
    badge: 'Stepped Dual-Pillar',
    selections: {
      'slot-stf5-left-a4': {
        slotId: 'slot-stf5-left-a4',
        artworkId: 'art-dc-02',
        title: 'Vengeance in the Shadows',
        imageUrl:
          'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 199,
      },
      'slot-stf5-split-1': {
        slotId: 'slot-stf5-split-1',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-stf5-hero',
        panelIndex: 0,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-stf5-split-2': {
        slotId: 'slot-stf5-split-2',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-stf5-hero',
        panelIndex: 1,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-stf5-split-3': {
        slotId: 'slot-stf5-split-3',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-stf5-hero',
        panelIndex: 2,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-stf5-right-a4': {
        slotId: 'slot-stf5-right-a4',
        artworkId: 'art-dc-03',
        title: 'Why So Serious Monochrome',
        imageUrl:
          'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 149,
      },
    },
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
    layoutSlug: 'hybrid-stepped-triptych-flank',
    physicalPrintCount: 5,
    coverageLabel: '93 × 30 cm',
    accentColor: '#E62429',
    previewImageUrl:
      'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=1800&q=85',
    badge: 'Stepped Dual-Pillar',
    selections: {
      'slot-stf5-left-a4': {
        slotId: 'slot-stf5-left-a4',
        artworkId: 'art-mvl-01',
        title: 'Iron Man Mark LXXXV Ascent',
        imageUrl:
          'https://images.unsplash.com/photo-1635863138275-d9b33299680b?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1635863138275-d9b33299680b?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 199,
      },
      'slot-stf5-split-1': {
        slotId: 'slot-stf5-split-1',
        artworkId: 'art-mvl-02',
        title: 'Spider-Man Queens Horizon Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-stf5-hero',
        panelIndex: 0,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-stf5-split-2': {
        slotId: 'slot-stf5-split-2',
        artworkId: 'art-mvl-02',
        title: 'Spider-Man Queens Horizon Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-stf5-hero',
        panelIndex: 1,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-stf5-split-3': {
        slotId: 'slot-stf5-split-3',
        artworkId: 'art-mvl-02',
        title: 'Spider-Man Queens Horizon Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-stf5-hero',
        panelIndex: 2,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-stf5-right-a4': {
        slotId: 'slot-stf5-right-a4',
        artworkId: 'art-mvl-03',
        title: 'Avengers Minimal Emblem',
        imageUrl:
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 149,
      },
    },
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
    layoutSlug: 'hybrid-stepped-triptych-crown',
    physicalPrintCount: 7,
    coverageLabel: '93 × 87 cm',
    accentColor: '#FF3366',
    previewImageUrl:
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
    badge: 'Crown Showcase',
    selections: {
      'slot-stc7-crown': {
        slotId: 'slot-stc7-crown',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: '13x19',
        price: 349,
      },
      'slot-stc7-left-a4': {
        slotId: 'slot-stc7-left-a4',
        artworkId: 'art-car-02',
        title: 'Ferrari F40 Twin-Turbo Louvers',
        imageUrl:
          'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 199,
      },
      'slot-stc7-split-1': {
        slotId: 'slot-stc7-split-1',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-stc7-hero',
        panelIndex: 0,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-stc7-split-2': {
        slotId: 'slot-stc7-split-2',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-stc7-hero',
        panelIndex: 1,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-stc7-split-3': {
        slotId: 'slot-stc7-split-3',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-stc7-hero',
        panelIndex: 2,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-stc7-right-a4': {
        slotId: 'slot-stc7-right-a4',
        artworkId: 'art-car-03',
        title: '9000 RPM Telemetry Blueprint',
        imageUrl:
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 149,
      },
      'slot-stc7-bot-a4': {
        slotId: 'slot-stc7-bot-a4',
        artworkId: 'art-car-04',
        title: 'AMG ONE Hypercar Aerodynamics',
        imageUrl:
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 199,
      },
    },
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
    layoutSlug: 'hybrid-stepped-wave-flank',
    physicalPrintCount: 9,
    coverageLabel: '101 × 31 cm',
    accentColor: '#FF6B00',
    previewImageUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=85',
    badge: 'Stepped Wave Flank',
    selections: {
      'slot-swf9-left-top': {
        slotId: 'slot-swf9-left-top',
        artworkId: 'art-ani-01',
        title: 'Shinjuku 2099 Rain Horizon',
        imageUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-swf9-left-bot': {
        slotId: 'slot-swf9-left-bot',
        artworkId: 'art-ani-02',
        title: 'The Colossal Colossus',
        imageUrl:
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 199,
      },
      'slot-swf9-split-1': {
        slotId: 'slot-swf9-split-1',
        artworkId: 'art-ani-01',
        title: 'Shinjuku 2099 Rain Horizon',
        imageUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swf9-hero',
        panelIndex: 0,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swf9-split-2': {
        slotId: 'slot-swf9-split-2',
        artworkId: 'art-ani-01',
        title: 'Shinjuku 2099 Rain Horizon',
        imageUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swf9-hero',
        panelIndex: 1,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swf9-split-3': {
        slotId: 'slot-swf9-split-3',
        artworkId: 'art-ani-01',
        title: 'Shinjuku 2099 Rain Horizon',
        imageUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swf9-hero',
        panelIndex: 2,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swf9-split-4': {
        slotId: 'slot-swf9-split-4',
        artworkId: 'art-ani-01',
        title: 'Shinjuku 2099 Rain Horizon',
        imageUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swf9-hero',
        panelIndex: 3,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swf9-split-5': {
        slotId: 'slot-swf9-split-5',
        artworkId: 'art-ani-01',
        title: 'Shinjuku 2099 Rain Horizon',
        imageUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swf9-hero',
        panelIndex: 4,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swf9-right-top': {
        slotId: 'slot-swf9-right-top',
        artworkId: 'art-ani-03',
        title: '勇気 (Courage) Sumi-e Ink',
        imageUrl:
          'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 149,
      },
      'slot-swf9-right-bot': {
        slotId: 'slot-swf9-right-bot',
        artworkId: 'art-ani-01',
        title: 'Shinjuku 2099 Rain Horizon',
        imageUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 349,
      },
    },
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
    layoutSlug: 'hybrid-stepped-wave-flank',
    physicalPrintCount: 9,
    coverageLabel: '101 × 31 cm',
    accentColor: '#00E5FF',
    previewImageUrl:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
    badge: 'Stepped Wave Flank',
    selections: {
      'slot-swf9-left-top': {
        slotId: 'slot-swf9-left-top',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-swf9-left-bot': {
        slotId: 'slot-swf9-left-bot',
        artworkId: 'art-gam-02',
        title: 'Ghost Ronin Katana Stance',
        imageUrl:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 199,
      },
      'slot-swf9-split-1': {
        slotId: 'slot-swf9-split-1',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swf9-hero',
        panelIndex: 0,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swf9-split-2': {
        slotId: 'slot-swf9-split-2',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swf9-hero',
        panelIndex: 1,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swf9-split-3': {
        slotId: 'slot-swf9-split-3',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swf9-hero',
        panelIndex: 2,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swf9-split-4': {
        slotId: 'slot-swf9-split-4',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swf9-hero',
        panelIndex: 3,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swf9-split-5': {
        slotId: 'slot-swf9-split-5',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swf9-hero',
        panelIndex: 4,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swf9-right-top': {
        slotId: 'slot-swf9-right-top',
        artworkId: 'art-gam-03',
        title: 'PRESS START / INSERT COIN',
        imageUrl:
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 149,
      },
      'slot-swf9-right-bot': {
        slotId: 'slot-swf9-right-bot',
        artworkId: 'art-gam-04',
        title: 'Mechanical Key Switch Patent Art',
        imageUrl:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 149,
      },
    },
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
    layoutSlug: 'hybrid-stepped-wave-heritage',
    physicalPrintCount: 11,
    coverageLabel: '125 × 59 cm',
    accentColor: '#7C4DFF',
    previewImageUrl:
      'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
    badge: 'Grand Heritage',
    selections: {
      'slot-swh11-arch-left': {
        slotId: 'slot-swh11-arch-left',
        artworkId: 'art-mvl-01',
        title: 'Iron Man Mark LXXXV Ascent',
        imageUrl:
          'https://images.unsplash.com/photo-1635863138275-d9b33299680b?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1635863138275-d9b33299680b?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: '13x19',
        price: 199,
      },
      'slot-swh11-top-1': {
        slotId: 'slot-swh11-top-1',
        artworkId: 'art-mvl-02',
        title: 'Spider-Man Queens Horizon Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-swh11-top-2': {
        slotId: 'slot-swh11-top-2',
        artworkId: 'art-mvl-03',
        title: 'Avengers Minimal Emblem',
        imageUrl:
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 149,
      },
      'slot-swh11-split-1': {
        slotId: 'slot-swh11-split-1',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swh11-hero',
        panelIndex: 0,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swh11-split-2': {
        slotId: 'slot-swh11-split-2',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swh11-hero',
        panelIndex: 1,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swh11-split-3': {
        slotId: 'slot-swh11-split-3',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swh11-hero',
        panelIndex: 2,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swh11-split-4': {
        slotId: 'slot-swh11-split-4',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swh11-hero',
        panelIndex: 3,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swh11-split-5': {
        slotId: 'slot-swh11-split-5',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-swh11-hero',
        panelIndex: 4,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-swh11-bot-1': {
        slotId: 'slot-swh11-bot-1',
        artworkId: 'art-mvl-04',
        title: 'Vibranium Battle Shield',
        imageUrl:
          'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 199,
      },
      'slot-swh11-bot-2': {
        slotId: 'slot-swh11-bot-2',
        artworkId: 'art-mvl-01',
        title: 'Iron Man Mark LXXXV Ascent',
        imageUrl:
          'https://images.unsplash.com/photo-1635863138275-d9b33299680b?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1635863138275-d9b33299680b?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 199,
      },
      'slot-swh11-arch-right': {
        slotId: 'slot-swh11-arch-right',
        artworkId: 'art-mvl-02',
        title: 'Spider-Man Queens Horizon Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: '13x19',
        price: 349,
      },
    },
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
    layoutSlug: 'hybrid-grid2x2-heritage',
    physicalPrintCount: 6,
    coverageLabel: '100 × 48 cm',
    accentColor: '#E0E0E0',
    previewImageUrl:
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1800&q=85',
    badge: 'Curated Salon',
    selections: {
      'slot-g2h6-arch-left': {
        slotId: 'slot-g2h6-arch-left',
        artworkId: 'art-min-02',
        title: 'Brutalist Steps in Morning Mist',
        imageUrl:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: '13x19',
        price: 199,
      },
      'slot-g2h6-split-1': {
        slotId: 'slot-g2h6-split-1',
        artworkId: 'art-min-01',
        title: 'Bauhaus Arch Composition No. 7',
        imageUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g2h6-hero',
        panelIndex: 0,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-g2h6-split-2': {
        slotId: 'slot-g2h6-split-2',
        artworkId: 'art-min-01',
        title: 'Bauhaus Arch Composition No. 7',
        imageUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g2h6-hero',
        panelIndex: 1,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-g2h6-split-3': {
        slotId: 'slot-g2h6-split-3',
        artworkId: 'art-min-01',
        title: 'Bauhaus Arch Composition No. 7',
        imageUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g2h6-hero',
        panelIndex: 2,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-g2h6-split-4': {
        slotId: 'slot-g2h6-split-4',
        artworkId: 'art-min-01',
        title: 'Bauhaus Arch Composition No. 7',
        imageUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g2h6-hero',
        panelIndex: 3,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-g2h6-arch-right': {
        slotId: 'slot-g2h6-arch-right',
        artworkId: 'art-min-02',
        title: 'Brutalist Steps in Morning Mist',
        imageUrl:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: '13x19',
        price: 199,
      },
    },
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
    layoutSlug: 'hybrid-grid3x2-panoramic',
    physicalPrintCount: 10,
    coverageLabel: '79 × 76 cm',
    accentColor: '#FF0055',
    previewImageUrl:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
    badge: 'Mosaic Enclave',
    selections: {
      'slot-g32-top-a4': {
        slotId: 'slot-g32-top-a4',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 349,
      },
      'slot-g32-left-a4': {
        slotId: 'slot-g32-left-a4',
        artworkId: 'art-gam-02',
        title: 'Ghost Ronin Katana Stance',
        imageUrl:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 199,
      },
      'slot-g32-split-1': {
        slotId: 'slot-g32-split-1',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g32-hero',
        panelIndex: 0,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g32-split-2': {
        slotId: 'slot-g32-split-2',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g32-hero',
        panelIndex: 1,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g32-split-3': {
        slotId: 'slot-g32-split-3',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g32-hero',
        panelIndex: 2,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g32-split-4': {
        slotId: 'slot-g32-split-4',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g32-hero',
        panelIndex: 3,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g32-split-5': {
        slotId: 'slot-g32-split-5',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g32-hero',
        panelIndex: 4,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g32-split-6': {
        slotId: 'slot-g32-split-6',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g32-hero',
        panelIndex: 5,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g32-right-a4': {
        slotId: 'slot-g32-right-a4',
        artworkId: 'art-gam-03',
        title: 'PRESS START / INSERT COIN',
        imageUrl:
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 149,
      },
      'slot-g32-bot-a4': {
        slotId: 'slot-g32-bot-a4',
        artworkId: 'art-gam-04',
        title: 'Mechanical Key Switch Patent Art',
        imageUrl:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 149,
      },
    },
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
    layoutSlug: 'hybrid-grid3x3-matrix',
    physicalPrintCount: 11,
    coverageLabel: '103 × 48 cm',
    accentColor: '#00F0FF',
    previewImageUrl:
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
    badge: 'High Impact Matrix',
    selections: {
      'slot-g33-arch-left': {
        slotId: 'slot-g33-arch-left',
        artworkId: 'art-min-02',
        title: 'Brutalist Steps in Morning Mist',
        imageUrl:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: '13x19',
        price: 199,
      },
      'slot-g33-split-1': {
        slotId: 'slot-g33-split-1',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g33-hero',
        panelIndex: 0,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g33-split-2': {
        slotId: 'slot-g33-split-2',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g33-hero',
        panelIndex: 1,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g33-split-3': {
        slotId: 'slot-g33-split-3',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g33-hero',
        panelIndex: 2,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g33-split-4': {
        slotId: 'slot-g33-split-4',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g33-hero',
        panelIndex: 3,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g33-split-5': {
        slotId: 'slot-g33-split-5',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g33-hero',
        panelIndex: 4,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g33-split-6': {
        slotId: 'slot-g33-split-6',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g33-hero',
        panelIndex: 5,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g33-split-7': {
        slotId: 'slot-g33-split-7',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g33-hero',
        panelIndex: 6,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g33-split-8': {
        slotId: 'slot-g33-split-8',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g33-hero',
        panelIndex: 7,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g33-split-9': {
        slotId: 'slot-g33-split-9',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g33-hero',
        panelIndex: 8,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-g33-arch-right': {
        slotId: 'slot-g33-arch-right',
        artworkId: 'art-min-02',
        title: 'Brutalist Steps in Morning Mist',
        imageUrl:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: '13x19',
        price: 199,
      },
    },
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
    layoutSlug: 'hybrid-classic3-horizon-sandwich',
    physicalPrintCount: 9,
    coverageLabel: '66 × 62 cm',
    accentColor: '#E10600',
    previewImageUrl:
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1800&q=85',
    badge: 'Architectural Grid',
    selections: {
      'slot-c3h9-top-1': {
        slotId: 'slot-c3h9-top-1',
        artworkId: 'art-f1-01',
        title: 'Grand Prix de Monaco: Lowes Hairpin',
        imageUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-c3h9-split-1': {
        slotId: 'slot-c3h9-split-1',
        artworkId: 'art-f1-01',
        title: 'Grand Prix de Monaco: Lowes Hairpin',
        imageUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c3h9-hero',
        panelIndex: 0,
        physicalSize: 'A4',
        price: 349,
      },
      'slot-c3h9-bot-1': {
        slotId: 'slot-c3h9-bot-1',
        artworkId: 'art-f1-02',
        title: 'Autodromo Nazionale Monza 350 KM/H',
        imageUrl:
          'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 199,
      },
      'slot-c3h9-top-2': {
        slotId: 'slot-c3h9-top-2',
        artworkId: 'art-f1-03',
        title: 'Visor Focus: 300 Milliseconds',
        imageUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 149,
      },
      'slot-c3h9-split-2': {
        slotId: 'slot-c3h9-split-2',
        artworkId: 'art-f1-01',
        title: 'Grand Prix de Monaco: Lowes Hairpin',
        imageUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c3h9-hero',
        panelIndex: 1,
        physicalSize: 'A4',
        price: 349,
      },
      'slot-c3h9-bot-2': {
        slotId: 'slot-c3h9-bot-2',
        artworkId: 'art-f1-01',
        title: 'Grand Prix de Monaco: Lowes Hairpin',
        imageUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-c3h9-top-3': {
        slotId: 'slot-c3h9-top-3',
        artworkId: 'art-f1-02',
        title: 'Autodromo Nazionale Monza 350 KM/H',
        imageUrl:
          'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 199,
      },
      'slot-c3h9-split-3': {
        slotId: 'slot-c3h9-split-3',
        artworkId: 'art-f1-01',
        title: 'Grand Prix de Monaco: Lowes Hairpin',
        imageUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c3h9-hero',
        panelIndex: 2,
        physicalSize: 'A4',
        price: 349,
      },
      'slot-c3h9-bot-3': {
        slotId: 'slot-c3h9-bot-3',
        artworkId: 'art-f1-03',
        title: 'Visor Focus: 300 Milliseconds',
        imageUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 149,
      },
    },
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
    layoutSlug: 'hybrid-classic4-cinema',
    physicalPrintCount: 8,
    coverageLabel: '109 × 48 cm',
    accentColor: '#FFB300',
    previewImageUrl:
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
    badge: 'Cinema Widescreen',
    selections: {
      'slot-c4c8-top-1': {
        slotId: 'slot-c4c8-top-1',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 349,
      },
      'slot-c4c8-top-2': {
        slotId: 'slot-c4c8-top-2',
        artworkId: 'art-car-02',
        title: 'Ferrari F40 Twin-Turbo Louvers',
        imageUrl:
          'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 199,
      },
      'slot-c4c8-left-a4': {
        slotId: 'slot-c4c8-left-a4',
        artworkId: 'art-car-03',
        title: '9000 RPM Telemetry Blueprint',
        imageUrl:
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 149,
      },
      'slot-c4c8-split-1': {
        slotId: 'slot-c4c8-split-1',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c4c8-hero',
        panelIndex: 0,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-c4c8-split-2': {
        slotId: 'slot-c4c8-split-2',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c4c8-hero',
        panelIndex: 1,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-c4c8-split-3': {
        slotId: 'slot-c4c8-split-3',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c4c8-hero',
        panelIndex: 2,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-c4c8-split-4': {
        slotId: 'slot-c4c8-split-4',
        artworkId: 'art-car-01',
        title: 'Porsche 911 GT3 RS Apex Sweep',
        imageUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c4c8-hero',
        panelIndex: 3,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-c4c8-right-a4': {
        slotId: 'slot-c4c8-right-a4',
        artworkId: 'art-car-04',
        title: 'AMG ONE Hypercar Aerodynamics',
        imageUrl:
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 199,
      },
    },
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
    layoutSlug: 'hybrid-classic5-grand-panorama',
    physicalPrintCount: 9,
    coverageLabel: '155 × 52 cm',
    accentColor: '#E62429',
    previewImageUrl:
      'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=1800&q=85',
    badge: 'Epic Ultrawide',
    selections: {
      'slot-c5g9-arch-left': {
        slotId: 'slot-c5g9-arch-left',
        artworkId: 'art-mvl-01',
        title: 'Iron Man Mark LXXXV Ascent',
        imageUrl:
          'https://images.unsplash.com/photo-1635863138275-d9b33299680b?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1635863138275-d9b33299680b?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: '13x19',
        price: 199,
      },
      'slot-c5g9-top-1': {
        slotId: 'slot-c5g9-top-1',
        artworkId: 'art-mvl-02',
        title: 'Spider-Man Queens Horizon Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-c5g9-top-2': {
        slotId: 'slot-c5g9-top-2',
        artworkId: 'art-mvl-03',
        title: 'Avengers Minimal Emblem',
        imageUrl:
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A3',
        price: 149,
      },
      'slot-c5g9-split-1': {
        slotId: 'slot-c5g9-split-1',
        artworkId: 'art-mvl-02',
        title: 'Spider-Man Queens Horizon Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c5g9-hero',
        panelIndex: 0,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-c5g9-split-2': {
        slotId: 'slot-c5g9-split-2',
        artworkId: 'art-mvl-02',
        title: 'Spider-Man Queens Horizon Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c5g9-hero',
        panelIndex: 1,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-c5g9-split-3': {
        slotId: 'slot-c5g9-split-3',
        artworkId: 'art-mvl-02',
        title: 'Spider-Man Queens Horizon Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c5g9-hero',
        panelIndex: 2,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-c5g9-split-4': {
        slotId: 'slot-c5g9-split-4',
        artworkId: 'art-mvl-02',
        title: 'Spider-Man Queens Horizon Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c5g9-hero',
        panelIndex: 3,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-c5g9-split-5': {
        slotId: 'slot-c5g9-split-5',
        artworkId: 'art-mvl-02',
        title: 'Spider-Man Queens Horizon Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c5g9-hero',
        panelIndex: 4,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-c5g9-arch-right': {
        slotId: 'slot-c5g9-arch-right',
        artworkId: 'art-mvl-04',
        title: 'Vibranium Battle Shield',
        imageUrl:
          'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: '13x19',
        price: 199,
      },
    },
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
    layoutSlug: 'hybrid-vertical3-totem-flank',
    physicalPrintCount: 7,
    coverageLabel: '75 × 66 cm',
    accentColor: '#FF5722',
    previewImageUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=85',
    badge: 'Vertical Totem',
    selections: {
      'slot-v3t7-left-top': {
        slotId: 'slot-v3t7-left-top',
        artworkId: 'art-ani-02',
        title: 'The Colossal Colossus',
        imageUrl:
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 199,
      },
      'slot-v3t7-left-bot': {
        slotId: 'slot-v3t7-left-bot',
        artworkId: 'art-ani-03',
        title: '勇気 (Courage) Sumi-e Ink',
        imageUrl:
          'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 149,
      },
      'slot-v3t7-split-1': {
        slotId: 'slot-v3t7-split-1',
        artworkId: 'art-ani-01',
        title: 'Shinjuku 2099 Rain Horizon',
        imageUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-v3t7-hero',
        panelIndex: 0,
        physicalSize: 'A4',
        price: 349,
      },
      'slot-v3t7-split-2': {
        slotId: 'slot-v3t7-split-2',
        artworkId: 'art-ani-01',
        title: 'Shinjuku 2099 Rain Horizon',
        imageUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-v3t7-hero',
        panelIndex: 1,
        physicalSize: 'A4',
        price: 349,
      },
      'slot-v3t7-split-3': {
        slotId: 'slot-v3t7-split-3',
        artworkId: 'art-ani-01',
        title: 'Shinjuku 2099 Rain Horizon',
        imageUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-v3t7-hero',
        panelIndex: 2,
        physicalSize: 'A4',
        price: 349,
      },
      'slot-v3t7-right-top': {
        slotId: 'slot-v3t7-right-top',
        artworkId: 'art-ani-03',
        title: '勇気 (Courage) Sumi-e Ink',
        imageUrl:
          'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 149,
      },
      'slot-v3t7-right-bot': {
        slotId: 'slot-v3t7-right-bot',
        artworkId: 'art-ani-01',
        title: 'Shinjuku 2099 Rain Horizon',
        imageUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 349,
      },
    },
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
    layoutSlug: 'hybrid-vertical4-monolith',
    physicalPrintCount: 8,
    coverageLabel: '66 × 64 cm',
    accentColor: '#00E676',
    previewImageUrl:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
    badge: 'Vertical Monolith',
    selections: {
      'slot-v4m8-left-top': {
        slotId: 'slot-v4m8-left-top',
        artworkId: 'art-gam-02',
        title: 'Ghost Ronin Katana Stance',
        imageUrl:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 199,
      },
      'slot-v4m8-left-bot': {
        slotId: 'slot-v4m8-left-bot',
        artworkId: 'art-gam-03',
        title: 'PRESS START / INSERT COIN',
        imageUrl:
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 149,
      },
      'slot-v4m8-split-1': {
        slotId: 'slot-v4m8-split-1',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-v4m8-hero',
        panelIndex: 0,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-v4m8-split-2': {
        slotId: 'slot-v4m8-split-2',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-v4m8-hero',
        panelIndex: 1,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-v4m8-split-3': {
        slotId: 'slot-v4m8-split-3',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-v4m8-hero',
        panelIndex: 2,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-v4m8-split-4': {
        slotId: 'slot-v4m8-split-4',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-v4m8-hero',
        panelIndex: 3,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-v4m8-right-top': {
        slotId: 'slot-v4m8-right-top',
        artworkId: 'art-gam-04',
        title: 'Mechanical Key Switch Patent Art',
        imageUrl:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 149,
      },
      'slot-v4m8-right-bot': {
        slotId: 'slot-v4m8-right-bot',
        artworkId: 'art-gam-04',
        title: 'Mechanical Key Switch Patent Art',
        imageUrl:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 149,
      },
    },
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
    layoutSlug: 'hybrid-stepped-triptych-quadwing',
    physicalPrintCount: 9,
    coverageLabel: '81 × 73 cm',
    accentColor: '#2979FF',
    previewImageUrl:
      'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
    badge: 'Salon Enclave',
    selections: {
      'slot-stq9-left-top': {
        slotId: 'slot-stq9-left-top',
        artworkId: 'art-dc-02',
        title: 'Vengeance in the Shadows',
        imageUrl:
          'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 199,
      },
      'slot-stq9-left-bot': {
        slotId: 'slot-stq9-left-bot',
        artworkId: 'art-dc-03',
        title: 'Why So Serious Monochrome',
        imageUrl:
          'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 149,
      },
      'slot-stq9-top-a4': {
        slotId: 'slot-stq9-top-a4',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 349,
      },
      'slot-stq9-split-1': {
        slotId: 'slot-stq9-split-1',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-stq9-hero',
        panelIndex: 0,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-stq9-split-2': {
        slotId: 'slot-stq9-split-2',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-stq9-hero',
        panelIndex: 1,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-stq9-split-3': {
        slotId: 'slot-stq9-split-3',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-stq9-hero',
        panelIndex: 2,
        physicalSize: 'CUSTOM',
        price: 349,
      },
      'slot-stq9-bot-a4': {
        slotId: 'slot-stq9-bot-a4',
        artworkId: 'art-dc-04',
        title: 'Fortress of Solitude Monolith',
        imageUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 199,
      },
      'slot-stq9-right-top': {
        slotId: 'slot-stq9-right-top',
        artworkId: 'art-dc-01',
        title: 'The Dark Knight: Gotham Watchtower',
        imageUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-stq9-right-bot': {
        slotId: 'slot-stq9-right-bot',
        artworkId: 'art-dc-02',
        title: 'Vengeance in the Shadows',
        imageUrl:
          'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 199,
      },
    },
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
    layoutSlug: 'hybrid-grid2x2-windowpane',
    physicalPrintCount: 8,
    coverageLabel: '89 × 76 cm',
    accentColor: '#8D6E63',
    previewImageUrl:
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1800&q=85',
    badge: 'Surrounded Salon',
    selections: {
      'slot-g2w8-top-a4': {
        slotId: 'slot-g2w8-top-a4',
        artworkId: 'art-min-01',
        title: 'Bauhaus Arch Composition No. 7',
        imageUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 349,
      },
      'slot-g2w8-left-a4': {
        slotId: 'slot-g2w8-left-a4',
        artworkId: 'art-min-02',
        title: 'Brutalist Steps in Morning Mist',
        imageUrl:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 199,
      },
      'slot-g2w8-split-1': {
        slotId: 'slot-g2w8-split-1',
        artworkId: 'art-min-01',
        title: 'Bauhaus Arch Composition No. 7',
        imageUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g2w8-hero',
        panelIndex: 0,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-g2w8-split-2': {
        slotId: 'slot-g2w8-split-2',
        artworkId: 'art-min-01',
        title: 'Bauhaus Arch Composition No. 7',
        imageUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g2w8-hero',
        panelIndex: 1,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-g2w8-split-3': {
        slotId: 'slot-g2w8-split-3',
        artworkId: 'art-min-01',
        title: 'Bauhaus Arch Composition No. 7',
        imageUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g2w8-hero',
        panelIndex: 2,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-g2w8-split-4': {
        slotId: 'slot-g2w8-split-4',
        artworkId: 'art-min-01',
        title: 'Bauhaus Arch Composition No. 7',
        imageUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-g2w8-hero',
        panelIndex: 3,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-g2w8-right-a4': {
        slotId: 'slot-g2w8-right-a4',
        artworkId: 'art-min-01',
        title: 'Bauhaus Arch Composition No. 7',
        imageUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 349,
      },
      'slot-g2w8-bot-a4': {
        slotId: 'slot-g2w8-bot-a4',
        artworkId: 'art-min-02',
        title: 'Brutalist Steps in Morning Mist',
        imageUrl:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A4',
        price: 199,
      },
    },
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
    layoutSlug: 'hybrid-classic3-cinema-a3',
    physicalPrintCount: 7,
    coverageLabel: '125 × 44 cm',
    accentColor: '#FF1744',
    previewImageUrl:
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1800&q=85',
    badge: 'Grand Triptych',
    selections: {
      'slot-c3a7-left-top': {
        slotId: 'slot-c3a7-left-top',
        artworkId: 'art-f1-02',
        title: 'Autodromo Nazionale Monza 350 KM/H',
        imageUrl:
          'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 199,
      },
      'slot-c3a7-left-bot': {
        slotId: 'slot-c3a7-left-bot',
        artworkId: 'art-f1-03',
        title: 'Visor Focus: 300 Milliseconds',
        imageUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 149,
      },
      'slot-c3a7-split-1': {
        slotId: 'slot-c3a7-split-1',
        artworkId: 'art-f1-01',
        title: 'Grand Prix de Monaco: Lowes Hairpin',
        imageUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c3a7-hero',
        panelIndex: 0,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-c3a7-split-2': {
        slotId: 'slot-c3a7-split-2',
        artworkId: 'art-f1-01',
        title: 'Grand Prix de Monaco: Lowes Hairpin',
        imageUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c3a7-hero',
        panelIndex: 1,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-c3a7-split-3': {
        slotId: 'slot-c3a7-split-3',
        artworkId: 'art-f1-01',
        title: 'Grand Prix de Monaco: Lowes Hairpin',
        imageUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-c3a7-hero',
        panelIndex: 2,
        physicalSize: 'A3',
        price: 349,
      },
      'slot-c3a7-right-top': {
        slotId: 'slot-c3a7-right-top',
        artworkId: 'art-f1-03',
        title: 'Visor Focus: 300 Milliseconds',
        imageUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 149,
      },
      'slot-c3a7-right-bot': {
        slotId: 'slot-c3a7-right-bot',
        artworkId: 'art-f1-01',
        title: 'Grand Prix de Monaco: Lowes Hairpin',
        imageUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 349,
      },
    },
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
    layoutSlug: 'hybrid-vertical5-spire',
    physicalPrintCount: 11,
    coverageLabel: '47 × 57 cm',
    accentColor: '#D500F9',
    previewImageUrl:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
    badge: 'High-Rise Spire',
    selections: {
      'slot-v5s11-left-1': {
        slotId: 'slot-v5s11-left-1',
        artworkId: 'art-gam-02',
        title: 'Ghost Ronin Katana Stance',
        imageUrl:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 199,
      },
      'slot-v5s11-left-2': {
        slotId: 'slot-v5s11-left-2',
        artworkId: 'art-gam-03',
        title: 'PRESS START / INSERT COIN',
        imageUrl:
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 149,
      },
      'slot-v5s11-left-3': {
        slotId: 'slot-v5s11-left-3',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-v5s11-split-1': {
        slotId: 'slot-v5s11-split-1',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-v5s11-hero',
        panelIndex: 0,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-v5s11-split-2': {
        slotId: 'slot-v5s11-split-2',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-v5s11-hero',
        panelIndex: 1,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-v5s11-split-3': {
        slotId: 'slot-v5s11-split-3',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-v5s11-hero',
        panelIndex: 2,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-v5s11-split-4': {
        slotId: 'slot-v5s11-split-4',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-v5s11-hero',
        panelIndex: 3,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-v5s11-split-5': {
        slotId: 'slot-v5s11-split-5',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: 'split-v5s11-hero',
        panelIndex: 4,
        physicalSize: 'A6',
        price: 349,
      },
      'slot-v5s11-right-1': {
        slotId: 'slot-v5s11-right-1',
        artworkId: 'art-gam-04',
        title: 'Mechanical Key Switch Patent Art',
        imageUrl:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 149,
      },
      'slot-v5s11-right-2': {
        slotId: 'slot-v5s11-right-2',
        artworkId: 'art-gam-01',
        title: 'Night City Overdrive Panorama',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A5',
        price: 349,
      },
      'slot-v5s11-right-3': {
        slotId: 'slot-v5s11-right-3',
        artworkId: 'art-gam-02',
        title: 'Ghost Ronin Katana Stance',
        imageUrl:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=85',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
        splitGroupId: null,
        panelIndex: null,
        physicalSize: 'A6',
        price: 199,
      },
    },
  },
];

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
