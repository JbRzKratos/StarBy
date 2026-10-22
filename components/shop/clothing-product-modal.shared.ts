'use client';

import { useState, useEffect, useMemo, useCallback, useRef, type CSSProperties, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import type {
  ClothingDesignEntry,
  DesignArtworkOption,
  DesignPlacementTarget,
  DesignScalePreset,
  SavedPlacementItem,
} from '@/lib/clothing-designs/types';
import { parseNaturalLanguagePlacement } from '@/lib/clothing-designs/placement-parser';
import {
  APPAREL_CONFIG,
  APPAREL_LIST,
  getApparelPrice,
  type ApparelProductConfig,
  type ApparelColorSwatch,
} from '@/lib/config/apparel-variants';
import { getArtworkCharge } from '@/lib/config/garment-pricing';

export interface ClothingProductModalProps {
  design: ClothingDesignEntry | null;
  onClose: () => void;
  defaultCategory?: string; // 'tees' | 'hoodies'
  initialGarmentId?: string;
  initialColorHex?: string;
}

export const SCALE_PRESETS: { id: DesignScalePreset; label: string; desc: string }[] = [
  { id: 'compact', label: 'Compact', desc: 'Subtle (~65%)' },
  { id: 'standard', label: 'Standard', desc: 'Classic (100%)' },
  { id: 'oversized', label: 'Oversized', desc: 'Bold (~135%)' },
];

export const QUICK_NLP_PROMPTS = [
  { label: 'Left Chest Pocket', text: 'small left chest' },
  { label: 'Front Center', text: 'front center standard' },
  { label: 'Big Back Print', text: 'big full back graphic' },
  { label: 'Back Collar Nape', text: 'back collar logo' },
  { label: 'Left Sleeve', text: 'left sleeve logo' },
  { label: 'Full Front Statement', text: 'oversized full front' },
];

export function isBackPlacement(placement?: string): boolean {
  if (!placement) return false;
  return (
    placement === 'back' ||
    placement === 'back-center' ||
    placement === 'back-collar' ||
    placement === 'full-back'
  );
}

export function getPlacementRegion(placement?: string): 'front' | 'back' | 'sleeve' {
  if (!placement) return 'front';
  if (placement === 'left-sleeve' || placement === 'right-sleeve' || placement === 'sleeve') {
    return 'sleeve';
  }
  if (isBackPlacement(placement)) {
    return 'back';
  }
  return 'front';
}

/** True for white / cream / other light garment swatches. */
export function isLightGarmentHex(hex?: string): boolean {
  const value = (hex || '').trim().replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return true;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b >= 150;
}

/**
 * Colour-specific artwork variants (design-002 and similar) must only print on
 * the fabric colour they were drawn for. Artwork without a hint prints on all.
 */
export function isArtworkApplicableToColor(
  colorHint: string | undefined,
  garmentHex?: string
): boolean {
  if (!colorHint || colorHint === 'any') return true;
  const isLight = isLightGarmentHex(garmentHex);
  if (colorHint === 'black') return !isLight;
  if (colorHint === 'white') return isLight;
  return true;
}

export function isCoordinatePhysicallyInRegion(
  garment3dId: string,
  region: 'front' | 'back' | 'sleeve',
  u?: number,
  v?: number
): boolean {
  if (u === undefined || v === undefined) return true;
  const g = garment3dId.toLowerCase();

  if (g.includes('oversized') || g.includes('acid')) {
    // Oversized & Acid Wash: Front is U: [0.51..0.99], Back is U: [0.01..0.49], Sleeves: Left [0.01..0.37], Right [0.58..0.94]
    if (region === 'back') {
      return u <= 0.50 && v <= 0.65;
    }
    if (region === 'front') {
      return u >= 0.50 && v >= 0.35;
    }
    if (region === 'sleeve') {
      return (u < 0.45 && v > 0.60) || (u > 0.55 && v < 0.40);
    }
  } else if (g.includes('hoodie')) {
    // Hoodie: Front torso V: [0.18..0.60], Back torso V: [0.59..0.99], Sleeves U: [0.39..0.71]
    if (region === 'back') {
      return v >= 0.58 && u <= 0.45;
    }
    if (region === 'front') {
      return v <= 0.60 && u <= 0.45;
    }
    if (region === 'sleeve') {
      return u >= 0.38 && u <= 0.75;
    }
  } else {
    // Regular T-Shirt: Front is U: [0.01..0.49], Back is U: [0.51..0.99], Sleeves V: [0.14..0.34]
    if (region === 'back') {
      return u >= 0.50 && v >= 0.35;
    }
    if (region === 'front') {
      return u <= 0.50 && v >= 0.35;
    }
    if (region === 'sleeve') {
      return v <= 0.38;
    }
  }

  return true;
}

export function useClothingProductModalState({
  design,
  onClose,
  defaultCategory = 'tees',
  initialGarmentId: customGarmentId,
  initialColorHex: customColorHex,
}: ClothingProductModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [placementSaveVersion, setPlacementSaveVersion] = useState(0);

  // Listen for real-time placement changes saved from 3D studio
  useEffect(() => {
    const handlePlacementSaved = () => {
      setPlacementSaveVersion((v) => v + 1);
    };
    window.addEventListener('starby:placement-saved', handlePlacementSaved);
    window.addEventListener('fregoro_curated_placements_updated', handlePlacementSaved);
    return () => {
      window.removeEventListener('starby:placement-saved', handlePlacementSaved);
      window.removeEventListener('fregoro_curated_placements_updated', handlePlacementSaved);
    };
  }, []);

  // Mount effect and hide floating widgets (Tawk.to, WhatsApp) + body scroll lock
  useEffect(() => {
    setMounted(true);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('clothing-modal-open');

    const win = window as unknown as {
      Tawk_API?: { hideWidget?: () => void; showWidget?: () => void };
    };
    try {
      win.Tawk_API?.hideWidget?.();
    } catch {
      // Ignored if not loaded
    }

    return () => {
      document.body.style.overflow = origOverflow;
      document.body.classList.remove('clothing-modal-open');
      try {
        win.Tawk_API?.showWidget?.();
      } catch {
        // Ignored
      }
    };
  }, []);

  // Normalize artworks from design
  const artworks: DesignArtworkOption[] = useMemo(() => {
    if (!design) return [];
    if (design.artworks && design.artworks.length > 0) return design.artworks;
    return [
      {
        id: 'art-1',
        fileName: 'artwork.png',
        name: design.name || 'Artwork',
        suggestedPlacement: (design.defaultSurface || 'front-center') as DesignPlacementTarget,
        colorHint: 'any' as const,
        // Private print-file locations stay server-side. This fallback shape is
        // compiled into the client bundle, so never embed an original R2 key.
        originalPath: '',
        originalObjectKey: '',
        thumbnailObjectKey: '',
        previewObjectKey: '',
        previewUrl: design.previewUrl || `/api/clothing-designs/${design.id}/preview?type=thumbnail&v=v3`,
        studioPreviewUrl:
          design.studioPreviewUrl || `/api/clothing-designs/${design.id}/preview?type=studio&v=v3`,
      },
    ];
  }, [design]);

  // Determine initial garment type
  const initialGarmentId =
    customGarmentId || (defaultCategory === 'hoodies' ? 'hoodie' : 'regular-t-shirt');
  const [selectedGarmentId, setSelectedGarmentId] = useState<string>(initialGarmentId);
  const selectedGarment: ApparelProductConfig =
    APPAREL_CONFIG[selectedGarmentId] || APPAREL_CONFIG['regular-t-shirt'];

  // Color selection
  const [selectedColor, setSelectedColor] = useState<ApparelColorSwatch>(() => {
    if (customColorHex) {
      const match = selectedGarment.colors.find(
        (c) => c.hex.toLowerCase() === customColorHex.toLowerCase()
      );
      if (match) return match;
    }
    return selectedGarment.colors[0];
  });

  // Once the customer explicitly picks a colour, artwork selection must not
  // silently override it with the artwork's colourHint. This was making the
  // swatches look broken: pick a colour, tap an artwork, and the colour
  // snapped back to black/white. A ref keeps the guard without re-running
  // the placement initialiser every time a swatch is clicked.
  const colorManuallySelectedRef = useRef(Boolean(customColorHex));
  const handleSelectColor = useCallback((color: ApparelColorSwatch) => {
    colorManuallySelectedRef.current = true;
    setSelectedColor(color);
  }, []);

  // A new design / garment starts from its recommended colour again unless the
  // host page supplied an explicit colour for this product.
  useEffect(() => {
    colorManuallySelectedRef.current = Boolean(customColorHex);
  }, [design?.id, selectedGarmentId, customColorHex]);

  // Size selection
  const [selectedSize, setSelectedSize] = useState<string>('L');

  // Currently focused artwork for detailed configuration
  const [activeArtId, setActiveArtId] = useState<string>(
    design?.defaultArtworkId || artworks[0]?.id || 'art-1'
  );

  // Per-artwork placement configuration: Record<artId, DesignPlacementTarget>
  const [artworkPlacements, setArtworkPlacements] = useState<Record<string, DesignPlacementTarget>>(
    {}
  );

  // Per-artwork scale configuration: Record<artId, DesignScalePreset>
  const [artworkScales, setArtworkScales] = useState<Record<string, DesignScalePreset>>({});

  // Selected artworks to be loaded into the 3D tee
  const [includedArtworks, setIncludedArtworks] = useState<Set<string>>(new Set());

  // Current preview view side ('front' | 'back')
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');

  // Shown when a customer tries to move a calibrated artwork. Curated
  // placements are view-only; custom placement lives in the standalone studio.
  const [lockedPlacementNotice, setLockedPlacementNotice] = useState<string | null>(null);
  const lockedNoticeTimeoutRef = useRef<number | null>(null);
  const showLockedPlacementNotice = useCallback(() => {
    setLockedPlacementNotice(
      'This is a calibrated artwork for tees. Its placement is locked. For your own custom placement, go to the home page and click “Enter the Studio 360”.'
    );
    if (lockedNoticeTimeoutRef.current) {
      window.clearTimeout(lockedNoticeTimeoutRef.current);
    }
    lockedNoticeTimeoutRef.current = window.setTimeout(() => {
      setLockedPlacementNotice(null);
      lockedNoticeTimeoutRef.current = null;
    }, 7000);
  }, []);
  useEffect(
    () => () => {
      if (lockedNoticeTimeoutRef.current) {
        window.clearTimeout(lockedNoticeTimeoutRef.current);
      }
    },
    []
  );

  // Natural Language text input state
  const [nlpInputText, setNlpInputText] = useState<string>('');

  const isCuratedDesign = !!(
    design &&
    (design.id.startsWith('design-') ||
      design.id.includes('fregor') ||
      Boolean(design.category))
  );

  // Curated designs may contain alternate artwork for light / dark garments.
  // Keep the raw saved inclusion set intact, but only count and render variants
  // that apply to the colour currently selected.
  const effectiveIncludedArtworks = useMemo(() => {
    if (!isCuratedDesign) return includedArtworks;
    const next = new Set<string>();
    const colorHex = selectedColor?.hex || '#FFFFFF';
    includedArtworks.forEach((id) => {
      const art = artworks.find((a) => a.id === id);
      if (art && isArtworkApplicableToColor(art.colorHint, colorHex)) {
        next.add(id);
      }
    });
    return next;
  }, [isCuratedDesign, includedArtworks, artworks, selectedColor?.hex]);

  // Keep the active artwork in sync when the customer switches to a colour that
  // only has the alternate variant saved.
  useEffect(() => {
    if (!isCuratedDesign || effectiveIncludedArtworks.size === 0) return;
    if (effectiveIncludedArtworks.has(activeArtId)) return;
    const nextActive = artworks.find((art) => effectiveIncludedArtworks.has(art.id));
    if (nextActive) setActiveArtId(nextActive.id);
  }, [isCuratedDesign, effectiveIncludedArtworks, activeArtId, artworks]);

  // Calibrated coordinates per artwork: Record<artId, SavedPlacementItem>
  const [artworkCalibratedCoords, setArtworkCalibratedCoords] = useState<Record<string, SavedPlacementItem>>({});
  // Keep the latest calibrated coords in a ref so reading them does not change
  // the identity of `getSavedPlacementForDesign` on every render. A changing
  // callback identity used to retrigger the placement initialiser, which reset
  // the customer's print-inclusion toggles immediately after they were clicked.
  const artworkCalibratedCoordsRef = useRef<Record<string, SavedPlacementItem>>({});
  useEffect(() => {
    artworkCalibratedCoordsRef.current = artworkCalibratedCoords;
  }, [artworkCalibratedCoords]);

  // Fetch persisted server placements on mount / design load and merge into localStorage
  useEffect(() => {
    if (!design?.id) return;
    let isCancelled = false;
    fetch(`/api/clothing-designs/save-placement?designId=${encodeURIComponent(design.id)}&_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled || !data?.success || !data.placements) return;
        try {
          const placements = data.placements;
          const KEY1 = 'fregoro_curated_placements';
          const KEY2 = 'fregoro_curated_placements_v2';
          
          let existing1: Record<string, SavedPlacementItem> = {};
          let existing2: Record<string, SavedPlacementItem> = {};
          try { existing1 = JSON.parse(window.localStorage.getItem(KEY1) || '{}'); } catch {}
          try { existing2 = JSON.parse(window.localStorage.getItem(KEY2) || '{}'); } catch {}

          const merged = { ...existing1, ...existing2, ...placements };
          const jsonStr = JSON.stringify(merged, null, 2);
          window.localStorage.setItem(KEY1, jsonStr);
          window.localStorage.setItem(KEY2, jsonStr);

          const mappedByArtId: Record<string, SavedPlacementItem> = {};
          if (design?.artworks) {
            const normGarment = (selectedGarment?.garment3dId || 'regular-t-shirt').toLowerCase();
            design.artworks.forEach((art) => {
              const artKey = `${design.id}__${normGarment}__${art.id.toLowerCase()}`;
              const targetKey = `${design.id}__${normGarment}__${art.suggestedPlacement}`;
              if (merged[artKey]) mappedByArtId[art.id] = merged[artKey];
              else if (merged[targetKey]) mappedByArtId[art.id] = merged[targetKey];
            });
          }

          setArtworkCalibratedCoords((prev) => ({ ...prev, ...merged, ...mappedByArtId }));
          setPlacementSaveVersion((v) => v + 1);
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [design?.id, design?.artworks, selectedGarment?.garment3dId]);

  // Helper to load calibrated placement from localStorage with target & artId isolation
  const getSavedPlacementForDesign = useCallback(
    (garment3dId: string, artId?: string, target?: string) => {
      if (typeof window === 'undefined' || !design) return null;
      try {
        const all: Record<string, SavedPlacementItem> = {};
        try {
          const raw1 = window.localStorage.getItem('fregoro_curated_placements');
          if (raw1) Object.assign(all, JSON.parse(raw1));
        } catch {}
        try {
          const raw2 = window.localStorage.getItem('fregoro_curated_placements_v2');
          if (raw2) Object.assign(all, JSON.parse(raw2));
        } catch {}
        const calibratedCoords = artworkCalibratedCoordsRef.current;
        if (calibratedCoords && Object.keys(calibratedCoords).length > 0) {
          Object.assign(all, calibratedCoords);
        }

        const normGarment = garment3dId.toLowerCase();
        const reqIsBack = target ? (target.includes('back') || target.includes('collar')) : false;
        const reqIsSleeve = target ? target.includes('sleeve') : false;
        const expectedRegion: 'front' | 'back' | 'sleeve' = reqIsBack ? 'back' : reqIsSleeve ? 'sleeve' : 'front';

        const validateCandidate = (candidate: Partial<SavedPlacementItem> | null | undefined): boolean => {
          if (!candidate || typeof candidate.u !== 'number' || typeof candidate.v !== 'number') return false;
          if (target) {
            if (!isCoordinatePhysicallyInRegion(normGarment, expectedRegion, candidate.u, candidate.v)) {
              return false;
            }
          }
          return true;
        };

        // An art-specific saved record knows its own side. Do not reject it just
        // because the manifest's suggested placement is on a different panel
        // (e.g. design-002's hoodie artwork was saved on the back).
        const validateArtCandidate = (candidate: Partial<SavedPlacementItem> | null | undefined): boolean => {
          if (!candidate || typeof candidate.u !== 'number' || typeof candidate.v !== 'number') return false;
          const candidateTarget = candidate.placementTarget || '';
          const candidateRegion: 'front' | 'back' | 'sleeve' =
            candidate.regionId === 'back' || candidateTarget.includes('back')
              ? 'back'
              : candidateTarget.includes('sleeve')
              ? 'sleeve'
              : 'front';
          return isCoordinatePhysicallyInRegion(normGarment, candidateRegion, candidate.u, candidate.v);
        };

        // 1. Exact artId match IF it's physically in the correct garment panel
        if (artId) {
          const cleanArt = artId.toLowerCase().trim();
          const artKey = `${design.id}__${normGarment}__${cleanArt}`;
          if (all[artKey] && validateArtCandidate(all[artKey])) return all[artKey];
        }

        // 2. Exact placement target match (e.g. design-001__oversized-t-shirt__front-center)
        if (target) {
          const targetKey = `${design.id}__${normGarment}__${target}`;
          if (all[targetKey] && validateCandidate(all[targetKey])) return all[targetKey];
          const region = reqIsBack ? 'back' : 'front';
          const regionKey = `${design.id}__${normGarment}__${region}`;
          if (all[regionKey] && validateCandidate(all[regionKey])) return all[regionKey];
        }

        // 3. Fallback to generic design + target key
        if (target) {
          const designTargetKey = `${design.id}__${target}`;
          if (all[designTargetKey] && validateCandidate(all[designTargetKey])) return all[designTargetKey];
        }

        const specificKey = `${design.id}__${normGarment}`;
        const item = all[specificKey];
        if (item && validateCandidate(item)) return item;
        return null;
      } catch {
        return null;
      }
    },
    [design]
  );

  // Initialize placements, scales, and included artworks when design changes or garment changes
  useEffect(() => {
    if (!design || artworks.length === 0) return;

    const initialPlacements: Record<string, DesignPlacementTarget> = {};
    const initialScales: Record<string, DesignScalePreset> = {};
    const initialCoords: Record<string, SavedPlacementItem> = {};
    const initialIncluded = new Set<string>();

    artworks.forEach((art) => {
      let initPlacement: DesignPlacementTarget = (art.suggestedPlacement as DesignPlacementTarget) || 'front-center';
      if ((initPlacement as string) === 'front') initPlacement = 'front-center';
      if ((initPlacement as string) === 'back') initPlacement = 'back-center';
      if ((initPlacement as string) === 'sleeve') initPlacement = 'left-sleeve';

      let initScale: DesignScalePreset =
        initPlacement === 'left-chest' || initPlacement === 'right-chest' || initPlacement === 'back-collar'
          ? 'compact'
          : initPlacement === 'full-front' || initPlacement === 'full-back'
          ? 'oversized'
          : 'standard';

      // Look up saved placement specifically for this artwork or target
      const serverCalibrated = art.calibratedPlacement;
      const savedForArt = getSavedPlacementForDesign(selectedGarment.garment3dId, art.id, initPlacement) || serverCalibrated;
      if (savedForArt) {
        initialCoords[art.id] = savedForArt;
        if (savedForArt.placementTarget) {
          initPlacement = savedForArt.placementTarget as DesignPlacementTarget;
        }
        if (savedForArt.scalePreset) {
          initScale = savedForArt.scalePreset as DesignScalePreset;
        } else if (savedForArt.uvWidth) {
          initScale =
            savedForArt.uvWidth > 0.3 ? 'oversized' : savedForArt.uvWidth < 0.18 ? 'compact' : 'standard';
        }
      }

      initialPlacements[art.id] = initPlacement;
      initialScales[art.id] = initScale;

      // Colour-specific variants are alternates for the same print slot. The
      // saved hidden/zero-opacity flag usually belongs to the other fabric
      // colour (e.g. design-002's white artwork was hidden when the designer
      // saved on black), so let the selected colour decide whether it prints.
      const isColorVariant = art.colorHint === 'black' || art.colorHint === 'white';
      const isRemovedOrHidden =
        art.removed === true ||
        art.hidden === true ||
        savedForArt?.removed === true ||
        (!isColorVariant &&
          (savedForArt?.hidden === true || savedForArt?.opacity === 0));

      if (!isRemovedOrHidden) {
        initialIncluded.add(art.id);
      }
    });

    if (initialIncluded.size === 0 && artworks.length > 0) {
      initialIncluded.add(artworks[0].id);
    }

    setArtworkPlacements(initialPlacements);
    setArtworkScales(initialScales);
    setArtworkCalibratedCoords(initialCoords);
    setIncludedArtworks(initialIncluded);

    const firstIncludedId = Array.from(initialIncluded)[0] || artworks[0]?.id;
    const defaultId =
      design.defaultArtworkId && initialIncluded.has(design.defaultArtworkId)
        ? design.defaultArtworkId
        : firstIncludedId;
    setActiveArtId(defaultId);

    const defaultArt = artworks.find((a) => a.id === defaultId) || artworks[0];
    const targetPlacement = (defaultId && initialPlacements[defaultId]) || defaultArt?.suggestedPlacement || 'front-center';
    const initialSide = isBackPlacement(targetPlacement) ? 'back' : 'front';
    setPreviewSide(initialSide);

    // Auto-match colorHint if specified on default artwork, unless the
    // customer has already chosen a colour for this design.
    if (!colorManuallySelectedRef.current) {
      if (defaultArt.colorHint === 'black') {
        const blackSwatch = selectedGarment.colors.find((c) =>
          c.name.toLowerCase().includes('black')
        );
        if (blackSwatch) setSelectedColor(blackSwatch);
      } else if (defaultArt.colorHint === 'white') {
        const whiteSwatch = selectedGarment.colors.find((c) =>
          c.name.toLowerCase().includes('white')
        );
        if (whiteSwatch) setSelectedColor(whiteSwatch);
      }
    }
  }, [design, artworks, selectedGarment.colors, selectedGarment.garment3dId, getSavedPlacementForDesign, placementSaveVersion]);

  // Sync color palette when garment type changes
  useEffect(() => {
    if (selectedGarment && selectedGarment.colors.length > 0) {
      const matched = selectedGarment.colors.find(
        (c) =>
          c.hex.toLowerCase() === selectedColor.hex.toLowerCase() || c.name === selectedColor.name
      );
      setSelectedColor(matched || selectedGarment.colors[0]);
    }
  }, [selectedGarmentId, selectedGarment, selectedColor.hex, selectedColor.name]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Real-time NLP parsed result
  const nlpParsed = useMemo(() => {
    if (!nlpInputText.trim()) return null;
    return parseNaturalLanguagePlacement(nlpInputText);
  }, [nlpInputText]);

  const currentActiveArt = artworks.find((a) => a.id === activeArtId) || artworks[0] || null;

  const currentPlacement: DesignPlacementTarget =
    (currentActiveArt && artworkPlacements[currentActiveArt.id]) ||
    currentActiveArt?.suggestedPlacement ||
    'front-center';

  const currentScale: DesignScalePreset =
    (currentActiveArt && artworkScales[currentActiveArt.id]) ||
    (currentPlacement === 'left-chest' || currentPlacement === 'right-chest'
      ? 'compact'
      : 'standard');

  const handleSelectArtwork = (art: DesignArtworkOption) => {
    setActiveArtId(art.id);

    // A curated design's saved inclusion is view-only. Keep hidden / alternate
    // variants out of the print set even if a customer taps the card.
    if (!isCuratedDesign) {
      setIncludedArtworks((prev) => {
        const next = new Set(prev);
        next.add(art.id);
        return next;
      });
    }

    // Prefer the placement the designer saved over the manifest's suggestion.
    // This is what makes clicking an artwork show exactly the saved front/back
    // position instead of snapping to a generic side.
    const candidateTarget =
      (art.calibratedPlacement?.placementTarget as DesignPlacementTarget | undefined) ||
      artworkPlacements[art.id] ||
      art.suggestedPlacement ||
      'front-center';
    const saved =
      getSavedPlacementForDesign(selectedGarment.garment3dId, art.id, candidateTarget) ||
      art.calibratedPlacement;
    const resolvedPlacement: DesignPlacementTarget =
      (saved?.placementTarget as DesignPlacementTarget | undefined) ||
      (saved?.regionId === 'back' ? 'back-center' : saved?.regionId === 'front' ? 'front-center' : candidateTarget);

    if (saved) {
      setArtworkCalibratedCoords((prev) => ({
        ...prev,
        [art.id]: saved,
      }));
      setArtworkPlacements((prev) => ({
        ...prev,
        [art.id]: resolvedPlacement,
      }));
      if (saved.scalePreset) {
        setArtworkScales((prev) => ({
          ...prev,
          [art.id]: saved.scalePreset as DesignScalePreset,
        }));
      }
    }

    const isBack = isBackPlacement(resolvedPlacement) || saved?.regionId === 'back';
    setPreviewSide(isBack ? 'back' : 'front');

    if (!colorManuallySelectedRef.current) {
      if (art.colorHint === 'black') {
        const blackSwatch = selectedGarment.colors.find((c) =>
          c.name.toLowerCase().includes('black')
        );
        if (blackSwatch) setSelectedColor(blackSwatch);
      } else if (art.colorHint === 'white') {
        const whiteSwatch = selectedGarment.colors.find((c) =>
          c.name.toLowerCase().includes('white')
        );
        if (whiteSwatch) setSelectedColor(whiteSwatch);
      }
    }
  };

  /**
   * Move an artwork to a placement target.
   *
   * `artId` is optional so callers that already know which card was clicked
   * (the per-card Front/Back buttons) update *that* artwork. Relying on the
   * active-artwork state here was racy: `setActiveArtId` is async, so the
   * button always moved the previously active artwork instead of the clicked
   * one.
   */
  const handleUpdatePlacement = (placement: DesignPlacementTarget, artId?: string) => {
    if (isCuratedDesign) return;
    const targetArt = artId
      ? artworks.find((art) => art.id === artId) || currentActiveArt
      : currentActiveArt;
    if (!targetArt) return;

    if (artId) setActiveArtId(targetArt.id);

    setArtworkPlacements((prev) => ({
      ...prev,
      [targetArt.id]: placement,
    }));

    // Immediately resolve and apply calibrated coords for the newly selected target
    const saved = getSavedPlacementForDesign(selectedGarment.garment3dId, targetArt.id, placement);
    if (saved) {
      setArtworkCalibratedCoords((prev) => ({
        ...prev,
        [targetArt.id]: saved,
      }));
    }

    const isBack = isBackPlacement(placement);
    setPreviewSide(isBack ? 'back' : 'front');
  };

  const handleUpdateSide = (region: 'front' | 'back' | 'sleeve') => {
    if (isCuratedDesign) return;
    if (!currentActiveArt) return;
    if (region === 'front') {
      setPreviewSide('front');
      if (isBackPlacement(currentPlacement) || currentPlacement.includes('sleeve')) {
        handleUpdatePlacement('front-center');
      }
    } else if (region === 'back') {
      setPreviewSide('back');
      if (!isBackPlacement(currentPlacement)) {
        handleUpdatePlacement('back-center');
      }
    } else if (region === 'sleeve') {
      setPreviewSide('front');
      if (!currentPlacement.includes('sleeve')) {
        handleUpdatePlacement('left-sleeve');
      }
    }
  };

  const handleSwitchSide = (side: 'front' | 'back') => {
    setPreviewSide(side);
    const artOnNewSide = artworks.find((art) => {
      if (!effectiveIncludedArtworks.has(art.id)) return false;
      const placement = artworkPlacements[art.id] || art.suggestedPlacement || 'front-center';
      return side === 'back' ? isBackPlacement(placement) : !isBackPlacement(placement);
    });
    if (artOnNewSide) {
      setActiveArtId(artOnNewSide.id);
    }
  };

  const handleUpdateScale = (scale: DesignScalePreset) => {
    if (isCuratedDesign) return;
    if (!currentActiveArt) return;
    setArtworkScales((prev) => ({
      ...prev,
      [currentActiveArt.id]: scale,
    }));
  };

  const handleNlpInputChange = (val: string) => {
    if (isCuratedDesign) return;
    setNlpInputText(val);
    if (!val.trim() || !currentActiveArt) return;

    const parsed = parseNaturalLanguagePlacement(val);
    setArtworkPlacements((prev) => ({
      ...prev,
      [currentActiveArt.id]: parsed.placement,
    }));
    setArtworkScales((prev) => ({
      ...prev,
      [currentActiveArt.id]: parsed.scale,
    }));

    const isBack =
      parsed.placement === 'back' ||
      parsed.placement === 'back-center' ||
      parsed.placement === 'back-collar' ||
      parsed.placement === 'full-back';
    setPreviewSide(isBack ? 'back' : 'front');
  };

  const handleApplyQuickPrompt = (promptText: string) => {
    if (isCuratedDesign) return;
    setNlpInputText(promptText);
    handleNlpInputChange(promptText);
  };

  const handleToggleInclude = (artId: string) => {
    if (isCuratedDesign) return;
    setIncludedArtworks((prev) => {
      const next = new Set(prev);
      if (next.has(artId)) {
        if (next.size > 1) {
          next.delete(artId);
        }
      } else {
        next.add(artId);
      }
      return next;
    });
  };

  // Click on 2D Garment Mockup plate to pinpoint placement
  const handleGarmentMockupClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isCuratedDesign) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    if (previewSide === 'front') {
      if (relY > 0.68) {
        handleUpdatePlacement('bottom-hem');
      } else if (relY < 0.42 && relX > 0.52) {
        handleUpdatePlacement('left-chest');
      } else if (relY < 0.42 && relX < 0.48) {
        handleUpdatePlacement('right-chest');
      } else if (relX < 0.22) {
        handleUpdatePlacement('right-sleeve');
      } else if (relX > 0.78) {
        handleUpdatePlacement('left-sleeve');
      } else {
        handleUpdatePlacement('front-center');
      }
    } else {
      if (relY < 0.3) {
        handleUpdatePlacement('back-collar');
      } else if (relY > 0.68) {
        handleUpdatePlacement('bottom-hem');
      } else {
        handleUpdatePlacement('back-center');
      }
    }
  };

  const handleLaunch3D = () => {
    if (!design) return;

    try {
      // Send every saved artwork in the set, including the alternate black /
      // white variant. The studio decides visibility from the current colour,
      // so switching fabric colour keeps the saved print set intact.
      const layersToLoad = Array.from(includedArtworks).map((id, index) => {
        const art = artworks.find((a) => a.id === id) || (artworks && artworks.length > 0 ? artworks[0] : null);
        const artId = art?.id || id;
        const artName = art?.name || `Artwork ${index + 1}`;
        const placement = artworkPlacements[artId] || art?.suggestedPlacement || 'front-center';
        const scalePreset =
          artworkScales[artId] ||
          (placement === 'left-chest' || placement === 'right-chest' ? 'compact' : 'standard');
        const isApplicableToColour = isArtworkApplicableToColor(
          art?.colorHint,
          selectedColor?.hex || '#FFFFFF'
        );
        const calibrated =
          artworkCalibratedCoords[artId] ||
          getSavedPlacementForDesign(selectedGarment?.garment3dId || 'regular-t-shirt', artId, placement) ||
          art?.calibratedPlacement;

        const artStudioUrl =
          (art?.studioPreviewUrl && !art.studioPreviewUrl.includes('r2.dev') ? art.studioPreviewUrl : null) ||
          (art?.previewUrl && !art.previewUrl.includes('r2.dev') ? art.previewUrl : null) ||
          `/api/clothing-designs/${design.id}/preview?artId=${artId}&type=studio&v=v3`;

        return {
          id: `fregor-art-${artId}-${index}`,
          name: artName,
          previewUrl: artStudioUrl,
          placement,
          scalePreset,
          scale: scalePreset,
          curatedDesignId: design.id,
          isCurated: true,
          colorHint: art?.colorHint,
          hidden: !isApplicableToColour,
          opacity: isApplicableToColour ? 1 : 0,
          ...(calibrated
            ? {
                u: calibrated.u,
                v: calibrated.v,
                uvWidth: calibrated.uvWidth,
                uvHeight: calibrated.uvHeight || calibrated.uvWidth,
                scale: calibrated.scale,
                rotation: calibrated.rotation || 0,
                regionId: calibrated.regionId,
                placementTarget: calibrated.placementTarget || placement,
              }
            : {}),
        };
      });

      const primaryArt =
        (currentActiveArt && effectiveIncludedArtworks.has(currentActiveArt.id)
          ? currentActiveArt
          : null) ||
        artworks.find((art) => effectiveIncludedArtworks.has(art.id)) ||
        currentActiveArt ||
        (artworks && artworks.length > 0 ? artworks[0] : null);
      const primaryArtId = primaryArt?.id || 'art-1';
      const primaryPlacement =
        (primaryArt && artworkPlacements[primaryArt.id]) || primaryArt?.suggestedPlacement || 'front-center';
      const primaryScale = (primaryArt && artworkScales[primaryArt.id]) || 'standard';
      const primaryCalibrated =
        (primaryArt && artworkCalibratedCoords[primaryArt.id]) ||
        getSavedPlacementForDesign(selectedGarment?.garment3dId || 'regular-t-shirt', primaryArtId, primaryPlacement) ||
        primaryArt?.calibratedPlacement;

      const sUpper = (selectedSize || 'L').trim().toUpperCase();
      const customSizePrice =
        design.sizePrices && typeof design.sizePrices === 'object'
          ? (design.sizePrices[sUpper] ?? (sUpper === '3XL' || sUpper === 'XXXL' ? (design.sizePrices['3XL'] ?? design.sizePrices['XXXL']) : (design.sizePrices['2XL'] ?? design.sizePrices['XXL'])))
          : undefined;
      // Pass the design's own catalogue price to the studio. The studio (and
      // the checkout) then applies max(design price, garment size price) so the
      // total changes correctly when the garment is swapped.
      const designSizePrice =
        typeof customSizePrice === 'number' && customSizePrice > 0
          ? customSizePrice
          : design.basePrice && design.basePrice > 0
            ? design.basePrice
            : 639;

      const removedArtIds = (artworks || [])
        .filter((a) => !includedArtworks.has(a.id))
        .map((a) => a.id.toLowerCase());

      const garment3dId = selectedGarment?.garment3dId || 'regular-t-shirt';
      const garmentName = selectedGarment?.name || 'Regular T-Shirt';
      const colorHex = selectedColor?.hex || selectedGarment?.colors?.[0]?.hex || '#FFFFFF';
      const colorName = selectedColor?.name || selectedGarment?.colors?.[0]?.name || 'White';
      const primaryPreviewUrl =
        (primaryArt?.studioPreviewUrl && !primaryArt.studioPreviewUrl.includes('r2.dev') ? primaryArt.studioPreviewUrl : null) ||
        (primaryArt?.previewUrl && !primaryArt.previewUrl.includes('r2.dev') ? primaryArt.previewUrl : null) ||
        (design.studioPreviewUrl && !design.studioPreviewUrl.includes('r2.dev') ? design.studioPreviewUrl : null) ||
        (design.previewUrl && !design.previewUrl.includes('r2.dev') ? design.previewUrl : null) ||
        `/api/clothing-designs/${design.id}/preview?artId=${primaryArtId}&type=studio&v=v3`;

      const params = new URLSearchParams({
        designId: design.id,
        curated: 'true',
        designName: design.name,
        garment: garment3dId,
        garmentName: garmentName,
        color: colorHex,
        colorName: colorName,
        size: selectedSize || 'L',
        placement: primaryPlacement,
        scale: primaryScale,
        previewUrl: primaryPreviewUrl,
        layers: JSON.stringify(layersToLoad),
        price: designSizePrice.toString(),
        artworkCount: activeArtworkCount.toString(),
        ...(removedArtIds.length > 0 ? { removedArtIds: JSON.stringify(removedArtIds) } : {}),
        ...(primaryCalibrated?.u !== undefined ? { u: primaryCalibrated.u.toString() } : {}),
        ...(primaryCalibrated?.v !== undefined ? { v: primaryCalibrated.v.toString() } : {}),
      });

      // Close modal first to unlock body scroll and unmount modal overlay
      try {
        onClose();
      } catch {
        /* ignore */
      }

      const studioUrl = `/customize/clothing-mockup?${params.toString()}`;
      if (typeof window !== 'undefined') {
        window.location.href = studioUrl;
      } else {
        router.push(studioUrl);
      }
    } catch (err) {
      console.error('[ClothingProductModal] Failed to launch 3D studio:', err);
      try {
        onClose();
      } catch {
        /* ignore */
      }
      const fallbackUrl = `/customize/clothing-mockup?designId=${encodeURIComponent(design.id)}&garment=${encodeURIComponent(selectedGarment?.garment3dId || 'regular-t-shirt')}`;
      if (typeof window !== 'undefined') {
        window.location.href = fallbackUrl;
      } else {
        router.push(fallbackUrl);
      }
    }
  };

  const getPreviewPlacementStyles = (
    placement: DesignPlacementTarget,
    scale: DesignScalePreset,
    isMobile?: boolean,
    calibrated?: {
      u?: number;
      v?: number;
      uvWidth?: number;
      scale?: number;
      rotation?: number;
      regionId?: string;
      placementTarget?: string;
    } | null,
    garmentIdOverride?: string
  ): CSSProperties => {
    let scaleMultiplier = isMobile ? 0.65 : 1.0;
    if (scale === 'compact') scaleMultiplier *= 0.8;
    if (scale === 'oversized') scaleMultiplier *= 1.35;

    let baseSizePx = 155;
    let topPercent = '46%';
    let leftPercent = '50%';
    let rotationDeg = 0;

    const isBack = isBackPlacement(placement);
    const isSleeve = placement.includes('sleeve');
    const calibratedTarget = calibrated?.placementTarget || '';
    const calibratedIsBack = calibrated?.regionId === 'back' || calibratedTarget.includes('back');
    const calibratedIsSleeve =
      calibrated?.regionId === 'sleeve' || calibratedTarget.includes('sleeve');
    const isRegionMatch =
      (!calibrated?.regionId && !calibratedTarget) ||
      (isBack ? calibratedIsBack : isSleeve ? calibratedIsSleeve : !calibratedIsBack && !calibratedIsSleeve);

    if (calibrated && typeof calibrated.u === 'number' && typeof calibrated.v === 'number' && isRegionMatch) {
      const g = (garmentIdOverride || selectedGarment?.garment3dId || 'regular-t-shirt').toLowerCase();

      let centerU = 0.25;
      let centerV = 0.635;

      if (g.includes('oversized') || g.includes('acid')) {
        if (isBack) {
          centerU = 0.25;
          centerV = 0.30;
        } else if (isSleeve) {
          centerU = placement === 'right-sleeve' ? 0.76 : 0.18;
          centerV = placement === 'right-sleeve' ? 0.25 : 0.80;
        } else {
          // Front
          centerU = 0.75;
          centerV = 0.66;
        }
      } else if (g.includes('hoodie')) {
        if (isBack) {
          centerU = 0.20;
          centerV = 0.79;
        } else if (isSleeve) {
          centerU = 0.55;
          centerV = placement === 'right-sleeve' ? 0.47 : 0.82;
        } else {
          // Front
          centerU = 0.21;
          centerV = 0.38;
        }
      } else {
        // Regular T-Shirt & standard default
        if (isBack) {
          centerU = 0.75;
          centerV = 0.66;
        } else if (isSleeve) {
          centerU = placement === 'right-sleeve' ? 0.21 : 0.75;
          centerV = 0.26;
        } else {
          // Front
          centerU = 0.25;
          centerV = 0.635;
        }
      }

      const baseTopPct = isBack ? 46 : isSleeve ? 35 : 46;
      const baseLeftPct = isBack ? 50 : isSleeve ? (placement === 'right-sleeve' ? 18 : 82) : 50;

      const deltaU = calibrated.u - centerU;
      const deltaV = calibrated.v - centerV;

      const computedLeft = baseLeftPct + deltaU * (isSleeve ? 100 : 220);
      const computedTop = baseTopPct - deltaV * (isSleeve ? 100 : 200);

      leftPercent = `${Math.max(10, Math.min(90, computedLeft)).toFixed(1)}%`;
      topPercent = `${Math.max(10, Math.min(90, computedTop)).toFixed(1)}%`;

      if (calibrated.uvWidth) {
        baseSizePx = Math.round(calibrated.uvWidth * (isMobile ? 380 : 580));
      }
      if (calibrated.rotation) {
        rotationDeg = calibrated.rotation;
      }
    } else {
      switch (placement) {
        case 'left-chest':
          baseSizePx = 95;
          topPercent = '28%';
          leftPercent = '64%';
          break;
        case 'right-chest':
          baseSizePx = 95;
          topPercent = '28%';
          leftPercent = '36%';
          break;
        case 'front-center':
        case 'front':
          baseSizePx = 165;
          topPercent = '46%';
          leftPercent = '50%';
          break;
        case 'full-front':
          baseSizePx = 210;
          topPercent = '50%';
          leftPercent = '50%';
          break;
        case 'back-collar':
          baseSizePx = 65;
          topPercent = '19%';
          leftPercent = '50%';
          break;
        case 'back-center':
        case 'back':
          baseSizePx = 155;
          topPercent = '46%';
          leftPercent = '50%';
          break;
        case 'full-back':
          baseSizePx = 220;
          topPercent = '50%';
          leftPercent = '50%';
          break;
        case 'bottom-hem':
          baseSizePx = 85;
          topPercent = '76%';
          leftPercent = '50%';
          break;
        case 'left-sleeve':
          baseSizePx = 65;
          topPercent = '35%';
          leftPercent = '82%';
          break;
        case 'right-sleeve':
          baseSizePx = 65;
          topPercent = '35%';
          leftPercent = '18%';
          break;
        default:
          baseSizePx = 145;
          topPercent = '46%';
          leftPercent = '50%';
      }
    }

    const rawSize = Math.round(baseSizePx * (calibrated?.uvWidth ? 1.0 : scaleMultiplier));
    const maxAllowed = isMobile ? 120 : 165;
    const minAllowed = isMobile ? 35 : 45;
    const sizePx = Math.min(maxAllowed, Math.max(minAllowed, rawSize));

    return {
      position: 'absolute',
      top: topPercent,
      left: leftPercent,
      width: `${sizePx}px`,
      height: `${sizePx}px`,
      maxWidth: `${maxAllowed}px`,
      maxHeight: `${maxAllowed}px`,
      transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
    };
  };

  const isCurrentPlacementOnCurrentSide =
    previewSide === 'front'
      ? currentPlacement !== 'back' &&
      currentPlacement !== 'back-center' &&
      currentPlacement !== 'back-collar' &&
      currentPlacement !== 'full-back'
      : currentPlacement === 'back' ||
      currentPlacement === 'back-center' ||
      currentPlacement === 'back-collar' ||
      currentPlacement === 'full-back';

  const isOneRupee = design?.basePrice === 1 || design?.id === 'design-001';
  const selSizeUpper = (selectedSize || 'L').trim().toUpperCase();
  const customDesignSizePrice =
    design?.sizePrices && typeof design.sizePrices === 'object'
      ? (design.sizePrices[selSizeUpper] ?? (selSizeUpper === '3XL' || selSizeUpper === 'XXXL' ? (design.sizePrices['3XL'] ?? design.sizePrices['XXXL']) : (design.sizePrices['2XL'] ?? design.sizePrices['XXL'])))
      : undefined;
  const designSizePrice =
    typeof customDesignSizePrice === 'number' && customDesignSizePrice > 0
      ? customDesignSizePrice
      : design?.basePrice && design.basePrice > 0
        ? design.basePrice
        : 639;
  const garmentSizePrice = getApparelPrice(selectedGarmentId, selectedSize || 'L');
  // `effectiveIncludedArtworks` excludes deleted, hidden, zero-opacity and
  // colour-mismatched placements, so its size is the active print count.
  const activeArtworkCount = effectiveIncludedArtworks.size;
  const artworkCharge = isOneRupee
    ? 0
    : getArtworkCharge(selectedGarmentId, activeArtworkCount, { curated: true });
  const unitPrice = isOneRupee
    ? 1
    : Math.max(designSizePrice, garmentSizePrice) + artworkCharge;

  return {
    mounted,
    design,
    artworks,
    selectedGarmentId,
    setSelectedGarmentId,
    selectedGarment,
    activeArtworkCount,
    artworkCharge,
    unitPrice,
    selectedColor,
    setSelectedColor,
    handleSelectColor,
    selectedSize,
    setSelectedSize,
    activeArtId,
    setActiveArtId,
    artworkPlacements,
    artworkScales,
    artworkCalibratedCoords,
    includedArtworks: effectiveIncludedArtworks,
    setIncludedArtworks,
    previewSide,
    setPreviewSide,
    nlpInputText,
    setNlpInputText,
    nlpParsed,
    currentActiveArt,
    currentPlacement,
    currentScale,
    isCurrentPlacementOnCurrentSide,
    handleSelectArtwork,
    handleUpdatePlacement,
    handleUpdateSide,
    handleSwitchSide,
    handleUpdateScale,
    handleNlpInputChange,
    handleApplyQuickPrompt,
    handleToggleInclude,
    handleGarmentMockupClick,
    handleLaunch3D,
    getPreviewPlacementStyles,
    onClose,
    APPAREL_LIST,
    SCALE_PRESETS,
    QUICK_NLP_PROMPTS,
    isCuratedDesign,
    lockedPlacementNotice,
    showLockedPlacementNotice,
  };
}

export type ClothingModalState = ReturnType<typeof useClothingProductModalState>;
