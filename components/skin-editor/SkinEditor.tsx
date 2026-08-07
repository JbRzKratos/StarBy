'use client';

/**
 * SkinEditor — Production-Grade SVG Phone Skin Preview & Editor
 *
 * Complete replacement for the old CustomizerCanvas when rendering skins.
 *
 * Architecture:
 *   SVG viewport (correct aspect ratio per device)
 *    ├── <defs>
 *    │    ├── PhoneMaskDefs (clipPath for body)
 *    │    └── PhoneRenderer defs (shadow filter, gradient)
 *    ├── PhoneRenderer (body + frame + shadow)
 *    ├── ArtworkLayer (artwork inside clipPath)
 *    ├── CameraRenderer (island + lenses on top of artwork)
 *    └── SafeAreaOverlay (optional print guides)
 *
 * Below the SVG:
 *    SkinEditorToolbar (fit / transform / export controls)
 */

import React, { useRef, useState, useCallback, useId } from 'react';
import { usePhoneTemplate, useResizeObservedHeight } from '@/hooks/usePhoneTemplate';
import { useArtworkTransform } from '@/hooks/useArtworkTransform';
import { useSkinExport } from '@/hooks/useSkinExport';
import { PhoneRenderer } from './PhoneRenderer';
import { PhoneMaskDefs } from './PhoneMask';
import { CameraRenderer } from './CameraRenderer';
import { ArtworkLayer } from './ArtworkLayer';
import { SafeAreaOverlay } from './SafeAreaOverlay';
import { SkinEditorToolbar } from './SkinEditorToolbar';

interface SkinEditorProps {
  /** Device ID from devices.ts */
  deviceId: string;
  /** Data URL or HTTPS URL of the uploaded artwork */
  imageUrl: string | null;
  /** Called when user clicks the empty state upload placeholder */
  onUploadClick?: () => void;
  /** Called when artwork is fully loaded and transform is initialized */
  onReady?: () => void;
}

export function SkinEditor({ deviceId, imageUrl, onUploadClick, onReady }: SkinEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Observe actual container height for responsive scaling
  const containerH = useResizeObservedHeight(containerRef as React.RefObject<HTMLElement>, 560);

  // Resolve full device geometry
  const template = usePhoneTemplate(deviceId, containerH);

  // Unique filter/gradient IDs (avoid collisions when multiple instances)
  const uid = useId().replace(/:/g, '-');

  // Artwork transform state
  const {
    transform,
    initTransform,
    fitCover,
    fitContain,
    handlePointerDown,
    handleWheel,
    rotate,
    flipHorizontal,
    flipVertical,
    undo,
    redo,
    canUndo,
    canRedo,
    artNaturalSize,
  } = useArtworkTransform(template?.printableRect ?? null);

  // Print guide overlay
  const [showSafeArea, setShowSafeArea] = useState(false);

  // Export
  const { isExporting, exportPNG, exportSVG } = useSkinExport(
    template?.device ?? null,
    template?.dims ?? null,
  );

  const handleImageLoad = useCallback(
    (w: number, h: number) => {
      initTransform(w, h);
      onReady?.();
    },
    [initTransform, onReady],
  );

  const handleExport300 = useCallback(() => {
    if (svgRef.current) exportPNG(svgRef.current, 300);
  }, [exportPNG]);

  const handleExport600 = useCallback(() => {
    if (svgRef.current) exportPNG(svgRef.current, 600);
  }, [exportPNG]);

  const handleExportSVG = useCallback(() => {
    if (svgRef.current) exportSVG(svgRef.current);
  }, [exportSVG]);

  // ─── Empty state ───────────────────────────────────────────────────────────

  if (!template) {
    return (
      <div className="flex items-center justify-center w-full h-64 bg-graphite rounded-xl">
        <span className="font-mono text-ash text-sm">Loading device...</span>
      </div>
    );
  }

  const { dims, clipId } = template;

  // ─── SVG viewport ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Toolbar */}
      <SkinEditorToolbar
        hasArtwork={!!imageUrl && !!artNaturalSize}
        showSafeArea={showSafeArea}
        canUndo={canUndo}
        canRedo={canRedo}
        isExporting={isExporting}
        onFitCover={fitCover}
        onFitContain={fitContain}
        onRotateCW={() => rotate(90)}
        onRotateCCW={() => rotate(-90)}
        onFlipH={flipHorizontal}
        onFlipV={flipVertical}
        onUndo={undo}
        onRedo={redo}
        onToggleSafeArea={() => setShowSafeArea((v) => !v)}
        onExport300={handleExport300}
        onExport600={handleExport600}
        onExportSVG={handleExportSVG}
      />

      {/* SVG Preview Container */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center w-full"
        style={{ minHeight: 400 }}
      >
        {/* No-artwork placeholder — centered behind SVG */}
        {!imageUrl && (
          <div
            onClick={onUploadClick}
            className="absolute inset-0 flex flex-col items-center justify-center z-10 cursor-pointer"
          >
            <div
              className="flex flex-col items-center gap-3 px-8 py-6 rounded-xl transition-transform hover:scale-105"
              style={{
                background: 'rgba(10,10,14,0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px dashed rgba(255,255,255,0.2)',
              }}
            >
              <UploadIcon />
              <p className="font-mono text-xs text-bone uppercase tracking-widest font-bold">
                Click to Upload Image
              </p>
              <p className="font-mono text-[10px] text-ash">PNG or JPG · Any resolution accepted</p>
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          width={dims.widthPx}
          height={dims.heightPx}
          viewBox={`0 0 ${dims.widthPx} ${dims.heightPx}`}
          style={{
            overflow: 'visible',
            maxWidth: '100%',
            maxHeight: containerH * 0.95,
          }}
          aria-label={`Phone skin preview for ${template.device.name}`}
        >
          <defs>
            <PhoneMaskDefs template={template} />
          </defs>

          {/* 1. Phone body + chrome */}
          <PhoneRenderer template={template} filterId={uid} />

          {/* 2. Artwork layer (clipped inside body) */}
          {imageUrl && artNaturalSize && (
            <ArtworkLayer
              imageUrl={imageUrl}
              clipId={clipId}
              transform={transform}
              artNaturalSize={artNaturalSize}
              onImageLoad={handleImageLoad}
              onPointerDown={handlePointerDown}
              onWheel={handleWheel}
            />
          )}

          {/* 3. Camera module on top of artwork */}
          <CameraRenderer template={template} filterId={uid} />

          {/* 4. Print guide overlay (optional) */}
          <SafeAreaOverlay template={template} visible={showSafeArea} />
        </svg>
      </div>

      {/* Device info badge */}
      <div className="flex items-center gap-2 font-mono text-[9px] text-ash uppercase tracking-widest">
        <span>{template.device.name}</span>
        <span className="text-smoke">·</span>
        <span>
          {dims.widthMM.toFixed(1)} × {dims.heightMM.toFixed(1)} mm
        </span>
        {template.device.confidence === 'estimated' && (
          <>
            <span className="text-smoke">·</span>
            <span className="text-amber-500/60">est.</span>
          </>
        )}
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth={1.5}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
