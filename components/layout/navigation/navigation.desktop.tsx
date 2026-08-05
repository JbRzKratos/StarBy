'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
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
  const [user, setUser] = useState<User | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const pathname = usePathname();
  const isHomePage = pathname === '/';

  // Determine styles based on page and scroll
  let navClasses = '';
  let textIsDark = false;

  if (isHomePage) {
    if (isScrolled) {
      // Home scrolled: Dark background, light text
      navClasses =
        'bg-[#0A0A0A]/95 text-[#F5F1EA] border-b border-[#F5F1EA]/10 shadow-2xl backdrop-blur-md';
      textIsDark = false;
    } else {
      // Home top: Transparent background, dark text
      navClasses = 'bg-transparent text-[#0A0A0A] border-b border-transparent';
      textIsDark = true;
    }
  } else {
    // Other pages: Always dark background, light text (regardless of scroll)
    navClasses = 'bg-[#0A0A0A]/95 text-[#F5F1EA] border-b border-[#F5F1EA]/10 shadow-2xl backdrop-blur-md';
    textIsDark = false;
  }

  useEffect(() => {
    setMounted(true);

    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      return () => authListener.subscription.unsubscribe();
    });

    const handleScroll = () => {
      if (window.scrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initialize state on mount
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col pointer-events-none">
      <div className="pointer-events-auto">
        <OfferBannerDesktop />
      </div>
      <nav
        ref={containerRef}
        className={`pointer-events-auto w-full px-6 md:px-12 py-3.5 flex items-center justify-between transition-all duration-300 ${navClasses}`}
      >
        {/* Logo */}
        <Link
          href="/"
          className={`font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center group transition-colors ${
            textIsDark ? 'text-[#0A0A0A]' : 'text-[#F5F1EA]'
          }`}
        >
          <span className="flex items-start">
            <span className="leading-none">StarBy</span>
            <svg
              className="w-3.5 h-3.5 text-[#ED9518] animate-pulse ml-[1px]"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <path d="M50 0 C50 35, 65 50, 100 50 C65 50, 50 65, 50 100 C50 65, 35 50, 0 50 C35 50, 50 35, 50 0 Z" />
            </svg>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-mono text-caption uppercase tracking-widest font-bold transition-colors ${
                textIsDark
                  ? 'text-[#0A0A0A] hover:text-[#ED9518]'
                  : 'text-[#F5F1EA] hover:text-[#ED9518]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side icons & actions */}
        <div className="flex items-center gap-4">
          {/* Currency Dropdown */}
          <div className="relative group cursor-pointer hidden lg:block">
            <span
              className={`font-mono text-caption font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ${
                textIsDark
                  ? 'text-[#0A0A0A] group-hover:text-[#ED9518]'
                  : 'text-[#F5F1EA] group-hover:text-[#ED9518]'
              }`}
            >
              {currency} ▾
            </span>
            <div className="absolute top-full right-0 mt-2 w-24 bg-[#0A0A0A] border border-[#F5F1EA]/20 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {currencies.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`w-full text-left px-4 py-2 font-mono text-caption hover:bg-white/10 ${
                    currency === c ? 'text-[#ED9518]' : 'text-[#F5F1EA]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Search Icon */}
          <button
            onClick={() => setSearchOpen(true)}
            className={`transition-colors w-10 h-10 flex items-center justify-center ${
              textIsDark
                ? 'text-[#0A0A0A] hover:text-[#ED9518]'
                : 'text-[#F5F1EA] hover:text-[#ED9518]'
            }`}
            aria-label="Search"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          {/* Wishlist Icon */}
          <button
            onClick={() => setWishlistOpen(true)}
            className={`relative transition-colors flex items-center justify-center w-10 h-10 ${
              textIsDark
                ? 'text-[#0A0A0A] hover:text-[#ED9518]'
                : 'text-[#F5F1EA] hover:text-[#ED9518]'
            }`}
            aria-label="Open wishlist"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {mounted && wishlistCount > 0 && (
              <span className="absolute top-1 right-0 w-4 h-4 bg-[#ED9518] text-[#0A0A0A] font-bold text-[10px] rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Account Icon / Sign In */}
          {mounted && user ? (
            <Link
              href="/account"
              className={`transition-colors flex items-center justify-center w-10 h-10 hidden sm:flex ${
                textIsDark
                  ? 'text-[#0A0A0A] hover:text-[#ED9518]'
                  : 'text-[#F5F1EA] hover:text-[#ED9518]'
              }`}
              aria-label="Account"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </Link>
          ) : mounted && !user ? (
            <Link
              href="/login"
              className={`hidden sm:block font-mono text-caption font-bold uppercase tracking-widest transition-colors ml-2 ${
                textIsDark
                  ? 'text-[#0A0A0A] hover:text-[#ED9518]'
                  : 'text-[#F5F1EA] hover:text-[#ED9518]'
              }`}
            >
              Sign In
            </Link>
          ) : null}

          {/* Cart Icon */}
          <button
            onClick={toggleCart}
            className={`relative transition-colors flex items-center justify-center w-10 h-10 ${
              textIsDark
                ? 'text-[#0A0A0A] hover:text-[#ED9518]'
                : 'text-[#F5F1EA] hover:text-[#ED9518]'
            }`}
            aria-label="Open cart"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            {mounted && totalItems() > 0 && (
              <span className="absolute top-1 right-0 w-4 h-4 bg-[#ED9518] text-[#0A0A0A] font-bold text-[10px] rounded-full flex items-center justify-center">
                {totalItems()}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}
