'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import type {
  MagazineDocument,
  MagazinePage,
  MagazineElement,
  ElementFrame,
  ElementCrop,
} from '@/types/magazine';
import { PAGE_DIMENSIONS, DEFAULT_PAGE_DIMENSION } from '@/types/magazine';
import { TransformBox } from './transform-box';
import { TextInlineEditor } from './text-inline-editor';
import { ImageCropOverlay } from './image-crop-overlay';
import { CanvasRuler } from './ruler';
import { SmartGuidesOverlay, type Guide } from './smart-guides';
import { snapElementPosition } from '@/lib/magazine/editor-state';

interface CanvasWorkspaceProps {
  document: MagazineDocument;
  currentPageIndex: number;
  selectedElementIds: string[];
  viewMode: 'page' | 'spread';
  zoom: number;
  showGuides: boolean;
  showGrid: boolean;
  showRulers: boolean;
  enableSnap: boolean;
  onSelectElements: (elementIds: string[]) => void;
  onUpdateElement: (
    pageIndex: number,
    elementId: string,
    updates: Partial<MagazineElement>,
    isFinal: boolean,
  ) => void;
  onDuplicateSelected?: (() => void) | undefined;
  onDeleteSelected?: (() => void) | undefined;
  onBringForward?: (() => void) | undefined;
  onSendBackward?: (() => void) | undefined;
  onToggleLock?: ((elementId: string) => void) | undefined;
}

export function CanvasWorkspace({
  document: doc,
  currentPageIndex,
  selectedElementIds,
  viewMode,
  zoom,
  showGuides,
  showGrid,
  showRulers,
  enableSnap,
  onSelectElements,
  onUpdateElement,
  onDuplicateSelected,
  onDeleteSelected,
  onBringForward,
  onSendBackward,
  onToggleLock,
}: CanvasWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageDomRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Active interaction states
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [croppingImageId, setCroppingImageId] = useState<string | null>(null);
  const [activeGuides, setActiveGuides] = useState<Guide[]>([]);
  const [cursorMm, setCursorMm] = useState<{ x: number; y: number } | undefined>();

  // Marquee selection state
  const [marqueeBox, setMarqueeBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Pan state (Space + Drag or Middle Mouse)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{
    startX: number;
    startY: number;
    initPanX: number;
    initPanY: number;
  } | null>(null);
  const isSpacePressedRef = useRef(false);

  const dim = PAGE_DIMENSIONS[doc.dimensionKey] || DEFAULT_PAGE_DIMENSION;

  // Intrinsic document dimensions in screen pixels (96 DPI conversion)
  const MM_TO_PX = 3.7795275591;
  const pageWidthPx = Math.round(dim.widthMm * MM_TO_PX);
  const pageHeightPx = Math.round(dim.heightMm * MM_TO_PX);

  // ResizeObserver to track workspace dimensions dynamically
  const [workspaceSize, setWorkspaceSize] = useState<{ width: number; height: number }>({
    width: 1000,
    height: 700,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleResize = () => {
      if (el) {
        setWorkspaceSize({
          width: el.clientWidth || 1000,
          height: el.clientHeight || 700,
        });
      }
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Track space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !e.repeat &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        !(document.activeElement?.getAttribute('contenteditable') === 'true')
      ) {
        isSpacePressedRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Determine pages to render
  let pagesToRender: Array<{ page: MagazinePage; index: number }> = [];
  if (viewMode === 'page') {
    const p = doc.pages[currentPageIndex] || doc.pages[0];
    if (p) pagesToRender = [{ page: p, index: currentPageIndex }];
  } else {
    const baseIdx = Math.floor(currentPageIndex / 2) * 2;
    const p1 = doc.pages[baseIdx];
    const p2 = doc.pages[baseIdx + 1];
    if (p1) pagesToRender.push({ page: p1, index: baseIdx });
    if (p2) pagesToRender.push({ page: p2, index: baseIdx + 1 });
  }

  // Calculate total document layout in px & fitScale
  const isSpread = viewMode === 'spread' && pagesToRender.length === 2;
  const totalDocWidthPx = pageWidthPx * (isSpread ? 2 : 1);
  const totalDocHeightPx = pageHeightPx;

  const padX = workspaceSize.width < 640 ? 16 : 48;
  const padY = workspaceSize.height < 640 ? 16 : 48;
  const availW = Math.max(100, workspaceSize.width - padX * 2);
  const availH = Math.max(100, workspaceSize.height - padY * 2);
  const fitScale = Math.min(availW / totalDocWidthPx, availH / totalDocHeightPx);
  const effectiveScale = zoom * fitScale;

  // ─── Direct Element PointerDown Drag Handler ───
  const handleElementPointerDown = (
    e: React.PointerEvent,
    pageIdx: number,
    element: MagazineElement,
  ) => {
    // If double-click text editing is active on this element, let text edit events pass through
    if (editingTextId === element.id || croppingImageId === element.id) {
      return;
    }

    if (element.locked) {
      if (!selectedElementIds.includes(element.id)) {
        onSelectElements([element.id]);
      }
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Determine currently selected items to move together
    let targetIds = selectedElementIds;
    if (e.shiftKey) {
      targetIds = selectedElementIds.includes(element.id)
        ? selectedElementIds.filter((id) => id !== element.id)
        : [...selectedElementIds, element.id];
      onSelectElements(targetIds);
    } else if (!selectedElementIds.includes(element.id)) {
      targetIds = [element.id];
      onSelectElements([element.id]);
    }

    const pageDom = pageDomRefs.current[pageIdx];
    if (!pageDom) return;

    const pageRect = pageDom.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    const page = doc.pages[pageIdx];
    if (!page) return;

    // Snapshot initial frames of all selected elements
    const initialElements = page.elements
      .filter((item) => targetIds.includes(item.id))
      .map((item) => ({ id: item.id, frame: { ...item.frame } }));

    const otherElements = page.elements.filter((item) => !targetIds.includes(item.id));
    let hasMoved = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const dxPx = moveEvent.clientX - startX;
      const dyPx = moveEvent.clientY - startY;

      if (Math.abs(dxPx) > 2 || Math.abs(dyPx) > 2) {
        hasMoved = true;
      }

      const dx = (dxPx / pageRect.width) * 100;
      const dy = (dyPx / pageRect.height) * 100;

      // Handle single element drag with snapping
      if (initialElements.length === 1) {
        const single = initialElements[0];
        if (!single) return;
        let newX = single.frame.x + dx;
        let newY = single.frame.y + dy;

        if (enableSnap) {
          const snap = snapElementPosition(
            newX,
            newY,
            single.frame.width,
            single.frame.height,
            otherElements,
          );
          newX = snap.x;
          newY = snap.y;
          setActiveGuides(snap.guides);
        }

        onUpdateElement(
          pageIdx,
          single.id,
          { frame: { ...single.frame, x: newX, y: newY } },
          false,
        );
      } else {
        // Multi-element simultaneous drag
        initialElements.forEach((item) => {
          onUpdateElement(
            pageIdx,
            item.id,
            { frame: { ...item.frame, x: item.frame.x + dx, y: item.frame.y + dy } },
            false,
          );
        });
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      upEvent.preventDefault();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setActiveGuides([]);

      if (hasMoved) {
        // Commit final change to history
        initialElements.forEach((item) => {
          onUpdateElement(pageIdx, item.id, {}, true);
        });
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: false });
  };

  // ─── Canvas Background PointerDown (Pan or Marquee) ───
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || isSpacePressedRef.current) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initPanX: pan.x,
        initPanY: pan.y,
      };
      return;
    }

    if (e.target === containerRef.current || (e.target as HTMLElement).dataset.canvasBackground) {
      if (!e.shiftKey) {
        onSelectElements([]);
      }
      setEditingTextId(null);
      setCroppingImageId(null);

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setMarqueeBox({
          startX: e.clientX - rect.left,
          startY: e.clientY - rect.top,
          currentX: e.clientX - rect.left,
          currentY: e.clientY - rect.top,
        });
      }
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;
      setPan({
        x: panStartRef.current.initPanX + dx,
        y: panStartRef.current.initPanY + dy,
      });
      return;
    }

    if (marqueeBox && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMarqueeBox((prev) =>
        prev
          ? {
              ...prev,
              currentX: e.clientX - rect.left,
              currentY: e.clientY - rect.top,
            }
          : null,
      );
    }

    // Update cursor position in millimeters for rulers
    const activePageDom = pageDomRefs.current[currentPageIndex];
    if (activePageDom) {
      const pageRect = activePageDom.getBoundingClientRect();
      const xPercent = (e.clientX - pageRect.left) / pageRect.width;
      const yPercent = (e.clientY - pageRect.top) / pageRect.height;
      setCursorMm({
        x: Math.round(xPercent * dim.widthMm),
        y: Math.round(yPercent * dim.heightMm),
      });
    }
  };

  const handleCanvasPointerUp = () => {
    setIsPanning(false);
    panStartRef.current = null;
    setMarqueeBox(null);
    setActiveGuides([]);
  };

  // Handle frame updates from TransformBox (corner/edge handles)
  const handleTransformFrame = useCallback(
    (pageIndex: number, elementId: string, newFrame: Partial<ElementFrame>, isFinal: boolean) => {
      const page = doc.pages[pageIndex];
      if (!page) return;
      const el = page.elements.find((item) => item.id === elementId);
      if (!el) return;

      onUpdateElement(pageIndex, elementId, { frame: { ...el.frame, ...newFrame } }, isFinal);
    },
    [doc.pages, onUpdateElement],
  );

  // Render an individual page on canvas
  const renderPage = (page: MagazinePage, pageIdx: number) => {
    const bgColor = page.backgroundColor || doc.theme.backgroundColor || '#0D0D0E';
    const pageDom = pageDomRefs.current[pageIdx];
    const containerRect = pageDom ? pageDom.getBoundingClientRect() : null;

    return (
      <div
        key={page.id}
        ref={(el) => {
          pageDomRefs.current[pageIdx] = el;
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectElements([]);
            setEditingTextId(null);
            setCroppingImageId(null);
          }
        }}
        data-canvas-background="true"
        className="relative bg-white shadow-2xl select-none overflow-hidden"
        style={{
          width: `${pageWidthPx}px`,
          height: `${pageHeightPx}px`,
          backgroundColor: bgColor,
          boxShadow: '0 25px 65px -12px rgba(0, 0, 0, 0.75)',
        }}
      >
        {/* ── 3mm Bleed Safety Margin Overlay ── */}
        {showGuides && (
          <div
            className="absolute inset-0 pointer-events-none border border-dashed border-rose-500/60 z-30"
            title="3mm Bleed Safety Margin"
          >
            <span className="absolute top-1 left-2 font-mono text-[8px] text-rose-400 font-bold uppercase tracking-wider bg-black/60 px-1 py-0.5 rounded">
              Bleed +3mm
            </span>
          </div>
        )}

        {/* ── 10mm Safe Margin Boundary Overlay ── */}
        {showGuides && (
          <div
            className="absolute inset-[3.5%] pointer-events-none border border-cyan-400/40 z-30"
            title="10mm Content Safe Zone"
          >
            <span className="absolute bottom-1 right-2 font-mono text-[8px] text-cyan-400 font-bold uppercase tracking-wider bg-black/60 px-1 py-0.5 rounded">
              Safe Margin (10mm)
            </span>
          </div>
        )}

        {/* ── 6-Column Layout Grid Overlay ── */}
        {showGrid && (
          <div className="absolute inset-[3.5%] pointer-events-none grid grid-cols-6 gap-2 z-20 opacity-30">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-full bg-[#0057FF]/15 border-x border-[#0057FF]/40" />
            ))}
          </div>
        )}

        {/* ── Smart Alignment Magnetic Guides ── */}
        <SmartGuidesOverlay guides={activeGuides} />

        {/* ── Render Page Elements ── */}
        {page.elements?.map((el) => {
          if (el.visible === false) return null;

          const isSelected = selectedElementIds.includes(el.id);
          const isTextEditing = editingTextId === el.id;
          const isImageCropping = croppingImageId === el.id;

          return (
            <div
              key={el.id}
              onPointerDown={(e) => handleElementPointerDown(e, pageIdx, el)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (el.locked) return;
                if (el.type === 'text' || el.type === 'quote-block') {
                  setEditingTextId(el.id);
                } else if (el.type === 'image') {
                  setCroppingImageId(el.id);
                }
              }}
              className={`absolute select-none transition-[box-shadow] duration-150 ${
                isTextEditing
                  ? 'cursor-text ring-2 ring-[#0057FF] z-50'
                  : isImageCropping
                    ? 'cursor-default ring-2 ring-emerald-400 z-50'
                    : isSelected
                      ? 'cursor-move ring-2 ring-[#0057FF] z-40'
                      : 'cursor-pointer hover:ring-1 hover:ring-white/50'
              }`}
              style={{
                left: `${el.frame.x}%`,
                top: `${el.frame.y}%`,
                width: `${el.frame.width}%`,
                height: `${el.frame.height}%`,
                zIndex: el.frame.zIndex || 10,
                transform: el.frame.rotation ? `rotate(${el.frame.rotation}deg)` : undefined,
                opacity: el.opacity !== undefined ? el.opacity : 1,
              }}
            >
              {/* Text Object */}
              {(el.type === 'text' || el.type === 'quote-block' || el.type === 'page-number') && (
                <div className="w-full h-full pointer-events-auto">
                  <TextInlineEditor
                    content={el.content}
                    style={el.textStyle}
                    isEditing={isTextEditing}
                    onUpdateContent={(newContent) =>
                      onUpdateElement(pageIdx, el.id, { content: newContent }, true)
                    }
                    onExitEditing={() => setEditingTextId(null)}
                  />
                </div>
              )}

              {/* Image Frame Object */}
              {el.type === 'image' && (
                <div className="w-full h-full pointer-events-auto">
                  <ImageCropOverlay
                    src={el.content}
                    crop={el.crop}
                    imageStyle={el.imageStyle}
                    isCropMode={isImageCropping}
                    onUpdateCrop={(newCrop: ElementCrop) =>
                      onUpdateElement(pageIdx, el.id, { crop: newCrop }, true)
                    }
                    onExitCropMode={() => setCroppingImageId(null)}
                  />
                </div>
              )}

              {/* Shape Object (Rectangle / Block) */}
              {el.type === 'shape' && (
                <div
                  className="w-full h-full pointer-events-auto"
                  style={{
                    backgroundColor: el.shapeStyle?.fillColor || doc.theme.accentColor || '#0057FF',
                    border: el.shapeStyle?.strokeWidth
                      ? `${el.shapeStyle.strokeWidth}px solid ${el.shapeStyle.strokeColor || '#000'}`
                      : undefined,
                    borderRadius: `${el.shapeStyle?.borderRadius || 0}px`,
                  }}
                />
              )}

              {/* Circle Object */}
              {el.type === 'circle' && (
                <div
                  className="w-full h-full rounded-full pointer-events-auto"
                  style={{
                    backgroundColor: el.shapeStyle?.fillColor || doc.theme.accentColor || '#0057FF',
                    border: el.shapeStyle?.strokeWidth
                      ? `${el.shapeStyle.strokeWidth}px solid ${el.shapeStyle.strokeColor || '#000'}`
                      : undefined,
                  }}
                />
              )}

              {/* Line / Divider Object */}
              {(el.type === 'line' || el.type === 'divider') && (
                <div className="w-full h-full flex items-center pointer-events-auto">
                  <div
                    className="w-full"
                    style={{
                      height: `${el.shapeStyle?.strokeWidth || 2}px`,
                      backgroundColor:
                        el.shapeStyle?.fillColor || doc.theme.accentColor || '#0057FF',
                      borderTop:
                        el.shapeStyle?.lineStyle === 'dashed'
                          ? `2px dashed ${el.shapeStyle.strokeColor || el.shapeStyle.fillColor}`
                          : undefined,
                    }}
                  />
                </div>
              )}

              {/* Barcode Object */}
              {el.type === 'barcode' && (
                <div className="w-full h-full bg-white p-1 flex items-center justify-center gap-0.5 overflow-hidden pointer-events-auto">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-full bg-black ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-1.5'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Active Transform Box with 8 Handles on Selected Element ── */}
        {selectedElementIds.length === 1 &&
          (() => {
            const selectedId = selectedElementIds[0];
            const targetElement = page.elements?.find((e) => e.id === selectedId);
            if (
              !selectedId ||
              !targetElement ||
              editingTextId === selectedId ||
              croppingImageId === selectedId
            ) {
              return null;
            }

            return (
              <TransformBox
                frame={targetElement.frame}
                containerRect={containerRect}
                isLocked={Boolean(targetElement.locked)}
                onUpdateFrame={(newFrame, isFinal) =>
                  handleTransformFrame(pageIdx, selectedId, newFrame, isFinal)
                }
                onDuplicate={onDuplicateSelected}
                onDelete={onDeleteSelected}
                onBringForward={onBringForward}
                onSendBackward={onSendBackward}
                onToggleLock={() => onToggleLock?.(selectedId)}
              />
            );
          })()}

        {/* Page Footer Running Head */}
        <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-[9px] font-mono text-white/40 pointer-events-none select-none">
          <span>FREGORO · {doc.title}</span>
          <span>PAGE {pageIdx + 1}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#08080A] relative overflow-hidden select-none">
      {/* ── Top Horizontal Millimeter Ruler ── */}
      {showRulers && (
        <div className="h-5 pl-5 w-full bg-[#0E0E10] shrink-0 z-30">
          <CanvasRuler
            orientation="horizontal"
            lengthMm={dim.widthMm * (viewMode === 'spread' ? 2 : 1)}
            cursorPosMm={cursorMm?.x}
          />
        </div>
      )}

      <div className="flex-1 flex w-full h-full relative overflow-hidden">
        {/* ── Left Vertical Millimeter Ruler ── */}
        {showRulers && (
          <div className="w-5 h-full bg-[#0E0E10] shrink-0 z-30">
            <CanvasRuler orientation="vertical" lengthMm={dim.heightMm} cursorPosMm={cursorMm?.y} />
          </div>
        )}

        {/* ── Canvas Viewport Stage ── */}
        <main
          ref={containerRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          className={`flex-1 w-full h-full flex items-center justify-center p-8 overflow-auto relative ${
            isPanning
              ? 'cursor-grabbing'
              : isSpacePressedRef.current
                ? 'cursor-grab'
                : 'cursor-default'
          }`}
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(28, 28, 36, 0.45) 0%, rgba(8, 8, 10, 0.95) 100%)',
          }}
        >
          <div
            className="transition-transform duration-100 ease-out flex items-center justify-center gap-0 shrink-0"
            style={{
              width: `${totalDocWidthPx}px`,
              height: `${totalDocHeightPx}px`,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${effectiveScale})`,
              transformOrigin: 'center center',
            }}
          >
            {pagesToRender.map(({ page, index }, idx) => (
              <div key={page.id} className="relative flex items-center">
                {renderPage(page, index)}
                {/* Center Gutter Fold Spine Shadow in 2-Up Spread Mode */}
                {viewMode === 'spread' && idx === 0 && pagesToRender.length === 2 && (
                  <div className="absolute top-0 right-0 bottom-0 w-8 pointer-events-none bg-gradient-to-r from-black/25 via-black/45 to-transparent z-40" />
                )}
              </div>
            ))}
          </div>

          {/* ── Rubberband Selection Marquee ── */}
          {marqueeBox && (
            <div
              className="absolute border border-[#0057FF] bg-[#0057FF]/15 pointer-events-none z-50 rounded-sm"
              style={{
                left: `${Math.min(marqueeBox.startX, marqueeBox.currentX)}px`,
                top: `${Math.min(marqueeBox.startY, marqueeBox.currentY)}px`,
                width: `${Math.abs(marqueeBox.currentX - marqueeBox.startX)}px`,
                height: `${Math.abs(marqueeBox.currentY - marqueeBox.startY)}px`,
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
