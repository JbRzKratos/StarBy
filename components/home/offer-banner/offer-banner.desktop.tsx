'use client';

import { useState, useEffect } from 'react';
import { getOfferString } from './offer-banner.shared';
import { usePrice } from '@/lib/hooks/usePrice';

export function OfferBannerDesktop() {
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
      <div className="absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-cobalt to-transparent pointer-events-none" />

      {/* ── Infinite Seamless Marquee Track ── */}
      <div className="w-full overflow-hidden flex whitespace-nowrap group">
        <div className="flex shrink-0 animate-marquee items-center will-change-transform font-mono text-[9px] uppercase tracking-[0.2em] font-bold group-hover:[animation-play-state:paused]">
          <span className="px-6">{offerString}</span>
          <span className="px-6">{offerString}</span>
          <span className="px-6">{offerString}</span>
          <span className="px-6">{offerString}</span>
        </div>
        <div
          className="flex shrink-0 animate-marquee items-center will-change-transform font-mono text-[9px] uppercase tracking-[0.2em] font-bold group-hover:[animation-play-state:paused]"
          aria-hidden="true"
        >
          <span className="px-6">{offerString}</span>
          <span className="px-6">{offerString}</span>
          <span className="px-6">{offerString}</span>
          <span className="px-6">{offerString}</span>
        </div>
      </div>

      {/* ── Right Protective Shield with Dismiss Button ── */}
      <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center bg-gradient-to-l from-cobalt via-cobalt to-transparent pl-8 pr-3 pointer-events-auto">
        <button
          onClick={handleDismiss}
          className="text-bone/70 hover:text-bone hover:scale-110 active:scale-95 transition-all w-5 h-5 flex items-center justify-center rounded cursor-pointer"
          aria-label="Dismiss offer banner"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
