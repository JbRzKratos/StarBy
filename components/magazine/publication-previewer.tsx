'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { MagazineDocument, MagazinePage } from '@/types/magazine';
import { PAGE_DIMENSIONS, DEFAULT_PAGE_DIMENSION } from '@/types/magazine';
import { runPreflightCheck } from '@/lib/magazine/preflight';

interface PublicationPreviewerProps {
  document: MagazineDocument;
  onClose: () => void;
  onOrder: () => void;
  onDownloadPdf: () => void;
}

export function PublicationPreviewer({
  document: doc,
  onClose,
  onOrder,
  onDownloadPdf,
}: PublicationPreviewerProps) {
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<1 | 1.25 | 1.5>(1);

  const preflight = runPreflightCheck(doc);
  const totalPages = doc.pages.length;

  // Spreads calculation: Page 1 is Cover (alone), Pages 2-3, 4-5, etc.
  // Back cover is last page alone if even spread
  const spreads: Array<{
    left?: MagazinePage | undefined;
    right?: MagazinePage | undefined;
    label: string;
  }> = [];

  // Spread 0: Cover
  if (doc.pages[0]) {
    spreads.push({ right: doc.pages[0], label: 'Cover · Page 1' });
  }

  // Inside spreads
  for (let i = 1; i < totalPages; i += 2) {
    const left = doc.pages[i];
    const right = doc.pages[i + 1];
    if (right) {
      spreads.push({ left, right, label: `Pages ${i + 1} – ${i + 2}` });
    } else if (left) {
      spreads.push({ left, label: `Back Cover · Page ${i + 1}` });
    }
  }

  const currentSpread = spreads[currentSpreadIndex] || spreads[0] || { label: 'Cover · Page 1' };

  const handlePrev = () => {
    if (currentSpreadIndex > 0) setCurrentSpreadIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentSpreadIndex < spreads.length - 1) setCurrentSpreadIndex((prev) => prev + 1);
  };

  const dim = PAGE_DIMENSIONS[doc.dimensionKey] || DEFAULT_PAGE_DIMENSION;
  const aspectRatio = dim.widthMm / dim.heightMm;

  // Simple rendering of elements on a page
  const renderMiniPage = (page?: MagazinePage) => {
    if (!page) {
      return (
        <div className="w-full h-full bg-[#16161A]/40 flex items-center justify-center border border-dashed border-[#F5F1EA]/10 rounded-lg">
          <span className="font-mono text-xs text-[#F5F1EA]/30">Inside Cover</span>
        </div>
      );
    }

    const bgColor = page.backgroundColor || doc.theme.backgroundColor || '#0D0D0E';

    return (
      <div
        className="w-full h-full relative overflow-hidden shadow-2xl transition-all select-none"
        style={{ backgroundColor: bgColor }}
      >
        {page.elements?.map((el) => {
          const style: React.CSSProperties = {
            position: 'absolute',
            left: `${el.frame.x}%`,
            top: `${el.frame.y}%`,
            width: `${el.frame.width}%`,
            height: `${el.frame.height}%`,
            zIndex: el.frame.zIndex || 1,
            transform: el.frame.rotation ? `rotate(${el.frame.rotation}deg)` : undefined,
          };

          if (el.type === 'image' && el.content) {
            return (
              <div key={el.id} style={style} className="overflow-hidden">
                <Image
                  src={el.content}
                  alt={el.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            );
          }

          if (el.type === 'text' || el.type === 'quote-block') {
            const ts = el.textStyle;
            return (
              <div
                key={el.id}
                style={{
                  ...style,
                  fontFamily: ts?.fontFamily || 'Inter, sans-serif',
                  fontSize: `${(ts?.fontSize || 12) * 0.45 * zoomLevel}px`,
                  fontWeight: ts?.fontWeight || 400,
                  fontStyle: ts?.fontStyle || 'normal',
                  lineHeight: ts?.lineHeight || 1.35,
                  letterSpacing: ts?.letterSpacing ? `${ts.letterSpacing}px` : undefined,
                  color: ts?.color || doc.theme.textColor || '#F5F1EA',
                  textAlign: ts?.textAlign || 'left',
                  textTransform: ts?.textTransform || 'none',
                }}
                className="whitespace-pre-wrap overflow-hidden"
              >
                {el.content}
              </div>
            );
          }

          if (el.type === 'shape') {
            return (
              <div
                key={el.id}
                style={{
                  ...style,
                  backgroundColor: el.shapeStyle?.fillColor || doc.theme.accentColor || '#0057FF',
                  borderRadius: el.shapeStyle?.borderRadius
                    ? `${el.shapeStyle.borderRadius}px`
                    : undefined,
                }}
              />
            );
          }

          if (el.type === 'barcode') {
            return (
              <div
                key={el.id}
                style={{ ...style, backgroundColor: '#FFFFFF' }}
                className="flex items-center justify-center p-1 text-[8px] font-mono text-black font-bold"
              >
                BARCODE
              </div>
            );
          }

          return null;
        })}

        {/* Page Number Footer */}
        <div className="absolute bottom-3 right-4 font-mono text-[9px] text-[#F5F1EA]/40 z-20">
          {page.pageNumber}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#08080A]/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#F5F1EA]/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1A1A1E] border border-[#F5F1EA]/15 flex items-center justify-center font-mono text-xs font-bold text-[#0057FF]">
            FRG
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-[#F5F1EA] truncate max-w-xs sm:max-w-md">
              {doc.title || 'Untitled Publication'}
            </h3>
            <p className="font-mono text-[11px] text-[#F5F1EA]/50">
              {doc.pages.length} Pages · {dim.name} · {doc.paperWeight}
            </p>
          </div>
        </div>

        {/* Preflight Badge & Controls */}
        <div className="flex items-center gap-3">
          <div
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
              preflight.isPrintReady
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}
          >
            <span>{preflight.isPrintReady ? '✓' : '⚠'}</span>
            <span>
              {preflight.isPrintReady
                ? 'Print Ready (300 DPI)'
                : `${preflight.warningCount + preflight.errorCount} Issues Found`}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[#1A1A1E] p-1 rounded-lg border border-[#F5F1EA]/10">
            <button
              onClick={() => setZoomLevel(1)}
              className={`px-2.5 py-1 text-xs font-mono rounded ${
                zoomLevel === 1 ? 'bg-[#0057FF] text-white' : 'text-[#F5F1EA]/60 hover:text-white'
              }`}
            >
              100%
            </button>
            <button
              onClick={() => setZoomLevel(1.25)}
              className={`px-2.5 py-1 text-xs font-mono rounded ${
                zoomLevel === 1.25
                  ? 'bg-[#0057FF] text-white'
                  : 'text-[#F5F1EA]/60 hover:text-white'
              }`}
            >
              125%
            </button>
            <button
              onClick={() => setZoomLevel(1.5)}
              className={`px-2.5 py-1 text-xs font-mono rounded ${
                zoomLevel === 1.5 ? 'bg-[#0057FF] text-white' : 'text-[#F5F1EA]/60 hover:text-white'
              }`}
            >
              150%
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1A1A1E] hover:bg-[#26262E] text-[#F5F1EA]/70 hover:text-white border border-[#F5F1EA]/10 transition-colors"
            aria-label="Close Preview"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Main Spread Stage ── */}
      <div className="flex-1 flex items-center justify-center relative my-4 overflow-auto">
        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          disabled={currentSpreadIndex === 0}
          className="absolute left-2 sm:left-6 z-30 p-3 rounded-full bg-[#1A1A1E]/80 hover:bg-[#0057FF] disabled:opacity-20 text-white backdrop-blur border border-[#F5F1EA]/10 transition-all"
          aria-label="Previous Spread"
        >
          ←
        </button>

        <button
          onClick={handleNext}
          disabled={currentSpreadIndex === spreads.length - 1}
          className="absolute right-2 sm:right-6 z-30 p-3 rounded-full bg-[#1A1A1E]/80 hover:bg-[#0057FF] disabled:opacity-20 text-white backdrop-blur border border-[#F5F1EA]/10 transition-all"
          aria-label="Next Spread"
        >
          →
        </button>

        {/* Spread Container */}
        <div
          className="flex items-center justify-center gap-1 shadow-2xl transition-all duration-300"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Left Page (or Inside Cover) */}
          <div
            className="w-[280px] sm:w-[380px] md:w-[460px] max-h-[75vh] border-r border-[#0D0D0E]/80 relative"
            style={{ aspectRatio: `${aspectRatio}` }}
          >
            {renderMiniPage(currentSpread.left)}
            {/* Center Gutter Shadow */}
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
          </div>

          {/* Right Page */}
          <div
            className="w-[280px] sm:w-[380px] md:w-[460px] max-h-[75vh] relative"
            style={{ aspectRatio: `${aspectRatio}` }}
          >
            {renderMiniPage(currentSpread.right)}
            {/* Center Gutter Shadow */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Bottom Controls & Thumbnail Strip ── */}
      <div className="pt-3 border-t border-[#F5F1EA]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Spread Selector Label & Thumbnails */}
        <div className="flex items-center gap-3 overflow-x-auto max-w-full pb-1">
          <span className="font-mono text-xs text-[#F5F1EA]/70 whitespace-nowrap">
            {currentSpread.label} ({currentSpreadIndex + 1} of {spreads.length})
          </span>

          <div className="flex items-center gap-2">
            {spreads.map((s, idx) => (
              <button
                key={s.label}
                onClick={() => setCurrentSpreadIndex(idx)}
                className={`w-7 h-9 rounded border transition-all ${
                  currentSpreadIndex === idx
                    ? 'border-[#0057FF] bg-[#0057FF]/30 scale-110'
                    : 'border-[#F5F1EA]/20 bg-[#1A1A1E] opacity-50 hover:opacity-100'
                }`}
                title={s.label}
              />
            ))}
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onDownloadPdf}
            className="flex-1 sm:flex-none px-5 py-3 rounded-lg bg-[#1A1A1E] hover:bg-[#25252E] border border-[#F5F1EA]/20 text-[#F5F1EA] font-mono text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Download PDF
          </button>
          <button
            onClick={onOrder}
            className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-[#0057FF] hover:bg-[#0046CC] text-white font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#0057FF]/30 hover:scale-105"
          >
            Order Printed Magazine →
          </button>
        </div>
      </div>
    </div>
  );
}
