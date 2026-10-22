import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { SidebarTabs, type SidebarTab } from './components/SidebarTabs';

import { readOptimizedImageDataUrl } from './engine/validation';

// 3D Imports
import type {
  ArtworkLayer3D,
  CameraPreset3D,
  Garment3DConfig,
  ProjectState3D,
} from './types/threeD';
import { getGarmentConfig } from './engine/3d/registry';
import {
  buildLayerFromPlacement,
  parseNaturalLanguagePlacement,
} from './engine/3d/placementParser';
import { Viewport3D } from './components/3d/Viewport3D';
import { DrawerGarment3D } from './components/3d/DrawerGarment3D';
import { DrawerArtwork3D } from './components/3d/DrawerArtwork3D';
import { DrawerColor3D } from './components/3d/DrawerColor3D';
import { DrawerAnimation3D } from './components/3d/DrawerAnimation3D';
import { DrawerLighting3D } from './components/3d/DrawerLighting3D';
import { DrawerExport3D } from './components/3d/DrawerExport3D';
import { DrawerProject3D } from './components/3d/DrawerProject3D';
import { UVCanvasEditor3D } from './components/3d/UVCanvasEditor3D';
import { findPanelAtUV } from './engine/3d/garmentPanels';
import { AddToCartModal3D } from './components/3d/AddToCartModal3D';
import { Export3DManager } from './engine/3d/export3D';
import { getArtworkSide } from './engine/3d/artworkSides';
import type { SceneManager3D } from './engine/3d/sceneManager';
import type { TextureCompositor3D } from './engine/3d/textureCompositor';
import { ClothingDesignsDrawer, type ApplyDesignEvent } from './components/ClothingDesignsDrawer';
import { CURATED_CLOTHING_DESIGNS, type CuratedClothingDesign } from './data/clothingDesignsData';
import { DesignerPlacementBar } from './components/3d/DesignerPlacementBar';
import {
  getCuratedPlacement,
  saveCuratedPlacement,
  clearCuratedPlacement,
  syncServerPlacements,
  getAllSavedPlacements,
} from './engine/3d/curatedPlacements';
import type * as THREE from 'three';

const APPAREL_APPROVED_COLORS_MAP: Record<string, { name: string; hex: string }[]> = {
  'regular-t-shirt': [
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#111215' },
    { name: 'Olive Green', hex: '#3b443b' },
    { name: 'C.Brown', hex: '#5a3825' },
    { name: 'Maroon', hex: '#800000' },
  ],
  'oversized-t-shirt': [
    { name: 'White', hex: '#ffffff' },
    { name: 'Black', hex: '#111215' },
    { name: 'Dusky Pink', hex: '#d8a1a8' },
    { name: 'Beige', hex: '#d4c5b9' },
    { name: 'Navy Blue', hex: '#1b263b' },
  ],
  'acid-wash-t-shirt': [
    { name: 'Black', hex: '#2b2b2b' },
    { name: 'White', hex: '#e5e5e5' },
    { name: 'Violet', hex: '#5e4b8b' },
  ],
  'hoodie': [
    { name: 'Black', hex: '#111215' },
    { name: 'White', hex: '#ffffff' },
  ],
};

function getApprovedColorsForGarment(garmentId?: string): { name: string; hex: string }[] {
  const norm = (garmentId || 'regular-t-shirt').toLowerCase();
  if (norm.includes('acid')) return APPAREL_APPROVED_COLORS_MAP['acid-wash-t-shirt'];
  if (norm.includes('oversized')) return APPAREL_APPROVED_COLORS_MAP['oversized-t-shirt'];
  if (norm.includes('hoodie')) return APPAREL_APPROVED_COLORS_MAP['hoodie'];
  return APPAREL_APPROVED_COLORS_MAP['regular-t-shirt'];
}

/**
 * The host page can address a curated design with either `designId` or the
 * shorter `design` query parameter. Accept both so the studio always knows
 * which design it is editing (needed for saves and for placement sync).
 */
function getUrlDesignId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const sp = new URLSearchParams(window.location.search);
    return sp.get('designId') || sp.get('design') || null;
  } catch {
    return null;
  }
}

/**
 * Artwork pricing mirrors the host storefront and checkout:
 * - Curated tees: ₹40 once when 2+ saved prints are active (0/1 free).
 * - Curated hoodies/other garments: artwork included in the design price.
 * - Customer-uploaded artwork on any garment, including plain tees: ₹49 per
 *   artwork, so the fee grows by ₹49 for every added print.
 */
const TSHIRT_ARTWORK_SURCHARGE = 40;
const LEGACY_CUSTOM_PRINT_FEE = 49;
const TSHIRT_GARMENT_IDS = new Set([
  'regular-t-shirt',
  'oversized-t-shirt',
  'acid-wash-t-shirt',
]);

function getArtworkCharge(
  garmentId: string | undefined,
  activeArtworkCount: number,
  isCurated: boolean,
): number {
  const count = Math.min(100, Math.max(0, Math.trunc(activeArtworkCount || 0)));
  if (isCurated) {
    if (TSHIRT_GARMENT_IDS.has(resolveGarmentId(garmentId))) {
      return count >= 2 ? TSHIRT_ARTWORK_SURCHARGE : 0;
    }
    return 0;
  }
  return count * LEGACY_CUSTOM_PRINT_FEE;
}

/** Build a size -> price map for a garment with a 3XL surcharge. */
function buildSizePriceMap(base: number, extended: number): Record<string, number> {
  return {
    S: base,
    M: base,
    L: base,
    XL: base,
    '2XL': extended,
    XXL: extended,
    '3XL': extended,
    XXXL: extended,
  };
}

/** Resolve the selected size against a size -> price map (aliases 2XL/XXL, 3XL/XXXL). */
function lookupSizePrice(
  map: Record<string, number> | undefined,
  size: string | undefined,
): number | undefined {
  if (!map) return undefined;
  const key = (size || 'L').trim().toUpperCase();
  if (typeof map[key] === 'number') return map[key];
  if (key === '2XL' && typeof map.XXL === 'number') return map.XXL;
  if (key === 'XXL' && typeof map['2XL'] === 'number') return map['2XL'];
  if (key === '3XL' && typeof map.XXXL === 'number') return map.XXXL;
  if (key === 'XXXL' && typeof map['3XL'] === 'number') return map['3XL'];
  const fallback = map.L ?? map.M ?? map.S;
  return typeof fallback === 'number' ? fallback : undefined;
}

/** Normalise any garment string (id, name, variant id) to a known studio id. */
function resolveGarmentId(raw?: string | null): string {
  const value = (raw || '').toLowerCase();
  if (!value) return 'regular-t-shirt';
  if (value.includes('zip') && value.includes('hood')) return 'zip-hoodie';
  if (value.includes('acid')) return 'acid-wash-t-shirt';
  if (value.includes('oversized')) return 'oversized-t-shirt';
  if (value.includes('sweatpant') || value.includes('jogger')) return 'sweatpants';
  if (value.includes('sweatshirt') || value.includes('crewneck') || value.includes('crew neck')) {
    return 'sweatshirt';
  }
  if (value.includes('jeans') || value.includes('denim')) return 'jeans';
  if (value.includes('tank')) return 'tank-top';
  if (value.includes('balaclava')) return 'balaclava';
  if (value.includes('cap') || value.includes('hat')) return 'cap';
  if (value.includes('hoodie') || value.includes('hood')) return 'hoodie';
  if (value.includes('fitted')) return 'fitted-t-shirt';
  return 'regular-t-shirt';
}

/** True for white / cream / other light fabric colours. */
function isLightGarmentHex(hex?: string): boolean {
  const value = (hex || '').trim().replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return true;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b >= 150;
}

/** A colour-specific variant only prints on the fabric it was drawn for. */
function matchesArtworkColorHint(hint: string | undefined, garmentHex: string): boolean {
  if (!hint || hint === 'any') return true;
  const isLight = isLightGarmentHex(garmentHex);
  if (hint === 'black') return !isLight;
  if (hint === 'white') return isLight;
  return true;
}

type CartProofSet = {
  current: string | null;
  front: string | null;
  back: string | null;
  leftSleeve: string | null;
  rightSleeve: string | null;
};

export const App: React.FC = () => {
  const [isDesignsLibraryOpen, setIsDesignsLibraryOpen] = useState<boolean>(false);

  const [isAddToCartOpen, setIsAddToCartOpen] = useState(false);
  const [isCapturingCartSnapshots, setIsCapturingCartSnapshots] = useState(false);
  const [cartFrontSnapshot, setCartFrontSnapshot] = useState<string | null>(null);
  const [cartBackSnapshot, setCartBackSnapshot] = useState<string | null>(null);
  const [cartCurrentSnapshot, setCartCurrentSnapshot] = useState<string | null>(null);
  const [cartLeftSleeveSnapshot, setCartLeftSleeveSnapshot] = useState<string | null>(null);
  const [cartRightSleeveSnapshot, setCartRightSleeveSnapshot] = useState<string | null>(null);
  const [export3DManager] = useState(() => new Export3DManager());

  // =========================================================================
  // 3D PROJECT STATE
  // =========================================================================
  const [project3D, setProject3D] = useState<ProjectState3D>(() => {
    let initialGarment = 'regular-t-shirt';
    let initialColor = '#ffffff';
    if (typeof window !== 'undefined') {
      try {
        const sp = new URLSearchParams(window.location.search);
        const g = sp.get('garment');
        if (g) initialGarment = g;
        const c = sp.get('color');
        if (c) initialColor = c;
      } catch {
        /* ignore */
      }
    }
    return {
      version: 1,
      id: 'default-3d-project',
      name: 'Regular T-Shirt Mockup',
      updatedAt: new Date().toISOString(),
      garmentId: initialGarment,
      garmentColor: initialColor,
      roughness: 0.85,
      metalness: 0.0,
      artworkLayers: [],
      activeRegionId: 'front',
      isAnimated: false,
      currentAction: 'WALK',
      isPlaying: false,
      playbackSpeed: 1.0,
      secondaryMotionEnabled: false,
      lighting: {
        hdrIntensity: 0.7,
        sunIntensity: 0.95,
        ambientIntensity: 0.15,
        sunAzimuth: 45,
        sunElevation: 45,
        shadowIntensity: 0.16,
        bgColor: '#0a0d14',
        isTransparentBg: false,
      },
      camera: {
        preset: 'front',
        turntable: false,
        turntableSpeed: 0.5,
      },
    };
  });

  const [selectedLayerId3D, setSelectedLayerId3D] = useState<string | null>(null);
  const [selectedPanelId3D, setSelectedPanelId3D] = useState<string | null>(null);
  // Responsive mobile detector (<= 768px)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  const [isUvEditorOpen, setIsUvEditorOpen] = useState(false);
  const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(false);
  const [garmentMesh3D, setGarmentMesh3D] = useState<THREE.Mesh | THREE.SkinnedMesh | null>(null);
  const sceneManager3DRef = useRef<SceneManager3D | null>(null);
  // Compositor ref — needed to pass to the high-res exporter
  const compositor3DRef = useRef<TextureCompositor3D | null>(null);

  const isPlainParam = typeof window !== 'undefined'
    ? (() => {
        try {
          const sp = new URLSearchParams(window.location.search);
          return sp.get('plain') === 'true' || sp.get('plain') === '1' || sp.get('custom') === 'true';
        } catch {
          return false;
        }
      })()
    : false;

  // Active Sidebar Tab: for plain tees, default to artwork3d so customers immediately see upload
  const [activeTab, setActiveTab] = useState<SidebarTab>(() => (isPlainParam ? 'artwork3d' : 'color3d'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState<boolean>(false);
  const handleDismissInstructions = useCallback(() => {
    setShowInstructionModal(false);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('starby_3d_instructions_seen', 'true');
      } catch {}
    }
  }, []);
  const [isDesignSetupModalOpen, setIsDesignSetupModalOpen] = useState<boolean>(false);
  const [activeCuratedDesign, setActiveCuratedDesign] = useState<CuratedClothingDesign | null>(null);
  const [initialDesignId, setInitialDesignId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get('plain') === 'true' || sp.get('plain') === '1') return null;
        return sp.get('designId') || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const GARMENT_DEFAULT_BASE_PRICES: Record<string, number> = {
    'regular-t-shirt': 639,
    'oversized-t-shirt': 689,
    'acid-wash-t-shirt': 699,
    hoodie: 809,
    'fitted-t-shirt': 620,
    'zip-hoodie': 850,
    sweatshirt: 800,
    sweatpants: 700,
    jeans: 999,
    'tank-top': 500,
    cap: 399,
    balaclava: 349,
  };

  // Size-aware default prices. Mirrors `lib/config/garment-pricing.ts` on the
  // host. Live admin values are merged in from `/api/products/prices` below so
  // an admin price edit is reflected here without rebuilding the bundle.
  const garmentSizePriceMapRef = useRef<Record<string, Record<string, number>>>({
    'regular-t-shirt': buildSizePriceMap(639, 659),
    'oversized-t-shirt': buildSizePriceMap(689, 709),
    'acid-wash-t-shirt': buildSizePriceMap(699, 720),
    hoodie: buildSizePriceMap(809, 849),
    'fitted-t-shirt': buildSizePriceMap(620, 665),
    'zip-hoodie': buildSizePriceMap(850, 880),
    sweatshirt: buildSizePriceMap(800, 830),
    sweatpants: buildSizePriceMap(700, 750),
    jeans: buildSizePriceMap(999, 1049),
    'tank-top': buildSizePriceMap(500, 545),
    cap: buildSizePriceMap(399, 399),
    balaclava: buildSizePriceMap(349, 349),
  });

  const initialPriceRef = useRef<number | null>(null);
  const [basePrice, setBasePrice] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const sp = new URLSearchParams(window.location.search);
        const p = sp.get('price');
        if (p !== null && !isNaN(Number(p)) && Number(p) > 0) return Number(p);
        const g = sp.get('garment');
        if (g && GARMENT_DEFAULT_BASE_PRICES[resolveGarmentId(g)]) {
          return GARMENT_DEFAULT_BASE_PRICES[resolveGarmentId(g)];
        }
      } catch {
        /* ignore */
      }
    }
    return 639;
  });

  // Catalogue price of the curated design itself (not the garment). The final
  // unit price is max(designBasePrice, garmentSizePrice) — exactly the rule the
  // checkout API applies, so the studio total is never lower than what is
  // charged.
  const [designBasePrice, setDesignBasePrice] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const sp = new URLSearchParams(window.location.search);
        if ((sp.get('designId') || sp.get('design')) === 'design-001') return 1;
        const p = sp.get('price');
        if (p !== null && !isNaN(Number(p)) && Number(p) > 0) return Number(p);
      } catch {
        /* ignore */
      }
    }
    return 639;
  });

  const [selectedGarmentSize, setSelectedGarmentSize] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const sp = new URLSearchParams(window.location.search);
        return sp.get('size') || 'L';
      } catch {
        return 'L';
      }
    }
    return 'L';
  });

  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);

  // Forces a re-render after the live price payload has been merged into the
  // refs above (refs alone do not trigger one).
  const [, setPricingTick] = useState(0);

  const isCuratedDesign = Boolean(
    !isPlainParam && (
      activeCuratedDesign ||
      initialDesignId ||
      project3D.artworkLayers.some((l) => l.isCurated || l.curatedDesignId)
    )
  );

  const isDesign001 = initialDesignId === 'design-001' || getUrlDesignId() === 'design-001';

  useEffect(() => {
    fetch('/api/products/prices', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.success) return;

        // Live garment prices for all 3D models (admin overrides included).
        if (data.garments && typeof data.garments === 'object') {
          Object.entries(
            data.garments as Record<string, { basePrice?: number; sizePrices?: Record<string, number> }>
          ).forEach(([id, entry]) => {
            if (entry?.sizePrices && typeof entry.sizePrices === 'object') {
              garmentSizePriceMapRef.current[id] = {
                ...(garmentSizePriceMapRef.current[id] || {}),
                ...entry.sizePrices,
              };
            } else if (typeof entry?.basePrice === 'number' && entry.basePrice > 0) {
              garmentSizePriceMapRef.current[id] = buildSizePriceMap(entry.basePrice, entry.basePrice);
            }
          });
        }

        // Catalogue price for the curated design (authoritative over the URL
        // `price`, which may have been the garment price for plain products).
        const products = (data.products || {}) as Record<string, number>;
        const designId = initialDesignId || getUrlDesignId();
        if (designId && designId !== 'design-001' && typeof products[designId] === 'number' && products[designId] > 0) {
          setDesignBasePrice(products[designId]);
        }

        // Keep the plain/custom garment price in sync with the live table.
        if (!isCuratedDesign) {
          const resolvedGarment = resolveGarmentId(project3D.garmentId);
          const livePrice =
            lookupSizePrice(garmentSizePriceMapRef.current[resolvedGarment], selectedGarmentSize) ??
            GARMENT_DEFAULT_BASE_PRICES[resolvedGarment];
          if (typeof livePrice === 'number') setBasePrice(livePrice);
        }

        setPricingTick((tick) => tick + 1);
      })
      .catch(() => {});
  }, [isCuratedDesign, project3D.garmentId, selectedGarmentSize, initialDesignId]);

  // Count every active printed placement, not just customer-uploaded files.
  // Deleted layers are removed from the array; hidden / zero-opacity layers are
  // filtered here. Duplicated layers count separately because they print
  // separately, while moving one layer between front and back does not change
  // the count.
  const activeArtworkCount3D = project3D.artworkLayers.filter(
    (l) => !l.hidden && (l.opacity === undefined || l.opacity > 0)
  ).length;

  const activeCustomArtworkCount = activeArtworkCount3D;
  const customPrintFee = getArtworkCharge(
    project3D.garmentId,
    activeArtworkCount3D,
    isCuratedDesign,
  );
  // design-001 is a ₹1 catalogue special and never carries an artwork fee.
  // Keep the cart payload untouched, but show the real charge in the UI.
  const displayPrintFee = isDesign001 ? 0 : customPrintFee;

  /** Size-aware garment price (live values when available). */
  const getGarmentPriceForSize = (garmentId: string, size?: string): number => {
    const resolved = resolveGarmentId(garmentId);
    const sizePrice = lookupSizePrice(garmentSizePriceMapRef.current[resolved], size);
    if (typeof sizePrice === 'number') return sizePrice;
    return GARMENT_DEFAULT_BASE_PRICES[resolved] ?? 639;
  };

  /**
   * The price of one unit for a given size. Curated designs never drop below
   * the garment price and use the curated tee threshold (₹40 once for 2+
   * prints). Customer-uploaded artwork adds ₹49 per artwork on every garment.
   */
  const getUnitPriceForSize = (size?: string): number => {
    const garmentPrice = getGarmentPriceForSize(project3D.garmentId, size);
    if (isDesign001) return 1;
    const artworkCharge = getArtworkCharge(
      project3D.garmentId,
      activeArtworkCount3D,
      isCuratedDesign,
    );
    if (!isCuratedDesign) return garmentPrice + artworkCharge;
    return Math.max(designBasePrice > 0 ? designBasePrice : 639, garmentPrice) + artworkCharge;
  };

  const effectivePrice = getUnitPriceForSize(selectedGarmentSize);

  // Modal Placement State
  const [modalSelectedArtId, setModalSelectedArtId] = useState<string | null>(null);
  const [modalSelectedRegion, setModalSelectedRegion] = useState<'front' | 'back' | 'sleeve'>('front');
  const [modalNlpText, setModalNlpText] = useState<string>('');
  const [modalFeedbackMessage, setModalFeedbackMessage] = useState<string | null>(null);
  const [showSaveSuccessBanner, setShowSaveSuccessBanner] = useState<boolean>(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const saveResultResolversRef = useRef<
    Map<string, { resolve: (result: { ok: boolean; error?: string }) => void; timeout: number }>
  >(new Map());

  // Designer Authorization & Calibration Mode State (Restricted exclusively to gokul30sep@gmail.com / superadmin)
  const [isDesignerAuthorized, setIsDesignerAuthorized] = useState<boolean>(false);
  const [isDesignerMode, setIsDesignerMode] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    // 1. Verify session with server endpoint
    fetch('/api/clothing-designs/designer-auth', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : { authorized: false }))
      .then((data) => {
        if (!active) return;
        if (data && data.authorized) {
          setIsDesignerAuthorized(true);
          try {
            const sp = new URLSearchParams(window.location.search);
            if (
              sp.get('designer') === 'true' ||
              sp.get('mode') === 'designer' ||
              sp.get('admin') === '1'
            ) {
              setIsDesignerMode(true);
            }
          } catch {
            /* ignore */
          }
        } else {
          setIsDesignerAuthorized(false);
          setIsDesignerMode(false);
        }
      })
      .catch(() => {
        if (active) {
          setIsDesignerAuthorized(false);
          setIsDesignerMode(false);
        }
      });

    // 2. Listen for postMessage from parent host window (StarBy iframe container)
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'STARBY_DESIGNER_AUTH') {
        if (e.data.authorized) {
          setIsDesignerAuthorized(true);
          try {
            const sp = new URLSearchParams(window.location.search);
            if (
              sp.get('designer') === 'true' ||
              sp.get('mode') === 'designer' ||
              sp.get('admin') === '1'
            ) {
              setIsDesignerMode(true);
            }
          } catch {
            /* ignore */
          }
        } else {
          setIsDesignerAuthorized(false);
          setIsDesignerMode(false);
        }
      }

      if (e.data && e.data.type === 'STARBY_PLACEMENT_SAVE_RESULT') {
        const requestId = typeof e.data.requestId === 'string' ? e.data.requestId : '';
        const pendingEntries = requestId
          ? [[requestId, saveResultResolversRef.current.get(requestId)] as const]
          : Array.from(saveResultResolversRef.current.entries());

        for (const [id, pending] of pendingEntries) {
          if (!pending) continue;
          clearTimeout(pending.timeout);
          saveResultResolversRef.current.delete(id);
          pending.resolve({ ok: Boolean(e.data.ok), error: e.data.error || undefined });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      active = false;
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleToggleDesignerMode = useCallback(() => {
    if (!isDesignerAuthorized) {
      console.warn('[DesignerMode] Access denied: designer mode is restricted to authorized creators');
      return;
    }
    setIsDesignerMode((prev) => {
      const next = !prev;
      setProject3D((proj) => ({
        ...proj,
        artworkLayers: proj.artworkLayers.map((l) => ({
          ...l,
          locked: l.isCurated ? !next : l.locked,
        })),
      }));
      return next;
    });
  }, [isDesignerAuthorized]);

  const handleSaveCurrentPlacement = useCallback(async () => {
    if (!isDesignerAuthorized) {
      console.warn('[DesignerMode] Save ignored: user is not authorized for designer placement saves');
      return;
    }
    setSaveErrorMessage(null);
    let urlDesignId: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        urlDesignId = getUrlDesignId();
      } catch {
        /* ignore */
      }
    }

    const primaryDesignId =
      project3D.artworkLayers[0]?.curatedDesignId ||
      activeCuratedDesign?.id ||
      initialDesignId ||
      urlDesignId ||
      'design-001';

    // Find any curated artworks belonging to this design that have been removed
    const targetCurated = activeCuratedDesign || CURATED_CLOTHING_DESIGNS.find((d) => d.id === primaryDesignId);
    const allCuratedArtworks = targetCurated?.artworks || [];

    const getLayerArtId = (l: ArtworkLayer3D): string | null => {
      const m = l.id.match(/art-\d+/i);
      if (m) return m[0].toLowerCase();
      const match = allCuratedArtworks.find(
        (a) => l.id.toLowerCase().includes(a.id.toLowerCase()) || (l.name && l.name.toLowerCase().includes(a.name.toLowerCase()))
      );
      return match ? match.id.toLowerCase() : null;
    };

    const presentArtIds = new Set(
      project3D.artworkLayers.map(getLayerArtId).filter(Boolean) as string[]
    );

    const removedArtworks = allCuratedArtworks.filter((a) => !presentArtIds.has(a.id.toLowerCase()));
    const removedArtIdsList = removedArtworks.map((a) => a.id.toLowerCase());
    const hiddenArtIdsList = project3D.artworkLayers
      .filter((l) => l.opacity === 0 || (l as any).hidden === true)
      .map(getLayerArtId)
      .filter(Boolean) as string[];

    // 1. Mark removed artworks so they don't reappear upon reload
    removedArtworks.forEach((art) => {
      saveCuratedPlacement(
        primaryDesignId,
        project3D.garmentId,
        {
          u: 0.25,
          v: 0.63,
          uvWidth: 0.26,
          scale: 0.74,
          rotation: 0,
          regionId: 'front',
          placementTarget: art.suggestedPlacement || 'front-center',
          hidden: true,
          removed: true,
          opacity: 0,
        },
        art.suggestedPlacement || 'front-center',
        art.id.toLowerCase(),
        false
      );
    });

    // 2. Persist active artwork layers on this garment with true opacity & hidden status
    project3D.artworkLayers.forEach((layer) => {
      const designId = layer.curatedDesignId || primaryDesignId;

      const target =
        layer.placementTarget ||
        (layer.regionId === 'back' || layer.name.toLowerCase().includes('back')
          ? 'back-center'
          : layer.name.toLowerCase().includes('sleeve')
          ? 'left-sleeve'
          : 'front-center');

      const artId = getLayerArtId(layer) || undefined;
      const isHidden = layer.opacity === 0 || (layer as any).hidden === true;

      saveCuratedPlacement(
        designId,
        project3D.garmentId,
        {
          u: layer.u !== undefined ? layer.u : 0.25,
          v: layer.v !== undefined ? layer.v : 0.63,
          uvWidth: layer.uvWidth !== undefined ? layer.uvWidth : 0.26,
          scale: layer.scale !== undefined ? layer.scale : 0.74,
          rotation: layer.rotation || 0,
          regionId: (layer.regionId as 'front' | 'back') || (target.includes('back') ? 'back' : 'front'),
          placementTarget: target,
          scalePreset: layer.scalePreset || 'standard',
          hidden: isHidden,
          removed: false,
          opacity: typeof layer.opacity === 'number' ? layer.opacity : (isHidden ? 0 : 1.0),
        },
        target,
        artId,
        false
      );
    });

    // Persist the complete layer list in one authoritative request.
    //
    // When embedded in the StarBy host we hand the save to the parent because
    // it can attach the first-party session bearer token, and we wait for its
    // acknowledgement so the UI reflects the real outcome instead of always
    // claiming success. Standalone studio usage posts directly with cookies.
    const embedded = typeof window !== 'undefined' && !!window.parent && window.parent !== window;
    const saveStartedAt = Date.now();

    // Only placement fields need to cross the postMessage/HTTP boundary.
    // Uploaded artwork can carry multi-megabyte data URLs in imageUrl, which
    // used to make otherwise valid saves fail the request body limit.
    const layersForSave = project3D.artworkLayers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      regionId: layer.regionId,
      placementTarget: layer.placementTarget,
      u: layer.u,
      v: layer.v,
      uvWidth: layer.uvWidth,
      uvHeight: layer.uvHeight,
      scale: layer.scale,
      rotation: layer.rotation,
      opacity: layer.opacity,
      hidden: layer.hidden,
      removed: layer.removed,
      scalePreset: layer.scalePreset,
    }));

    // If an acknowledgement is lost (for example the host tab was throttled),
    // confirm against the persisted rows before telling the designer the save
    // failed. This keeps a successful database write from looking like an error.
    const verifyPlacementPersisted = async (): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/clothing-designs/save-placement?designId=${encodeURIComponent(primaryDesignId)}&_t=${Date.now()}`,
          { cache: 'no-store', credentials: 'include' }
        );
        if (!response.ok) return false;

        const payload = await response.json().catch(() => null);
        const placements = payload?.placements as
          | Record<string, { u?: number; v?: number; uvWidth?: number; hidden?: boolean; removed?: boolean; savedAt?: string }>
          | undefined;
        if (!placements) return false;

        const garmentKey = (project3D.garmentId || 'regular-t-shirt').toLowerCase();
        const prefix = `${primaryDesignId}__${garmentKey}__`;
        const config = placements[`${prefix}config`];
        const configSavedAt = Date.parse(config?.savedAt || '');
        if (!Number.isFinite(configSavedAt) || configSavedAt < saveStartedAt - 5 * 60_000) {
          return false;
        }

        const visibleLayers = project3D.artworkLayers.filter(
          (layer) => layer.opacity !== 0 && !(layer as { hidden?: boolean }).hidden
        );

        return visibleLayers.every((layer) => {
          const artMatch = layer.id.match(/art-\d+/i);
          if (!artMatch) return true;

          const saved = placements[`${prefix}${artMatch[0].toLowerCase()}`];
          if (!saved || saved.hidden || saved.removed) return false;

          const closeEnough = (a: number | undefined, b: number | undefined, tolerance: number) =>
            Math.abs((typeof a === 'number' ? a : 0) - (typeof b === 'number' ? b : 0)) <= tolerance;

          return (
            closeEnough(saved.u, layer.u ?? 0.25, 0.003) &&
            closeEnough(saved.v, layer.v ?? 0.63, 0.003) &&
            closeEnough(saved.uvWidth, layer.uvWidth ?? 0.26, 0.003)
          );
        });
      } catch {
        return false;
      }
    };

    if (embedded) {
      // Correlate each save with its own acknowledgement. Without an ID a
      // slow earlier response can resolve a newer save (or a retry), which
      // made a successful write look like a database failure.
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const parentResult = new Promise<{ ok: boolean; error?: string }>((resolve) => {
        const timeout = window.setTimeout(() => {
          saveResultResolversRef.current.delete(requestId);
          resolve({ ok: false, error: 'The server did not confirm the save in time.' });
        }, 30000);

        saveResultResolversRef.current.set(requestId, { resolve, timeout });
      });

      window.parent.postMessage(
        {
          type: 'STARBY_ALL_PLACEMENTS_SAVED',
          requestId,
          designId: primaryDesignId,
          garmentId: project3D.garmentId,
          layers: layersForSave,
          removedArtIds: removedArtIdsList,
          hiddenArtIds: hiddenArtIdsList,
        },
        '*'
      );

      const result = await parentResult;
      if (!result.ok) {
        const persisted = await verifyPlacementPersisted();
        if (!persisted) {
          console.error('[App] Host reported placement save failure:', result.error);
          setSaveErrorMessage(
            result.error
              ? `Could not save placement: ${result.error}`
              : 'Could not save placement to the database. Please try again.'
          );
          setTimeout(() => setSaveErrorMessage(null), 8000);
          return;
        }
        console.warn(
          '[App] Save acknowledgement failed, but the latest placement is already persisted:',
          result.error
        );
      }
    } else {
      try {
        const response = await fetch('/api/clothing-designs/save-placement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            designId: primaryDesignId,
            garmentId: project3D.garmentId,
            layers: layersForSave,
            removedArtIds: removedArtIdsList,
            hiddenArtIds: hiddenArtIdsList,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || `Server returned ${response.status}`);
        }
      } catch (err) {
        const persisted = await verifyPlacementPersisted();
        if (!persisted) {
          console.error('[App] Failed to save placement to server API:', err);
          setSaveErrorMessage(
            err instanceof Error && err.message
              ? `Could not save placement: ${err.message}`
              : 'Could not save placement to the database. Please try again.'
          );
          setTimeout(() => setSaveErrorMessage(null), 8000);
          return;
        }
        console.warn('[App] Save request failed, but the latest placement is already persisted:', err);
      }
    }

    // Ensure all curated layers hold the designId
    setProject3D((prev) => ({
      ...prev,
      artworkLayers: prev.artworkLayers.map((l) => ({
        ...l,
        curatedDesignId: l.isCurated ? primaryDesignId : l.curatedDesignId,
      })),
    }));

    setShowSaveSuccessBanner(true);
    setTimeout(() => setShowSaveSuccessBanner(false), 2500);
  }, [
    project3D.artworkLayers,
    project3D.garmentId,
    activeCuratedDesign,
    initialDesignId,
  ]);

  // Sync initial selected artwork & region when modal design is active
  useEffect(() => {
    if (activeCuratedDesign && activeCuratedDesign.artworks.length > 0) {
      if (!modalSelectedArtId || !activeCuratedDesign.artworks.some((a) => a.id === modalSelectedArtId)) {
        const firstArt = activeCuratedDesign.artworks[0];
        setModalSelectedArtId(firstArt.id);
        const suggested = firstArt.suggestedPlacement || 'front-center';
        if (suggested.includes('back')) setModalSelectedRegion('back');
        else if (suggested.includes('sleeve')) setModalSelectedRegion('sleeve');
        else setModalSelectedRegion('front');
      }
    }
  }, [activeCuratedDesign, modalSelectedArtId]);

  const computePlacementLayer = useCallback(
    (
      garmentId: string,
      input: {
        id?: string;
        name?: string;
        previewUrl?: string;
        imageUrl?: string;
        placement?: string | null;
        scale?: string | number | null;
        scalePreset?: string | null;
        curatedDesignId?: string | null;
        isCurated?: boolean;
        colorHint?: 'any' | 'black' | 'white' | string;
        opacity?: number;
        hidden?: boolean;
        removed?: boolean;
        u?: number;
        v?: number;
        uvWidth?: number;
        rotation?: number;
        regionId?: string;
        placementTarget?: string;
      },
      fallbackIndex: number
    ): ArtworkLayer3D | null => {
      const url = input.previewUrl || input.imageUrl;
      if (!url) return null;

      const layerId = input.id || `fregor-art-${Date.now()}-${fallbackIndex}`;
      const layerName = input.name || `Artwork ${fallbackIndex + 1}`;
      const placementText = (input.placement || 'front-center').toString();
      const scaleText = (input.scalePreset || input.scale || 'standard').toString();

      const baseLayer = buildLayerFromPlacement(garmentId, {
        id: layerId,
        name: layerName,
        imageUrl: url,
        placementTextOrTarget: placementText,
        scalePresetOrText: scaleText,
      });

      let urlDesignId: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          const sp = new URLSearchParams(window.location.search);
          urlDesignId = sp.get('designId') || (sp.get('curated') === 'true' ? 'design-001' : null);
        } catch {
          /* ignore */
        }
      }

      const designId =
        input.curatedDesignId ||
        activeCuratedDesign?.id ||
        initialDesignId ||
        urlDesignId ||
        (layerId.includes('fregor-art') || layerId.includes('fregor-design') ? 'design-001' : null);

      const isCurated =
        input.isCurated !== undefined
          ? input.isCurated
          : (!!designId || layerId.includes('fregor-art') || layerId.includes('fregor-design'));

      const artMatch = layerId.match(/art-\d+/i) || (input.id || '').match(/art-\d+/i);
      const artId = artMatch ? artMatch[0].toLowerCase() : null;

      const calibrated = getCuratedPlacement(designId, garmentId, placementText, artId);

      // If artwork is explicitly marked removed either in input or in saved placement, DO NOT load it!
      if (input.removed === true || calibrated?.removed === true) {
        return null;
      }

      const finalU = typeof (input as any).u === 'number' ? (input as any).u : calibrated.u;
      const finalV = typeof (input as any).v === 'number' ? (input as any).v : calibrated.v;
      const finalUvW = typeof (input as any).uvWidth === 'number' ? (input as any).uvWidth : calibrated.uvWidth;
      const finalScale = typeof (input as any).scale === 'number' ? (input as any).scale : calibrated.scale;
      const finalRot = typeof (input as any).rotation === 'number' ? (input as any).rotation : (calibrated.rotation ?? 0);
      const finalRegion = (input as any).regionId || calibrated.regionId || baseLayer.regionId;

      const inputColorHint = input.colorHint;
      const isColorVariant = inputColorHint === 'black' || inputColorHint === 'white';
      // Colour variants carry their own visibility from the active fabric
      // colour. Their saved row may still say hidden/opacity:0 because the
      // designer saved it while the other variant was selected.
      const isExplicitlyHidden = isColorVariant
        ? (input as any).hidden === true || (input as any).opacity === 0
        : (input as any).hidden === true ||
          (input as any).opacity === 0 ||
          calibrated?.hidden === true ||
          calibrated?.opacity === 0;

      const finalOpacity = isExplicitlyHidden
        ? 0
        : isColorVariant
        ? 1.0
        : typeof (input as any).opacity === 'number'
        ? (input as any).opacity
        : 1.0;

      return {
        ...baseLayer,
        u: finalU,
        v: finalV,
        uvWidth: finalUvW,
        uvHeight: finalUvW,
        scale: finalScale,
        rotation: finalRot,
        opacity: finalOpacity,
        hidden: isExplicitlyHidden,
        regionId: finalRegion,
        placementTarget: (input as any).placementTarget || placementText,
        offsetX: parseFloat(((finalU - 0.5) * 2).toFixed(3)),
        offsetY: parseFloat(((finalV - 0.5) * 2).toFixed(3)),
        isCurated,
        curatedDesignId: designId || undefined,
        colorHint: input.colorHint,
        locked: isCurated ? !(isDesignerAuthorized && isDesignerMode) : false,
      };
    },
    [activeCuratedDesign, initialDesignId, isDesignerAuthorized, isDesignerMode]
  );

  const handleModalChangeGarment = useCallback(
    (garmentId: string) => {
      const approvedColors = getApprovedColorsForGarment(garmentId);

      setProject3D((prev) => {
        const colorMatches = approvedColors.some(
          (c) => c.hex.toLowerCase() === prev.garmentColor.toLowerCase()
        );
        const newColor = colorMatches ? prev.garmentColor : approvedColors[0].hex;

        const updatedLayers = prev.artworkLayers.map((l, idx) => {
          const target =
            l.placementTarget ||
            (l.regionId === 'back' || l.name.toLowerCase().includes('back')
              ? 'back-center'
              : l.name.toLowerCase().includes('sleeve')
              ? 'left-sleeve'
              : 'front-center');
          const mapped =
            computePlacementLayer(
              garmentId,
              {
                id: l.id,
                name: l.name,
                imageUrl: l.imageUrl,
                placement: target,
                scale: l.scalePreset || 'standard',
                curatedDesignId: l.curatedDesignId,
                isCurated: l.isCurated,
                colorHint: l.colorHint,
              },
              idx
            ) || l;
          if (!l.colorHint || l.colorHint === 'any') return mapped;
          const colorMatches = matchesArtworkColorHint(l.colorHint, newColor);
          return {
            ...mapped,
            colorHint: l.colorHint,
            hidden: !colorMatches,
            opacity: colorMatches ? 1.0 : 0,
          };
        });
        return {
          ...prev,
          garmentId,
          garmentColor: newColor,
          artworkLayers: updatedLayers,
        };
      });
    },
    [computePlacementLayer]
  );

  const handleModalChangeColor = useCallback((hex: string) => {
    setProject3D((prev) => {
      const nextLayers = prev.artworkLayers.map((layer) => {
        if (!layer.isCurated || !layer.colorHint || layer.colorHint === 'any') return layer;
        const matches = matchesArtworkColorHint(layer.colorHint, hex);
        if (matches) {
          if (layer.hidden !== true && layer.opacity > 0) return layer;
          return { ...layer, hidden: false, opacity: 1.0 };
        }
        if (layer.hidden === true && layer.opacity === 0) return layer;
        return { ...layer, hidden: true, opacity: 0 };
      });
      return { ...prev, garmentColor: hex, artworkLayers: nextLayers };
    });
  }, []);

  const handleModalPlaceArtwork = useCallback(
    (targetPlacement: string, targetScalePreset?: 'compact' | 'standard' | 'oversized') => {
      const isBack = targetPlacement.includes('back');
      const isSleeve = targetPlacement.includes('sleeve');
      const targetRegion: 'front' | 'back' = isBack ? 'back' : 'front';

      let cameraPreset: CameraPreset3D = 'front';
      if (isBack) cameraPreset = 'back';
      else if (targetPlacement === 'left-sleeve') cameraPreset = 'left';
      else if (targetPlacement === 'right-sleeve') cameraPreset = 'right';

      const finalScale: 'compact' | 'standard' | 'oversized' =
        targetScalePreset ||
        (targetPlacement === 'left-chest' || targetPlacement === 'right-chest' || targetPlacement === 'back-collar'
          ? 'compact'
          : targetPlacement === 'full-front' || targetPlacement === 'full-back'
          ? 'oversized'
          : 'standard');

      const currentArt =
        activeCuratedDesign?.artworks.find((a) => a.id === modalSelectedArtId) ||
        activeCuratedDesign?.artworks[0] ||
        null;

      setProject3D((prev) => {
        if (currentArt) {
          const previewUrl = currentArt.studioPreviewUrl || currentArt.previewUrl;
          const existingIdx = prev.artworkLayers.findIndex(
            (l) =>
              l.id.includes(currentArt.id) ||
              l.imageUrl === previewUrl ||
              l.name.toLowerCase().includes(currentArt.name.toLowerCase())
          );

          const layerId =
            existingIdx >= 0 ? prev.artworkLayers[existingIdx].id : `fregor-art-${currentArt.id}-${Date.now()}`;

          const updated = computePlacementLayer(
            prev.garmentId,
            {
              id: layerId,
              name: currentArt.name,
              imageUrl: previewUrl,
              placement: targetPlacement,
              scale: finalScale,
            },
            existingIdx >= 0 ? existingIdx : prev.artworkLayers.length
          );

          if (!updated) return prev;

          const nextLayers = [...prev.artworkLayers];
          if (existingIdx >= 0) {
            nextLayers[existingIdx] = updated;
          } else {
            nextLayers.push(updated);
          }

          return {
            ...prev,
            artworkLayers: nextLayers,
            activeRegionId: targetRegion,
            camera: {
              ...prev.camera,
              preset: cameraPreset,
            },
          };
        } else if (prev.artworkLayers.length > 0) {
          const targetLayer = prev.artworkLayers[0];
          const updated = computePlacementLayer(
            prev.garmentId,
            {
              id: targetLayer.id,
              name: targetLayer.name,
              imageUrl: targetLayer.imageUrl,
              placement: targetPlacement,
              scale: finalScale,
            },
            0
          );
          if (!updated) return prev;
          return {
            ...prev,
            artworkLayers: [updated, ...prev.artworkLayers.slice(1)],
            activeRegionId: targetRegion,
            camera: {
              ...prev.camera,
              preset: cameraPreset,
            },
          };
        }

        return prev;
      });

      const chosenRegion: 'front' | 'back' | 'sleeve' = isBack ? 'back' : isSleeve ? 'sleeve' : 'front';
      setModalSelectedRegion(chosenRegion);

      const friendlyName = targetPlacement.replace(/-/g, ' ').toUpperCase();
      setModalFeedbackMessage(`Placed "${currentArt?.name || 'Artwork'}" on ${friendlyName}`);
      setTimeout(() => setModalFeedbackMessage(null), 3500);
    },
    [activeCuratedDesign, modalSelectedArtId, computePlacementLayer]
  );

  const handleModalSelectRegion = useCallback(
    (region: 'front' | 'back' | 'sleeve') => {
      setModalSelectedRegion(region);
      const defaultSpot = region === 'front' ? 'front-center' : region === 'back' ? 'back-center' : 'left-sleeve';
      handleModalPlaceArtwork(defaultSpot);
    },
    [handleModalPlaceArtwork]
  );

  const handleModalSelectArtwork = useCallback(
    (art: any) => {
      setModalSelectedArtId(art.id);
      const previewUrl = art.studioPreviewUrl || art.previewUrl;
      const placedLayer = project3D.artworkLayers.find(
        (l) => l.id.includes(art.id) || l.imageUrl === previewUrl || l.name.toLowerCase().includes(art.name.toLowerCase())
      );
      if (placedLayer?.placementTarget) {
        const pt = placedLayer.placementTarget;
        if (pt.includes('back')) setModalSelectedRegion('back');
        else if (pt.includes('sleeve')) setModalSelectedRegion('sleeve');
        else setModalSelectedRegion('front');
      } else if (art.suggestedPlacement) {
        if (art.suggestedPlacement.includes('back')) setModalSelectedRegion('back');
        else if (art.suggestedPlacement.includes('sleeve')) setModalSelectedRegion('sleeve');
        else setModalSelectedRegion('front');
      }
    },
    [project3D.artworkLayers]
  );

  const handleApplyModalNlp = useCallback(() => {
    if (!modalNlpText.trim()) return;
    const parsed = parseNaturalLanguagePlacement(modalNlpText);
    handleModalPlaceArtwork(parsed.placement, parsed.scale);
  }, [modalNlpText, handleModalPlaceArtwork]);

  // Initialize design and garment from URL search params or postMessage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyInitParams = (params: {
      designId?: string | null;
      designName?: string | null;
      garment?: string | null;
      color?: string | null;
      placement?: string | null;
      scale?: string | null;
      scalePreset?: string | null;
      previewUrl?: string | null;
      layers?: any;
      price?: string | null;
      size?: string | null;
    }) => {
      if (!params.designId && !params.previewUrl && !params.garment && !params.layers) return;

      if (params.size) {
        setSelectedGarmentSize(params.size);
      }

      const curated = params.designId
        ? CURATED_CLOTHING_DESIGNS.find((d) => d.id === params.designId)
        : null;

      if (curated) {
        setActiveCuratedDesign(curated);
      }
      if (params.designId) {
        setInitialDesignId(params.designId);
        syncServerPlacements(params.designId, params.garment)
          .then((serverPlacements) => {
            if (serverPlacements && Object.keys(serverPlacements).length > 0) {
              setProject3D((prev) => {
                const updatedLayers = prev.artworkLayers.map((layer) => {
                  const artMatch = (layer.id || '').match(/art-\d+/i);
                  let artId = artMatch ? artMatch[0].toLowerCase() : undefined;
                  if (!artId && curated) {
                    const matchedArt = curated.artworks.find(
                      (a: any) =>
                        layer.id?.includes(a.id) ||
                        (layer.name && layer.name.toLowerCase().includes(a.name.toLowerCase()))
                    );
                    if (matchedArt) artId = matchedArt.id.toLowerCase();
                  }
                  const dId = params.designId || layer.curatedDesignId || (curated ? curated.id : undefined);
                  const artDef = artId
                    ? curated?.artworks.find((a) => a.id.toLowerCase() === artId)
                    : undefined;
                  const calibrated = getCuratedPlacement(
                    dId,
                    prev.garmentId,
                    layer.placementTarget || layer.regionId,
                    artId
                  );
                  if (!calibrated) return layer;
                  const isColorVariant = artDef?.colorHint === 'black' || artDef?.colorHint === 'white';
                  const isHidden = isColorVariant
                    ? !matchesArtworkColorHint(artDef?.colorHint, prev.garmentColor)
                    : calibrated.hidden === true || calibrated.opacity === 0;
                  return {
                    ...layer,
                    u: calibrated.u,
                    v: calibrated.v,
                    uvWidth: calibrated.uvWidth,
                    uvHeight: calibrated.uvWidth,
                    scale: calibrated.scale,
                    rotation: calibrated.rotation ?? 0,
                    regionId: calibrated.regionId || layer.regionId,
                    placementTarget: calibrated.placementTarget || layer.placementTarget,
                    colorHint: artDef?.colorHint || layer.colorHint,
                    opacity: isHidden
                      ? 0
                      : isColorVariant
                      ? 1.0
                      : typeof calibrated.opacity === 'number'
                      ? calibrated.opacity
                      : layer.opacity,
                    hidden: isHidden,
                    offsetX: parseFloat(((calibrated.u - 0.5) * 2).toFixed(3)),
                    offsetY: parseFloat(((calibrated.v - 0.5) * 2).toFixed(3)),
                  };
                });
                return {
                  ...prev,
                  artworkLayers: updatedLayers,
                };
              });
            }
          })
          .catch(() => {});
      }
      let parsedPrice: number | null = null;
      if (params.price !== undefined && params.price !== null && !isNaN(Number(params.price))) {
        parsedPrice = Number(params.price);
      } else if (params.designId === 'design-001') {
        parsedPrice = 1;
      }
      if (parsedPrice !== null) {
        initialPriceRef.current = parsedPrice;
        if (params.designId) setDesignBasePrice(parsedPrice);
      }

      const targetGarmentId =
        params.garment ||
        (curated?.themeCategory === 'hoodies' ? 'hoodie' : 'regular-t-shirt');

      const targetColor =
        params.color ||
        (curated?.artworks?.[0]?.colorHint === 'black' ? '#111216' : '#ffffff');

      let parsedLayersList: any[] = [];
      if (params.layers) {
        if (typeof params.layers === 'string') {
          try {
            const parsed = JSON.parse(params.layers);
            if (Array.isArray(parsed)) parsedLayersList = parsed;
            else if (typeof parsed === 'object') parsedLayersList = [parsed];
          } catch {
            /* ignore JSON parse error */
          }
        } else if (Array.isArray(params.layers)) {
          parsedLayersList = params.layers;
        }
      }

      const newLayers: ArtworkLayer3D[] = [];

      if (parsedLayersList.length > 0) {
        parsedLayersList.forEach((item, idx) => {
          if (item.removed) return;
          const artMatch = (item.id || '').match(/art-\d+/i);
          let artId = artMatch ? artMatch[0].toLowerCase() : undefined;
          if (!artId && curated) {
            const matchedArt = curated.artworks.find(
              (a) => item.id?.includes(a.id) || (item.name && item.name.toLowerCase().includes(a.name.toLowerCase()))
            );
            if (matchedArt) artId = matchedArt.id.toLowerCase();
          }

          // `layers` is used for curated designs and for plain garments with
          // preloaded customer uploads. Only curated layers should be locked.
          const isCuratedLayer = !isPlainParam && Boolean(params.designId || item.curatedDesignId || curated);
          const designId = isCuratedLayer
            ? params.designId || item.curatedDesignId || (curated ? curated.id : undefined)
            : undefined;
          const calibrated = getCuratedPlacement(designId, targetGarmentId, item.placement, artId);
          if (calibrated?.removed) return;
          const artDef = artId
            ? curated?.artworks.find((a) => a.id.toLowerCase() === artId)
            : undefined;
          const isColorVariant = artDef?.colorHint === 'black' || artDef?.colorHint === 'white';
          const isHidden = isColorVariant
            ? !matchesArtworkColorHint(artDef?.colorHint, targetColor)
            : calibrated?.hidden === true || calibrated?.opacity === 0 || item.hidden === true || item.opacity === 0;

          let placement = item.placement;
          if (isCuratedLayer && curated) {
            const matchedArt = curated.artworks.find(
              (a) => item.id?.includes(a.id) || (item.name && item.name.toLowerCase().includes(a.name.toLowerCase()))
            );
            if (matchedArt) {
              // If matchedArt is intended for back or sleeve, but item.placement was front-center (from old bug), restore it
              if (
                matchedArt.suggestedPlacement &&
                (matchedArt.suggestedPlacement.includes('back') || matchedArt.suggestedPlacement.includes('sleeve')) &&
                (!placement || placement === 'front-center' || placement === 'front')
              ) {
                placement = matchedArt.suggestedPlacement;
              }
            }
          }

          const mapped = computePlacementLayer(
            targetGarmentId,
            {
              ...item,
              placement: placement || 'front-center',
              curatedDesignId: designId,
              isCurated: isCuratedLayer,
              colorHint: artDef?.colorHint || item.colorHint,
              opacity: isHidden
                ? 0
                : isColorVariant
                ? 1.0
                : typeof item.opacity === 'number'
                ? item.opacity
                : 1.0,
              hidden: isHidden,
            },
            idx
          );
          if (mapped) newLayers.push(mapped);
        });
      } else if (params.previewUrl) {
        const isCuratedPreview = !isPlainParam && Boolean(params.designId || curated);
        const mapped = computePlacementLayer(
          targetGarmentId,
          {
            id: `fregor-design-${params.designId || Date.now()}`,
            name: params.designName || curated?.name || 'Selected Design',
            previewUrl: params.previewUrl,
            placement: params.placement || 'front-center',
            scale: params.scale,
            scalePreset: params.scalePreset,
            curatedDesignId: isCuratedPreview
              ? params.designId || (curated ? curated.id : undefined)
              : undefined,
            isCurated: isCuratedPreview,
          },
          0
        );
        if (mapped) newLayers.push(mapped);
      } else if (curated && curated.artworks.length > 0) {
        curated.artworks.forEach((art, idx) => {
          const placement = art.suggestedPlacement || (idx === 0 ? 'front-center' : 'back-center');
          const calibrated = getCuratedPlacement(curated.id, targetGarmentId, placement, art.id);
          // If this artwork was explicitly removed by the user on this garment, SKIP it!
          if (calibrated?.removed) return;

          const isColorVariant = art.colorHint === 'black' || art.colorHint === 'white';
          const isHidden = isColorVariant
            ? !matchesArtworkColorHint(art.colorHint, targetColor)
            : calibrated?.hidden === true || calibrated?.opacity === 0;

          const mapped = computePlacementLayer(
            targetGarmentId,
            {
              id: `fregor-art-${curated.id}-${art.id}`,
              name: art.name || curated.name,
              previewUrl: art.studioPreviewUrl || art.previewUrl,
              placement: curated.artworks.length === 1 && params.placement ? params.placement : (calibrated?.placementTarget || placement),
              scale: calibrated?.scale ?? (placement === 'left-chest' || placement === 'back-collar' ? 'compact' : 'standard'),
              opacity: isHidden
                ? 0
                : isColorVariant
                ? 1.0
                : typeof calibrated?.opacity === 'number'
                ? calibrated.opacity
                : 1.0,
              hidden: isHidden,
              curatedDesignId: curated.id,
              isCurated: true,
              colorHint: art.colorHint,
              u: calibrated?.u,
              v: calibrated?.v,
              uvWidth: calibrated?.uvWidth,
              rotation: calibrated?.rotation ?? 0,
              regionId: calibrated?.regionId,
              placementTarget: calibrated?.placementTarget || placement,
            },
            idx
          );
          if (mapped) newLayers.push(mapped);
        });

        // Safety fallback: if all artworks were marked removed, restore the first one
        if (newLayers.length === 0 && curated.artworks.length > 0) {
          const firstArt = curated.artworks[0];
          const mapped = computePlacementLayer(
            targetGarmentId,
            {
              id: `fregor-art-${curated.id}-${firstArt.id}`,
              name: firstArt.name || curated.name,
              previewUrl: firstArt.studioPreviewUrl || firstArt.previewUrl,
              placement: firstArt.suggestedPlacement || 'front-center',
              scale: 'standard',
              opacity: 1.0,
            },
            0
          );
          if (mapped) newLayers.push(mapped);
        }
      }

      setProject3D((prev) => {
        const finalLayers = newLayers.length > 0 ? newLayers : prev.artworkLayers;
        if (finalLayers.length > 0) {
          setSelectedLayerId3D(finalLayers[0].id);
        }

        const defaultArtMatch = curated?.defaultArtworkId
          ?.toLowerCase()
          .match(/art-\d+/i);
        const defaultArtId = defaultArtMatch ? defaultArtMatch[0].toLowerCase() : null;
        const primaryLayer = defaultArtId
          ? newLayers.find((l) => l.id.toLowerCase().includes(defaultArtId))
          : undefined;
        const primarySide = primaryLayer ? getArtworkSide(primaryLayer) : null;
        const hasBack = newLayers.some((l) => getArtworkSide(l) === 'back');
        const hasFront = newLayers.some((l) => getArtworkSide(l) === 'front');
        // Open on the side of the design's primary artwork. Mixed front/back
        // designs used to always open on the front, which hid the main print.
        const activeRegionId: 'front' | 'back' =
          primarySide === 'back' || (!hasFront && hasBack) ? 'back' : 'front';
        const cameraPreset: 'front' | 'back' = activeRegionId;

        return {
          ...prev,
          garmentId: targetGarmentId,
          garmentColor: targetColor,
          activeRegionId,
          artworkLayers: finalLayers,
          camera: {
            ...prev.camera,
            preset: cameraPreset,
          },
        };
      });

      // Prompt 3D guide on first design entry after slight delay so 3D model renders first
      if (typeof window !== 'undefined' && (params.designId || curated)) {
        try {
          const alreadySeen = sessionStorage.getItem('starby_3d_instructions_seen');
          if (!alreadySeen) {
            setTimeout(() => {
              setShowInstructionModal(true);
            }, 850);
          }
        } catch {
          /* ignore */
        }
      }

      // Artworks are directly loaded onto the 3D garment. Keep setup modal closed.
    };

    // 1. Read URL search params
    try {
      const sp = new URLSearchParams(window.location.search);
      const designId = sp.get('designId') || sp.get('design');
      const designName = sp.get('designName');
      const garment = sp.get('garment');
      const color = sp.get('color');
      const placement = sp.get('placement');
      const scale = sp.get('scale') || sp.get('scalePreset');
      const previewUrl = sp.get('previewUrl');
      const layers = sp.get('layers');
      const price = sp.get('price');
      const size = sp.get('size');

      if (designId || previewUrl || garment || layers) {
        applyInitParams({
          designId,
          designName,
          garment,
          color,
          placement,
          scale,
          previewUrl,
          layers,
          price,
          size,
        });
      }
    } catch {
      /* ignore */
    }

    // 2. Listen for postMessage INIT_3D_DESIGN and STARBY_SYNC_PLACEMENTS
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === 'INIT_3D_DESIGN') {
        applyInitParams(e.data.payload || {});
      }
      if (e.data && e.data.type === 'STARBY_SYNC_PLACEMENTS' && e.data.placements) {
        try {
          const all = getAllSavedPlacements();
          const merged = { ...all, ...e.data.placements };
          window.localStorage.setItem('fregoro_curated_placements', JSON.stringify(merged, null, 2));
          setProject3D((prev) => {
            const updated = prev.artworkLayers.map((layer) => {
              const artMatch = (layer.id || '').match(/art-\d+/i);
              let artId = artMatch ? artMatch[0].toLowerCase() : undefined;
              if (!artId && activeCuratedDesign) {
                const matchedArt = activeCuratedDesign.artworks.find(
                  (a: any) =>
                    layer.id?.includes(a.id) ||
                    (layer.name && layer.name.toLowerCase().includes(a.name.toLowerCase()))
                );
                if (matchedArt) artId = matchedArt.id.toLowerCase();
              }
              const dId = e.data.designId || layer.curatedDesignId || (activeCuratedDesign ? activeCuratedDesign.id : undefined);
              const artDef = artId
                ? activeCuratedDesign?.artworks.find(
                    (a: any) => a.id.toLowerCase() === artId
                  )
                : undefined;
              const calibrated = getCuratedPlacement(
                dId,
                prev.garmentId,
                layer.placementTarget || layer.regionId,
                artId
              );
              if (!calibrated) return layer;
              const isColorVariant = artDef?.colorHint === 'black' || artDef?.colorHint === 'white';
              const isHidden = isColorVariant
                ? !matchesArtworkColorHint(artDef?.colorHint, prev.garmentColor)
                : calibrated.hidden === true || calibrated.opacity === 0;
              return {
                ...layer,
                u: calibrated.u,
                v: calibrated.v,
                uvWidth: calibrated.uvWidth,
                uvHeight: calibrated.uvWidth,
                scale: calibrated.scale,
                rotation: calibrated.rotation ?? 0,
                regionId: calibrated.regionId || layer.regionId,
                placementTarget: calibrated.placementTarget || layer.placementTarget,
                colorHint: artDef?.colorHint || layer.colorHint,
                opacity: isHidden
                  ? 0
                  : isColorVariant
                  ? 1.0
                  : typeof calibrated.opacity === 'number'
                  ? calibrated.opacity
                  : layer.opacity,
                hidden: isHidden,
                offsetX: parseFloat(((calibrated.u - 0.5) * 2).toFixed(3)),
                offsetY: parseFloat(((calibrated.v - 0.5) * 2).toFixed(3)),
              };
            });
            return { ...prev, artworkLayers: updated };
          });
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        // On mobile, never leave UV editor open over 3D model by default
        setIsUvEditorOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cursor bridging when embedded in host site (e.g. StarBy Next.js app)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.parent || window.parent === window) return;
    if ((window as any).__parentCursorBridgeActive) return;

    let pendingMove: MouseEvent | null = null;
    let rafId: number | null = null;
    let lastInteractive: boolean | null = null;

    const forwardMove = () => {
      rafId = null;
      if (!pendingMove) return;
      try {
        const frameEl = window.frameElement;
        const rect = frameEl ? frameEl.getBoundingClientRect() : { left: 0, top: 0 };
        const parentEvent = new MouseEvent('mousemove', {
          clientX: pendingMove.clientX + rect.left,
          clientY: pendingMove.clientY + rect.top,
          bubbles: true,
        });
        window.parent.dispatchEvent(parentEvent);
      } catch {
        window.parent.postMessage(
          {
            type: 'CUSTOM_CURSOR_MOVE',
            clientX: pendingMove.clientX,
            clientY: pendingMove.clientY,
          },
          '*'
        );
      }
    };

    const forwardMouseMove = (e: MouseEvent) => {
      pendingMove = e;
      if (rafId === null) {
        rafId = requestAnimationFrame(forwardMove);
      }

      const target = e.target as HTMLElement | null;
      const isInteractive = !!target?.closest(
        'button, a, input, select, textarea, [role="button"], .clickable, .nav-tab-btn, .side-btn, .header-btn, .btn-card-subtle'
      );
      if (isInteractive !== lastInteractive) {
        lastInteractive = isInteractive;
        try {
          window.parent.dispatchEvent(
            new CustomEvent('custom-cursor-hover', {
              detail: { isInteractive },
            })
          );
        } catch {}
      }
    };

    const forwardMouseDown = () => {
      try {
        window.parent.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      } catch {}
    };

    const forwardMouseUp = () => {
      try {
        window.parent.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      } catch {}
    };

    window.addEventListener('mousemove', forwardMouseMove, { passive: true });
    window.addEventListener('mousedown', forwardMouseDown, { passive: true });
    window.addEventListener('mouseup', forwardMouseUp, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', forwardMouseMove);
      window.removeEventListener('mousedown', forwardMouseDown);
      window.removeEventListener('mouseup', forwardMouseUp);
    };
  }, []);

  const handleTabChange = useCallback((tab: SidebarTab) => {
    if (tab === 'library3d') {
      setIsDesignsLibraryOpen(true);
      setMobileDrawerOpen(false);
      setDesktopDrawerOpen(false);
      return;
    }
    if (tab === 'uv3d') {
      setIsUvEditorOpen((prev) => !prev);
      setMobileDrawerOpen(false);
    } else {
      if (isMobile) {
        if (mobileDrawerOpen && activeTab === tab) {
          setMobileDrawerOpen(false);
        } else {
          setActiveTab(tab);
          setMobileDrawerOpen(true);
        }
      } else {
        if (desktopDrawerOpen && activeTab === tab) {
          setDesktopDrawerOpen(false);
        } else {
          setActiveTab(tab);
          setDesktopDrawerOpen(true);
        }
      }
    }
  }, [isMobile, mobileDrawerOpen, desktopDrawerOpen, activeTab]);

  const getDrawerTitle = (tab: SidebarTab) => {
    switch (tab) {
      case 'color3d': return 'Garment Color & Material';
      case 'artwork3d': return 'Artwork & Placement';
      case 'animation3d': return 'Skeletal Motion & Poses';
      case 'lighting3d': return 'Studio Lighting & Environment';
      case 'export3d': return 'Export 3D Model & Renders';
      case 'garment3d': return '3D Garment Models';
      case 'project3d': return 'Project Settings';
      default: return 'Studio Settings';
    }
  };

  // =========================================================================
  // 3D HANDLERS
  // =========================================================================
  const currentGarmentConfig3D = getGarmentConfig(project3D.garmentId);

  const handleSelectGarment3D = (garment: Garment3DConfig | string) => {
    const garmentId = typeof garment === 'string' ? garment : garment.id;
    const config = typeof garment === 'string' ? getGarmentConfig(garmentId) : garment;
    const approvedColors = getApprovedColorsForGarment(garmentId);

    if (!isCuratedDesign) {
      const livePrice =
        lookupSizePrice(garmentSizePriceMapRef.current[resolveGarmentId(garmentId)], selectedGarmentSize) ??
        GARMENT_DEFAULT_BASE_PRICES[resolveGarmentId(garmentId)];
      if (livePrice) setBasePrice(livePrice);
    }

    setProject3D((prev) => {
      const colorMatches = approvedColors.some(
        (c) => c.hex.toLowerCase() === prev.garmentColor.toLowerCase()
      );
      const newColor = colorMatches ? prev.garmentColor : approvedColors[0].hex;

      const updatedLayers = prev.artworkLayers.map((l) => {
        if (!l.isCurated && l.locked === false) {
          return l;
        }
        const designId = l.curatedDesignId || activeCuratedDesign?.id || initialDesignId || null;
        const target =
          l.placementTarget ||
          (l.regionId === 'back' || l.name.toLowerCase().includes('back')
            ? 'back-center'
            : l.name.toLowerCase().includes('sleeve')
            ? 'left-sleeve'
            : 'front-center');
        const artMatch = l.id.match(/art-\d+/i);
        const artId = artMatch ? artMatch[0].toLowerCase() : null;
        const calibrated = getCuratedPlacement(
          designId,
          garmentId,
          target,
          artId
        );
        return {
          ...l,
          placementTarget: target,
          u: calibrated.u,
          v: calibrated.v,
          uvWidth: calibrated.uvWidth,
          uvHeight: l.lockAspectRatio !== false ? undefined : calibrated.uvWidth,
          scale: calibrated.scale,
          rotation: calibrated.rotation ?? l.rotation,
          regionId: calibrated.regionId || l.regionId,
          offsetX: parseFloat(((calibrated.u - 0.5) * 2).toFixed(3)),
          offsetY: parseFloat(((calibrated.v - 0.5) * 2).toFixed(3)),
          locked: l.isCurated ? !(isDesignerAuthorized && isDesignerMode) : l.locked,
        };
      });

      return {
        ...prev,
        garmentId,
        garmentColor: newColor,
        name: `${config.name} Mockup`,
        artworkLayers: updatedLayers,
        activeRegionId: config.regions[0].id,
        camera: {
          ...prev.camera,
          preset: 'front',
        },
      };
    });
    setSelectedPanelId3D(null);
  };

  const handleAddArtwork3D = useCallback((layer: ArtworkLayer3D) => {
    setProject3D((prev) => ({
      ...prev,
      artworkLayers: [...prev.artworkLayers, layer],
      activeRegionId: layer.regionId || prev.activeRegionId,
    }));
    setSelectedLayerId3D(layer.id);
  }, []);




  const handleApplyDesignFromLibrary3D = useCallback(
    async (event: ApplyDesignEvent) => {
      const { design, artwork, targetPlacement } = event;
      if (design) {
        setActiveCuratedDesign(design);
        setInitialDesignId(design.id);
        if (typeof window !== 'undefined') {
          try {
            const url = new URL(window.location.href);
            url.searchParams.set('designId', design.id);
            window.history.replaceState({}, '', url.toString());
          } catch {}
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(
              { type: 'STARBY_DESIGN_CHANGED', designId: design.id, designName: design.name },
              '*'
            );
          }
          // Pull the artist's saved placements for this design before the layer
          // is built, so a curated design lands exactly where it was calibrated.
          await syncServerPlacements(design.id, project3D.garmentId).catch(() => {});
        }
      }
      const imgUrl = artwork.studioPreviewUrl || artwork.previewUrl;
      const finalPlacement = targetPlacement || artwork.suggestedPlacement || 'front-center';

      // A colour-specific variant must be shown on the fabric it was drawn for.
      // This is a preview colour switch only; the saved placement stays intact.
      let targetColor = project3D.garmentColor;
      if (artwork.colorHint === 'black' && isLightGarmentHex(targetColor)) {
        targetColor = '#111216';
      } else if (artwork.colorHint === 'white' && !isLightGarmentHex(targetColor)) {
        targetColor = '#ffffff';
      }

      const calibrated = getCuratedPlacement(design?.id, project3D.garmentId, finalPlacement, artwork.id);
      if (calibrated?.removed) return;
      const isColorVariant = artwork.colorHint === 'black' || artwork.colorHint === 'white';
      const isHidden = isColorVariant
        ? !matchesArtworkColorHint(artwork.colorHint, targetColor)
        : calibrated?.hidden === true || calibrated?.opacity === 0;
      const baseLayer = buildLayerFromPlacement(project3D.garmentId, {
        id: `layer-${design?.id || 'curated'}-${artwork.id}-${Date.now()}`,
        name: artwork.name,
        imageUrl: imgUrl,
        placementTextOrTarget: calibrated?.placementTarget || finalPlacement,
        scalePresetOrText: finalPlacement === 'left-chest' || finalPlacement === 'back-collar' ? 'compact' : 'standard',
      });

      const layer: ArtworkLayer3D = {
        ...baseLayer,
        u: calibrated.u,
        v: calibrated.v,
        uvWidth: calibrated.uvWidth,
        uvHeight: calibrated.uvWidth,
        scale: calibrated.scale,
        rotation: calibrated.rotation ?? 0,
        opacity: isHidden
          ? 0
          : isColorVariant
          ? 1.0
          : typeof calibrated.opacity === 'number'
          ? calibrated.opacity
          : 1.0,
        hidden: isHidden,
        regionId: calibrated.regionId || baseLayer.regionId,
        placementTarget: calibrated.placementTarget || finalPlacement,
        offsetX: parseFloat(((calibrated.u - 0.5) * 2).toFixed(3)),
        offsetY: parseFloat(((calibrated.v - 0.5) * 2).toFixed(3)),
        isCurated: true,
        curatedDesignId: design?.id,
        colorHint: artwork.colorHint,
        locked: !(isDesignerAuthorized && isDesignerMode),
      };

      const isBack = layer.regionId === 'back';

      // Keep other artworks from the same set so customers can also add a
      // curated design one artwork at a time. Switching to another design
      // replaces the previous set; the saved placements are never changed.
      setProject3D((prev) => {
        const artPattern = new RegExp(`(^|-)${artwork.id.toLowerCase()}(-|$)`);
        const keptLayers = prev.artworkLayers.filter(
          (l) =>
            !(
              l.isCurated &&
              l.curatedDesignId === design?.id &&
              artPattern.test(l.id.toLowerCase())
            )
        );
        const colourAdjustedLayers = keptLayers.map((l) => {
          if (
            !l.isCurated ||
            l.curatedDesignId !== design?.id ||
            !l.colorHint ||
            l.colorHint === 'any'
          ) {
            return l;
          }
          const matches = matchesArtworkColorHint(l.colorHint, targetColor);
          return {
            ...l,
            hidden: !matches,
            opacity: matches ? (l.opacity && l.opacity > 0 ? l.opacity : 1.0) : 0,
          };
        });
        return {
          ...prev,
          garmentColor: targetColor,
          artworkLayers: [...colourAdjustedLayers, layer],
          activeRegionId: layer.regionId || prev.activeRegionId,
          camera: {
            ...prev.camera,
            preset: isBack ? 'back' : 'front',
          },
        };
      });

      setSelectedLayerId3D(layer.id);
    },
    [project3D.garmentId, project3D.garmentColor, isDesignerAuthorized, isDesignerMode]
  );

  const handleApplyAllArtworksFromDesign3D = useCallback(
    async (design: CuratedClothingDesign) => {
      setActiveCuratedDesign(design);
      setInitialDesignId(design.id);

      if (typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('designId', design.id);
          window.history.replaceState({}, '', url.toString());
        } catch {}
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            { type: 'STARBY_DESIGN_CHANGED', designId: design.id, designName: design.name },
            '*'
          );
        }
      }

      // 1. Pull the artist's saved placements for this design first so every
      //    artwork uses its calibrated UV coordinates instead of the defaults.
      await syncServerPlacements(design.id, project3D.garmentId).catch(() => {});

      let targetColor = project3D.garmentColor;
      const colorHint = design.artworks.find((a) => a.colorHint && a.colorHint !== 'any')?.colorHint;
      if (colorHint === 'black' && isLightGarmentHex(targetColor)) {
        targetColor = '#111216';
      } else if (colorHint === 'white' && !isLightGarmentHex(targetColor)) {
        targetColor = '#ffffff';
      }

      const newLayers: ArtworkLayer3D[] = [];
      let hasBack = false;
      let hasFront = false;
      design.artworks.forEach((art, idx) => {
        const placement = art.suggestedPlacement || (idx === 0 ? 'front-center' : 'back-center');

        const calibrated = getCuratedPlacement(design.id, project3D.garmentId, placement, art.id);
        if (calibrated?.removed) return;
        // For colour variants the saved hidden flag belongs to whichever fabric
        // was active when the designer saved. Use the colour hint instead so
        // the matching variant prints and the other one stays hidden.
        const isColorVariant = art.colorHint === 'black' || art.colorHint === 'white';
        const isHidden = isColorVariant
          ? !matchesArtworkColorHint(art.colorHint, targetColor)
          : calibrated?.hidden === true || calibrated?.opacity === 0;

        const layer = computePlacementLayer(
          project3D.garmentId,
          {
            id: `layer-${design.id}-${art.id}-${Date.now()}-${idx}`,
            name: `${art.name} (${(calibrated?.placementTarget || placement).includes('back') ? 'Back' : 'Front'})`,
            imageUrl: art.studioPreviewUrl || art.previewUrl,
            placement: calibrated?.placementTarget || placement,
            scale: calibrated?.scale ?? (placement === 'left-chest' || placement === 'back-collar' ? 'compact' : 'standard'),
            opacity: isHidden ? 0 : (typeof calibrated?.opacity === 'number' ? calibrated.opacity : 1.0),
            hidden: isHidden,
            curatedDesignId: design.id,
            isCurated: true,
            u: calibrated?.u,
            v: calibrated?.v,
            uvWidth: calibrated?.uvWidth,
            rotation: calibrated?.rotation ?? 0,
            regionId: calibrated?.regionId,
            placementTarget: calibrated?.placementTarget || placement,
          },
          idx
        );

        if (layer) {
          // computePlacementLayer merges the saved hidden flag; colour variants
          // need the explicit colour-aware state computed above instead.
          layer.hidden = isHidden;
          layer.opacity = isHidden
            ? 0
            : isColorVariant
            ? 1.0
            : typeof calibrated?.opacity === 'number'
            ? calibrated.opacity
            : 1.0;
          layer.locked = !(isDesignerAuthorized && isDesignerMode);
          layer.isCurated = true;
          layer.curatedDesignId = design.id;
          layer.colorHint = art.colorHint;
          newLayers.push(layer);
          const isVisible = layer.opacity !== 0 && layer.hidden !== true;
          if (isVisible && layer.regionId === 'back') hasBack = true;
          if (isVisible && layer.regionId === 'front') hasFront = true;
        }
      });

      if (newLayers.length > 0) {
        const defaultArtMatch = design.defaultArtworkId
          ?.toLowerCase()
          .match(/art-\d+/i);
        const defaultArtId = defaultArtMatch ? defaultArtMatch[0].toLowerCase() : null;
        const primaryLayer = defaultArtId
          ? newLayers.find((l) => l.id.toLowerCase().includes(defaultArtId))
          : undefined;
        const primarySide = primaryLayer ? getArtworkSide(primaryLayer) : null;
        const initialCamera: 'front' | 'back' =
          primarySide === 'back' || (!hasFront && hasBack) ? 'back' : 'front';
        const initialRegion: 'front' | 'back' = initialCamera;

        setProject3D((prev) => ({
          ...prev,
          garmentColor: targetColor,
          artworkLayers: newLayers, // Completely replaces all previous artwork layers with new design
          activeRegionId: initialRegion,
          camera: {
            ...prev.camera,
            preset: initialCamera,
          },
        }));

        setSelectedLayerId3D(
          (newLayers.find((l) => l.opacity !== 0 && l.hidden !== true) || newLayers[0]).id
        );
        // Don't cover the freshly applied artwork with the guide modal — the
        // user already knows the studio. Mark it as seen so it stays hidden.
        try {
          sessionStorage.setItem('starby_3d_instructions_seen', 'true');
        } catch {
          /* ignore */
        }
      }
    },
    [project3D.garmentId, project3D.garmentColor, computePlacementLayer]
  );



  // Auto-select latest artwork layer when added if none selected
  useEffect(() => {
    if (!selectedLayerId3D && project3D.artworkLayers.length > 0) {
      setSelectedLayerId3D(project3D.artworkLayers[project3D.artworkLayers.length - 1].id);
    }
  }, [project3D.artworkLayers.length]);

  const handleUpdateLayer3D = (id: string, updates: Partial<ArtworkLayer3D>) => {
    const targetLayer = project3D.artworkLayers.find((l) => l.id === id);
    if (targetLayer?.locked && !isDesignerMode) return;
    setProject3D((prev) => {
      let updatedLayerForSave: ArtworkLayer3D | null = null;
      const nextLayers = prev.artworkLayers.map((l) => {
        if (l.id !== id) return l;
        const merged = { ...l, ...updates };
        if (updates.scale !== undefined && updates.uvWidth === undefined) {
          merged.uvWidth = parseFloat((0.35 * updates.scale).toFixed(5));
          if (!merged.lockAspectRatio && merged.uvHeight !== undefined) {
            merged.uvHeight = parseFloat((0.35 * updates.scale).toFixed(5));
          }
        } else if (updates.uvWidth !== undefined && updates.scale === undefined) {
          merged.scale = parseFloat((updates.uvWidth / 0.35).toFixed(5));
        }

        // Auto-detect panel and region if coordinates moved and not explicitly overridden
        if (updates.u !== undefined || updates.v !== undefined) {
          const checkU = updates.u !== undefined ? updates.u : merged.u;
          const checkV = updates.v !== undefined ? updates.v : merged.v;
          if (checkU !== undefined && checkV !== undefined) {
            const panel = findPanelAtUV(prev.garmentId, checkU, checkV);
            if (panel && !updates.regionId && !updates.placementTarget) {
              if (panel.id === 'back_body') {
                merged.regionId = 'back';
                if (!merged.placementTarget || !merged.placementTarget.includes('back')) {
                  merged.placementTarget = 'back-center';
                }
              } else if (panel.id === 'collar') {
                merged.regionId = 'back';
                merged.placementTarget = 'back-collar';
              } else if (panel.id === 'left_sleeve') {
                merged.regionId = 'front';
                merged.placementTarget = 'left-sleeve';
              } else if (panel.id === 'right_sleeve') {
                merged.regionId = 'front';
                merged.placementTarget = 'right-sleeve';
              } else if (panel.id === 'front_body') {
                merged.regionId = 'front';
                if (!merged.placementTarget || merged.placementTarget.includes('back') || merged.placementTarget.includes('sleeve')) {
                  merged.placementTarget = 'front-center';
                }
              }
            }
          }
        }

        updatedLayerForSave = merged;
        return merged;
      });

      // AUTO-PERSIST: Persist artwork placements to localStorage immediately on any adjustment
      if (updatedLayerForSave) {
        const lyr = updatedLayerForSave as ArtworkLayer3D;
        let urlDesignId: string | null = null;
        if (typeof window !== 'undefined') {
          try {
            urlDesignId = new URLSearchParams(window.location.search).get('designId');
          } catch {
            /* ignore */
          }
        }

        const primaryDesignId =
          lyr.curatedDesignId ||
          activeCuratedDesign?.id ||
          initialDesignId ||
          urlDesignId ||
          (lyr.isCurated ? 'design-001' : null);

        if (primaryDesignId) {
          const target =
            lyr.placementTarget ||
            (lyr.regionId === 'back' || lyr.name.toLowerCase().includes('back')
              ? 'back-center'
              : lyr.name.toLowerCase().includes('sleeve')
              ? 'left-sleeve'
              : 'front-center');

          const artMatch = lyr.id.match(/art-\d+/i);
          const artId = artMatch ? artMatch[0].toLowerCase() : undefined;

          const isLyrHidden = lyr.opacity === 0 || (lyr as any).hidden === true;
          saveCuratedPlacement(
            primaryDesignId,
            prev.garmentId,
            {
              u: lyr.u !== undefined ? lyr.u : 0.25,
              v: lyr.v !== undefined ? lyr.v : 0.63,
              uvWidth: lyr.uvWidth !== undefined ? lyr.uvWidth : 0.26,
              scale: lyr.scale !== undefined ? lyr.scale : 0.74,
              rotation: lyr.rotation || 0,
              regionId: (lyr.regionId as 'front' | 'back') || (target.includes('back') ? 'back' : 'front'),
              placementTarget: target,
              scalePreset: lyr.scalePreset || 'standard',
              hidden: isLyrHidden,
              removed: false,
              opacity: typeof lyr.opacity === 'number' ? lyr.opacity : (isLyrHidden ? 0 : 1.0),
            },
            target,
            artId
          );
        }
      }

      return {
        ...prev,
        artworkLayers: nextLayers,
      };
    });
  };

  const handleDuplicateLayer3D = (id: string) => {
    const layer = project3D.artworkLayers.find((l) => l.id === id);
    if (!layer || (layer.locked && !isDesignerMode)) return;

    const dup: ArtworkLayer3D = {
      ...layer,
      id: `layer-${Date.now()}`,
      name: `${layer.name} (Copy)`,
      offsetX: layer.offsetX + 0.05,
      offsetY: layer.offsetY + 0.05,
    };

    setProject3D((prev) => ({
      ...prev,
      artworkLayers: [...prev.artworkLayers, dup],
    }));
    setSelectedLayerId3D(dup.id);
  };

  const handleDeleteLayer3D = (id: string) => {
    const deletedLayer = project3D.artworkLayers.find((l) => l.id === id);
    if (deletedLayer?.locked && !isDesignerMode) return;
    setProject3D((prev) => ({
      ...prev,
      artworkLayers: prev.artworkLayers.filter((l) => l.id !== id),
    }));
    if (selectedLayerId3D === id) {
      setSelectedLayerId3D(null);
    }

    if (deletedLayer) {
      let urlDesignId: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          urlDesignId = getUrlDesignId();
        } catch {
          /* ignore */
        }
      }
      const primaryDesignId =
        deletedLayer.curatedDesignId ||
        activeCuratedDesign?.id ||
        initialDesignId ||
        urlDesignId ||
        'design-001';

      const targetCurated = activeCuratedDesign || CURATED_CLOTHING_DESIGNS.find((d) => d.id === primaryDesignId);
      const artMatch = deletedLayer.id.match(/art-\d+/i);
      let artId = artMatch ? artMatch[0].toLowerCase() : undefined;
      if (!artId && targetCurated) {
        const matched = targetCurated.artworks.find(
          (a) => deletedLayer.id.toLowerCase().includes(a.id.toLowerCase()) || (deletedLayer.name && deletedLayer.name.toLowerCase().includes(a.name.toLowerCase()))
        );
        if (matched) artId = matched.id.toLowerCase();
      }

      if (artId) {
        saveCuratedPlacement(
          primaryDesignId,
          project3D.garmentId,
          {
            u: deletedLayer.u ?? 0.25,
            v: deletedLayer.v ?? 0.63,
            uvWidth: deletedLayer.uvWidth ?? 0.26,
            scale: deletedLayer.scale ?? 0.74,
            rotation: deletedLayer.rotation || 0,
            regionId: (deletedLayer.regionId as 'front' | 'back') || 'front',
            hidden: true,
            removed: true,
            opacity: 0,
          },
          deletedLayer.placementTarget,
          artId
        );

        // Only persist removal globally if authorized creator in designer mode
        if (isDesignerAuthorized && isDesignerMode) {
          try {
            fetch('/api/clothing-designs/save-placement', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                designId: primaryDesignId,
                garmentId: project3D.garmentId,
                removedArtIds: [artId],
              }),
            }).catch(() => {});
          } catch {
            /* ignore */
          }
        }

        // Broadcast removal to parent host window
        if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
          window.parent.postMessage(
            {
              type: 'STARBY_ALL_PLACEMENTS_SAVED',
              designId: primaryDesignId,
              garmentId: project3D.garmentId,
              removedArtIds: [artId],
            },
            '*'
          );
        }
      }
    }
  };

  const handleCenterHorizontal3D = (id: string) => {
    handleUpdateLayer3D(id, { offsetX: 0 });
  };

  const handleCenterVertical3D = (id: string) => {
    handleUpdateLayer3D(id, { offsetY: 0 });
  };

  const handleAddArtworkFromFile3D = async (file: File) => {
    try {
      const dataUrl = await readOptimizedImageDataUrl(file, 1600);
      const region = currentGarmentConfig3D.regions.find((r: any) => r.id === project3D.activeRegionId) || currentGarmentConfig3D.regions[0];
      const u = region ? region.uvCenter[0] : 0.25;
      const v = region ? region.uvCenter[1] : 0.63;
      const baseW = region ? region.uvSpan[0] : 0.35;
      const scale = 0.85;
      const uvW = parseFloat((baseW * scale).toFixed(4));
      const uvH = parseFloat((baseW * scale).toFixed(4));

      const newLayer: ArtworkLayer3D = {
        id: `layer-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        regionId: region?.id || 'front',
        imageUrl: dataUrl,
        placementMode: 'atlas',
        u,
        v,
        uvWidth: uvW,
        uvHeight: uvH,
        offsetX: 0,
        offsetY: 0,
        scale,
        rotation: 0,
        opacity: 1.0,
        lockAspectRatio: true,
      };
      handleAddArtwork3D(newLayer);
    } catch (err) {
      console.error('Failed to read 3D artwork file:', err);
    }
  };

  /**
   * Capture the exact view the customer is looking at plus front/back proofs
   * and, only when sleeve artwork exists, left/right sleeve proofs.
   *
   * The "current" capture deliberately does not force a 600×600 frame: keeping
   * the live viewport aspect is what makes the cart/preview image match the 3D
   * studio instead of looking zoomed or cropped.
   */
  const captureCartProofs = async (): Promise<CartProofSet> => {
    const scene = sceneManager3DRef.current;
    if (!scene) {
      return { current: null, front: null, back: null, leftSleeve: null, rightSleeve: null };
    }

    const compositor = compositor3DRef.current ?? undefined;
    const capture = async (
      view: 'current' | 'front' | 'back' | 'left' | 'right',
      square: boolean,
    ): Promise<string | null> => {
      try {
        return await export3DManager.captureSnapshotDataUrl(
          scene,
          {
            view,
            transparent: false,
            resolution: 'cart',
            ...(square ? { width: 600, height: 600 } : {}),
            format: 'jpeg',
            quality: 0.9,
          },
          compositor,
        );
      } catch (err) {
        console.warn(`[App] Failed to capture ${view} cart proof:`, err);
        return null;
      }
    };

    const sides = new Set(project3D.artworkLayers.map((layer) => getArtworkSide(layer)));
    const current = await capture('current', false);
    const front = await capture('front', true);
    const back = await capture('back', true);
    const leftSleeve = sides.has('left-sleeve') ? await capture('left', true) : null;
    const rightSleeve = sides.has('right-sleeve') ? await capture('right', true) : null;

    return { current, front, back, leftSleeve, rightSleeve };
  };

  const handleOpenAddToCart = async () => {
    if (isAddingToCart) return;

    if (isCuratedDesign) {
      // User request: For curated designs placement tees, bypass the popup modal and add to cart directly!
      setIsAddingToCart(true);
      setIsCapturingCartSnapshots(true);
      try {
        const proofs = await captureCartProofs();
        setCartCurrentSnapshot(proofs.current);
        setCartFrontSnapshot(proofs.front);
        setCartBackSnapshot(proofs.back);
        setCartLeftSleeveSnapshot(proofs.leftSleeve);
        setCartRightSleeveSnapshot(proofs.rightSleeve);

        await handleConfirmAddToCart(
          {
            size: selectedGarmentSize || 'L',
            quantity: 1,
            printInstructions: 'Curated studio placement as shown.',
          },
          proofs,
        );
      } catch (err) {
        console.error('[App] Direct add to cart for curated design failed:', err);
      } finally {
        setIsCapturingCartSnapshots(false);
        setIsAddingToCart(false);
      }
      return;
    }

    // For custom designs (user uploaded onto plain blank tee), open the review modal:
    setIsAddToCartOpen(true);
    setIsCapturingCartSnapshots(true);
    setCartCurrentSnapshot(null);
    setCartFrontSnapshot(null);
    setCartBackSnapshot(null);
    setCartLeftSleeveSnapshot(null);
    setCartRightSleeveSnapshot(null);

    try {
      const proofs = await captureCartProofs();
      setCartCurrentSnapshot(proofs.current);
      setCartFrontSnapshot(proofs.front);
      setCartBackSnapshot(proofs.back);
      setCartLeftSleeveSnapshot(proofs.leftSleeve);
      setCartRightSleeveSnapshot(proofs.rightSleeve);
    } catch (err) {
      console.error('[App] Failed to capture cart mockups:', err);
    } finally {
      setIsCapturingCartSnapshots(false);
    }
  };

  const handleConfirmAddToCart = async (
    data: {
      size: string;
      quantity: number;
      printInstructions: string;
    },
    overrideProofs?: Partial<CartProofSet>
  ) => {
    let currentSnapshot = overrideProofs?.current ?? cartCurrentSnapshot;
    let frontSnapshot = overrideProofs?.front ?? cartFrontSnapshot;
    let backSnapshot = overrideProofs?.back ?? cartBackSnapshot;
    let leftSleeveSnapshot = overrideProofs?.leftSleeve ?? cartLeftSleeveSnapshot;
    let rightSleeveSnapshot = overrideProofs?.rightSleeve ?? cartRightSleeveSnapshot;

    if (
      (!currentSnapshot || !frontSnapshot || !backSnapshot) &&
      sceneManager3DRef.current
    ) {
      try {
        const captured = await captureCartProofs();
        currentSnapshot = currentSnapshot || captured.current;
        frontSnapshot = frontSnapshot || captured.front;
        backSnapshot = backSnapshot || captured.back;
        leftSleeveSnapshot = leftSleeveSnapshot || captured.leftSleeve;
        rightSleeveSnapshot = rightSleeveSnapshot || captured.rightSleeve;
      } catch (err) {
        console.warn('[App] 3D mockup fallback snapshot warning:', err);
      }
    }

    let frontDesignUrl: string | null = null;
    let backDesignUrl: string | null = null;
    let leftSleeveDesignUrl: string | null = null;
    let rightSleeveDesignUrl: string | null = null;
    const uploadedArtworks: {
      name: string;
      url: string;
      dataUrl?: string;
      side: string;
      placementTarget?: string;
    }[] = [];

    project3D.artworkLayers.forEach((l) => {
      const side = getArtworkSide(l);
      uploadedArtworks.push({
        name: l.name || 'Artwork',
        url: l.imageUrl,
        side,
        placementTarget: l.placementTarget,
      });
      if (side === 'front' && !frontDesignUrl) {
        frontDesignUrl = l.imageUrl;
      } else if (side === 'back' && !backDesignUrl) {
        backDesignUrl = l.imageUrl;
      } else if (side === 'left-sleeve' && !leftSleeveDesignUrl) {
        leftSleeveDesignUrl = l.imageUrl;
      } else if (side === 'right-sleeve' && !rightSleeveDesignUrl) {
        rightSleeveDesignUrl = l.imageUrl;
      }
    });

    if (!frontDesignUrl) {
      frontDesignUrl = project3D.artworkLayers.find((l) => getArtworkSide(l) === 'front')?.imageUrl || null;
    }

    const primaryDesignFileUrl =
      frontDesignUrl || backDesignUrl || leftSleeveDesignUrl || rightSleeveDesignUrl || null;
    const garmentName = currentGarmentConfig3D.name;
    const garmentId = project3D.garmentId;
    const garmentColor = project3D.garmentColor;

    const sizeForPricing = data.size || selectedGarmentSize || 'L';
    const sizeAdjustedBasePrice = getGarmentPriceForSize(garmentId, sizeForPricing);
    const finalPrice = getUnitPriceForSize(sizeForPricing);

    let urlProductId: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        urlProductId = new URLSearchParams(window.location.search).get('productId');
      } catch {
        /* ignore */
      }
    }

    const payload = {
      productId: urlProductId || undefined,
      garmentId,
      garmentName,
      garmentColor,
      size: data.size,
      quantity: data.quantity,
      price: finalPrice,
      basePrice: sizeAdjustedBasePrice,
      customArtworkCount: activeCustomArtworkCount,
      customPrintFee,
      plain: isPlainParam || !initialDesignId,
      designId: initialDesignId || undefined,
      frontPreviewUrl: frontSnapshot,
      backPreviewUrl: backSnapshot,
      currentPreviewUrl: currentSnapshot,
      leftSleevePreviewUrl: leftSleeveSnapshot,
      rightSleevePreviewUrl: rightSleeveSnapshot,
      previewFileUrl: currentSnapshot || frontSnapshot || backSnapshot,
      frontDesignFileUrl: frontDesignUrl,
      backDesignFileUrl: backDesignUrl,
      leftSleeveDesignFileUrl: leftSleeveDesignUrl,
      rightSleeveDesignFileUrl: rightSleeveDesignUrl,
      designFileUrl: primaryDesignFileUrl,
      uploadedArtworks,
      printInstructions: data.printInstructions,
      customerNotes: data.printInstructions,
      mode: '3d',
    };

    // Send to parent host window (Next.js StarBy app)
    if (typeof window !== 'undefined') {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'ADD_CLOTHING_MOCKUP_TO_CART',
            payload,
          },
          '*'
        );
      } else {
        window.dispatchEvent(
          new CustomEvent('ADD_CLOTHING_MOCKUP_TO_CART', {
            detail: payload,
          })
        );
      }
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        templateName={currentGarmentConfig3D.name}
        onOpenExport={() => {
          setActiveTab('export3d');
          setDesktopDrawerOpen(true);
          setMobileDrawerOpen(true);
        }}
        onSaveProject={() => {
          // handleSaveCurrentPlacement owns success/error feedback.
          void handleSaveCurrentPlacement();
        }}
        onLoadProject={() => {
          setActiveTab('project3d');
          setDesktopDrawerOpen(true);
          setMobileDrawerOpen(true);
        }}
        onCameraPreset3D={(preset) => {
          setProject3D((prev) => ({
            ...prev,
            camera: { ...prev.camera, preset },
          }));
        }}
        onOpenAddToCart={handleOpenAddToCart}
        onOpenDesignsLibrary={() => setIsDesignsLibraryOpen(true)}
        onOpenDesignSetup={() => setIsDesignSetupModalOpen(true)}
        onOpenInstructions={() => setShowInstructionModal(true)}
        hasLoadedDesign={!!activeCuratedDesign || project3D.artworkLayers.length > 0}
        isDesignerAuthorized={isDesignerAuthorized}
        isDesignerMode={isDesignerAuthorized ? isDesignerMode : false}
        onToggleDesignerMode={isDesignerAuthorized ? handleToggleDesignerMode : undefined}
        price={effectivePrice}
        isAddingToCart={isAddingToCart}
      />

      {/* Floating Save Confirmation Notification Banner */}
      {showSaveSuccessBanner && (
        <div
          style={{
            position: 'fixed',
            top: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999999,
            backgroundColor: '#10b981',
            color: '#ffffff',
            padding: '10px 22px',
            borderRadius: '8px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <span>✓</span>
          <span>Curated placements for {currentGarmentConfig3D.name} saved successfully!</span>
        </div>
      )}

      {/* Floating Save Error Notification Banner */}
      {saveErrorMessage && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999999,
            backgroundColor: '#dc2626',
            color: '#ffffff',
            padding: '10px 22px',
            borderRadius: '8px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <span>!</span>
          <span>{saveErrorMessage}</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="workspace-body">
        {/* Mobile drawer backdrop */}
        {mobileDrawerOpen && (
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Navigation Sidebar Tabs */}
        <SidebarTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          layerCount={project3D.artworkLayers.length}
          isDrawerOpen={isMobile ? mobileDrawerOpen : desktopDrawerOpen}
        />

        {/* Dynamic Drawers */}
        {(() => {
          const shouldShowDrawer = isMobile ? (mobileDrawerOpen && activeTab !== 'uv3d') : (desktopDrawerOpen && activeTab !== 'uv3d');
          if (!shouldShowDrawer) return null;

          return (
            <aside className={`drawer-panel ${mobileDrawerOpen ? 'mobile-sheet-open' : ''} ${desktopDrawerOpen ? 'desktop-drawer-open' : ''}`}>
              {/* Drawer Drag Handle and Header */}
              <div className="mobile-sheet-header">
                <div className="mobile-sheet-drag-handle" />
                <div className="mobile-sheet-title-bar">
                  <span className="mobile-sheet-title">{getDrawerTitle(activeTab)}</span>
                  <button
                    type="button"
                    className="mobile-sheet-close-btn"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      setDesktopDrawerOpen(false);
                    }}
                    aria-label="Close settings drawer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="drawer-panel-scroll">
                <>
                  {activeTab === 'garment3d' && (
                      <DrawerGarment3D
                        selectedGarmentId={project3D.garmentId}
                        onSelectGarment={handleSelectGarment3D}
                      />
                    )}

                    {activeTab === 'artwork3d' && (
                      <DrawerArtwork3D
                        garmentConfig={currentGarmentConfig3D}
                        artworkLayers={project3D.artworkLayers}
                        activeRegionId={project3D.activeRegionId}
                        onRegionChange={(regionId) =>
                          setProject3D((prev) => ({ ...prev, activeRegionId: regionId }))
                        }
                        onAddArtwork={handleAddArtwork3D}
                        onUpdateLayer={handleUpdateLayer3D}
                        onDuplicateLayer={handleDuplicateLayer3D}
                        onDeleteLayer={handleDeleteLayer3D}
                        selectedLayerId={selectedLayerId3D}
                        onSelectLayer={setSelectedLayerId3D}
                        onOpenLibrary={() => setIsDesignsLibraryOpen(true)}
                        isDesignerAuthorized={isDesignerAuthorized}
                        isDesignerMode={isDesignerAuthorized ? isDesignerMode : false}
                        isCuratedDesign={isCuratedDesign}
                        customArtworkCount={activeCustomArtworkCount}
                        customPrintFee={displayPrintFee}
                        basePrice={getGarmentPriceForSize(project3D.garmentId, selectedGarmentSize)}
                        onToggleDesignerMode={isDesignerAuthorized ? handleToggleDesignerMode : undefined}
                      />
                    )}

                    {activeTab === 'color3d' && (
                      <DrawerColor3D
                        garmentId={project3D.garmentId}
                        garmentColor={project3D.garmentColor}
                        onColorChange={handleModalChangeColor}
                        roughness={project3D.roughness}
                        onRoughnessChange={(r) =>
                          setProject3D((prev) => ({ ...prev, roughness: r }))
                        }
                        metalness={project3D.metalness}
                        onMetalnessChange={(m) =>
                          setProject3D((prev) => ({ ...prev, metalness: m }))
                        }
                      />
                    )}

                    {activeTab === 'animation3d' && (
                      <DrawerAnimation3D
                        isAnimated={project3D.isAnimated}
                        onAnimatedToggle={() =>
                          setProject3D((prev) => ({
                            ...prev,
                            isAnimated: !prev.isAnimated,
                            isPlaying: !prev.isAnimated,
                          }))
                        }
                        currentAction={project3D.currentAction}
                        onActionChange={(action) =>
                          setProject3D((prev) => ({ ...prev, currentAction: action }))
                        }
                        isPlaying={project3D.isPlaying}
                        onPlayToggle={() =>
                          setProject3D((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
                        }
                        playbackSpeed={project3D.playbackSpeed}
                        onSpeedChange={(speed) =>
                          setProject3D((prev) => ({ ...prev, playbackSpeed: speed }))
                        }
                        secondaryMotionEnabled={project3D.secondaryMotionEnabled}
                        onSecondaryMotionToggle={() =>
                          setProject3D((prev) => ({
                            ...prev,
                            secondaryMotionEnabled: !prev.secondaryMotionEnabled,
                          }))
                        }
                      />
                    )}

                    {activeTab === 'lighting3d' && (
                      <DrawerLighting3D
                        lighting={project3D.lighting}
                        onUpdateLighting={(updates) =>
                          setProject3D((prev) => ({
                            ...prev,
                            lighting: { ...prev.lighting, ...updates },
                          }))
                        }
                      />
                    )}

                    {activeTab === 'export3d' && (
                      <DrawerExport3D
                        sceneManager={sceneManager3DRef.current}
                        compositor={compositor3DRef.current}
                        garmentName={currentGarmentConfig3D.name}
                      />
                    )}

                    {activeTab === 'project3d' && (
                      <DrawerProject3D
                        currentProject={project3D}
                        onLoadProject={(loaded) => setProject3D(loaded)}
                      />
                    )}
                  </>
              </div>
            </aside>
          );
        })()}


        {/* Center Viewport and 3D UV Editor */}
        <>
            {/* Designer Placement Calibration Bar */}
            {isDesignerAuthorized && isDesignerMode && (
              <DesignerPlacementBar
                activeDesignName={
                  activeCuratedDesign?.name ||
                  project3D.artworkLayers[0]?.name ||
                  'Selected Artwork'
                }
                activeDesignId={
                  activeCuratedDesign?.id ||
                  project3D.artworkLayers[0]?.curatedDesignId ||
                  initialDesignId
                }
                garmentConfig={currentGarmentConfig3D}
                selectedLayer={
                  project3D.artworkLayers.find((l) => l.id === selectedLayerId3D) ||
                  project3D.artworkLayers[0] ||
                  null
                }
                isDesignerAuthorized={isDesignerAuthorized}
                isDesignerMode={isDesignerMode}
                onToggleDesignerMode={handleToggleDesignerMode}
                onSelectGarment={handleSelectGarment3D}
                onUpdateLayer={handleUpdateLayer3D}
                onSavePlacement={handleSaveCurrentPlacement}
                onResetPlacement={() => {
                  const primaryDesignId =
                    project3D.artworkLayers[0]?.curatedDesignId ||
                    activeCuratedDesign?.id ||
                    initialDesignId ||
                    null;
                  if (primaryDesignId) {
                    clearCuratedPlacement(primaryDesignId, project3D.garmentId);
                  }
                  project3D.artworkLayers.forEach((l) => {
                    const target =
                      l.placementTarget ||
                      (l.regionId === 'back' || l.name.toLowerCase().includes('back')
                        ? 'back-center'
                        : l.name.toLowerCase().includes('sleeve')
                        ? 'left-sleeve'
                        : 'front-center');
                    const resetPl = getCuratedPlacement(null, project3D.garmentId, target);
                    handleUpdateLayer3D(l.id, {
                      u: resetPl.u,
                      v: resetPl.v,
                      uvWidth: resetPl.uvWidth,
                      scale: resetPl.scale,
                      rotation: resetPl.rotation,
                      regionId: resetPl.regionId,
                      placementTarget: target,
                    });
                  });
                }}
                onApplyPreset={(target) => {
                  const targetLayer =
                    project3D.artworkLayers.find((l) => l.id === selectedLayerId3D) ||
                    project3D.artworkLayers[0];
                  if (!targetLayer) return;
                  const updated = buildLayerFromPlacement(project3D.garmentId, {
                    id: targetLayer.id,
                    name: targetLayer.name,
                    imageUrl: targetLayer.imageUrl,
                    placementTextOrTarget: target,
                    scalePresetOrText: targetLayer.scalePreset || 'standard',
                  });
                  handleUpdateLayer3D(targetLayer.id, {
                    placementMode: 'atlas',
                    u: updated.u,
                    v: updated.v,
                    uvWidth: updated.uvWidth,
                    uvHeight: updated.uvHeight,
                    scale: updated.scale,
                    rotation: updated.rotation,
                    regionId: updated.regionId,
                    placementTarget: target,
                  });
                  if (updated.regionId) {
                    setProject3D((prev) => ({
                      ...prev,
                      activeRegionId: updated.regionId,
                      camera: {
                        ...prev.camera,
                        preset: updated.regionId === 'back' ? 'back' : 'front',
                      },
                    }));
                  }
                }}
              />
            )}

            <Viewport3D
              garmentConfig={currentGarmentConfig3D}
              garmentColor={project3D.garmentColor}
              roughness={project3D.roughness}
              metalness={project3D.metalness}
              artworkLayers={project3D.artworkLayers}
              activeRegionId={project3D.activeRegionId}
              selectedLayerId={selectedLayerId3D}
              selectedPanelId={selectedPanelId3D}
              isAnimated={project3D.isAnimated}
              currentAction={project3D.currentAction}
              isPlaying={project3D.isPlaying}
              playbackSpeed={project3D.playbackSpeed}
              secondaryMotionEnabled={project3D.secondaryMotionEnabled}
              lighting={project3D.lighting}
              cameraPreset={project3D.camera.preset}
              isTurntable={project3D.camera.turntable}
              isUvEditorOpen={isUvEditorOpen}
              isDesignerMode={isDesignerAuthorized ? isDesignerMode : false}
              isCuratedDesign={isCuratedDesign}
              onAnimatedToggle={() =>
                setProject3D((prev) => ({
                  ...prev,
                  isAnimated: !prev.isAnimated,
                  isPlaying: !prev.isAnimated,
                }))
              }
              onActionChange={(action) =>
                setProject3D((prev) => ({ ...prev, currentAction: action }))
              }
              onPlayToggle={() =>
                setProject3D((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
              }
              onSpeedChange={(speed) =>
                setProject3D((prev) => ({ ...prev, playbackSpeed: speed }))
              }
              onSecondaryMotionToggle={() =>
                setProject3D((prev) => ({
                  ...prev,
                  secondaryMotionEnabled: !prev.secondaryMotionEnabled,
                }))
              }
              onCameraPresetChange={(preset) =>
                setProject3D((prev) => ({
                  ...prev,
                  camera: { ...prev.camera, preset },
                }))
              }
              onTurntableToggle={() =>
                setProject3D((prev) => ({
                  ...prev,
                  camera: { ...prev.camera, turntable: !prev.camera.turntable },
                }))
              }
              onToggleUvEditor={() => setIsUvEditorOpen(!isUvEditorOpen)}
              onAddArtworkFromFile={handleAddArtworkFromFile3D}
              onSelectPanel={setSelectedPanelId3D}
              onSelectLayer={setSelectedLayerId3D}
              onUpdateLayer={handleUpdateLayer3D}
              onModelLoaded={(mesh) => setGarmentMesh3D(mesh)}
              onSceneReady={(sm, compositor) => {
                sceneManager3DRef.current = sm;
                compositor3DRef.current = compositor;
              }}
            />

            {/* 2D UV Placement Editor */}
            {isUvEditorOpen && (
              <UVCanvasEditor3D
                garmentConfig={currentGarmentConfig3D}
                artworkLayers={project3D.artworkLayers}
                activeRegionId={project3D.activeRegionId}
                selectedLayerId={selectedLayerId3D}
                selectedPanelId={selectedPanelId3D}
                garmentMesh={garmentMesh3D}
                diffuseImageUrl={currentGarmentConfig3D.textures.diffuse}
                onSelectPanel={setSelectedPanelId3D}
                onSelectLayer={setSelectedLayerId3D}
                onUpdateLayer={handleUpdateLayer3D}
                onRegionChange={(regionId) =>
                  setProject3D((prev) => ({ ...prev, activeRegionId: regionId }))
                }
                onAddArtwork={handleAddArtworkFromFile3D}
                onDuplicateLayer={handleDuplicateLayer3D}
                onDeleteLayer={handleDeleteLayer3D}
                onCenterHorizontal={handleCenterHorizontal3D}
                onCenterVertical={handleCenterVertical3D}
                isOpen={isMobile ? true : isUvEditorOpen}
                onToggleOpen={() => setIsUvEditorOpen(!isUvEditorOpen)}
                onClose={() => setIsUvEditorOpen(false)}
                isDesignerMode={isDesignerAuthorized ? isDesignerMode : false}
                isCuratedDesign={isCuratedDesign}
                onSavePlacement={isDesignerAuthorized ? handleSaveCurrentPlacement : undefined}
              />
            )}
          </>
      </div>


      {/* 3D & 2D Add to Cart & Mockup Review Modal */}
      <AddToCartModal3D
        isOpen={isAddToCartOpen}
        onClose={() => setIsAddToCartOpen(false)}
        garmentName={currentGarmentConfig3D.name}
        garmentColor={project3D.garmentColor}
        unitPrice={effectivePrice}
        basePrice={basePrice}
        initialSize={selectedGarmentSize}
        resolvePrice={getUnitPriceForSize}
        resolveBasePrice={(size) => getGarmentPriceForSize(project3D.garmentId, size)}
        customArtworkCount={activeCustomArtworkCount}
        customPrintFee={displayPrintFee}
        isCuratedDesign={isCuratedDesign}
        frontSnapshotUrl={cartFrontSnapshot}
        backSnapshotUrl={cartBackSnapshot}
        currentSnapshotUrl={cartCurrentSnapshot}
        leftSleeveSnapshotUrl={cartLeftSleeveSnapshot}
        rightSleeveSnapshotUrl={cartRightSleeveSnapshot}
        artworkLayers={project3D.artworkLayers}
        isGeneratingSnapshots={isCapturingCartSnapshots}
        onConfirmAddToCart={handleConfirmAddToCart}
      />

      {/* Instructional & Placement Warning Popup Modal */}
      {showInstructionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px',
            animation: 'fadeIn 0.25s ease-out',
            overflowY: 'auto',
          }}
          onClick={handleDismissInstructions}
          role="dialog"
          aria-modal="true"
          aria-labelledby="instruction-title"
        >
          <div
            style={{
              backgroundColor: '#111216',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '24px',
              padding: '28px 22px',
              maxWidth: '520px',
              width: 'min(94vw, 520px)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 30px rgba(59, 94, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative',
              color: '#ffffff',
              maxHeight: '90vh',
              overflowY: 'auto',
              fontFamily: 'inherit',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(59, 94, 255, 0.15)',
                  border: '1px solid rgba(59, 94, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3B5EFF',
                  flexShrink: 0,
                  fontSize: '22px',
                }}
              >
                ✦
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  id="instruction-title"
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    margin: 0,
                    color: '#ffffff',
                  }}
                >
                  {isCuratedDesign ? 'Curated Design 3D Preview' : '3D Placement & Studio Guide'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  {isCuratedDesign
                    ? 'Official design placement pre-calibrated on this garment'
                    : 'Your graphics have been placed onto the 3D apparel'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDismissInstructions}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  flexShrink: 0,
                }}
                aria-label="Close guide"
              >
                ✕
              </button>
            </div>

            {/* Reassuring Notice Callout Box */}
            <div
              style={{
                backgroundColor: 'rgba(59, 94, 255, 0.08)',
                border: '1px solid rgba(59, 94, 255, 0.25)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '12px',
                lineHeight: '1.5',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7B9EFF', fontWeight: 700, fontSize: '12px' }}>
                <span>ℹ</span>
                <span>{isCuratedDesign ? 'Official Artist-Calibrated Placement' : 'Placement Alignment Notice'}</span>
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)' }}>
                {isCuratedDesign ? (
                  <>
                    This design has been <strong>professionally calibrated and positioned</strong> by our design team for optimal drape and aesthetics. You can inspect all angles in 360° and check <strong>Front &amp; Back</strong> views. Placement, scale, and print are locked exactly as the artist saved them.
                  </>
                ) : (
                  <>
                    Automated artwork placement provides a calibrated starting position. Because garment draping, fits, and graphic dimensions vary, we recommend checking both <strong>Front &amp; Back</strong> views. You can freely drag, scale, and adjust your design directly in the 3D Studio!
                  </>
                )}
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '12px',
              }}
            >
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7B9EFF', fontWeight: 700 }}>
                {isCuratedDesign ? 'How to view this curated design:' : 'How to customize in 3D Studio:'}
              </span>

              {isCuratedDesign ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      1
                    </span>
                    <span>
                      <strong>Apply from the Library:</strong> Open <strong>Designs</strong> or <strong>Library</strong> and apply the complete saved set, or add individual artworks one at a time.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      2
                    </span>
                    <span>
                      <strong>Saved placement:</strong> Every graphic keeps the artist&apos;s saved side, position, scale, and print state. These are view-only for customers.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      3
                    </span>
                    <span>
                      <strong>Switch colours:</strong> Choose a garment colour and the matching black or white artwork variant is shown automatically.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      4
                    </span>
                    <span>
                      <strong>Inspect all angles:</strong> Tap <strong>Front</strong>, <strong>Back</strong>, or <strong>3/4</strong> on the top bar to inspect every view.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      5
                    </span>
                    <span>
                      <strong>360° Studio Orbit:</strong> Drag anywhere on the background to orbit around the apparel in full 3D.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      1
                    </span>
                    <span>
                      <strong>Select Graphic:</strong> Click or tap directly on any artwork on the 3D garment to activate its boundary handles.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      2
                    </span>
                    <span>
                      <strong>Move &amp; Reposition:</strong> Drag anywhere inside the graphic to position it across the chest, back, sleeves, or hem.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      3
                    </span>
                    <span>
                      <strong>Scale &amp; Resize:</strong> Drag any of the 4 corner handles to make your artwork larger or smaller.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      4
                    </span>
                    <span>
                      <strong>Rotate &amp; Straighten:</strong> Drag the circular top handle clockwise or counter-clockwise to rotate.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      5
                    </span>
                    <span>
                      <strong>Inspect All Angles:</strong> Tap <strong>Front</strong>, <strong>Back</strong>, or <strong>3/4</strong> on the top bar to inspect every view.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      6
                    </span>
                    <span>
                      <strong>360° Studio Orbit:</strong> Drag anywhere on the background to orbit around the apparel in full 3D.
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={handleDismissInstructions}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #3B5EFF 0%, #2645E0 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(59, 94, 255, 0.4)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(59, 94, 255, 0.55)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(59, 94, 255, 0.4)';
              }}
            >
              {isCuratedDesign ? 'EXPLORE IN 3D STUDIO' : 'GOT IT, START CUSTOMIZING IN 3D'}
            </button>
          </div>
        </div>
      )}
      {/* Design Setup & Placement Questions Dialog */}
      {isDesignSetupModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999998,
            padding: '16px',
            animation: 'fadeIn 0.25s ease-out',
            overflowY: 'auto',
          }}
          onClick={() => setIsDesignSetupModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="design-setup-title"
        >
          <div
            style={{
              backgroundColor: '#111216',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              padding: '28px 24px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative',
              color: '#ffffff',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(59, 94, 255, 0.15)',
                    border: '1px solid rgba(59, 94, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3B5EFF',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '20px' }}>✦</span>
                </div>
                <div>
                  <h3
                    id="design-setup-title"
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      margin: 0,
                      fontFamily: 'monospace',
                    }}
                  >
                    Customize Your Apparel
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                    {activeCuratedDesign ? activeCuratedDesign.name : 'Choose garment cut, color & placement'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDesignSetupModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                aria-label="Close setup modal"
              >
                <span style={{ fontSize: '16px' }}>✕</span>
              </button>
            </div>

            {/* Question 1: Garment Cut / Style */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#3B5EFF', fontSize: '13px' }}>👕</span>
                <span>1. Select Garment Cut</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                {[
                  { id: 'regular-t-shirt', name: 'Regular T-Shirt', tag: '240 GSM • ₹639' },
                  { id: 'oversized-t-shirt', name: 'Oversized Tee', tag: 'Drop Shoulder • ₹689' },
                  { id: 'acid-wash-t-shirt', name: 'Acid Wash Tee', tag: 'Mineral Wash • ₹699' },
                  { id: 'hoodie', name: 'Pullover Hoodie', tag: '380 GSM Fleece • ₹809' },
                ].map((item) => {
                  const isSelected = project3D.garmentId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleModalChangeGarment(item.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid #3B5EFF' : '1px solid rgba(255,255,255,0.08)',
                        background: isSelected ? 'rgba(59, 94, 255, 0.14)' : 'rgba(255,255,255,0.03)',
                        color: '#fff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'monospace' }}>{item.name}</span>
                        {isSelected && <span style={{ color: '#3B5EFF', fontSize: '13px' }}>✓</span>}
                      </div>
                      <span style={{ fontSize: '10px', color: isSelected ? '#a5b4fc' : 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                        {item.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 2: Fabric Color (Dynamically matched to selected garment cut) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <span style={{ color: '#10b981', fontSize: '13px' }}>●</span>
                  <span>2. Select Fabric Color</span>
                </label>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                  Available colors for this cut
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {getApprovedColorsForGarment(project3D.garmentId).map((c) => {
                  const isSelected = project3D.garmentColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => handleModalChangeColor(c.hex)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: isSelected ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.12)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: c.hex,
                          border: c.hex === '#ffffff' ? '1px solid #ccc' : '1px solid rgba(255,255,255,0.3)',
                          display: 'inline-block',
                        }}
                      />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Multi-Artwork Quick Place All Banner (if available) */}
            {activeCuratedDesign && activeCuratedDesign.artworks.length > 1 && (
              <button
                type="button"
                onClick={() => handleApplyAllArtworksFromDesign3D(activeCuratedDesign)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3B5EFF 0%, #10b981 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(59, 94, 255, 0.4)',
                  transition: 'filter 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1.0)')}
              >
                <span style={{ fontSize: '14px' }}>✦</span>
                <span>✨ Auto-Place All {activeCuratedDesign.artworks.length} Artworks (Front &amp; Back)</span>
              </button>
            )}

            {/* Question 3: Choose Which Artwork to Place */}
            {activeCuratedDesign && activeCuratedDesign.artworks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                    <span style={{ color: '#3B5EFF', fontSize: '13px' }}>⊞</span>
                    <span>3. Choose Artwork to Position ({activeCuratedDesign.artworks.length})</span>
                  </label>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    Click artwork to position
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: activeCuratedDesign.artworks.length > 2 ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
                    gap: '8px',
                  }}
                >
                  {activeCuratedDesign.artworks.map((art) => {
                    const isSelected = (modalSelectedArtId || activeCuratedDesign.artworks[0]?.id) === art.id;
                    const previewUrl = art.studioPreviewUrl || art.previewUrl;
                    const placedLayer = project3D.artworkLayers.find(
                      (l) => l.id.includes(art.id) || l.imageUrl === previewUrl || l.name.toLowerCase().includes(art.name.toLowerCase())
                    );
                    const currentPlacement = placedLayer?.placementTarget;
                    const placementLabel = currentPlacement
                      ? currentPlacement.replace(/-/g, ' ').toUpperCase()
                      : 'NOT PLACED';

                    const placementRegion = currentPlacement?.includes('back')
                      ? 'BACK'
                      : currentPlacement?.includes('sleeve')
                      ? 'SLEEVE'
                      : currentPlacement
                      ? 'FRONT'
                      : '';

                    return (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => handleModalSelectArtwork(art)}
                        style={{
                          padding: '10px 10px',
                          borderRadius: '12px',
                          border: isSelected ? '1.5px solid #3B5EFF' : '1px solid rgba(255,255,255,0.1)',
                          background: isSelected ? 'rgba(59, 94, 255, 0.16)' : 'rgba(255,255,255,0.03)',
                          color: '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          position: 'relative',
                          boxShadow: isSelected ? '0 0 14px rgba(59, 94, 255, 0.3)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img
                            src={previewUrl}
                            alt={art.name}
                            style={{
                              width: '36px',
                              height: '36px',
                              objectFit: 'contain',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(0,0,0,0.5)',
                              padding: '2px',
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {art.name}
                            </div>
                            <div style={{ fontSize: '9px', color: placedLayer ? '#10b981' : 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontWeight: 600 }}>
                              {placedLayer ? `✓ ${placementRegion} • ${placementLabel}` : '○ Tap to place'}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Question 4: Choose Apparel Region (Front / Back / Sleeve) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <span style={{ color: '#10b981', fontSize: '13px' }}>⤢</span>
                  <span>4. Choose Apparel Region</span>
                </label>
                <span style={{ fontSize: '10px', color: '#10b981', fontFamily: 'monospace', fontWeight: 700 }}>
                  ACTIVE: {modalSelectedRegion.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                {[
                  { id: 'front', label: '👕 FRONT', desc: 'Chest & Torso' },
                  { id: 'back', label: '🔄 BACK', desc: 'Collar & Back' },
                  { id: 'sleeve', label: '🦾 SLEEVE', desc: 'Arm & Shoulder' },
                ].map((r) => {
                  const isSelected = modalSelectedRegion === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleModalSelectRegion(r.id as 'front' | 'back' | 'sleeve')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                        color: isSelected ? '#a7f3d0' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 12px rgba(16, 185, 129, 0.3)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}>{r.label}</span>
                      <span style={{ fontSize: '9px', color: isSelected ? '#d1fae5' : 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 5: Granular Target Spot for the Chosen Region ONLY */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <span style={{ color: '#f59e0b', fontSize: '13px' }}>⊞</span>
                  <span>5. Target Spot on {modalSelectedRegion.toUpperCase()}</span>
                </label>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                  Only showing {modalSelectedRegion} locations
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    modalSelectedRegion === 'sleeve'
                      ? 'repeat(2, minmax(0, 1fr))'
                      : modalSelectedRegion === 'back'
                      ? 'repeat(4, minmax(0, 1fr))'
                      : 'repeat(3, minmax(0, 1fr))',
                  gap: '6px',
                }}
              >
                {(modalSelectedRegion === 'front'
                  ? [
                      { id: 'front-center', label: 'Front Center', tag: 'Standard' },
                      { id: 'left-chest', label: 'Left Chest', tag: 'Pocket/Heart' },
                      { id: 'right-chest', label: 'Right Chest', tag: 'Wearer Right' },
                      { id: 'full-front', label: 'Full Front', tag: 'Oversized' },
                      { id: 'bottom-hem', label: 'Bottom Hem', tag: 'Lower Waist' },
                    ]
                  : modalSelectedRegion === 'back'
                  ? [
                      { id: 'back-center', label: 'Back Center', tag: 'Center Back' },
                      { id: 'back-collar', label: 'Back Collar', tag: 'Neck Nape' },
                      { id: 'full-back', label: 'Full Back', tag: 'Oversized' },
                      { id: 'bottom-hem', label: 'Bottom Hem', tag: 'Lower Hem' },
                    ]
                  : [
                      { id: 'left-sleeve', label: 'Left Sleeve', tag: 'Bicep / Arm' },
                      { id: 'right-sleeve', label: 'Right Sleeve', tag: 'Bicep / Arm' },
                    ]
                ).map((spot) => {
                  const currentArt =
                    activeCuratedDesign?.artworks.find((a) => a.id === modalSelectedArtId) ||
                    activeCuratedDesign?.artworks[0];
                  const previewUrl = currentArt?.studioPreviewUrl || currentArt?.previewUrl;
                  const placedLayer = project3D.artworkLayers.find(
                    (l) => currentArt && (l.id.includes(currentArt.id) || l.imageUrl === previewUrl || l.name.toLowerCase().includes(currentArt.name.toLowerCase()))
                  );
                  const isSelected = (placedLayer?.placementTarget || 'front-center') === spot.id;

                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => handleModalPlaceArtwork(spot.id)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                        background: isSelected ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                        color: isSelected ? '#fcd34d' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'monospace' }}>{spot.label}</span>
                      <span style={{ fontSize: '9px', color: isSelected ? '#fef3c7' : 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{spot.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 6: Natural Language Placement Text Area */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '14px',
                borderRadius: '14px',
                backgroundColor: 'rgba(59, 94, 255, 0.08)',
                border: '1px solid rgba(59, 94, 255, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <span style={{ color: '#60a5fa', fontSize: '13px' }}>✦</span>
                  <span>6. Type Where to Place Artwork (AI Placement)</span>
                </label>
                <span style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                  Natural language input
                </span>
              </div>

              {/* Text Input Row with Place/Apply Button */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    value={modalNlpText}
                    onChange={(e) => setModalNlpText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyModalNlp();
                      }
                    }}
                    placeholder='e.g. "small left chest", "big back print", "back collar", "left sleeve"...'
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      padding: '10px 32px 10px 12px',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B5EFF')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
                  />
                  {modalNlpText && (
                    <button
                      type="button"
                      onClick={() => setModalNlpText('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                      }}
                      title="Clear text"
                    >
                      <span style={{ fontSize: '12px' }}>✕</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleApplyModalNlp}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#3B5EFF',
                    border: 'none',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0,
                    boxShadow: '0 2px 10px rgba(59, 94, 255, 0.4)',
                    transition: 'filter 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1.0)')}
                >
                  <span style={{ fontSize: '13px' }}>→</span>
                  <span>Place</span>
                </button>
              </div>

              {/* Status Feedback Notice */}
              {modalFeedbackMessage && (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '10.5px',
                    fontFamily: 'monospace',
                    color: '#6ee7b7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#10b981', flexShrink: 0, fontSize: '12px' }}>✓</span>
                  <span>{modalFeedbackMessage}</span>
                </div>
              )}

              {/* Quick Preset Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '2px' }}>
                <span style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>Quick:</span>
                {[
                  { label: 'Small Left Chest', prompt: 'small left chest' },
                  { label: 'Big Back Print', prompt: 'big full back' },
                  { label: 'Back Collar', prompt: 'back collar' },
                  { label: 'Left Sleeve', prompt: 'left sleeve' },
                  { label: 'Full Front', prompt: 'full front oversized' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setModalNlpText(item.prompt);
                      const parsed = parseNaturalLanguagePlacement(item.prompt);
                      handleModalPlaceArtwork(parsed.placement, parsed.scale);
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '9.5px',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.14)';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning & 3D Correction Instructions Box */}
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontFamily: 'monospace',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
                <span style={{ fontSize: '15px' }}>⚠</span>
                <span>Placement Notice &amp; 3D Studio Guide</span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.5', color: 'rgba(255, 255, 255, 0.85)' }}>
                Automated placement provides an initial alignment on the apparel. Because garment cuts (Regular, Oversized, Acid Wash, Hoodie) and artwork aspect ratios vary, <strong>placement will sometimes not be 100% proper</strong>. Make sure to inspect and adjust directly in the 3D Studio:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.75)', paddingLeft: '4px' }}>
                <div>• <strong>Click Graphic on 3D Shirt:</strong> Selects the graphic and shows the gizmo box</div>
                <div>• <strong>Drag to Move:</strong> Reposition freely across chest, back, hem, or sleeves</div>
                <div>• <strong>Corner Handles:</strong> Drag any corner handle to scale and resize</div>
                <div>• <strong>Top Handle:</strong> Drag circular ring to rotate and straighten</div>
                <div>• <strong>Camera Presets:</strong> Use Front, Back, and 3/4 View buttons to inspect all angles</div>
              </div>
            </div>

            {/* Confirm & Close Button */}
            <button
              type="button"
              onClick={() => setIsDesignSetupModalOpen(false)}
              style={{
                marginTop: '4px',
                width: '100%',
                padding: '14px 20px',
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'monospace',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e5e5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              <span style={{ fontSize: '16px' }}>✓</span>
              <span>APPLY &amp; START CUSTOMIZING IN 3D</span>
            </button>
          </div>
        </div>
      )}

      {/* Wall Studio Style Graphic Library Sidebar Drawer */}
      <ClothingDesignsDrawer
        isOpen={isDesignsLibraryOpen}
        onClose={() => setIsDesignsLibraryOpen(false)}
        onApplyDesign3D={handleApplyDesignFromLibrary3D}
        onApplyAllArtworks3D={handleApplyAllArtworksFromDesign3D}
      />
    </div>
  );
};

export default App;
