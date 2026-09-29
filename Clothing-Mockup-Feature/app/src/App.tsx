import React, { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ArtworkLayer,
  GarmentSide,
  ProjectState,
} from './types/mockup';
import { DEFAULT_TEMPLATE_ID, getTemplateById } from './data/catalog';
import { Header } from './components/Header';
import { SidebarTabs, type SidebarTab } from './components/SidebarTabs';
import { X } from 'lucide-react';
import { DrawerTemplates } from './components/DrawerTemplates';
import { DrawerArtwork } from './components/DrawerArtwork';
import { DrawerGarment } from './components/DrawerGarment';
import { DrawerFabric } from './components/DrawerFabric';
import { DrawerLighting } from './components/DrawerLighting';
import { DrawerProject } from './components/DrawerProject';
import { CanvasViewport } from './components/CanvasViewport';
import { ExportModal } from './components/ExportModal';
import { assetManager } from './engine/assetManager';
import { compositor } from './engine/compositor';
import { validateArtworkFile } from './engine/validation';
import { persistenceManager } from './engine/persistence';

// 3D Imports
import type {
  ArtworkLayer3D,
  Garment3DConfig,
  ProjectState3D,
} from './types/threeD';
import { getGarmentConfig } from './engine/3d/registry';
import { Viewport3D } from './components/3d/Viewport3D';
import { DrawerGarment3D } from './components/3d/DrawerGarment3D';
import { DrawerArtwork3D } from './components/3d/DrawerArtwork3D';
import { DrawerColor3D } from './components/3d/DrawerColor3D';
import { DrawerAnimation3D } from './components/3d/DrawerAnimation3D';
import { DrawerLighting3D } from './components/3d/DrawerLighting3D';
import { DrawerExport3D } from './components/3d/DrawerExport3D';
import { DrawerProject3D } from './components/3d/DrawerProject3D';
import { UVCanvasEditor3D } from './components/3d/UVCanvasEditor3D';
import type { SceneManager3D } from './engine/3d/sceneManager';
import type { TextureCompositor3D } from './engine/3d/textureCompositor';
import * as THREE from 'three';

export const App: React.FC = () => {
  // Mode: '2d' | '3d' (default to '3d' interactive mode)
  const [mode, setMode] = useState<'2d' | '3d'>('3d');

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

  const handleAddArtwork3D = (layer: ArtworkLayer3D) => {
    setProject3D((prev) => ({
      ...prev,
      artworkLayers: [...prev.artworkLayers, layer],
    }));
    setSelectedLayerId3D(layer.id);
  };

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
    const region = currentGarmentConfig3D.regions.find((r) => r.id === project3D.activeRegionId) || currentGarmentConfig3D.regions[0];
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
                      />
                    )}

                    {activeTab === 'color3d' && (
                      <DrawerColor3D
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
                  <>
                    {activeTab === 'templates' && (
                      <DrawerTemplates
                        currentTemplateId={project2D.templateId}
                        activeSide={project2D.activeSide}
                        onSelectTemplate={(id) => {
                          setProject2D((prev) => ({ ...prev, templateId: id }));
                          commitHistory2D();
                        }}
                        onSideChange={handleSideChange2D}
                      />
                    )}

                    {activeTab === 'artwork' && (
                      <DrawerArtwork
                        side={project2D.activeSide}
                        layers={currentLayers2D}
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
                      />
                    )}

                    {activeTab === 'garment' && (
                      <DrawerGarment
                        currentColor={project2D.garmentColor}
                        onColorChange={(color) => {
                          setProject2D((prev) => ({ ...prev, garmentColor: color }));
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
                  </>
                )}
              </div>
            </aside>
          );
        })()}

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
        )}
      </div>

      {/* 2D Export Modal with synchronized frozen lighting frame */}
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
    </div>
  );
};

export default App;
