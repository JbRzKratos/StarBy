import type { WallLayoutData, WallSlot, WallSplitGroup, PosterSize, SlotOrientation } from '../lib/wall-studio/types';

interface SlotSpec {
  id: string;
  slotType: 'hero-panel' | 'accent' | 'support' | 'hero';
  size: PosterSize;
  widthMm: number;
  heightMm: number;
  orientation: SlotOrientation;
  xMm: number;
  yMm: number;
  label: string;
  splitGroupId?: string;
  panelIndex?: number;
}

interface LayoutDef {
  id: string;
  slug: string;
  name: string;
  description: string;
  badge: string;
  category: 'hybrid';
  basePrice: number;
  compareAtPrice: number;
  recommendedRoom: string;
  recommendedWallWidth: string;
  recommendedThemes: string[];
  slots: SlotSpec[];
  splitGroup: {
    splitGroupId: string;
    name: string;
    panelCount: number;
    orientation: SlotOrientation;
    physicalSize: PosterSize;
    slotIds: string[];
    staggered?: boolean;
  };
  sortOrder: number;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function compileLayout(def: LayoutDef, padX = 60, padY = 60): WallLayoutData {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const s of def.slots) {
    minX = Math.min(minX, s.xMm);
    maxX = Math.max(maxX, s.xMm + s.widthMm);
    minY = Math.min(minY, s.yMm);
    maxY = Math.max(maxY, s.yMm + s.heightMm);
  }

  const artWidthMm = maxX - minX;
  const artHeightMm = maxY - minY;
  const wallWidthMm = Math.round(artWidthMm + padX * 2);
  const wallHeightMm = Math.round(artHeightMm + padY * 2);

  const offsetX = padX - minX;
  const offsetY = padY - minY;

  const wallSlots: WallSlot[] = def.slots.map((s) => ({
    id: s.id,
    slotType: s.slotType,
    x: round4((s.xMm + offsetX) / wallWidthMm),
    y: round4((s.yMm + offsetY) / wallHeightMm),
    width: round4(s.widthMm / wallWidthMm),
    height: round4(s.heightMm / wallHeightMm),
    size: s.size,
    physicalWidthMm: s.widthMm,
    physicalHeightMm: s.heightMm,
    orientation: s.orientation,
    required: true,
    label: s.label,
    splitGroupId: s.splitGroupId,
    panelIndex: s.panelIndex,
  }));

  const splitGroups: WallSplitGroup[] = [
    {
      splitGroupId: def.splitGroup.splitGroupId,
      name: def.splitGroup.name,
      panelCount: def.splitGroup.panelCount,
      orientation: def.splitGroup.orientation,
      physicalSize: def.splitGroup.physicalSize,
      slotIds: def.splitGroup.slotIds,
      staggered: def.splitGroup.staggered,
    },
  ];

  const coverageW = Math.round(artWidthMm / 10);
  const coverageH = Math.round(artHeightMm / 10);

  return {
    id: def.id,
    slug: def.slug,
    name: def.name,
    category: 'hybrid',
    description: def.description,
    badge: def.badge,
    wallWidthMm,
    wallHeightMm,
    coverageLabel: `${coverageW} × ${coverageH} cm`,
    physicalPrintCount: def.slots.length,
    logicalArtworkCount: def.slots.length - def.splitGroup.panelCount + 1,
    recommendedRoom: def.recommendedRoom,
    recommendedWallWidth: def.recommendedWallWidth,
    recommendedThemes: def.recommendedThemes,
    basePrice: def.basePrice,
    compareAtPrice: def.compareAtPrice,
    slots: wallSlots,
    splitGroups,
    version: 1,
    sortOrder: def.sortOrder,
    published: true,
  };
}

export function generateAllCatalogHybridLayouts(): WallLayoutData[] {
  const layouts: WallLayoutData[] = [];
  const gap = 15; // standard museum gap in mm
  const splitGap = 13; // 0.5 inch gap between split panels (reduced from 1 inch)

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. hybrid-stepped-triptych-flank-5: Stepped Triptych Dual-Pillar
  // Center: 3-Panel Stepped Split (6x9", 6x11", 6x9" -> 152x229, 152x279, 152x229)
  // Left & Right: A4 Vertical (210x297)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const splitW = 152;
    const splitH1 = 229;
    const splitH2 = 279;
    const a4W = 210;
    const a4H = 297;

    // A4 height is 297. Stepped center max height is 279.
    // Center stepped panel Y offset: (297 - 279) / 2 = 9mm.
    // Side stepped panels Y offset: 9 + (279 - 229) / 2 = 34mm.
    const centerY = (a4H - splitH2) / 2;
    const sideY = centerY + (splitH2 - splitH1) / 2;

    const leftA4X = 0;
    const s1X = a4W + gap;
    const s2X = s1X + splitW + splitGap;
    const s3X = s2X + splitW + splitGap;
    const rightA4X = s3X + splitW + gap;

    layouts.push(
      compileLayout({
        id: 'hybrid-stepped-triptych-flank-5',
        slug: 'hybrid-stepped-triptych-flank',
        name: 'Stepped Triptych Dual-Pillar',
        description: 'Iconic 3-panel stepped split poster (6×9", 6×11", 6×9") flanked by dual vertical A4 museum pillars.',
        badge: 'Stepped Split Combo',
        category: 'hybrid',
        basePrice: 1699,
        compareAtPrice: 2299,
        recommendedRoom: 'Study / Bedroom / Office Gallery',
        recommendedWallWidth: '1.4 – 1.8 m',
        recommendedThemes: ['DC', 'Marvel', 'Anime', 'Gaming', 'Cars'],
        sortOrder: 1,
        slots: [
          {
            id: 'slot-stf5-left-a4',
            slotType: 'accent',
            size: 'A4',
            widthMm: a4W,
            heightMm: a4H,
            orientation: 'portrait',
            xMm: leftA4X,
            yMm: 0,
            label: 'Left Pillar (A4)',
          },
          {
            id: 'slot-stf5-split-1',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: splitW,
            heightMm: splitH1,
            orientation: 'portrait',
            xMm: s1X,
            yMm: sideY,
            label: 'Stepped Left 6×9" (152×229mm)',
            splitGroupId: 'split-stf5-hero',
            panelIndex: 0,
          },
          {
            id: 'slot-stf5-split-2',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: splitW,
            heightMm: splitH2,
            orientation: 'portrait',
            xMm: s2X,
            yMm: centerY,
            label: 'Stepped Center 6×11" (152×279mm)',
            splitGroupId: 'split-stf5-hero',
            panelIndex: 1,
          },
          {
            id: 'slot-stf5-split-3',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: splitW,
            heightMm: splitH1,
            orientation: 'portrait',
            xMm: s3X,
            yMm: sideY,
            label: 'Stepped Right 6×9" (152×229mm)',
            splitGroupId: 'split-stf5-hero',
            panelIndex: 2,
          },
          {
            id: 'slot-stf5-right-a4',
            slotType: 'accent',
            size: 'A4',
            widthMm: a4W,
            heightMm: a4H,
            orientation: 'portrait',
            xMm: rightA4X,
            yMm: 0,
            label: 'Right Pillar (A4)',
          },
        ],
        splitGroup: {
          splitGroupId: 'split-stf5-hero',
          name: 'Stepped 3-Piece Split Artwork',
          panelCount: 3,
          orientation: 'portrait',
          physicalSize: 'CUSTOM',
          slotIds: ['slot-stf5-split-1', 'slot-stf5-split-2', 'slot-stf5-split-3'],
          staggered: true,
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. hybrid-stepped-triptych-crown-7: Stepped Triptych 13x19 Crown Showcase
  // Center: 3-Panel Stepped Split (width 482mm, height 279mm)
  // Top: 13x19 Horizontal Header (483x330mm) - matches 482mm split width within 1mm!
  // Flanks: Left & Right Vertical A4 (210x297mm)
  // Bottom: Horizontal A4 (297x210mm) centered
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const splitW = 152;
    const splitH1 = 229;
    const splitH2 = 279;
    const splitTotalW = splitW * 3 + splitGap * 2; // 482mm
    const crownW = 483; // 13x19 horizontal (483mm wide x 330mm high)
    const crownH = 330;
    const a4W = 210;
    const a4H = 297;
    const botW = 297; // A4 horizontal
    const botH = 210;

    // Vertical composition:
    // Row 1: Crown (13x19 Horiz) centered above split
    // Row 2: Left A4, Split Center (3 panels), Right A4
    // Row 3: Bottom A4 centered
    const crownY = 0;
    const midY = crownH + gap;
    const splitCenterY = midY + (a4H - splitH2) / 2;
    const splitSideY = splitCenterY + (splitH2 - splitH1) / 2;
    const botY = midY + a4H + gap;

    const leftA4X = 0;
    const splitStartX = a4W + gap;
    const crownX = splitStartX + (splitTotalW - crownW) / 2;
    const s1X = splitStartX;
    const s2X = s1X + splitW + splitGap;
    const s3X = s2X + splitW + splitGap;
    const rightA4X = splitStartX + splitTotalW + gap;
    const botX = splitStartX + (splitTotalW - botW) / 2;

    layouts.push(
      compileLayout({
        id: 'hybrid-stepped-triptych-crown-7',
        slug: 'hybrid-stepped-triptych-crown',
        name: 'Stepped Triptych 13×19 Crown Showcase',
        description: 'Continuous 3-panel stepped split crowned by an expansive 13×19" panorama header and framed with A4 prints.',
        badge: 'Crown Showcase',
        category: 'hybrid',
        basePrice: 2499,
        compareAtPrice: 3399,
        recommendedRoom: 'Living Room Feature Wall / Entertainment Area',
        recommendedWallWidth: '1.8 – 2.4 m',
        recommendedThemes: ['Cars', 'Marvel', 'DC', 'Cinematic', 'Gaming'],
        sortOrder: 2,
        slots: [
          {
            id: 'slot-stc7-crown',
            slotType: 'hero',
            size: '13x19',
            widthMm: crownW,
            heightMm: crownH,
            orientation: 'landscape',
            xMm: crownX,
            yMm: crownY,
            label: 'Panorama Header Crown (13×19")',
          },
          {
            id: 'slot-stc7-left-a4',
            slotType: 'accent',
            size: 'A4',
            widthMm: a4W,
            heightMm: a4H,
            orientation: 'portrait',
            xMm: leftA4X,
            yMm: midY,
            label: 'Left Flank (A4)',
          },
          {
            id: 'slot-stc7-split-1',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: splitW,
            heightMm: splitH1,
            orientation: 'portrait',
            xMm: s1X,
            yMm: splitSideY,
            label: 'Stepped Left 6×9" (152×229mm)',
            splitGroupId: 'split-stc7-hero',
            panelIndex: 0,
          },
          {
            id: 'slot-stc7-split-2',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: splitW,
            heightMm: splitH2,
            orientation: 'portrait',
            xMm: s2X,
            yMm: splitCenterY,
            label: 'Stepped Center 6×11" (152×279mm)',
            splitGroupId: 'split-stc7-hero',
            panelIndex: 1,
          },
          {
            id: 'slot-stc7-split-3',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: splitW,
            heightMm: splitH1,
            orientation: 'portrait',
            xMm: s3X,
            yMm: splitSideY,
            label: 'Stepped Right 6×9" (152×229mm)',
            splitGroupId: 'split-stc7-hero',
            panelIndex: 2,
          },
          {
            id: 'slot-stc7-right-a4',
            slotType: 'accent',
            size: 'A4',
            widthMm: a4W,
            heightMm: a4H,
            orientation: 'portrait',
            xMm: rightA4X,
            yMm: midY,
            label: 'Right Flank (A4)',
          },
          {
            id: 'slot-stc7-bot-a4',
            slotType: 'accent',
            size: 'A4',
            widthMm: botW,
            heightMm: botH,
            orientation: 'landscape',
            xMm: botX,
            yMm: botY,
            label: 'Lower Accent (A4)',
          },
        ],
        splitGroup: {
          splitGroupId: 'split-stc7-hero',
          name: 'Stepped 3-Piece Center Split',
          panelCount: 3,
          orientation: 'portrait',
          physicalSize: 'CUSTOM',
          slotIds: ['slot-stc7-split-1', 'slot-stc7-split-2', 'slot-stc7-split-3'],
          staggered: true,
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. hybrid-stepped-wave-flank-9: Apex 5-Panel Stepped Wave Flank
  // Center: 5-Panel Stepped Wave (Reduced 50%: 102x191, 102x229, 102x267, 102x229, 102x191)
  // Left Flank: Stack of 2 A5 Horizontal (210x148)
  // Right Flank: Stack of 2 A5 Horizontal (210x148)
  // Stack height: 148 * 2 + 15 = 311mm. Center max height = 267mm.
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const pW = 102;
    const h1 = 191;
    const h2 = 229;
    const h3 = 267;
    const a5W = 210;
    const a5H = 148;
    const flankStackH = a5H * 2 + gap; // 311mm

    const flankLeftX = 0;
    const centerStartX = a5W + gap;
    const s1X = centerStartX;
    const s2X = s1X + pW + splitGap;
    const s3X = s2X + pW + splitGap;
    const s4X = s3X + pW + splitGap;
    const s5X = s4X + pW + splitGap;
    const flankRightX = s5X + pW + gap;

    // Center wave vertically in 311mm stack
    const waveBaseY = (flankStackH - h3) / 2; // ~22mm
    const y3 = waveBaseY;
    const y2 = waveBaseY + (h3 - h2) / 2;
    const y4 = y2;
    const y1 = waveBaseY + (h3 - h1) / 2;
    const y5 = y1;

    layouts.push(
      compileLayout({
        id: 'hybrid-stepped-wave-flank-9',
        slug: 'hybrid-stepped-wave-flank',
        name: 'Apex 5-Panel Stepped Wave Flank',
        description: 'Signature 5-panel stepped wave split (reduced 50%) framed by dual stacked horizontal A5 gallery wings.',
        badge: 'Stepped 5-Panel Signature',
        category: 'hybrid',
        basePrice: 2299,
        compareAtPrice: 3199,
        recommendedRoom: 'Living Room Feature Wall / Bedroom Headboard',
        recommendedWallWidth: '1.6 – 2.2 m',
        recommendedThemes: ['Anime', 'Marvel', 'DC', 'Gaming', 'Space'],
        sortOrder: 3,
        slots: [
          {
            id: 'slot-swf9-left-top',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'landscape',
            xMm: flankLeftX,
            yMm: 0,
            label: 'Left Upper Wing (A5)',
          },
          {
            id: 'slot-swf9-left-bot',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'landscape',
            xMm: flankLeftX,
            yMm: a5H + gap,
            label: 'Left Lower Wing (A5)',
          },
          {
            id: 'slot-swf9-split-1',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: pW,
            heightMm: h1,
            orientation: 'portrait',
            xMm: s1X,
            yMm: y1,
            label: 'Wave Panel 1/5 (102×191mm)',
            splitGroupId: 'split-swf9-hero',
            panelIndex: 0,
          },
          {
            id: 'slot-swf9-split-2',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: pW,
            heightMm: h2,
            orientation: 'portrait',
            xMm: s2X,
            yMm: y2,
            label: 'Wave Panel 2/5 (102×229mm)',
            splitGroupId: 'split-swf9-hero',
            panelIndex: 1,
          },
          {
            id: 'slot-swf9-split-3',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: pW,
            heightMm: h3,
            orientation: 'portrait',
            xMm: s3X,
            yMm: y3,
            label: 'Wave Panel 3/5 Apex (102×267mm)',
            splitGroupId: 'split-swf9-hero',
            panelIndex: 2,
          },
          {
            id: 'slot-swf9-split-4',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: pW,
            heightMm: h2,
            orientation: 'portrait',
            xMm: s4X,
            yMm: y4,
            label: 'Wave Panel 4/5 (102×229mm)',
            splitGroupId: 'split-swf9-hero',
            panelIndex: 3,
          },
          {
            id: 'slot-swf9-split-5',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: pW,
            heightMm: h1,
            orientation: 'portrait',
            xMm: s5X,
            yMm: y5,
            label: 'Wave Panel 5/5 (102×191mm)',
            splitGroupId: 'split-swf9-hero',
            panelIndex: 4,
          },
          {
            id: 'slot-swf9-right-top',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'landscape',
            xMm: flankRightX,
            yMm: 0,
            label: 'Right Upper Wing (A5)',
          },
          {
            id: 'slot-swf9-right-bot',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'landscape',
            xMm: flankRightX,
            yMm: a5H + gap,
            label: 'Right Lower Wing (A5)',
          },
        ],
        splitGroup: {
          splitGroupId: 'split-swf9-hero',
          name: '5-Panel Stepped Wave Split',
          panelCount: 5,
          orientation: 'portrait',
          physicalSize: 'CUSTOM',
          slotIds: [
            'slot-swf9-split-1',
            'slot-swf9-split-2',
            'slot-swf9-split-3',
            'slot-swf9-split-4',
            'slot-swf9-split-5',
          ],
          staggered: true,
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. hybrid-stepped-wave-heritage-11: Stepped Wave Grand 13x19 Heritage
  // Center: 5-Panel Stepped Wave (102x191, 102x229, 102x267, 102x229, 102x191)
  // Flanks: Left & Right Grand 13x19 Vertical (330x483)
  // Top: 2 Horizontal A5 (210x148) above center wave
  // Bottom: 2 Horizontal A5 (210x148) below center wave
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const pW = 102;
    const h1 = 191;
    const h2 = 229;
    const h3 = 267;
    const splitTotalW = pW * 5 + splitGap * 4; // 562mm
    const archW = 330; // 13x19 vertical
    const archH = 483;
    const a5W = 210;
    const a5H = 148;

    // Total width of top row: 210 * 2 + gap = 435mm
    // Center it above the 562mm split:
    const centerStartX = archW + gap;
    const topRowX = centerStartX + (splitTotalW - (a5W * 2 + gap)) / 2;

    const topY = 0;
    const waveYOffset = a5H + gap; // 163mm
    const s1X = centerStartX;
    const s2X = s1X + pW + splitGap;
    const s3X = s2X + pW + splitGap;
    const s4X = s3X + pW + splitGap;
    const s5X = s4X + pW + splitGap;

    const y3 = waveYOffset;
    const y2 = waveYOffset + (h3 - h2) / 2;
    const y4 = y2;
    const y1 = waveYOffset + (h3 - h1) / 2;
    const y5 = y1;

    const botY = waveYOffset + h3 + gap; // 163 + 267 + 15 = 445mm
    // Left and Right 13x19 arch: 483mm high. Centered vertically to total height.
    const totalCenterH = botY + a5H; // 445 + 148 = 593mm
    const archY = (totalCenterH - archH) / 2;
    const archRightX = centerStartX + splitTotalW + gap;

    layouts.push(
      compileLayout({
        id: 'hybrid-stepped-wave-heritage-11',
        slug: 'hybrid-stepped-wave-heritage',
        name: 'Stepped Wave Grand 13×19 Heritage',
        description: 'Imperial 11-print showcase combining a 5-panel stepped wave with flagship 13×19" anchor pillars and A5 horizon frames.',
        badge: 'Flagship Heritage',
        category: 'hybrid',
        basePrice: 3299,
        compareAtPrice: 4499,
        recommendedRoom: 'Grand Living Room / Executive Lounge',
        recommendedWallWidth: '2.0 – 2.6 m',
        recommendedThemes: ['Marvel', 'DC', 'Cars', 'Anime', 'Art'],
        sortOrder: 4,
        slots: [
          {
            id: 'slot-swh11-arch-left',
            slotType: 'hero',
            size: '13x19',
            widthMm: archW,
            heightMm: archH,
            orientation: 'portrait',
            xMm: 0,
            yMm: archY,
            label: 'Left Grand Anchor (13×19")',
          },
          {
            id: 'slot-swh11-top-1',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'landscape',
            xMm: topRowX,
            yMm: topY,
            label: 'Upper Center Left (A5)',
          },
          {
            id: 'slot-swh11-top-2',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'landscape',
            xMm: topRowX + a5W + gap,
            yMm: topY,
            label: 'Upper Center Right (A5)',
          },
          {
            id: 'slot-swh11-split-1',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: pW,
            heightMm: h1,
            orientation: 'portrait',
            xMm: s1X,
            yMm: y1,
            label: 'Wave Panel 1/5 (102×191mm)',
            splitGroupId: 'split-swh11-hero',
            panelIndex: 0,
          },
          {
            id: 'slot-swh11-split-2',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: pW,
            heightMm: h2,
            orientation: 'portrait',
            xMm: s2X,
            yMm: y2,
            label: 'Wave Panel 2/5 (102×229mm)',
            splitGroupId: 'split-swh11-hero',
            panelIndex: 1,
          },
          {
            id: 'slot-swh11-split-3',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: pW,
            heightMm: h3,
            orientation: 'portrait',
            xMm: s3X,
            yMm: y3,
            label: 'Wave Panel 3/5 Apex (102×267mm)',
            splitGroupId: 'split-swh11-hero',
            panelIndex: 2,
          },
          {
            id: 'slot-swh11-split-4',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: pW,
            heightMm: h2,
            orientation: 'portrait',
            xMm: s4X,
            yMm: y4,
            label: 'Wave Panel 4/5 (102×229mm)',
            splitGroupId: 'split-swh11-hero',
            panelIndex: 3,
          },
          {
            id: 'slot-swh11-split-5',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: pW,
            heightMm: h1,
            orientation: 'portrait',
            xMm: s5X,
            yMm: y5,
            label: 'Wave Panel 5/5 (102×191mm)',
            splitGroupId: 'split-swh11-hero',
            panelIndex: 4,
          },
          {
            id: 'slot-swh11-bot-1',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'landscape',
            xMm: topRowX,
            yMm: botY,
            label: 'Lower Center Left (A5)',
          },
          {
            id: 'slot-swh11-bot-2',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'landscape',
            xMm: topRowX + a5W + gap,
            yMm: botY,
            label: 'Lower Center Right (A5)',
          },
          {
            id: 'slot-swh11-arch-right',
            slotType: 'hero',
            size: '13x19',
            widthMm: archW,
            heightMm: archH,
            orientation: 'portrait',
            xMm: archRightX,
            yMm: archY,
            label: 'Right Grand Anchor (13×19")',
          },
        ],
        splitGroup: {
          splitGroupId: 'split-swh11-hero',
          name: '5-Panel Stepped Wave Split',
          panelCount: 5,
          orientation: 'portrait',
          physicalSize: 'CUSTOM',
          slotIds: [
            'slot-swh11-split-1',
            'slot-swh11-split-2',
            'slot-swh11-split-3',
            'slot-swh11-split-4',
            'slot-swh11-split-5',
          ],
          staggered: true,
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. hybrid-grid2x2-heritage-6: Heritage 2x2 Salon with 13x19 Pillars
  // Center: 2x2 Grid Split (4 panels of Vertical A5: 148x210, width 311mm, height 435mm)
  // Flanks: Left & Right Grand 13x19 Vertical (330x483mm)
  // Height match: 435mm vs 483mm is remarkably balanced!
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const pW = 148;
    const pH = 210;
    const gridW = pW * 2 + gap; // 311mm
    const gridH = pH * 2 + gap; // 435mm
    const archW = 330;
    const archH = 483;

    const gridY = (archH - gridH) / 2; // ~24mm
    const gridStartX = archW + gap;
    const archRightX = gridStartX + gridW + gap;

    layouts.push(
      compileLayout({
        id: 'hybrid-grid2x2-heritage-6',
        slug: 'hybrid-grid2x2-heritage',
        name: 'Heritage 2×2 Salon with 13×19 Pillars',
        description: 'Harmonious 2×2 windowpane grid split of A5 panels flanked by dual statement 13×19" vertical posters.',
        badge: 'Curated Salon',
        category: 'hybrid',
        basePrice: 2199,
        compareAtPrice: 2999,
        recommendedRoom: 'Studio / Office / Lounge Wall',
        recommendedWallWidth: '1.6 – 2.0 m',
        recommendedThemes: ['Minimalist', 'Anime', 'Marvel', 'Art', 'Cars'],
        sortOrder: 5,
        slots: [
          {
            id: 'slot-g2h6-arch-left',
            slotType: 'hero',
            size: '13x19',
            widthMm: archW,
            heightMm: archH,
            orientation: 'portrait',
            xMm: 0,
            yMm: 0,
            label: 'Left Pillar (13×19")',
          },
          {
            id: 'slot-g2h6-split-1',
            slotType: 'hero-panel',
            size: 'A5',
            widthMm: pW,
            heightMm: pH,
            orientation: 'portrait',
            xMm: gridStartX,
            yMm: gridY,
            label: 'Grid Panel 1/4 Top-Left (A5)',
            splitGroupId: 'split-g2h6-hero',
            panelIndex: 0,
          },
          {
            id: 'slot-g2h6-split-2',
            slotType: 'hero-panel',
            size: 'A5',
            widthMm: pW,
            heightMm: pH,
            orientation: 'portrait',
            xMm: gridStartX + pW + gap,
            yMm: gridY,
            label: 'Grid Panel 2/4 Top-Right (A5)',
            splitGroupId: 'split-g2h6-hero',
            panelIndex: 1,
          },
          {
            id: 'slot-g2h6-split-3',
            slotType: 'hero-panel',
            size: 'A5',
            widthMm: pW,
            heightMm: pH,
            orientation: 'portrait',
            xMm: gridStartX,
            yMm: gridY + pH + gap,
            label: 'Grid Panel 3/4 Bot-Left (A5)',
            splitGroupId: 'split-g2h6-hero',
            panelIndex: 2,
          },
          {
            id: 'slot-g2h6-split-4',
            slotType: 'hero-panel',
            size: 'A5',
            widthMm: pW,
            heightMm: pH,
            orientation: 'portrait',
            xMm: gridStartX + pW + gap,
            yMm: gridY + pH + gap,
            label: 'Grid Panel 4/4 Bot-Right (A5)',
            splitGroupId: 'split-g2h6-hero',
            panelIndex: 3,
          },
          {
            id: 'slot-g2h6-arch-right',
            slotType: 'hero',
            size: '13x19',
            widthMm: archW,
            heightMm: archH,
            orientation: 'portrait',
            xMm: archRightX,
            yMm: 0,
            label: 'Right Pillar (13×19")',
          },
        ],
        splitGroup: {
          splitGroupId: 'split-g2h6-hero',
          name: '2×2 Continuous Grid Artwork',
          panelCount: 4,
          orientation: 'portrait',
          physicalSize: 'A5',
          slotIds: [
            'slot-g2h6-split-1',
            'slot-g2h6-split-2',
            'slot-g2h6-split-3',
            'slot-g2h6-split-4',
          ],
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. hybrid-grid3x2-panoramic-10: Mosaic 3x2 Grid Gallery
  // Center: 3x2 Grid Split (6 panels of Vertical A6: 105x148, width 339mm, height 308mm)
  // Left: Vertical A4 (210x297)
  // Right: Vertical A4 (210x297)
  // Top: Horizontal A4 (297x210)
  // Bottom: Horizontal A4 (297x210)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const pW = 105;
    const pH = 148;
    const gridCols = 3;
    const gridRows = 2;
    const gridW = pW * gridCols + 12 * (gridCols - 1); // 339mm
    const gridH = pH * gridRows + 12 * (gridRows - 1); // 308mm
    const a4W = 210;
    const a4H = 297;

    const topHeaderW = 297; // A4 landscape
    const topHeaderH = 210;

    const topY = 0;
    const midY = topHeaderH + gap;
    const botY = midY + gridH + gap;

    const leftA4X = 0;
    const centerStartX = a4W + gap;
    const headerX = centerStartX + (gridW - topHeaderW) / 2;
    const rightA4X = centerStartX + gridW + gap;

    const a4MidY = midY + (gridH - a4H) / 2;

    const slots: SlotSpec[] = [
      {
        id: 'slot-g32-top-a4',
        slotType: 'accent',
        size: 'A4',
        widthMm: topHeaderW,
        heightMm: topHeaderH,
        orientation: 'landscape',
        xMm: headerX,
        yMm: topY,
        label: 'Header Banner (A4)',
      },
      {
        id: 'slot-g32-left-a4',
        slotType: 'accent',
        size: 'A4',
        widthMm: a4W,
        heightMm: a4H,
        orientation: 'portrait',
        xMm: leftA4X,
        yMm: a4MidY,
        label: 'Left Flank (A4)',
      },
    ];

    const splitSlotIds: string[] = [];
    let pIdx = 0;
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const id = `slot-g32-split-${r * gridCols + c + 1}`;
        splitSlotIds.push(id);
        slots.push({
          id,
          slotType: 'hero-panel',
          size: 'A6',
          widthMm: pW,
          heightMm: pH,
          orientation: 'portrait',
          xMm: centerStartX + c * (pW + 12),
          yMm: midY + r * (pH + 12),
          label: `Grid Panel ${pIdx + 1}/6 (A6)`,
          splitGroupId: 'split-g32-hero',
          panelIndex: pIdx++,
        });
      }
    }

    slots.push(
      {
        id: 'slot-g32-right-a4',
        slotType: 'accent',
        size: 'A4',
        widthMm: a4W,
        heightMm: a4H,
        orientation: 'portrait',
        xMm: rightA4X,
        yMm: a4MidY,
        label: 'Right Flank (A4)',
      },
      {
        id: 'slot-g32-bot-a4',
        slotType: 'accent',
        size: 'A4',
        widthMm: topHeaderW,
        heightMm: topHeaderH,
        orientation: 'landscape',
        xMm: headerX,
        yMm: botY,
        label: 'Footer Base (A4)',
      }
    );

    layouts.push(
      compileLayout({
        id: 'hybrid-grid3x2-panoramic-10',
        slug: 'hybrid-grid3x2-panoramic',
        name: 'Mosaic 3×2 Grid Gallery',
        description: '6-piece continuous mosaic grid (A6 panels) framed symmetrically by 4 surrounding A4 standard prints.',
        badge: 'Mosaic Enclave',
        category: 'hybrid',
        basePrice: 2199,
        compareAtPrice: 2999,
        recommendedRoom: 'Creative Studio / Media Room',
        recommendedWallWidth: '1.6 – 2.2 m',
        recommendedThemes: ['Gaming', 'Anime', 'Marvel', 'Cinema'],
        sortOrder: 6,
        slots,
        splitGroup: {
          splitGroupId: 'split-g32-hero',
          name: '3×2 Continuous Mosaic Split',
          panelCount: 6,
          orientation: 'portrait',
          physicalSize: 'A6',
          slotIds: splitSlotIds,
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. hybrid-grid3x3-matrix-11: Matrix 3x3 Core with 13x19 Guardians
  // Center: 3x3 Grid Split (9 panels of Vertical A6: 105x148, width 339mm, height 468mm)
  // Left: Grand 13x19 Vertical (330x483)
  // Right: Grand 13x19 Vertical (330x483)
  // Height match: 468mm grid vs 483mm 13x19 is virtually identical (only 15mm difference)!
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const pW = 105;
    const pH = 148;
    const gridCols = 3;
    const gridRows = 3;
    const gGap = 12;
    const gridW = pW * gridCols + gGap * (gridCols - 1); // 339mm
    const gridH = pH * gridRows + gGap * (gridRows - 1); // 468mm
    const archW = 330;
    const archH = 483;

    const gridY = (archH - gridH) / 2; // ~7mm
    const gridStartX = archW + gap;
    const archRightX = gridStartX + gridW + gap;

    const slots: SlotSpec[] = [
      {
        id: 'slot-g33-arch-left',
        slotType: 'hero',
        size: '13x19',
        widthMm: archW,
        heightMm: archH,
        orientation: 'portrait',
        xMm: 0,
        yMm: 0,
        label: 'Left Guardian (13×19")',
      },
    ];

    const splitSlotIds: string[] = [];
    let pIdx = 0;
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const id = `slot-g33-split-${pIdx + 1}`;
        splitSlotIds.push(id);
        slots.push({
          id,
          slotType: 'hero-panel',
          size: 'A6',
          widthMm: pW,
          heightMm: pH,
          orientation: 'portrait',
          xMm: gridStartX + c * (pW + gGap),
          yMm: gridY + r * (pH + gGap),
          label: `Matrix Panel ${pIdx + 1}/9 (A6)`,
          splitGroupId: 'split-g33-hero',
          panelIndex: pIdx++,
        });
      }
    }

    slots.push({
      id: 'slot-g33-arch-right',
      slotType: 'hero',
      size: '13x19',
      widthMm: archW,
      heightMm: archH,
      orientation: 'portrait',
      xMm: archRightX,
      yMm: 0,
      label: 'Right Guardian (13×19")',
    });

    layouts.push(
      compileLayout({
        id: 'hybrid-grid3x3-matrix-11',
        slug: 'hybrid-grid3x3-matrix',
        name: 'Matrix 3×3 Core with 13×19 Guardians',
        description: 'Immersive 9-panel matrix grid split anchored on both wings by towering 13×19" vertical monoliths.',
        badge: 'High Impact Matrix',
        category: 'hybrid',
        basePrice: 2899,
        compareAtPrice: 3899,
        recommendedRoom: 'Gamer Setup / Home Theater / Main Wall',
        recommendedWallWidth: '1.8 – 2.4 m',
        recommendedThemes: ['Cyberpunk', 'Marvel', 'DC', 'Gaming', 'Anime'],
        sortOrder: 7,
        slots,
        splitGroup: {
          splitGroupId: 'split-g33-hero',
          name: '3×3 Matrix Continuous Split',
          panelCount: 9,
          orientation: 'portrait',
          physicalSize: 'A6',
          slotIds: splitSlotIds,
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. hybrid-classic3-horizon-sandwich-9: Horizon Sandwich Triptych
  // Center: 3-Panel Classic Horizontal Split (3 Vertical A4s: 210x297, width 660mm)
  // Top: 3 Horizontal A5s (210x148 each, gap 15) -> exactly matches 210mm columns!
  // Bottom: 3 Horizontal A5s (210x148 each, gap 15) -> exact columnar alignment!
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const a4W = 210;
    const a4H = 297;
    const a5W = 210;
    const a5H = 148;

    const topY = 0;
    const midY = a5H + gap;
    const botY = midY + a4H + gap;

    const slots: SlotSpec[] = [];
    const splitIds = ['slot-c3h9-split-1', 'slot-c3h9-split-2', 'slot-c3h9-split-3'];

    for (let c = 0; c < 3; c++) {
      const colX = c * (a4W + gap);
      // Top A5
      slots.push({
        id: `slot-c3h9-top-${c + 1}`,
        slotType: 'accent',
        size: 'A5',
        widthMm: a5W,
        heightMm: a5H,
        orientation: 'landscape',
        xMm: colX,
        yMm: topY,
        label: `Top Col ${c + 1} Accent (A5)`,
      });
      // Center split A4
      slots.push({
        id: splitIds[c],
        slotType: 'hero-panel',
        size: 'A4',
        widthMm: a4W,
        heightMm: a4H,
        orientation: 'portrait',
        xMm: colX,
        yMm: midY,
        label: `Center Triptych Panel ${c + 1}/3 (A4)`,
        splitGroupId: 'split-c3h9-hero',
        panelIndex: c,
      });
      // Bottom A5
      slots.push({
        id: `slot-c3h9-bot-${c + 1}`,
        slotType: 'accent',
        size: 'A5',
        widthMm: a5W,
        heightMm: a5H,
        orientation: 'landscape',
        xMm: colX,
        yMm: botY,
        label: `Bottom Col ${c + 1} Accent (A5)`,
      });
    }

    layouts.push(
      compileLayout({
        id: 'hybrid-classic3-horizon-sandwich-9',
        slug: 'hybrid-classic3-horizon-sandwich',
        name: 'Horizon Sandwich Triptych',
        description: 'Architectural grid aligning 3 central A4 triptych panels with upper and lower horizontal A5 companion rows.',
        badge: 'Architectural Grid',
        category: 'hybrid',
        basePrice: 2399,
        compareAtPrice: 3299,
        recommendedRoom: 'Dining Room / Living Room Feature Wall',
        recommendedWallWidth: '1.6 – 2.2 m',
        recommendedThemes: ['Photography', 'Travel', 'Cars', 'Cinema', 'DC'],
        sortOrder: 8,
        slots,
        splitGroup: {
          splitGroupId: 'split-c3h9-hero',
          name: 'Classic 3-Piece Horizontal Split',
          panelCount: 3,
          orientation: 'portrait',
          physicalSize: 'A4',
          slotIds: splitIds,
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. hybrid-classic4-cinema-8: Cinema-4 Widescreen Enclave
  // Center: 4-Panel Classic Horizontal Split (4 Vertical A5s: 148x210, width 637mm)
  // Left: Vertical A4 (210x297)
  // Right: Vertical A4 (210x297)
  // Top: 2 Horizontal A4s (297x210, total width 609mm centered above 637mm split)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const a5W = 148;
    const a5H = 210;
    const a4W = 210;
    const a4H = 297;
    const topW = 297; // Horizontal A4
    const topH = 210;
    const splitTotalW = a5W * 4 + gap * 3; // 637mm
    const topRowW = topW * 2 + gap; // 609mm

    const topY = 0;
    const midY = topH + gap;
    const leftA4X = 0;
    const splitStartX = a4W + gap;
    const topStartX = splitStartX + (splitTotalW - topRowW) / 2;
    const rightA4X = splitStartX + splitTotalW + gap;

    const a4Y = midY + (a5H - a4H) / 2; // center A4 against split height

    const slots: SlotSpec[] = [
      {
        id: 'slot-c4c8-top-1',
        slotType: 'accent',
        size: 'A4',
        widthMm: topW,
        heightMm: topH,
        orientation: 'landscape',
        xMm: topStartX,
        yMm: topY,
        label: 'Top Left Accent (A4)',
      },
      {
        id: 'slot-c4c8-top-2',
        slotType: 'accent',
        size: 'A4',
        widthMm: topW,
        heightMm: topH,
        orientation: 'landscape',
        xMm: topStartX + topW + gap,
        yMm: topY,
        label: 'Top Right Accent (A4)',
      },
      {
        id: 'slot-c4c8-left-a4',
        slotType: 'accent',
        size: 'A4',
        widthMm: a4W,
        heightMm: a4H,
        orientation: 'portrait',
        xMm: leftA4X,
        yMm: a4Y,
        label: 'Left Pillar (A4)',
      },
    ];

    const splitIds: string[] = [];
    for (let i = 0; i < 4; i++) {
      const id = `slot-c4c8-split-${i + 1}`;
      splitIds.push(id);
      slots.push({
        id,
        slotType: 'hero-panel',
        size: 'A5',
        widthMm: a5W,
        heightMm: a5H,
        orientation: 'portrait',
        xMm: splitStartX + i * (a5W + gap),
        yMm: midY,
        label: `Cinema Panel ${i + 1}/4 (A5)`,
        splitGroupId: 'split-c4c8-hero',
        panelIndex: i,
      });
    }

    slots.push({
      id: 'slot-c4c8-right-a4',
      slotType: 'accent',
      size: 'A4',
      widthMm: a4W,
      heightMm: a4H,
      orientation: 'portrait',
      xMm: rightA4X,
      yMm: a4Y,
      label: 'Right Pillar (A4)',
    });

    layouts.push(
      compileLayout({
        id: 'hybrid-classic4-cinema-8',
        slug: 'hybrid-classic4-cinema',
        name: 'Cinema-4 Widescreen Enclave',
        description: 'Cinematic 4-panel split horizon crowned by dual horizontal A4s and flanked by vertical framing pillars.',
        badge: 'Cinema Widescreen',
        category: 'hybrid',
        basePrice: 2299,
        compareAtPrice: 3099,
        recommendedRoom: 'Entertainment Console / Living Room',
        recommendedWallWidth: '1.8 – 2.4 m',
        recommendedThemes: ['Cars', 'Marvel', 'Cinema', 'Space', 'Anime'],
        sortOrder: 9,
        slots,
        splitGroup: {
          splitGroupId: 'split-c4c8-hero',
          name: 'Classic 4-Piece Horizontal Split',
          panelCount: 4,
          orientation: 'portrait',
          physicalSize: 'A5',
          slotIds: splitIds,
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. hybrid-classic5-grand-panorama-9: Grand 5-Panel Panorama with 13x19 Wings
  // Center: 5-Panel Classic Horizontal Split (5 Vertical A5s: 148x210, width 800mm)
  // Left: Grand Vertical 13x19 (330x483)
  // Right: Grand Vertical 13x19 (330x483)
  // Top: 2 Horizontal A3s (420x297 each, width 420*2 + 15 = 855mm spanning the split)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const a5W = 148;
    const a5H = 210;
    const archW = 330;
    const archH = 483;
    const a3W = 420; // Horizontal A3
    const a3H = 297;
    const splitTotalW = a5W * 5 + gap * 4; // 800mm
    const topRowW = a3W * 2 + gap; // 855mm

    const topY = 0;
    const midY = a3H + gap;
    const totalCenterH = midY + a5H; // 297 + 15 + 210 = 522mm

    const archY = (totalCenterH - archH) / 2;
    const leftArchX = 0;
    const centerStartX = archW + gap;
    const splitStartX = centerStartX + (topRowW - splitTotalW) / 2;
    const rightArchX = centerStartX + topRowW + gap;

    const slots: SlotSpec[] = [
      {
        id: 'slot-c5g9-arch-left',
        slotType: 'hero',
        size: '13x19',
        widthMm: archW,
        heightMm: archH,
        orientation: 'portrait',
        xMm: leftArchX,
        yMm: archY,
        label: 'Left Monument (13×19")',
      },
      {
        id: 'slot-c5g9-top-1',
        slotType: 'accent',
        size: 'A3',
        widthMm: a3W,
        heightMm: a3H,
        orientation: 'landscape',
        xMm: centerStartX,
        yMm: topY,
        label: 'Upper Panoramic Left (A3)',
      },
      {
        id: 'slot-c5g9-top-2',
        slotType: 'accent',
        size: 'A3',
        widthMm: a3W,
        heightMm: a3H,
        orientation: 'landscape',
        xMm: centerStartX + a3W + gap,
        yMm: topY,
        label: 'Upper Panoramic Right (A3)',
      },
    ];

    const splitIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const id = `slot-c5g9-split-${i + 1}`;
      splitIds.push(id);
      slots.push({
        id,
        slotType: 'hero-panel',
        size: 'A5',
        widthMm: a5W,
        heightMm: a5H,
        orientation: 'portrait',
        xMm: splitStartX + i * (a5W + gap),
        yMm: midY,
        label: `Ultrawide Panel ${i + 1}/5 (A5)`,
        splitGroupId: 'split-c5g9-hero',
        panelIndex: i,
      });
    }

    slots.push({
      id: 'slot-c5g9-arch-right',
      slotType: 'hero',
      size: '13x19',
      widthMm: archW,
      heightMm: archH,
      orientation: 'portrait',
      xMm: rightArchX,
      yMm: archY,
      label: 'Right Monument (13×19")',
    });

    layouts.push(
      compileLayout({
        id: 'hybrid-classic5-grand-panorama-9',
        slug: 'hybrid-classic5-grand-panorama',
        name: 'Grand 5-Panel Panorama with 13×19 Wings',
        description: 'Ultrawide 5-panel split artwork crowned by dual panoramic A3s and flanked by 13×19" grand monuments.',
        badge: 'Epic Ultrawide',
        category: 'hybrid',
        basePrice: 3499,
        compareAtPrice: 4799,
        recommendedRoom: 'Grand Living Room / Feature Wall / Hallway',
        recommendedWallWidth: '2.2 – 2.8 m',
        recommendedThemes: ['Cars', 'Nature', 'Space', 'Marvel', 'Cinema'],
        sortOrder: 10,
        slots,
        splitGroup: {
          splitGroupId: 'split-c5g9-hero',
          name: 'Classic 5-Piece Ultrawide Split',
          panelCount: 5,
          orientation: 'portrait',
          physicalSize: 'A5',
          slotIds: splitIds,
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. hybrid-vertical3-totem-flank-7: Vertical Totem Tower with Dual Flanks
  // Center: 3-Panel Classic Vertical Split (3 Horizontal A4s: 297x210, height 660mm)
  // Left: Stack of 2 Vertical A4s (210x297, height 609mm)
  // Right: Stack of 2 Vertical A4s (210x297, height 609mm)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const a4W = 210;
    const a4H = 297;
    const cW = 297; // Horizontal A4
    const cH = 210;
    const towerH = cH * 3 + gap * 2; // 660mm
    const flankH = a4H * 2 + gap; // 609mm

    const flankY = (towerH - flankH) / 2; // ~25mm
    const leftFlankX = 0;
    const towerX = a4W + gap;
    const rightFlankX = towerX + cW + gap;

    const slots: SlotSpec[] = [
      {
        id: 'slot-v3t7-left-top',
        slotType: 'accent',
        size: 'A4',
        widthMm: a4W,
        heightMm: a4H,
        orientation: 'portrait',
        xMm: leftFlankX,
        yMm: flankY,
        label: 'Left Upper (A4)',
      },
      {
        id: 'slot-v3t7-left-bot',
        slotType: 'accent',
        size: 'A4',
        widthMm: a4W,
        heightMm: a4H,
        orientation: 'portrait',
        xMm: leftFlankX,
        yMm: flankY + a4H + gap,
        label: 'Left Lower (A4)',
      },
    ];

    const splitIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const id = `slot-v3t7-split-${i + 1}`;
      splitIds.push(id);
      slots.push({
        id,
        slotType: 'hero-panel',
        size: 'A4',
        widthMm: cW,
        heightMm: cH,
        orientation: 'landscape',
        xMm: towerX,
        yMm: i * (cH + gap),
        label: `Totem Tier ${i + 1}/3 (A4)`,
        splitGroupId: 'split-v3t7-hero',
        panelIndex: i,
      });
    }

    slots.push(
      {
        id: 'slot-v3t7-right-top',
        slotType: 'accent',
        size: 'A4',
        widthMm: a4W,
        heightMm: a4H,
        orientation: 'portrait',
        xMm: rightFlankX,
        yMm: flankY,
        label: 'Right Upper (A4)',
      },
      {
        id: 'slot-v3t7-right-bot',
        slotType: 'accent',
        size: 'A4',
        widthMm: a4W,
        heightMm: a4H,
        orientation: 'portrait',
        xMm: rightFlankX,
        yMm: flankY + a4H + gap,
        label: 'Right Lower (A4)',
      }
    );

    layouts.push(
      compileLayout({
        id: 'hybrid-vertical3-totem-flank-7',
        slug: 'hybrid-vertical3-totem-flank',
        name: 'Vertical Totem Tower with Dual Flanks',
        description: 'Tall 3-tier vertical split totem (stacked A4 horizontals) flanked symmetrically by dual vertical A4 columns.',
        badge: 'Vertical Totem',
        category: 'hybrid',
        basePrice: 2099,
        compareAtPrice: 2899,
        recommendedRoom: 'Entryway / Pillar Wall / Reading Nook',
        recommendedWallWidth: '1.2 – 1.6 m',
        recommendedThemes: ['Minimalist', 'Anime', 'Travel', 'Art', 'Gaming'],
        sortOrder: 11,
        slots,
        splitGroup: {
          splitGroupId: 'split-v3t7-hero',
          name: 'Vertical 3-Piece Stacked Split',
          panelCount: 3,
          orientation: 'landscape',
          physicalSize: 'A4',
          slotIds: splitIds,
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. hybrid-vertical4-monolith-8: Monolith 4-Tier Spire with Quad Flanks
  // Center: 4-Panel Classic Vertical Split (4 Horizontal A5s: 210x148, height 637mm)
  // Left: Stack of 2 Vertical A4s (210x297, height 609mm)
  // Right: Stack of 2 Vertical A4s (210x297, height 609mm)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const a4W = 210;
    const a4H = 297;
    const cW = 210; // Horizontal A5
    const cH = 148;
    const spireH = cH * 4 + gap * 3; // 637mm
    const flankH = a4H * 2 + gap; // 609mm

    const flankY = (spireH - flankH) / 2; // ~14mm
    const leftFlankX = 0;
    const towerX = a4W + gap;
    const rightFlankX = towerX + cW + gap;

    const slots: SlotSpec[] = [
      {
        id: 'slot-v4m8-left-top',
        slotType: 'accent',
        size: 'A4',
        widthMm: a4W,
        heightMm: a4H,
        orientation: 'portrait',
        xMm: leftFlankX,
        yMm: flankY,
        label: 'Left Upper (A4)',
      },
      {
        id: 'slot-v4m8-left-bot',
        slotType: 'accent',
        size: 'A4',
        widthMm: a4W,
        heightMm: a4H,
        orientation: 'portrait',
        xMm: leftFlankX,
        yMm: flankY + a4H + gap,
        label: 'Left Lower (A4)',
      },
    ];

    const splitIds: string[] = [];
    for (let i = 0; i < 4; i++) {
      const id = `slot-v4m8-split-${i + 1}`;
      splitIds.push(id);
      slots.push({
        id,
        slotType: 'hero-panel',
        size: 'A5',
        widthMm: cW,
        heightMm: cH,
        orientation: 'landscape',
        xMm: towerX,
        yMm: i * (cH + gap),
        label: `Spire Tier ${i + 1}/4 (A5)`,
        splitGroupId: 'split-v4m8-hero',
        panelIndex: i,
      });
    }

    slots.push(
      {
        id: 'slot-v4m8-right-top',
        slotType: 'accent',
        size: 'A4',
        widthMm: a4W,
        heightMm: a4H,
        orientation: 'portrait',
        xMm: rightFlankX,
        yMm: flankY,
        label: 'Right Upper (A4)',
      },
      {
        id: 'slot-v4m8-right-bot',
        slotType: 'accent',
        size: 'A4',
        widthMm: a4W,
        heightMm: a4H,
        orientation: 'portrait',
        xMm: rightFlankX,
        yMm: flankY + a4H + gap,
        label: 'Right Lower (A4)',
      }
    );

    layouts.push(
      compileLayout({
        id: 'hybrid-vertical4-monolith-8',
        slug: 'hybrid-vertical4-monolith',
        name: 'Monolith 4-Tier Spire with Quad Flanks',
        description: '4-tier stacked horizontal A5 vertical split column framed symmetrically by vertical A4 flanking wings.',
        badge: 'Vertical Monolith',
        category: 'hybrid',
        basePrice: 2199,
        compareAtPrice: 2999,
        recommendedRoom: 'Studio / Hallway / Bedroom Column',
        recommendedWallWidth: '1.2 – 1.6 m',
        recommendedThemes: ['Anime', 'Gaming', 'Marvel', 'Cinema'],
        sortOrder: 12,
        slots,
        splitGroup: {
          splitGroupId: 'split-v4m8-hero',
          name: 'Vertical 4-Piece Stacked Split',
          panelCount: 4,
          orientation: 'landscape',
          physicalSize: 'A5',
          slotIds: splitIds,
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. hybrid-stepped-triptych-quadwing-9: Stepped Triptych Salon Enclave
  // Center: 3-Panel Stepped Split (6x9, 6x11, 6x9 -> 152x229, 152x279, 152x229)
  // Top: 1 Horizontal A4 (297x210) centered
  // Bottom: 1 Horizontal A4 (297x210) centered
  // Left: Stack of 2 Vertical A5s (148x210, height 435mm)
  // Right: Stack of 2 Vertical A5s (148x210, height 435mm)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const splitW = 152;
    const splitH1 = 229;
    const splitH2 = 279;
    const splitTotalW = splitW * 3 + splitGap * 2; // 482mm
    const a5W = 148;
    const a5H = 210;
    const a4W = 297; // Horizontal A4
    const a4H = 210;

    const flankH = a5H * 2 + gap; // 435mm
    const centerTotalH = a4H + gap + splitH2 + gap + a4H; // 210 + 15 + 279 + 15 + 210 = 729mm

    const flankY = (centerTotalH - flankH) / 2; // ~147mm
    const leftFlankX = 0;
    const centerStartX = a5W + gap;
    const rightFlankX = centerStartX + splitTotalW + gap;

    const a4CenterX = centerStartX + (splitTotalW - a4W) / 2;
    const topA4Y = 0;
    const splitCenterY = a4H + gap;
    const splitSideY = splitCenterY + (splitH2 - splitH1) / 2;
    const botA4Y = splitCenterY + splitH2 + gap;

    const s1X = centerStartX;
    const s2X = s1X + splitW + splitGap;
    const s3X = s2X + splitW + splitGap;

    layouts.push(
      compileLayout({
        id: 'hybrid-stepped-triptych-quadwing-9',
        slug: 'hybrid-stepped-triptych-quadwing',
        name: 'Stepped Triptych Salon Enclave',
        description: 'Complete salon ensemble enclosing a 3-panel stepped split with dual A5 wings and A4 horizontal header/footer anchors.',
        badge: 'Salon Enclave',
        category: 'hybrid',
        basePrice: 2499,
        compareAtPrice: 3399,
        recommendedRoom: 'Master Bedroom / Living Room Gallery',
        recommendedWallWidth: '1.6 – 2.2 m',
        recommendedThemes: ['Anime', 'Marvel', 'DC', 'Gaming', 'Cars'],
        sortOrder: 13,
        slots: [
          {
            id: 'slot-stq9-left-top',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'portrait',
            xMm: leftFlankX,
            yMm: flankY,
            label: 'Left Upper Wing (A5)',
          },
          {
            id: 'slot-stq9-left-bot',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'portrait',
            xMm: leftFlankX,
            yMm: flankY + a5H + gap,
            label: 'Left Lower Wing (A5)',
          },
          {
            id: 'slot-stq9-top-a4',
            slotType: 'accent',
            size: 'A4',
            widthMm: a4W,
            heightMm: a4H,
            orientation: 'landscape',
            xMm: a4CenterX,
            yMm: topA4Y,
            label: 'Upper Header (A4)',
          },
          {
            id: 'slot-stq9-split-1',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: splitW,
            heightMm: splitH1,
            orientation: 'portrait',
            xMm: s1X,
            yMm: splitSideY,
            label: 'Stepped Left 6×9" (152×229mm)',
            splitGroupId: 'split-stq9-hero',
            panelIndex: 0,
          },
          {
            id: 'slot-stq9-split-2',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: splitW,
            heightMm: splitH2,
            orientation: 'portrait',
            xMm: s2X,
            yMm: splitCenterY,
            label: 'Stepped Center 6×11" (152×279mm)',
            splitGroupId: 'split-stq9-hero',
            panelIndex: 1,
          },
          {
            id: 'slot-stq9-split-3',
            slotType: 'hero-panel',
            size: 'CUSTOM',
            widthMm: splitW,
            heightMm: splitH1,
            orientation: 'portrait',
            xMm: s3X,
            yMm: splitSideY,
            label: 'Stepped Right 6×9" (152×229mm)',
            splitGroupId: 'split-stq9-hero',
            panelIndex: 2,
          },
          {
            id: 'slot-stq9-bot-a4',
            slotType: 'accent',
            size: 'A4',
            widthMm: a4W,
            heightMm: a4H,
            orientation: 'landscape',
            xMm: a4CenterX,
            yMm: botA4Y,
            label: 'Lower Base (A4)',
          },
          {
            id: 'slot-stq9-right-top',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'portrait',
            xMm: rightFlankX,
            yMm: flankY,
            label: 'Right Upper Wing (A5)',
          },
          {
            id: 'slot-stq9-right-bot',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'portrait',
            xMm: rightFlankX,
            yMm: flankY + a5H + gap,
            label: 'Right Lower Wing (A5)',
          },
        ],
        splitGroup: {
          splitGroupId: 'split-stq9-hero',
          name: 'Stepped 3-Piece Split Artwork',
          panelCount: 3,
          orientation: 'portrait',
          physicalSize: 'CUSTOM',
          slotIds: ['slot-stq9-split-1', 'slot-stq9-split-2', 'slot-stq9-split-3'],
          staggered: true,
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. hybrid-grid2x2-windowpane-8: Windowpane 2x2 Surrounded Salon
  // Center: 2x2 Grid Split in Horizontal A5 (210x148, grid 435x311)
  // Left: Vertical A4 (210x297)
  // Right: Vertical A4 (210x297)
  // Top: Horizontal A4 (297x210) centered
  // Bottom: Horizontal A4 (297x210) centered
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const pW = 210;
    const pH = 148;
    const gridW = pW * 2 + gap; // 435mm
    const gridH = pH * 2 + gap; // 311mm
    const a4VertW = 210;
    const a4VertH = 297;
    const a4HorizW = 297;
    const a4HorizH = 210;

    const topY = 0;
    const midY = a4HorizH + gap;
    const botY = midY + gridH + gap;

    const leftX = 0;
    const centerStartX = a4VertW + gap;
    const topX = centerStartX + (gridW - a4HorizW) / 2;
    const rightX = centerStartX + gridW + gap;

    const a4VertY = midY + (gridH - a4VertH) / 2;

    layouts.push(
      compileLayout({
        id: 'hybrid-grid2x2-windowpane-8',
        slug: 'hybrid-grid2x2-windowpane',
        name: 'Windowpane 2×2 Surrounded Salon',
        description: 'Landscape 2×2 grid split in A5 surrounded on all 4 cardinal directions by curated A4 standard frames.',
        badge: 'Surrounded Salon',
        category: 'hybrid',
        basePrice: 2299,
        compareAtPrice: 3099,
        recommendedRoom: 'Studio / Dining Room / Reception Wall',
        recommendedWallWidth: '1.6 – 2.2 m',
        recommendedThemes: ['Photography', 'Travel', 'Art', 'Nature', 'Cinema'],
        sortOrder: 14,
        slots: [
          {
            id: 'slot-g2w8-top-a4',
            slotType: 'accent',
            size: 'A4',
            widthMm: a4HorizW,
            heightMm: a4HorizH,
            orientation: 'landscape',
            xMm: topX,
            yMm: topY,
            label: 'Top Accent (A4)',
          },
          {
            id: 'slot-g2w8-left-a4',
            slotType: 'accent',
            size: 'A4',
            widthMm: a4VertW,
            heightMm: a4VertH,
            orientation: 'portrait',
            xMm: leftX,
            yMm: a4VertY,
            label: 'Left Pillar (A4)',
          },
          {
            id: 'slot-g2w8-split-1',
            slotType: 'hero-panel',
            size: 'A5',
            widthMm: pW,
            heightMm: pH,
            orientation: 'landscape',
            xMm: centerStartX,
            yMm: midY,
            label: 'Grid Panel 1/4 Top-Left (A5)',
            splitGroupId: 'split-g2w8-hero',
            panelIndex: 0,
          },
          {
            id: 'slot-g2w8-split-2',
            slotType: 'hero-panel',
            size: 'A5',
            widthMm: pW,
            heightMm: pH,
            orientation: 'landscape',
            xMm: centerStartX + pW + gap,
            yMm: midY,
            label: 'Grid Panel 2/4 Top-Right (A5)',
            splitGroupId: 'split-g2w8-hero',
            panelIndex: 1,
          },
          {
            id: 'slot-g2w8-split-3',
            slotType: 'hero-panel',
            size: 'A5',
            widthMm: pW,
            heightMm: pH,
            orientation: 'landscape',
            xMm: centerStartX,
            yMm: midY + pH + gap,
            label: 'Grid Panel 3/4 Bot-Left (A5)',
            splitGroupId: 'split-g2w8-hero',
            panelIndex: 2,
          },
          {
            id: 'slot-g2w8-split-4',
            slotType: 'hero-panel',
            size: 'A5',
            widthMm: pW,
            heightMm: pH,
            orientation: 'landscape',
            xMm: centerStartX + pW + gap,
            yMm: midY + pH + gap,
            label: 'Grid Panel 4/4 Bot-Right (A5)',
            splitGroupId: 'split-g2w8-hero',
            panelIndex: 3,
          },
          {
            id: 'slot-g2w8-right-a4',
            slotType: 'accent',
            size: 'A4',
            widthMm: a4VertW,
            heightMm: a4VertH,
            orientation: 'portrait',
            xMm: rightX,
            yMm: a4VertY,
            label: 'Right Pillar (A4)',
          },
          {
            id: 'slot-g2w8-bot-a4',
            slotType: 'accent',
            size: 'A4',
            widthMm: a4HorizW,
            heightMm: a4HorizH,
            orientation: 'landscape',
            xMm: topX,
            yMm: botY,
            label: 'Bottom Base (A4)',
          },
        ],
        splitGroup: {
          splitGroupId: 'split-g2w8-hero',
          name: '2×2 Landscape Windowpane Split',
          panelCount: 4,
          orientation: 'landscape',
          physicalSize: 'A5',
          slotIds: [
            'slot-g2w8-split-1',
            'slot-g2w8-split-2',
            'slot-g2w8-split-3',
            'slot-g2w8-split-4',
          ],
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. hybrid-classic3-cinema-a3-7: Grand Cinema A3 Triptych with A5 Wings
  // Center: 3-Panel Classic Horizontal Split in A3 Vertical (297x420, width 921mm)
  // Left: Stack of 2 Vertical A5s (148x210, height 435mm)
  // Right: Stack of 2 Vertical A5s (148x210, height 435mm)
  // Height match: 420mm split vs 435mm wings (only 15mm difference!)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const a3W = 297;
    const a3H = 420;
    const a5W = 148;
    const a5H = 210;
    const splitTotalW = a3W * 3 + gap * 2; // 921mm
    const flankH = a5H * 2 + gap; // 435mm

    const splitY = (flankH - a3H) / 2; // ~7mm
    const leftFlankX = 0;
    const splitStartX = a5W + gap;
    const rightFlankX = splitStartX + splitTotalW + gap;

    const splitIds = ['slot-c3a7-split-1', 'slot-c3a7-split-2', 'slot-c3a7-split-3'];

    layouts.push(
      compileLayout({
        id: 'hybrid-classic3-cinema-a3-7',
        slug: 'hybrid-classic3-cinema-a3',
        name: 'Grand Cinema A3 Triptych with A5 Wings',
        description: 'Large-format A3 triptych split artwork flanked symmetrically by vertical A5 gallery wings.',
        badge: 'Grand Triptych',
        category: 'hybrid',
        basePrice: 2599,
        compareAtPrice: 3499,
        recommendedRoom: 'Media Console / Main Feature Wall',
        recommendedWallWidth: '1.8 – 2.4 m',
        recommendedThemes: ['Cinema', 'Cars', 'Marvel', 'DC', 'Space'],
        sortOrder: 15,
        slots: [
          {
            id: 'slot-c3a7-left-top',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'portrait',
            xMm: leftFlankX,
            yMm: 0,
            label: 'Left Upper Wing (A5)',
          },
          {
            id: 'slot-c3a7-left-bot',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'portrait',
            xMm: leftFlankX,
            yMm: a5H + gap,
            label: 'Left Lower Wing (A5)',
          },
          {
            id: splitIds[0],
            slotType: 'hero-panel',
            size: 'A3',
            widthMm: a3W,
            heightMm: a3H,
            orientation: 'portrait',
            xMm: splitStartX,
            yMm: splitY,
            label: 'Cinema A3 Panel 1/3',
            splitGroupId: 'split-c3a7-hero',
            panelIndex: 0,
          },
          {
            id: splitIds[1],
            slotType: 'hero-panel',
            size: 'A3',
            widthMm: a3W,
            heightMm: a3H,
            orientation: 'portrait',
            xMm: splitStartX + a3W + gap,
            yMm: splitY,
            label: 'Cinema A3 Panel 2/3',
            splitGroupId: 'split-c3a7-hero',
            panelIndex: 1,
          },
          {
            id: splitIds[2],
            slotType: 'hero-panel',
            size: 'A3',
            widthMm: a3W,
            heightMm: a3H,
            orientation: 'portrait',
            xMm: splitStartX + (a3W + gap) * 2,
            yMm: splitY,
            label: 'Cinema A3 Panel 3/3',
            splitGroupId: 'split-c3a7-hero',
            panelIndex: 2,
          },
          {
            id: 'slot-c3a7-right-top',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'portrait',
            xMm: rightFlankX,
            yMm: 0,
            label: 'Right Upper Wing (A5)',
          },
          {
            id: 'slot-c3a7-right-bot',
            slotType: 'accent',
            size: 'A5',
            widthMm: a5W,
            heightMm: a5H,
            orientation: 'portrait',
            xMm: rightFlankX,
            yMm: a5H + gap,
            label: 'Right Lower Wing (A5)',
          },
        ],
        splitGroup: {
          splitGroupId: 'split-c3a7-hero',
          name: 'Grand A3 3-Piece Triptych Split',
          panelCount: 3,
          orientation: 'portrait',
          physicalSize: 'A3',
          slotIds: splitIds,
        },
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 16. hybrid-vertical5-spire-11: 5-Tier High-Rise Spire Gallery
  // Center: 5-Panel Classic Vertical Split in Horizontal A6 (148x105, height 573mm)
  // Left: Stack of 2 Vertical A5s (148x210) + 1 A6 Horizontal (148x105) -> height 555mm
  // Right: Stack of 2 Vertical A5s + 1 A6 Horizontal -> height 555mm
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const a6W = 148; // Landscape A6
    const a6H = 105;
    const a5W = 148; // Portrait A5
    const a5H = 210;

    const spireH = a6H * 5 + 12 * 4; // 573mm
    const flankH = a5H * 2 + a6H + gap * 2; // 210*2 + 105 + 30 = 555mm

    const flankY = (spireH - flankH) / 2; // ~9mm
    const leftFlankX = 0;
    const spireX = a5W + gap;
    const rightFlankX = spireX + a6W + gap;

    const splitIds: string[] = [];
    const slots: SlotSpec[] = [
      {
        id: 'slot-v5s11-left-1',
        slotType: 'accent',
        size: 'A5',
        widthMm: a5W,
        heightMm: a5H,
        orientation: 'portrait',
        xMm: leftFlankX,
        yMm: flankY,
        label: 'Left Pillar Top (A5)',
      },
      {
        id: 'slot-v5s11-left-2',
        slotType: 'accent',
        size: 'A5',
        widthMm: a5W,
        heightMm: a5H,
        orientation: 'portrait',
        xMm: leftFlankX,
        yMm: flankY + a5H + gap,
        label: 'Left Pillar Mid (A5)',
      },
      {
        id: 'slot-v5s11-left-3',
        slotType: 'accent',
        size: 'A6',
        widthMm: a6W,
        heightMm: a6H,
        orientation: 'landscape',
        xMm: leftFlankX,
        yMm: flankY + a5H * 2 + gap * 2,
        label: 'Left Pillar Base (A6)',
      },
    ];

    for (let i = 0; i < 5; i++) {
      const id = `slot-v5s11-split-${i + 1}`;
      splitIds.push(id);
      slots.push({
        id,
        slotType: 'hero-panel',
        size: 'A6',
        widthMm: a6W,
        heightMm: a6H,
        orientation: 'landscape',
        xMm: spireX,
        yMm: i * (a6H + 12),
        label: `Spire Tier ${i + 1}/5 (A6)`,
        splitGroupId: 'split-v5s11-hero',
        panelIndex: i,
      });
    }

    slots.push(
      {
        id: 'slot-v5s11-right-1',
        slotType: 'accent',
        size: 'A5',
        widthMm: a5W,
        heightMm: a5H,
        orientation: 'portrait',
        xMm: rightFlankX,
        yMm: flankY,
        label: 'Right Pillar Top (A5)',
      },
      {
        id: 'slot-v5s11-right-2',
        slotType: 'accent',
        size: 'A5',
        widthMm: a5W,
        heightMm: a5H,
        orientation: 'portrait',
        xMm: rightFlankX,
        yMm: flankY + a5H + gap,
        label: 'Right Pillar Mid (A5)',
      },
      {
        id: 'slot-v5s11-right-3',
        slotType: 'accent',
        size: 'A6',
        widthMm: a6W,
        heightMm: a6H,
        orientation: 'landscape',
        xMm: rightFlankX,
        yMm: flankY + a5H * 2 + gap * 2,
        label: 'Right Pillar Base (A6)',
      }
    );

    layouts.push(
      compileLayout({
        id: 'hybrid-vertical5-spire-11',
        slug: 'hybrid-vertical5-spire',
        name: '5-Tier High-Rise Spire Gallery',
        description: 'Tall 5-tier vertical split spire framed by towering A5 and A6 columns.',
        badge: 'High-Rise Spire',
        category: 'hybrid',
        basePrice: 2599,
        compareAtPrice: 3499,
        recommendedRoom: 'Hallway / Living Room Vertical Space',
        recommendedWallWidth: '1.2 – 1.6 m',
        recommendedThemes: ['Cyberpunk', 'Anime', 'Travel', 'Art'],
        sortOrder: 16,
        slots,
        splitGroup: {
          splitGroupId: 'split-v5s11-hero',
          name: 'Vertical 5-Piece Stacked Split',
          panelCount: 5,
          orientation: 'landscape',
          physicalSize: 'A6',
          slotIds: splitIds,
        },
      })
    );
  }

  return layouts;
}
