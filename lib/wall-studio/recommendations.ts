import type { WallLayoutData, WallSlot, SlotSelection, PosterArtworkData } from './types';
import { FREGORO_ARTWORKS } from './artworks-data';
import {
  getSlotPosterRule,
  getArtworkAspectRatio,
  isArtworkCompatibleWithSlot,
} from './ratio-rules';

export type ShuffleScope = 'all' | 'hero' | 'supporting' | 'outer' | 'A4' | 'A5';

/**
 * Returns prioritized artworks for a specific slot based on strict aspect-ratio rules,
 * layout role, orientation, and theme affinity.
 */
export function getSlotRecommendations(
  slot: WallSlot,
  layout: WallLayoutData,
  currentSelections: Record<string, SlotSelection>,
  themeSlug?: string,
): PosterArtworkData[] {
  // Extract IDs of already selected single posters to prevent duplicates
  const usedArtworkIds = new Set<string>();
  Object.values(currentSelections).forEach((sel) => {
    if (sel.artworkId && !sel.splitGroupId) {
      usedArtworkIds.add(sel.artworkId);
    }
  });

  const rule = getSlotPosterRule(slot, layout);
  const isSplitPanel = !!slot.splitGroupId;

  // 1. Filter candidates strictly by compatibility rules
  const eligibleArtworks = FREGORO_ARTWORKS.filter((art) =>
    isArtworkCompatibleWithSlot(art, slot, layout),
  );

  // 2. Score eligible candidates
  const scored = eligibleArtworks.map((art) => {
    let score = 0;
    const ratio = getArtworkAspectRatio(art);
    const isPrimaryRatio = rule.primaryRatios.includes(ratio);

    // Primary aspect ratio match receives the highest weighting
    if (isPrimaryRatio) {
      score += 200;
    }

    // Role-specific matching
    if (isSplitPanel) {
      if (art.isSplitCompatible) score += 50;
      if (art.heroCompatible) score += 30;
    } else {
      if (slot.slotType === 'hero' || slot.slotType === 'hero-panel') {
        if (art.heroCompatible) score += 30;
        if (art.productType === 'minimal' || art.productType === 'quote') score -= 20;
      } else if (slot.slotType === 'support') {
        if (art.supportCompatible) score += 25;
      } else if (slot.slotType === 'accent') {
        if (art.productType === 'quote' || art.productType === 'minimal') score += 20;
      }
    }

    // Theme affinity
    if (themeSlug && themeSlug !== 'all') {
      if (art.themeSlug === themeSlug) score += 80;
    }

    // Existing wall color harmony
    const existingColors = Object.values(currentSelections)
      .map((s) =>
        s.artworkId ? FREGORO_ARTWORKS.find((a) => a.id === s.artworkId)?.dominantColor : null,
      )
      .filter(Boolean) as string[];

    if (existingColors.includes(art.dominantColor || '')) {
      score += 15;
    }

    // Penalize duplicate artworks on non-split slots
    if (!isSplitPanel && usedArtworkIds.has(art.id)) {
      score -= 100;
    }

    return { artwork: art, score };
  });

  return scored.sort((a, b) => b.score - a.score).map((s) => s.artwork);
}

/**
 * One-Tap Theme Fill: Fills all unlocked slots with thematic artworks.
 * Never overrides locked slots. Avoids duplicate artwork across slots.
 * Connects split groups to a single continuous panoramic artwork strictly matching
 * the required aspect ratio (44:21 for stepped 5, 19:11 for stepped 3, 17:8 for classic, etc.)
 */
export function oneTapThemeFill(
  layout: WallLayoutData,
  currentSelections: Record<string, SlotSelection>,
  themeSlug: string,
): Record<string, SlotSelection> {
  const newSelections: Record<string, SlotSelection> = { ...currentSelections };
  const usedArtworkIds = new Set<string>();

  // Preserve locked slots
  layout.slots.forEach((slot) => {
    const sel = newSelections[slot.id];
    if (sel?.isLocked && sel.artworkId) {
      usedArtworkIds.add(sel.artworkId);
    }
  });

  // 1. Handle Split Groups First (Assign 1 cohesive artwork across all panels matching ratio rule)
  layout.splitGroups.forEach((splitGroup) => {
    const anyLocked = splitGroup.slotIds.some((id) => newSelections[id]?.isLocked);
    if (anyLocked) return;

    const firstSlot = layout.slots.find((s) => s.id === splitGroup.slotIds[0]);
    if (!firstSlot) return;

    // Filter candidates strictly matching compatibility for this split group
    const splitCandidates = FREGORO_ARTWORKS.filter((a) =>
      isArtworkCompatibleWithSlot(a, firstSlot, layout),
    );

    let splitArt = splitCandidates.find(
      (a) => a.themeSlug === themeSlug && !usedArtworkIds.has(a.id),
    );
    if (!splitArt) {
      splitArt = splitCandidates.find((a) => a.themeSlug === themeSlug);
    }
    if (!splitArt) {
      splitArt = splitCandidates.find((a) => !usedArtworkIds.has(a.id));
    }
    if (!splitArt) {
      splitArt = splitCandidates[0] || FREGORO_ARTWORKS[0];
    }

    const selectedArt = splitArt;
    usedArtworkIds.add(selectedArt.id);

    splitGroup.slotIds.forEach((slotId, pIndex) => {
      const slot = layout.slots.find((s) => s.id === slotId);
      newSelections[slotId] = {
        slotId,
        artworkId: selectedArt.id,
        title: `${selectedArt.title} (Panel ${pIndex + 1}/${splitGroup.panelCount})`,
        imageUrl: selectedArt.imageUrl,
        thumbnailUrl: selectedArt.thumbnailUrl,
        splitGroupId: splitGroup.splitGroupId,
        panelIndex: pIndex,
        physicalSize: slot?.size || 'A3',
        price: selectedArt.price,
        isLocked: false,
      };
    });
  });

  // 2. Fill Remaining Unlocked Slots
  layout.slots.forEach((slot) => {
    if (slot.splitGroupId && newSelections[slot.id]?.artworkId) return;
    if (newSelections[slot.id]?.isLocked) return;

    // Get recommendations for this slot (strictly filtered by ratio)
    const candidates = getSlotRecommendations(slot, layout, newSelections, themeSlug);
    const chosen = candidates.find((c) => !usedArtworkIds.has(c.id)) || candidates[0];

    if (chosen) {
      usedArtworkIds.add(chosen.id);
      newSelections[slot.id] = {
        slotId: slot.id,
        artworkId: chosen.id,
        title: chosen.title,
        imageUrl: chosen.imageUrl,
        thumbnailUrl: chosen.thumbnailUrl,
        physicalSize: slot.size,
        price: chosen.price,
        isLocked: false,
      };
    }
  });

  return newSelections;
}

/**
 * Shuffle Unlocked Slots by Scope
 */
export function shuffleWall(
  layout: WallLayoutData,
  currentSelections: Record<string, SlotSelection>,
  scope: ShuffleScope = 'all',
  themeSlug?: string,
): Record<string, SlotSelection> {
  const newSelections: Record<string, SlotSelection> = { ...currentSelections };
  const usedArtworkIds = new Set<string>();

  // Determine eligible slots to shuffle
  const targetSlots = layout.slots.filter((slot) => {
    const sel = newSelections[slot.id];
    if (sel?.isLocked) return false;

    if (scope === 'hero') {
      return slot.slotType === 'hero' || slot.slotType === 'hero-panel';
    }
    if (scope === 'supporting') {
      return slot.slotType === 'support';
    }
    if (scope === 'outer') {
      return slot.slotType === 'accent' || slot.slotType === 'support';
    }
    if (scope === 'A4') {
      return slot.size === 'A4';
    }
    if (scope === 'A5') {
      return slot.size === 'A5';
    }
    return true; // 'all'
  });

  // Track already used artwork in non-target locked slots
  layout.slots.forEach((slot) => {
    const artId = newSelections[slot.id]?.artworkId;
    if (!targetSlots.includes(slot) && artId) {
      usedArtworkIds.add(artId);
    }
  });

  // If hero split is in target scope, shuffle it first
  if (scope === 'all' || scope === 'hero') {
    layout.splitGroups.forEach((splitGroup) => {
      const anyLocked = splitGroup.slotIds.some((id) => newSelections[id]?.isLocked);
      if (anyLocked) return;

      const firstSlot = layout.slots.find((s) => s.id === splitGroup.slotIds[0]);
      if (!firstSlot) return;

      const candidates = FREGORO_ARTWORKS.filter(
        (a) =>
          isArtworkCompatibleWithSlot(a, firstSlot, layout) &&
          (!themeSlug || themeSlug === 'all' || a.themeSlug === themeSlug),
      );

      const pool =
        candidates.length > 0
          ? candidates
          : FREGORO_ARTWORKS.filter((a) => isArtworkCompatibleWithSlot(a, firstSlot, layout));
      const chosen = pool[Math.floor(Math.random() * pool.length)];

      if (chosen) {
        usedArtworkIds.add(chosen.id);
        splitGroup.slotIds.forEach((slotId, pIndex) => {
          const slot = layout.slots.find((s) => s.id === slotId);
          newSelections[slotId] = {
            slotId,
            artworkId: chosen.id,
            title: `${chosen.title} (Panel ${pIndex + 1})`,
            imageUrl: chosen.imageUrl,
            thumbnailUrl: chosen.thumbnailUrl,
            splitGroupId: splitGroup.splitGroupId,
            panelIndex: pIndex,
            physicalSize: slot?.size || 'A3',
            price: chosen.price,
            isLocked: false,
          };
        });
      }
    });
  }

  // Shuffle remaining target slots
  targetSlots.forEach((slot) => {
    if (slot.splitGroupId && newSelections[slot.id]?.artworkId) return;

    const recommendations = getSlotRecommendations(slot, layout, newSelections, themeSlug);
    // Take from top 10 candidates with randomness
    const pool = recommendations.slice(0, 10).filter((a) => !usedArtworkIds.has(a.id));
    const chosen = pool[Math.floor(Math.random() * (pool.length || 1))] || recommendations[0];

    if (chosen) {
      usedArtworkIds.add(chosen.id);
      newSelections[slot.id] = {
        slotId: slot.id,
        artworkId: chosen.id,
        title: chosen.title,
        imageUrl: chosen.imageUrl,
        thumbnailUrl: chosen.thumbnailUrl,
        physicalSize: slot.size,
        price: chosen.price,
        isLocked: false,
      };
    }
  });

  return newSelections;
}
