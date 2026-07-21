'use client';

import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getOfferString } from './offer-banner.shared';
import { usePrice } from '@/lib/hooks/usePrice';
import { ScrollTriggerWrapper } from '@/components/animations/scroll-trigger-wrapper';

export function OfferBannerMobile() {
  const container = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const prefersReducedMotion = useRef(false);
  const { formatPrice } = usePrice();
  const offerString = getOfferString(formatPrice);

  useEffect(() => {
    if (sessionStorage.getItem('starby-offer-dismissed')) {
      setIsDismissed(true);
    } else {
      setIsDismissed(false);
    }

    // Check reduced motion
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('starby-offer-dismissed', 'true');
  };

  useGSAP(
    () => {
      if (isDismissed || !marqueeRef.current || prefersReducedMotion.current) return;

      const track = marqueeRef.current;
      const totalWidth = track.scrollWidth;

      const tl = gsap.to(track, {
        x: -(totalWidth / 2),
        duration: 35, // Slower on mobile
        ease: 'none',
        repeat: -1,
      });

      const handleVisibilityChange = () => {
        if (document.hidden) {
          tl.pause();
        } else {
          tl.play();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    },
    { scope: container, dependencies: [isDismissed, offerString] },
  );

  if (isDismissed) return null;

  return (
    <ScrollTriggerWrapper>
      <div
        ref={container}
        className="w-full bg-cobalt text-bone py-2 relative overflow-hidden flex items-center z-50 h-8"
      >
        <div
          ref={marqueeRef}
          className={`flex whitespace-nowrap font-mono text-[8px] uppercase tracking-widest ${prefersReducedMotion.current ? 'justify-center w-full' : ''}`}
        >
          {prefersReducedMotion.current ? (
            <span className="px-4 truncate">{offerString.split(' ✦ ')[0]}</span>
          ) : (
            <>
              <span className="px-4">{offerString}</span>
              <span className="px-4">{offerString}</span>
              <span className="px-4">{offerString}</span>
              <span className="px-4">{offerString}</span>
            </>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-bone/60 hover:text-bone transition-colors w-6 h-6 flex items-center justify-center bg-cobalt"
          aria-label="Dismiss offer banner"
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </ScrollTriggerWrapper>
  );
}
