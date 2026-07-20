'use client';

import { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import Link from 'next/link';
import { gsap } from '@/lib/gsap-config';
import { useCartStore } from '@/lib/stores/cart-store';

import { OfferBannerMobile } from '@/components/home/offer-banner/offer-banner.mobile';

const menuLinks = [
  { href: '/', label: 'Home' },
  { href: '/products/all', label: 'Shop' },
  { href: '/studio', label: 'Studio' },
  { href: '/split-poster', label: 'Split Poster' },
  { href: '/faq', label: 'FAQ' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/contact', label: 'Contact' },
];

export function NavigationMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);
  const toggleCart = useCartStore((s) => s.toggleCart);

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
      <div className="fixed top-0 left-0 right-0 z-sticky flex flex-col pointer-events-none">
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

            <button
              onClick={() => setIsOpen(true)}
              className="flex flex-col gap-1.5 p-2"
              aria-label="Open menu"
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
            className="absolute top-6 right-6 text-pearl hover:text-cobalt font-mono text-caption uppercase"
          >
            Close
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
            <p className="font-mono text-caption text-pearl uppercase tracking-widest">
              Your story, engineered.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
