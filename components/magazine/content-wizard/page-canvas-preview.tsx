'use client';

/**
 * PageCanvasPreview — Wizard pristine PDF page preview
 *
 * Strategy:
 * 1. Base Layer: The full-page pristine PDF render (page_{n}_full.png).
 *    Contains the 100% exact replica of the original PDF design.
 * 2. Live Overlays & Focus Rings:
 *    - When an image or text field is clicked/focused on the right or on the canvas,
 *      it shows a prominent glowing blue highlight and badge indicating exactly
 *      which element will be modified.
 *    - Uploaded photos overlay in place on top of the PDF.
 *    - Text inputs do not clutter the preview, preserving the clean PDF look.
 */

import React from 'react';
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
  contentMap,
  focusedElementId,
  onSelectElement,
}: PageCanvasPreviewProps) {
  // Sort elements by zIndex
  const sorted = [...page.elements].sort((a, b) => (a.frame.zIndex ?? 0) - (b.frame.zIndex ?? 0));

  // Find background element to derive the full PDF page render path
  const bgEl = sorted.find(isBackgroundElement);
  const rawBgSrc = bgEl?.content ?? '';

  // Derive the pristine full PDF page image path (page_{n}_full.png)
  const fullPdfSrc = rawBgSrc.includes('_bg.png')
    ? rawBgSrc.replace('_bg.png', '_full.png')
    : rawBgSrc;

  // Filter out background element for overlays
  const editableEls = sorted.filter((el) => !isBackgroundElement(el));

  return (
    <div
      className="relative h-full max-h-full max-w-full overflow-hidden rounded-xl shadow-2xl border border-white/10 select-none bg-white"
      style={{
        aspectRatio: '210 / 297',
      }}
    >
      {/* ── Base Layer: Pristine Full PDF Page Render ── */}
      {fullPdfSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fullPdfSrc}
          alt={`Page ${page.pageNumber} design`}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: page.backgroundColor ?? '#ffffff' }}
        />
      )}

      {/* ── Overlay Layer: Live User Overlays & Focus Rings ── */}
      {editableEls.map((el) => {
        const userContent = contentMap[el.id];
        const isFocused = focusedElementId === el.id;
        const { frame } = el;

        if (el.type === 'image' || el.type === 'logo') {
          return (
            <div
              key={el.id}
              onClick={() => onSelectElement?.(el.id)}
              style={{
                position: 'absolute',
                left: `${frame.x}%`,
                top: `${frame.y}%`,
                width: `${frame.width}%`,
                height: `${frame.height}%`,
                zIndex: (frame.zIndex ?? 10) + (isFocused ? 40 : 1),
                transform: frame.rotation ? `rotate(${frame.rotation}deg)` : undefined,
                overflow: 'hidden',
                borderRadius: el.imageStyle?.borderRadius
                  ? `${el.imageStyle.borderRadius}px`
                  : undefined,
                cursor: 'pointer',
              }}
            >
              {userContent && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userContent}
                  alt={el.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: el.imageStyle?.objectFit ?? 'cover',
                    display: 'block',
                  }}
                />
              )}

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
                  <div className="bg-[#0057FF] text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-full shadow-2xl flex items-center gap-1.5 border border-white/30 text-center max-w-[90%] truncate">
                    <span>⧉</span>
                    <span className="truncate">{el.name}</span>
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (el.type === 'text') {
          // Only show subtle focus outline when the customer is actively editing this field
          if (!isFocused) return null;

          return (
            <div
              key={el.id}
              onClick={() => onSelectElement?.(el.id)}
              style={{
                position: 'absolute',
                left: `${frame.x}%`,
                top: `${frame.y}%`,
                width: `${frame.width}%`,
                height: `${frame.height}%`,
                zIndex: (frame.zIndex ?? 20) + 40,
                transform: frame.rotation ? `rotate(${frame.rotation}deg)` : undefined,
                pointerEvents: 'none',
              }}
            >
              <div
                className="absolute inset-0 z-50 pointer-events-none animate-pulse flex items-center"
                style={{
                  border: '2px solid #0057FF',
                  boxShadow: 'inset 0 0 0 1px white, 0 0 18px 3px rgba(0,87,255,0.45)',
                  backgroundColor: 'rgba(0, 87, 255, 0.15)',
                  borderRadius: '3px',
                }}
              >
                <span className="absolute -top-5 left-0 bg-[#0057FF] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap border border-white/20">
                  {el.name}
                </span>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
