'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useWallStudioStore } from '@/lib/wall-studio/store';
import { FREGORO_ARTWORKS } from '@/lib/wall-studio/artworks-data';
import { FREGORO_THEMES } from '@/lib/wall-studio/themes-data';
import { getSlotRecommendations } from '@/lib/wall-studio/recommendations';
import type { PosterArtworkData } from '@/lib/wall-studio/types';
import { X, Search, Sparkles, Upload, Check, Layers, ArrowRight } from 'lucide-react';

export const PosterPickerDrawer: React.FC = () => {
  const {
    isPickerOpen,
    activeSlotId,
    currentLayout,
    selections,
    closePicker,
    setSlotArtwork,
    setSplitArtwork,
    openCustomUploadForSlot,
  } = useWallStudioStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'recommended' | 'all' | 'upload'>('recommended');
  const [justSelectedTitle, setJustSelectedTitle] = useState<string | null>(null);

  // Currently focused slot
  const currentSlot = useMemo(() => {
    return currentLayout.slots.find((s) => s.id === activeSlotId) || currentLayout.slots[0];
  }, [currentLayout, activeSlotId]);

  const splitGroup = useMemo(() => {
    return currentSlot?.splitGroupId
      ? currentLayout.splitGroups.find((g) => g.splitGroupId === currentSlot.splitGroupId)
      : undefined;
  }, [currentLayout, currentSlot]);

  const isSplitSlot = !!currentSlot?.splitGroupId;

  // Recommendations for this specific slot
  const recommendedArtworks = useMemo(() => {
    if (!currentSlot) return [];
    return getSlotRecommendations(currentSlot, currentLayout, selections, selectedTheme);
  }, [currentSlot, currentLayout, selections, selectedTheme]);

  // General filtered catalog
  const filteredArtworks = useMemo(() => {
    let list = [...FREGORO_ARTWORKS];

    if (selectedTheme && selectedTheme !== 'all') {
      list = list.filter((a) => a.themeSlug === selectedTheme);
    }

    if (currentSlot?.orientation) {
      list = [...list].sort((a, b) => {
        if (a.orientation === currentSlot.orientation && b.orientation !== currentSlot.orientation)
          return -1;
        if (a.orientation !== currentSlot.orientation && b.orientation === currentSlot.orientation)
          return 1;
        return 0;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.themeSlug.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Sort to prioritize slot-compatible items
    return list.sort((a, b) => {
      if (isSplitSlot) {
        if (a.isSplitCompatible && !b.isSplitCompatible) return -1;
        if (!a.isSplitCompatible && b.isSplitCompatible) return 1;
      }
      return 0;
    });
  }, [selectedTheme, searchQuery, isSplitSlot, currentSlot?.orientation]);

  // Handle poster selection
  const handleSelectPoster = (artwork: PosterArtworkData) => {
    if (!currentSlot) return;

    if (currentSlot.splitGroupId) {
      setSplitArtwork(currentSlot.splitGroupId, artwork);
    } else {
      setSlotArtwork(currentSlot.id, artwork);
    }

    setJustSelectedTitle(artwork.title);
    setTimeout(() => setJustSelectedTitle(null), 3500);
  };

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePicker();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closePicker]);

  if (!isPickerOpen) return null;

  return (
    <>
      {/* ─── BACKDROP OVERLAY (Click canvas to close) ─── */}
      <div
        className="absolute inset-0 z-30 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 cursor-pointer"
        onClick={closePicker}
        title="Click canvas to close poster picker"
        aria-hidden="true"
      />

      {/* ─── SIDEBAR DRAWER (Docked within canvas viewport, never overlaps topbar) ─── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Select Poster"
        className="absolute inset-y-0 right-0 z-40 w-full max-w-full md:w-[500px] bg-[#0E0F12] border-l border-white/15 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right"
      >
        {/* Floating Quick Tab to Close on Left Edge (Desktop only) */}
        <button
          type="button"
          onClick={closePicker}
          title="Close sidebar (Esc)"
          className="hidden md:flex absolute -left-9 top-4 w-9 h-9 items-center justify-center bg-[#0E0F12] border-y border-l border-white/20 rounded-l-xl text-white/70 hover:text-white hover:bg-red-500/25 hover:border-red-500/40 shadow-xl transition-all cursor-pointer z-50"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* ─── DRAWER HEADER ─── */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 flex items-start justify-between gap-3 bg-black/70 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#3B5EFF] font-bold">
                {isSplitSlot ? 'Multi-Panel Split Slot' : 'Individual Slot'}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                {currentSlot?.size} • {currentSlot?.orientation}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {currentSlot?.label || `Slot ${currentSlot?.size} (${currentSlot?.slotType})`}
            </h2>
            {isSplitSlot && splitGroup && (
              <p className="text-[11px] text-white/50 font-mono mt-0.5 truncate">
                Continuous across {splitGroup.panelCount} panels ({splitGroup.name})
              </p>
            )}
          </div>

          {/* Prominent High-Visibility Close Button */}
          <button
            type="button"
            onClick={closePicker}
            title="Close sidebar (Esc)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 text-red-200 border border-red-500/40 hover:border-red-500/60 font-semibold text-xs transition-all shadow cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 text-red-300" />
            <span>Close</span>
            <span className="text-[10px] text-red-300/80 font-mono hidden sm:inline">(Esc)</span>
          </button>
        </div>

        {/* ─── SEARCH & FILTER TABS ─── */}
        <div className="p-3 sm:p-4 border-b border-white/10 space-y-2.5 bg-black/20 shrink-0">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search characters, movies, cars, themes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#3B5EFF] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('recommended')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                activeTab === 'recommended'
                  ? 'bg-[#3B5EFF] text-white shadow font-semibold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                activeTab === 'all'
                  ? 'bg-[#3B5EFF] text-white shadow font-semibold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Artworks</span>
            </button>

            <button
              type="button"
              onClick={() => {
                closePicker();
                openCustomUploadForSlot(currentSlot?.id);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
            </button>
          </div>

          {/* Theme Horizontal Filter Chips (with edge fade scroll affordance) */}
          <div className="relative">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 snap-x snap-proximity scroll-smooth pr-8">
              <button
                type="button"
                onClick={() => setSelectedTheme('all')}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-mono transition-colors snap-start min-h-[36px] flex items-center ${
                  selectedTheme === 'all'
                    ? 'bg-[#3B5EFF] text-white font-semibold'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                All Themes
              </button>
              {FREGORO_THEMES.map((theme) => (
                <button
                  key={theme.slug}
                  type="button"
                  onClick={() => setSelectedTheme(theme.slug)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-mono transition-colors flex items-center gap-1.5 snap-start min-h-[36px] ${
                    selectedTheme === theme.slug
                      ? 'bg-[#3B5EFF] text-white font-semibold'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
            {/* Subtle right-edge fade gradient to cue off-screen chips */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0E0F12] to-transparent" />
          </div>
        </div>

        {/* ─── ARTWORK CARDS GRID ─── */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {/* Quick confirmation notification banner */}
          {justSelectedTitle && (
            <div className="sticky top-0 z-30 mb-2 px-3.5 py-2.5 rounded-xl bg-[#3B5EFF] text-white shadow-xl shadow-[#3B5EFF]/30 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 truncate min-w-0">
                <Check className="w-4 h-4 shrink-0 text-white" />
                <span className="font-semibold truncate">Placed on wall: {justSelectedTitle}</span>
              </div>
              <button
                type="button"
                onClick={closePicker}
                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold shrink-0 ml-2 cursor-pointer transition-colors"
              >
                View Wall →
              </button>
            </div>
          )}

          {activeTab === 'recommended' && (
            <div className="flex items-center justify-between text-[11px] font-mono text-white/40 px-0.5">
              <span>
                Optimized for {currentSlot?.size} • {currentSlot?.orientation}
              </span>
              <span>{recommendedArtworks.length} matches</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {(activeTab === 'recommended' ? recommendedArtworks : filteredArtworks).map(
              (artwork) => {
                const isCurrentlySelected = selections[currentSlot?.id]?.artworkId === artwork.id;

                return (
                  <div
                    key={artwork.id}
                    onClick={() => handleSelectPoster(artwork)}
                    className={`group relative rounded-xl overflow-hidden bg-[#121318] border transition-all duration-200 cursor-pointer flex flex-col ${
                      isCurrentlySelected
                        ? 'border-[#3B5EFF] ring-2 ring-[#3B5EFF]/60 shadow-lg shadow-[#3B5EFF]/25'
                        : 'border-white/10 hover:border-white/40 hover:scale-[1.02]'
                    }`}
                  >
                    {/* Poster Thumbnail (Native CSS aspect-ratio with min-height ensures it NEVER collapses) */}
                    <div
                      className="relative w-full overflow-hidden bg-[#181920] min-h-[140px] sm:min-h-[170px]"
                      style={{
                        aspectRatio: artwork.orientation === 'landscape' ? '16/10' : '3/4',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={artwork.thumbnailUrl || artwork.imageUrl}
                        alt={artwork.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.currentTarget;
                          // If thumbnail fails, fallback to full imageUrl
                          if (target.src !== artwork.imageUrl) {
                            target.src = artwork.imageUrl;
                          }
                        }}
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                        {artwork.isSplitCompatible && (
                          <span className="text-[9px] font-mono uppercase tracking-wider bg-black/80 backdrop-blur-md text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">
                            Split-Ready
                          </span>
                        )}
                        {artwork.heroCompatible && (
                          <span className="text-[9px] font-mono uppercase tracking-wider bg-black/80 backdrop-blur-md text-[#3B5EFF] px-1.5 py-0.5 rounded border border-[#3B5EFF]/30">
                            Hero Art
                          </span>
                        )}
                      </div>

                      {/* Selection Checkmark */}
                      {isCurrentlySelected && (
                        <div className="absolute inset-0 bg-[#3B5EFF]/25 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full bg-[#3B5EFF] text-white flex items-center justify-center shadow-xl ring-2 ring-white/50">
                            <Check className="w-5 h-5" />
                          </div>
                        </div>
                      )}

                      {/* Hover / Tap Quick Action */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-xs font-semibold text-white bg-[#3B5EFF] px-3 py-1.5 rounded-full shadow-lg">
                          {isCurrentlySelected ? 'Selected' : 'Select for Wall'}
                        </span>
                      </div>
                    </div>

                    {/* Info Footer */}
                    <div className="p-2.5 flex flex-col flex-1 justify-between bg-black/50 border-t border-white/5">
                      <div>
                        <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#3B5EFF] transition-colors">
                          {artwork.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50 mt-0.5">
                          <span className="capitalize">{artwork.themeSlug}</span>
                          <span>•</span>
                          <span className="uppercase">{artwork.orientation}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>

          {/* Empty Search State */}
          {(activeTab === 'recommended' ? recommendedArtworks : filteredArtworks).length === 0 && (
            <div className="text-center py-12 text-white/40 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-white/20" />
              <p className="text-xs">No matching artworks found.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTheme('all');
                }}
                className="text-xs text-[#3B5EFF] hover:underline font-mono cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* ─── DRAWER FOOTER ─── */}
        <div className="p-3 sm:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:pb-4 bg-black/90 border-t border-white/10 flex items-center justify-between text-xs text-white/50 font-mono shrink-0">
          <button
            type="button"
            onClick={() => {
              closePicker();
              openCustomUploadForSlot(currentSlot?.id);
            }}
            className="text-[#3B5EFF] hover:underline flex items-center gap-1.5 font-sans text-xs font-medium cursor-pointer min-h-[44px] py-2"
          >
            <span>Use Custom Photo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={closePicker}
            className="px-4 sm:px-6 py-2.5 rounded-xl bg-[#3B5EFF] hover:bg-[#2B4EFF] active:scale-95 text-white text-xs font-bold shadow-lg shadow-[#3B5EFF]/25 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          >
            <Check className="w-4 h-4" />
            <span>Apply & View Wall</span>
          </button>
        </div>
      </aside>
    </>
  );
};
