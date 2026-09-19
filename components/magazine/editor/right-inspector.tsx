'use client';

import React, { useRef } from 'react';
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
  /** Called on every keystroke/change for live canvas preview */
  onUpdateElementLive: (elementId: string, updates: Partial<MagazineElement>) => void;
  /** Called on blur/commit to push to undo stack */
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
  onReplaceImage?: (file: File) => Promise<void>;
  onClose?: (() => void) | undefined;
}

export function RightInspector({
  document: doc,
  currentPageIndex,
  selectedElements,
  onUpdateElementLive,
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
  onReplaceImage,
  onClose,
}: RightInspectorProps) {
  const activePage = doc.pages[currentPageIndex] || doc.pages[0];
  const dim = PAGE_DIMENSIONS[doc.dimensionKey] || DEFAULT_PAGE_DIMENSION;
  const replaceImageInputRef = useRef<HTMLInputElement>(null);

  const isMultiSelect = selectedElements.length > 1;
  const singleElement = selectedElements.length === 1 ? selectedElements[0] : null;

  return (
    <aside className="w-full sm:w-72 xl:w-80 bg-[#121214] border-l border-[#F5F1EA]/10 flex flex-col h-full select-none text-[#F5F1EA] overflow-y-auto p-4 pb-24 sm:pb-6 space-y-6 z-30">
      {onClose && (
        <div className="flex items-center justify-between pb-3 border-b border-[#F5F1EA]/10 shrink-0">
          <span className="font-mono text-[10px] text-[#F5F1EA]/60 uppercase tracking-widest font-bold">
            Inspector Panel
          </span>
          <button
            onClick={onClose}
            className="p-1 px-2 rounded-md bg-[#1A1A20] hover:bg-[#25252E] text-xs font-mono text-[#F5F1EA]/80 hover:text-white transition-colors"
            title="Close Inspector"
          >
            ✕ Close
          </button>
        </div>
      )}
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

          {/* Geometry & Transform â€” sliders + manual inputs, both live-update canvas */}
          <div className="space-y-3">
            <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase font-bold block">
              Geometry &amp; Transform (%)
            </span>

            {/* X Position */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-[#F5F1EA]/40 uppercase">X Position</span>
                <input
                  type="number"
                  value={Math.round(singleElement.frame.x)}
                  onChange={(e) =>
                    onUpdateElementLive(singleElement.id, {
                      frame: { ...singleElement.frame, x: Number(e.target.value) },
                    })
                  }
                  onBlur={(e) =>
                    onUpdateElement(singleElement.id, {
                      frame: { ...singleElement.frame, x: Number(e.target.value) },
                    })
                  }
                  className="w-14 bg-[#16161A] border border-[#F5F1EA]/15 focus:border-[#0057FF] text-white font-bold text-xs font-mono text-right px-1.5 py-0.5 rounded outline-none"
                />
              </div>
              <input
                type="range"
                min="-50"
                max="150"
                step="1"
                value={Math.round(singleElement.frame.x)}
                onChange={(e) =>
                  onUpdateElementLive(singleElement.id, {
                    frame: { ...singleElement.frame, x: Number(e.target.value) },
                  })
                }
                onMouseUp={(e) =>
                  onUpdateElement(singleElement.id, {
                    frame: {
                      ...singleElement.frame,
                      x: Number((e.target as HTMLInputElement).value),
                    },
                  })
                }
                onTouchEnd={(e) =>
                  onUpdateElement(singleElement.id, {
                    frame: {
                      ...singleElement.frame,
                      x: Number((e.target as HTMLInputElement).value),
                    },
                  })
                }
                className="w-full h-1.5 accent-[#0057FF] cursor-pointer"
              />
            </div>

            {/* Y Position */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-[#F5F1EA]/40 uppercase">Y Position</span>
                <input
                  type="number"
                  value={Math.round(singleElement.frame.y)}
                  onChange={(e) =>
                    onUpdateElementLive(singleElement.id, {
                      frame: { ...singleElement.frame, y: Number(e.target.value) },
                    })
                  }
                  onBlur={(e) =>
                    onUpdateElement(singleElement.id, {
                      frame: { ...singleElement.frame, y: Number(e.target.value) },
                    })
                  }
                  className="w-14 bg-[#16161A] border border-[#F5F1EA]/15 focus:border-[#0057FF] text-white font-bold text-xs font-mono text-right px-1.5 py-0.5 rounded outline-none"
                />
              </div>
              <input
                type="range"
                min="-50"
                max="150"
                step="1"
                value={Math.round(singleElement.frame.y)}
                onChange={(e) =>
                  onUpdateElementLive(singleElement.id, {
                    frame: { ...singleElement.frame, y: Number(e.target.value) },
                  })
                }
                onMouseUp={(e) =>
                  onUpdateElement(singleElement.id, {
                    frame: {
                      ...singleElement.frame,
                      y: Number((e.target as HTMLInputElement).value),
                    },
                  })
                }
                onTouchEnd={(e) =>
                  onUpdateElement(singleElement.id, {
                    frame: {
                      ...singleElement.frame,
                      y: Number((e.target as HTMLInputElement).value),
                    },
                  })
                }
                className="w-full h-1.5 accent-[#0057FF] cursor-pointer"
              />
            </div>

            {/* Width */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-[#F5F1EA]/40 uppercase">Width</span>
                <input
                  type="number"
                  min="1"
                  value={Math.round(singleElement.frame.width)}
                  onChange={(e) =>
                    onUpdateElementLive(singleElement.id, {
                      frame: { ...singleElement.frame, width: Math.max(1, Number(e.target.value)) },
                    })
                  }
                  onBlur={(e) =>
                    onUpdateElement(singleElement.id, {
                      frame: { ...singleElement.frame, width: Math.max(1, Number(e.target.value)) },
                    })
                  }
                  className="w-14 bg-[#16161A] border border-[#F5F1EA]/15 focus:border-[#0057FF] text-white font-bold text-xs font-mono text-right px-1.5 py-0.5 rounded outline-none"
                />
              </div>
              <input
                type="range"
                min="1"
                max="150"
                step="1"
                value={Math.round(singleElement.frame.width)}
                onChange={(e) =>
                  onUpdateElementLive(singleElement.id, {
                    frame: { ...singleElement.frame, width: Number(e.target.value) },
                  })
                }
                onMouseUp={(e) =>
                  onUpdateElement(singleElement.id, {
                    frame: {
                      ...singleElement.frame,
                      width: Number((e.target as HTMLInputElement).value),
                    },
                  })
                }
                onTouchEnd={(e) =>
                  onUpdateElement(singleElement.id, {
                    frame: {
                      ...singleElement.frame,
                      width: Number((e.target as HTMLInputElement).value),
                    },
                  })
                }
                className="w-full h-1.5 accent-[#0057FF] cursor-pointer"
              />
            </div>

            {/* Height */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-[#F5F1EA]/40 uppercase">Height</span>
                <input
                  type="number"
                  min="1"
                  value={Math.round(singleElement.frame.height)}
                  onChange={(e) =>
                    onUpdateElementLive(singleElement.id, {
                      frame: {
                        ...singleElement.frame,
                        height: Math.max(1, Number(e.target.value)),
                      },
                    })
                  }
                  onBlur={(e) =>
                    onUpdateElement(singleElement.id, {
                      frame: {
                        ...singleElement.frame,
                        height: Math.max(1, Number(e.target.value)),
                      },
                    })
                  }
                  className="w-14 bg-[#16161A] border border-[#F5F1EA]/15 focus:border-[#0057FF] text-white font-bold text-xs font-mono text-right px-1.5 py-0.5 rounded outline-none"
                />
              </div>
              <input
                type="range"
                min="1"
                max="150"
                step="1"
                value={Math.round(singleElement.frame.height)}
                onChange={(e) =>
                  onUpdateElementLive(singleElement.id, {
                    frame: { ...singleElement.frame, height: Number(e.target.value) },
                  })
                }
                onMouseUp={(e) =>
                  onUpdateElement(singleElement.id, {
                    frame: {
                      ...singleElement.frame,
                      height: Number((e.target as HTMLInputElement).value),
                    },
                  })
                }
                onTouchEnd={(e) =>
                  onUpdateElement(singleElement.id, {
                    frame: {
                      ...singleElement.frame,
                      height: Number((e.target as HTMLInputElement).value),
                    },
                  })
                }
                className="w-full h-1.5 accent-[#0057FF] cursor-pointer"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-[#F5F1EA]/40 uppercase">
                  Rotation (deg)
                </span>
                <input
                  type="number"
                  min="-180"
                  max="180"
                  value={singleElement.frame.rotation || 0}
                  onChange={(e) =>
                    onUpdateElementLive(singleElement.id, {
                      frame: { ...singleElement.frame, rotation: Number(e.target.value) },
                    })
                  }
                  onBlur={(e) =>
                    onUpdateElement(singleElement.id, {
                      frame: { ...singleElement.frame, rotation: Number(e.target.value) },
                    })
                  }
                  className="w-14 bg-[#16161A] border border-[#F5F1EA]/15 focus:border-[#0057FF] text-white font-bold text-xs font-mono text-right px-1.5 py-0.5 rounded outline-none"
                />
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={singleElement.frame.rotation || 0}
                onChange={(e) =>
                  onUpdateElementLive(singleElement.id, {
                    frame: { ...singleElement.frame, rotation: Number(e.target.value) },
                  })
                }
                onMouseUp={(e) =>
                  onUpdateElement(singleElement.id, {
                    frame: {
                      ...singleElement.frame,
                      rotation: Number((e.target as HTMLInputElement).value),
                    },
                  })
                }
                onTouchEnd={(e) =>
                  onUpdateElement(singleElement.id, {
                    frame: {
                      ...singleElement.frame,
                      rotation: Number((e.target as HTMLInputElement).value),
                    },
                  })
                }
                className="w-full h-1.5 accent-[#0057FF] cursor-pointer"
              />
            </div>

            {/* Opacity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-[#F5F1EA]/40 uppercase">
                  Opacity (%)
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round((singleElement.opacity ?? 1) * 100)}
                  onChange={(e) =>
                    onUpdateElementLive(singleElement.id, {
                      opacity: Math.max(0, Math.min(100, Number(e.target.value))) / 100,
                    })
                  }
                  onBlur={(e) =>
                    onUpdateElement(singleElement.id, {
                      opacity: Math.max(0, Math.min(100, Number(e.target.value))) / 100,
                    })
                  }
                  className="w-14 bg-[#16161A] border border-[#F5F1EA]/15 focus:border-[#0057FF] text-white font-bold text-xs font-mono text-right px-1.5 py-0.5 rounded outline-none"
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round((singleElement.opacity ?? 1) * 100)}
                onChange={(e) =>
                  onUpdateElementLive(singleElement.id, {
                    opacity: Number(e.target.value) / 100,
                  })
                }
                onMouseUp={(e) =>
                  onUpdateElement(singleElement.id, {
                    opacity: Number((e.target as HTMLInputElement).value) / 100,
                  })
                }
                onTouchEnd={(e) =>
                  onUpdateElement(singleElement.id, {
                    opacity: Number((e.target as HTMLInputElement).value) / 100,
                  })
                }
                className="w-full h-1.5 accent-[#0057FF] cursor-pointer"
              />
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
                  Text Content
                </label>
                <textarea
                  rows={3}
                  value={singleElement.content || ''}
                  onChange={(e) =>
                    onUpdateElementLive(singleElement.id, { content: e.target.value })
                  }
                  onBlur={(e) => onUpdateElement(singleElement.id, { content: e.target.value })}
                  placeholder="Enter text..."
                  className="w-full bg-[#16161A] border border-[#F5F1EA]/15 focus:border-[#0057FF] p-2 rounded-lg text-xs font-mono text-white outline-none resize-y"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Font Family
                </label>
                <select
                  value={singleElement.textStyle?.fontFamily || 'Inter, sans-serif'}
                  onChange={(e) => {
                    const updates = {
                      textStyle: {
                        fontFamily: e.target.value,
                        fontSize: singleElement.textStyle?.fontSize || 12,
                        fontWeight: singleElement.textStyle?.fontWeight || 400,
                        color: singleElement.textStyle?.color || '#F5F1EA',
                        textAlign: singleElement.textStyle?.textAlign || 'left',
                      },
                    };
                    onUpdateElementLive(singleElement.id, updates);
                    onUpdateElement(singleElement.id, updates);
                  }}
                  className="w-full bg-[#16161A] border border-[#F5F1EA]/15 p-2 rounded-lg text-xs font-mono text-white outline-none cursor-pointer"
                >
                  <option value="Playfair Display, serif">
                    Playfair Display (Editorial Serif)
                  </option>
                  <option value="Inter, sans-serif">Inter (Modern Clean Sans)</option>
                  <option value="Cinzel, serif">Cinzel (Luxury Classical)</option>
                  <option value="Space Mono, monospace">Space Mono (Technical Monospace)</option>
                  <option value="Bebas Neue, sans-serif">Bebas Neue (Display)</option>
                  <option value="DM Serif Display, serif">DM Serif Display</option>
                  <option value="Cormorant Garamond, serif">Cormorant Garamond (Elegant)</option>
                  <option value="Montserrat, sans-serif">Montserrat (Magazine Sans)</option>
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
                    onChange={(e) => {
                      const updates = {
                        textStyle: {
                          fontFamily: singleElement.textStyle?.fontFamily || 'Inter, sans-serif',
                          fontSize: Number(e.target.value),
                          fontWeight: singleElement.textStyle?.fontWeight || 400,
                          color: singleElement.textStyle?.color || '#F5F1EA',
                          textAlign: singleElement.textStyle?.textAlign || 'left',
                        },
                      };
                      onUpdateElementLive(singleElement.id, updates);
                    }}
                    onBlur={(e) =>
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
                    onChange={(e) => {
                      const updates = {
                        textStyle: {
                          fontFamily: singleElement.textStyle?.fontFamily || 'Inter, sans-serif',
                          fontSize: singleElement.textStyle?.fontSize || 12,
                          fontWeight: singleElement.textStyle?.fontWeight || 400,
                          color: e.target.value,
                          textAlign: singleElement.textStyle?.textAlign || 'left',
                        },
                      };
                      onUpdateElementLive(singleElement.id, updates);
                      onUpdateElement(singleElement.id, updates);
                    }}
                    className="w-full h-8 bg-transparent cursor-pointer rounded border border-[#F5F1EA]/15"
                  />
                </div>
              </div>

              {/* Font Weight */}
              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Font Weight
                </label>
                <div className="flex gap-1 bg-[#16161A] p-1 rounded-lg border border-[#F5F1EA]/15">
                  {([300, 400, 500, 600, 700, 900] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => {
                        const updates = {
                          textStyle: {
                            fontFamily: singleElement.textStyle?.fontFamily || 'Inter, sans-serif',
                            fontSize: singleElement.textStyle?.fontSize || 12,
                            fontWeight: w,
                            color: singleElement.textStyle?.color || '#F5F1EA',
                            textAlign: singleElement.textStyle?.textAlign || 'left',
                          },
                        };
                        onUpdateElementLive(singleElement.id, updates);
                        onUpdateElement(singleElement.id, updates);
                      }}
                      className={`flex-1 py-1 text-[10px] font-mono rounded ${
                        (singleElement.textStyle?.fontWeight || 400) === w
                          ? 'bg-[#0057FF] text-white font-bold'
                          : 'text-[#F5F1EA]/50 hover:text-white'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Alignment
                </label>
                <div className="flex gap-1 bg-[#16161A] p-1 rounded-lg border border-[#F5F1EA]/15">
                  {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => {
                        const updates = {
                          textStyle: {
                            fontFamily: singleElement.textStyle?.fontFamily || 'Inter, sans-serif',
                            fontSize: singleElement.textStyle?.fontSize || 12,
                            fontWeight: singleElement.textStyle?.fontWeight || 400,
                            color: singleElement.textStyle?.color || '#F5F1EA',
                            textAlign: align,
                          },
                        };
                        onUpdateElementLive(singleElement.id, updates);
                        onUpdateElement(singleElement.id, updates);
                      }}
                      className={`flex-1 py-1 text-xs font-mono rounded uppercase ${
                        singleElement.textStyle?.textAlign === align
                          ? 'bg-[#0057FF] text-white font-bold'
                          : 'text-[#F5F1EA]/50 hover:text-white'
                      }`}
                    >
                      {align[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Letter Spacing */}
              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Letter Spacing (em): {(singleElement.textStyle?.letterSpacing ?? 0).toFixed(2)}
                </label>
                <input
                  type="range"
                  min="-0.1"
                  max="0.5"
                  step="0.01"
                  value={singleElement.textStyle?.letterSpacing ?? 0}
                  onChange={(e) => {
                    const updates = {
                      textStyle: {
                        ...(singleElement.textStyle || {
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 12,
                          fontWeight: 400,
                          color: '#F5F1EA',
                          textAlign: 'left' as const,
                        }),
                        letterSpacing: Number(e.target.value),
                      },
                    };
                    onUpdateElementLive(singleElement.id, updates);
                  }}
                  onMouseUp={(e) => {
                    const updates = {
                      textStyle: {
                        ...(singleElement.textStyle || {
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 12,
                          fontWeight: 400,
                          color: '#F5F1EA',
                          textAlign: 'left' as const,
                        }),
                        letterSpacing: Number((e.target as HTMLInputElement).value),
                      },
                    };
                    onUpdateElement(singleElement.id, updates);
                  }}
                  className="w-full accent-[#0057FF]"
                />
              </div>

              {/* Line Height */}
              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Line Height: {(singleElement.textStyle?.lineHeight ?? 1.4).toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="3"
                  step="0.1"
                  value={singleElement.textStyle?.lineHeight ?? 1.4}
                  onChange={(e) => {
                    const updates = {
                      textStyle: {
                        ...(singleElement.textStyle || {
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 12,
                          fontWeight: 400,
                          color: '#F5F1EA',
                          textAlign: 'left' as const,
                        }),
                        lineHeight: Number(e.target.value),
                      },
                    };
                    onUpdateElementLive(singleElement.id, updates);
                  }}
                  onMouseUp={(e) => {
                    const updates = {
                      textStyle: {
                        ...(singleElement.textStyle || {
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 12,
                          fontWeight: 400,
                          color: '#F5F1EA',
                          textAlign: 'left' as const,
                        }),
                        lineHeight: Number((e.target as HTMLInputElement).value),
                      },
                    };
                    onUpdateElement(singleElement.id, updates);
                  }}
                  className="w-full accent-[#0057FF]"
                />
              </div>

              {/* Text Transform */}
              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Text Transform
                </label>
                <div className="flex gap-1 bg-[#16161A] p-1 rounded-lg border border-[#F5F1EA]/15">
                  {(['none', 'uppercase', 'lowercase', 'capitalize'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        const updates = {
                          textStyle: {
                            ...(singleElement.textStyle || {
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 12,
                              fontWeight: 400,
                              color: '#F5F1EA',
                              textAlign: 'left' as const,
                            }),
                            textTransform: t,
                          },
                        };
                        onUpdateElementLive(singleElement.id, updates);
                        onUpdateElement(singleElement.id, updates);
                      }}
                      className={`flex-1 py-1 text-[9px] font-mono rounded uppercase truncate ${
                        (singleElement.textStyle?.textTransform || 'none') === t
                          ? 'bg-[#0057FF] text-white font-bold'
                          : 'text-[#F5F1EA]/50 hover:text-white'
                      }`}
                    >
                      {t === 'none' ? 'As-is' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Text Box Background
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={singleElement.backgroundColor || '#00000000'}
                    onChange={(e) => {
                      onUpdateElementLive(singleElement.id, {
                        backgroundColor: e.target.value,
                      });
                      onUpdateElement(singleElement.id, { backgroundColor: e.target.value });
                    }}
                    className="w-8 h-8 bg-transparent cursor-pointer rounded border border-[#F5F1EA]/15"
                  />
                  <button
                    onClick={() => {
                      onUpdateElementLive(singleElement.id, { backgroundColor: undefined });
                      onUpdateElement(singleElement.id, { backgroundColor: undefined });
                    }}
                    className="text-[10px] font-mono text-[#F5F1EA]/40 hover:text-white"
                  >
                    Clear
                  </button>
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
              {/* Replace Image button */}
              <div>
                <input
                  ref={replaceImageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onReplaceImage) {
                      onReplaceImage(file);
                    }
                    if (replaceImageInputRef.current) replaceImageInputRef.current.value = '';
                  }}
                />
                <button
                  onClick={() => replaceImageInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#0057FF]/15 hover:bg-[#0057FF]/25 border border-[#0057FF]/40 hover:border-[#0057FF] text-[#0057FF] font-mono text-xs font-bold uppercase transition-all"
                >
                  <span>↑</span> Replace Image
                </button>
              </div>

              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Or paste Image URL
                </label>
                <input
                  type="text"
                  value={
                    singleElement.content?.startsWith('data:') ? '' : singleElement.content || ''
                  }
                  onChange={(e) =>
                    onUpdateElementLive(singleElement.id, { content: e.target.value })
                  }
                  onBlur={(e) => onUpdateElement(singleElement.id, { content: e.target.value })}
                  placeholder="https://..."
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
                      onClick={() => {
                        const updates = {
                          imageStyle: {
                            objectFit: fit,
                            borderRadius: singleElement.imageStyle?.borderRadius || 0,
                          },
                        };
                        onUpdateElementLive(singleElement.id, updates);
                        onUpdateElement(singleElement.id, updates);
                      }}
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

              {/* Border Radius */}
              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Corner Radius: {singleElement.imageStyle?.borderRadius ?? 0}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={singleElement.imageStyle?.borderRadius ?? 0}
                  onChange={(e) => {
                    const updates = {
                      imageStyle: {
                        objectFit: singleElement.imageStyle?.objectFit || ('cover' as const),
                        borderRadius: Number(e.target.value),
                      },
                    };
                    onUpdateElementLive(singleElement.id, updates);
                  }}
                  onMouseUp={(e) => {
                    const updates = {
                      imageStyle: {
                        objectFit: singleElement.imageStyle?.objectFit || ('cover' as const),
                        borderRadius: Number((e.target as HTMLInputElement).value),
                      },
                    };
                    onUpdateElement(singleElement.id, updates);
                  }}
                  className="w-full accent-[#0057FF]"
                />
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
                  onChange={(e) => {
                    const updates = {
                      shapeStyle: {
                        fillColor: e.target.value,
                        ...(singleElement.shapeStyle?.strokeWidth !== undefined
                          ? { strokeWidth: singleElement.shapeStyle.strokeWidth }
                          : {}),
                        ...(singleElement.shapeStyle?.borderRadius !== undefined
                          ? { borderRadius: singleElement.shapeStyle.borderRadius }
                          : {}),
                      },
                    };
                    onUpdateElementLive(singleElement.id, updates);
                    onUpdateElement(singleElement.id, updates);
                  }}
                  className="w-full h-8 bg-transparent cursor-pointer rounded border border-[#F5F1EA]/15"
                />
              </div>
              {/* Stroke Width */}
              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Stroke Width: {singleElement.shapeStyle?.strokeWidth ?? 0}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={singleElement.shapeStyle?.strokeWidth ?? 0}
                  onChange={(e) => {
                    const updates = {
                      shapeStyle: {
                        ...(singleElement.shapeStyle || {}),
                        strokeWidth: Number(e.target.value),
                      },
                    };
                    onUpdateElementLive(singleElement.id, updates);
                  }}
                  onMouseUp={(e) => {
                    const updates = {
                      shapeStyle: {
                        ...(singleElement.shapeStyle || {}),
                        strokeWidth: Number((e.target as HTMLInputElement).value),
                      },
                    };
                    onUpdateElement(singleElement.id, updates);
                  }}
                  className="w-full accent-[#0057FF]"
                />
              </div>

              {/* Stroke Color */}
              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Stroke Color
                </label>
                <input
                  type="color"
                  value={singleElement.shapeStyle?.strokeColor || '#000000'}
                  onChange={(e) => {
                    const updates = {
                      shapeStyle: {
                        ...(singleElement.shapeStyle || {}),
                        strokeColor: e.target.value,
                      },
                    };
                    onUpdateElementLive(singleElement.id, updates);
                    onUpdateElement(singleElement.id, updates);
                  }}
                  className="w-full h-8 bg-transparent cursor-pointer rounded border border-[#F5F1EA]/15"
                />
              </div>

              {/* Line Style (for lines, dividers, and stroked shapes) */}
              <div>
                <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                  Line / Border Style
                </label>
                <div className="flex gap-1 bg-[#16161A] p-1 rounded-lg border border-[#F5F1EA]/15">
                  {(['solid', 'dashed', 'dotted'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        const updates = {
                          shapeStyle: {
                            ...(singleElement.shapeStyle || {}),
                            lineStyle: st,
                          },
                        };
                        onUpdateElementLive(singleElement.id, updates);
                        onUpdateElement(singleElement.id, updates);
                      }}
                      className={`flex-1 py-1 text-[10px] font-mono rounded uppercase ${
                        (singleElement.shapeStyle?.lineStyle || 'solid') === st
                          ? 'bg-[#0057FF] text-white font-bold'
                          : 'text-[#F5F1EA]/50 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shape Corner Radius */}
              {singleElement.type === 'shape' && (
                <div>
                  <label className="font-mono text-[10px] text-[#F5F1EA]/60 block mb-1">
                    Corner Radius: {singleElement.shapeStyle?.borderRadius ?? 0}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={singleElement.shapeStyle?.borderRadius ?? 0}
                    onChange={(e) => {
                      const updates = {
                        shapeStyle: {
                          ...(singleElement.shapeStyle || {}),
                          borderRadius: Number(e.target.value),
                        },
                      };
                      onUpdateElementLive(singleElement.id, updates);
                    }}
                    onMouseUp={(e) => {
                      const updates = {
                        shapeStyle: {
                          ...(singleElement.shapeStyle || {}),
                          borderRadius: Number((e.target as HTMLInputElement).value),
                        },
                      };
                      onUpdateElement(singleElement.id, updates);
                    }}
                    className="w-full accent-[#0057FF]"
                  />
                </div>
              )}
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
