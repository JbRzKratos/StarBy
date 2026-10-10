'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useWallStudioStore } from '@/lib/wall-studio/store';
import { FREGORO_LAYOUTS } from '@/lib/wall-studio/layouts-data';
import { X, Check, Layers, Ruler, Grid3X3, Sparkles } from 'lucide-react';

export const LayoutSelectorModal: React.FC = () => {
  const { isLayoutSelectorOpen, currentLayout, closeLayoutSelector, setLayout, layoutPrices } =
    useWallStudioStore();

  const [activeTab, setActiveTab] = useState<'all' | 'hybrid' | 'gallery'>('all');

  // Close on Escape key
  useEffect(() => {
    if (!isLayoutSelectorOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLayoutSelector();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLayoutSelectorOpen, closeLayoutSelector]);

  // Curate to only pristine architectural layouts (16 Hybrid + 7 Gallery)
  const curatedLayouts = useMemo(() => {
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
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLayoutSelector();
      }}
      className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-h-[90dvh] max-w-5xl bg-[#0E0F13] sm:border sm:border-white/10 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* ─── MODAL HEADER ─── */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 bg-black/60 shrink-0 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#3B5EFF] font-bold">
                  Studio Composition Library
                </span>
                <span className="text-[10px] font-mono text-white/50 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                  {curatedLayouts.length} Formats
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-bold text-white tracking-tight mt-0.5">
                Select Wall Layout
              </h2>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={closeLayoutSelector}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer shrink-0"
              aria-label="Close layout selector"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Category Filter Pills (Smooth horizontal scroll on mobile with no awkward clipping) */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5 -mx-1 px-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 min-h-[34px] flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-[#3B5EFF] text-white shadow-md shadow-[#3B5EFF]/25'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <span>All Formats</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'
                }`}
              >
                {curatedLayouts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hybrid')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 min-h-[34px] flex items-center gap-1.5 ${
                activeTab === 'hybrid'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25 font-bold'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <Sparkles
                className={`w-3.5 h-3.5 ${activeTab === 'hybrid' ? 'text-black' : 'text-amber-400'}`}
              />
              <span>Split + Frame Combos</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeTab === 'hybrid' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/40'
                }`}
              >
                16
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 min-h-[34px] flex items-center gap-1.5 ${
                activeTab === 'gallery'
                  ? 'bg-[#3B5EFF] text-white shadow-md shadow-[#3B5EFF]/25 font-bold'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Gallery Walls</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeTab === 'gallery' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'
                }`}
              >
                7
              </span>
            </button>
          </div>
        </div>

        {/* ─── MOBILE VIEW (< sm / 640px): DEDICATED HIGH-VISIBILITY TOUCH LIST ─── */}
        <div className="sm:hidden flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 bg-[#090A0D]">
          {filteredLayouts.map((layout) => {
            const isCurrent = currentLayout.id === layout.id;
            const sizesList = Array.from(new Set(layout.slots.map((s) => s.size))).join(', ');
            const effectivePrice =
              layoutPrices[layout.slug] ?? layoutPrices[layout.id] ?? layout.basePrice;
            const effectiveCompareAt =
              layout.compareAtPrice ?? Math.round(effectivePrice * 1.35);

            return (
              <div
                key={layout.id}
                onClick={() => setLayout(layout.id)}
                className={`w-full rounded-xl p-3 flex items-center gap-3.5 transition-all duration-200 cursor-pointer border shrink-0 ${
                  isCurrent
                    ? 'bg-[#3B5EFF]/15 border-[#3B5EFF] shadow-lg shadow-[#3B5EFF]/20 ring-1 ring-[#3B5EFF]'
                    : 'bg-[#121319] border-white/10 active:bg-white/5 hover:border-white/25'
                }`}
              >
                {/* Left: Dynamic Mini Wall Diagram Thumbnail */}
                <div className="relative w-[104px] h-[84px] shrink-0 bg-[#060709] rounded-lg border border-white/10 flex items-center justify-center p-1.5 overflow-hidden shadow-inner">
                  <div
                    className="relative shrink-0"
                    style={{
                      aspectRatio: `${layout.wallWidthMm} / ${layout.wallHeightMm}`,
                      height: '58px',
                      maxWidth: '92px',
                    }}
                  >
                    {layout.slots.map((slot) => (
                      <div
                        key={slot.id}
                        style={{
                          position: 'absolute',
                          left: `${slot.x * 100}%`,
                          top: `${slot.y * 100}%`,
                          width: `${slot.width * 100}%`,
                          height: `${slot.height * 100}%`,
                        }}
                        className={`rounded-[1px] border ${
                          slot.splitGroupId
                            ? 'bg-[#3B5EFF]/45 border-[#3B5EFF] shadow-[0_0_6px_rgba(59,94,255,0.4)]'
                            : slot.slotType === 'hero'
                              ? 'bg-amber-500/40 border-amber-400'
                              : 'bg-white/20 border-white/45'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Active Selected Check Badge on Thumbnail */}
                  {isCurrent && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#3B5EFF] text-white flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Right: Layout Information */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  {/* Category Pill & Price */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider font-bold ${
                        layout.category === 'hybrid' ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {layout.category === 'hybrid' ? '✦ Split Combo' : 'Gallery Wall'}
                    </span>
                    <div className="flex items-baseline gap-1 shrink-0">
                      <span className="text-sm font-extrabold text-white">₹{effectivePrice}</span>
                      {effectiveCompareAt > effectivePrice && (
                        <span className="text-[10px] text-white/40 line-through font-mono">
                          ₹{effectiveCompareAt}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Layout Title */}
                  <h3 className="text-xs font-bold text-white leading-tight truncate mt-0.5">
                    {layout.name}
                  </h3>

                  {/* Print Count & Sizes */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/60 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-white/90 font-medium">
                      <Layers className="w-3 h-3 text-[#3B5EFF] shrink-0" />
                      <span>{layout.physicalPrintCount} Prints</span>
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/50 text-[10px] truncate max-w-[130px]">
                      {sizesList}
                    </span>
                  </div>

                  {/* Wall Coverage & Selection Indicator */}
                  <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                    <span className="flex items-center gap-1 text-white/50">
                      <Ruler className="w-3 h-3 text-white/40 shrink-0" />
                      <span>{layout.coverageLabel}</span>
                    </span>

                    {isCurrent ? (
                      <span className="text-[10px] font-bold text-[#3B5EFF] flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/40 font-sans font-medium">
                        Select →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── DESKTOP / TABLET VIEW (>= sm / 640px): ARCHITECTURAL GRID ─── */}
        <div className="hidden sm:grid flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 grid-cols-2 lg:grid-cols-3 gap-4 bg-[#0A0B0E]">
          {filteredLayouts.map((layout) => {
            const isCurrent = currentLayout.id === layout.id;
            const sizesList = Array.from(new Set(layout.slots.map((s) => s.size))).join(', ');
            const effectivePrice =
              layoutPrices[layout.slug] ?? layoutPrices[layout.id] ?? layout.basePrice;
            const effectiveCompareAt =
              layout.compareAtPrice ?? Math.round(effectivePrice * 1.35);

            return (
              <div
                key={layout.id}
                onClick={() => setLayout(layout.id)}
                className={`group relative rounded-xl overflow-hidden bg-black/40 border transition-all duration-300 cursor-pointer flex flex-col min-h-[245px] shrink-0 ${
                  isCurrent
                    ? 'border-[#3B5EFF] ring-2 ring-[#3B5EFF]/50 shadow-xl shadow-[#3B5EFF]/15 bg-white/[0.02]'
                    : 'border-white/10 hover:border-white/30 hover:bg-white/[0.02]'
                }`}
              >
                {/* Real Dynamic Layout Diagram */}
                <div className="relative w-full h-[140px] shrink-0 bg-[#07080B] p-4 flex items-center justify-center border-b border-white/5 overflow-hidden">
                  <div
                    className="relative transition-transform duration-300 group-hover:scale-105 shrink-0"
                    style={{
                      aspectRatio: `${layout.wallWidthMm} / ${layout.wallHeightMm}`,
                      height: '92px',
                      width: `min(220px, calc(92px * ${layout.wallWidthMm / layout.wallHeightMm}))`,
                      maxWidth: '88%',
                    }}
                  >
                    {layout.slots.map((slot) => (
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
                    ))}
                  </div>

                  {/* Active Selected Check Badge */}
                  {isCurrent && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#3B5EFF] text-white flex items-center justify-center shadow-lg">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}
                </div>

                {/* Info Card Body */}
                <div className="p-3.5 flex flex-col justify-between gap-2.5 flex-1 min-h-[90px]">
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
                        <span className="text-sm font-bold text-white">₹{effectivePrice}</span>
                        {effectiveCompareAt > effectivePrice && (
                          <span className="text-xs text-white/40 line-through font-mono">
                            ₹{effectiveCompareAt}
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

        {/* ─── MODAL FOOTER ─── */}
        <div className="p-3 sm:px-5 border-t border-white/10 bg-black/75 shrink-0 flex items-center justify-between gap-3 text-xs text-white/50 font-mono">
          <div className="min-w-0 flex-1">
            <div className="text-white text-xs font-semibold truncate sm:hidden">
              Active: <span className="text-[#3B5EFF]">{currentLayout.name}</span>
            </div>
            <span className="hidden sm:inline">
              Physical dimensions calibrated to international A3, A4 & A5 standards
            </span>
          </div>
          <button
            type="button"
            onClick={closeLayoutSelector}
            className="px-5 py-2 sm:py-1.5 rounded-lg bg-[#3B5EFF] sm:bg-white/10 text-white hover:bg-[#3B5EFF]/90 sm:hover:bg-white/20 font-medium transition-colors cursor-pointer text-xs shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
