'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import { useRef } from 'react';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string; // 'hoodies', 't-shirts', etc.
}

type SizeRow = {
  size: string;
  chest: string;
  length: string;
  sleeve?: string;
};

const sizeData: { hoodies: SizeRow[]; default: SizeRow[] } = {
  hoodies: [
    { size: 'S', chest: '40"', length: '28"', sleeve: '25"' },
    { size: 'M', chest: '44"', length: '29"', sleeve: '25.5"' },
    { size: 'L', chest: '48"', length: '30"', sleeve: '26"' },
    { size: 'XL', chest: '52"', length: '31"', sleeve: '26.5"' },
    { size: 'XXL', chest: '56"', length: '32"', sleeve: '27"' },
  ],
  default: [
    { size: 'S', chest: '38"', length: '28"' },
    { size: 'M', chest: '40"', length: '29"' },
    { size: 'L', chest: '42"', length: '30"' },
    { size: 'XL', chest: '44"', length: '31"' },
    { size: 'XXL', chest: '46"', length: '32"' },
  ],
};

export function SizeChartModal({ isOpen, onClose, category }: SizeChartModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  const data = category.toLowerCase().includes('hoodie') ? sizeData.hoodies : sizeData.default;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-modal bg-charcoal/80 backdrop-blur-sm hidden items-center justify-center p-4 opacity-0"
      onClick={onClose}
    >
      <div
        ref={contentRef}
        className="w-full max-w-lg bg-graphite border border-smoke p-6 md:p-10 rounded-sm relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-pearl hover:text-cobalt transition-colors"
          aria-label="Close"
        >
          <svg
            width="24"
            height="24"
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

        <h2 className="font-display text-h3 text-bone mb-2 capitalize">{category} Size Guide</h2>
        <p className="font-mono text-caption text-pearl mb-8">
          Measurements are in inches. Standard fit.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-smoke">
                <th className="py-3 px-4 font-mono text-caption uppercase text-ash font-normal">
                  Size
                </th>
                <th className="py-3 px-4 font-mono text-caption uppercase text-ash font-normal">
                  Chest
                </th>
                <th className="py-3 px-4 font-mono text-caption uppercase text-ash font-normal">
                  Length
                </th>
                {data[0] && 'sleeve' in data[0] && (
                  <th className="py-3 px-4 font-mono text-caption uppercase text-ash font-normal">
                    Sleeve
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-smoke/30 hover:bg-smoke/10 transition-colors"
                >
                  <td className="py-4 px-4 font-display text-bone text-lg">{row.size}</td>
                  <td className="py-4 px-4 font-mono text-pearl">{row.chest}</td>
                  <td className="py-4 px-4 font-mono text-pearl">{row.length}</td>
                  {'sleeve' in row && row.sleeve && (
                    <td className="py-4 px-4 font-mono text-pearl">{row.sleeve}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-6 border-t border-smoke/50">
          <p className="font-mono text-caption text-ash leading-relaxed">
            <strong>How to measure:</strong>
            <br />
            Chest: Measure under your arms, around the fullest part of your chest.
            <br />
            Length: Measure from the high point of your shoulder down to the hem.
          </p>
        </div>
      </div>
    </div>
  );
}
