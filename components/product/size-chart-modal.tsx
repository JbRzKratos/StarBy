'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import { useRef, useState } from 'react';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string; // 'hoodies', 'tees', 'oversized-tees', etc.
}

export type ApparelSizeRow = {
  size: string;
  bustIn: number;
  lengthIn: number;
  shoulderIn: number;
  sleeveIn: number;
};

type MugRow = { size: string; capacity: string; height: string; diameter: string };

// Official size specifications (S to 3XL)
export const sizeData = {
  // Regular & Acid Wash T-Shirts (Matches client official chart + 3XL derived)
  tees: [
    { size: 'S', bustIn: 36, lengthIn: 24, shoulderIn: 14, sleeveIn: 5.5 },
    { size: 'M', bustIn: 38, lengthIn: 25, shoulderIn: 15, sleeveIn: 6.0 },
    { size: 'L', bustIn: 40, lengthIn: 26, shoulderIn: 16, sleeveIn: 6.5 },
    { size: 'XL', bustIn: 42, lengthIn: 27, shoulderIn: 17, sleeveIn: 7.0 },
    { size: 'XXL', bustIn: 44, lengthIn: 28, shoulderIn: 18, sleeveIn: 7.5 },
    { size: '3XL', bustIn: 46, lengthIn: 29, shoulderIn: 19, sleeveIn: 8.0 },
  ] as ApparelSizeRow[],

  // Oversized Drop-Shoulder T-Shirts
  oversized: [
    { size: 'S', bustIn: 42, lengthIn: 27, shoulderIn: 19, sleeveIn: 8.5 },
    { size: 'M', bustIn: 44, lengthIn: 28, shoulderIn: 20, sleeveIn: 9.0 },
    { size: 'L', bustIn: 46, lengthIn: 29, shoulderIn: 21, sleeveIn: 9.5 },
    { size: 'XL', bustIn: 48, lengthIn: 30, shoulderIn: 22, sleeveIn: 10.0 },
    { size: 'XXL', bustIn: 50, lengthIn: 31, shoulderIn: 23, sleeveIn: 10.5 },
    { size: '3XL', bustIn: 52, lengthIn: 32, shoulderIn: 24, sleeveIn: 11.0 },
  ] as ApparelSizeRow[],

  // Hoodies (Heavyweight Fleece)
  hoodies: [
    { size: 'S', bustIn: 40, lengthIn: 26, shoulderIn: 18, sleeveIn: 24.0 },
    { size: 'M', bustIn: 42, lengthIn: 27, shoulderIn: 19, sleeveIn: 24.5 },
    { size: 'L', bustIn: 44, lengthIn: 28, shoulderIn: 20, sleeveIn: 25.0 },
    { size: 'XL', bustIn: 46, lengthIn: 29, shoulderIn: 21, sleeveIn: 25.5 },
    { size: 'XXL', bustIn: 48, lengthIn: 30, shoulderIn: 22, sleeveIn: 26.0 },
    { size: '3XL', bustIn: 50, lengthIn: 31, shoulderIn: 23, sleeveIn: 26.5 },
  ] as ApparelSizeRow[],

  posters: [
    { size: 'A6', chest: '4.1" × 5.8"', length: '10.5 × 14.8 cm' },
    { size: 'A5', chest: '5.8" × 8.3"', length: '14.8 × 21.0 cm' },
    { size: 'A4', chest: '8.3" × 11.7"', length: '21.0 × 29.7 cm' },
    { size: 'A3', chest: '11.7" × 16.5"', length: '29.7 × 42.0 cm' },
    { size: '13×19"', chest: '13.0" × 19.0"', length: '33.0 × 48.3 cm' },
  ],
  mugs: [
    { size: '11 oz', capacity: '325 ml', height: '9.5 cm', diameter: '8.2 cm' },
    { size: '15 oz', capacity: '444 ml', height: '11.0 cm', diameter: '8.5 cm' },
  ] as MugRow[],
};

export function SizeChartModal({ isOpen, onClose, category }: SizeChartModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [unit, setUnit] = useState<'in' | 'cm'>('in');

  useGSAP(
    () => {
      if (!overlayRef.current || !contentRef.current) return;

      if (isOpen) {
        document.body.style.overflow = 'hidden';
        gsap.set(overlayRef.current, { display: 'flex' });
        gsap.to(overlayRef.current, { opacity: 1, duration: 0.3 });
        gsap.fromTo(
          contentRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, delay: 0.1, ease: 'power3.out' },
        );
      } else {
        gsap.to(contentRef.current, { y: 20, opacity: 0, duration: 0.3, ease: 'power2.in' });
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.3,
          delay: 0.1,
          onComplete: () => {
            if (overlayRef.current) gsap.set(overlayRef.current, { display: 'none' });
            document.body.style.overflow = '';
          },
        });
      }
    },
    { dependencies: [isOpen] },
  );

  const catLower = category.toLowerCase();
  const isPoster = catLower.includes('poster');
  const isHoodie = catLower.includes('hoodie');
  const isOversized = catLower.includes('oversized');
  const isMug = catLower.includes('mug');
  const isSkin = catLower.includes('skin');

  if (isSkin) return null;

  const apparelData: ApparelSizeRow[] = isHoodie
    ? sizeData.hoodies
    : isOversized
      ? sizeData.oversized
      : sizeData.tees;

  const formatVal = (inches: number) => {
    if (unit === 'in') return `${inches}"`;
    return `${(inches * 2.54).toFixed(1)} cm`;
  };

  const chartTitle = isHoodie
    ? 'Hoodies Size Guide'
    : isOversized
      ? 'Oversized Tees Size Guide'
      : 'T-Shirt Size Guide';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-modal bg-charcoal/85 backdrop-blur-md hidden items-center justify-center p-4 opacity-0"
      onClick={onClose}
    >
      <div
        ref={contentRef}
        className="w-full max-w-xl bg-graphite border border-smoke/70 p-6 md:p-8 rounded-2xl relative shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-smoke/30 flex items-center justify-center text-pearl hover:text-bone hover:bg-smoke/60 transition-colors"
          aria-label="Close"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header & Unit Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pr-10">
          <div>
            <h2 className="font-display text-2xl text-bone">{chartTitle}</h2>
            <p className="font-mono text-xs text-ash mt-1">Selling sizes: S to 3XL</p>
          </div>

          {!isPoster && !isMug && (
            <div className="inline-flex rounded-lg border border-smoke/60 bg-black/40 p-0.5 self-start">
              <button
                type="button"
                onClick={() => setUnit('in')}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                  unit === 'in'
                    ? 'bg-cobalt text-bone font-bold shadow-sm'
                    : 'text-ash hover:text-pearl'
                }`}
              >
                Inches (in)
              </button>
              <button
                type="button"
                onClick={() => setUnit('cm')}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                  unit === 'cm'
                    ? 'bg-cobalt text-bone font-bold shadow-sm'
                    : 'text-ash hover:text-pearl'
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
          )}
        </div>

        {/* Mugs Table */}
        {isMug && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-smoke/60 text-ash text-xs font-mono uppercase">
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Height</th>
                  <th className="py-3 px-4">Diameter</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono divide-y divide-smoke/30">
                {sizeData.mugs.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-display text-bone font-bold">{row.size}</td>
                    <td className="py-3.5 px-4 text-pearl">{row.capacity}</td>
                    <td className="py-3.5 px-4 text-pearl">{row.height}</td>
                    <td className="py-3.5 px-4 text-pearl">{row.diameter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Posters Table */}
        {isPoster && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-smoke/60 text-ash text-xs font-mono uppercase">
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Inches</th>
                  <th className="py-3 px-4">Centimeters</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono divide-y divide-smoke/30">
                {sizeData.posters.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-display text-bone font-bold">{row.size}</td>
                    <td className="py-3.5 px-4 text-pearl">{row.chest}</td>
                    <td className="py-3.5 px-4 text-pearl">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Apparel Table (Tees & Hoodies) */}
        {!isPoster && !isMug && (
          <div className="overflow-x-auto rounded-xl border border-smoke/40 bg-black/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-smoke/60 bg-black/40 text-ash font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3.5 font-bold text-bone">Size</th>
                  <th className="py-3 px-3.5 font-bold">Bust ({unit})</th>
                  <th className="py-3 px-3.5 font-bold">Length ({unit})</th>
                  <th className="py-3 px-3.5 font-bold">Shoulder ({unit})</th>
                  <th className="py-3 px-3.5 font-bold">Sleeve ({unit})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-smoke/20 text-xs font-mono">
                {apparelData.map((row) => (
                  <tr key={row.size} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-3.5 font-display text-base font-bold text-cobalt">
                      {row.size}
                    </td>
                    <td className="py-3 px-3.5 text-bone">{formatVal(row.bustIn)}</td>
                    <td className="py-3 px-3.5 text-pearl">{formatVal(row.lengthIn)}</td>
                    <td className="py-3 px-3.5 text-pearl">{formatVal(row.shoulderIn)}</td>
                    <td className="py-3 px-3.5 text-pearl">{formatVal(row.sleeveIn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Measurement Instructions */}
        <div className="mt-6 pt-4 border-t border-smoke/50 space-y-2">
          <p className="font-mono text-xs text-bone font-semibold">How to measure your garment:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-ash/80">
            <div className="bg-white/[0.02] p-2 rounded border border-white/5">
              <strong className="text-white/90 block mb-0.5">Bust</strong>
              Measure straight across chest below armholes.
            </div>
            <div className="bg-white/[0.02] p-2 rounded border border-white/5">
              <strong className="text-white/90 block mb-0.5">Length</strong>
              From shoulder high point straight to hem.
            </div>
            <div className="bg-white/[0.02] p-2 rounded border border-white/5">
              <strong className="text-white/90 block mb-0.5">Shoulder</strong>
              From shoulder tip across to opposite tip.
            </div>
            <div className="bg-white/[0.02] p-2 rounded border border-white/5">
              <strong className="text-white/90 block mb-0.5">Sleeve</strong>
              From shoulder seam to bottom sleeve cuff.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
