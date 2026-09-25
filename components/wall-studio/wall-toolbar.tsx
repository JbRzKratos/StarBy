'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
    <header className="relative z-30 w-full h-[58px] bg-[#0A0B0E]/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-6 flex items-center justify-between gap-3 shrink-0 select-none">
      {/* ─── LEFT: BRAND LOGO + COMPOSITION SELECTOR + CURATED STYLES ─── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Link
          href="/"
          title="Return to Fregoro Store"
          className="flex items-center transition-opacity hover:opacity-85 shrink-0"
        >
          <FregoroLogo size="sm" />
        </Link>

        <div className="h-4 w-px bg-white/15 mx-0.5 hidden sm:block shrink-0" />

        <button
          type="button"
          onClick={openLayoutSelector}
          title="Change Wall Composition Layout"
          className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 transition-all text-left cursor-pointer shrink-0"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-[#3B5EFF]" />
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[130px] sm:max-w-[190px]">
            {currentLayout.name}
          </span>
          <span className="text-[11px] text-white/40 font-mono hidden md:inline">
            {currentLayout.physicalPrintCount}P • {currentLayout.coverageLabel}
          </span>
          <ChevronDown className="w-3 h-3 text-white/40 group-hover:text-white transition-transform" />
        </button>

        <button
          type="button"
          onClick={openPlacementsModal}
          title="Curated Design Placements"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3B5EFF]/15 hover:bg-[#3B5EFF]/25 text-[#3B5EFF] hover:text-white border border-[#3B5EFF]/30 text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Curated Styles</span>
          <span className="sm:hidden">Styles</span>
        </button>
      </div>

      {/* ─── CENTER: SLEEK SEGMENTED VIEW SWITCHER (Studio | Map) ─── */}
      <div className="flex items-center p-0.5 bg-black/50 rounded-full border border-white/10 text-xs font-medium shrink-0">
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

      {/* ─── RIGHT: MINIMAL QUICK TOOLS & CART ─── */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Wall shade swatches (in studio clean mode) */}
        {viewMode === 'clean' && (
          <div className="relative">
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
              <div className="absolute right-0 mt-2 p-2 bg-[#121318]/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl z-50 flex items-center gap-2">
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

        {/* Theme Fill Menu */}
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

        {/* Shuffle */}
        <button
          type="button"
          onClick={() => shuffle('all')}
          title="Shuffle artworks across wall"
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden md:flex items-center justify-center"
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer hidden sm:flex items-center justify-center"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer hidden sm:flex items-center justify-center"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        {/* Clear Wall */}
        <button
          type="button"
          onClick={resetWall}
          title="Reset to blank wall"
          className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/15 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={openShareModal}
          title="Share Wall Composition"
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden xs:flex items-center justify-center"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        {/* Cart Drawer Trigger */}
        <button
          type="button"
          onClick={toggleCart}
          title="Open Cart"
          className="relative p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white transition-all cursor-pointer ml-1"
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
