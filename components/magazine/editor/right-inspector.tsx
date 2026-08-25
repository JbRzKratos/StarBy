'use client';

import React from 'react';
import type {
  MagazineDocument,
  MagazineElement,
  AlignAction,
  DistributeAction,
} from '@/types/magazine';
import { PAGE_DIMENSIONS, DEFAULT_PAGE_DIMENSION } from '@/types/magazine';

interface RightInspectorProps {
  document: MagazineDocument;
  currentPageIndex: number;
  selectedElements: MagazineElement[];
  onUpdateElement: (elementId: string, updates: Partial<MagazineElement>) => void;
  onUpdatePageBackground: (color: string) => void;
  onUpdateDocumentProps: (updates: Partial<MagazineDocument>) => void;
  onAlign: (action: AlignAction) => void;
  onDistribute: (action: DistributeAction) => void;
  onDeleteSelected: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onToggleLock?: (elementId: string) => void;
}

export function RightInspector({
  document: doc,
  currentPageIndex,
  selectedElements,
  onUpdateElement,
  onUpdatePageBackground,
  onUpdateDocumentProps,
  onAlign,
  onDistribute,
  onDeleteSelected,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onToggleLock,
}: RightInspectorProps) {
  const activePage = doc.pages[currentPageIndex] || doc.pages[0];
  const dim = PAGE_DIMENSIONS[doc.dimensionKey] || DEFAULT_PAGE_DIMENSION;

  const isMultiSelect = selectedElements.length > 1;
  const singleElement = selectedElements.length === 1 ? selectedElements[0] : null;

  return (
    <aside className="w-[calc(100vw-2rem)] max-w-xs sm:w-72 xl:w-80 bg-[#121214] border-l border-[#F5F1EA]/10 flex flex-col h-full select-none text-[#F5F1EA] overflow-y-auto p-4 space-y-6 z-30">
      {/* ── 1. MULTI-SELECTION INSPECTOR ── */}
      {isMultiSelect && (
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F5F1EA]/10">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#0057FF] font-bold">
                MULTI-SELECTION
              </span>
              <h3 className="font-display text-sm font-bold">
                {selectedElements.length} Elements Selected
              </h3>
            </div>
            <button
              onClick={onDeleteSelected}
              className="p-1.5 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-mono font-bold"
            >
              ✕ Delete All
            </button>
          </div>

          {/* Alignment Tools */}
          <div className="space-y-2">
            <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase font-bold block">
              Align Objects
            </span>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
              {(['left', 'center', 'right', 'top', 'middle', 'bottom'] as AlignAction[]).map(
                (act) => (
                  <button
                    key={act}
                    onClick={() => onAlign(act)}
                    className="p-2 bg-[#16161A] hover:bg-[#202028] border border-[#F5F1EA]/10 rounded uppercase font-bold text-center text-[#F5F1EA]/80 hover:text-white transition-colors"
                  >
                    {act}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Distribution Tools */}
          <div className="space-y-2">
            <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase font-bold block">
              Distribute Spacing
            </span>
            <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
              <button
                onClick={() => onDistribute('horizontal')}
                className="p-2 bg-[#16161A] hover:bg-[#202028] border border-[#F5F1EA]/10 rounded font-bold text-center text-[#F5F1EA]/80 hover:text-white"
              >
                ↔ Horizontal
              </button>
              <button
                onClick={() => onDistribute('vertical')}
                className="p-2 bg-[#16161A] hover:bg-[#202028] border border-[#F5F1EA]/10 rounded font-bold text-center text-[#F5F1EA]/80 hover:text-white"
              >
                ↕ Vertical
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. SINGLE ELEMENT INSPECTOR ── */}
      {singleElement && !isMultiSelect && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#F5F1EA]/10">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#0057FF] font-bold">
                {singleElement.type.toUpperCase()} OBJECT
              </span>
              <h3 className="font-display text-sm font-bold truncate">{singleElement.name}</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onToggleLock?.(singleElement.id)}
                title={singleElement.locked ? 'Unlock' : 'Lock'}
                className={`p-1.5 rounded text-xs font-mono ${
                  singleElement.locked
                    ? 'text-amber-400 bg-amber-400/10'
                    : 'text-[#F5F1EA]/60 hover:text-white'
                }`}
              >
                {singleElement.locked ? '🔒' : '🔓'}
              </button>
              <button
                onClick={onDeleteSelected}
                title="Delete Object"
                className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400 text-xs font-mono"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Exact Numeric Geometry Inputs */}
          <div className="space-y-2">
            <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase font-bold block">
              Geometry & Transform (%)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#16161A] p-2 rounded-lg border border-[#F5F1EA]/10 space-y-1">
                <span className="text-[#F5F1EA]/40 block text-[9px]">X Position</span>
                <input
                  type="number"
                  value={Math.round(singleElement.frame.x)}
                  onChange={(e) =>
                    onUpdateElement(singleElement.id, {
                      frame: { ...singleElement.frame, x: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-transparent text-white font-bold outline-none"
                />
              </div>
              <div className="bg-[#16161A] p-2 rounded-lg border border-[#F5F1EA]/10 space-y-1">
                <span className="text-[#F5F1EA]/40 block text-[9px]">Y Position</span>
                <input
                  type="number"
                  value={Math.round(singleElement.frame.y)}
                  onChange={(e) =>
                    onUpdateElement(singleElement.id, {
                      frame: { ...singleElement.frame, y: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-transparent text-white font-bold outline-none"
                />
              </div>
              <div className="bg-[#16161A] p-2 rounded-lg border border-[#F5F1EA]/10 space-y-1">
                <span className="text-[#F5F1EA]/40 block text-[9px]">Width</span>
                <input
                  type="number"
                  value={Math.round(singleElement.frame.width)}
                  onChange={(e) =>
                    onUpdateElement(singleElement.id, {
                      frame: { ...singleElement.frame, width: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-transparent text-white font-bold outline-none"
                />
              </div>
              <div className="bg-[#16161A] p-2 rounded-lg border border-[#F5F1EA]/10 space-y-1">
                <span className="text-[#F5F1EA]/40 block text-[9px]">Height</span>
                <input
                  type="number"
                  value={Math.round(singleElement.frame.height)}
                  onChange={(e) =>
                    onUpdateElement(singleElement.id, {
                      frame: { ...singleElement.frame, height: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-transparent text-white font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="bg-[#16161A] p-2 rounded-lg border border-[#F5F1EA]/10 space-y-1">
                <span className="text-[#F5F1EA]/40 block text-[9px]">Rotation (°)</span>
                <input
                  type="number"
                  value={singleElement.frame.rotation || 0}
                  onChange={(e) =>
                    onUpdateElement(singleElement.id, {
                      frame: { ...singleElement.frame, rotation: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-transparent text-white font-bold outline-none"
                />
              </div>
              <div className="bg-[#16161A] p-2 rounded-lg border border-[#F5F1EA]/10 space-y-1">
                <span className="text-[#F5F1EA]/40 block text-[9px]">Opacity (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round((singleElement.opacity ?? 1) * 100)}
                  onChange={(e) =>
                    onUpdateElement(singleElement.id, {
                      opacity: Math.max(0, Math.min(100, Number(e.target.value))) / 100,
                    })
                  }
                  className="w-full bg-transparent text-white font-bold outline-none"
                />
              </div>
            </div>
          </div>

          {/* ── Typography Controls ── */}
          {(singleElement.type === 'text' ||
            singleElement.type === 'quote-block' ||
            singleElement.type === 'page-number') && (
            <div className="space-y-4">
              <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase font-bold block">
                Typography Styling
              </span>

              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Font Family
                </label>
                <select
                  value={singleElement.textStyle?.fontFamily || 'Inter, sans-serif'}
                  onChange={(e) =>
                    onUpdateElement(singleElement.id, {
                      textStyle: {
                        fontFamily: e.target.value,
                        fontSize: singleElement.textStyle?.fontSize || 12,
                        fontWeight: singleElement.textStyle?.fontWeight || 400,
                        color: singleElement.textStyle?.color || '#F5F1EA',
                        textAlign: singleElement.textStyle?.textAlign || 'left',
                      },
                    })
                  }
                  className="w-full bg-[#16161A] border border-[#F5F1EA]/15 p-2 rounded-lg text-xs font-mono text-white outline-none cursor-pointer"
                >
                  <option value="Playfair Display, serif">
                    Playfair Display (Editorial Serif)
                  </option>
                  <option value="Inter, sans-serif">Inter (Modern Clean Sans)</option>
                  <option value="Cinzel, serif">Cinzel (Luxury Classical)</option>
                  <option value="Space Mono, monospace">Space Mono (Technical Monospace)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                    Font Size (pt)
                  </label>
                  <input
                    type="number"
                    value={singleElement.textStyle?.fontSize || 12}
                    onChange={(e) =>
                      onUpdateElement(singleElement.id, {
                        textStyle: {
                          fontFamily: singleElement.textStyle?.fontFamily || 'Inter, sans-serif',
                          fontSize: Number(e.target.value),
                          fontWeight: singleElement.textStyle?.fontWeight || 400,
                          color: singleElement.textStyle?.color || '#F5F1EA',
                          textAlign: singleElement.textStyle?.textAlign || 'left',
                        },
                      })
                    }
                    className="w-full bg-[#16161A] border border-[#F5F1EA]/15 p-2 rounded-lg text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={singleElement.textStyle?.color || '#F5F1EA'}
                    onChange={(e) =>
                      onUpdateElement(singleElement.id, {
                        textStyle: {
                          fontFamily: singleElement.textStyle?.fontFamily || 'Inter, sans-serif',
                          fontSize: singleElement.textStyle?.fontSize || 12,
                          fontWeight: singleElement.textStyle?.fontWeight || 400,
                          color: e.target.value,
                          textAlign: singleElement.textStyle?.textAlign || 'left',
                        },
                      })
                    }
                    className="w-full h-8 bg-transparent cursor-pointer rounded border border-[#F5F1EA]/15"
                  />
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Horizontal Alignment
                </label>
                <div className="flex gap-1 bg-[#16161A] p-1 rounded-lg border border-[#F5F1EA]/15">
                  {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() =>
                        onUpdateElement(singleElement.id, {
                          textStyle: {
                            fontFamily: singleElement.textStyle?.fontFamily || 'Inter, sans-serif',
                            fontSize: singleElement.textStyle?.fontSize || 12,
                            fontWeight: singleElement.textStyle?.fontWeight || 400,
                            color: singleElement.textStyle?.color || '#F5F1EA',
                            textAlign: align,
                          },
                        })
                      }
                      className={`flex-1 py-1 text-xs font-mono rounded uppercase ${
                        singleElement.textStyle?.textAlign === align
                          ? 'bg-[#0057FF] text-white font-bold'
                          : 'text-[#F5F1EA]/50 hover:text-white'
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Image Controls ── */}
          {singleElement.type === 'image' && (
            <div className="space-y-4">
              <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase font-bold block">
                Image Source & Fit
              </span>
              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={singleElement.content || ''}
                  onChange={(e) => onUpdateElement(singleElement.id, { content: e.target.value })}
                  className="w-full bg-[#16161A] border border-[#F5F1EA]/15 p-2 rounded-lg text-xs font-mono text-white outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Fit Mode
                </label>
                <div className="flex gap-1 bg-[#16161A] p-1 rounded-lg border border-[#F5F1EA]/15">
                  {(['cover', 'contain', 'fill'] as const).map((fit) => (
                    <button
                      key={fit}
                      onClick={() =>
                        onUpdateElement(singleElement.id, {
                          imageStyle: {
                            objectFit: fit,
                            borderRadius: singleElement.imageStyle?.borderRadius || 0,
                          },
                        })
                      }
                      className={`flex-1 py-1 text-xs font-mono rounded uppercase ${
                        singleElement.imageStyle?.objectFit === fit
                          ? 'bg-[#0057FF] text-white font-bold'
                          : 'text-[#F5F1EA]/50 hover:text-white'
                      }`}
                    >
                      {fit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#16161A] border border-[#F5F1EA]/15 font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[#F5F1EA]/80 font-bold">
                  {singleElement.originalDpi || 300} DPI (Print-Ready)
                </span>
              </div>
            </div>
          )}

          {/* ── Shape / Line Controls ── */}
          {(singleElement.type === 'shape' ||
            singleElement.type === 'circle' ||
            singleElement.type === 'line' ||
            singleElement.type === 'divider') && (
            <div className="space-y-3">
              <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase font-bold block">
                Shape Colors & Stroke
              </span>
              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Fill Color
                </label>
                <input
                  type="color"
                  value={singleElement.shapeStyle?.fillColor || '#0057FF'}
                  onChange={(e) =>
                    onUpdateElement(singleElement.id, {
                      shapeStyle: {
                        fillColor: e.target.value,
                        ...(singleElement.shapeStyle?.strokeWidth !== undefined
                          ? { strokeWidth: singleElement.shapeStyle.strokeWidth }
                          : {}),
                        ...(singleElement.shapeStyle?.borderRadius !== undefined
                          ? { borderRadius: singleElement.shapeStyle.borderRadius }
                          : {}),
                      },
                    })
                  }
                  className="w-full h-8 bg-transparent cursor-pointer rounded border border-[#F5F1EA]/15"
                />
              </div>
            </div>
          )}

          {/* ── Layer Order Controls ── */}
          <div className="space-y-2 pt-2 border-t border-[#F5F1EA]/10">
            <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase font-bold block">
              Layer Arrangement
            </span>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
              <button
                onClick={onBringForward}
                className="p-1.5 bg-[#16161A] hover:bg-[#202028] border border-[#F5F1EA]/10 rounded text-center text-[#F5F1EA]/80 hover:text-white"
              >
                ▲ Bring Forward
              </button>
              <button
                onClick={onSendBackward}
                className="p-1.5 bg-[#16161A] hover:bg-[#202028] border border-[#F5F1EA]/10 rounded text-center text-[#F5F1EA]/80 hover:text-white"
              >
                ▼ Send Backward
              </button>
              <button
                onClick={onBringToFront}
                className="p-1.5 bg-[#16161A] hover:bg-[#202028] border border-[#F5F1EA]/10 rounded text-center text-[#F5F1EA]/80 hover:text-white"
              >
                ⤒ Bring to Front
              </button>
              <button
                onClick={onSendToBack}
                className="p-1.5 bg-[#16161A] hover:bg-[#202028] border border-[#F5F1EA]/10 rounded text-center text-[#F5F1EA]/80 hover:text-white"
              >
                ⤓ Send to Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. DOCUMENT & PRINT SETTINGS (WHEN NO ELEMENT SELECTED) ── */}
      {selectedElements.length === 0 && (
        <div className="space-y-6">
          <div className="pb-3 border-b border-[#F5F1EA]/10">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#0057FF] font-bold">
              DOCUMENT SETTINGS
            </span>
            <h3 className="font-display text-sm font-bold truncate">
              {doc.title || 'Magazine Properties'}
            </h3>
          </div>

          {/* Active Page Background Color */}
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase font-bold block">
              Active Page Background (Page {currentPageIndex + 1})
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={activePage?.backgroundColor || doc.theme.backgroundColor || '#0D0D0E'}
                onChange={(e) => onUpdatePageBackground(e.target.value)}
                className="w-10 h-10 bg-transparent cursor-pointer rounded-lg border border-[#F5F1EA]/20"
              />
              <span className="font-mono text-xs text-[#F5F1EA]/70">
                {activePage?.backgroundColor || doc.theme.backgroundColor || '#0D0D0E'}
              </span>
            </div>
          </div>

          {/* Print Specifications */}
          <div className="space-y-3">
            <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase font-bold block">
              Paper & Binding Specs
            </span>
            <div className="p-3.5 bg-[#16161A] rounded-xl border border-[#F5F1EA]/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#F5F1EA]/50">Format:</span>
                <span className="font-bold text-white">{dim.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#F5F1EA]/50">Dimensions:</span>
                <span>
                  {dim.widthMm} × {dim.heightMm} mm
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#F5F1EA]/50">Bleed:</span>
                <span className="text-emerald-400">+{dim.bleedMm}mm (300 DPI)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#F5F1EA]/50">Total Pages:</span>
                <span className="font-bold text-white">{doc.pages.length} Pages</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase font-bold block">
              Cover Finish
            </label>
            <select
              value={doc.coverFinish}
              onChange={(e) =>
                onUpdateDocumentProps({
                  coverFinish: e.target.value as 'soft-touch' | 'gloss' | 'matte',
                })
              }
              className="w-full bg-[#16161A] border border-[#F5F1EA]/15 p-2.5 rounded-lg text-xs font-mono text-white outline-none cursor-pointer"
            >
              <option value="soft-touch">Velvet Soft-Touch Matte (300gsm)</option>
              <option value="gloss">High-Gloss UV Coated (300gsm)</option>
              <option value="matte">Classic Fine Matte (300gsm)</option>
            </select>
          </div>
        </div>
      )}
    </aside>
  );
}
