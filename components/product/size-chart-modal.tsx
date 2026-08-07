'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import { useRef } from 'react';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string; // 'hoodies', 't-shirts', etc.
}

type SizeRow = { size: string; chest: string; length: string; sleeve?: string };
type MugRow = { size: string; capacity: string; height: string; diameter: string };

const sizeData = {
  hoodies: [
    { size: 'S', chest: '36–38"', length: '27"', sleeve: '24.5"' },
    { size: 'M', chest: '38–40"', length: '28"', sleeve: '25"' },
    { size: 'L', chest: '40–42"', length: '29"', sleeve: '25.5"' },
    { size: 'XL', chest: '42–44"', length: '30"', sleeve: '26"' },
    { size: 'XXL', chest: '44–46"', length: '31"', sleeve: '26.5"' },
  ] as SizeRow[],
  tees: [
    { size: 'S', chest: '36–38"', length: '27"' },
    { size: 'M', chest: '38–40"', length: '28"' },
    { size: 'L', chest: '40–42"', length: '29"' },
    { size: 'XL', chest: '42–44"', length: '30"' },
    { size: 'XXL', chest: '44–46"', length: '31"' },
  ] as SizeRow[],
  posters: [
    { size: 'A6', chest: '4.1" × 5.8"', length: '10.5 × 14.8 cm' },
    { size: 'A5', chest: '5.8" × 8.3"', length: '14.8 × 21.0 cm' },
    { size: 'A4', chest: '8.3" × 11.7"', length: '21.0 × 29.7 cm' },
    { size: 'A3', chest: '11.7" × 16.5"', length: '29.7 × 42.0 cm' },
    { size: '13×19"', chest: '13.0" × 19.0"', length: '33.0 × 48.3 cm' },
  ] as SizeRow[],
  mugs: [
    { size: '11 oz', capacity: '325 ml', height: '9.5 cm', diameter: '8.2 cm' },
    { size: '15 oz', capacity: '444 ml', height: '11.0 cm', diameter: '8.5 cm' },
  ] as MugRow[],
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

  const catLower = category.toLowerCase();
  const isPoster = catLower.includes('poster');
  const isHoodie = catLower.includes('hoodie');
  const isMug = catLower.includes('mug');
  const isSkin = catLower.includes('skin');

  // Skins use device-model picker, not a size guide
  if (isSkin) return null;

  const apparelData = isHoodie ? sizeData.hoodies : sizeData.tees;
  const data: SizeRow[] = isPoster ? sizeData.posters : isMug ? [] : apparelData;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-modal bg-charcoal/80 backdrop-blur-sm hidden items-center justify-center p-4 opacity-0"
      onClick={onClose}
    >
      <div
        ref={contentRef}
        className="w-full max-w-lg bg-graphite border border-smoke p-6 md:p-10 rounded-xl relative"
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
          {isPoster
            ? 'Standard dimensions for single & split wall prints.'
            : isMug
            ? 'Capacity and physical dimensions for our mugs.'
            : 'Measurements in inches. Indian/Asian standard fit — check against your own garment.'}
        </p>

        {/* Mug table */}
        {isMug && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-smoke">
                  {['Size', 'Capacity', 'Height', 'Diameter'].map((h) => (
                    <th key={h} className="py-3 px-4 font-mono text-caption uppercase text-ash font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizeData.mugs.map((row, idx) => (
                  <tr key={idx} className="border-b border-smoke/30 hover:bg-smoke/10 transition-colors">
                    <td className="py-4 px-4 font-display text-bone text-lg">{row.size}</td>
                    <td className="py-4 px-4 font-mono text-pearl">{row.capacity}</td>
                    <td className="py-4 px-4 font-mono text-pearl">{row.height}</td>
                    <td className="py-4 px-4 font-mono text-pearl">{row.diameter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-smoke">
                <th className="py-3 px-4 font-mono text-caption uppercase text-ash font-normal">
                  Size
                </th>
                <th className="py-3 px-4 font-mono text-caption uppercase text-ash font-normal">
                  {isPoster ? 'Inches' : 'Chest'}
                </th>
                <th className="py-3 px-4 font-mono text-caption uppercase text-ash font-normal">
                  {isPoster ? 'Centimeters' : 'Length'}
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
            {isPoster ? (
              <>
                <strong>Poster Info:</strong>
                <br />
                Printed on 300 GSM ultra-thick matte paper with high-definition Giclée ink finish.
                Non-adhesive (mount with double-sided tape or glue dots).
              </>
            ) : (
              <>
                <strong>How to measure:</strong>
                <br />
                Chest: Measure under your arms, around the fullest part of your chest.
                <br />
                Length: Measure from the high point of your shoulder down to the hem.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
