import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  AlignCenter,
  AlignVerticalJustifyCenter,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
  RefreshCw,
  Upload,
} from 'lucide-react';
import type {
  ArtworkLayer,
  BackgroundSettings,
  GarmentSide,
  LightingSettings,
  WarpSettings,
} from '../types/mockup';
import { compositor } from '../engine/compositor';
import { assetManager } from '../engine/assetManager';
import { checkEffectiveResolution } from '../engine/validation';

interface CanvasViewportProps {
  templateId: number;
  activeSide: GarmentSide;
  onSideChange: (side: GarmentSide) => void;
  garmentColor: string;
  warp: WarpSettings;
  background: BackgroundSettings;
  lighting: LightingSettings;
  layers: ArtworkLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<ArtworkLayer>) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onCenterHorizontal: (id: string) => void;
  onCenterVertical: (id: string) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  onCommitHistory: () => void;
  onFrameTick?: (frame: number) => void;
  onUploadFile?: (file: File) => void;
}

type DragMode = 'move' | 'scale-tl' | 'scale-tr' | 'scale-bl' | 'scale-br' | 'rotate' | 'pan' | null;

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  templateId,
  activeSide,
  onSideChange,
  garmentColor,
  warp,
  background,
  lighting,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onCenterHorizontal,
  onCenterVertical,
  zoom,
  setZoom,
  pan,
  setPan,
  onCommitHistory,
  onFrameTick,
  onUploadFile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [snapGuides, setSnapGuides] = useState<{ x?: number; y?: number }>({});
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isSpacePressedRef = useRef(false);

  // Cancellation token for async renders to prevent front/back race conditions
  const renderIdRef = useRef(0);

  // Animation timeline state
  const currentFrameRef = useRef(lighting.frameIndex || 0);
  const isBaseDirtyRef = useRef(true);

  // Drag tracking state ref
  const dragRef = useRef<{
    startX: number;
    startY: number;
    layerStartX: number;
    layerStartY: number;
    layerStartScaleX: number;
    layerStartScaleY: number;
    layerStartRot: number;
    panStartX: number;
    panStartY: number;
  }>({
    startX: 0,
    startY: 0,
    layerStartX: 0,
    layerStartY: 0,
    layerStartScaleX: 1,
    layerStartScaleY: 1,
    layerStartRot: 0,
    panStartX: 0,
    panStartY: 0,
  });

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  // Start background preloader for gobo frames
  useEffect(() => {
    assetManager.startGoboPreloader();
  }, []);

  // Track space key for panning
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = e.type === 'keydown';
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, []);

  // Invalidate base canvas when garment, side, color, warp, or layers change
  useEffect(() => {
    isBaseDirtyRef.current = true;
  }, [templateId, activeSide, garmentColor, warp, background, layers]);

  // Asynchronously render static base scene into offscreen buffer with race-condition protection
  const updateBaseScene = useCallback(async () => {
    const renderId = ++renderIdRef.current;
    setIsLoading(true);

    if (!baseCanvasRef.current) {
      baseCanvasRef.current = document.createElement('canvas');
      baseCanvasRef.current.width = 2048;
      baseCanvasRef.current.height = 2048;
    }

    const baseCanvas = baseCanvasRef.current;
    const baseCtx = baseCanvas.getContext('2d');
    if (!baseCtx) return;

    try {
      await compositor.renderBaseScene(baseCtx, {
        templateId,
        side: activeSide,
        garmentColor,
        warp,
        background,
        lighting,
        layers,
        drawUIHandles: false,
        outputWidth: 2048,
        outputHeight: 2048,
      });

      // Discard render if a newer render or side-switch was triggered while loading
      if (renderId !== renderIdRef.current) {
        return;
      }

      isBaseDirtyRef.current = false;
      setIsLoading(false);
    } catch (e) {
      console.error('Failed to render base scene:', e);
      if (renderId === renderIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [templateId, activeSide, garmentColor, warp, background, layers]);

  // Trigger base scene update when dirty
  useEffect(() => {
    updateBaseScene();
  }, [updateBaseScene]);

  // High-performance 30 FPS animation and display loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const animLoop = (now: number) => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Only advance animated tree shadow frame when active and tab visible
      if (lighting.animated && !prefersReduced && document.visibilityState !== 'hidden') {
        // Reference speed: 30 FPS (~33.3ms per frame)
        if (now - lastTime >= 33.3) {
          lastTime = now;
          currentFrameRef.current = (currentFrameRef.current + 1) % 180;
          onFrameTick?.(currentFrameRef.current);
        }
      } else if (!lighting.animated) {
        currentFrameRef.current = lighting.frameIndex || 0;
        onFrameTick?.(currentFrameRef.current);
      }

      // Draw final composite onto viewport canvas
      const canvas = canvasRef.current;
      const baseCanvas = baseCanvasRef.current;

      if (canvas && baseCanvas && !isBaseDirtyRef.current) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 2048, 2048);
          // Blit cached base scene
          ctx.drawImage(baseCanvas, 0, 0);

          // Get current gobo lighting frame (from cache or frame 0)
          const goboImg = assetManager.getGoboFrameSync(currentFrameRef.current);

          // Apply environmental lighting and UI handles
          compositor.applyLightingAndUI(ctx, goboImg, {
            templateId,
            side: activeSide,
            garmentColor,
            warp,
            background,
            lighting,
            layers,
            selectedLayerId,
            drawUIHandles: true,
            outputWidth: 2048,
            outputHeight: 2048,
            snapGuides,
          });
        }
      }

      animId = requestAnimationFrame(animLoop);
    };

    animId = requestAnimationFrame(animLoop);
    return () => cancelAnimationFrame(animId);
  }, [templateId, activeSide, garmentColor, warp, background, lighting, layers, selectedLayerId, snapGuides]);

  // Convert mouse screen coordinates to 2048x2048 garment canvas coordinates
  const screenToGarmentCoords = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();

      const cx = rect.width / 2 + pan.x;
      const cy = rect.height / 2 + pan.y;

      const size = Math.min(rect.width, rect.height) * 0.9 * zoom;
      const originX = cx - size / 2;
      const originY = cy - size / 2;

      const gx = ((screenX - rect.left - originX) / size) * 2048;
      const gy = ((screenY - rect.top - originY) / size) * 2048;

      return { x: gx, y: gy };
    },
    [pan, zoom]
  );

  // Hit test handles and layer bounding box
  const hitTest = useCallback(
    (gx: number, gy: number): { mode: DragMode; layerId?: string } => {
      if (selectedLayer && selectedLayer.visible && !selectedLayer.locked) {
        const rad = (selectedLayer.rotation * Math.PI) / 180.0;
        const cosT = Math.cos(rad);
        const sinT = Math.sin(rad);

        const dx = gx - selectedLayer.x;
        const dy = gy - selectedLayer.y;

        const lx = dx * cosT + dy * sinT;
        const ly = -dx * sinT + dy * cosT;

        const dispW = selectedLayer.width * Math.abs(selectedLayer.scaleX);
        const dispH = selectedLayer.height * Math.abs(selectedLayer.scaleY);
        const halfW = dispW / 2;
        const halfH = dispH / 2;

        const rotHandleDist = Math.hypot(lx, ly - (-halfH - 24));
        if (rotHandleDist <= 20) {
          return { mode: 'rotate', layerId: selectedLayer.id };
        }

        const cornerRadius = 18;
        if (Math.hypot(lx - (-halfW), ly - (-halfH)) <= cornerRadius) return { mode: 'scale-tl', layerId: selectedLayer.id };
        if (Math.hypot(lx - halfW, ly - (-halfH)) <= cornerRadius) return { mode: 'scale-tr', layerId: selectedLayer.id };
        if (Math.hypot(lx - (-halfW), ly - halfH) <= cornerRadius) return { mode: 'scale-bl', layerId: selectedLayer.id };
        if (Math.hypot(lx - halfW, ly - halfH) <= cornerRadius) return { mode: 'scale-br', layerId: selectedLayer.id };

        if (Math.abs(lx) <= halfW && Math.abs(ly) <= halfH) {
          return { mode: 'move', layerId: selectedLayer.id };
        }
      }

      for (let i = layers.length - 1; i >= 0; i--) {
        const l = layers[i];
        if (!l.visible || l.locked) continue;

        const rad = (l.rotation * Math.PI) / 180.0;
        const cosT = Math.cos(rad);
        const sinT = Math.sin(rad);

        const dx = gx - l.x;
        const dy = gy - l.y;
        const lx = dx * cosT + dy * sinT;
        const ly = -dx * sinT + dy * cosT;

        const dispW = l.width * Math.abs(l.scaleX);
        const dispH = l.height * Math.abs(l.scaleY);

        if (Math.abs(lx) <= dispW / 2 && Math.abs(ly) <= dispH / 2) {
          return { mode: 'move', layerId: l.id };
        }
      }

      return { mode: null };
    },
    [selectedLayer, layers]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isSpacePressedRef.current || (e.button === 0 && e.altKey)) {
      setDragMode('pan');
      dragRef.current = {
        ...dragRef.current,
        startX: e.clientX,
        startY: e.clientY,
        panStartX: pan.x,
        panStartY: pan.y,
      };
      return;
    }

    const { x: gx, y: gy } = screenToGarmentCoords(e.clientX, e.clientY);
    const hit = hitTest(gx, gy);

    if (hit.mode && hit.layerId) {
      if (selectedLayerId !== hit.layerId) {
        onSelectLayer(hit.layerId);
      }
      setDragMode(hit.mode);
      const targetLayer = layers.find((l) => l.id === hit.layerId)!;

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        layerStartX: targetLayer.x,
        layerStartY: targetLayer.y,
        layerStartScaleX: targetLayer.scaleX,
        layerStartScaleY: targetLayer.scaleY,
        layerStartRot: targetLayer.rotation,
        panStartX: pan.x,
        panStartY: pan.y,
      };
    } else {
      if (e.target === canvasRef.current || e.target === containerRef.current) {
        if (selectedLayerId) {
          onSelectLayer(null);
        } else {
          setDragMode('pan');
          dragRef.current = {
            ...dragRef.current,
            startX: e.clientX,
            startY: e.clientY,
            panStartX: pan.x,
            panStartY: pan.y,
          };
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragMode) return;

    if (dragMode === 'pan') {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPan({
        x: dragRef.current.panStartX + dx,
        y: dragRef.current.panStartY + dy,
      });
      return;
    }

    if (!selectedLayer) return;

    const currentGarment = screenToGarmentCoords(e.clientX, e.clientY);
    const startGarment = screenToGarmentCoords(dragRef.current.startX, dragRef.current.startY);

    if (dragMode === 'move') {
      let nextX = dragRef.current.layerStartX + (currentGarment.x - startGarment.x);
      let nextY = dragRef.current.layerStartY + (currentGarment.y - startGarment.y);

      const snapThreshold = 25;
      const guides: { x?: number; y?: number } = {};

      if (Math.abs(nextX - 1024) < snapThreshold) {
        nextX = 1024;
        guides.x = 1024;
      }
      if (Math.abs(nextY - 1024) < snapThreshold) {
        nextY = 1024;
        guides.y = 1024;
      }

      setSnapGuides(guides);
      onUpdateLayer(selectedLayer.id, { x: Math.round(nextX), y: Math.round(nextY) });
    } else if (dragMode === 'rotate') {
      const dx = currentGarment.x - selectedLayer.x;
      const dy = currentGarment.y - selectedLayer.y;
      let angle = (Math.atan2(dy, dx) * 180.0) / Math.PI + 90;
      if (Math.abs(angle) < 4) angle = 0;
      if (Math.abs(angle - 90) < 4) angle = 90;
      if (Math.abs(angle + 90) < 4) angle = -90;
      if (Math.abs(Math.abs(angle) - 180) < 4) angle = 180;

      onUpdateLayer(selectedLayer.id, { rotation: Math.round(angle) });
    } else if (dragMode.startsWith('scale')) {
      const initialDist = Math.hypot(
        startGarment.x - selectedLayer.x,
        startGarment.y - selectedLayer.y
      );
      const currentDist = Math.hypot(
        currentGarment.x - selectedLayer.x,
        currentGarment.y - selectedLayer.y
      );

      if (initialDist > 5) {
        const ratio = currentDist / initialDist;
        const signX = selectedLayer.scaleX >= 0 ? 1 : -1;
        const signY = selectedLayer.scaleY >= 0 ? 1 : -1;

        const nextScale = Math.max(0.1, Math.min(4.0, Math.abs(dragRef.current.layerStartScaleX) * ratio));
        onUpdateLayer(selectedLayer.id, {
          scaleX: nextScale * signX,
          scaleY: nextScale * signY,
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (dragMode && dragMode !== 'pan') {
      onCommitHistory();
    }
    setDragMode(null);
    setSnapGuides({});
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.max(0.3, Math.min(3.5, prev * zoomFactor)));
  };

  const resInfo = selectedLayer
    ? checkEffectiveResolution(
        selectedLayer.naturalWidth,
        selectedLayer.naturalHeight,
        selectedLayer.width * Math.abs(selectedLayer.scaleX),
        selectedLayer.height * Math.abs(selectedLayer.scaleY)
      )
    : null;

  return (
    <div
      ref={containerRef}
      id="viewport-container"
      className={`canvas-viewport ${dragMode === 'pan' ? 'panning' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Front / Back View Orientation Badge with One-Click Flip */}
      <button
        id="view-orientation-badge"
        type="button"
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'rgba(24, 29, 38, 0.92)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-full)',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 25,
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          outline: 'none',
          color: '#fff',
          touchAction: 'manipulation',
          userSelect: 'none',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSideChange(activeSide === 'front' ? 'back' : 'front');
        }}
        title="Click to switch between Front and Back view"
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: activeSide === 'front' ? '#3B5EFF' : '#10b981',
            boxShadow: activeSide === 'front' ? '0 0 8px rgba(59,94,255,0.6)' : '0 0 8px rgba(16,185,129,0.6)',
          }}
        />
        <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff' }}>
          {activeSide} View
        </span>
        <RefreshCw size={13} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Floating Action Bar for Selected Layer */}
      {selectedLayer && (
        <div className="selection-action-bar">
          <button
            className="selection-btn"
            title="Center Horizontally"
            onClick={() => onCenterHorizontal(selectedLayer.id)}
          >
            <AlignCenter size={15} />
          </button>
          <button
            className="selection-btn"
            title="Center Vertically"
            onClick={() => onCenterVertical(selectedLayer.id)}
          >
            <AlignVerticalJustifyCenter size={15} />
          </button>
          <button
            className="selection-btn"
            title="Flip Horizontal"
            onClick={() => {
              onUpdateLayer(selectedLayer.id, {
                flipX: !selectedLayer.flipX,
                scaleX: -selectedLayer.scaleX,
              });
              onCommitHistory();
            }}
          >
            <FlipHorizontal size={15} />
          </button>
          <button
            className="selection-btn"
            title="Flip Vertical"
            onClick={() => {
              onUpdateLayer(selectedLayer.id, {
                flipY: !selectedLayer.flipY,
                scaleY: -selectedLayer.scaleY,
              });
              onCommitHistory();
            }}
          >
            <FlipVertical size={15} />
          </button>

          <div className="divider-vert" />

          <button
            className="selection-btn"
            title="Duplicate Layer"
            onClick={() => onDuplicateLayer(selectedLayer.id)}
          >
            <Copy size={15} />
          </button>
          <button
            className="selection-btn danger"
            title="Delete Layer"
            onClick={() => onDeleteLayer(selectedLayer.id)}
          >
            <Trash2 size={15} />
          </button>

          {resInfo && (
            <>
              <div className="divider-vert" />
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: resInfo.dpiQuality === 'low' ? 'var(--warning)' : '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {resInfo.dpiQuality === 'low' ? 'Low DPI' : 'Crisp Print'}
              </div>
            </>
          )}
        </div>
      )}

      {/* Main 2D Render Canvas (native 2048x2048 displayed dynamically) */}
      <canvas
        ref={canvasRef}
        id="main-mockup-canvas"
        width={2048}
        height={2048}
        className="main-render-canvas"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom * 0.45})`,
          transformOrigin: 'center center',
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            bottom: '72px',
            right: '24px',
            background: 'rgba(24, 29, 38, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-medium)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            zIndex: 10,
          }}
        >
          <Loader2 size={13} className="animate-spin" />
          <span>Updating View...</span>
        </div>
      )}

      {/* Floating 2D Upload Design Quick Action Button */}
      {onUploadFile && (
        <div className="viewport-2d-floating-actions">
          <label className="quick-action-pill quick-action-upload" title="Upload custom graphic or print">
            <Upload size={14} />
            <span>Upload Design</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onUploadFile(file);
                }
                e.target.value = '';
              }}
            />
          </label>
        </div>
      )}

      {/* Floating Bottom Viewport Navigation Controls */}
      <div className="viewport-bottom-controls">
        <button
          className="viewport-btn"
          title="Zoom Out"
          onClick={() => setZoom((prev) => Math.max(0.3, prev * 0.85))}
        >
          <ZoomOut size={16} />
        </button>
        <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
        <button
          className="viewport-btn"
          title="Zoom In"
          onClick={() => setZoom((prev) => Math.min(3.5, prev * 1.15))}
        >
          <ZoomIn size={16} />
        </button>
        <div className="divider-vert" />
        <button
          className="viewport-btn"
          title="Fit View"
          onClick={() => {
            setZoom(1.0);
            setPan({ x: 0, y: 0 });
          }}
        >
          <Maximize2 size={15} />
        </button>
      </div>
    </div>
  );
};

