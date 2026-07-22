'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import Link from 'next/link';
import { gsap } from '@/lib/gsap-config';
import { useCartStore } from '@/lib/stores/cart-store';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { useCurrencyStore, type CurrencyCode } from '@/lib/stores/currency-store';
import { useSearchStore } from '@/lib/stores/search-store';

import { OfferBannerMobile } from '@/components/home/offer-banner/offer-banner.mobile';

const menuLinks = [
  { href: '/', label: 'Home' },
  { href: '/products/all', label: 'Shop All' },
  { href: '/split-poster', label: 'Split Posters' },
  { href: '/customize', label: 'Design DIY' },
  { href: '/studio', label: 'Studio' },
  { href: '/faq', label: 'FAQ & Shipping' },
  { href: '/contact', label: 'Contact' },
];

export function NavigationMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);
  const toggleCart = useCartStore((s) => s.toggleCart);

  const setWishlistOpen = useWishlistStore((s) => s.setWishlistOpen);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const setSearchOpen = useSearchStore((s) => s.setSearchOpen);
  const { currency, setCurrency } = useCurrencyStore();
  const currencies: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const navRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  // Sticky nav background animation
  useEffect(() => {
    if (!navRef.current) return;

    // Simple scroll listener instead of GSAP ScrollTrigger to save bundle size
    const handleScroll = () => {
      if (window.scrollY > 20) {
        if (navRef.current) {
          navRef.current.style.backgroundColor = 'rgba(14,14,15,0.95)';
          navRef.current.style.backdropFilter = 'blur(12px)';
        }
      } else {
        if (navRef.current) {
          navRef.current.style.backgroundColor = 'rgba(14,14,15,0)';
          navRef.current.style.backdropFilter = 'none';
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Menu Drawer Animation
  useGSAP(
    () => {
      if (!overlayRef.current || !panelRef.current || !linksRef.current) return;

      if (isOpen) {
        document.body.style.overflow = 'hidden';
        gsap.set(overlayRef.current, { display: 'flex' });
        gsap.to(overlayRef.current, { opacity: 1, duration: 0.3 });
        gsap.fromTo(
          panelRef.current,
          { x: '100%' },
          { x: '0%', duration: 0.5, ease: 'power3.out' },
        );
        gsap.fromTo(
          linksRef.current.children,
          { x: 40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, stagger: 0.06, delay: 0.2, ease: 'power3.out' },
        );
      } else {
        gsap.to(panelRef.current, { x: '100%', duration: 0.4, ease: 'power3.in' });
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
    { dependencies: [isOpen], scope: overlayRef },
  );

  const onClose = () => setIsOpen(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col pointer-events-none">
        <div className="pointer-events-auto">
          <OfferBannerMobile />
        </div>
        <nav
          ref={navRef}
          className="pointer-events-auto w-full px-5 py-4 flex items-center justify-between border-b border-transparent transition-all duration-300"
        >
          <Link
            href="/"
            className="font-display text-display-sm font-bold tracking-tight text-bone"
          >
            StarBy
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="text-pearl hover:text-cobalt transition-colors w-10 h-10 flex items-center justify-center"
              aria-label="Search"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <button
              onClick={() => setWishlistOpen(true)}
              className="relative text-pearl hover:text-ember transition-colors flex items-center justify-center w-10 h-10 hidden xs:flex"
              aria-label="Open wishlist"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              {mounted && wishlistCount > 0 && (
                <span className="absolute top-1 right-0 w-4 h-4 bg-ember text-bone text-[10px] rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              onClick={toggleCart}
              className="relative text-pearl hover:text-cobalt transition-colors flex items-center justify-center w-10 h-10"
              aria-label="Open cart"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              {mounted && totalItems() > 0 && (
                <span className="absolute top-1 right-0 w-4 h-4 bg-cobalt text-bone text-[10px] rounded-full flex items-center justify-center">
                  {totalItems()}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsOpen(true)}
              className="flex flex-col gap-1.5 w-11 h-11 items-center justify-center"
              aria-label="Open menu"
              aria-expanded={isOpen}
            >
              <span className="block w-6 h-px bg-bone" />
              <span className="block w-4 h-px bg-bone ml-auto" />
            </button>
          </div>
        </nav>
      </div>

      {/* Drawer */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-modal bg-charcoal/80 hidden opacity-0"
        onClick={onClose}
      >
        <div
          ref={panelRef}
          className="ml-auto w-4/5 max-w-sm h-full bg-graphite border-l border-smoke flex flex-col p-8 pt-20"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-pearl hover:text-cobalt w-10 h-10 flex items-center justify-center transition-colors"
            aria-label="Close menu"
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

          <div ref={linksRef} className="flex flex-col gap-6 mt-8">
            {menuLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="font-display text-display-sm text-bone hover:text-cobalt transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-auto">
            <div className="flex flex-col gap-4 mb-6 pt-6 border-t border-smoke/30">
              <div className="flex items-center justify-between">
                <span className="font-mono text-caption text-pearl uppercase">Currency</span>
                <div className="flex gap-2">
                  {currencies.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`px-2 py-1 text-[10px] font-mono border rounded ${currency === c ? 'border-cobalt text-cobalt' : 'border-smoke/50 text-pearl'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <button className="font-mono text-caption uppercase text-bone flex items-center gap-2 hover:text-cobalt transition-colors">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Log In / Register</span>
              </button>
            </div>
            <p className="font-mono text-[10px] text-pearl/50 uppercase tracking-widest">
              Your story, engineered.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
