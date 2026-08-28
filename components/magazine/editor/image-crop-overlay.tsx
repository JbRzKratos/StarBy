'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import type { ElementCrop, ImageStyle } from '@/types/magazine';

interface ImageCropOverlayProps {
  src: string;
  crop?: ElementCrop | undefined;
  imageStyle?: ImageStyle | undefined;
  isCropMode: boolean;
  onUpdateCrop: (newCrop: ElementCrop) => void;
  onExitCropMode: () => void;
}

export function ImageCropOverlay({
  src,
  crop = { scale: 1, offsetX: 0, offsetY: 0 },
  imageStyle,
  isCropMode,
  onUpdateCrop,
  onExitCropMode,
}: ImageCropOverlayProps) {
  const [scale, setScale] = useState(crop.scale || 1);
  const [offset, setOffset] = useState({ x: crop.offsetX || 0, y: crop.offsetY || 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isCropMode) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: offset.x,
      initY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    e.stopPropagation();
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    const newX = dragStartRef.current.initX + dx;
    const newY = dragStartRef.current.initY + dy;
    setOffset({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(false);
    dragStartRef.current = null;
    onUpdateCrop({ scale, offsetX: offset.x, offsetY: offset.y });
  };

  const handleZoomChange = (newScale: number) => {
    setScale(newScale);
    onUpdateCrop({ scale: newScale, offsetX: offset.x, offsetY: offset.y });
  };

  const borderRadius = `${imageStyle?.borderRadius || 0}px`;

  return (
    <div className="w-full h-full relative overflow-hidden select-none" style={{ borderRadius }}>
      {/* ── Inner Croppable / Pannable Image ── */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`w-full h-full relative ${
          isCropMode ? 'cursor-grab active:cursor-grabbing ring-2 ring-emerald-400' : ''
        }`}
        style={{
          transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <Image
          src={src}
          alt="Magazine Graphic"
          fill
          sizes="800px"
          draggable={false}
          className={`pointer-events-none ${
            imageStyle?.objectFit === 'contain'
              ? 'object-contain'
              : imageStyle?.objectFit === 'fill'
                ? 'object-fill'
                : 'object-cover'
          }`}
        />
      </div>

      {/* ── Crop Controls Floating Toolbar in Crop Mode ── */}
      {isCropMode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#0E0E10] border border-emerald-400/50 px-3 py-1.5 rounded-lg shadow-2xl z-50 pointer-events-auto"
        >
          <span className="font-mono text-[9px] uppercase font-bold text-emerald-400">
            Pan & Zoom Crop
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleZoomChange(Math.max(1, scale - 0.2))}
              className="w-5 h-5 bg-[#1F1F24] rounded text-white text-xs hover:bg-[#2A2A32] flex items-center justify-center font-bold"
            >
              -
            </button>
            <span className="font-mono text-[10px] text-white min-w-[32px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => handleZoomChange(Math.min(3.5, scale + 0.2))}
              className="w-5 h-5 bg-[#1F1F24] rounded text-white text-xs hover:bg-[#2A2A32] flex items-center justify-center font-bold"
            >
              +
            </button>
          </div>
          <button
            onClick={onExitCropMode}
            className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 font-mono text-[9px] text-black font-bold uppercase rounded shadow-sm"
          >
            Done ✓
          </button>
        </div>
      )}
    </div>
  );
}
