'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { useCartStore } from '@/lib/stores/cart-store';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { useCurrencyStore, type CurrencyCode } from '@/lib/stores/currency-store';
import { useSearchStore } from '@/lib/stores/search-store';

import { OfferBanner } from '@/components/home/offer-banner';
import { FregoroLogo } from '@/components/ui/fregoro-logo';
interface MenuLinkItem {
  href: string;
  label: string;
  symbol: string;
}

const menuLinks: MenuLinkItem[] = [
  { href: '/', label: 'Home', symbol: '✦' },
  { href: '/products/all', label: 'Shop All', symbol: '◈' },
  { href: '/products/posters', label: 'Posters', symbol: '▦' },
  { href: '/split-poster', label: 'Split Posters', symbol: '⊞' },
  { href: '/wall-studio', label: 'Wall Studio', symbol: '❖' },
  { href: '/bulk-orders', label: 'Bulk & Custom Orders', symbol: '▨' },
  { href: '/magazine', label: 'Magazine Studio', symbol: '▤' },
  { href: '/studio', label: '360° Studio', symbol: '↺' },
  { href: '/faq', label: 'FAQ & Shipping', symbol: '✈' },
  { href: '/contact', label: 'Contact', symbol: '✉' },
];

export interface NavigationMobileProps {
  variant?: 'hero' | 'solid';
}

export function NavigationMobile({ variant: _variant = 'solid' }: NavigationMobileProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const toggleCart = useCartStore((s) => s.toggleCart);

  const setWishlistOpen = useWishlistStore((s) => s.setWishlistOpen);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const setSearchOpen = useSearchStore((s) => s.setSearchOpen);
  const { currency, setCurrency } = useCurrencyStore();
  const currencies: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isScrolledState, setIsScrolledState] = useState(false);

  const isLandingPage = pathname === '/';

  useEffect(() => {
    setMounted(true);

    // Check auth status — skip the Supabase SDK when no auth cookie exists.
    if (!document.cookie.includes('-auth-token')) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    import('@/lib/supabase/client').then(({ createClient }) => {
      if (cancelled) return;
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!cancelled) setUser(data.user);
      });
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      unsubscribe = () => authListener.subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const navRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const hasOpenedRef = useRef(false);

  // Hide Tawk.to chat widget & floating actions when mobile menu is open
  useEffect(() => {
    const win = window as unknown as {
      Tawk_API?: { hideWidget?: () => void; showWidget?: () => void };
    };

    if (isOpen) {
      document.body.classList.add('mobile-drawer-open');
      try {
        win.Tawk_API?.hideWidget?.();
      } catch (e) {
        console.warn('Tawk hide notice:', e);
      }
    } else {
      document.body.classList.remove('mobile-drawer-open');
      try {
        win.Tawk_API?.showWidget?.();
      } catch (e) {
        console.warn('Tawk show notice:', e);
      }
    }
  }, [isOpen]);

  // Sticky nav background animation
  useEffect(() => {
    let prev = window.scrollY > 60;
    const handleScroll = () => {
      const shouldScroll = window.scrollY > 60;
      if (prev !== shouldScroll) {
        prev = shouldScroll;
        setIsScrolledState(shouldScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine styles based on route and scroll
  // Guard with `mounted` to avoid CLS during server/client hydration mismatch
  const textIsDark = mounted && isLandingPage && !isScrolledState;

  const isWallStudio = pathname?.startsWith('/wall-studio');
  const navClasses =
    isScrolledState || isWallStudio
      ? 'bg-[#0E0E10] text-[#F5F1EA] border-b border-[#F5F1EA]/15 shadow-2xl'
      : 'bg-transparent border-b border-transparent';

  // Menu Drawer Animation — load GSAP only after the menu is first opened.
  useEffect(() => {
    if (isOpen) {
      hasOpenedRef.current = true;
    } else if (!hasOpenedRef.current) {
      return;
    }

    let cancelled = false;

    import('@/lib/gsap-config').then(({ gsap }) => {
      if (cancelled || !overlayRef.current || !panelRef.current || !linksRef.current) return;

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
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const onClose = () => setIsOpen(false);

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-[100] flex flex-col pointer-events-none host-navigation-bar"
        data-host-nav
      >
        <div className="pointer-events-auto">
          <OfferBanner />
        </div>
        <nav
          ref={navRef}
          className={`pointer-events-auto w-full px-3 sm:px-5 py-3.5 flex items-center justify-between transition-[background-color,border-color,box-shadow] duration-300 ease-out antialiased ${navClasses}`}
        >
          <FregoroLogo textIsDark={textIsDark} size="sm" />

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className={`transition-colors w-10 h-10 flex items-center justify-center ${
                textIsDark
                  ? 'text-[#0A0A0A] hover:text-[#B45309]'
                  : 'text-[#F5F1EA] hover:text-[#ED9518]'
              }`}
              aria-label="Search"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <button
              onClick={() => setWishlistOpen(true)}
              className={`relative transition-colors flex items-center justify-center w-11 h-11 ${
                textIsDark
                  ? 'text-[#0A0A0A] hover:text-[#B45309]'
                  : 'text-[#F5F1EA] hover:text-[#ED9518]'
              }`}
              aria-label="Open wishlist"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              {mounted && wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-[#ED9518] text-[#0A0A0A] text-[9px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              onClick={toggleCart}
              className={`relative transition-colors flex items-center justify-center w-11 h-11 ${
                textIsDark
                  ? 'text-[#0A0A0A] hover:text-[#B45309]'
                  : 'text-[#F5F1EA] hover:text-[#ED9518]'
              }`}
              aria-label="Open cart"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              {mounted && totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-[#ED9518] text-[#0A0A0A] text-[9px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsOpen(true)}
              className={`relative transition-colors flex items-center justify-center w-11 h-11 ${
                textIsDark
                  ? 'text-[#0A0A0A] hover:text-[#B45309]'
                  : 'text-[#F5F1EA] hover:text-[#ED9518]'
              }`}
              aria-label="Open menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between items-end">
                <span className="w-5 h-0.5 bg-current transition-all" />
                <span className="w-3.5 h-0.5 bg-current transition-all" />
                <span className="w-4 h-0.5 bg-current transition-all" />
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* Drawer Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[110] bg-[#0A0A0A]/80 backdrop-blur-md flex justify-end opacity-0 hidden transition-opacity"
        onClick={onClose}
      >
        <div
          ref={panelRef}
          className="w-full max-w-sm h-full h-[100dvh] max-h-[100dvh] bg-[#0A0A0A] border-l border-[#F5F1EA]/10 p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(1.5rem+env(safe-area-inset-top,0px))] flex flex-col justify-between overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#F5F1EA]/10">
              <span className="font-display text-xl font-bold text-[#F5F1EA]">Menu</span>
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center text-[#F5F1EA] hover:text-[#ED9518] transition-colors"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div ref={linksRef} className="flex flex-col gap-3.5">
              {menuLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  onClick={onClose}
                  className="font-display text-2xl font-bold text-[#F5F1EA] hover:text-[#ED9518] transition-colors flex items-center gap-3.5 group py-1"
                >
                  <span className="text-xl text-[#F5F1EA]/60 group-hover:text-[#ED9518] font-mono select-none w-6 text-center shrink-0 transition-colors">
                    {link.symbol}
                  </span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-[#F5F1EA]/10 flex flex-col gap-4">
            {user ? (
              <Link
                href="/account"
                onClick={onClose}
                className="font-mono text-caption text-[#ED9518] uppercase tracking-widest"
              >
                My Account ({user.email})
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={onClose}
                className="font-mono text-caption text-[#F5F1EA] hover:text-[#ED9518] uppercase tracking-widest"
              >
                Sign In / Register
              </Link>
            )}
            <div className="flex items-center gap-2">
              <span className="font-mono text-caption text-[#F5F1EA]/50 uppercase">Currency:</span>
              <div className="flex gap-2">
                {currencies.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`font-mono text-caption font-bold px-2 py-1 rounded ${
                      currency === c
                        ? 'bg-[#ED9518] text-[#0A0A0A]'
                        : 'text-[#F5F1EA] hover:bg-white/10'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
