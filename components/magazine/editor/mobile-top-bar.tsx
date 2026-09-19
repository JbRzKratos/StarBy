'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { MagazineDocument, PreflightReport } from '@/types/magazine';

interface MobileTopBarProps {
  document: MagazineDocument;
  onUpdateTitle: (title: string) => void;
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
  showGrid: boolean;
  onToggleGrid: () => void;
  showGuides: boolean;
  onToggleGuides: () => void;
  enableSnap: boolean;
  onToggleSnap: () => void;
}

export function MobileTopBar({
  document: doc,
  onUpdateTitle,
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
  showGrid,
  onToggleGrid,
  showGuides,
  onToggleGuides,
  enableSnap,
  onToggleSnap,
}: MobileTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isPrintReady = preflightReport ? preflightReport.isPrintReady : true;

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      window.addEventListener('pointerdown', handleClickOutside);
      return () => window.removeEventListener('pointerdown', handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <header className="h-14 bg-[#0E0E10] border-b border-[#F5F1EA]/10 px-2.5 flex items-center justify-between text-[#F5F1EA] z-40 relative shrink-0 select-none">
      {/* ── Left: Back button & Document Title ── */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <Link
          href="/magazine"
          className="w-8 h-8 rounded-lg bg-[#16161A] hover:bg-[#202028] border border-[#F5F1EA]/10 flex items-center justify-center text-white shrink-0 active:scale-95 transition-all"
          title="Back to Studio"
        >
          <span className="text-sm font-bold">←</span>
        </Link>

        <div className="flex items-center gap-1 min-w-0 max-w-[130px] xs:max-w-[160px]">
          <input
            type="text"
            value={doc.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="bg-transparent border border-transparent focus:border-[#0057FF] px-1 py-0.5 rounded font-display font-bold text-xs text-white outline-none w-full truncate"
            placeholder="Magazine Title"
          />
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isSaving ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
            }`}
            title={isSaving ? 'Saving...' : 'Saved'}
          />
        </div>
      </div>

      {/* ── Center: Undo / Redo buttons ── */}
      <div className="flex items-center gap-1 bg-[#16161A] rounded-lg border border-[#F5F1EA]/10 p-0.5 mx-1 shrink-0">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className="w-8 h-8 rounded flex items-center justify-center text-sm text-[#F5F1EA]/80 hover:text-white disabled:opacity-20 active:scale-90 transition-all"
        >
          ↩
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className="w-8 h-8 rounded flex items-center justify-center text-sm text-[#F5F1EA]/80 hover:text-white disabled:opacity-20 active:scale-90 transition-all"
        >
          ↪
        </button>
      </div>

      {/* ── Right: Preview, Order Print, and More Menu ── */}
      <div className="flex items-center gap-1.5 shrink-0" ref={menuRef}>
        <button
          onClick={onOpenPreview}
          title="Preview Publication"
          className="w-8 h-8 rounded-lg bg-[#16161A] hover:bg-[#202028] border border-[#F5F1EA]/10 flex items-center justify-center text-sm active:scale-95 transition-all shrink-0"
        >
          ◈
        </button>

        <button
          onClick={onOrderPrint}
          className="h-8 px-2.5 rounded-lg bg-gradient-to-r from-[#0057FF] to-[#3B5EFF] hover:from-[#0046CC] hover:to-[#0057FF] font-mono text-[11px] font-bold text-white uppercase tracking-wider transition-all shadow-md shadow-[#0057FF]/30 active:scale-95 shrink-0 flex items-center gap-1"
        >
          <span>ORDER</span>
          <span>→</span>
        </button>

        {/* More Menu Toggle */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold transition-all shrink-0 ${
              menuOpen
                ? 'bg-[#0057FF] border-[#0057FF] text-white'
                : 'bg-[#16161A] border-[#F5F1EA]/10 text-[#F5F1EA]/80 hover:text-white'
            }`}
            title="More Options"
          >
            ⋮
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-[#16161A]/90 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl py-1.5 z-50 text-xs font-mono">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenPreflight();
                }}
                className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#202028] text-[#F5F1EA]"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPrintReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  Preflight Check
                </span>
                <span className="text-[10px] text-[#F5F1EA]/50">
                  {isPrintReady ? 'Ready' : 'Warn'}
                </span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDownloadPdf();
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#202028] text-[#F5F1EA]"
              >
                <span>↓</span>
                <span>Download PDF</span>
              </button>

              <div className="h-[1px] bg-[#F5F1EA]/10 my-1" />

              <button
                onClick={() => {
                  onToggleGrid();
                }}
                className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#202028] text-[#F5F1EA]"
              >
                <span>Grid</span>
                <span className={showGrid ? 'text-emerald-400' : 'text-[#F5F1EA]/40'}>
                  {showGrid ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => {
                  onToggleGuides();
                }}
                className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#202028] text-[#F5F1EA]"
              >
                <span>Smart Guides</span>
                <span className={showGuides ? 'text-emerald-400' : 'text-[#F5F1EA]/40'}>
                  {showGuides ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => {
                  onToggleSnap();
                }}
                className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#202028] text-[#F5F1EA]"
              >
                <span>Snap to Grid</span>
                <span className={enableSnap ? 'text-emerald-400' : 'text-[#F5F1EA]/40'}>
                  {enableSnap ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
