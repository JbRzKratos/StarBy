'use client';

/**
 * PageCanvasPreview — Wizard pristine PDF page preview
 *
 * Strategy:
 * 1. Base Layer: Try to load pristine full PDF render (page_{n}_full.png).
 *    If missing or fails to load (e.g. on production/Vercel), seamlessly fall back
 *    to the vector-extracted clean background (page_{n}_bg.png) + original design elements.
 * 2. Live Overlays & Focus Rings:
 *    - Uploaded photos overlay in place on top with exact framing.
 *    - When an element is clicked or focused, a prominent glowing blue highlight
 *      and indicator badge show exactly what is being edited.
 *    - Tap-to-select: tapping an element on the canvas selects it for editing.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { MagazinePage, MagazineElement, WizardContentMap } from '@/types/magazine';

interface PageCanvasPreviewProps {
  page: MagazinePage;
  contentMap: WizardContentMap;
  focusedElementId: string | null;
  onSelectElement?: (elementId: string) => void;
}

/** Check if an element is the full-page background */
function isBackgroundElement(el: MagazineElement): boolean {
  return (
    el.placeholderKey === 'background-image' ||
    (el.frame.x <= 1 && el.frame.y <= 1 && el.frame.width >= 99 && el.frame.height >= 99)
  );
}

export function PageCanvasPreview({
  page,
  contentMap: _contentMap,
  focusedElementId,
  onSelectElement,
}: PageCanvasPreviewProps) {
  const [pdfLoadFailed, setPdfLoadFailed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerDim, setContainerDim] = useState<{ w: number; h: number } | null>(null);

  // Reset error state if page changes
  useEffect(() => {
    setPdfLoadFailed(false);
  }, [page.id]);

  // Dynamically track available canvas dimensions with ResizeObserver
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        setContainerDim({ w, h });
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Calculate fitted dimensions maintaining 210 / 297 (A4) aspect ratio
  const aspectRatio = 210 / 297;
  let canvasW: number;
  let canvasH: number;

  if (containerDim && containerDim.w > 0 && containerDim.h > 0) {
    const containerAspect = containerDim.w / containerDim.h;
    if (containerAspect < aspectRatio) {
      // Container is narrower than A4 (e.g. mobile screen in portrait)
      canvasW = Math.floor(containerDim.w);
      canvasH = Math.floor(canvasW / aspectRatio);
    } else {
      // Container is wider than A4 (e.g. desktop or tablet landscape)
      canvasH = Math.floor(containerDim.h);
      canvasW = Math.floor(canvasH * aspectRatio);
    }
  } else {
    // Initial fallback
    canvasW = 320;
    canvasH = Math.floor(320 / aspectRatio);
  }

  // Sort elements by zIndex
  const sorted = [...page.elements].sort((a, b) => (a.frame.zIndex ?? 0) - (b.frame.zIndex ?? 0));

  // Find background element
  const bgEl = sorted.find(isBackgroundElement);
  const rawBgSrc = bgEl?.content ?? '';

  // Pristine full PDF image path
  const fullPdfSrc = rawBgSrc.includes('_bg.png')
    ? rawBgSrc.replace('_bg.png', '_full.png')
    : rawBgSrc;

  // Filter out background element for overlays / content
  const editableEls = sorted.filter((el) => !isBackgroundElement(el));

  // Should we show template original elements?
  // Yes if the full PDF failed to load, or as a background base
  const showFallbackElements = pdfLoadFailed || !fullPdfSrc;

  // Scale factor for fonts based on standard 794px A4 canvas width
  const fontScale = canvasW / 794;

  return (
    <div
      ref={wrapperRef}
      className="w-full h-full max-w-full max-h-full flex items-center justify-center overflow-hidden p-1 sm:p-2 isolate"
    >
      <div
        className="relative overflow-hidden rounded-xl shadow-2xl border border-white/10 select-none bg-white transition-all flex-shrink-0 isolate"
        style={{
          width: `${canvasW}px`,
          height: `${canvasH}px`,
          aspectRatio: '210 / 297',
        }}
      >
        {/* ── Base Layer: Pristine Full PDF Render with Graceful Fallback ── */}
        {!pdfLoadFailed && fullPdfSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fullPdfSrc}
            alt={`Page ${page.pageNumber} design`}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            onError={() => setPdfLoadFailed(true)}
          />
        ) : rawBgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={rawBgSrc}
            alt={`Page ${page.pageNumber} background`}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: page.backgroundColor ?? '#ffffff' }}
          />
        )}

        {/* ── Fallback Design Layer: Render original template elements if full PDF is missing ── */}
        {showFallbackElements &&
          editableEls.map((el) => {
            const displayContent = el.content;
            const { frame } = el;

            if (el.type === 'image' || el.type === 'logo') {
              return (
                <div
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: `${frame.x}%`,
                    top: `${frame.y}%`,
                    width: `${frame.width}%`,
                    height: `${frame.height}%`,
                    zIndex: frame.zIndex ?? 10,
                    transform: frame.rotation ? `rotate(${frame.rotation}deg)` : undefined,
                    overflow: 'hidden',
                    borderRadius: el.imageStyle?.borderRadius
                      ? `${el.imageStyle.borderRadius}px`
                      : undefined,
                  }}
                >
                  {displayContent && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayContent}
                      alt={el.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: el.imageStyle?.objectFit ?? 'cover',
                        display: 'block',
                      }}
                    />
                  )}
                </div>
              );
            }

            if (el.type === 'text' || el.type === 'quote-block' || el.type === 'page-number') {
              const style = el.textStyle;
              const scaledFontSize = Math.max(
                8,
                Math.round((style?.fontSize ? style.fontSize : 14) * fontScale),
              );
              return (
                <div
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: `${frame.x}%`,
                    top: `${frame.y}%`,
                    width: `${frame.width}%`,
                    height: `${frame.height}%`,
                    zIndex: frame.zIndex ?? 20,
                    transform: frame.rotation ? `rotate(${frame.rotation}deg)` : undefined,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      fontFamily: style?.fontFamily ?? 'Inter, sans-serif',
                      fontSize: `${scaledFontSize}px`,
                      fontWeight: style?.fontWeight ?? 400,
                      fontStyle: style?.fontStyle ?? 'normal',
                      color: style?.color ?? '#111113',
                      textAlign: style?.textAlign ?? 'left',
                      lineHeight: style?.lineHeight ? `${style.lineHeight}em` : 1.25,
                      letterSpacing: style?.letterSpacing ? `${style.letterSpacing}em` : 'normal',
                      wordBreak: 'break-word',
                      width: '100%',
                    }}
                  >
                    {displayContent}
                  </div>
                </div>
              );
            }

            if (el.type === 'shape') {
              return (
                <div
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: `${frame.x}%`,
                    top: `${frame.y}%`,
                    width: `${frame.width}%`,
                    height: `${frame.height}%`,
                    zIndex: frame.zIndex ?? 5,
                    transform: frame.rotation ? `rotate(${frame.rotation}deg)` : undefined,
                    backgroundColor: el.shapeStyle?.fillColor || '#0057FF',
                    border: el.shapeStyle?.strokeWidth
                      ? `${el.shapeStyle.strokeWidth}px ${el.shapeStyle.lineStyle || 'solid'} ${el.shapeStyle.strokeColor || '#000'}`
                      : undefined,
                    borderRadius: `${el.shapeStyle?.borderRadius || 0}px`,
                  }}
                />
              );
            }

            if (el.type === 'circle') {
              return (
                <div
                  key={el.id}
                  className="rounded-full"
                  style={{
                    position: 'absolute',
                    left: `${frame.x}%`,
                    top: `${frame.y}%`,
                    width: `${frame.width}%`,
                    height: `${frame.height}%`,
                    zIndex: frame.zIndex ?? 5,
                    transform: frame.rotation ? `rotate(${frame.rotation}deg)` : undefined,
                    backgroundColor: el.shapeStyle?.fillColor || '#0057FF',
                  }}
                />
              );
            }

            if (el.type === 'line' || el.type === 'divider') {
              return (
                <div
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: `${frame.x}%`,
                    top: `${frame.y}%`,
                    width: `${frame.width}%`,
                    height: `${frame.height}%`,
                    zIndex: frame.zIndex ?? 5,
                    transform: frame.rotation ? `rotate(${frame.rotation}deg)` : undefined,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div
                    className="w-full"
                    style={{
                      height: `${el.shapeStyle?.strokeWidth || 1}px`,
                      backgroundColor: el.shapeStyle?.fillColor || '#000000',
                    }}
                  />
                </div>
              );
            }

            if (el.type === 'barcode') {
              return (
                <div
                  key={el.id}
                  className="bg-white p-1 flex items-center justify-center gap-0.5 overflow-hidden"
                  style={{
                    position: 'absolute',
                    left: `${frame.x}%`,
                    top: `${frame.y}%`,
                    width: `${frame.width}%`,
                    height: `${frame.height}%`,
                    zIndex: frame.zIndex ?? 15,
                  }}
                >
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className={`h-full bg-black ${i % 3 === 0 ? 'w-1' : 'w-0.5'}`} />
                  ))}
                </div>
              );
            }

            return null;
          })}

        {/* ── Overlay Layer: Focus Rings & Tap-to-Select (No real-time canvas alteration) ── */}
        {editableEls.map((el) => {
          const isFocused = focusedElementId === el.id;
          const { frame } = el;

          if (el.type === 'image' || el.type === 'logo') {
            return (
              <div
                key={`overlay-${el.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement?.(el.id);
                }}
                style={{
                  position: 'absolute',
                  left: `${frame.x}%`,
                  top: `${frame.y}%`,
                  width: `${frame.width}%`,
                  height: `${frame.height}%`,
                  zIndex: (frame.zIndex ?? 10) + (isFocused ? 40 : 5),
                  transform: frame.rotation ? `rotate(${frame.rotation}deg)` : undefined,
                  overflow: 'hidden',
                  borderRadius: el.imageStyle?.borderRadius
                    ? `${el.imageStyle.borderRadius}px`
                    : undefined,
                  cursor: 'pointer',
                }}
              >
                {/* Focus Ring / Indicator for Image */}
                {isFocused && (
                  <div
                    className="absolute inset-0 z-50 pointer-events-none animate-pulse flex items-center justify-center p-2"
                    style={{
                      border: '3px solid #0057FF',
                      boxShadow: 'inset 0 0 0 1.5px white, 0 0 25px 5px rgba(0,87,255,0.5)',
                      backgroundColor: 'rgba(0, 87, 255, 0.2)',
                      borderRadius: 'inherit',
                    }}
                  >
                    <div className="bg-[#0057FF] text-white font-mono text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-2xl flex items-center gap-1.5 border border-white/30 text-center max-w-[90%] truncate">
                      <span>⧉</span>
                      <span className="truncate">{el.name}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (el.type === 'text' || el.type === 'quote-block' || el.type === 'page-number') {
            return (
              <div
                key={`overlay-${el.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement?.(el.id);
                }}
                style={{
                  position: 'absolute',
                  left: `${frame.x}%`,
                  top: `${frame.y}%`,
                  width: `${frame.width}%`,
                  height: `${frame.height}%`,
                  zIndex: (frame.zIndex ?? 20) + (isFocused ? 40 : 5),
                  transform: frame.rotation ? `rotate(${frame.rotation}deg)` : undefined,
                  cursor: 'pointer',
                }}
              >
                {/* Focus Ring for Text Element */}
                {isFocused && (
                  <div
                    className="absolute inset-0 z-50 pointer-events-none animate-pulse flex items-center"
                    style={{
                      border: '2px solid #0057FF',
                      boxShadow: 'inset 0 0 0 1px white, 0 0 18px 3px rgba(0,87,255,0.45)',
                      backgroundColor: 'rgba(0, 87, 255, 0.15)',
                      borderRadius: '3px',
                    }}
                  >
                    <span className="absolute -top-5 left-0 bg-[#0057FF] text-white font-mono text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap border border-white/20">
                      {el.name}
                    </span>
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
