'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import { useCartStore } from '@/lib/stores/cart-store';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { useCurrencyStore, type CurrencyCode } from '@/lib/stores/currency-store';
import { useSearchStore } from '@/lib/stores/search-store';

import { OfferBannerDesktop } from '@/components/home/offer-banner/offer-banner.desktop';

const navLinks = [
  { href: '/products/all', label: 'Shop All' },
  { href: '/split-poster', label: 'Split Posters' },
  { href: '/customize', label: 'Design DIY' },
  { href: '/studio', label: 'Studio' },
  { href: '/faq', label: 'FAQ' },
];

export function NavigationDesktop() {
  const containerRef = useRef<HTMLElement>(null);
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

  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.fromTo(
        containerRef.current,
        { backgroundColor: 'rgba(14,14,15,0)' },
        {
          backgroundColor: 'rgba(14,14,15,0.95)',
          backdropFilter: 'blur(12px)',
          duration: 0.3,
          scrollTrigger: {
            trigger: document.body,
            start: 'top -80px',
            end: 'top -81px',
            toggleActions: 'play none none reverse',
          },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col pointer-events-none">
      <div className="pointer-events-auto">
        <OfferBannerDesktop />
      </div>
      <nav
        ref={containerRef}
        className="pointer-events-auto w-full px-5 md:px-8 py-4 flex items-center justify-between border-b border-transparent transition-colors"
      >
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-display-sm md:text-display-md font-bold tracking-tight text-bone"
        >
          StarBy
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-caption uppercase tracking-widest text-pearl hover:text-cobalt transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Currency Dropdown */}
          <div className="relative group cursor-pointer hidden lg:block">
            <span className="font-mono text-caption text-pearl group-hover:text-cobalt transition-colors uppercase flex items-center gap-1">
              {currency} ▾
            </span>
            <div className="absolute top-full right-0 mt-2 w-24 bg-charcoal border border-smoke/50 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              {currencies.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`w-full text-left px-4 py-2 font-mono text-caption hover:bg-smoke/20 hover:text-bone ${currency === c ? 'text-bone' : 'text-pearl'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Search Icon */}
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

          {/* Wishlist Icon */}
          <button
            onClick={() => setWishlistOpen(true)}
            className="relative text-pearl hover:text-ember transition-colors flex items-center justify-center w-10 h-10"
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

          {/* Account Icon */}
          <button
            onClick={() => {}} // TODO: Auth Modal
            className="text-pearl hover:text-bone transition-colors w-10 h-10 flex items-center justify-center hidden sm:flex"
            aria-label="Account"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>

          {/* Cart Icon */}
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
        </div>
      </nav>
    </div>
  );
}
