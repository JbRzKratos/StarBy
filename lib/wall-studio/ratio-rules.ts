import type { PosterArtworkData, WallSlot, WallLayoutData, PosterAspectRatio } from './types';

// Exact filenames for specialized split artwork categories
const STEPPED_3_FILENAMES = new Set([
  '3 Split Poster.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_6ab69d04-87e0-44e5-81be-be7a90302496_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_ac21a646-6e09-4c8f-a023-2d83dd1a4777_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_be093dbe-ae15-4afb-97fd-ffcfd78b1cdc_3.webp',
]);

const STEPPED_5_FILENAMES = new Set([
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_c500f4a2-3ca8-471c-86fb-5b78ea8ecc81_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_ef9c2920-e7ec-4d5d-8ef9-638716a339a0_3.webp',
]);

const VERTICAL_TOTEM_FILENAMES = new Set([
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_0467d325-ba0b-418b-ab83-3bf9bf5366c3_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_554cf690-7426-4f50-bffe-662919a384d4_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_5fdcd808-60a4-4883-8404-e8365a139b7f_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_f207d352-eac7-448d-8cbb-316249c59d74_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_fae96407-9882-40c4-88f9-4bbd5a06d434_3.webp',
]);

const GRID_FILENAMES = new Set([
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_0055e015-e7af-498e-9ab5-9df129ea9903_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_0bcd7e53-3c88-48c6-a4ab-e33428daba12_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_1e308c45-07b5-430a-922b-10d00800e03e_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_2e482216-5195-4826-bbf0-e35c334e56c1_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_39003d15-4b4d-4e81-92b2-bc69e2ba9518_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_5899a9ef-29d2-4340-8649-c0426f0a0739_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_739fcda2-456a-4fbe-b140-9018138b2f5a_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_87b422a5-0502-4254-a066-f733dc0af620_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_a94469bc-11fa-4c89-bbcb-48f8dfaec9e7_1.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_b21b5b01-3d39-4567-bd5d-5e4c9527da8c_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_bc263fe9-879b-4dc1-9784-1ad565dc07b0_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_c184aa54-cafc-4c89-9e27-f2018bd55fed_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_e3c3d4af-921f-4639-a653-f4759c6485a7_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_e69997dd-3599-471a-ae39-34d73389a95c_1.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_ea843d67-c173-4556-bfe9-fe34fcc25182_3.webp',
  'Fregoro_Studios_Extend_the_existing_background_into_the_empty_ecff18b4-fb76-4237-9b23-996bfdfef59f_3.webp',
]);

/**
 * Returns the exact aspect ratio category for a given artwork.
 * Uses artwork.aspectRatio if already present, otherwise determines it from filename/metadata.
 */
export function getArtworkAspectRatio(artwork: PosterArtworkData): PosterAspectRatio {
  if (artwork.aspectRatio) {
    return artwork.aspectRatio;
  }

  const filename = artwork.imageUrl ? artwork.imageUrl.split('/').pop() || '' : '';

  if (STEPPED_3_FILENAMES.has(filename)) {
    return '19:11';
  }
  if (STEPPED_5_FILENAMES.has(filename)) {
    return '44:21';
  }
  if (
    VERTICAL_TOTEM_FILENAMES.has(filename) ||
    (artwork.isSplitCompatible && artwork.orientation === 'portrait')
  ) {
    return '4:17';
  }
  if (GRID_FILENAMES.has(filename)) {
    return '17:16';
  }
  if (artwork.isSplitCompatible && artwork.orientation === 'landscape') {
    return '17:8';
  }
  if (artwork.orientation === 'landscape') {
    return '7:5';
  }
  return '5:7';
}

export interface SlotPosterRule {
  mode:
    | 'single-portrait'
    | 'single-landscape'
    | 'stepped-3'
    | 'stepped-5'
    | 'classic-horizontal'
    | 'grid-split'
    | 'vertical-split';
  strict: boolean; // When true, ONLY primaryRatios are shown (nothing else)
  primaryRatios: PosterAspectRatio[];
  secondaryRatios: PosterAspectRatio[];
  badgeLabel: string;
  helperText: string;
}

/**
 * Computes the aspect ratio requirement and strict matching rule for a specific slot on a layout.
 *
 * Rules:
 * 1. Normal vertical poster (portrait): ONLY 5:7 portrait single prints. Rest should NOT be shown.
 * 2. Normal horizontal poster (landscape): ONLY 7:5 landscape single prints. Rest should NOT be shown.
 * 3. Vertical split poster: ONLY 4:17 vertical split posters. Rest should NOT be shown.
 * 4. Horizontal classic split poster: ONLY 17:8 horizontal split posters. Rest should NOT be shown.
 * 5. Horizontal grid/matrix split poster: ONLY 17:16 & 17:8 split posters. Rest should NOT be shown.
 * 6. 5-Panel Stepped split poster: ONLY 44:21 stepped split posters. Rest should NOT be shown.
 * 7. 3-Panel Stepped split poster: ONLY 19:11 stepped split posters. Rest should NOT be shown.
 */
export function getSlotPosterRule(slot: WallSlot, layout: WallLayoutData): SlotPosterRule {
  // ─── 1. INDIVIDUAL NORMAL SLOTS (A3, A4, A5, A6, 13x19) ───
  if (!slot.splitGroupId) {
    if (slot.orientation === 'portrait') {
      return {
        mode: 'single-portrait',
        strict: true,
        primaryRatios: ['5:7'],
        secondaryRatios: [],
        badgeLabel: '5:7 Portrait Only',
        helperText: 'Showing portrait single prints (5:7 ratio) exclusively for this frame.',
      };
    } else {
      return {
        mode: 'single-landscape',
        strict: true,
        primaryRatios: ['7:5'],
        secondaryRatios: [],
        badgeLabel: '7:5 Landscape Only',
        helperText: 'Showing landscape single prints (7:5 ratio) exclusively for this frame.',
      };
    }
  }

  // ─── 2. SPLIT GROUP SLOTS ───
  const splitGroup = layout.splitGroups?.find((g) => g.splitGroupId === slot.splitGroupId);
  const layoutSlug = layout.slug.toLowerCase();
  const groupName = (splitGroup?.name || '').toLowerCase();

  // Case A: Stepped Split Posters
  const isStepped =
    !!splitGroup?.staggered ||
    groupName.includes('stepped') ||
    layoutSlug.includes('stepped');

  if (isStepped) {
    if (splitGroup?.panelCount === 5) {
      return {
        mode: 'stepped-5',
        strict: true,
        primaryRatios: ['44:21'],
        secondaryRatios: [],
        badgeLabel: '5-Panel Stepped Split (44:21 Only)',
        helperText: 'Showing 5-panel stepped split posters (44:21 ratio) exclusively.',
      };
    }
    // Default stepped is 3-panel
    return {
      mode: 'stepped-3',
      strict: true,
      primaryRatios: ['19:11'],
      secondaryRatios: [],
      badgeLabel: '3-Panel Stepped Split (19:11 Only)',
      helperText: 'Showing 3-panel stepped split posters (19:11 ratio) exclusively.',
    };
  }

  // Case B: Vertical Stacked Split Totems (Totem, Monolith, Spire, Tower)
  const isVerticalSplit =
    layoutSlug.includes('vertical') ||
    groupName.includes('vertical') ||
    layoutSlug.includes('totem') ||
    layoutSlug.includes('monolith') ||
    layoutSlug.includes('spire');

  if (isVerticalSplit) {
    return {
      mode: 'vertical-split',
      strict: true,
      primaryRatios: ['4:17'],
      secondaryRatios: [],
      badgeLabel: 'Vertical Split (4:17 Only)',
      helperText: 'Showing vertical split posters (4:17 ratio) exclusively for this vertical totem.',
    };
  }

  // Case C: Grid / Matrix Split Posters
  const isGrid =
    layoutSlug.includes('grid') ||
    groupName.includes('grid') ||
    groupName.includes('mosaic') ||
    groupName.includes('matrix') ||
    groupName.includes('windowpane');

  if (isGrid) {
    return {
      mode: 'grid-split',
      strict: true,
      primaryRatios: ['17:16', '17:8'],
      secondaryRatios: [],
      badgeLabel: 'Grid Split (17:16 & 17:8 Only)',
      helperText: 'Showing continuous grid and panoramic split artworks exclusively.',
    };
  }

  // Case D: Classic Horizontal Split Posters (3-piece, 4-piece, 5-piece widescreen splits)
  return {
    mode: 'classic-horizontal',
    strict: true,
    primaryRatios: ['17:8'],
    secondaryRatios: [],
    badgeLabel: 'Horizontal Split (17:8 Only)',
    helperText: 'Showing horizontal panoramic split posters (17:8 ratio) exclusively.',
  };
}

/**
 * Checks whether an artwork is strictly eligible to be shown in a given slot under layout rules.
 * Enforces:
 * - Vertical split slot -> ONLY 4:17 vertical split posters (isSplitCompatible: true).
 * - Horizontal split slot -> ONLY 17:8 / 17:16 / 19:11 / 44:21 split posters (isSplitCompatible: true).
 * - Normal vertical slot -> ONLY 5:7 portrait single posters (isSplitCompatible: false).
 * - Normal horizontal slot -> ONLY 7:5 landscape single posters (isSplitCompatible: false).
 */
export function isArtworkCompatibleWithSlot(
  artwork: PosterArtworkData,
  slot: WallSlot,
  layout: WallLayoutData,
): boolean {
  const rule = getSlotPosterRule(slot, layout);
  const ratio = getArtworkAspectRatio(artwork);

  // If slot is a split slot: artwork MUST be split compatible
  if (slot.splitGroupId && !artwork.isSplitCompatible) {
    return false;
  }

  // If slot is a normal individual slot: artwork must NOT be a split poster
  if (!slot.splitGroupId && artwork.isSplitCompatible) {
    return false;
  }

  // Orientation check for normal slots
  if (!slot.splitGroupId) {
    if (slot.orientation === 'portrait' && artwork.orientation !== 'portrait') {
      return false;
    }
    if (slot.orientation === 'landscape' && artwork.orientation !== 'landscape') {
      return false;
    }
  }

  if (rule.strict) {
    return rule.primaryRatios.includes(ratio);
  }
  return rule.primaryRatios.includes(ratio) || rule.secondaryRatios.includes(ratio);
}

/**
 * Filters and ranks the catalog for display in the right panel artwork picker drawer.
 * Strictly respects aspect-ratio boundaries (rest should NOT be shown) and sorts primary-fit ratios to the top.
 */
export function filterAndRankArtworksForSlot(
  artworks: PosterArtworkData[],
  slot: WallSlot,
  layout: WallLayoutData,
  themeSlug?: string,
  searchQuery?: string,
): PosterArtworkData[] {
  // 1. Strictly filter by slot compatibility
  let list = artworks.filter((art) => isArtworkCompatibleWithSlot(art, slot, layout));

  // 2. Filter by Theme if selected
  if (themeSlug && themeSlug !== 'all') {
    list = list.filter((a) => a.themeSlug === themeSlug);
  }

  // 3. Filter by Search Query
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.themeSlug.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  // 4. Sort with Priority:
  const rule = getSlotPosterRule(slot, layout);
  return [...list].sort((a, b) => {
    const ratioA = getArtworkAspectRatio(a);
    const ratioB = getArtworkAspectRatio(b);

    const aIsPrimary = rule.primaryRatios.includes(ratioA);
    const bIsPrimary = rule.primaryRatios.includes(ratioB);

    if (aIsPrimary && !bIsPrimary) return -1;
    if (!aIsPrimary && bIsPrimary) return 1;

    // Favor hero compatible for hero slots
    if (slot.slotType === 'hero' || slot.slotType === 'hero-panel') {
      if (a.heroCompatible && !b.heroCompatible) return -1;
      if (!a.heroCompatible && b.heroCompatible) return 1;
    }

    return 0;
  });
}
