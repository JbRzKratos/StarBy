'use client';

import React from 'react';
import type { MagazineDocument, MagazineElement } from '@/types/magazine';

export type MobileActiveSheet =
  'add' | 'pages' | 'templates' | 'background' | 'transform' | 'style' | 'layer' | null;

interface MobileBottomDockProps {
  document: MagazineDocument;
  currentPageIndex: number;
  selectedElements: MagazineElement[];
  activeSheet: MobileActiveSheet;
  onOpenSheet: (sheet: MobileActiveSheet) => void;
  onSelectPage: (index: number) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onDeselect: () => void;
  onResetZoom: () => void;
}

export function MobileBottomDock({
  document: doc,
  currentPageIndex,
  selectedElements,
  activeSheet,
  onOpenSheet,
  onSelectPage,
  onDuplicateSelected,
  onDeleteSelected,
  onDeselect,
  onResetZoom,
}: MobileBottomDockProps) {
  const hasSelection = selectedElements.length > 0;
  const singleElement = selectedElements.length === 1 ? selectedElements[0] : null;

  return (
    <nav
      aria-label="Mobile Magazine Dock"
      className="fixed bottom-0 left-0 right-0 h-16 bg-[#0E0E10]/85 backdrop-blur-2xl border-t border-white/15 px-2 flex items-center justify-between z-40 select-none shadow-[0_-10px_30px_rgba(0,0,0,0.6)] safe-area-bottom"
    >
      {/* ── State 1: Selection Mode ── */}
      {hasSelection ? (
        <div className="flex items-center justify-between w-full gap-1 overflow-x-auto scrollbar-none py-1">
          {/* Transform & Sliders */}
          <button
            onClick={() => onOpenSheet(activeSheet === 'transform' ? null : 'transform')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold shrink-0 active:scale-95 transition-all ${
              activeSheet === 'transform'
                ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-md shadow-[#0057FF]/30'
                : 'bg-white/5 border-white/10 text-[#F5F1EA]/80 hover:text-white'
            }`}
          >
            <span className="text-sm">⤢</span>
            <span>Transform</span>
          </button>

          {/* Style / Colors / Font */}
          <button
            onClick={() => onOpenSheet(activeSheet === 'style' ? null : 'style')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold shrink-0 active:scale-95 transition-all ${
              activeSheet === 'style'
                ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-md shadow-[#0057FF]/30'
                : 'bg-white/5 border-white/10 text-[#F5F1EA]/80 hover:text-white'
            }`}
          >
            <span className="text-sm">◈</span>
            <span>{singleElement?.type === 'text' ? 'Text Style' : 'Style'}</span>
          </button>

          {/* Layer Reordering */}
          <button
            onClick={() => onOpenSheet(activeSheet === 'layer' ? null : 'layer')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold shrink-0 active:scale-95 transition-all ${
              activeSheet === 'layer'
                ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-md shadow-[#0057FF]/30'
                : 'bg-white/5 border-white/10 text-[#F5F1EA]/80 hover:text-white'
            }`}
          >
            <span className="text-sm">☷</span>
            <span>Layer</span>
          </button>

          {/* Duplicate Action */}
          <button
            onClick={onDuplicateSelected}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-[#F5F1EA]/80 hover:text-white text-[10px] font-mono font-bold shrink-0 active:scale-95 transition-all"
            title="Duplicate"
          >
            <span className="text-sm">⧉</span>
            <span>Copy</span>
          </button>

          {/* Delete Action */}
          <button
            onClick={onDeleteSelected}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px] font-mono font-bold shrink-0 active:scale-95 transition-all"
            title="Delete"
          >
            <span className="text-sm">⌫</span>
            <span>Delete</span>
          </button>

          {/* Deselect / Done */}
          <button
            onClick={onDeselect}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold shrink-0 active:scale-95 transition-all"
            title="Deselect"
          >
            <span className="text-sm">✓</span>
            <span>Done</span>
          </button>
        </div>
      ) : (
        /* ── State 2: Default Document Mode ── */
        <div className="flex items-center justify-between w-full gap-1 overflow-x-auto scrollbar-none py-1">
          {/* Page Paging: Prev / Page Count / Next */}
          <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-0.5 shrink-0">
            <button
              onClick={() => onSelectPage(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              className="w-7 h-8 rounded-lg text-[#F5F1EA]/70 hover:text-white disabled:opacity-20 text-xs font-mono font-bold flex items-center justify-center shrink-0 active:scale-90 transition-all"
              aria-label="Previous Page"
            >
              ◀
            </button>
            <button
              onClick={() => onOpenSheet('pages')}
              className="px-2 py-1 text-[11px] font-mono font-bold text-white hover:text-[#0057FF] transition-colors whitespace-nowrap shrink-0"
              title="Page List"
            >
              {currentPageIndex + 1}/{doc.pages.length}
            </button>
            <button
              onClick={() => onSelectPage(Math.min(doc.pages.length - 1, currentPageIndex + 1))}
              disabled={currentPageIndex === doc.pages.length - 1}
              className="w-7 h-8 rounded-lg text-[#F5F1EA]/70 hover:text-white disabled:opacity-20 text-xs font-mono font-bold flex items-center justify-center shrink-0 active:scale-90 transition-all"
              aria-label="Next Page"
            >
              ▶
            </button>
          </div>

          {/* Add Elements Button */}
          <button
            onClick={() => onOpenSheet(activeSheet === 'add' ? null : 'add')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold shrink-0 active:scale-95 transition-all ${
              activeSheet === 'add'
                ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-md shadow-[#0057FF]/30'
                : 'bg-white/5 border-white/10 text-[#F5F1EA]/80 hover:text-white'
            }`}
          >
            <span className="text-sm">＋</span>
            <span>Add</span>
          </button>

          {/* Pages Button */}
          <button
            onClick={() => onOpenSheet(activeSheet === 'pages' ? null : 'pages')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold shrink-0 active:scale-95 transition-all ${
              activeSheet === 'pages'
                ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-md shadow-[#0057FF]/30'
                : 'bg-white/5 border-white/10 text-[#F5F1EA]/80 hover:text-white'
            }`}
          >
            <span className="text-sm">◫</span>
            <span>Pages</span>
          </button>

          {/* Templates & Themes */}
          <button
            onClick={() => onOpenSheet(activeSheet === 'templates' ? null : 'templates')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold shrink-0 active:scale-95 transition-all ${
              activeSheet === 'templates'
                ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-md shadow-[#0057FF]/30'
                : 'bg-white/5 border-white/10 text-[#F5F1EA]/80 hover:text-white'
            }`}
          >
            <span className="text-sm">✦</span>
            <span>Templates</span>
          </button>

          {/* Page Background */}
          <button
            onClick={() => onOpenSheet(activeSheet === 'background' ? null : 'background')}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold shrink-0 active:scale-95 transition-all ${
              activeSheet === 'background'
                ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-md shadow-[#0057FF]/30'
                : 'bg-white/5 border-white/10 text-[#F5F1EA]/80 hover:text-white'
            }`}
          >
            <span className="text-sm">■</span>
            <span>BG</span>
          </button>

          {/* Fit Canvas */}
          <button
            onClick={onResetZoom}
            className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-[#F5F1EA]/70 hover:text-white text-[10px] font-mono font-bold shrink-0 active:scale-95 transition-all"
            title="Fit Canvas"
          >
            <span className="text-sm">⊙</span>
            <span>Fit</span>
          </button>
        </div>
      )}
    </nav>
  );
}
