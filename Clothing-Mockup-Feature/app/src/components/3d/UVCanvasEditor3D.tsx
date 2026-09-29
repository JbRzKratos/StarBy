import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid,
  Layers,
  Eye,
  EyeOff,
  Move,
  Trash2,
  Copy,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Lock,
  Unlock,
  Tag,
  ArrowLeft,
  Upload,
} from 'lucide-react';
import * as THREE from 'three';
import type { ArtworkLayer3D, Garment3DConfig } from '../../types/threeD';
import {
  getGarmentPanels,
  findPanelAtUV,
  type GarmentPanel3D,
} from '../../engine/3d/garmentPanels';

interface UVCanvasEditor3DProps {
  garmentConfig: Garment3DConfig;
  artworkLayers: ArtworkLayer3D[];
  activeRegionId: string;
  selectedLayerId: string | null;
  garmentMesh: THREE.Mesh | THREE.SkinnedMesh | null;
  diffuseImageUrl?: string;
  selectedPanelId?: string | null;
  onSelectPanel?: (panelId: string | null) => void;
  onSelectLayer: (layerId: string | null) => void;
  onUpdateLayer: (layerId: string, updates: Partial<ArtworkLayer3D>) => void;
  onRegionChange: (regionId: string) => void;
  onAddArtwork?: (file: File) => void;
  onDuplicateLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onCenterHorizontal: (layerId: string) => void;
  onCenterVertical: (layerId: string) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onClose?: () => void;
}

type InteractionMode = 'none' | 'pan' | 'drag-art' | 'scale-art' | 'rotate-art';

export const UVCanvasEditor3D: React.FC<UVCanvasEditor3DProps> = ({
  garmentConfig,
  artworkLayers,
  activeRegionId,
  selectedLayerId,
  garmentMesh,
  diffuseImageUrl,
  selectedPanelId,
  onSelectPanel,
  onSelectLayer,
  onUpdateLayer,
  onRegionChange,
  onAddArtwork,
  onDuplicateLayer,
  onDeleteLayer,
  onCenterHorizontal: _onCenterHorizontal,
  onCenterVertical: _onCenterVertical,
  isOpen = true,
  onToggleOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic verified panels for the current active garment model
  const panels: GarmentPanel3D[] = useMemo(
    () => getGarmentPanels(garmentConfig.id),
    [garmentConfig.id]
  );

  // Zoom and Pan in UV canvas
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Display toggles
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const [showChecker, setShowChecker] = useState<boolean>(false);
  const [showDiffuse, setShowDiffuse] = useState<boolean>(true);
  const [showRegionGuides] = useState<boolean>(true);
  const [showPanelLabels, setShowPanelLabels] = useState<boolean>(true);

  // Active view: 'atlas' (full 0..1 UV layout) or specific region id
  const [activeView, setActiveView] = useState<string>('atlas');

  // Pre-rasterized assets for high-performance blitting
  const wireframeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const checkerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const diffuseImageRef = useRef<HTMLImageElement | null>(null);
  const artworkImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Interaction tracking refs
  const interactionModeRef = useRef<InteractionMode>('none');
  const interactionStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    artU: number;
    artV: number;
    artOffsetX: number;
    artOffsetY: number;
    artScale: number;
    artRot: number;
    initialDistance: number;
    initialAngle: number;
    scaleHandle: string;
    panStartX: number;
    panStartY: number;
  }>({
    pointerX: 0,
    pointerY: 0,
    artU: 0.5,
    artV: 0.5,
    artOffsetX: 0,
    artOffsetY: 0,
    artScale: 1,
    artRot: 0,
    initialDistance: 1,
    initialAngle: 0,
    scaleHandle: '',
    panStartX: 0,
    panStartY: 0,
  });

  const selectedLayer = useMemo(
    () => artworkLayers.find((l) => l.id === selectedLayerId) || null,
    [artworkLayers, selectedLayerId]
  );

  const activeRegion = useMemo(
    () =>
      garmentConfig.regions.find((r) => r.id === activeRegionId) ||
      garmentConfig.regions[0] || {
        id: 'default',
        name: 'Print Region',
        uvCenter: [0.5, 0.5] as [number, number],
        uvSpan: [0.5, 0.5] as [number, number],
      },
    [garmentConfig, activeRegionId]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Generate Labeled UV Checker Canvas (once)
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const divisions = 8;
    const size = 1024 / divisions;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    for (let row = 0; row < divisions; row++) {
      for (let col = 0; col < divisions; col++) {
        const isDark = (row + col) % 2 === 0;
        ctx.fillStyle = isDark ? '#1a2234' : '#27334d';
        ctx.fillRect(col * size, row * size, size, size);

        ctx.strokeStyle = '#3b4b6b';
        ctx.lineWidth = 1;
        ctx.strokeRect(col * size, row * size, size, size);

        ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `${letters[row]}${col + 1}`,
          col * size + size / 2,
          row * size + size / 2
        );
      }
    }

    checkerCanvasRef.current = canvas;
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Pre-rasterize Real Model UV Wireframe (once per loaded mesh)
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!garmentMesh || !garmentMesh.geometry) {
      wireframeCanvasRef.current = null;
      return;
    }

    const geometry = garmentMesh.geometry;
    const uvAttr = geometry.getAttribute('uv') as THREE.BufferAttribute | undefined;
    const indexAttr = geometry.getIndex();

    if (!uvAttr || uvAttr.count === 0) {
      wireframeCanvasRef.current = null;
      return;
    }

    const wfCanvas = document.createElement('canvas');
    const res = 2048;
    wfCanvas.width = res;
    wfCanvas.height = res;
    const wfCtx = wfCanvas.getContext('2d');
    if (!wfCtx) return;

    wfCtx.clearRect(0, 0, res, res);
    wfCtx.strokeStyle = 'rgba(99, 102, 241, 0.40)';
    wfCtx.lineWidth = 0.85;

    const count = indexAttr ? indexAttr.count : uvAttr.count;

    wfCtx.beginPath();
    for (let i = 0; i < count; i += 3) {
      const idx0 = indexAttr ? indexAttr.getX(i) : i;
      const idx1 = indexAttr ? indexAttr.getX(i + 1) : i + 1;
      const idx2 = indexAttr ? indexAttr.getX(i + 2) : i + 2;

      const u0 = uvAttr.getX(idx0) * res;
      const v0 = uvAttr.getY(idx0) * res;
      const u1 = uvAttr.getX(idx1) * res;
      const v1 = uvAttr.getY(idx1) * res;
      const u2 = uvAttr.getX(idx2) * res;
      const v2 = uvAttr.getY(idx2) * res;

      wfCtx.moveTo(u0, v0);
      wfCtx.lineTo(u1, v1);
      wfCtx.lineTo(u2, v2);
      wfCtx.lineTo(u0, v0);
    }
    wfCtx.stroke();

    wireframeCanvasRef.current = wfCanvas;
    renderCanvas();
  }, [garmentMesh]);

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Load Diffuse Underlay Texture
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const url = diffuseImageUrl || garmentConfig.textures.diffuse;
    if (!url) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      diffuseImageRef.current = img;
      renderCanvas();
    };
    img.src = url;
  }, [diffuseImageUrl, garmentConfig.textures.diffuse]);

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Preload Artwork Images
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    artworkLayers.forEach((layer) => {
      if (!artworkImagesRef.current.has(layer.imageUrl)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          artworkImagesRef.current.set(layer.imageUrl, img);
          renderCanvas();
        };
        img.src = layer.imageUrl;
      }
    });
  }, [artworkLayers]);

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Coordinate Transforms
  // ───────────────────────────────────────────────────────────────────────────
  const getTransform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { left: 0, top: 0, size: 400 };

    const w = canvas.width;
    const h = canvas.height;
    const baseSize = Math.min(w, h) * 0.92;
    const size = baseSize * zoom;

    const left = (w - size) / 2 + pan.x;
    const top = (h - size) / 2 + pan.y;

    return { left, top, size };
  }, [zoom, pan]);

  const _screenToUV = useCallback(
    (sx: number, sy: number): [number, number] => {
      const { left, top, size } = getTransform();
      const u = (sx - left) / size;
      const v = (sy - top) / size;
      return [u, v];
    },
    [getTransform]
  );
  void _screenToUV;

  const uvToScreen = useCallback(
    (u: number, v: number): [number, number] => {
      const { left, top, size } = getTransform();
      const sx = left + u * size;
      const sy = top + v * size;
      return [sx, sy];
    },
    [getTransform]
  );

  // Calculate artwork screen bounds
  const getArtworkScreenBounds = useCallback(
    (layer: ArtworkLayer3D) => {
      const mode = layer.placementMode || 'atlas';
      const img = artworkImagesRef.current.get(layer.imageUrl);
      const imgAspect = img && img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1;
      const { size } = getTransform();

      let u: number;
      let v: number;
      let uvW: number;
      let uvH: number;

      if (mode === 'atlas') {
        u = layer.u !== undefined ? layer.u : 0.5 + layer.offsetX * 0.5;
        v = layer.v !== undefined ? layer.v : 0.5 + layer.offsetY * 0.5;
        const baseSpan = 0.35 * layer.scale;
        if (layer.uvWidth !== undefined && layer.uvHeight !== undefined && !layer.lockAspectRatio) {
          uvW = layer.uvWidth;
          uvH = layer.uvHeight;
        } else if (layer.uvWidth !== undefined) {
          uvW = layer.uvWidth;
          uvH = uvW / imgAspect;
        } else {
          uvW = baseSpan;
          uvH = baseSpan / imgAspect;
        }
      } else if (mode === 'surface') {
        // In surface mode, the graphic crosses front torso and right sleeve!
        u = 0.38;
        v = 0.72;
        uvW = 0.48 * layer.scale;
        uvH = uvW / imgAspect;
      } else {
        const region =
          garmentConfig.regions.find((r) => r.id === layer.regionId) || activeRegion;
        u = region.uvCenter[0] + layer.offsetX * region.uvSpan[0] * 0.5;
        v = region.uvCenter[1] + layer.offsetY * region.uvSpan[1] * 0.5;
        const spanW = region.uvSpan[0];
        const spanH = region.uvSpan[1];
        if (imgAspect >= spanW / spanH) {
          uvW = spanW * layer.scale;
          uvH = uvW / imgAspect;
        } else {
          uvH = spanH * layer.scale;
          uvW = uvH * imgAspect;
        }
      }

      const [screenCenterX, screenCenterY] = uvToScreen(u, v);
      const drawW = uvW * size;
      const drawH = uvH * size;

      return {
        centerX: screenCenterX,
        centerY: screenCenterY,
        width: drawW,
        height: drawH,
        rotation: layer.rotation,
        uvWidth: uvW,
        uvHeight: uvH,
        u,
        v,
      };
    },
    [garmentConfig.regions, activeRegion, uvToScreen, getTransform]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Main Canvas Render Loop
  // ───────────────────────────────────────────────────────────────────────────
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const { left, top, size } = getTransform();

    // ── 6a. Transparent Checkerboard Pattern ─────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, size, size);
    ctx.clip();

    const checkerTileSize = 16;
    const cols = Math.ceil(size / checkerTileSize);
    const rows = Math.ceil(size / checkerTileSize);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#11141e' : '#191f2e';
        ctx.fillRect(
          left + c * checkerTileSize,
          top + r * checkerTileSize,
          checkerTileSize,
          checkerTileSize
        );
      }
    }

    // ── 6b. Diffuse Fabric & Seams Underlay ──────────────────────────────────
    if (showDiffuse && diffuseImageRef.current) {
      ctx.globalAlpha = 0.58;
      ctx.drawImage(diffuseImageRef.current, left, top, size, size);
      ctx.globalAlpha = 1.0;
    }

    // ── 6c. UV Checker Grid (if toggled) ────────────────────────────────────
    if (showChecker && checkerCanvasRef.current) {
      ctx.globalAlpha = 0.70;
      ctx.drawImage(checkerCanvasRef.current, left, top, size, size);
      ctx.globalAlpha = 1.0;
    }

    // ── 6d. Real Model UV Wireframe (if toggled) ────────────────────────────
    if (showWireframe && wireframeCanvasRef.current) {
      ctx.drawImage(wireframeCanvasRef.current, left, top, size, size);
    }

    // ── 6e. Verified Garment Panel Badges & Selection Highlights ───────────
    if (showPanelLabels) {
      panels.forEach((panel) => {
        const [px, py] = uvToScreen(panel.u, panel.v);
        const [rx, ry] = uvToScreen(panel.minU, panel.minV);
        const pw = (panel.maxU - panel.minU) * size;
        const ph = (panel.maxV - panel.minV) * size;
        const isSelected = selectedPanelId === panel.id;

        // Subtle island border or prominent active glow
        if (isSelected) {
          ctx.fillStyle = `${panel.color}20`;
          ctx.fillRect(rx, ry, pw, ph);
          ctx.strokeStyle = panel.color;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 6]);
          ctx.strokeRect(rx, ry, pw, ph);
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = `${panel.color}50`;
          ctx.lineWidth = 1;
          ctx.strokeRect(rx, ry, pw, ph);
        }

        // Panel tag pill
        ctx.font = isSelected ? '700 11px Inter, sans-serif' : '600 11px Inter, sans-serif';
        const textMetrics = ctx.measureText(panel.name);
        const badgeW = textMetrics.width + 16;
        const badgeH = 22;

        // Keep badge inside the atlas view boundary
        const badgeX = Math.max(left + badgeW / 2 + 2, Math.min(left + size - badgeW / 2 - 2, px));
        const badgeY = Math.max(top + badgeH / 2 + 2, Math.min(top + size - badgeH / 2 - 2, py));

        ctx.fillStyle = isSelected ? panel.color : 'rgba(10, 14, 22, 0.88)';
        ctx.strokeStyle = panel.color;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#000000' : panel.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(panel.name, badgeX, badgeY);
      });
    }

    // ── 6f. Printable Region Guides (Optional) ──────────────────────────────
    if (showRegionGuides) {
      garmentConfig.regions.forEach((region) => {
        const isActive = region.id === activeRegionId;
        const [rx, ry] = uvToScreen(
          region.uvCenter[0] - region.uvSpan[0] / 2,
          region.uvCenter[1] - region.uvSpan[1] / 2
        );
        const rw = region.uvSpan[0] * size;
        const rh = region.uvSpan[1] * size;

        ctx.fillStyle = isActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(rx, ry, rw, rh);

        ctx.strokeStyle = isActive ? '#3B5EFF' : '#475569';
        ctx.lineWidth = isActive ? 1.5 : 1.0;
        ctx.setLineDash(isActive ? [6, 4] : [4, 4]);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.setLineDash([]);
      });
    }

    // ── 6g. Artwork Layers ──────────────────────────────────────────────────
    artworkLayers.forEach((layer) => {
      const img = artworkImagesRef.current.get(layer.imageUrl);
      if (!img || !img.complete) return;

      const bounds = getArtworkScreenBounds(layer);
      const isSelected = layer.id === selectedLayerId;

      ctx.save();
      ctx.translate(bounds.centerX, bounds.centerY);
      ctx.rotate((bounds.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity));

      const flipX = layer.flipHorizontal ? -1 : 1;
      const flipY = layer.flipVertical ? -1 : 1;
      ctx.scale(flipX, flipY);

      ctx.drawImage(
        img,
        -bounds.width / 2,
        -bounds.height / 2,
        bounds.width,
        bounds.height
      );

      ctx.restore();

      // Bounding box for selected layer
      if (isSelected) {
        ctx.save();
        ctx.translate(bounds.centerX, bounds.centerY);
        ctx.rotate((bounds.rotation * Math.PI) / 180);

        const halfW = bounds.width / 2;
        const halfH = bounds.height / 2;

        ctx.strokeStyle = '#3B5EFF';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-halfW, -halfH, bounds.width, bounds.height);

        // Rotation Handle
        ctx.beginPath();
        ctx.moveTo(0, -halfH);
        ctx.lineTo(0, -halfH - 24);
        ctx.strokeStyle = '#3B5EFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, -halfH - 24, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#3B5EFF';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 8 Scale Handles
        const handleSize = 8;
        const handles = [
          [-halfW, -halfH],
          [0, -halfH],
          [halfW, -halfH],
          [halfW, 0],
          [halfW, halfH],
          [0, halfH],
          [-halfW, halfH],
          [-halfW, 0],
        ];

        handles.forEach(([hx, hy]) => {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#3B5EFF';
          ctx.lineWidth = 1.5;
          ctx.fillRect(
            hx - handleSize / 2,
            hy - handleSize / 2,
            handleSize,
            handleSize
          );
          ctx.strokeRect(
            hx - handleSize / 2,
            hy - handleSize / 2,
            handleSize,
            handleSize
          );
        });

        ctx.restore();
      }
    });

    ctx.restore();

    // UV Atlas Outer Frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(left, top, size, size);
  }, [
    getTransform,
    showDiffuse,
    showChecker,
    showWireframe,
    showRegionGuides,
    showPanelLabels,
    garmentConfig.regions,
    activeRegionId,
    artworkLayers,
    selectedLayerId,
    panels,
    selectedPanelId,
    uvToScreen,
    getArtworkScreenBounds,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      renderCanvas();
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [renderCanvas]);

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Interactive Pointer Handlers (Direct Manipulation)
  // ───────────────────────────────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const px = (e.clientX - rect.left) * dpr;
    const py = (e.clientY - rect.top) * dpr;

    if (selectedLayer) {
      const bounds = getArtworkScreenBounds(selectedLayer);
      const rad = (-bounds.rotation * Math.PI) / 180;

      const dx = px - bounds.centerX;
      const dy = py - bounds.centerY;
      const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
      const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

      const halfW = bounds.width / 2;
      const halfH = bounds.height / 2;

      // Check Rotation Handle
      const rotHandleDist = Math.hypot(localX - 0, localY - (-halfH - 24));
      if (rotHandleDist <= 14) {
        interactionModeRef.current = 'rotate-art';
        interactionStartRef.current = {
          pointerX: px,
          pointerY: py,
          artU: bounds.u,
          artV: bounds.v,
          artOffsetX: selectedLayer.offsetX,
          artOffsetY: selectedLayer.offsetY,
          artScale: selectedLayer.scale,
          artRot: selectedLayer.rotation,
          initialDistance: 1,
          initialAngle: Math.atan2(py - bounds.centerY, px - bounds.centerX),
          scaleHandle: 'rot',
          panStartX: pan.x,
          panStartY: pan.y,
        };
        return;
      }

      // Check Scale Handles
      const handleSize = 12;
      const handles: [string, number, number][] = [
        ['nw', -halfW, -halfH],
        ['ne', halfW, -halfH],
        ['se', halfW, halfH],
        ['sw', -halfW, halfH],
        ['n', 0, -halfH],
        ['s', 0, halfH],
        ['e', halfW, 0],
        ['w', -halfW, 0],
      ];

      for (const [name, hx, hy] of handles) {
        if (Math.abs(localX - hx) <= handleSize && Math.abs(localY - hy) <= handleSize) {
          interactionModeRef.current = 'scale-art';
          const initDist = Math.hypot(dx, dy);
          interactionStartRef.current = {
            pointerX: px,
            pointerY: py,
            artU: bounds.u,
            artV: bounds.v,
            artOffsetX: selectedLayer.offsetX,
            artOffsetY: selectedLayer.offsetY,
            artScale: selectedLayer.scale,
            artRot: selectedLayer.rotation,
            initialDistance: Math.max(initDist, 10),
            initialAngle: 0,
            scaleHandle: name,
            panStartX: pan.x,
            panStartY: pan.y,
          };
          return;
        }
      }

      // Check Artwork Body Drag
      if (Math.abs(localX) <= halfW && Math.abs(localY) <= halfH) {
        interactionModeRef.current = 'drag-art';
        interactionStartRef.current = {
          pointerX: px,
          pointerY: py,
          artU: bounds.u,
          artV: bounds.v,
          artOffsetX: selectedLayer.offsetX,
          artOffsetY: selectedLayer.offsetY,
          artScale: selectedLayer.scale,
          artRot: selectedLayer.rotation,
          initialDistance: 1,
          initialAngle: 0,
          scaleHandle: '',
          panStartX: pan.x,
          panStartY: pan.y,
        };
        return;
      }
    }

    // Hit-test other artwork layers
    for (let i = artworkLayers.length - 1; i >= 0; i--) {
      const layer = artworkLayers[i];
      const bounds = getArtworkScreenBounds(layer);
      const rad = (-bounds.rotation * Math.PI) / 180;
      const dx = px - bounds.centerX;
      const dy = py - bounds.centerY;
      const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
      const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

      if (Math.abs(localX) <= bounds.width / 2 && Math.abs(localY) <= bounds.height / 2) {
        onSelectLayer(layer.id);
        interactionModeRef.current = 'drag-art';
        interactionStartRef.current = {
          pointerX: px,
          pointerY: py,
          artU: bounds.u,
          artV: bounds.v,
          artOffsetX: layer.offsetX,
          artOffsetY: layer.offsetY,
          artScale: layer.scale,
          artRot: layer.rotation,
          initialDistance: 1,
          initialAngle: 0,
          scaleHandle: '',
          panStartX: pan.x,
          panStartY: pan.y,
        };
        return;
      }
    }

    // Pan UV canvas
    interactionModeRef.current = 'pan';
    interactionStartRef.current = {
      pointerX: px,
      pointerY: py,
      artU: 0.5,
      artV: 0.5,
      artOffsetX: 0,
      artOffsetY: 0,
      artScale: 1,
      artRot: 0,
      initialDistance: 1,
      initialAngle: 0,
      scaleHandle: '',
      panStartX: pan.x,
      panStartY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const px = (e.clientX - rect.left) * dpr;
    const py = (e.clientY - rect.top) * dpr;

    const mode = interactionModeRef.current;
    const start = interactionStartRef.current;

    if (mode === 'pan') {
      const dx = px - start.pointerX;
      const dy = py - start.pointerY;
      setPan({
        x: start.panStartX + dx,
        y: start.panStartY + dy,
      });
      return;
    }

    if (mode === 'drag-art' && selectedLayer) {
      const deltaX = px - start.pointerX;
      const deltaY = py - start.pointerY;
      const { size } = getTransform();

      const placementMode = selectedLayer.placementMode || 'atlas';

      if (placementMode === 'atlas') {
        // Direct UV Atlas movement: 1 px on screen = 1/size UV units
        const deltaU = deltaX / size;
        const deltaV = deltaY / size;

        // Free unconstrained bounds on the atlas [-0.5, 1.5]
        const newU = THREE.MathUtils.clamp(start.artU + deltaU, -0.5, 1.5);
        const newV = THREE.MathUtils.clamp(start.artV + deltaV, -0.5, 1.5);

        onUpdateLayer(selectedLayer.id, {
          u: parseFloat(newU.toFixed(4)),
          v: parseFloat(newV.toFixed(4)),
          offsetX: parseFloat(((newU - 0.5) * 2).toFixed(3)),
          offsetY: parseFloat(((newV - 0.5) * 2).toFixed(3)),
        });
      } else if (placementMode === 'surface') {
        const proj = selectedLayer.surfaceProjector || {
          preset: 'chest_to_sleeve',
          posX: 0.85,
          posY: 1.6,
          posZ: 3.2,
          dirX: 0,
          dirY: 0,
          dirZ: -1,
          sizeX: 4.4,
          sizeY: 3.4,
          facingAngle: 0.05,
        };
        const deltaProjX = (deltaX / size) * 4.0;
        const deltaProjY = -(deltaY / size) * 4.0;
        onUpdateLayer(selectedLayer.id, {
          surfaceProjector: {
            ...proj,
            posX: parseFloat((proj.posX + deltaProjX).toFixed(3)),
            posY: parseFloat((proj.posY + deltaProjY).toFixed(3)),
          },
        });
      } else {
        const region =
          garmentConfig.regions.find((r) => r.id === selectedLayer.regionId) || activeRegion;
        const regionPxW = region.uvSpan[0] * size;
        const regionPxH = region.uvSpan[1] * size;
        const dOffsetX = deltaX / (regionPxW * 0.5);
        const dOffsetY = deltaY / (regionPxH * 0.5);
        const newOffsetX = THREE.MathUtils.clamp(start.artOffsetX + dOffsetX, -2.5, 2.5);
        const newOffsetY = THREE.MathUtils.clamp(start.artOffsetY + dOffsetY, -2.5, 2.5);

        onUpdateLayer(selectedLayer.id, {
          offsetX: parseFloat(newOffsetX.toFixed(3)),
          offsetY: parseFloat(newOffsetY.toFixed(3)),
        });
      }
      return;
    }

    if (mode === 'scale-art' && selectedLayer) {
      const bounds = getArtworkScreenBounds(selectedLayer);
      const currDist = Math.hypot(px - bounds.centerX, py - bounds.centerY);
      const ratio = currDist / start.initialDistance;
      const newScale = THREE.MathUtils.clamp(start.artScale * ratio, 0.1, 4.0);

      onUpdateLayer(selectedLayer.id, {
        scale: parseFloat(newScale.toFixed(3)),
        uvWidth: parseFloat((0.35 * newScale).toFixed(3)),
      });
      return;
    }

    if (mode === 'rotate-art' && selectedLayer) {
      const bounds = getArtworkScreenBounds(selectedLayer);
      const currAngle = Math.atan2(py - bounds.centerY, px - bounds.centerX);
      const deltaAngle = (currAngle - start.initialAngle) * (180 / Math.PI);
      let newRot = Math.round(start.artRot + deltaAngle);
      newRot = (((newRot + 180) % 360) + 360) % 360 - 180;

      onUpdateLayer(selectedLayer.id, {
        rotation: newRot,
      });
      return;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const px = (e.clientX - rect.left) * dpr;
      const py = (e.clientY - rect.top) * dpr;
      const start = interactionStartRef.current;
      const isClick = Math.hypot(px - start.pointerX, py - start.pointerY) < 6;

      if (isClick && interactionModeRef.current === 'pan') {
        const { left, top, size } = getTransform();
        const clickU = (px - left) / size;
        const clickV = (py - top) / size;
        if (clickU >= 0 && clickU <= 1 && clickV >= 0 && clickV <= 1) {
          const clickedPanel = findPanelAtUV(garmentConfig.id, clickU, clickV);
          if (clickedPanel) {
            onSelectPanel?.(clickedPanel.id === selectedPanelId ? null : clickedPanel.id);
          } else {
            onSelectPanel?.(null);
          }
        }
      }
    }
    interactionModeRef.current = 'none';
  };

  // Non-passive wheel listener for smooth zooming without browser passive listener warnings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      setZoom((z) => THREE.MathUtils.clamp(z * factor, 0.5, 6.0));
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Preset Navigation
  const handleFitRegion = (regionId: string) => {
    setActiveView(regionId);
    onRegionChange(regionId);

    const region =
      garmentConfig.regions.find((r) => r.id === regionId) || garmentConfig.regions[0];
    if (!region) return;

    const spanMax = Math.max(region.uvSpan[0], region.uvSpan[1]);
    const targetZoom = Math.min(4.0, Math.max(1.4, 0.72 / spanMax));
    setZoom(targetZoom);

    const canvas = canvasRef.current;
    if (canvas) {
      const w = canvas.width;
      const h = canvas.height;
      const baseSize = Math.min(w, h) * 0.92;
      const size = baseSize * targetZoom;

      const targetX = region.uvCenter[0] * size;
      const targetY = region.uvCenter[1] * size;

      setPan({
        x: w / 2 - targetX - (w - size) / 2,
        y: h / 2 - targetY - (h - size) / 2,
      });
    }
  };

  const handleFitAtlas = () => {
    setActiveView('atlas');
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleMoveToPanel = (panelId: string) => {
    const panel = panels.find((p) => p.id === panelId);
    if (!panel) return;

    if (selectedLayer) {
      onUpdateLayer(selectedLayer.id, {
        placementMode: 'atlas',
        u: panel.u,
        v: panel.v,
        offsetX: parseFloat(((panel.u - 0.5) * 2).toFixed(3)),
        offsetY: parseFloat(((panel.v - 0.5) * 2).toFixed(3)),
      });
    }

    // Frame the panel in the UV editor
    const spanMax = Math.max(panel.spanU, panel.spanV);
    const targetZoom = Math.min(3.5, Math.max(1.4, 0.72 / spanMax));
    setZoom(targetZoom);

    const canvas = canvasRef.current;
    if (canvas) {
      const w = canvas.width;
      const h = canvas.height;
      const baseSize = Math.min(w, h) * 0.92;
      const size = baseSize * targetZoom;

      const targetX = panel.u * size;
      const targetY = panel.v * size;

      setPan({
        x: w / 2 - targetX - (w - size) / 2,
        y: h / 2 - targetY - (h - size) / 2,
      });
    }

    onSelectPanel?.(panel.id);
  };

  return (
    <aside className={`uv-editor-panel ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Header bar with toggle and mobile return */}
      <div className="uv-editor-header">
        <div className="uv-header-title">
          {/* Mobile Back / Done button */}
          {(onClose || onToggleOpen) && (
            <button
              type="button"
              className="uv-mobile-done-btn"
              onClick={() => {
                if (onClose) onClose();
                else if (onToggleOpen) onToggleOpen();
              }}
              title="Return to 3D Garment Viewport"
            >
              <ArrowLeft size={16} />
              <span>Back to 3D</span>
            </button>
          )}

          <Layers size={16} className="text-accent uv-desktop-only-icon" />
          <span className="uv-header-title-text">Full UV Atlas Editor</span>
          <span className="badge badge-accent">Live 3D Sync</span>
        </div>

        <div className="uv-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onAddArtwork && (
            <label
              className="uv-upload-header-btn"
              title="Upload custom graphic or print"
            >
              <Upload size={14} />
              <span>Upload Design</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onAddArtwork) {
                    onAddArtwork(file);
                  }
                  e.target.value = '';
                }}
              />
            </label>
          )}

          {onToggleOpen && (
            <button
              className="btn-icon-subtle uv-desktop-toggle-btn"
              onClick={onToggleOpen}
              title={isOpen ? 'Collapse UV Editor' : 'Expand UV Editor'}
            >
              {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="uv-editor-content">
          {/* Region & Atlas Tabs */}
          <div className="uv-region-tabs">
            <button
              className={`uv-tab-btn ${activeView === 'atlas' ? 'active' : ''}`}
              onClick={handleFitAtlas}
            >
              Full Atlas
            </button>
            {garmentConfig.regions.map((region) => (
              <button
                key={region.id}
                className={`uv-tab-btn ${activeRegionId === region.id && activeView !== 'atlas' ? 'active' : ''}`}
                onClick={() => handleFitRegion(region.id)}
              >
                {region.name}
              </button>
            ))}
          </div>

          {/* Interactive UV Canvas */}
          <div className="uv-canvas-container" ref={containerRef}>
            <canvas
              ref={canvasRef}
              className="uv-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />

            {/* Empty state overlay when no artwork uploaded yet */}
            {artworkLayers.length === 0 && onAddArtwork && (
              <div className="uv-canvas-empty-cta">
                <div className="uv-canvas-empty-icon">
                  <Upload size={26} />
                </div>
                <div className="uv-canvas-empty-title">No Graphics on Garment</div>
                <div className="uv-canvas-empty-desc">
                  Upload an image to place and position on this UV layout
                </div>
                <label className="uv-canvas-empty-btn">
                  <Upload size={14} />
                  <span>Choose Image File</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && onAddArtwork) {
                        onAddArtwork(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            )}

            {/* Canvas Overlay Controls Toolbar */}
            <div className="uv-canvas-toolbar">
              <button
                className={`uv-tool-btn ${showWireframe ? 'active' : ''}`}
                onClick={() => setShowWireframe(!showWireframe)}
                title="Toggle Model UV Wireframe"
              >
                <Grid size={14} />
                <span>Wireframe</span>
              </button>

              <button
                className={`uv-tool-btn ${showPanelLabels ? 'active' : ''}`}
                onClick={() => setShowPanelLabels(!showPanelLabels)}
                title="Toggle Verified Garment Panel Badges"
              >
                <Tag size={14} />
                <span>Panels</span>
              </button>

              <button
                className={`uv-tool-btn ${showChecker ? 'active' : ''}`}
                onClick={() => setShowChecker(!showChecker)}
                title="Toggle Labeled UV Island Checker"
              >
                <Sparkles size={14} />
                <span>Checker</span>
              </button>

              <button
                className={`uv-tool-btn ${showDiffuse ? 'active' : ''}`}
                onClick={() => setShowDiffuse(!showDiffuse)}
                title="Toggle Fabric Seams Underlay"
              >
                {showDiffuse ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>Seams</span>
              </button>

              <div className="toolbar-divider" />

              <button
                className="uv-tool-btn"
                onClick={() => setZoom((z) => Math.min(6.0, z * 1.25))}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>

              <button
                className="uv-tool-btn"
                onClick={() => setZoom((z) => Math.max(0.5, z * 0.8))}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>

              <button
                className="uv-tool-btn"
                onClick={handleFitAtlas}
                title="Reset View"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Verified Garment Panels Bar (Always accessible) */}
          <div className="uv-panels-bar" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Tag size={12} className="text-accent" />
                Verified Panels ({panels.length}):
              </span>
              {selectedPanelId && (
                <button
                  className="btn-icon-subtle"
                  style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '2px 6px', height: 'auto', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}
                  onClick={() => onSelectPanel?.(null)}
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {panels.map((panel) => {
                const isSelected = selectedPanelId === panel.id;
                return (
                  <button
                    key={panel.id}
                    className={`btn-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      handleMoveToPanel(panel.id);
                    }}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      border: isSelected ? `1px solid ${panel.color}` : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                      background: isSelected ? `${panel.color}44` : 'rgba(255, 255, 255, 0.04)',
                      fontWeight: isSelected ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      borderRadius: '12px',
                    }}
                    title={panel.description || panel.name}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: panel.color, flexShrink: 0 }} />
                    <span>{panel.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Placement Controls for Selected Artwork */}
          {selectedLayer ? (
            <div className="uv-layer-controls">
              <div className="uv-layer-titlebar">
                <span className="uv-layer-name">{selectedLayer.name}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background:
                      selectedLayer.placementMode === 'surface'
                        ? 'rgba(0, 214, 255, 0.2)'
                        : selectedLayer.placementMode === 'atlas'
                        ? 'rgba(168, 85, 247, 0.2)'
                        : 'rgba(255, 255, 255, 0.1)',
                    color:
                      selectedLayer.placementMode === 'surface'
                        ? '#3B5EFF'
                        : selectedLayer.placementMode === 'atlas'
                        ? '#c084fc'
                        : '#aaa',
                    fontWeight: 700,
                  }}
                >
                  {selectedLayer.placementMode === 'surface'
                    ? '3D Cross-Seam'
                    : selectedLayer.placementMode === 'atlas'
                    ? 'Full Atlas'
                    : 'Region'}
                </span>
                <div className="uv-layer-quick-actions">
                  <button
                    className="btn-icon-subtle"
                    onClick={() => onDuplicateLayer(selectedLayer.id)}
                    title="Duplicate Layer"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="btn-icon-subtle text-danger"
                    onClick={() => onDeleteLayer(selectedLayer.id)}
                    title="Delete Layer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Quick Move Artwork to Verified Garment Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Move Artwork to Panel:
                </span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {panels.map((panel) => (
                    <button
                      key={panel.id}
                      className="btn-pill"
                      onClick={() => handleMoveToPanel(panel.id)}
                      style={{ fontSize: '10px', padding: '3px 8px' }}
                      title={`Move layer to ${panel.name}`}
                    >
                      {panel.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders & Numeric Inputs */}
              <div className="uv-sliders-grid">
                {/* U Coordinate */}
                <div className="uv-slider-row">
                  <span className="slider-label">U (Horizontal)</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.005"
                    value={
                      selectedLayer.u !== undefined
                        ? selectedLayer.u
                        : 0.5 + selectedLayer.offsetX * 0.5
                    }
                    onChange={(e) => {
                      const u = parseFloat(e.target.value);
                      onUpdateLayer(selectedLayer.id, {
                        placementMode: 'atlas',
                        u,
                        offsetX: parseFloat(((u - 0.5) * 2).toFixed(3)),
                      });
                    }}
                  />
                  <span className="slider-val">
                    {(
                      selectedLayer.u !== undefined
                        ? selectedLayer.u
                        : 0.5 + selectedLayer.offsetX * 0.5
                    ).toFixed(2)}
                  </span>
                </div>

                {/* V Coordinate */}
                <div className="uv-slider-row">
                  <span className="slider-label">V (Vertical)</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.005"
                    value={
                      selectedLayer.v !== undefined
                        ? selectedLayer.v
                        : 0.5 + selectedLayer.offsetY * 0.5
                    }
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      onUpdateLayer(selectedLayer.id, {
                        placementMode: 'atlas',
                        v,
                        offsetY: parseFloat(((v - 0.5) * 2).toFixed(3)),
                      });
                    }}
                  />
                  <span className="slider-val">
                    {(
                      selectedLayer.v !== undefined
                        ? selectedLayer.v
                        : 0.5 + selectedLayer.offsetY * 0.5
                    ).toFixed(2)}
                  </span>
                </div>

                {/* Scale */}
                <div className="uv-slider-row">
                  <span className="slider-label">Scale</span>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.05"
                    value={selectedLayer.scale}
                    onChange={(e) =>
                      onUpdateLayer(selectedLayer.id, {
                        scale: parseFloat(e.target.value),
                        uvWidth: parseFloat((0.35 * parseFloat(e.target.value)).toFixed(3)),
                      })
                    }
                  />
                  <span className="slider-val">
                    {Math.round(selectedLayer.scale * 100)}%
                  </span>
                </div>

                {/* Rotation */}
                <div className="uv-slider-row">
                  <span className="slider-label">Rotation</span>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={selectedLayer.rotation}
                    onChange={(e) =>
                      onUpdateLayer(selectedLayer.id, {
                        rotation: parseInt(e.target.value, 10),
                      })
                    }
                  />
                  <span className="slider-val">{selectedLayer.rotation}°</span>
                </div>

                {/* Opacity */}
                <div className="uv-slider-row">
                  <span className="slider-label">Opacity</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={selectedLayer.opacity}
                    onChange={(e) =>
                      onUpdateLayer(selectedLayer.id, {
                        opacity: parseFloat(e.target.value),
                      })
                    }
                  />
                  <span className="slider-val">
                    {Math.round(selectedLayer.opacity * 100)}%
                  </span>
                </div>

                {/* Aspect Ratio Lock & Flips */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    className={`btn-pill ${selectedLayer.lockAspectRatio !== false ? 'active' : ''}`}
                    onClick={() =>
                      onUpdateLayer(selectedLayer.id, {
                        lockAspectRatio: selectedLayer.lockAspectRatio === false,
                      })
                    }
                    title="Lock Aspect Ratio"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    {selectedLayer.lockAspectRatio !== false ? <Lock size={12} /> : <Unlock size={12} />}
                    <span>{selectedLayer.lockAspectRatio !== false ? 'Aspect Locked' : 'Aspect Free'}</span>
                  </button>

                  <button
                    className={`btn-pill ${selectedLayer.flipHorizontal ? 'active' : ''}`}
                    onClick={() =>
                      onUpdateLayer(selectedLayer.id, {
                        flipHorizontal: !selectedLayer.flipHorizontal,
                      })
                    }
                    style={{ flex: 1 }}
                  >
                    Flip H
                  </button>

                  <button
                    className={`btn-pill ${selectedLayer.flipVertical ? 'active' : ''}`}
                    onClick={() =>
                      onUpdateLayer(selectedLayer.id, {
                        flipVertical: !selectedLayer.flipVertical,
                      })
                    }
                    style={{ flex: 1 }}
                  >
                    Flip V
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="uv-editor-empty">
              <Move size={24} className="text-muted" />
              <span>Select or upload an artwork layer to edit its UV transform</span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

