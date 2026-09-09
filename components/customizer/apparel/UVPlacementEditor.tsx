'use client';

/**
 * UVPlacementEditor.tsx
 *
 * Interactive UV Placement & Repositioning panel for the apparel customizer sidebar.
 * Displays the authentic pattern and garment shape of the t-shirt (Front or Back),
 * with the calibrated DTG print safe zone and real-time draggable design artwork.
 *
 * Features:
 * - Fluid 120 FPS cursor dragging with local state tracking.
 * - Throttled requestAnimationFrame syncing to 3D viewer (eliminates GPU texture thrashing).
 * - Real t-shirt garment silhouette dyed with chosen shirt color.
 * - Corner bracket DTG zone markers and center crosshair alignment.
 * - Preset chips ('Center', 'Left Chest', 'Upper Chest', 'Reset').
 * - Precision nudge D-pad and sliders for scale, rotation, and opacity.
 */

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import type { DesignTransform } from '@/lib/stores/apparel-customizer-store';
import type { GarmentView } from '@/data/printAreaConfig';

interface Props {
  view: GarmentView;
  colorHex: string;
  imageUrl: string | null;
  transform: DesignTransform | null;
  onChange: (t: Partial<DesignTransform>) => void;
  className?: string;
}

export function UVPlacementEditor({
  view,
  colorHex,
  imageUrl,
  transform,
  onChange,
  className = '',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef<{
    clientX: number;
    clientY: number;
    startNormX: number;
    startNormY: number;
  }>({
    clientX: 0,
    clientY: 0,
    startNormX: 0,
    startNormY: 0,
  });

  const normX = transform?.normX ?? 0;
  const normY = transform?.normY ?? 0;
  const scale = transform?.scaleX ?? 1;
  const angle = transform?.angle ?? 0;
  const opacity = transform?.opacity ?? 1;

  // Local state for 120 FPS smooth cursor tracking
  const [localNormX, setLocalNormX] = useState(normX);
  const [localNormY, setLocalNormY] = useState(normY);
  const [isHovered, setIsHovered] = useState(false);
  const [isActivelyDragging, setIsActivelyDragging] = useState(false);

  // Sync local coords when transform updates externally (and not currently dragging)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalNormX(normX);
      setLocalNormY(normY);
    }
  }, [normX, normY]);

  // Dimensions of the interactive box
  const BOX_WIDTH = 260;
  const BOX_HEIGHT = 320;

  // Calibrated print zone extents within the box (matching the t-shirt DTG zone)
  const printZone = useMemo(() => {
    if (view === 'front') {
      return {
        cx: BOX_WIDTH / 2,
        cy: BOX_HEIGHT * 0.44,
        w: BOX_WIDTH * 0.46,
        h: BOX_HEIGHT * 0.43,
      };
    }
    // Back upper-back print zone
    return {
      cx: BOX_WIDTH / 2,
      cy: BOX_HEIGHT * 0.41,
      w: BOX_WIDTH * 0.46,
      h: BOX_HEIGHT * 0.43,
    };
  }, [view]);

  // Convert local normalized coords (-1 to 1) to box pixel coords
  const designPx = useMemo(() => {
    const halfW = printZone.w / 2;
    const halfH = printZone.h / 2;
    const x = printZone.cx + localNormX * halfW;
    const y = printZone.cy + localNormY * halfH;
    const baseW = printZone.w * 0.72;
    const w = Math.max(18, baseW * scale);
    const h = w;
    return { x, y, w, h };
  }, [printZone, localNormX, localNormY, scale]);

  // ── Throttled change dispatcher (requestAnimationFrame) ────────────────────
  const rafRef = useRef<number | null>(null);
  const pendingChangeRef = useRef<Partial<DesignTransform> | null>(null);

  const scheduleChange = useCallback(
    (t: Partial<DesignTransform>) => {
      pendingChangeRef.current = { ...(pendingChangeRef.current ?? {}), ...t };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          if (pendingChangeRef.current) {
            onChange(pendingChangeRef.current);
            pendingChangeRef.current = null;
          }
          rafRef.current = null;
        });
      }
    },
    [onChange],
  );

  // Cancel any pending rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // ── Drag event handlers ───────────────────────────────────────────────────
  const handleStartDrag = useCallback(
    (clientX: number, clientY: number) => {
      isDraggingRef.current = true;
      setIsActivelyDragging(true);
      dragStartPos.current = {
        clientX,
        clientY,
        startNormX: localNormX,
        startNormY: localNormY,
      };
    },
    [localNormX, localNormY],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleStartDrag(e.clientX, e.clientY);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartPos.current.clientX;
      const dy = e.clientY - dragStartPos.current.clientY;

      const halfW = printZone.w / 2;
      const halfH = printZone.h / 2;

      const newNormX = dragStartPos.current.startNormX + dx / halfW;
      const newNormY = dragStartPos.current.startNormY + dy / halfH;

      // Allow creative movement beyond bounds (-1.3 to +1.3)
      const clampedX = Math.max(-1.3, Math.min(1.3, Number(newNormX.toFixed(3))));
      const clampedY = Math.max(-1.3, Math.min(1.3, Number(newNormY.toFixed(3))));

      // Update local state immediately for 120 FPS cursor responsiveness
      setLocalNormX(clampedX);
      setLocalNormY(clampedY);

      // Throttle texture refresh to 3D viewer
      scheduleChange({ normX: clampedX, normY: clampedY });
    },
    [printZone, scheduleChange],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsActivelyDragging(false);
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          // Pointer capture already released
        }

        // Cancel throttled frame and immediately flush final coordinates
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        onChange({ normX: localNormX, normY: localNormY });
        pendingChangeRef.current = null;
      }
    },
    [localNormX, localNormY, onChange],
  );

  // ── Nudge controls (step = 0.05 ~ 5% of print radius) ──────────────────────
  const nudge = useCallback(
    (dx: number, dy: number) => {
      const nextX = Math.max(-1.3, Math.min(1.3, Number((localNormX + dx).toFixed(3))));
      const nextY = Math.max(-1.3, Math.min(1.3, Number((localNormY + dy).toFixed(3))));
      setLocalNormX(nextX);
      setLocalNormY(nextY);
      onChange({ normX: nextX, normY: nextY });
    },
    [localNormX, localNormY, onChange],
  );

  // ── Presets ───────────────────────────────────────────────────────────────
  const applyPreset = useCallback(
    (preset: 'center' | 'left-chest' | 'upper-chest' | 'reset') => {
      switch (preset) {
        case 'center':
          setLocalNormX(0);
          setLocalNormY(0);
          onChange({ normX: 0, normY: 0 });
          break;
        case 'left-chest':
          // Wearer's left chest / pocket position
          setLocalNormX(0.52);
          setLocalNormY(-0.42);
          onChange({ normX: 0.52, normY: -0.42, scaleX: 0.45, scaleY: 0.45 });
          break;
        case 'upper-chest':
          setLocalNormX(0);
          setLocalNormY(-0.55);
          onChange({ normX: 0, normY: -0.55 });
          break;
        case 'reset':
          setLocalNormX(0);
          setLocalNormY(0);
          onChange({ normX: 0, normY: 0, scaleX: 1, scaleY: 1, angle: 0, opacity: 1 });
          break;
      }
    },
    [onChange],
  );

  if (!imageUrl) return null;

  const isDarkColor =
    colorHex.toLowerCase() === '#000000' ||
    colorHex.toLowerCase() === '#141416' ||
    colorHex.toLowerCase() === '#1a1a1e' ||
    colorHex.toLowerCase() === '#0e0e0f';

  const mockupSilhouette =
    view === 'front' ? '/images/mockups/tee-white-front.png' : '/images/mockups/tee-white-back.png';

  return (
    <div
      className={`bg-graphite border border-smoke/30 rounded-xl p-4 flex flex-col gap-3 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ED9518] animate-pulse" />
          <h3 className="font-mono text-caption text-bone uppercase tracking-widest">
            UV Placement
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#ED9518]/20 text-[#ED9518] uppercase font-semibold">
            {view}
          </span>
        </div>
        <button
          onClick={() => applyPreset('reset')}
          className="font-mono text-[10px] text-ash hover:text-pearl transition-colors"
          title="Reset position and scale"
        >
          Reset
        </button>
      </div>

      <p className="font-mono text-[10px] text-ash/80">
        Drag design to reposition on the 3D garment. Updates in real time.
      </p>

      {/* ── Interactive UV Area ───────────────────────────────────────────── */}
      <div className="flex justify-center">
        <div
          ref={containerRef}
          className="relative bg-[#111114] rounded-xl overflow-hidden border border-smoke/30 select-none shadow-inner"
          style={{ width: BOX_WIDTH, height: BOX_HEIGHT }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Garment silhouette layer with shirt color tint */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-2">
            <div
              className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center transition-colors duration-300"
              style={{ backgroundColor: isDarkColor ? '#1c1c22' : colorHex }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mockupSilhouette}
                alt={`${view} garment pattern`}
                className="w-full h-full object-contain pointer-events-none opacity-40 mix-blend-multiply filter contrast-125 select-none"
              />
            </div>
          </div>

          {/* Calibrated DTG Print-Safe Zone with corner brackets */}
          <div
            className="absolute border border-dashed border-[#ED9518]/60 bg-[#ED9518]/10 rounded pointer-events-none transition-all shadow-[0_0_12px_rgba(237,149,24,0.08)]"
            style={{
              left: printZone.cx - printZone.w / 2,
              top: printZone.cy - printZone.h / 2,
              width: printZone.w,
              height: printZone.h,
            }}
          >
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#ED9518]" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-[#ED9518]" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-[#ED9518]" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#ED9518]" />

            {/* Subtle center crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3 h-px bg-[#ED9518]/40" />
              <div className="h-3 w-px bg-[#ED9518]/40 absolute" />
            </div>

            {/* Print Zone label */}
            <span className="absolute -top-4 left-0 font-mono text-[8px] uppercase tracking-widest text-[#ED9518] font-bold">
              {view === 'front' ? 'Chest Print Zone' : 'Back Print Zone'}
            </span>
          </div>

          {/* Draggable Design Item */}
          <div
            onPointerDown={handlePointerDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`absolute flex items-center justify-center select-none touch-none will-change-transform ${
              isActivelyDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              left: designPx.x,
              top: designPx.y,
              width: designPx.w,
              height: designPx.h,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              opacity,
              zIndex: 10,
            }}
            title="Drag to reposition on 3D shirt"
          >
            {/* Artwork image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Custom artwork"
              draggable={false}
              className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-md"
            />

            {/* Selection boundary & resize handles when hovered or dragged */}
            {(isHovered || isActivelyDragging) && (
              <div className="absolute inset-0 border border-[#ED9518] rounded pointer-events-none shadow-[0_0_8px_rgba(237,149,24,0.4)]">
                {/* 4 corner handles */}
                <div className="w-1.5 h-1.5 bg-[#ED9518] absolute -top-1 -left-1 rounded-full" />
                <div className="w-1.5 h-1.5 bg-[#ED9518] absolute -top-1 -right-1 rounded-full" />
                <div className="w-1.5 h-1.5 bg-[#ED9518] absolute -bottom-1 -left-1 rounded-full" />
                <div className="w-1.5 h-1.5 bg-[#ED9518] absolute -bottom-1 -right-1 rounded-full" />
              </div>
            )}
          </div>

          {/* Live coordinate readout pill */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-charcoal/90 border border-smoke/30 backdrop-blur-sm pointer-events-none">
            <span className="font-mono text-[9px] text-pearl/80">
              X: {localNormX >= 0 ? `+${localNormX}` : localNormX} Y:{' '}
              {localNormY >= 0 ? `+${localNormY}` : localNormY}
            </span>
          </div>
        </div>
      </div>

      {/* ── Quick Alignment Presets ────────────────────────────────────────── */}
      <div>
        <span className="font-mono text-[10px] text-ash uppercase tracking-wider block mb-1.5">
          Placement Presets
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => applyPreset('center')}
            className="py-1 px-2 border border-smoke text-[10px] font-mono text-pearl hover:border-[#ED9518] hover:text-[#ED9518] rounded transition-colors text-center"
          >
            Center
          </button>
          <button
            onClick={() => applyPreset('left-chest')}
            className="py-1 px-2 border border-smoke text-[10px] font-mono text-pearl hover:border-[#ED9518] hover:text-[#ED9518] rounded transition-colors text-center"
          >
            Left Chest
          </button>
          <button
            onClick={() => applyPreset('upper-chest')}
            className="py-1 px-2 border border-smoke text-[10px] font-mono text-pearl hover:border-[#ED9518] hover:text-[#ED9518] rounded transition-colors text-center"
          >
            Upper Chest
          </button>
        </div>
      </div>

      {/* ── Nudge D-Pad ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-charcoal/40 border border-smoke/20 rounded-lg p-2">
        <span className="font-mono text-[10px] text-ash uppercase tracking-wider">Fine Nudge</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => nudge(-0.04, 0)}
            className="w-7 h-7 flex items-center justify-center border border-smoke/60 rounded text-pearl hover:border-[#ED9518] hover:text-[#ED9518] transition-colors"
            title="Nudge Left"
          >
            ←
          </button>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => nudge(0, -0.04)}
              className="w-7 h-7 flex items-center justify-center border border-smoke/60 rounded text-pearl hover:border-[#ED9518] hover:text-[#ED9518] transition-colors"
              title="Nudge Up"
            >
              ↑
            </button>
            <button
              onClick={() => nudge(0, 0.04)}
              className="w-7 h-7 flex items-center justify-center border border-smoke/60 rounded text-pearl hover:border-[#ED9518] hover:text-[#ED9518] transition-colors"
              title="Nudge Down"
            >
              ↓
            </button>
          </div>
          <button
            onClick={() => nudge(0.04, 0)}
            className="w-7 h-7 flex items-center justify-center border border-smoke/60 rounded text-pearl hover:border-[#ED9518] hover:text-[#ED9518] transition-colors"
            title="Nudge Right"
          >
            →
          </button>
        </div>
      </div>

      {/* ── Transform Sliders ──────────────────────────────────────────────── */}
      <div className="space-y-3 pt-1 border-t border-smoke/20">
        {/* Scale */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-mono text-[10px] text-ash uppercase tracking-wider">Scale</span>
            <span className="font-mono text-[10px] text-pearl">{Math.round(scale * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.15}
            max={1.5}
            step={0.01}
            value={scale}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange({ scaleX: val, scaleY: val });
            }}
            className="w-full accent-[#ED9518] h-1.5 rounded-full cursor-pointer"
          />
        </div>

        {/* Rotate */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-mono text-[10px] text-ash uppercase tracking-wider">
              Rotation
            </span>
            <span className="font-mono text-[10px] text-pearl">{angle}°</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChange({ angle: Math.round((angle - 15 + 360) % 360) })}
              className="px-2 py-1 border border-smoke/60 rounded text-[10px] font-mono text-pearl hover:border-[#ED9518] hover:text-[#ED9518] transition-colors"
            >
              -15°
            </button>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={angle > 180 ? angle - 360 : angle}
              onChange={(e) => onChange({ angle: Number(e.target.value) })}
              className="flex-1 accent-[#ED9518] h-1.5 rounded-full cursor-pointer"
            />
            <button
              onClick={() => onChange({ angle: Math.round((angle + 15) % 360) })}
              className="px-2 py-1 border border-smoke/60 rounded text-[10px] font-mono text-pearl hover:border-[#ED9518] hover:text-[#ED9518] transition-colors"
            >
              +15°
            </button>
          </div>
        </div>

        {/* Opacity */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="font-mono text-[10px] text-ash uppercase tracking-wider">Opacity</span>
            <span className="font-mono text-[10px] text-pearl">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={opacity}
            onChange={(e) => onChange({ opacity: Number(e.target.value) })}
            className="w-full accent-[#ED9518] h-1.5 rounded-full cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
