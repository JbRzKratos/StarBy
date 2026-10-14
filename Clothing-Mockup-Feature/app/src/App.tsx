import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import type {
  ArtworkLayer,
  GarmentSide,
  ProjectState,
} from './types/mockup';
import { DEFAULT_TEMPLATE_ID, getTemplateById } from './data/catalog';
import { Header } from './components/Header';
import { SidebarTabs, type SidebarTab } from './components/SidebarTabs';
import { X, SlidersHorizontal, ChevronUp, Sparkles, Check, Shirt, Palette, Layers, CheckCircle2, AlertTriangle, Compass, ArrowRight } from 'lucide-react';
import { assetManager } from './engine/assetManager';
import { compositor } from './engine/compositor';
import { exportManager } from './engine/exportManager';
import { validateArtworkFile } from './engine/validation';
import { persistenceManager } from './engine/persistence';

// ── 2D components – lazy-loaded (only needed when user switches to 2D mode) ──
// The app defaults to '3d' so these never block the initial render.
const DrawerTemplates = lazy(() => import('./components/DrawerTemplates').then(m => ({ default: m.DrawerTemplates })));
const DrawerArtwork   = lazy(() => import('./components/DrawerArtwork').then(m => ({ default: m.DrawerArtwork })));
const DrawerGarment   = lazy(() => import('./components/DrawerGarment').then(m => ({ default: m.DrawerGarment })));
const DrawerFabric    = lazy(() => import('./components/DrawerFabric').then(m => ({ default: m.DrawerFabric })));
const DrawerLighting  = lazy(() => import('./components/DrawerLighting').then(m => ({ default: m.DrawerLighting })));
const DrawerProject   = lazy(() => import('./components/DrawerProject').then(m => ({ default: m.DrawerProject })));
const CanvasViewport  = lazy(() => import('./components/CanvasViewport').then(m => ({ default: m.CanvasViewport })));
const ExportModal     = lazy(() => import('./components/ExportModal').then(m => ({ default: m.ExportModal })));


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
  build2DLayerFromPlacement,
  get2DPlacementCoords,
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
import { AddToCartModal3D } from './components/3d/AddToCartModal3D';
import { Export3DManager } from './engine/3d/export3D';
import type { SceneManager3D } from './engine/3d/sceneManager';
import type { TextureCompositor3D } from './engine/3d/textureCompositor';
import { ClothingDesignsDrawer, type ApplyDesignEvent } from './components/ClothingDesignsDrawer';
import { CURATED_CLOTHING_DESIGNS, type CuratedClothingDesign } from './data/clothingDesignsData';
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

const GARMENT_TO_TEMPLATE_2D: Record<string, number> = {
  'regular-t-shirt': 24,
  'oversized-t-shirt': 18,
  'acid-wash-t-shirt': 22,
  'hoodie': 14,
};

const TEMPLATE_TO_GARMENT_3D: Record<number, string> = {
  14: 'hoodie',
  18: 'oversized-t-shirt',
  22: 'acid-wash-t-shirt',
  11: 'acid-wash-t-shirt',
  24: 'regular-t-shirt',
  36: 'regular-t-shirt',
  34: 'regular-t-shirt',
  32: 'regular-t-shirt',
  30: 'regular-t-shirt',
  28: 'regular-t-shirt',
};

export const App: React.FC = () => {
  // Mode: '2d' | '3d' (default to '3d' interactive mode)
  const [mode, setMode] = useState<'2d' | '3d'>('3d');
  const [isDesignsLibraryOpen, setIsDesignsLibraryOpen] = useState<boolean>(false);

  // =========================================================================
  // 2D PROJECT STATE
  // =========================================================================
  const [project2D, setProject2D] = useState<ProjectState>({
    templateId: DEFAULT_TEMPLATE_ID,
    activeSide: 'front',
    garmentColor: '#ffffff',
    warp: {
      enabled: true,
      strength: 2.0,
      blendFactor: 0.50,
    },
    background: {
      type: 'concrete1',
      color: '#222222',
    },
    lighting: {
      amount: 60,
      brightness: 3,
      contrast: 3,
      animated: true,
      frameIndex: 0,
    },
    front: {
      layers: [],
      selectedLayerId: null,
    },
    back: {
      layers: [],
      selectedLayerId: null,
    },
  });

  const activeLightingFrameRef = useRef(0);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddToCartOpen, setIsAddToCartOpen] = useState(false);
  const [isCapturingCartSnapshots, setIsCapturingCartSnapshots] = useState(false);
  const [cartFrontSnapshot, setCartFrontSnapshot] = useState<string | null>(null);
  const [cartBackSnapshot, setCartBackSnapshot] = useState<string | null>(null);
  const [export3DManager] = useState(() => new Export3DManager());
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);

  // 2D Viewport zoom & pan
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // 2D History stack for Undo / Redo
  const [history, setHistory] = useState<ProjectState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryActionRef = useRef(false);

  // =========================================================================
  // 3D PROJECT STATE
  // =========================================================================
  const [project3D, setProject3D] = useState<ProjectState3D>({
    version: 1,
    id: 'default-3d-project',
    name: 'Regular T-Shirt Mockup',
    updatedAt: new Date().toISOString(),
    garmentId: 'regular-t-shirt',
    garmentColor: '#ffffff',
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
  });

  const [selectedLayerId3D, setSelectedLayerId3D] = useState<string | null>(null);
  const [selectedPanelId3D, setSelectedPanelId3D] = useState<string | null>(null);
  // Responsive mobile detector (<= 768px)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  const [isUvEditorOpen, setIsUvEditorOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : false
  );
  const [garmentMesh3D, setGarmentMesh3D] = useState<THREE.Mesh | THREE.SkinnedMesh | null>(null);
  const sceneManager3DRef = useRef<SceneManager3D | null>(null);
  // Compositor ref — needed to pass to the high-res exporter
  const compositor3DRef = useRef<TextureCompositor3D | null>(null);

  // Active Sidebar Tab
  const [activeTab, setActiveTab] = useState<SidebarTab>('color3d');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState<boolean>(false);
  const [isDesignSetupModalOpen, setIsDesignSetupModalOpen] = useState<boolean>(false);
  const [activeCuratedDesign, setActiveCuratedDesign] = useState<CuratedClothingDesign | null>(null);
  const [initialDesignId, setInitialDesignId] = useState<string | null>(null);
  const initialPriceRef = useRef<number | null>(null);

  // Modal Placement State
  const [modalSelectedArtId, setModalSelectedArtId] = useState<string | null>(null);
  const [modalSelectedRegion, setModalSelectedRegion] = useState<'front' | 'back' | 'sleeve'>('front');
  const [modalNlpText, setModalNlpText] = useState<string>('');
  const [modalFeedbackMessage, setModalFeedbackMessage] = useState<string | null>(null);

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
      },
      fallbackIndex: number
    ): ArtworkLayer3D | null => {
      const url = input.previewUrl || input.imageUrl;
      if (!url) return null;

      const layerId = input.id || `fregor-art-${Date.now()}-${fallbackIndex}`;
      const layerName = input.name || `Artwork ${fallbackIndex + 1}`;
      const placementText = (input.placement || 'front-center').toString();
      const scaleText = (input.scalePreset || input.scale || 'standard').toString();

      return buildLayerFromPlacement(garmentId, {
        id: layerId,
        name: layerName,
        imageUrl: url,
        placementTextOrTarget: placementText,
        scalePresetOrText: scaleText,
      });
    },
    []
  );

  const handleModalChangeGarment = useCallback(
    (garmentId: string) => {
      const approvedColors = getApprovedColorsForGarment(garmentId);
      const templateId = GARMENT_TO_TEMPLATE_2D[garmentId] || 24;

      setProject3D((prev) => {
        const colorMatches = approvedColors.some(
          (c) => c.hex.toLowerCase() === prev.garmentColor.toLowerCase()
        );
        const newColor = colorMatches ? prev.garmentColor : approvedColors[0].hex;

        const updatedLayers = prev.artworkLayers.map((l, idx) => {
          return (
            computePlacementLayer(
              garmentId,
              {
                id: l.id,
                name: l.name,
                imageUrl: l.imageUrl,
                placement: l.placementTarget || 'front-center',
                scale: l.scalePreset || 'standard',
              },
              idx
            ) || l
          );
        });
        return {
          ...prev,
          garmentId,
          garmentColor: newColor,
          artworkLayers: updatedLayers,
        };
      });
      setProject2D((prev) => {
        const colorMatches = approvedColors.some(
          (c) => c.hex.toLowerCase() === prev.garmentColor.toLowerCase()
        );
        const newColor = colorMatches ? prev.garmentColor : approvedColors[0].hex;
        return {
          ...prev,
          templateId,
          garmentColor: newColor,
        };
      });
    },
    [computePlacementLayer]
  );

  const handleModalChangeColor = useCallback((hex: string) => {
    setProject3D((prev) => ({ ...prev, garmentColor: hex }));
    setProject2D((prev) => ({ ...prev, garmentColor: hex }));
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

      // Synchronize directly to 2D Project as well!
      if (currentArt) {
        const previewUrl = currentArt.studioPreviewUrl || currentArt.previewUrl;
        const { side: side2D, layer: newLayer2D } = build2DLayerFromPlacement({
          id: `fregor-2d-${currentArt.id}-${Date.now()}`,
          name: currentArt.name,
          imageUrl: previewUrl,
          placementTextOrTarget: targetPlacement,
          scalePresetOrText: finalScale,
        });

        setProject2D((prev) => {
          const cleanFront = prev.front.layers.filter(
            (l) => !l.id.includes(currentArt.id) && l.src !== previewUrl
          );
          const cleanBack = prev.back.layers.filter(
            (l) => !l.id.includes(currentArt.id) && l.src !== previewUrl
          );

          if (side2D === 'back') {
            return {
              ...prev,
              activeSide: 'back',
              back: {
                ...prev.back,
                layers: [...cleanBack, newLayer2D],
                selectedLayerId: newLayer2D.id,
              },
              front: {
                ...prev.front,
                layers: cleanFront,
              },
            };
          } else {
            return {
              ...prev,
              activeSide: 'front',
              front: {
                ...prev.front,
                layers: [...cleanFront, newLayer2D],
                selectedLayerId: newLayer2D.id,
              },
              back: {
                ...prev.back,
                layers: cleanBack,
              },
            };
          }
        });
      }

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
    }) => {
      if (!params.designId && !params.previewUrl && !params.garment && !params.layers) return;

      const curated = params.designId
        ? CURATED_CLOTHING_DESIGNS.find((d) => d.id === params.designId)
        : null;

      if (curated) {
        setActiveCuratedDesign(curated);
      }
      if (params.designId) setInitialDesignId(params.designId);
      if (params.price) initialPriceRef.current = parseFloat(params.price) || 999;

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
          const mapped = computePlacementLayer(targetGarmentId, item, idx);
          if (mapped) newLayers.push(mapped);
        });
      } else if (params.previewUrl) {
        const mapped = computePlacementLayer(
          targetGarmentId,
          {
            id: `fregor-design-${params.designId || Date.now()}`,
            name: params.designName || curated?.name || 'Selected Design',
            previewUrl: params.previewUrl,
            placement: params.placement || 'front-center',
            scale: params.scale,
            scalePreset: params.scalePreset,
          },
          0
        );
        if (mapped) newLayers.push(mapped);
      } else if (curated && curated.artworks.length > 0) {
        // Place ALL artworks in the curated design on their respective designated regions!
        const usedPlacements = new Set<string>();

        curated.artworks.forEach((art, idx) => {
          let placement = art.suggestedPlacement || (idx === 0 ? 'front-center' : 'back-center');
          if (usedPlacements.has(placement)) {
            if (placement === 'front-center') placement = 'left-chest';
            else if (placement === 'back-center') placement = 'back-collar';
            else placement = idx % 2 === 0 ? 'front-center' : 'back-center';
          }
          usedPlacements.add(placement);

          const mapped = computePlacementLayer(
            targetGarmentId,
            {
              id: `fregor-art-${curated.id}-${art.id}`,
              name: art.name || curated.name,
              previewUrl: art.studioPreviewUrl || art.previewUrl,
              placement: curated.artworks.length === 1 && params.placement ? params.placement : placement,
              scale: placement === 'left-chest' || placement === 'back-collar' ? 'compact' : 'standard',
            },
            idx
          );
          if (mapped) newLayers.push(mapped);
        });
      }

      setProject3D((prev) => {
        const finalLayers = newLayers.length > 0 ? newLayers : prev.artworkLayers;
        if (finalLayers.length > 0) {
          setSelectedLayerId3D(finalLayers[0].id);
        }

        const hasBackOnly =
          newLayers.length > 0 &&
          newLayers.every((l) => l.regionId === 'back') &&
          !newLayers.some((l) => l.regionId === 'front');

        const activeRegionId: 'front' | 'back' = hasBackOnly ? 'back' : 'front';
        const cameraPreset: 'front' | 'back' = hasBackOnly ? 'back' : 'front';

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

      // Also initialize 2D Editor state so switching to 2D displays all artworks!
      if (curated && curated.artworks.length > 0) {
        const front2D: ArtworkLayer[] = [];
        const back2D: ArtworkLayer[] = [];

        curated.artworks.forEach((art, idx) => {
          const isBack = (art.suggestedPlacement || '').includes('back');
          const artUrl = art.studioPreviewUrl || art.previewUrl;
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = artUrl;
          const isChest = art.suggestedPlacement === 'left-chest';
          const isCollar = art.suggestedPlacement === 'back-collar';
          const maxDim = isChest ? 320 : isCollar ? 280 : 600;
          const posX = isChest ? 830 : 1024;
          const posY = isChest ? 720 : isCollar ? 620 : isBack ? 880 : 920;

          const layer2D: ArtworkLayer = {
            id: `fregor-2d-${curated.id}-${art.id}-${idx}`,
            name: art.name,
            src: artUrl,
            image: img,
            x: posX,
            y: posY,
            width: maxDim,
            height: maxDim,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            opacity: 1,
            flipX: false,
            flipY: false,
            locked: false,
            visible: true,
            naturalWidth: 1000,
            naturalHeight: 1000,
            isOpaque: false,
          };

          img.onload = () => {
            if (img.naturalWidth && img.naturalHeight) {
              layer2D.naturalWidth = img.naturalWidth;
              layer2D.naturalHeight = img.naturalHeight;
              const aspect = img.naturalWidth / img.naturalHeight;
              if (aspect >= 1) {
                layer2D.width = maxDim;
                layer2D.height = Math.round(maxDim / aspect);
              } else {
                layer2D.height = maxDim;
                layer2D.width = Math.round(maxDim * aspect);
              }
            }
          };

          if (isBack) {
            back2D.push(layer2D);
          } else {
            front2D.push(layer2D);
          }
        });

        setProject2D((prev2D) => ({
          ...prev2D,
          garmentColor: targetColor,
          activeSide: front2D.length > 0 ? 'front' : 'back',
          front: {
            ...prev2D.front,
            layers: front2D.length > 0 ? front2D : prev2D.front.layers,
            selectedLayerId: front2D[0]?.id || null,
          },
          back: {
            ...prev2D.back,
            layers: back2D.length > 0 ? back2D : prev2D.back.layers,
            selectedLayerId: back2D[0]?.id || null,
          },
        }));
      } else {
        const primaryUrl = params.previewUrl;
        if (primaryUrl) {
          const isBack = (params.placement || '').includes('back');
          const targetSide: GarmentSide = isBack ? 'back' : 'front';
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = primaryUrl;
          const layer2D: ArtworkLayer = {
            id: `fregor-2d-${Date.now()}`,
            name: params.designName || 'Selected Design',
            src: primaryUrl,
            image: img,
            x: 1024,
            y: 920,
            width: 600,
            height: 600,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            opacity: 1,
            flipX: false,
            flipY: false,
            locked: false,
            visible: true,
            naturalWidth: 1000,
            naturalHeight: 1000,
            isOpaque: false,
          };
          img.onload = () => {
            if (img.naturalWidth && img.naturalHeight) {
              layer2D.naturalWidth = img.naturalWidth;
              layer2D.naturalHeight = img.naturalHeight;
              const aspect = img.naturalWidth / img.naturalHeight;
              if (aspect >= 1) {
                layer2D.width = 600;
                layer2D.height = Math.round(600 / aspect);
              } else {
                layer2D.height = 600;
                layer2D.width = Math.round(600 * aspect);
              }
            }
          };

          setProject2D((prev2D) => ({
            ...prev2D,
            garmentColor: targetColor,
            activeSide: targetSide,
            [targetSide]: {
              ...prev2D[targetSide],
              layers: [layer2D],
              selectedLayerId: layer2D.id,
            },
          }));
        }
      }

      // Artworks are directly loaded onto the 3D garment. Keep setup modal closed.
    };

    // 1. Read URL search params
    try {
      const sp = new URLSearchParams(window.location.search);
      const designId = sp.get('designId');
      const designName = sp.get('designName');
      const garment = sp.get('garment');
      const color = sp.get('color');
      const placement = sp.get('placement');
      const scale = sp.get('scale') || sp.get('scalePreset');
      const previewUrl = sp.get('previewUrl');
      const layers = sp.get('layers');
      const price = sp.get('price');

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
        });
      }
    } catch {
      /* ignore */
    }

    // 2. Listen for postMessage INIT_3D_DESIGN
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === 'INIT_3D_DESIGN') {
        applyInitParams(e.data.payload || {});
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
    if (tab === 'library' || tab === 'library3d') {
      setIsDesignsLibraryOpen(true);
      setMobileDrawerOpen(false);
      return;
    }
    if (tab === 'uv3d') {
      setIsUvEditorOpen(true);
      setMobileDrawerOpen(false);
    } else {
      if (mobileDrawerOpen && activeTab === tab) {
        setMobileDrawerOpen(false);
      } else {
        setActiveTab(tab);
        setMobileDrawerOpen(true);
      }
    }
  }, [mobileDrawerOpen, activeTab]);

  const getDrawerTitle = (tab: SidebarTab, currentMode: '2d' | '3d') => {
    if (currentMode === '3d') {
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
    } else {
      switch (tab) {
        case 'artwork': return 'Artwork Layers';
        case 'garment': return 'Garment Color';
        case 'templates': return 'Garment Catalog';
        case 'fabric': return 'Fabric Displacement Warp';
        case 'lighting': return 'Lighting & Background';
        case 'project': return 'Project Settings';
        default: return 'Customizer Settings';
      }
    }
  };

  // When switching modes, set appropriate default tab
  const handleModeChange = (newMode: '2d' | '3d') => {
    setMode(newMode);
    if (newMode === '3d') {
      setActiveTab('color3d');
    } else {
      setActiveTab('artwork');
    }
    setMobileDrawerOpen(false);
  };

  // Initialize 2D backgrounds
  useEffect(() => {
    compositor.initBackgrounds();
  }, []);

  // 2D History snapshot
  const commitHistory2D = useCallback(() => {
    if (isHistoryActionRef.current) return;
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, JSON.parse(JSON.stringify(project2D))];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [project2D, historyIndex]);

  useEffect(() => {
    if (history.length === 0) {
      setHistory([JSON.parse(JSON.stringify(project2D))]);
      setHistoryIndex(0);
    }
  }, []);

  const handleUndo2D = useCallback(() => {
    if (historyIndex > 0) {
      isHistoryActionRef.current = true;
      const targetState = history[historyIndex - 1];
      setProject2D(targetState);
      setHistoryIndex(historyIndex - 1);
      setTimeout(() => {
        isHistoryActionRef.current = false;
      }, 50);
    }
  }, [history, historyIndex]);

  const handleRedo2D = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isHistoryActionRef.current = true;
      const targetState = history[historyIndex + 1];
      setProject2D(targetState);
      setHistoryIndex(historyIndex + 1);
      setTimeout(() => {
        isHistoryActionRef.current = false;
      }, 50);
    }
  }, [history, historyIndex]);

  // 2D side switch handler
  const handleSideChange2D = (side: GarmentSide) => {
    setProject2D((prev) => ({ ...prev, activeSide: side }));
  };

  const activeSideState2D = project2D.activeSide === 'front' ? project2D.front : project2D.back;
  const currentLayers2D = activeSideState2D.layers;
  const selectedLayerId2D = activeSideState2D.selectedLayerId;

  const handleSelectLayer2D = (id: string | null) => {
    setProject2D((prev) => {
      const isFront = prev.activeSide === 'front';
      return {
        ...prev,
        [isFront ? 'front' : 'back']: {
          ...prev[isFront ? 'front' : 'back'],
          selectedLayerId: id,
        },
      };
    });
  };

  const handleUpdateLayer2D = (id: string, updates: Partial<ArtworkLayer>) => {
    setProject2D((prev) => {
      const isFront = prev.activeSide === 'front';
      const sideKey = isFront ? 'front' : 'back';
      const updatedLayers = prev[sideKey].layers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      );

      return {
        ...prev,
        [sideKey]: {
          ...prev[sideKey],
          layers: updatedLayers,
        },
      };
    });
  };

  const addArtworkLayer2D = (img: HTMLImageElement, name: string, src: string, isOpaque?: boolean) => {
    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;

    const maxDim = 650;
    const scale = Math.min(1.0, maxDim / Math.max(nw, nh));
    const width = nw * scale;
    const height = nh * scale;

    const newLayer: ArtworkLayer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: name.replace(/\.[^/.]+$/, ''),
      src,
      image: img,
      x: 1024,
      y: 920,
      width,
      height,
      scaleX: 1.0,
      scaleY: 1.0,
      rotation: 0,
      opacity: 1.0,
      flipX: false,
      flipY: false,
      locked: false,
      visible: true,
      naturalWidth: nw,
      naturalHeight: nh,
      isOpaque: !!isOpaque,
    };

    setProject2D((prev) => {
      const isFront = prev.activeSide === 'front';
      const sideKey = isFront ? 'front' : 'back';
      return {
        ...prev,
        [sideKey]: {
          layers: [...prev[sideKey].layers, newLayer],
          selectedLayerId: newLayer.id,
        },
      };
    });

    setTimeout(commitHistory2D, 50);
  };

  const handleUploadFile2D = async (file: File) => {
    setUploadWarning(null);
    const validation = await validateArtworkFile(file);
    if (!validation.valid) {
      setUploadWarning(validation.error || 'Invalid file');
      return;
    }
    if (validation.warning) {
      setUploadWarning(validation.warning);
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      try {
        const img = await assetManager.loadImage(dataUrl);
        addArtworkLayer2D(img, file.name, dataUrl, validation.isOpaque);
      } catch (err) {
        setUploadWarning('Failed to decode image file.');
      }
    };
    reader.readAsDataURL(file);
  };


  const handleDeleteLayer2D = (id: string) => {
    setProject2D((prev) => {
      const isFront = prev.activeSide === 'front';
      const sideKey = isFront ? 'front' : 'back';
      const remaining = prev[sideKey].layers.filter((l) => l.id !== id);
      return {
        ...prev,
        [sideKey]: {
          layers: remaining,
          selectedLayerId: remaining.length > 0 ? remaining[remaining.length - 1].id : null,
        },
      };
    });
    setTimeout(commitHistory2D, 50);
  };

  const handleDuplicateLayer2D = (id: string) => {
    const layer = currentLayers2D.find((l) => l.id === id);
    if (!layer) return;

    const dup: ArtworkLayer = {
      ...layer,
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: `${layer.name} (Copy)`,
      x: layer.x + 30,
      y: layer.y + 30,
    };

    setProject2D((prev) => {
      const isFront = prev.activeSide === 'front';
      const sideKey = isFront ? 'front' : 'back';
      return {
        ...prev,
        [sideKey]: {
          layers: [...prev[sideKey].layers, dup],
          selectedLayerId: dup.id,
        },
      };
    });
    setTimeout(commitHistory2D, 50);
  };

  const handleMoveLayerUp2D = (id: string) => {
    const idx = currentLayers2D.findIndex((l) => l.id === id);
    if (idx < 0 || idx >= currentLayers2D.length - 1) return;

    const nextLayers = [...currentLayers2D];
    const temp = nextLayers[idx];
    nextLayers[idx] = nextLayers[idx + 1];
    nextLayers[idx + 1] = temp;

    setProject2D((prev) => {
      const isFront = prev.activeSide === 'front';
      return {
        ...prev,
        [isFront ? 'front' : 'back']: {
          ...prev[isFront ? 'front' : 'back'],
          layers: nextLayers,
        },
      };
    });
    setTimeout(commitHistory2D, 50);
  };

  const handleMoveLayerDown2D = (id: string) => {
    const idx = currentLayers2D.findIndex((l) => l.id === id);
    if (idx <= 0) return;

    const nextLayers = [...currentLayers2D];
    const temp = nextLayers[idx];
    nextLayers[idx] = nextLayers[idx - 1];
    nextLayers[idx - 1] = temp;

    setProject2D((prev) => {
      const isFront = prev.activeSide === 'front';
      return {
        ...prev,
        [isFront ? 'front' : 'back']: {
          ...prev[isFront ? 'front' : 'back'],
          layers: nextLayers,
        },
      };
    });
    setTimeout(commitHistory2D, 50);
  };

  const handleCenterHorizontal2D = (id: string) => {
    handleUpdateLayer2D(id, { x: 1024 });
    setTimeout(commitHistory2D, 50);
  };

  const handleCenterVertical2D = (id: string) => {
    handleUpdateLayer2D(id, { y: 1024 });
    setTimeout(commitHistory2D, 50);
  };

  const handleApplyPlacement2D = useCallback(
    (
      layerId: string,
      placementTextOrTarget: string,
      scalePreset?: 'compact' | 'standard' | 'oversized'
    ) => {
      const parsed = parseNaturalLanguagePlacement(placementTextOrTarget);
      const finalPlacement = parsed.placement;
      const finalScale = scalePreset || parsed.scale || 'standard';

      setProject2D((prev) => {
        let targetLayer = prev.front.layers.find((l) => l.id === layerId);
        let fromSide: GarmentSide = 'front';
        if (!targetLayer) {
          targetLayer = prev.back.layers.find((l) => l.id === layerId);
          fromSide = 'back';
        }
        if (!targetLayer) return prev;

        const coords = get2DPlacementCoords(
          finalPlacement,
          finalScale,
          targetLayer.naturalWidth || 1000,
          targetLayer.naturalHeight || 1000
        );

        const updatedLayer: ArtworkLayer = {
          ...targetLayer,
          x: coords.x,
          y: coords.y,
          width: coords.width,
          height: coords.height,
          scaleX: 1.0,
          scaleY: 1.0,
        };

        const targetSide = coords.side;

        if (fromSide === targetSide) {
          return {
            ...prev,
            activeSide: targetSide,
            [targetSide]: {
              ...prev[targetSide],
              layers: prev[targetSide].layers.map((l) => (l.id === layerId ? updatedLayer : l)),
              selectedLayerId: layerId,
            },
          };
        } else {
          const filteredFrom = prev[fromSide].layers.filter((l) => l.id !== layerId);
          const newTargetLayers = [...prev[targetSide].layers, updatedLayer];
          return {
            ...prev,
            activeSide: targetSide,
            [fromSide]: {
              ...prev[fromSide],
              layers: filteredFrom,
              selectedLayerId: null,
            },
            [targetSide]: {
              ...prev[targetSide],
              layers: newTargetLayers,
              selectedLayerId: layerId,
            },
          };
        }
      });
      setTimeout(commitHistory2D, 50);
    },
    [commitHistory2D]
  );

  const handleMoveLayerToSide2D = useCallback(
    (layerId: string, targetSide: GarmentSide) => {
      setProject2D((prev) => {
        const fromSide: GarmentSide = targetSide === 'front' ? 'back' : 'front';
        const layer = prev[fromSide].layers.find((l) => l.id === layerId);
        if (!layer) return prev;

        const filteredFrom = prev[fromSide].layers.filter((l) => l.id !== layerId);
        const updatedLayer: ArtworkLayer = {
          ...layer,
          x: 1024,
          y: 920,
        };

        return {
          ...prev,
          activeSide: targetSide,
          [fromSide]: {
            ...prev[fromSide],
            layers: filteredFrom,
            selectedLayerId: null,
          },
          [targetSide]: {
            ...prev[targetSide],
            layers: [...prev[targetSide].layers, updatedLayer],
            selectedLayerId: layerId,
          },
        };
      });
      setTimeout(commitHistory2D, 50);
    },
    [commitHistory2D]
  );

  const handleSelectGarmentCut = useCallback(
    (newGarmentId: string, newTemplateId: number) => {
      const approvedColors = getApprovedColorsForGarment(newGarmentId);
      setProject3D((prev) => {
        const colorMatches = approvedColors.some(
          (c) => c.hex.toLowerCase() === prev.garmentColor.toLowerCase()
        );
        const newColor = colorMatches ? prev.garmentColor : approvedColors[0].hex;
        return {
          ...prev,
          garmentId: newGarmentId,
          garmentColor: newColor,
        };
      });
      setProject2D((prev) => {
        const colorMatches = approvedColors.some(
          (c) => c.hex.toLowerCase() === prev.garmentColor.toLowerCase()
        );
        const newColor = colorMatches ? prev.garmentColor : approvedColors[0].hex;
        return {
          ...prev,
          templateId: newTemplateId,
          garmentColor: newColor,
        };
      });
      setTimeout(commitHistory2D, 50);
    },
    [commitHistory2D]
  );

  // Keyboard shortcuts for 2D
  useEffect(() => {
    if (mode !== '2d') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerId2D) {
          e.preventDefault();
          handleDeleteLayer2D(selectedLayerId2D);
        }
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        handleUndo2D();
      } else if (
        (e.key === 'y' && (e.ctrlKey || e.metaKey)) ||
        (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)
      ) {
        e.preventDefault();
        handleRedo2D();
      } else if (e.key === 'Escape') {
        handleSelectLayer2D(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, selectedLayerId2D, handleUndo2D, handleRedo2D]);

  // =========================================================================
  // 3D HANDLERS
  // =========================================================================
  const currentGarmentConfig3D = getGarmentConfig(project3D.garmentId);

  const handleSelectGarment3D = (garment: Garment3DConfig) => {
    setProject3D((prev) => ({
      ...prev,
      garmentId: garment.id,
      name: `${garment.name} Mockup`,
      activeRegionId: garment.regions[0].id,
      camera: {
        ...prev.camera,
        preset: 'front',
      },
    }));
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

  const handleApplyDesignFromLibrary2D = useCallback(async (event: ApplyDesignEvent) => {
    const { artwork, targetSide, targetPlacement } = event;
    setProject2D((prev) => ({ ...prev, activeSide: targetSide }));

    const imgUrl = artwork.studioPreviewUrl || artwork.previewUrl;
    try {
      const img = await assetManager.loadImage(imgUrl);
      const nw = img.naturalWidth || img.width;
      const nh = img.naturalHeight || img.height;

      let posX = 1024;
      let posY = 920;
      let maxDim = 650;

      if (targetPlacement === 'left-chest') {
        posX = 830;
        posY = 720;
        maxDim = 320;
      } else if (targetPlacement === 'right-chest') {
        posX = 1218;
        posY = 720;
        maxDim = 320;
      } else if (targetPlacement === 'bottom-hem') {
        posX = 1024;
        posY = 1380;
        maxDim = 450;
      } else if (targetPlacement === 'back-center') {
        posX = 1024;
        posY = 880;
        maxDim = 650;
      } else if (targetPlacement === 'back-collar') {
        posX = 1024;
        posY = 620;
        maxDim = 280;
      }

      const scale = Math.min(1.0, maxDim / Math.max(nw, nh));
      const width = nw * scale;
      const height = nh * scale;

      const newLayer: ArtworkLayer = {
        id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: artwork.name,
        src: imgUrl,
        image: img,
        x: posX,
        y: posY,
        width,
        height,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        flipX: false,
        flipY: false,
        locked: false,
        visible: true,
        naturalWidth: nw,
        naturalHeight: nh,
        isOpaque: false,
      };

      setProject2D((prev) => ({
        ...prev,
        [targetSide]: {
          layers: [...prev[targetSide].layers, newLayer],
          selectedLayerId: newLayer.id,
        },
      }));

      setTimeout(commitHistory2D, 50);
    } catch (err) {
      console.error('[App] Failed to load library image in 2D:', err);
    }
  }, [commitHistory2D]);


  const handleApplyDesignFromLibrary3D = useCallback((event: ApplyDesignEvent) => {
    const { design, artwork, targetPlacement } = event;
    if (design) {
      setActiveCuratedDesign(design);
    }
    const imgUrl = artwork.studioPreviewUrl || artwork.previewUrl;
    const finalPlacement = targetPlacement || artwork.suggestedPlacement || 'front-center';

    const layer = buildLayerFromPlacement(project3D.garmentId, {
      id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: artwork.name,
      imageUrl: imgUrl,
      placementTextOrTarget: finalPlacement,
      scalePresetOrText: finalPlacement === 'left-chest' || finalPlacement === 'back-collar' ? 'compact' : 'standard',
    });

    const isBack = layer.regionId === 'back';

    setProject3D((prev) => {
      // Replace existing layer on the same side/region to prevent stacking in the same spot,
      // while keeping layers on the opposite side intact!
      const filtered = prev.artworkLayers.filter((l) => {
        if (isBack) {
          return !(l.regionId === 'back' || (l.placementTarget && l.placementTarget.includes('back')));
        } else {
          return !(l.regionId === 'front' && l.placementTarget === layer.placementTarget);
        }
      });

      return {
        ...prev,
        artworkLayers: [...filtered, layer],
        activeRegionId: layer.regionId || prev.activeRegionId,
        camera: {
          ...prev.camera,
          preset: isBack ? 'back' : 'front',
        },
      };
    });

    setSelectedLayerId3D(layer.id);
  }, [project3D.garmentId]);

  const handleApplyAllArtworksFromDesign3D = useCallback(
    (design: CuratedClothingDesign) => {
      setActiveCuratedDesign(design);

      let targetColor = project3D.garmentColor;
      const colorHint = design.artworks.find((a) => a.colorHint && a.colorHint !== 'any')?.colorHint;
      if (colorHint === 'black' && targetColor === '#ffffff') {
        targetColor = '#111216';
      } else if (colorHint === 'white' && (targetColor === '#111216' || targetColor === '#000000')) {
        targetColor = '#ffffff';
      }

      const newLayers: ArtworkLayer3D[] = [];
      let hasBack = false;
      let hasFront = false;
      const usedPlacements = new Set<string>();

      design.artworks.forEach((art, idx) => {
        let placement = art.suggestedPlacement || (idx === 0 ? 'front-center' : 'back-center');
        if (usedPlacements.has(placement)) {
          if (placement === 'front-center') placement = 'left-chest';
          else if (placement === 'back-center') placement = 'back-collar';
          else placement = idx % 2 === 0 ? 'front-center' : 'back-center';
        }
        usedPlacements.add(placement);

        const layer = computePlacementLayer(
          project3D.garmentId,
          {
            id: `layer-${design.id}-${art.id}-${Date.now()}-${idx}`,
            name: `${art.name} (${placement.includes('back') ? 'Back' : 'Front'})`,
            imageUrl: art.studioPreviewUrl || art.previewUrl,
            placement,
            scale: placement === 'left-chest' || placement === 'back-collar' ? 'compact' : 'standard',
          },
          idx
        );

        if (layer) {
          newLayers.push(layer);
          if (layer.regionId === 'back') hasBack = true;
          if (layer.regionId === 'front') hasFront = true;
        }
      });

      if (newLayers.length > 0) {
        const initialCamera: 'front' | 'back' = !hasFront && hasBack ? 'back' : 'front';
        const initialRegion: 'front' | 'back' = !hasFront && hasBack ? 'back' : 'front';

        setProject3D((prev) => ({
          ...prev,
          garmentColor: targetColor,
          artworkLayers: newLayers,
          activeRegionId: initialRegion,
          camera: {
            ...prev.camera,
            preset: initialCamera,
          },
        }));

        setSelectedLayerId3D(newLayers[0].id);
        setShowInstructionModal(true);
      }
    },
    [project3D.garmentId, project3D.garmentColor, computePlacementLayer]
  );

  const handleApplyAllArtworksFromDesign2D = useCallback(
    async (design: CuratedClothingDesign) => {
      setActiveCuratedDesign(design);

      let targetColor = project2D.garmentColor;
      const colorHint = design.artworks.find((a) => a.colorHint && a.colorHint !== 'any')?.colorHint;
      if (colorHint === 'black' && targetColor === '#ffffff') {
        targetColor = '#111216';
      } else if (colorHint === 'white' && (targetColor === '#111216' || targetColor === '#000000')) {
        targetColor = '#ffffff';
      }

      const frontLayers: ArtworkLayer[] = [];
      const backLayers: ArtworkLayer[] = [];

      for (let idx = 0; idx < design.artworks.length; idx++) {
        const art = design.artworks[idx];
        const isBack = (art.suggestedPlacement || '').includes('back');
        const imgUrl = art.studioPreviewUrl || art.previewUrl;
        try {
          const img = await assetManager.loadImage(imgUrl);
          const nw = img.naturalWidth || img.width;
          const nh = img.naturalHeight || img.height;
          let posX = 1024;
          let posY = isBack ? 880 : 920;
          let maxDim = 650;
          if (art.suggestedPlacement === 'left-chest') {
            posX = 830;
            posY = 720;
            maxDim = 320;
          } else if (art.suggestedPlacement === 'back-collar') {
            posX = 1024;
            posY = 620;
            maxDim = 280;
          }
          const scale = Math.min(1.0, maxDim / Math.max(nw, nh));
          const width = Math.round(nw * scale);
          const height = Math.round(nh * scale);

          const layer2D: ArtworkLayer = {
            id: `layer2d-${design.id}-${art.id}-${Date.now()}-${idx}`,
            name: art.name,
            src: imgUrl,
            image: img,
            x: posX,
            y: posY,
            width,
            height,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            opacity: 1,
            flipX: false,
            flipY: false,
            locked: false,
            visible: true,
            naturalWidth: nw,
            naturalHeight: nh,
            isOpaque: false,
          };

          if (isBack) {
            backLayers.push(layer2D);
          } else {
            frontLayers.push(layer2D);
          }
        } catch (err) {
          console.error('[App] Failed to load image for 2D:', err);
        }
      }

      setProject2D((prev) => ({
        ...prev,
        garmentColor: targetColor,
        activeSide: frontLayers.length > 0 ? 'front' : 'back',
        front: {
          ...prev.front,
          layers: frontLayers.length > 0 ? frontLayers : prev.front.layers,
          selectedLayerId: frontLayers[0]?.id || null,
        },
        back: {
          ...prev.back,
          layers: backLayers.length > 0 ? backLayers : prev.back.layers,
          selectedLayerId: backLayers[0]?.id || null,
        },
      }));

      setTimeout(commitHistory2D, 50);
    },
    [project2D.garmentColor, commitHistory2D]
  );

  // Auto-select latest artwork layer when added if none selected
  useEffect(() => {
    if (!selectedLayerId3D && project3D.artworkLayers.length > 0) {
      setSelectedLayerId3D(project3D.artworkLayers[project3D.artworkLayers.length - 1].id);
    }
  }, [project3D.artworkLayers.length]);

  const handleUpdateLayer3D = (id: string, updates: Partial<ArtworkLayer3D>) => {
    setProject3D((prev) => ({
      ...prev,
      artworkLayers: prev.artworkLayers.map((l) => {
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
        return merged;
      }),
    }));
  };

  const handleDuplicateLayer3D = (id: string) => {
    const layer = project3D.artworkLayers.find((l) => l.id === id);
    if (!layer) return;

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
    setProject3D((prev) => ({
      ...prev,
      artworkLayers: prev.artworkLayers.filter((l) => l.id !== id),
    }));
    if (selectedLayerId3D === id) {
      setSelectedLayerId3D(null);
    }
  };

  const handleCenterHorizontal3D = (id: string) => {
    handleUpdateLayer3D(id, { offsetX: 0 });
  };

  const handleCenterVertical3D = (id: string) => {
    handleUpdateLayer3D(id, { offsetY: 0 });
  };

  const handleAddArtworkFromFile3D = (file: File) => {
    const url = URL.createObjectURL(file);
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
      imageUrl: url,
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
  };

  const handleOpenAddToCart = async () => {
    setIsAddToCartOpen(true);
    setIsCapturingCartSnapshots(true);
    setCartFrontSnapshot(null);
    setCartBackSnapshot(null);

    try {
      if (mode === '3d' && sceneManager3DRef.current) {
        // High-resolution snap of both front and back views
        const frontData = await export3DManager.captureSnapshotDataUrl(
          sceneManager3DRef.current,
          {
            view: 'front',
            transparent: false,
            resolution: 'standard',
          },
          compositor3DRef.current ?? undefined
        );
        setCartFrontSnapshot(frontData);

        const backData = await export3DManager.captureSnapshotDataUrl(
          sceneManager3DRef.current,
          {
            view: 'back',
            transparent: false,
            resolution: 'standard',
          },
          compositor3DRef.current ?? undefined
        );
        setCartBackSnapshot(backData);
      } else {
        // 2D mode: render composite canvases for front and back
        const frontCanvas = await exportManager.renderSideCanvas(project2D, 'front', {
          scope: 'current',
          dimensions: '2048x2048',
          transparentBg: false,
          includeShadow: true,
        });
        setCartFrontSnapshot(frontCanvas.toDataURL('image/png'));

        const backCanvas = await exportManager.renderSideCanvas(project2D, 'back', {
          scope: 'current',
          dimensions: '2048x2048',
          transparentBg: false,
          includeShadow: true,
        });
        setCartBackSnapshot(backCanvas.toDataURL('image/png'));
      }
    } catch (err) {
      console.error('[App] Failed to capture cart mockups:', err);
    } finally {
      setIsCapturingCartSnapshots(false);
    }
  };

  const handleConfirmAddToCart = (data: {
    size: string;
    quantity: number;
    printInstructions: string;
  }) => {
    let frontDesignUrl: string | null = null;
    let backDesignUrl: string | null = null;
    const uploadedArtworks: { name: string; url: string; side: string }[] = [];

    if (mode === '3d') {
      project3D.artworkLayers.forEach((l) => {
        const isBack =
          l.regionId === 'back' ||
          l.regionId?.toLowerCase().includes('back') ||
          (l.u !== undefined && l.u >= 0.5);
        const side = isBack ? 'back' : 'front';
        uploadedArtworks.push({
          name: l.name || 'Artwork',
          url: l.imageUrl,
          side,
        });
        if (isBack && !backDesignUrl) {
          backDesignUrl = l.imageUrl;
        } else if (!isBack && !frontDesignUrl) {
          frontDesignUrl = l.imageUrl;
        }
      });

      if (!frontDesignUrl && project3D.artworkLayers.length > 0) {
        frontDesignUrl = project3D.artworkLayers[0].imageUrl;
      }
    } else {
      if (project2D.front.layers.length > 0) {
        frontDesignUrl = project2D.front.layers[0].src;
        project2D.front.layers.forEach((l) =>
          uploadedArtworks.push({ name: l.name, url: l.src, side: 'front' })
        );
      }
      if (project2D.back.layers.length > 0) {
        backDesignUrl = project2D.back.layers[0].src;
        project2D.back.layers.forEach((l) =>
          uploadedArtworks.push({ name: l.name, url: l.src, side: 'back' })
        );
      }
    }

    const primaryDesignFileUrl = frontDesignUrl || backDesignUrl || null;
    const garmentName = mode === '3d' ? currentGarmentConfig3D.name : activeTemplate2D.name;
    const garmentId = mode === '3d' ? project3D.garmentId : project2D.templateId;
    const garmentColor = mode === '3d' ? project3D.garmentColor : project2D.garmentColor;

    const payload = {
      garmentId,
      garmentName,
      garmentColor,
      size: data.size,
      quantity: data.quantity,
      price: initialPriceRef.current || 999,
      designId: initialDesignId || undefined,
      frontPreviewUrl: cartFrontSnapshot,
      backPreviewUrl: cartBackSnapshot,
      previewFileUrl: cartFrontSnapshot || cartBackSnapshot,
      frontDesignFileUrl: frontDesignUrl,
      backDesignFileUrl: backDesignUrl,
      designFileUrl: primaryDesignFileUrl,
      uploadedArtworks,
      printInstructions: data.printInstructions,
      customerNotes: data.printInstructions,
      mode,
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

  const activeTemplate2D = getTemplateById(project2D.templateId);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        mode={mode}
        onModeChange={handleModeChange}
        templateName={mode === '3d' ? currentGarmentConfig3D.name : activeTemplate2D.name}
        activeSide={project2D.activeSide}
        onSideChange={handleSideChange2D}
        frontLayerCount={project2D.front.layers.length}
        backLayerCount={project2D.back.layers.length}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo2D}
        onRedo={handleRedo2D}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(3.5, z * 1.15))}
        onZoomOut={() => setZoom((z) => Math.max(0.3, z * 0.85))}
        onZoomFit={() => {
          setZoom(1.0);
          setPan({ x: 0, y: 0 });
        }}
        onOpenExport={() => {
          if (mode === '3d') {
            setActiveTab('export3d');
            setMobileDrawerOpen(true);
          } else {
            setIsExportModalOpen(true);
          }
        }}
        onSaveProject={() => {
          if (mode === '2d') {
            persistenceManager.saveProjectToFile(project2D);
          } else {
            setActiveTab('project3d');
            setMobileDrawerOpen(true);
          }
        }}
        onLoadProject={() => {
          if (mode === '2d') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e: any) => {
              const file = e.target.files?.[0];
              if (file) {
                const text = await file.text();
                const loaded = await persistenceManager.loadProjectFromJson(text);
                setProject2D(loaded);
                commitHistory2D();
              }
            };
            input.click();
          } else {
            setActiveTab('project3d');
            setMobileDrawerOpen(true);
          }
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
      />

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
          mode={mode}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          layerCount={mode === '3d' ? project3D.artworkLayers.length : currentLayers2D.length}
        />

        {/* Dynamic Drawers */}
        {(() => {
          const shouldShowDrawer = isMobile ? (mobileDrawerOpen && activeTab !== 'uv3d') : (activeTab !== 'uv3d');
          if (!shouldShowDrawer) return null;

          return (
            <aside className={`drawer-panel ${mobileDrawerOpen ? 'mobile-sheet-open' : ''}`}>
              {/* Mobile Sheet Drag Handle and Header */}
              <div className="mobile-sheet-header">
                <div className="mobile-sheet-drag-handle" />
                <div className="mobile-sheet-title-bar">
                  <span className="mobile-sheet-title">{getDrawerTitle(activeTab, mode)}</span>
                  <button
                    type="button"
                    className="mobile-sheet-close-btn"
                    onClick={() => setMobileDrawerOpen(false)}
                    aria-label="Close settings drawer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="drawer-panel-scroll">
                {mode === '3d' ? (
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
                      />
                    )}

                    {activeTab === 'color3d' && (
                      <DrawerColor3D
                        garmentId={project3D.garmentId}
                        garmentColor={project3D.garmentColor}
                        onColorChange={(color) =>
                          setProject3D((prev) => ({ ...prev, garmentColor: color }))
                        }
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
                ) : (
                  <Suspense fallback={<div style={{height:'100%'}} />}>
                    {activeTab === 'templates' && (
                      <DrawerTemplates
                        currentTemplateId={project2D.templateId}
                        activeSide={project2D.activeSide}
                        onSelectTemplate={(id) => {
                          const mappedGarment = TEMPLATE_TO_GARMENT_3D[id] || 'regular-t-shirt';
                          handleSelectGarmentCut(mappedGarment, id);
                        }}
                        onSideChange={handleSideChange2D}
                      />
                    )}

                    {activeTab === 'artwork' && (
                      <DrawerArtwork
                        side={project2D.activeSide}
                        layers={currentLayers2D}
                        allLayers={{ front: project2D.front.layers, back: project2D.back.layers }}
                        selectedLayerId={selectedLayerId2D}
                        onSelectLayer={handleSelectLayer2D}
                        onUploadFile={handleUploadFile2D}
                        onUpdateLayer={handleUpdateLayer2D}
                        onDeleteLayer={handleDeleteLayer2D}
                        onDuplicateLayer={handleDuplicateLayer2D}
                        onMoveLayerUp={handleMoveLayerUp2D}
                        onMoveLayerDown={handleMoveLayerDown2D}
                        onCenterHorizontal={handleCenterHorizontal2D}
                        onCenterVertical={handleCenterVertical2D}
                        uploadWarning={uploadWarning}
                        onOpenLibrary={() => setIsDesignsLibraryOpen(true)}
                        onSideChange={handleSideChange2D}
                        onApplyPlacement={handleApplyPlacement2D}
                        onMoveLayerToSide={handleMoveLayerToSide2D}
                      />
                    )}

                    {activeTab === 'garment' && (
                      <DrawerGarment
                        currentColor={project2D.garmentColor}
                        garmentId={project3D.garmentId}
                        templateId={project2D.templateId}
                        onGarmentChange={handleSelectGarmentCut}
                        onColorChange={(color) => {
                          setProject2D((prev) => ({ ...prev, garmentColor: color }));
                          setProject3D((prev) => ({ ...prev, garmentColor: color }));
                        }}
                      />
                    )}

                    {activeTab === 'fabric' && (
                      <DrawerFabric
                        warp={project2D.warp}
                        onUpdateWarp={(updates) => {
                          setProject2D((prev) => ({
                            ...prev,
                            warp: { ...prev.warp, ...updates },
                          }));
                        }}
                      />
                    )}

                    {activeTab === 'lighting' && (
                      <DrawerLighting
                        background={project2D.background}
                        lighting={project2D.lighting}
                        onUpdateBackground={(updates) => {
                          setProject2D((prev) => ({
                            ...prev,
                            background: { ...prev.background, ...updates },
                          }));
                        }}
                        onUpdateLighting={(updates) => {
                          setProject2D((prev) => ({
                            ...prev,
                            lighting: { ...prev.lighting, ...updates },
                          }));
                        }}
                      />
                    )}

                    {activeTab === 'project' && (
                      <DrawerProject
                        onSaveProject={() => persistenceManager.saveProjectToFile(project2D)}
                        onLoadProjectFile={async (file) => {
                          const text = await file.text();
                          const loaded = await persistenceManager.loadProjectFromJson(text);
                          setProject2D(loaded);
                          commitHistory2D();
                        }}
                        onResetProject={() => {
                          setProject2D({
                            templateId: DEFAULT_TEMPLATE_ID,
                            activeSide: 'front',
                            garmentColor: '#ffffff',
                            warp: { enabled: true, strength: 2.0, blendFactor: 0.50 },
                            background: { type: 'concrete1', color: '#222222' },
                            lighting: { amount: 60, brightness: 3, contrast: 3, animated: true, frameIndex: 0 },
                            front: { layers: [], selectedLayerId: null },
                            back: { layers: [], selectedLayerId: null },
                          });
                          commitHistory2D();
                        }}
                      />
                    )}
                  </Suspense>
                )}
              </div>
            </aside>
          );
        })()}

        {/* Floating button to bring slide panel back when hidden */}
        {isMobile && !mobileDrawerOpen && activeTab !== 'uv3d' && (
          <button
            type="button"
            className="mobile-floating-reopen-btn"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open settings panel"
          >
            <ChevronUp size={15} className="reopen-chevron-icon" />
            <SlidersHorizontal size={14} />
            <span>Open {getDrawerTitle(activeTab, mode)}</span>
          </button>
        )}

        {/* Center Viewport and Right 2D UV Editor */}
        {mode === '3d' ? (
          <>
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
            {(!isMobile || isUvEditorOpen) && (
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
              />
            )}
          </>
        ) : (
          <Suspense fallback={<div style={{flex:1,background:'#1a1a2e'}} />}>
          <CanvasViewport
            templateId={project2D.templateId}
            activeSide={project2D.activeSide}
            onSideChange={handleSideChange2D}
            garmentColor={project2D.garmentColor}
            warp={project2D.warp}
            background={project2D.background}
            lighting={project2D.lighting}
            layers={currentLayers2D}
            selectedLayerId={selectedLayerId2D}
            onSelectLayer={handleSelectLayer2D}
            onUpdateLayer={handleUpdateLayer2D}
            onDeleteLayer={handleDeleteLayer2D}
            onDuplicateLayer={handleDuplicateLayer2D}
            onCenterHorizontal={handleCenterHorizontal2D}
            onCenterVertical={handleCenterVertical2D}
            zoom={zoom}
            setZoom={setZoom}
            pan={pan}
            setPan={setPan}
            onCommitHistory={commitHistory2D}
            onFrameTick={(f) => {
              activeLightingFrameRef.current = f;
            }}
            onUploadFile={handleUploadFile2D}
          />
          </Suspense>
        )}
      </div>

      {/* 2D Export Modal with synchronized frozen lighting frame */}
      {isExportModalOpen && (
        <Suspense fallback={null}>
          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            project={{
              ...project2D,
              lighting: {
                ...project2D.lighting,
                frameIndex: activeLightingFrameRef.current,
              },
            }}
          />
        </Suspense>
      )}

      {/* 3D & 2D Add to Cart & Mockup Review Modal */}
      <AddToCartModal3D
        isOpen={isAddToCartOpen}
        onClose={() => setIsAddToCartOpen(false)}
        garmentName={mode === '3d' ? currentGarmentConfig3D.name : activeTemplate2D.name}
        garmentColor={mode === '3d' ? project3D.garmentColor : project2D.garmentColor}
        frontSnapshotUrl={cartFrontSnapshot}
        backSnapshotUrl={cartBackSnapshot}
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
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px',
            animation: 'fadeIn 0.25s ease-out',
            overflowY: 'auto',
          }}
          onClick={() => setShowInstructionModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="instruction-title"
        >
          <div
            style={{
              backgroundColor: '#111216',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              padding: '32px 26px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative',
              color: '#ffffff',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={26} />
              </div>

              <div>
                <h3
                  id="instruction-title"
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    margin: 0,
                    fontFamily: 'monospace',
                  }}
                >
                  Artwork Placed &amp; 3D Guide
                </h3>
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                  Your graphics have been placed onto the 3D apparel
                </p>
              </div>
            </div>

            {/* Warning Callout Box */}
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontFamily: 'monospace',
                fontSize: '11px',
                lineHeight: '1.5',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontWeight: 700 }}>
                <span>⚠️</span>
                <span>Placement Notice</span>
              </div>
              <p style={{ margin: 0 }}>
                Automated artwork placement is an approximate starting position. Because garment cuts, draping, and graphic aspect ratios vary, <strong>automated placement will sometimes not be 100% proper</strong>. Please inspect both the Front &amp; Back and make any desired corrections directly in the 3D Studio!
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
                gap: '10px',
                fontFamily: 'monospace',
                fontSize: '11.5px',
              }}
            >
              <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3B5EFF', fontWeight: 700 }}>
                How to make corrections in 3D Studio:
              </span>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                  1
                </span>
                <span>
                  <strong>Select Graphic:</strong> Click directly on any artwork on the 3D t-shirt to activate its gizmo bounding box.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                  2
                </span>
                <span>
                  <strong>Move / Drag:</strong> Click and drag anywhere inside the graphic to slide it across the chest, back, hem, or sleeves.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                  3
                </span>
                <span>
                  <strong>Scale / Resize:</strong> Drag any of the 4 corner handles to scale the artwork up or down smoothly.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                  4
                </span>
                <span>
                  <strong>Rotate / Straighten:</strong> Drag the top circular handle clockwise or counter-clockwise to rotate.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                  5
                </span>
                <span>
                  <strong>Switch Views:</strong> Use the camera buttons at the top (<strong>Front / Back / 3/4 View</strong>) to inspect every angle.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ background: '#3B5EFF', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                  6
                </span>
                <span>
                  <strong>UV Precision Editor:</strong> Click <strong>UV Editor</strong> on the top bar to adjust millimeters on the flat fabric pattern.
                </span>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setShowInstructionModal(false)}
              style={{
                width: '100%',
                padding: '14px 24px',
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '14px',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontFamily: 'monospace',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e5e5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              GOT IT, START CUSTOMIZING IN 3D
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
                  <Sparkles size={22} />
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
                <X size={16} />
              </button>
            </div>

            {/* Question 1: Garment Cut / Style */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shirt size={13} style={{ color: '#3B5EFF' }} />
                <span>1. Select Garment Cut</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                {[
                  { id: 'regular-t-shirt', name: 'Regular T-Shirt', tag: '240 GSM • ₹999' },
                  { id: 'oversized-t-shirt', name: 'Oversized Tee', tag: 'Drop Shoulder • ₹1,099' },
                  { id: 'acid-wash-t-shirt', name: 'Acid Wash Tee', tag: 'Mineral Wash • ₹1,199' },
                  { id: 'hoodie', name: 'Pullover Hoodie', tag: '380 GSM Fleece • ₹1,499' },
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
                        {isSelected && <Check size={14} style={{ color: '#3B5EFF' }} />}
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
                  <Palette size={13} style={{ color: '#10b981' }} />
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
                <Sparkles size={14} />
                <span>✨ Auto-Place All {activeCuratedDesign.artworks.length} Artworks (Front &amp; Back)</span>
              </button>
            )}

            {/* Question 3: Choose Which Artwork to Place */}
            {activeCuratedDesign && activeCuratedDesign.artworks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                    <Layers size={13} style={{ color: '#3B5EFF' }} />
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
                  <Compass size={13} style={{ color: '#10b981' }} />
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
                  <Layers size={13} style={{ color: '#f59e0b' }} />
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
                  <Sparkles size={13} style={{ color: '#60a5fa' }} />
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
                      <X size={12} />
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
                  <ArrowRight size={13} />
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
                  <Check size={12} style={{ color: '#10b981', flexShrink: 0 }} />
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
                <AlertTriangle size={15} />
                <span>⚠️ Placement Notice &amp; 3D Studio Guide</span>
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
              <CheckCircle2 size={16} />
              <span>APPLY &amp; START CUSTOMIZING IN 3D</span>
            </button>
          </div>
        </div>
      )}

      {/* Wall Studio Style Graphic Library Sidebar Drawer */}
      <ClothingDesignsDrawer
        isOpen={isDesignsLibraryOpen}
        onClose={() => setIsDesignsLibraryOpen(false)}
        mode={mode}
        onApplyDesign2D={handleApplyDesignFromLibrary2D}
        onApplyDesign3D={handleApplyDesignFromLibrary3D}
        onApplyAllArtworks2D={handleApplyAllArtworksFromDesign2D}
        onApplyAllArtworks3D={handleApplyAllArtworksFromDesign3D}
      />
    </div>
  );
};

export default App;
