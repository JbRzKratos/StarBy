'use client';

import { useRef, useState, useEffect } from 'react';
import { gsap } from '@/lib/gsap-config';
import { useGSAP } from '@gsap/react';
import { getOfferString } from './offer-banner.shared';
import { ScrollTriggerWrapper } from '@/components/animations/scroll-trigger-wrapper';
import { usePrice } from '@/lib/hooks/usePrice';

export function OfferBannerDesktop() {
  const container = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [isDismissed, setIsDismissed] = useState(true); // Default true to prevent hydration mismatch
  const { formatPrice } = usePrice();
  const offerString = getOfferString(formatPrice);

  useEffect(() => {
    // Check session storage after mount
    if (sessionStorage.getItem('starby-offer-dismissed')) {
      setIsDismissed(true);
    } else {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('starby-offer-dismissed', 'true');
  };

  useGSAP(
    () => {
      if (isDismissed || !marqueeRef.current) return;

      const track = marqueeRef.current;

      // We need to calculate the width of one single text instance.
      // Since we duplicate it, we move by half the total scrollWidth.
      const totalWidth = track.scrollWidth;

      const tl = gsap.to(track, {
        x: -(totalWidth / 2),
        duration: 25,
        ease: 'none',
        repeat: -1,
      });

      // Pause on hover
      const banner = container.current;

      // Pause when tab is inactive
      const handleVisibilityChange = () => {
        if (document.hidden) {
          tl.pause();
        } else {
          tl.play();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      const onEnter = () => tl.pause();
      const onLeave = () => tl.play();

      if (banner) {
        banner.addEventListener('mouseenter', onEnter);
        banner.addEventListener('mouseleave', onLeave);
      }

      return () => {
        if (banner) {
          banner.removeEventListener('mouseenter', onEnter);
          banner.removeEventListener('mouseleave', onLeave);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    },
    { scope: container, dependencies: [isDismissed] },
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
          className="flex whitespace-nowrap font-mono text-[9px] uppercase tracking-widest"
        >
          {/* We duplicate the string twice to create a seamless loop */}
          <span className="px-4">{offerString}</span>
          <span className="px-4">{offerString}</span>
          <span className="px-4">{offerString}</span>
          <span className="px-4">{offerString}</span>
        </div>

        <button
          onClick={handleDismiss}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-bone/60 hover:text-bone transition-colors w-6 h-6 flex items-center justify-center bg-cobalt"
          aria-label="Dismiss offer banner"
        >
          <svg
            width="10"
            height="10"
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
