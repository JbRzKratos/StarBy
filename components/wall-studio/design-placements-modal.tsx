'use client';

import React, { useState, useMemo } from 'react';
import { useWallStudioStore } from '@/lib/wall-studio/store';
import { FREGORO_DESIGN_PLACEMENTS } from '@/lib/wall-studio/design-placements';
import { X, Sparkles, Ruler, Check, Search, Trash2, ChevronRight } from 'lucide-react';

export const DesignPlacementsModal: React.FC = () => {
  const {
    isPlacementsModalOpen,
    currentLayout,
    closePlacementsModal,
    applyDesignPlacement,
    clearAllSlots,
  } = useWallStudioStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<'all' | 'hybrid' | 'gallery'>('all');
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<string>('all');

  // Extract unique themes from placements
  const themeOptions = useMemo(() => {
    const map = new Map<string, string>();
    map.set('all', 'All Themes');
    FREGORO_DESIGN_PLACEMENTS.forEach((p) => {
      if (!map.has(p.themeSlug)) {
        map.set(p.themeSlug, p.themeName.split('/')[0]?.trim() || p.themeName);
      }
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, []);

  // Filter placements
  const filteredPlacements = useMemo(() => {
    return FREGORO_DESIGN_PLACEMENTS.filter((p) => {
      const isHybrid = p.layoutId.startsWith('hybrid-');
      if (selectedFormatFilter === 'hybrid' && !isHybrid) return false;
      if (selectedFormatFilter === 'gallery' && isHybrid) return false;

      const matchesTheme = selectedThemeFilter === 'all' || p.themeSlug === selectedThemeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.themeName.toLowerCase().includes(q) ||
        p.layoutSlug.toLowerCase().includes(q);
      return matchesTheme && matchesSearch;
    });
  }, [selectedFormatFilter, selectedThemeFilter, searchQuery]);

  if (!isPlacementsModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Curated Design Placements"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-6xl bg-[#0C0D11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* ─── MODAL HEADER ─── */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-black/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#3B5EFF] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#3B5EFF]" />
                Curated Design Placements
              </span>
              <span className="text-[10px] font-mono bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
                {FREGORO_DESIGN_PLACEMENTS.length} Pre-Composed Sets
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
              Themed Wall Placements Library
            </h2>
            <p className="text-xs text-white/50 font-mono mt-0.5 max-w-2xl">
              Art-directed wall art combining central multi-panel continuous splits with surrounding complementary prints. Select any placement to load onto your studio canvas.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {/* Clear All Wall Prints button */}
            <button
              type="button"
              onClick={() => {
                clearAllSlots();
                closePlacementsModal();
              }}
              title="Clear all poster slots to start from scratch"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Blank Canvas</span>
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={closePlacementsModal}
              className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── FILTERS & SEARCH TOOLBAR ─── */}
        <div className="p-3 sm:px-6 border-b border-white/5 bg-white/[0.02] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Format Tabs + Theme Tabs */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0 scrollbar-none flex-1">
            {/* Primary Format Filter */}
            <div className="flex items-center p-1 bg-black/60 rounded-xl border border-white/10 text-xs font-medium shrink-0">
              <button
                type="button"
                onClick={() => setSelectedFormatFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  selectedFormatFilter === 'all'
                    ? 'bg-[#3B5EFF] text-white shadow font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                All Sets
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormatFilter('hybrid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  selectedFormatFilter === 'hybrid'
                    ? 'bg-amber-500 text-white shadow font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Split + Frame Combos</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormatFilter('gallery')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  selectedFormatFilter === 'gallery'
                    ? 'bg-[#3B5EFF] text-white shadow font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Gallery Sets
              </button>
            </div>

            <div className="h-5 w-px bg-white/10 shrink-0 hidden sm:block" />

            {/* Theme Pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              {themeOptions.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => setSelectedThemeFilter(t.slug)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedThemeFilter === t.slug
                      ? 'bg-white/20 text-white shadow-sm font-semibold'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search placements..."
              className="w-full pl-8 pr-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#3B5EFF] transition-colors font-mono"
            />
          </div>
        </div>

        {/* ─── PLACEMENTS GRID ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlacements.map((placement) => {
            const isCurrentlyActiveLayout =
              currentLayout.id === placement.layoutId ||
              currentLayout.slug === placement.layoutSlug;
            const slotEntries = Object.entries(placement.selections);
            const posterCount = slotEntries.length;

            return (
              <div
                key={placement.id}
                className="group relative rounded-xl overflow-hidden bg-[#12141A] border border-white/10 hover:border-[#3B5EFF]/60 hover:shadow-xl hover:shadow-[#3B5EFF]/10 transition-all duration-300 flex flex-col"
              >
                {/* Image Preview Banner (Zero overlapping badges) */}
                <div className="relative w-full aspect-16/9 overflow-hidden bg-black/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={placement.previewImageUrl}
                    alt={placement.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter brightness-90 group-hover:brightness-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12141A] via-transparent to-black/30 pointer-events-none" />

                  {/* Clean Top-Left Theme Pill & Hybrid Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    {placement.layoutId.startsWith('hybrid-') && (
                      <span className="text-[10px] font-mono bg-amber-500/90 text-white px-2 py-0.5 rounded-full font-semibold shadow-md flex items-center gap-1 backdrop-blur-md">
                        <Sparkles className="w-2.5 h-2.5 text-amber-200" />
                        Split + Frames
                      </span>
                    )}
                    <span className="text-[10px] font-mono bg-black/80 backdrop-blur-md text-white/90 px-2.5 py-0.5 rounded-full border border-white/15 font-medium">
                      {placement.themeName}
                    </span>
                  </div>

                  {/* Clean Top-Right Print Count Pill */}
                  <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/15 text-[10px] font-mono text-white/90 font-medium">
                    {posterCount} Prints
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Metadata Header Row: Coverage & Active Status */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-white/50 mb-1.5">
                      <span className="flex items-center gap-1.5 text-white/70">
                        <Ruler className="w-3.5 h-3.5 text-[#3B5EFF]" />
                        <span>{placement.coverageLabel}</span>
                      </span>

                      {isCurrentlyActiveLayout && (
                        <span className="text-[9px] uppercase tracking-wider bg-[#3B5EFF]/20 text-[#3B5EFF] border border-[#3B5EFF]/40 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          Active
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-[#3B5EFF] transition-colors leading-snug">
                      {placement.title}
                    </h3>
                    <p className="text-xs text-white/50 font-mono mt-0.5">{placement.tagline}</p>
                    <p className="text-xs text-white/60 line-clamp-2 mt-2 leading-relaxed">
                      {placement.description}
                    </p>
                  </div>

                  {/* Mini Template Posters Preview Strip */}
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mb-1.5">
                      <span>{placement.layoutId.startsWith('hybrid-') ? '✦ SPLIT + FRAME TEMPLATES' : 'TEMPLATE PREVIEW'}</span>
                      <span className="text-white/60">{placement.layoutSlug}</span>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {slotEntries.slice(0, 5).map(([sId, sel]) => (
                        <div
                          key={sId}
                          title={sel.title}
                          className="relative w-8 h-10 rounded overflow-hidden border border-white/10 bg-black/50 shrink-0"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sel.thumbnailUrl || sel.imageUrl}
                            alt={sel.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {posterCount > 5 && (
                        <div className="w-8 h-10 rounded border border-white/10 bg-white/5 flex items-center justify-center text-[10px] font-mono text-white/50 shrink-0">
                          +{posterCount - 5}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => applyDesignPlacement(placement)}
                    className="mt-4 w-full py-2 px-3 rounded-lg bg-[#3B5EFF] hover:bg-[#2F4ED8] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-[#3B5EFF]/25 transition-all group-hover:shadow-lg group-hover:shadow-[#3B5EFF]/40 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply This Placement</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── MODAL FOOTER NOTE ─── */}
        <div className="p-3 sm:px-6 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-white/40 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span>Real brand posters can replace these template images seamlessly.</span>
          </div>
          <span>Instant Live Preview • Full Physical Dimensions Guaranteed</span>
        </div>
      </div>
    </div>
  );
};
