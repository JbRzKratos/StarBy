'use client';

import { useState, useEffect } from 'react';
import { getOfferString } from './offer-banner.shared';
import { usePrice } from '@/lib/hooks/usePrice';

/**
 * Single responsive announcement bar.
 *
 * The old desktop/mobile split mounted two marquees (and two animation loops)
 * on every page. One responsive component keeps the markup and animation cost
 * to a single instance.
 */
export function OfferBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const { formatPrice } = usePrice();
  const offerString = getOfferString(formatPrice);

  useEffect(() => {
    if (sessionStorage.getItem('fregoro-offer-dismissed')) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('fregoro-offer-dismissed', 'true');
  };

  if (isDismissed) return null;

  return (
    <div
      className="w-full bg-cobalt text-bone relative overflow-hidden flex items-center z-50 h-7 select-none"
      aria-label="Promotional announcements"
    >
      {/* ── Left Soft Fade Mask ── */}
      <div className="absolute left-0 top-0 bottom-0 w-6 md:w-8 z-10 bg-gradient-to-r from-cobalt to-transparent pointer-events-none" />

      {/* ── Infinite Seamless Marquee Track ── */}
      <div className="w-full overflow-hidden flex whitespace-nowrap group">
        <div className="flex shrink-0 animate-marquee items-center will-change-transform font-mono text-[8px] md:text-[9px] uppercase tracking-[0.18em] md:tracking-[0.2em] font-bold group-hover:[animation-play-state:paused]">
          <span className="px-4 md:px-6">{offerString}</span>
          <span className="px-4 md:px-6">{offerString}</span>
          <span className="px-4 md:px-6">{offerString}</span>
          <span className="px-4 md:px-6">{offerString}</span>
        </div>
        <div
          className="flex shrink-0 animate-marquee items-center will-change-transform font-mono text-[8px] md:text-[9px] uppercase tracking-[0.18em] md:tracking-[0.2em] font-bold group-hover:[animation-play-state:paused]"
          aria-hidden="true"
        >
          <span className="px-4 md:px-6">{offerString}</span>
          <span className="px-4 md:px-6">{offerString}</span>
          <span className="px-4 md:px-6">{offerString}</span>
          <span className="px-4 md:px-6">{offerString}</span>
        </div>
      </div>

      {/* ── Right Protective Shield with Dismiss Button ── */}
      <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center bg-gradient-to-l from-cobalt via-cobalt to-transparent pl-7 pr-2.5 md:pl-8 md:pr-3 pointer-events-auto">
        <button
          onClick={handleDismiss}
          className="text-bone/70 hover:text-bone md:hover:scale-110 active:scale-90 transition-[transform,color] w-5 h-5 flex items-center justify-center rounded cursor-pointer"
          aria-label="Dismiss offer banner"
        >
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="md:w-2.5 md:h-2.5 w-[9px] h-[9px]"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
