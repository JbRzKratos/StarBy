'use client';

import React from 'react';
import Link from 'next/link';
import type { MagazineDocument, PreflightReport } from '@/types/magazine';
import { PAGE_DIMENSIONS, DEFAULT_PAGE_DIMENSION } from '@/types/magazine';

interface TopToolbarProps {
  document: MagazineDocument;
  onUpdateTitle: (title: string) => void;
  viewMode: 'page' | 'spread';
  onToggleViewMode: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  showGuides: boolean;
  onToggleGuides: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showRulers: boolean;
  onToggleRulers: () => void;
  enableSnap: boolean;
  onToggleSnap: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isSaving: boolean;
  onOpenPreflight: () => void;
  onOpenPreview: () => void;
  onDownloadPdf: () => void;
  onOrderPrint: () => void;
  preflightReport?: PreflightReport | null;
}

export function TopToolbar({
  document: doc,
  onUpdateTitle,
  viewMode,
  onToggleViewMode,
  zoom,
  onZoomChange,
  showGuides,
  onToggleGuides,
  showGrid,
  onToggleGrid,
  showRulers,
  onToggleRulers,
  enableSnap,
  onToggleSnap,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isSaving,
  onOpenPreflight,
  onOpenPreview,
  onDownloadPdf,
  onOrderPrint,
  preflightReport,
}: TopToolbarProps) {
  const dim = PAGE_DIMENSIONS[doc.dimensionKey] || DEFAULT_PAGE_DIMENSION;
  const isPrintReady = preflightReport ? preflightReport.isPrintReady : true;

  return (
    <header className="h-14 bg-[#0E0E10] border-b border-[#F5F1EA]/10 px-4 flex items-center justify-between select-none text-[#F5F1EA] z-40 relative shrink-0">
      {/* ── LEFT: Studio Logo, Editable Document Title, Cloud Status ── */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <Link
          href="/magazine"
          className="flex items-center gap-2 group py-1 pr-3 border-r border-[#F5F1EA]/10 shrink-0"
          title="Back to Magazine Studio"
        >
          <div className="w-7 h-7 rounded-lg bg-[#0057FF] flex items-center justify-center font-display font-black text-xs text-white shadow-md shadow-[#0057FF]/30">
            F
          </div>
          <span className="font-display font-black text-xs tracking-wider uppercase text-white group-hover:text-[#0057FF] transition-colors hidden sm:inline-block">
            FREGORO <span className="text-[#0057FF]">STUDIO</span>
          </span>
        </Link>

        {/* Title & Document Meta */}
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={doc.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="bg-transparent border border-transparent hover:border-[#F5F1EA]/20 focus:border-[#0057FF] px-2 py-1 rounded-md font-display font-bold text-xs sm:text-sm text-white outline-none max-w-[130px] sm:max-w-[200px] md:max-w-[260px] truncate transition-all"
            placeholder="Magazine Title"
          />

          <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#16161A] border border-[#F5F1EA]/10 font-mono text-[10px] text-[#F5F1EA]/60">
            <span>{dim.name}</span>
            <span>·</span>
            <span>{doc.pages.length}p</span>
            <span>·</span>
            <span className="text-emerald-400">300 DPI</span>
          </span>

          {/* Autosave Status Indicator */}
          <span className="font-mono text-[9px] text-[#F5F1EA]/50 flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSaving ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span className="hidden md:inline">{isSaving ? 'Saving...' : 'Saved ✓'}</span>
          </span>
        </div>
      </div>

      {/* ── CENTER: History, View Modes, Rulers, Guides & Zoom ── */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-[#16161A] rounded-lg border border-[#F5F1EA]/10 p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded text-xs text-[#F5F1EA]/70 hover:text-white disabled:opacity-30 transition-colors"
          >
            ↩
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 rounded text-xs text-[#F5F1EA]/70 hover:text-white disabled:opacity-30 transition-colors"
          >
            ↪
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#16161A] rounded-lg border border-[#F5F1EA]/10 p-0.5 text-[11px] font-mono font-bold">
          <button
            onClick={onToggleViewMode}
            className={`px-2.5 py-1 rounded transition-all ${
              viewMode === 'page'
                ? 'bg-[#0057FF] text-white shadow-sm'
                : 'text-[#F5F1EA]/60 hover:text-white'
            }`}
          >
            Single Page
          </button>
          <button
            onClick={onToggleViewMode}
            className={`px-2.5 py-1 rounded transition-all ${
              viewMode === 'spread'
                ? 'bg-[#0057FF] text-white shadow-sm'
                : 'text-[#F5F1EA]/60 hover:text-white'
            }`}
          >
            2-Up Spread
          </button>
        </div>

        {/* Guides, Rulers & Snap Toggles */}
        <div className="flex items-center bg-[#16161A] rounded-lg border border-[#F5F1EA]/10 p-0.5 text-[10px] font-mono">
          <button
            onClick={onToggleRulers}
            title="Toggle Millimeter Canvas Rulers"
            className={`px-2 py-1 rounded transition-all ${
              showRulers
                ? 'bg-[#25252E] text-white font-bold'
                : 'text-[#F5F1EA]/50 hover:text-white'
            }`}
          >
            Rulers
          </button>
          <button
            onClick={onToggleGuides}
            title="Toggle 3mm Bleed & 10mm Safe Margins"
            className={`px-2 py-1 rounded transition-all ${
              showGuides
                ? 'bg-[#25252E] text-emerald-400 font-bold'
                : 'text-[#F5F1EA]/50 hover:text-white'
            }`}
          >
            Guides
          </button>
          <button
            onClick={onToggleGrid}
            title="Toggle 6-Column Grid"
            className={`px-2 py-1 rounded transition-all ${
              showGrid
                ? 'bg-[#25252E] text-[#0057FF] font-bold'
                : 'text-[#F5F1EA]/50 hover:text-white'
            }`}
          >
            Grid
          </button>
          <button
            onClick={onToggleSnap}
            title="Toggle Smart Magnetic Snapping"
            className={`px-2 py-1 rounded transition-all ${
              enableSnap
                ? 'bg-[#25252E] text-fuchsia-400 font-bold'
                : 'text-[#F5F1EA]/50 hover:text-white'
            }`}
          >
            Snap
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-[#16161A] rounded-lg border border-[#F5F1EA]/10 p-0.5 font-mono text-[11px]">
          <button
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))}
            className="px-2 py-1 hover:text-white text-[#F5F1EA]/60"
            title="Zoom Out"
          >
            -
          </button>
          <span className="px-2 py-1 text-white font-bold min-w-[44px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2.0, zoom + 0.25))}
            className="px-2 py-1 hover:text-white text-[#F5F1EA]/60"
            title="Zoom In"
          >
            +
          </button>
        </div>
      </div>

      {/* ── RIGHT: Preflight, Preview, PDF & Order ── */}
      <div className="flex items-center gap-2">
        {/* Preflight Readiness Indicator */}
        <button
          onClick={onOpenPreflight}
          title="Inspect Print Readiness"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16161A] hover:bg-[#202028] border border-[#F5F1EA]/10 font-mono text-xs text-[#F5F1EA] transition-all"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isPrintReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span className="hidden sm:inline">Preflight</span>
        </button>

        {/* 3D Spread Preview Modal */}
        <button
          onClick={onOpenPreview}
          title="Open Publication Spread Reader"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16161A] hover:bg-[#202028] border border-[#F5F1EA]/10 font-mono text-xs text-[#F5F1EA] transition-all"
        >
          <span>📖</span>
          <span className="hidden sm:inline">Preview</span>
        </button>

        {/* Vector PDF Export */}
        <button
          onClick={onDownloadPdf}
          title="Export 300 DPI Print-Ready Vector PDF"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1F1F24] hover:bg-[#2A2A32] border border-[#F5F1EA]/15 font-mono text-xs font-bold text-white transition-all shadow-sm"
        >
          <span>↓</span>
          <span className="hidden md:inline">PDF</span>
        </button>

        {/* Order Print CTA */}
        <button
          onClick={onOrderPrint}
          className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg bg-gradient-to-r from-[#0057FF] to-[#3B5EFF] hover:from-[#0046CC] hover:to-[#0057FF] font-mono text-xs font-bold text-white uppercase tracking-wider transition-all shadow-lg shadow-[#0057FF]/30 hover:scale-105 active:scale-95"
        >
          <span>Order Print</span>
          <span>→</span>
        </button>
      </div>
    </header>
  );
}
