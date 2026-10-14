'use client';

import { useState, useEffect, useMemo, type CSSProperties, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import type {
  ClothingDesignEntry,
  DesignArtworkOption,
  DesignPlacementTarget,
  DesignScalePreset,
} from '@/lib/clothing-designs/types';
import { parseNaturalLanguagePlacement } from '@/lib/clothing-designs/placement-parser';
import {
  APPAREL_CONFIG,
  APPAREL_LIST,
  type ApparelProductConfig,
  type ApparelColorSwatch,
} from '@/lib/config/apparel-variants';

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

export function useClothingProductModalState({
  design,
  onClose,
  defaultCategory = 'tees',
  initialGarmentId: customGarmentId,
  initialColorHex: customColorHex,
}: ClothingProductModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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
        originalPath: 'artwork.png',
        originalObjectKey: `clothing-designs/${design.id}/original/artwork.png`,
        thumbnailObjectKey: `clothing-designs/${design.id}/previews/thumb_front.webp`,
        previewObjectKey: `clothing-designs/${design.id}/previews/studio_front.webp`,
        previewUrl: design.previewUrl || `/api/clothing-designs/${design.id}/preview?type=thumbnail`,
        studioPreviewUrl:
          design.studioPreviewUrl || `/api/clothing-designs/${design.id}/preview?type=studio`,
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

  // Natural Language text input state
  const [nlpInputText, setNlpInputText] = useState<string>('');

  // Initialize placements, scales, and included artworks when design changes
  useEffect(() => {
    if (!design || artworks.length === 0) return;

    const initialPlacements: Record<string, DesignPlacementTarget> = {};
    const initialScales: Record<string, DesignScalePreset> = {};
    const initialIncluded = new Set<string>();

    artworks.forEach((art) => {
      let initPlacement: DesignPlacementTarget = art.suggestedPlacement || 'front-center';
      if (initPlacement === 'front') initPlacement = 'front-center';
      if (initPlacement === 'back') initPlacement = 'back-center';
      if (initPlacement === 'sleeve') initPlacement = 'left-sleeve';

      initialPlacements[art.id] = initPlacement;
      initialScales[art.id] =
        initPlacement === 'left-chest' || initPlacement === 'right-chest' ? 'compact' : 'standard';
      initialIncluded.add(art.id);
    });

    setArtworkPlacements(initialPlacements);
    setArtworkScales(initialScales);
    setIncludedArtworks(initialIncluded);

    const defaultId = design.defaultArtworkId || artworks[0].id;
    setActiveArtId(defaultId);

    const defaultArt = artworks.find((a) => a.id === defaultId) || artworks[0];
    const initialSide =
      defaultArt.suggestedPlacement === 'back' ||
        defaultArt.suggestedPlacement === 'back-center' ||
        defaultArt.suggestedPlacement === 'back-collar' ||
        defaultArt.suggestedPlacement === 'full-back'
        ? 'back'
        : 'front';
    setPreviewSide(initialSide);

    // Auto-match colorHint if specified on default artwork
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
  }, [design, artworks, selectedGarment.colors]);

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

    setIncludedArtworks((prev) => {
      const next = new Set(prev);
      next.add(art.id);
      return next;
    });

    const artPlacement = artworkPlacements[art.id] || art.suggestedPlacement || 'front-center';
    const isBack =
      artPlacement === 'back' ||
      artPlacement === 'back-center' ||
      artPlacement === 'back-collar' ||
      artPlacement === 'full-back';
    setPreviewSide(isBack ? 'back' : 'front');

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
  };

  const handleUpdatePlacement = (placement: DesignPlacementTarget) => {
    if (!currentActiveArt) return;
    setArtworkPlacements((prev) => ({
      ...prev,
      [currentActiveArt.id]: placement,
    }));

    const isBack = isBackPlacement(placement);
    setPreviewSide(isBack ? 'back' : 'front');
  };

  const handleUpdateSide = (region: 'front' | 'back' | 'sleeve') => {
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

  const handleUpdateScale = (scale: DesignScalePreset) => {
    if (!currentActiveArt) return;
    setArtworkScales((prev) => ({
      ...prev,
      [currentActiveArt.id]: scale,
    }));
  };

  const handleNlpInputChange = (val: string) => {
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
    setNlpInputText(promptText);
    handleNlpInputChange(promptText);
  };

  const handleToggleInclude = (artId: string) => {
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

    const layersToLoad = Array.from(includedArtworks).map((id, index) => {
      const art = artworks.find((a) => a.id === id) || artworks[0];
      const placement = artworkPlacements[art.id] || art.suggestedPlacement || 'front-center';
      const scalePreset =
        artworkScales[art.id] ||
        (placement === 'left-chest' || placement === 'right-chest' ? 'compact' : 'standard');

      return {
        id: `fregor-art-${art.id}-${index}`,
        name: art.name,
        previewUrl: art.studioPreviewUrl,
        placement,
        scalePreset,
        scale: scalePreset,
      };
    });

    const primaryArt = currentActiveArt || artworks[0];
    const primaryPlacement =
      artworkPlacements[primaryArt.id] || primaryArt.suggestedPlacement || 'front-center';
    const primaryScale = artworkScales[primaryArt.id] || 'standard';

    const params = new URLSearchParams({
      designId: design.id,
      designName: design.name,
      garment: selectedGarment.garment3dId,
      garmentName: selectedGarment.name,
      color: selectedColor.hex,
      colorName: selectedColor.name,
      size: selectedSize,
      placement: primaryPlacement,
      scale: primaryScale,
      previewUrl: primaryArt.studioPreviewUrl,
      layers: JSON.stringify(layersToLoad),
      price: selectedGarment.basePrice.toString(),
    });

    router.push(`/customize/clothing-mockup?${params.toString()}`);
  };

  const getPreviewPlacementStyles = (
    placement: DesignPlacementTarget,
    scale: DesignScalePreset,
    isMobile?: boolean
  ): CSSProperties => {
    let scaleMultiplier = isMobile ? 0.62 : 1.0;
    if (scale === 'compact') scaleMultiplier *= 0.72;
    if (scale === 'oversized') scaleMultiplier *= 1.35;

    let baseSizePx = 145;
    let topPercent = '46%';
    let leftPercent = '50%';

    switch (placement) {
      case 'left-chest':
        baseSizePx = 70;
        topPercent = '28%';
        leftPercent = '64%';
        break;
      case 'right-chest':
        baseSizePx = 70;
        topPercent = '28%';
        leftPercent = '36%';
        break;
      case 'front-center':
      case 'front':
        baseSizePx = 150;
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

    const sizePx = Math.round(baseSizePx * scaleMultiplier);

    return {
      position: 'absolute',
      top: topPercent,
      left: leftPercent,
      width: `${sizePx}px`,
      height: `${sizePx}px`,
      transform: 'translate(-50%, -50%)',
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

  return {
    mounted,
    design,
    artworks,
    selectedGarmentId,
    setSelectedGarmentId,
    selectedGarment,
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    activeArtId,
    setActiveArtId,
    artworkPlacements,
    artworkScales,
    includedArtworks,
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
  };
}

export type ClothingModalState = ReturnType<typeof useClothingProductModalState>;
