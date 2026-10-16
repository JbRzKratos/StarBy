/**
 * Curated Placements Manager
 * Handles designer-calibrated placements per garment type (Regular Tee, Oversized Tee, Acid Wash, Hoodie).
 * Supports persisting customized placements in localStorage and exporting JSON configurations.
 */
import { findPanelAtUV } from './garmentPanels';

export interface CalibratedPlacement {
  u: number;
  v: number;
  uvWidth: number;
  uvHeight?: number;
  scale: number;
  rotation: number;
  regionId: 'front' | 'back';
  placementTarget?: string;
  scalePreset?: string;
  hidden?: boolean;
  removed?: boolean;
  opacity?: number;
}

const STORAGE_KEY = 'fregoro_curated_placements';

/**
 * Standard calibrated default coordinates per garment cut.
 * Hand-tuned to ensure artworks sit centered, proportional, and balanced on every cut.
 */
export const DEFAULT_GARMENT_CALIBRATIONS: Record<
  string,
  Record<string, CalibratedPlacement>
> = {
  'regular-t-shirt': {
    'front-center': {
      u: 0.25,
      v: 0.635,
      uvWidth: 0.26,
      scale: 0.743,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'front-center',
      scalePreset: 'standard',
    },
    'left-chest': {
      u: 0.312,
      v: 0.638,
      uvWidth: 0.12,
      scale: 0.343,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'left-chest',
      scalePreset: 'compact',
    },
    'right-chest': {
      u: 0.187,
      v: 0.638,
      uvWidth: 0.12,
      scale: 0.343,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'right-chest',
      scalePreset: 'compact',
    },
    'full-front': {
      u: 0.25,
      v: 0.61,
      uvWidth: 0.38,
      scale: 1.086,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'full-front',
      scalePreset: 'oversized',
    },
    'bottom-hem': {
      u: 0.25,
      v: 0.44,
      uvWidth: 0.26,
      scale: 0.743,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'bottom-hem',
      scalePreset: 'standard',
    },
    'back-center': {
      u: 0.758,
      v: 0.64,
      uvWidth: 0.26,
      scale: 0.743,
      rotation: 0,
      regionId: 'back',
      placementTarget: 'back-center',
      scalePreset: 'standard',
    },
    'back-collar': {
      u: 0.758,
      v: 0.74,
      uvWidth: 0.13,
      scale: 0.371,
      rotation: 0,
      regionId: 'back',
      placementTarget: 'back-collar',
      scalePreset: 'compact',
    },
    'full-back': {
      u: 0.758,
      v: 0.61,
      uvWidth: 0.38,
      scale: 1.086,
      rotation: 0,
      regionId: 'back',
      placementTarget: 'full-back',
      scalePreset: 'oversized',
    },
    'left-sleeve': {
      u: 0.75,
      v: 0.24,
      uvWidth: 0.18,
      scale: 0.514,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'left-sleeve',
      scalePreset: 'standard',
    },
    'right-sleeve': {
      u: 0.21,
      v: 0.24,
      uvWidth: 0.18,
      scale: 0.514,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'right-sleeve',
      scalePreset: 'standard',
    },
  },
  'oversized-t-shirt': {
    'front-center': {
      u: 0.749,
      v: 0.655,
      uvWidth: 0.28,
      scale: 0.8,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'front-center',
      scalePreset: 'standard',
    },
    'left-chest': {
      u: 0.814,
      v: 0.649,
      uvWidth: 0.12,
      scale: 0.343,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'left-chest',
      scalePreset: 'compact',
    },
    'right-chest': {
      u: 0.682,
      v: 0.648,
      uvWidth: 0.12,
      scale: 0.343,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'right-chest',
      scalePreset: 'compact',
    },
    'full-front': {
      u: 0.749,
      v: 0.63,
      uvWidth: 0.4,
      scale: 1.143,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'full-front',
      scalePreset: 'oversized',
    },
    'bottom-hem': {
      u: 0.749,
      v: 0.45,
      uvWidth: 0.28,
      scale: 0.8,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'bottom-hem',
      scalePreset: 'standard',
    },
    'back-center': {
      u: 0.251,
      v: 0.265,
      uvWidth: 0.28,
      scale: 0.8,
      rotation: 0,
      regionId: 'back',
      placementTarget: 'back-center',
      scalePreset: 'standard',
    },
    'back-collar': {
      u: 0.251,
      v: 0.38,
      uvWidth: 0.13,
      scale: 0.371,
      rotation: 0,
      regionId: 'back',
      placementTarget: 'back-collar',
      scalePreset: 'compact',
    },
    'full-back': {
      u: 0.251,
      v: 0.28,
      uvWidth: 0.4,
      scale: 1.143,
      rotation: 0,
      regionId: 'back',
      placementTarget: 'full-back',
      scalePreset: 'oversized',
    },
    'left-sleeve': {
      u: 0.19,
      v: 0.74,
      uvWidth: 0.18,
      scale: 0.514,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'left-sleeve',
      scalePreset: 'standard',
    },
    'right-sleeve': {
      u: 0.76,
      v: 0.25,
      uvWidth: 0.18,
      scale: 0.514,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'right-sleeve',
      scalePreset: 'standard',
    },
  },
  'acid-wash-t-shirt': {
    'front-center': {
      u: 0.749,
      v: 0.655,
      uvWidth: 0.28,
      scale: 0.8,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'front-center',
      scalePreset: 'standard',
    },
    'left-chest': {
      u: 0.814,
      v: 0.649,
      uvWidth: 0.12,
      scale: 0.343,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'left-chest',
      scalePreset: 'compact',
    },
    'right-chest': {
      u: 0.682,
      v: 0.648,
      uvWidth: 0.12,
      scale: 0.343,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'right-chest',
      scalePreset: 'compact',
    },
    'full-front': {
      u: 0.749,
      v: 0.63,
      uvWidth: 0.4,
      scale: 1.143,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'full-front',
      scalePreset: 'oversized',
    },
    'bottom-hem': {
      u: 0.749,
      v: 0.45,
      uvWidth: 0.28,
      scale: 0.8,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'bottom-hem',
      scalePreset: 'standard',
    },
    'back-center': {
      u: 0.251,
      v: 0.265,
      uvWidth: 0.28,
      scale: 0.8,
      rotation: 0,
      regionId: 'back',
      placementTarget: 'back-center',
      scalePreset: 'standard',
    },
    'back-collar': {
      u: 0.251,
      v: 0.38,
      uvWidth: 0.13,
      scale: 0.371,
      rotation: 0,
      regionId: 'back',
      placementTarget: 'back-collar',
      scalePreset: 'compact',
    },
    'full-back': {
      u: 0.251,
      v: 0.28,
      uvWidth: 0.4,
      scale: 1.143,
      rotation: 0,
      regionId: 'back',
      placementTarget: 'full-back',
      scalePreset: 'oversized',
    },
    'left-sleeve': {
      u: 0.19,
      v: 0.74,
      uvWidth: 0.18,
      scale: 0.514,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'left-sleeve',
      scalePreset: 'standard',
    },
    'right-sleeve': {
      u: 0.76,
      v: 0.25,
      uvWidth: 0.18,
      scale: 0.514,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'right-sleeve',
      scalePreset: 'standard',
    },
  },
  'hoodie': {
    'front-center': {
      u: 0.211,
      v: 0.362,
      uvWidth: 0.24,
      scale: 0.686,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'front-center',
      scalePreset: 'standard',
    },
    'left-chest': {
      u: 0.259,
      v: 0.361,
      uvWidth: 0.11,
      scale: 0.314,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'left-chest',
      scalePreset: 'compact',
    },
    'right-chest': {
      u: 0.165,
      v: 0.361,
      uvWidth: 0.11,
      scale: 0.314,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'right-chest',
      scalePreset: 'compact',
    },
    'full-front': {
      u: 0.211,
      v: 0.36,
      uvWidth: 0.32,
      scale: 0.914,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'full-front',
      scalePreset: 'oversized',
    },
    'bottom-hem': {
      u: 0.211,
      v: 0.22,
      uvWidth: 0.24,
      scale: 0.686,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'bottom-hem',
      scalePreset: 'standard',
    },
    'back-center': {
      u: 0.204,
      v: 0.752,
      uvWidth: 0.26,
      scale: 0.743,
      rotation: 0,
      regionId: 'back',
      placementTarget: 'back-center',
      scalePreset: 'standard',
    },
    'back-collar': {
      u: 0.204,
      v: 0.85,
      uvWidth: 0.12,
      scale: 0.343,
      rotation: 0,
      regionId: 'back',
      placementTarget: 'back-collar',
      scalePreset: 'compact',
    },
    'full-back': {
      u: 0.204,
      v: 0.74,
      uvWidth: 0.36,
      scale: 1.029,
      rotation: 0,
      regionId: 'back',
      placementTarget: 'full-back',
      scalePreset: 'oversized',
    },
    'left-sleeve': {
      u: 0.55,
      v: 0.82,
      uvWidth: 0.18,
      scale: 0.514,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'left-sleeve',
      scalePreset: 'standard',
    },
    'right-sleeve': {
      u: 0.55,
      v: 0.47,
      uvWidth: 0.18,
      scale: 0.514,
      rotation: 0,
      regionId: 'front',
      placementTarget: 'right-sleeve',
      scalePreset: 'standard',
    },
  },
};

export function normalizeGarmentKey(garmentId?: string): string {
  const norm = (garmentId || 'regular-t-shirt').toLowerCase();
  if (norm.includes('acid')) return 'acid-wash-t-shirt';
  if (norm.includes('oversized')) return 'oversized-t-shirt';
  if (norm.includes('hoodie')) return 'hoodie';
  return 'regular-t-shirt';
}

export function normalizePlacementTarget(target?: string): string {
  const t = (target || 'front-center').toLowerCase().trim();
  if (t.includes('left-sleeve') || t === 'sleeve-left') return 'left-sleeve';
  if (t.includes('right-sleeve') || t === 'sleeve-right') return 'right-sleeve';
  if (t.includes('sleeve') || t.includes('arm')) return 'left-sleeve';
  if (t.includes('left-chest') || t.includes('left chest') || t.includes('pocket')) return 'left-chest';
  if (t.includes('right-chest') || t.includes('right chest')) return 'right-chest';
  if (t.includes('back-collar') || t.includes('back collar') || t.includes('collar')) return 'back-collar';
  if (t.includes('full-back') || t.includes('full back')) return 'full-back';
  if (t.includes('full-front') || t.includes('full front')) return 'full-front';
  if (t.includes('bottom-hem') || t.includes('bottom hem') || t.includes('hem')) return 'bottom-hem';
  if (t.includes('back') || t.includes('rear')) return 'back-center';
  return 'front-center';
}

export function getRegionForTarget(target: string): 'front' | 'back' {
  const t = (target || '').toLowerCase();
  if (t.includes('back') || t.includes('collar') || t.includes('rear')) {
    return 'back';
  }
  return 'front';
}

/**
 * Retrieve saved calibrated placements from localStorage.
 */
export function getAllSavedPlacements(): Record<string, CalibratedPlacement> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Physical coordinate boundary validation.
 * Verifies that the UV coordinate falls inside the physically expected garment panel,
 * preventing front torso coordinates from ever contaminating the back, and vice versa.
 */
export function isCoordinateInCorrectPanel(
  garmentId: string,
  target: string,
  u: number,
  v: number
): boolean {
  const normGarment = normalizeGarmentKey(garmentId);
  const normTarget = normalizePlacementTarget(target);
  const expectedRegion = getRegionForTarget(normTarget);
  const isSleeve = normTarget.includes('sleeve');

  const panel = findPanelAtUV(normGarment, u, v);
  if (!panel) return true; // If outside known bounding boxes, allow fallback

  if (expectedRegion === 'back') {
    // If target is on the back, coordinate must be on back_body or collar. Reject front_body and sleeves!
    if (panel.id === 'front_body' || panel.id === 'left_sleeve' || panel.id === 'right_sleeve') {
      return false;
    }
    return panel.id === 'back_body' || panel.id === 'collar';
  }

  if (isSleeve) {
    if (panel.id === 'front_body' || panel.id === 'back_body') {
      return false;
    }
    return panel.id === 'left_sleeve' || panel.id === 'right_sleeve';
  }

  if (expectedRegion === 'front') {
    // If target is on front torso, coordinate must NOT be on back_body or sleeve!
    if (panel.id === 'back_body' || panel.id === 'left_sleeve' || panel.id === 'right_sleeve') {
      return false;
    }
    return panel.id === 'front_body' || panel.id === 'collar';
  }

  return true;
}

/**
 * Get calibrated placement for a specific design and garment.
 * Resolution priority:
 * 1. Specific design + garment + artId (`${designId}__${garmentKey}__${artId}`)
 * 2. Specific design + garment + target (`${designId}__${garmentKey}__${target}`)
 * 3. Specific design + garment + region (`${designId}__${garmentKey}__${regionId}`)
 * 4. Specific design + target (`${designId}__${target}`)
 * 5. Generic curated fallback for garment + target (`curated-design__${garmentKey}__${target}`)
 * 6. Hardcoded default garment calibration for target spot
 */
export function getCuratedPlacement(
  designId?: string | null,
  garmentId?: string | null,
  placementTarget?: string | null,
  artId?: string | null
): CalibratedPlacement {
  const garmentKey = normalizeGarmentKey(garmentId || undefined);
  const target = normalizePlacementTarget(placementTarget || undefined);
  const expectedRegion: 'front' | 'back' = getRegionForTarget(target);
  const isSleeve = target.includes('sleeve');

  const defaults =
    DEFAULT_GARMENT_CALIBRATIONS[garmentKey]?.[target] ||
    DEFAULT_GARMENT_CALIBRATIONS[garmentKey]?.[expectedRegion === 'back' ? 'back-center' : 'front-center'] ||
    DEFAULT_GARMENT_CALIBRATIONS['regular-t-shirt']['front-center'];

  const saved = getAllSavedPlacements();

  // Helper validator: strictly verify candidate placement matches the intended target & region
  const isValidCandidate = (c: CalibratedPlacement | undefined, isExplicitKey = false): boolean => {
    if (!c || typeof c.u !== 'number' || typeof c.v !== 'number') return false;
    // Explicit user-calibrated placements for this artwork or target must ALWAYS be honored
    if (isExplicitKey) return true;

    // For generic fallback keys, verify region consistency
    if (expectedRegion === 'back') {
      const isCandidateBack = c.regionId === 'back' || (c.placementTarget && c.placementTarget.includes('back'));
      if (!isCandidateBack) return false;
    }
    if (isSleeve) {
      const isCandidateSleeve = c.placementTarget && c.placementTarget.includes('sleeve');
      if (!isCandidateSleeve) return false;
    }
    if (expectedRegion === 'front' && !isSleeve) {
      if (c.regionId === 'back') return false;
      if (c.placementTarget && (c.placementTarget.includes('back') || c.placementTarget.includes('sleeve'))) {
        return false;
      }
    }
    return true;
  };

  // If a specific designId is given, check keyed variants in order of specificity
  if (designId) {
    // 1. By artId (e.g. design-001__regular-t-shirt__art-1)
    if (artId) {
      const cleanArt = artId.toLowerCase().trim();
      const artKey = `${designId}__${garmentKey}__${cleanArt}`;
      if (saved[artKey] && isValidCandidate(saved[artKey], true)) {
        return { ...defaults, ...saved[artKey] };
      }
      const numMatch = cleanArt.match(/\d+/);
      if (numMatch) {
        const num = parseInt(numMatch[0], 10);
        const alt1 = `${designId}__${garmentKey}__art-${num}`;
        const alt2 = `${designId}__${garmentKey}__art-0${num}`;
        if (saved[alt1] && isValidCandidate(saved[alt1], true)) {
          return { ...defaults, ...saved[alt1] };
        }
        if (saved[alt2] && isValidCandidate(saved[alt2], true)) {
          return { ...defaults, ...saved[alt2] };
        }
      }
    }

    // 2. By target (e.g. design-001__regular-t-shirt__back-center)
    const targetKey = `${designId}__${garmentKey}__${target}`;
    if (saved[targetKey] && isValidCandidate(saved[targetKey], true)) {
      return { ...defaults, ...saved[targetKey] };
    }

    // 3. By region (e.g. design-001__regular-t-shirt__back)
    const regionKey = `${designId}__${garmentKey}__${expectedRegion}`;
    if (saved[regionKey] && isValidCandidate(saved[regionKey], false)) {
      return { ...defaults, ...saved[regionKey] };
    }

    // 4. Fallback to generic design-target (e.g. design-001__back-center)
    const designTargetKey = `${designId}__${target}`;
    if (saved[designTargetKey] && isValidCandidate(saved[designTargetKey], true)) {
      return { ...defaults, ...saved[designTargetKey] };
    }

    // 5. Generic curated fallback for this garment and target
    const genericTargetKey = `curated-design__${garmentKey}__${target}`;
    if (saved[genericTargetKey] && isValidCandidate(saved[genericTargetKey], false)) {
      return { ...defaults, ...saved[genericTargetKey] };
    }

    // 6. Generic un-targeted design key ONLY if it strictly matches region & target
    const unkeyedGarment = `${designId}__${garmentKey}`;
    if (saved[unkeyedGarment] && isValidCandidate(saved[unkeyedGarment], false)) {
      if (saved[unkeyedGarment].placementTarget === target) {
        return { ...defaults, ...saved[unkeyedGarment] };
      }
    }
  } else {
    // No designId, check generic target key
    const genericTargetKey = `curated-design__${garmentKey}__${target}`;
    if (saved[genericTargetKey] && isValidCandidate(saved[genericTargetKey], false)) {
      return { ...defaults, ...saved[genericTargetKey] };
    }
  }

  return { ...defaults };
}

/**
 * Save calibrated placement for a design on a specific garment.
 */
export function saveCuratedPlacement(
  designId: string,
  garmentId: string,
  placement: CalibratedPlacement,
  targetOrLayerId?: string,
  artId?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const garmentKey = normalizeGarmentKey(garmentId);
    const target = normalizePlacementTarget(targetOrLayerId || placement.placementTarget);
    const regionId = placement.regionId || getRegionForTarget(target);
    const isHidden = placement.hidden ?? (placement.opacity === 0);
    const cleanedPlacement: CalibratedPlacement = {
      ...placement,
      u: parseFloat(placement.u.toFixed(5)),
      v: parseFloat(placement.v.toFixed(5)),
      uvWidth: parseFloat(placement.uvWidth.toFixed(5)),
      scale: parseFloat(placement.scale.toFixed(5)),
      rotation: Math.round(placement.rotation),
      regionId,
      placementTarget: target,
      hidden: isHidden,
      removed: placement.removed ?? false,
      opacity: typeof placement.opacity === 'number' ? placement.opacity : (isHidden ? 0 : 1.0),
    };

    const all = getAllSavedPlacements();

    const isInactive = cleanedPlacement.removed || cleanedPlacement.hidden || cleanedPlacement.opacity === 0;

    // 1. If active and visible, save with exact target and region keys
    if (!isInactive) {
      const specificKeyWithTarget = `${designId}__${garmentKey}__${target}`;
      all[specificKeyWithTarget] = cleanedPlacement;
      all[`${designId}__${garmentKey}__${regionId}`] = cleanedPlacement;
      all[`curated-design__${garmentKey}__${target}`] = cleanedPlacement;
    }

    // 2. Save with artId if provided (always preserve specific artId status)
    if (artId) {
      all[`${designId}__${garmentKey}__${artId}`] = cleanedPlacement;
    }

    // Clean up old un-targeted conflicting keys that caused front & back layers to collide
    delete all[`${designId}__${garmentKey}`];
    delete all[`curated-design__${garmentKey}`];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all, null, 2));

    // Persist to backend server API
    try {
      const payload: any = {
        designId,
        garmentId: garmentKey,
      };

      if (cleanedPlacement.removed && artId) {
        payload.removedArtIds = [artId];
      } else if (cleanedPlacement.hidden && artId) {
        payload.hiddenArtIds = [artId];
      } else {
        const specificKeyWithTarget = `${designId}__${garmentKey}__${target}`;
        payload.placements = {
          [specificKeyWithTarget]: cleanedPlacement,
          ...(artId ? { [`${designId}__${garmentKey}__${artId}`]: cleanedPlacement } : {}),
        };
      }

      fetch('/api/clothing-designs/save-placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.warn('[CuratedPlacements] Server persistence notice:', err);
      });
    } catch {
      /* ignore fetch error */
    }

    // Broadcast across frames & tabs
    try {
      window.dispatchEvent(
        new CustomEvent('starby:placement-saved', {
          detail: { designId, garmentId, placement: cleanedPlacement, target, artId },
        })
      );
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'STARBY_PLACEMENT_SAVED',
            designId,
            garmentId,
            target,
            artId,
            placement: cleanedPlacement,
          },
          '*'
        );
      }
    } catch {
      /* ignore broadcast error */
    }
  } catch (err) {
    console.warn('[CuratedPlacements] Failed to save placement:', err);
  }
}

/**
 * Clear customized placement for a design and garment.
 */
export function clearCuratedPlacement(designId: string, garmentId: string, target?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const garmentKey = normalizeGarmentKey(garmentId);
    const prefix = `${designId}__${garmentKey}`;
    const all = getAllSavedPlacements();
    if (target) {
      delete all[`${prefix}__${normalizePlacementTarget(target)}`];
    } else {
      for (const k of Object.keys(all)) {
        if (k === prefix || k.startsWith(`${prefix}__`)) {
          delete all[k];
        }
      }
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all, null, 2));
  } catch (err) {
    console.warn('[CuratedPlacements] Failed to clear placement:', err);
  }
}

/**
 * Export all saved placements as formatted JSON.
 */
export function exportCuratedPlacementsJson(): string {
  return JSON.stringify(getAllSavedPlacements(), null, 2);
}

/**
 * Sync server-stored placements for a design into localStorage.
 */
export async function syncServerPlacements(
  designId?: string | null,
  _garmentId?: string | null
): Promise<Record<string, CalibratedPlacement>> {
  if (typeof window === 'undefined' || !designId) return {};
  try {
    const qs = new URLSearchParams({ designId, _t: Date.now().toString() });
    const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
    const res = await fetch(`${base}/api/clothing-designs/save-placement?${qs.toString()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
    if (!res.ok) return {};
    const data = await res.json();
    if (data?.success && data.placements) {
      const all = getAllSavedPlacements();
      const merged = { ...all, ...data.placements };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged, null, 2));
      return merged;
    }
  } catch {
    /* ignore fetch error */
  }
  return {};
}

