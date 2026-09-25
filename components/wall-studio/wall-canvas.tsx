'use client';

import React, { useRef, useEffect } from 'react';
import { useWallStudioStore } from '@/lib/wall-studio/store';
import { WallSlotItem } from './wall-slot-item';
import { gsap } from 'gsap';
import { Ruler } from 'lucide-react';

export const WallCanvas: React.FC = () => {
  const {
    currentLayout,
    selections,
    activeSlotId,
    viewMode,
    cleanWallColor,
    setActiveSlot,
    toggleLockSlot,
    removeSlotArtwork,
    openPickerForSlot,
    openCustomUploadForSlot,
  } = useWallStudioStore();

  const canvasRef = useRef<HTMLDivElement>(null);

  // Aspect ratio calculation from physical wall millimeters
  const aspectRatio = currentLayout.wallWidthMm / currentLayout.wallHeightMm;

  // Animate on layout change
  useEffect(() => {
    if (canvasRef.current) {
      gsap.fromTo(
        canvasRef.current,
        { opacity: 0.6, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' },
      );
    }
  }, [currentLayout.id]);

  return (
    <div
      onClick={() => setActiveSlot(null)}
      className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden select-none"
      style={{
        backgroundColor: cleanWallColor,
        transition: 'background-color 0.4s ease',
      }}
    >
      {/* ─── ARCHITECTURAL STUDIO WALL LIGHTING & FLOOR ─── */}
      {/* Subtle downward spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[60%] bg-gradient-to-b from-white/[0.06] via-white/[0.015] to-transparent pointer-events-none rounded-full blur-3xl" />

      {/* Gallery floor baseboard shadow line */}
      <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none border-t border-white/[0.04]" />

      {/* Minimalist wall coverage indicator at bottom-left */}
      <div className="absolute bottom-3 left-4 hidden sm:flex items-center gap-2 text-white/30 text-[11px] font-mono pointer-events-none z-10">
        <Ruler className="w-3.5 h-3.5 text-[#3B5EFF]/60" />
        <span>{currentLayout.coverageLabel}</span>
      </div>

      {/* ─── PRINT MAP MODE BLUEPRINT GRID ─── */}
      {viewMode === 'print-map' && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(59,94,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,94,255,0.2) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* ─── THE CORE WALL COMPOSITION CONTAINER ─── */}
      <div
        ref={canvasRef}
        className="relative z-10 transition-all duration-300"
        style={{
          aspectRatio: `${aspectRatio}`,
          width: `min(92%, calc(82vh * ${aspectRatio}))`,
          maxHeight: '82vh',
          maxWidth: '94%',
        }}
      >

        {/* Dimension Border Lines in Print Map Mode */}
        {viewMode === 'print-map' && (
          <div className="absolute -inset-6 border border-dashed border-[#3B5EFF]/40 pointer-events-none flex flex-col justify-between p-1 text-[10px] font-mono text-[#3B5EFF]">
            <div className="flex justify-between">
              <span>0,0</span>
              <span>
                ↔ {currentLayout.wallWidthMm} mm (
                {currentLayout.coverageLabel.split('×')[0]?.trim() || ''})
              </span>
            </div>
            <div className="flex justify-between items-end">
              <span>↕ {currentLayout.wallHeightMm} mm</span>
              <span>{currentLayout.physicalPrintCount} PHYSICAL PIECES</span>
            </div>
          </div>
        )}

        {/* ─── RENDER SLOTS FROM NORMALIZED COORDINATES ─── */}
        {currentLayout.slots.map((slot, index) => {
          const selection = selections[slot.id];
          const splitGroup = slot.splitGroupId
            ? currentLayout.splitGroups.find((g) => g.splitGroupId === slot.splitGroupId)
            : undefined;
          const groupSlots = slot.splitGroupId
            ? currentLayout.slots.filter((s) => s.splitGroupId === slot.splitGroupId)
            : undefined;

          return (
            <WallSlotItem
              key={slot.id}
              slot={slot}
              selection={selection}
              splitGroup={splitGroup}
              groupSlots={groupSlots}
              isActive={activeSlotId === slot.id}
              onSelect={(id) => {
                setActiveSlot(id);
                // Open poster picker immediately on slot click
                openPickerForSlot(id);
              }}
              onToggleLock={toggleLockSlot}
              onRemove={removeSlotArtwork}
              onOpenCustomUpload={openCustomUploadForSlot}
              isPrintMapMode={viewMode === 'print-map'}
              panelNumber={index + 1}
            />
          );
        })}
      </div>
    </div>
  );
};
