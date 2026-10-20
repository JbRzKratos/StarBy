'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function FloatingActions() {
  const pathname = usePathname();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const isExcludedRoute =
    pathname?.startsWith('/magazine/editor') ||
    pathname?.startsWith('/magazine/content-wizard') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/wall-studio') ||
    pathname?.startsWith('/customize');

  useEffect(() => {
    if (isExcludedRoute) return;
    let prev = window.scrollY > 400;
    const handleScroll = () => {
      const next = window.scrollY > 400;
      if (prev !== next) {
        prev = next;
        setShowScrollTop(next);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isExcludedRoute]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isExcludedRoute) {
    return null;
  }

  return (
    <>
      {/* Scroll to Top - Bottom Right (elevated on mobile to prevent collision with chat widget) */}
      <div className="floating-scroll-top-btn fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] right-4 sm:bottom-24 sm:right-6 z-[90] flex flex-col gap-4">
        <button
          onClick={scrollToTop}
          className={`w-10 h-10 sm:w-12 sm:h-12 bg-graphite border border-smoke rounded-full flex items-center justify-center text-pearl hover:text-bone hover:border-cobalt shadow-lg transition-all duration-300 hover:scale-110 ${
            showScrollTop
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
              : 'opacity-0 translate-y-5 scale-75 pointer-events-none'
          }`}
          aria-label="Scroll to top"
          aria-hidden={!showScrollTop}
          tabIndex={showScrollTop ? 0 : -1}
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
      </div>

      {/* WhatsApp Floating Button - Bottom Left */}
      <div className="floating-whatsapp-btn fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-4 sm:bottom-6 sm:left-6 z-[90]">
        <Link
          href={
            process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
              ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`
              : 'https://wa.me/918680991921'
          }
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 sm:w-14 sm:h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-xl pointer-events-auto hover:bg-[#20bd5a] transition-transform hover:scale-105"
          aria-label="Chat on WhatsApp"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
        </Link>
      </div>
    </>
  );
}
