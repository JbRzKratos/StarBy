'use client';

import React, { useMemo } from 'react';
import type { WallSlot, SlotSelection, WallSplitGroup } from '@/lib/wall-studio/types';
import { calculatePanelSlice } from '@/lib/wall-studio/split-engine';
import { Lock, Unlock, X, Plus, Sparkles, Image as ImageIcon } from 'lucide-react';

interface WallSlotItemProps {
  slot: WallSlot;
  selection?: SlotSelection;
  splitGroup?: WallSplitGroup;
  groupSlots?: WallSlot[];
  isActive: boolean;
  onSelect: (slotId: string) => void;
  onToggleLock: (slotId: string) => void;
  onRemove: (slotId: string) => void;
  onOpenCustomUpload: (slotId: string) => void;
  isPrintMapMode?: boolean;
  panelNumber: number;
}

export const WallSlotItem: React.FC<WallSlotItemProps> = ({
  slot,
  selection,
  splitGroup,
  groupSlots,
  isActive,
  onSelect,
  onToggleLock,
  onRemove,
  onOpenCustomUpload,
  isPrintMapMode = false,
  panelNumber,
}) => {
  const [hasImgError, setHasImgError] = React.useState(false);
  const isFilled = !!selection?.imageUrl && !hasImgError;
  const isLocked = selection?.isLocked || false;
  const isSplit = !!slot.splitGroupId && !!splitGroup;

  // Reset img error on selection change
  React.useEffect(() => {
    setHasImgError(false);
  }, [selection?.imageUrl]);

  // Split slice coordinate calculation for continuous panel art
  const splitSlice = useMemo(() => {
    if (!isSplit || slot.panelIndex === undefined || slot.panelIndex === null) {
      return null;
    }
    return calculatePanelSlice(slot.panelIndex, splitGroup.panelCount, slot, groupSlots);
  }, [isSplit, slot, splitGroup, groupSlots]);

  // Normalized coordinate styles
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${slot.x * 100}%`,
    top: `${slot.y * 100}%`,
    width: `${slot.width * 100}%`,
    height: `${slot.height * 100}%`,
    transform: slot.rotation ? `rotate(${slot.rotation}deg)` : undefined,
    transformOrigin: 'center center',
    zIndex: isActive ? 20 : 10,
  };

  return (
    <div
      style={containerStyle}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(slot.id);
      }}
      className={`group cursor-pointer select-none transition-all duration-300 ${
        isActive
          ? 'ring-2 ring-[#3B5EFF] ring-offset-2 ring-offset-black shadow-2xl scale-[1.01]'
          : 'hover:ring-1 hover:ring-white/40'
      }`}
    >
      {/* Outer physical print frame */}
      <div
        className={`relative w-full h-full overflow-hidden transition-all duration-300 rounded-[2px] shadow-lg ${
          isFilled
            ? 'bg-black shadow-[0_12px_32px_rgba(0,0,0,0.55)] border border-white/10'
            : 'bg-white/[0.03] border border-dashed border-white/20 hover:border-white/50 backdrop-blur-xs'
        }`}
      >
        {/* FILLED STATE */}
        {isFilled && selection && (
          <div className="relative w-full h-full">
            {/* Split panel continuous rendering */}
            {isSplit && splitSlice ? (
              <div
                className="w-full h-full bg-no-repeat"
                style={{
                  backgroundImage: `url(${selection.imageUrl})`,
                  backgroundSize: `${splitSlice.bgSizeXPercent}% ${splitSlice.bgSizeYPercent}%`,
                  backgroundPosition: `${splitSlice.bgPositionXPercent}% ${splitSlice.bgPositionYPercent}%`,
                }}
              />
            ) : (
              /* Single poster continuous/zoom fit */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selection.imageUrl}
                alt={selection.title || 'Selected artwork'}
                onError={() => setHasImgError(true)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                style={
                  selection.cropData
                    ? {
                        objectPosition: `${selection.cropData.focusX * 100}% ${selection.cropData.focusY * 100}%`,
                        transform: `scale(${selection.cropData.zoom || 1})`,
                      }
                    : undefined
                }
              />
            )}

            {/* Subtle glass reflection overlay for high-end exhibition realism */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />

            {/* Top-Right Quick Badge & Controls */}
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
              {/* Lock toggle */}
              <button
                type="button"
                title={isLocked ? 'Unlock poster' : 'Lock poster (prevents shuffle/theme fill)'}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(slot.id);
                }}
                className={`p-1 rounded backdrop-blur-md transition-colors ${
                  isLocked
                    ? 'bg-[#3B5EFF] text-white'
                    : 'bg-black/60 text-white/70 hover:text-white'
                }`}
              >
                {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </button>

              {/* Edit custom crop if custom upload */}
              {selection.isCustomUpload && (
                <button
                  type="button"
                  title="Adjust crop & zoom"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCustomUpload(slot.id);
                  }}
                  className="p-1 rounded bg-black/60 text-white/70 hover:text-white backdrop-blur-md transition-colors"
                >
                  <ImageIcon className="w-3 h-3" />
                </button>
              )}

              {/* Remove */}
              <button
                type="button"
                title="Remove poster"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(slot.id);
                }}
                className="p-1 rounded bg-black/60 text-white/70 hover:text-red-400 backdrop-blur-md transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Persistent Lock indicator when locked */}
            {isLocked && (
              <div className="absolute top-1.5 left-1.5 p-1 rounded bg-black/70 backdrop-blur-md text-[#3B5EFF]">
                <Lock className="w-2.5 h-2.5" />
              </div>
            )}
          </div>
        )}

        {/* EMPTY STATE */}
        {!isFilled && (
          <div className="flex flex-col items-center justify-center w-full h-full p-1 sm:p-2 text-center overflow-hidden">
            <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white/10 flex items-center justify-center text-white/60 group-hover:bg-[#3B5EFF] group-hover:text-white transition-colors duration-200 mb-0.5 sm:mb-1 shrink-0">
              <Plus className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            </div>
            <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-wider text-white/50 group-hover:text-white font-medium truncate max-w-full">
              {slot.size}
            </span>
            {slot.slotType === 'hero-panel' && (
              <span className="text-[7px] sm:text-[8px] text-[#3B5EFF] font-mono mt-0.5 truncate max-w-full">
                P{(slot.panelIndex || 0) + 1}
              </span>
            )}
            {slot.slotType === 'hero' && (
              <span className="text-[7px] sm:text-[8px] text-amber-400 font-mono mt-0.5 flex items-center gap-0.5 truncate max-w-full">
                <Sparkles className="w-2 h-2 shrink-0" /> Hero
              </span>
            )}
          </div>
        )}

        {/* PRINT MAP OVERLAY MODE (Shows exact numbered specs & dimensions) */}
        {isPrintMapMode && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-0.5 sm:p-1 text-center font-mono pointer-events-none border border-[#3B5EFF]/50 overflow-hidden">
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#3B5EFF] text-white text-[8px] sm:text-[10px] font-bold flex items-center justify-center mb-0.5 sm:mb-1 shrink-0">
              {panelNumber}
            </span>
            <span className="text-[8px] sm:text-[10px] text-white font-bold leading-tight truncate max-w-full">
              {slot.size}
            </span>
            <span className="text-[7px] sm:text-[8px] text-white/60 truncate max-w-full hidden xs:block">
              {slot.physicalWidthMm} × {slot.physicalHeightMm} mm
            </span>
            {isSplit && (
              <span className="text-[7px] sm:text-[7.5px] text-[#3B5EFF] mt-0.5 truncate max-w-full">
                Split P{(slot.panelIndex || 0) + 1}/{splitGroup?.panelCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Role Pill label underneath when active */}
      {isActive && !isPrintMapMode && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#3B5EFF] text-white text-[8px] sm:text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded shadow pointer-events-none z-30">
          {slot.label || `${slot.size} ${slot.slotType}`}
        </div>
      )}
    </div>
  );
};
