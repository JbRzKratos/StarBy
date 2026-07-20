'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap-config';
import { useCartStore } from '@/lib/stores/cart-store';

const navLinks = [
  { href: '/products/all', label: 'Shop' },
  { href: '/studio', label: 'Studio' },
  { href: '/split-poster', label: 'Split Poster' },
  { href: '/faq', label: 'FAQ' },
];

export function NavigationDesktop() {
  const containerRef = useRef<HTMLElement>(null);
  const totalItems = useCartStore((s) => s.totalItems);
  const toggleCart = useCartStore((s) => s.toggleCart);

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
    <>
      <nav
        ref={containerRef}
        className="fixed top-0 left-0 right-0 z-sticky px-5 md:px-8 py-4 flex items-center justify-between border-b border-transparent transition-colors"
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
          <button
            onClick={toggleCart}
            className="relative font-mono text-caption uppercase tracking-widest text-pearl hover:text-cobalt transition-colors"
            aria-label="Open cart"
          >
            Cart
            {totalItems() > 0 && (
              <span className="absolute -top-2 -right-4 w-4 h-4 bg-cobalt text-bone text-[10px] rounded-full flex items-center justify-center">
                {totalItems()}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
