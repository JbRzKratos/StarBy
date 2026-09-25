'use client';

import React, { useState, useMemo } from 'react';
import { useWallStudioStore } from '@/lib/wall-studio/store';
import { FREGORO_LAYOUTS } from '@/lib/wall-studio/layouts-data';
import { X, Check, Layers, Ruler, Grid3X3, Sparkles } from 'lucide-react';

export const LayoutSelectorModal: React.FC = () => {
  const { isLayoutSelectorOpen, currentLayout, closeLayoutSelector, setLayout } =
    useWallStudioStore();

  const [activeTab, setActiveTab] = useState<'all' | 'hybrid' | 'gallery'>('all');

  // Curate to only pristine architectural layouts (filter out legacy duplicates)
  const curatedLayouts = useMemo(() => {
    // Curated active layouts: 16 Official Catalog Hybrid Combos & 7 Gallery Walls
    const activeLayoutIds = [
      // 16 Official Catalog Hybrid Split + Frame Combos
      'hybrid-stepped-triptych-flank-5',
      'hybrid-stepped-triptych-crown-7',
      'hybrid-stepped-wave-flank-9',
      'hybrid-stepped-wave-heritage-11',
      'hybrid-grid2x2-heritage-6',
      'hybrid-grid3x2-panoramic-10',
      'hybrid-grid3x3-matrix-11',
      'hybrid-classic3-horizon-sandwich-9',
      'hybrid-classic4-cinema-8',
      'hybrid-classic5-grand-panorama-9',
      'hybrid-vertical3-totem-flank-7',
      'hybrid-vertical4-monolith-8',
      'hybrid-stepped-triptych-quadwing-9',
      'hybrid-grid2x2-windowpane-8',
      'hybrid-classic3-cinema-a3-7',
      'hybrid-vertical5-spire-11',
      // 7 Curated Gallery Walls
      'compact-01',
      'classic-02',
      'studio-03',
      'matrix-3x3-18',
      'salon-asymmetric-19',
      'vertical-tower-21',
      'quad-accent-22',
    ];

    return FREGORO_LAYOUTS.filter((l) => activeLayoutIds.includes(l.id));
  }, []);

  const filteredLayouts = useMemo(() => {
    return curatedLayouts.filter((layout) => {
      // Tab filter
      if (activeTab === 'hybrid' && layout.category !== 'hybrid') return false;
      if (activeTab === 'gallery' && layout.category !== 'gallery') return false;
      return true;
    });
  }, [curatedLayouts, activeTab]);

  if (!isLayoutSelectorOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose Wall Layout"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl bg-[#0E0F13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] max-h-[92dvh]">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#3B5EFF] font-bold">
                Studio Composition Library
              </span>
              <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                {curatedLayouts.length} Formats
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-bold text-white tracking-tight mt-0.5">
              Select Your Wall Format
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Minimalist Segmented Tabs with edge scroll affordance */}
            <div className="relative flex-1 sm:flex-initial overflow-hidden">
              <div className="flex items-center p-1 bg-black/60 rounded-xl border border-white/10 text-xs font-medium overflow-x-auto hide-scrollbar snap-x max-w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap min-h-[36px] flex items-center snap-start ${
                    activeTab === 'all'
                      ? 'bg-[#3B5EFF] text-white shadow font-semibold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('hybrid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap min-h-[36px] snap-start ${
                    activeTab === 'hybrid'
                      ? 'bg-amber-500 text-white shadow font-semibold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Split + Frame Combos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('gallery')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap min-h-[36px] snap-start ${
                    activeTab === 'gallery'
                      ? 'bg-[#3B5EFF] text-white shadow font-semibold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>Gallery Walls</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={closeLayoutSelector}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Close layout selector"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Layout Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLayouts.map((layout) => {
            const isCurrent = currentLayout.id === layout.id;

            // Unique size breakdown
            const sizesList = Array.from(new Set(layout.slots.map((s) => s.size))).join(', ');

            return (
              <div
                key={layout.id}
                onClick={() => setLayout(layout.id)}
                className={`group relative rounded-xl overflow-hidden bg-black/40 border transition-all duration-300 cursor-pointer flex flex-col ${
                  isCurrent
                    ? 'border-[#3B5EFF] ring-2 ring-[#3B5EFF]/50 shadow-xl shadow-[#3B5EFF]/15 bg-white/[0.02]'
                    : 'border-white/10 hover:border-white/30 hover:bg-white/[0.02]'
                }`}
              >
                {/* ─── REAL DYNAMIC LAYOUT DIAGRAM (Exact Slots Representation, Clean & Uncluttered) ─── */}
                <div className="relative w-full h-[135px] bg-[#07080B] p-4 flex items-center justify-center border-b border-white/5 overflow-hidden">
                  <div
                    className="relative transition-transform duration-300 group-hover:scale-105 shrink-0"
                    style={{
                      aspectRatio: `${layout.wallWidthMm} / ${layout.wallHeightMm}`,
                      height: '90px',
                      width: `min(220px, calc(90px * ${layout.wallWidthMm / layout.wallHeightMm}))`,
                      maxWidth: '88%',
                    }}
                  >
                    {layout.slots.map((slot) => {
                      return (
                        <div
                          key={slot.id}
                          style={{
                            position: 'absolute',
                            left: `${slot.x * 100}%`,
                            top: `${slot.y * 100}%`,
                            width: `${slot.width * 100}%`,
                            height: `${slot.height * 100}%`,
                          }}
                          className={`rounded-[1.5px] border transition-colors ${
                            slot.splitGroupId
                              ? 'bg-[#3B5EFF]/30 border-[#3B5EFF] shadow-[0_0_8px_rgba(59,94,255,0.25)]'
                              : slot.slotType === 'hero'
                                ? 'bg-amber-500/30 border-amber-400'
                                : 'bg-white/15 border-white/30'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Active Selected Check Badge */}
                  {isCurrent && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#3B5EFF] text-white flex items-center justify-center shadow-lg">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Info Card Body (Clean, minimal, zero text clutter) */}
                <div className="p-3.5 flex flex-col justify-between gap-2.5 flex-1">
                  <div>
                    {/* Header Row: Category Tag & Price */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[9px] font-mono uppercase tracking-wider font-semibold ${
                          layout.category === 'hybrid' ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {layout.category === 'hybrid' ? '✦ Split + Frames' : 'Gallery Wall'}
                      </span>
                      <div className="flex items-baseline gap-1.5 shrink-0">
                        <span className="text-sm font-bold text-white">₹{layout.basePrice}</span>
                        {layout.compareAtPrice && (
                          <span className="text-xs text-white/40 line-through font-mono">
                            ₹{layout.compareAtPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Layout Title */}
                    <h3 className="text-sm font-bold text-white group-hover:text-[#3B5EFF] transition-colors mt-1 leading-snug">
                      {layout.name}
                    </h3>
                  </div>

                  {/* Meta Specs Footer */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/50">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-[#3B5EFF]" />
                      <span className="text-white/80 font-medium">
                        {layout.physicalPrintCount} Prints
                      </span>
                      <span className="text-white/40">({sizesList})</span>
                    </span>

                    <span className="flex items-center gap-1 text-white/70">
                      <Ruler className="w-3 h-3 text-white/40" />
                      <span>{layout.coverageLabel}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:px-5 border-t border-white/10 bg-black/60 flex items-center justify-between text-xs text-white/50 font-mono">
          <span>Physical dimensions calibrated to international A3, A4 & A5 standards</span>
          <button
            type="button"
            onClick={closeLayoutSelector}
            className="px-4 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
