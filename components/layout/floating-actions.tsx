'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap-config';
import Link from 'next/link';

export function FloatingActions() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollTopRef = useRef<HTMLButtonElement>(null);
  const waRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!scrollTopRef.current) return;

    if (showScrollTop) {
      gsap.to(scrollTopRef.current, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: 'back.out(1.5)',
      });
    } else {
      gsap.to(scrollTopRef.current, {
        autoAlpha: 0,
        y: 20,
        scale: 0.8,
        duration: 0.3,
        ease: 'power2.in',
      });
    }
  }, [showScrollTop]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHoverEnter = (el: HTMLElement | null) => {
    if (el) {
      gsap.to(el, { scale: 1.1, duration: 0.3, ease: 'back.out(2)' });
    }
  };

  const handleHoverLeave = (el: HTMLElement | null) => {
    if (el) {
      gsap.to(el, { scale: 1, duration: 0.3, ease: 'power2.out' });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col gap-4">
      {/* Scroll to Top */}
      <button
        ref={scrollTopRef}
        onClick={scrollToTop}
        onMouseEnter={() => handleHoverEnter(scrollTopRef.current)}
        onMouseLeave={() => handleHoverLeave(scrollTopRef.current)}
        className="w-12 h-12 bg-graphite border border-smoke rounded-full flex items-center justify-center text-pearl hover:text-bone hover:border-cobalt transition-colors shadow-lg opacity-0 pointer-events-auto"
        aria-label="Scroll to top"
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
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>

      {/* WhatsApp */}
      <Link
        href="https://wa.me/REPLACE_WITH_ACTUAL_WHATSAPP_NUMBER" // ⚠️ TODO: Replace placeholder
        target="_blank"
        rel="noopener noreferrer"
        ref={waRef}
        onMouseEnter={() => handleHoverEnter(waRef.current)}
        onMouseLeave={() => handleHoverLeave(waRef.current)}
        className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-lg pointer-events-auto hover:bg-[#20bd5a] transition-colors"
        aria-label="Chat on WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      </Link>
    </div>
  );
}
