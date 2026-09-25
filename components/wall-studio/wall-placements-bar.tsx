'use client';

import React from 'react';
import { useWallStudioStore } from '@/lib/wall-studio/store';
import { FREGORO_DESIGN_PLACEMENTS } from '@/lib/wall-studio/design-placements';
import { Sparkles, Trash2 } from 'lucide-react';

export const WallPlacementsBar: React.FC = () => {
  const { currentLayout, openPlacementsModal, applyDesignPlacement, clearAllSlots } =
    useWallStudioStore();

  return (
    <div className="relative z-20 w-full bg-[#0B0C10] border-b border-white/10 px-3 sm:px-6 py-1.5 flex items-center justify-between gap-3 shrink-0 select-none">
      {/* ─── LEFT / SCROLLABLE PILLS CONTAINER ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 flex-1 min-w-0">
        {/* Full Modal Trigger */}
        <button
          type="button"
          onClick={openPlacementsModal}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3B5EFF] hover:bg-[#2F4ED8] text-white text-xs font-semibold shadow-sm transition-all shrink-0"
        >
          <Sparkles className="w-3 h-3" />
          <span>All Placements</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">
            {FREGORO_DESIGN_PLACEMENTS.length}
          </span>
        </button>

        <div className="h-3.5 w-px bg-white/15 shrink-0 mx-1" />

        {/* 1-Click Placement Pills */}
        {FREGORO_DESIGN_PLACEMENTS.map((p) => {
          const isCurrent = currentLayout.id === p.layoutId || currentLayout.slug === p.layoutSlug;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => applyDesignPlacement(p)}
              title={`${p.title} (${p.physicalPrintCount} Prints • ${p.coverageLabel})`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                isCurrent
                  ? 'bg-white/20 text-white border border-[#3B5EFF] shadow'
                  : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: p.accentColor }}
              />
              <span className="truncate max-w-[130px]">{p.title.split(':')[0]}</span>
              <span className="text-[10px] text-white/40 font-mono">{p.physicalPrintCount}P</span>
            </button>
          );
        })}
      </div>

      {/* ─── RIGHT: BLANK CANVAS QUICK ACTION ─── */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-white/10">
        <button
          type="button"
          onClick={clearAllSlots}
          title="Clear all poster slots to design on a blank wall"
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-xs font-mono transition-all shrink-0"
        >
          <Trash2 className="w-3 h-3" />
          <span className="hidden sm:inline">Blank Wall</span>
        </button>
      </div>
    </div>
  );
};
