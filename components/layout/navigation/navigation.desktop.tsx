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
import { FregoroLogo } from '@/components/ui/fregoro-logo';

const navLinks = [
  { href: '/products/all', label: 'Shop All' },
  { href: '/magazine', label: 'Magazine' },
  { href: '/split-poster', label: 'Split Posters' },
  { href: '/customize', label: 'Design DIY' },
  { href: '/studio', label: 'Studio' },
  { href: '/faq', label: 'FAQ' },
];

export interface NavigationDesktopProps {
  variant?: 'hero' | 'solid';
}

export function NavigationDesktop({ variant: _variant = 'solid' }: NavigationDesktopProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLElement>(null);
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const toggleCart = useCartStore((s) => s.toggleCart);

  const setWishlistOpen = useWishlistStore((s) => s.setWishlistOpen);
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const setSearchOpen = useSearchStore((s) => s.setSearchOpen);

  const { currency, setCurrency } = useCurrencyStore();
  const currencies: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const isLandingPage = pathname === '/';
  // Text is dark ONLY at scroll 0 on the landing page (which has a cream background)
  const textIsDark = isLandingPage && !isScrolled;

  // Background is transparent at scroll 0 on ALL pages. When scrolled (>60px), solid black on all pages.
  const navClasses = isScrolled
    ? 'bg-[#0E0E10] text-[#F5F1EA] border-b border-[#F5F1EA]/15 shadow-2xl'
    : 'bg-transparent border-b border-transparent';

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
  }, []);

  // Scroll listener for sticky header background transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
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
        className={`pointer-events-auto w-full px-6 md:px-12 py-3.5 flex items-center justify-between transition-all duration-300 ease-out antialiased ${navClasses}`}
      >
        {/* Logo */}
        <FregoroLogo textIsDark={textIsDark} size="md" />

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
            {mounted && totalItems > 0 && (
              <span className="absolute top-1 right-0 w-4 h-4 bg-[#ED9518] text-[#0A0A0A] font-bold text-[10px] rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}
