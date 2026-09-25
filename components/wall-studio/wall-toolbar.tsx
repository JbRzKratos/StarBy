'use client';

import React, { useState } from 'react';
import { useWallStudioStore } from '@/lib/wall-studio/store';
import { useCartStore } from '@/lib/stores/cart-store';
import { FREGORO_THEMES } from '@/lib/wall-studio/themes-data';
import { FregoroLogo } from '@/components/ui/fregoro-logo';
import {
  Undo2,
  Redo2,
  Sparkles,
  Share2,
  RotateCcw,
  Palette,
  Ruler,
  ChevronDown,
  LayoutGrid,
  Shuffle,
  Wand2,
  ShoppingBag,
  MoreHorizontal,
  X,
} from 'lucide-react';

export const WallToolbar: React.FC = () => {
  const {
    currentLayout,
    viewMode,
    cleanWallColor,
    historyIndex,
    history,
    setViewMode,
    setCleanWallColor,
    undo,
    redo,
    resetWall,
    themeFill,
    shuffle,
    openLayoutSelector,
    openShareModal,
    openPlacementsModal,
  } = useWallStudioStore();

  const cartItemsCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const toggleCart = useCartStore((s) => s.toggleCart);

  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Clean studio wall shade presets
  const WALL_SHADES = [
    { name: 'Obsidian Noir', hex: '#121214' },
    { name: 'Slate Grey', hex: '#22252A' },
    { name: 'Pure Black', hex: '#090A0B' },
    { name: 'Warm Charcoal', hex: '#1C1A19' },
    { name: 'Gallery Ash', hex: '#2A2A2E' },
  ];

  return (
    <header className="relative z-30 w-full h-[52px] sm:h-[56px] md:h-[60px] bg-[#0A0B0E]/95 backdrop-blur-md border-b border-white/10 px-2.5 sm:px-4 md:px-6 flex items-center justify-between gap-1.5 sm:gap-2.5 md:gap-3 shrink-0 select-none">
      {/* ─── LEFT: BRAND LOGO + COMPOSITION SELECTOR + CURATED STYLES ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 min-w-0 flex-1 md:flex-initial">
        {/* On mobile (<768px): compact emblem icon; on desktop (>=768px): full logo */}
        <div className="md:hidden shrink-0 flex items-center">
          <FregoroLogo variant="mark" size="sm" href="/" />
        </div>
        <div className="hidden md:block shrink-0">
          <FregoroLogo variant="full" size="sm" href="/" />
        </div>

        <div className="h-4 w-px bg-white/15 mx-0.5 hidden md:block shrink-0" />

        {/* Layout Selector Button */}
        <button
          type="button"
          onClick={openLayoutSelector}
          title="Change Wall Composition Layout"
          className="group flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 transition-all text-left cursor-pointer min-w-0 min-h-[38px]"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-[#3B5EFF] shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[75px] xs:max-w-[110px] sm:max-w-[150px] md:max-w-[190px]">
            {currentLayout.name}
          </span>
          <span className="text-[11px] text-white/40 font-mono hidden md:inline shrink-0">
            {currentLayout.physicalPrintCount}P • {currentLayout.coverageLabel}
          </span>
          <ChevronDown className="w-3 h-3 text-white/40 group-hover:text-white transition-transform shrink-0" />
        </button>

        {/* Curated Styles Modal Trigger */}
        <button
          type="button"
          onClick={openPlacementsModal}
          title="Curated Design Placements"
          className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-full bg-[#3B5EFF]/15 hover:bg-[#3B5EFF]/25 text-[#3B5EFF] hover:text-white border border-[#3B5EFF]/30 text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0 min-h-[38px] min-w-[38px] justify-center"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">Curated Styles</span>
        </button>
      </div>

      {/* ─── CENTER: SLEEK SEGMENTED VIEW SWITCHER (Studio | Map) ON DESKTOP ─── */}
      <div className="hidden md:flex items-center p-0.5 bg-black/50 rounded-full border border-white/10 text-xs font-medium shrink-0">
        <button
          type="button"
          onClick={() => setViewMode('clean')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all text-xs cursor-pointer ${
            viewMode === 'clean'
              ? 'bg-[#3B5EFF] text-white shadow-sm font-semibold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('print-map')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all text-xs cursor-pointer ${
            viewMode === 'print-map'
              ? 'bg-[#3B5EFF] text-white shadow-sm font-semibold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Map</span>
        </button>
      </div>

      {/* ─── RIGHT: QUICK TOOLS & CART ─── */}
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
        {/* MOBILE OVERFLOW MENU BUTTON (md:hidden) */}
        <div className="relative md:hidden shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
            title="More Studio Tools"
            className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center min-w-[38px] min-h-[38px] ${
              isMobileMoreOpen
                ? 'bg-[#3B5EFF] text-white border-[#3B5EFF]'
                : 'bg-white/[0.08] hover:bg-white/[0.15] text-white/80 hover:text-white border-white/15'
            }`}
          >
            {isMobileMoreOpen ? (
              <X className="w-4 h-4 text-white" />
            ) : (
              <MoreHorizontal className="w-4 h-4 text-white" />
            )}
          </button>

          {/* Mobile Tools Dropdown Sheet */}
          {isMobileMoreOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#121318]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-2.5 z-50 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Studio vs Map View Mode Switch */}
              <div className="flex items-center p-0.5 bg-black/60 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('clean');
                    setIsMobileMoreOpen(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all ${
                    viewMode === 'clean'
                      ? 'bg-[#3B5EFF] text-white font-semibold shadow'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('print-map');
                    setIsMobileMoreOpen(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all ${
                    viewMode === 'print-map'
                      ? 'bg-[#3B5EFF] text-white font-semibold shadow'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Map</span>
                </button>
              </div>

              {/* Wall Shades (Studio mode only) */}
              {viewMode === 'clean' && (
                <div className="pt-1 border-t border-white/10">
                  <span className="block px-1 text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1.5">
                    Wall Shade
                  </span>
                  <div className="flex items-center justify-between px-1">
                    {WALL_SHADES.map((s) => (
                      <button
                        key={s.hex}
                        type="button"
                        title={s.name}
                        onClick={() => {
                          setCleanWallColor(s.hex);
                          setIsMobileMoreOpen(false);
                        }}
                        className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                          cleanWallColor === s.hex
                            ? 'border-[#3B5EFF] scale-110 ring-2 ring-[#3B5EFF]/50'
                            : 'border-white/20 hover:scale-105'
                        }`}
                        style={{ backgroundColor: s.hex }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Undo / Redo Row */}
              <div className="pt-1 border-t border-white/10 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    undo();
                  }}
                  disabled={!canUndo}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-25 text-xs text-white/80 transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    redo();
                  }}
                  disabled={!canRedo}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-25 text-xs text-white/80 transition-colors"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                  <span>Redo</span>
                </button>
              </div>

              {/* Actions List */}
              <div className="space-y-0.5 pt-1 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    shuffle('all');
                    setIsMobileMoreOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Shuffle className="w-3.5 h-3.5 text-[#3B5EFF]" />
                  <span>Shuffle Artworks</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    openShareModal();
                    setIsMobileMoreOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#3B5EFF]" />
                  <span>Share Composition</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetWall();
                    setIsMobileMoreOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Blank Wall</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop-only: Wall shade swatches (in studio clean mode) */}
        {viewMode === 'clean' && (
          <div className="relative shrink-0 hidden md:block">
            <button
              type="button"
              onClick={() => setIsColorMenuOpen(!isColorMenuOpen)}
              title="Change Studio Wall Shade"
              className="w-7 h-7 rounded-full border border-white/20 hover:border-white/50 flex items-center justify-center p-0.5 transition-all cursor-pointer"
            >
              <span
                className="w-full h-full rounded-full shadow-inner border border-black/40"
                style={{ backgroundColor: cleanWallColor }}
              />
            </button>

            {isColorMenuOpen && (
              <div className="absolute right-0 top-full mt-2 p-2 bg-[#121318]/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl z-50 flex items-center gap-2">
                {WALL_SHADES.map((s) => (
                  <button
                    key={s.hex}
                    type="button"
                    title={s.name}
                    onClick={() => {
                      setCleanWallColor(s.hex);
                      setIsColorMenuOpen(false);
                    }}
                    className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                      cleanWallColor === s.hex
                        ? 'border-[#3B5EFF] scale-110 ring-2 ring-[#3B5EFF]/50'
                        : 'border-white/20 hover:scale-105'
                    }`}
                    style={{ backgroundColor: s.hex }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Desktop-only: Theme Fill Menu */}
        <div className="relative hidden md:block">
          <button
            type="button"
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            title="Auto-fill theme artworks"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/70 hover:text-white text-xs font-mono transition-colors cursor-pointer"
          >
            <Wand2 className="w-3 h-3 text-amber-400" />
            <span>Theme</span>
            <ChevronDown className="w-3 h-3 text-white/40" />
          </button>

          {isThemeMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 max-h-72 overflow-y-auto bg-[#121318]/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 space-y-0.5">
              <span className="block px-2 py-1 text-[10px] font-mono text-white/40 uppercase tracking-wider">
                Fill Unlocked Slots
              </span>
              {FREGORO_THEMES.slice(0, 10).map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => {
                    themeFill(t.slug);
                    setIsThemeMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-white/80 hover:text-white hover:bg-[#3B5EFF]/20 hover:text-[#3B5EFF] transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>{t.name}</span>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.accentColor }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop-only: Shuffle */}
        <button
          type="button"
          onClick={() => shuffle('all')}
          title="Shuffle artworks across wall"
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden md:flex items-center justify-center"
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>

        {/* Desktop-only: Undo / Redo */}
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer hidden md:flex items-center justify-center"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer hidden md:flex items-center justify-center"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        {/* Desktop-only: Clear Wall */}
        <button
          type="button"
          onClick={resetWall}
          title="Reset to blank wall"
          className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer hidden md:flex items-center justify-center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Desktop-only: Share */}
        <button
          type="button"
          onClick={openShareModal}
          title="Share Wall Composition"
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden md:flex items-center justify-center"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        {/* Cart Drawer Trigger (Always visible, 38px min touch target) */}
        <button
          type="button"
          onClick={toggleCart}
          title="Open Cart"
          className="relative p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white transition-all cursor-pointer ml-0.5 shrink-0 min-w-[38px] min-h-[38px] flex items-center justify-center"
        >
          <ShoppingBag className="w-4 h-4 text-white" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#3B5EFF] text-white text-[9px] font-bold flex items-center justify-center shadow">
              {cartItemsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
