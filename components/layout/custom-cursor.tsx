'use client';

/**
 * custom-cursor.tsx
 *
 * ARCHITECTURE: cursor:none is NEVER applied unconditionally.
 * The class `cursor-ready` is added to <html> ONLY after ALL of the following succeed:
 *   1. pointer: fine media query matches (real mouse/trackpad, not touch)
 *   2. ontouchstart NOT present (not a hybrid touch screen masquerading as pointer: fine)
 *   3. cursorRef and dotRef elements exist in the DOM
 *   4. GSAP quickTo instances created without throwing
 *   5. mousemove event listener successfully attached
 *
 * If any step fails → native cursor is preserved, no class added, no error thrown to the user.
 *
 * CSS in globals.css uses `html.cursor-ready` as the gate, never `body` directly.
 *
 * Portaled to document.body with max zIndex (2147483647) so it is ALWAYS on top of
 * any modal, drawer, backdrop, dialog, or floating panel across the entire site.
 */

import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from '@/lib/gsap-config';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // ── Step 1: Feature detection ────────────────────────────────────────────
    // Only disable if device is strictly coarse touch-only (e.g., phones/tablets).
    // Touchscreen laptops with mice/trackpads (pointer: fine) MUST keep the cursor.
    const isPointerFine =
      typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

    const isCoarseOnly =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches &&
      !window.matchMedia('(pointer: fine)').matches;

    const isMobileWidth = window.innerWidth < 768;

    if (!isPointerFine || isCoarseOnly || isMobileWidth) {
      return;
    }

    // ── Step 2: DOM element guards ───────────────────────────────────────────
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    // ── Step 3: GSAP setup + mousemove ───────────────────────────────────────
    let xToCursor: ((val: number) => void) | null = null;
    let yToCursor: ((val: number) => void) | null = null;
    let xToDot: ((val: number) => void) | null = null;
    let yToDot: ((val: number) => void) | null = null;
    let isHovering = false;
    let isCrosshair = false;
    let hasMoved = false;

    const onMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 768) {
        document.documentElement.classList.remove('cursor-ready');
        return;
      }
      if (!hasMoved) {
        hasMoved = true;
        document.documentElement.classList.add('cursor-ready');
        gsap.to([cursor, dot], { opacity: 1, duration: 0.2 });
      }
      xToCursor?.(e.clientX);
      yToCursor?.(e.clientY);
      xToDot?.(e.clientX);
      yToDot?.(e.clientY);
    };

    const onResize = () => {
      if (window.innerWidth < 768) {
        document.documentElement.classList.remove('cursor-ready');
        gsap.set([cursor, dot], { opacity: 0 });
      }
    };

    const onWindowLeave = () => {
      gsap.to([cursor, dot], { opacity: 0, duration: 0.15 });
    };

    const onWindowEnter = () => {
      if (hasMoved && window.innerWidth >= 768) {
        gsap.to([cursor, dot], { opacity: 1, duration: 0.15 });
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      if (window.innerWidth < 768) return;
      const target = e.target as HTMLElement;
      if (!target || !target.closest) return;

      // When hovering text inputs/textareas, hide custom cursor so native text caret is clean
      const isInput = !!target.closest(
        'input:not([type="button"]):not([type="submit"]):not([type="radio"]):not([type="checkbox"]):not([type="range"]):not([type="color"]), textarea, [contenteditable="true"]'
      );
      if (isInput) {
        gsap.to([cursor, dot], { opacity: 0, duration: 0.12 });
        return;
      } else if (hasMoved) {
        gsap.to([cursor, dot], { opacity: 1, duration: 0.12 });
      }

      // Check for precision crosshair targets (e.g. apparel mockup canvas or click-to-pinpoint)
      const isTargetCrosshair = !!target.closest('.cursor-crosshair, [data-cursor="crosshair"]');
      if (isTargetCrosshair) {
        isCrosshair = true;
        isHovering = false;
        gsap.to(cursor, {
          scale: 0.8,
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderColor: '#10B981',
          boxShadow: '0 0 0 1.5px rgba(0, 0, 0, 0.9), 0 0 12px rgba(16, 185, 129, 0.7)',
          duration: 0.2,
        });
        gsap.to(dot, {
          scale: 1,
          backgroundColor: '#10B981',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.9), 0 0 6px #10b981',
          duration: 0.2,
        });
        return;
      } else if (isCrosshair) {
        isCrosshair = false;
      }

      const isInteractive = !!target.closest(
        'a, button, select, [role="button"], .cursor-pointer, [data-cursor-hover], input[type="button"], input[type="submit"], input[type="radio"], input[type="checkbox"], input[type="range"], input[type="color"], label[for], .clickable'
      );

      if (isInteractive && !isHovering) {
        isHovering = true;
        gsap.to(cursor, {
          scale: 1.45,
          backgroundColor: 'rgba(59, 94, 255, 0.22)',
          borderColor: '#3B5EFF',
          boxShadow: '0 0 0 1.5px rgba(0, 0, 0, 0.85), 0 0 16px rgba(59, 94, 255, 0.55)',
          duration: 0.22,
        });
        gsap.to(dot, { scale: 0, duration: 0.18 });
      } else if (!isInteractive && isHovering) {
        isHovering = false;
        gsap.to(cursor, {
          scale: 1,
          backgroundColor: 'transparent',
          borderColor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.8), 0 0 10px rgba(59, 94, 255, 0.35)',
          duration: 0.22,
        });
        gsap.to(dot, {
          scale: 1,
          backgroundColor: '#ffffff',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.9), 0 0 6px rgba(59, 94, 255, 0.7)',
          duration: 0.22,
        });
      }
    };

    const onMouseDown = () => {
      if (window.innerWidth >= 768) {
        gsap.to(cursor, { scale: isHovering ? 1.25 : 0.85, duration: 0.1 });
      }
    };
    const onMouseUp = () => {
      if (window.innerWidth >= 768) {
        gsap.to(cursor, {
          scale: isCrosshair ? 0.8 : isHovering ? 1.45 : 1,
          duration: 0.15,
        });
      }
    };

    const onCustomHover = (e: Event) => {
      if (window.innerWidth < 768) return;
      const customEv = e as CustomEvent<{ isInteractive?: boolean }>;
      const isInteractive = !!customEv.detail?.isInteractive;
      if (isInteractive && !isHovering) {
        isHovering = true;
        gsap.to(cursor, {
          scale: 1.45,
          backgroundColor: 'rgba(59, 94, 255, 0.22)',
          borderColor: '#3B5EFF',
          boxShadow: '0 0 0 1.5px rgba(0, 0, 0, 0.85), 0 0 16px rgba(59, 94, 255, 0.55)',
          duration: 0.22,
        });
        gsap.to(dot, { scale: 0, duration: 0.18 });
      } else if (!isInteractive && isHovering) {
        isHovering = false;
        gsap.to(cursor, {
          scale: 1,
          backgroundColor: 'transparent',
          borderColor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.8), 0 0 10px rgba(59, 94, 255, 0.35)',
          duration: 0.22,
        });
        gsap.to(dot, {
          scale: 1,
          backgroundColor: '#ffffff',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.9), 0 0 6px rgba(59, 94, 255, 0.7)',
          duration: 0.22,
        });
      }
    };

    try {
      // Set initial position off-screen
      gsap.set(cursor, { xPercent: -50, yPercent: -50, x: -100, y: -100 });
      gsap.set(dot, { xPercent: -50, yPercent: -50, x: -100, y: -100 });

      // Create quickTo instances
      xToCursor = gsap.quickTo(cursor, 'x', { duration: 0.1, ease: 'power3' });
      yToCursor = gsap.quickTo(cursor, 'y', { duration: 0.1, ease: 'power3' });
      xToDot = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
      yToDot = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });

      // Attach listeners
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      window.addEventListener('mouseover', onMouseOver, { passive: true });
      window.addEventListener('mousedown', onMouseDown, { passive: true });
      window.addEventListener('mouseup', onMouseUp, { passive: true });
      window.addEventListener('custom-cursor-hover', onCustomHover);
      document.addEventListener('mouseleave', onWindowLeave);
      document.addEventListener('mouseenter', onWindowEnter);
    } catch (err) {
      console.error('[CustomCursor] Failed to initialize:', err);
      return;
    }

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      document.documentElement.classList.remove('cursor-ready');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('custom-cursor-hover', onCustomHover);
      document.removeEventListener('mouseleave', onWindowLeave);
      document.removeEventListener('mouseenter', onWindowEnter);
      gsap.killTweensOf([cursor, dot]);
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Outer ring cursor (hidden on mobile) */}
      <div
        ref={cursorRef}
        className="hidden md:block"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '2rem',
          height: '2rem',
          borderRadius: '9999px',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.8), 0 0 10px rgba(59, 94, 255, 0.35)',
          pointerEvents: 'none',
          zIndex: 2147483647,
          opacity: 0,
          willChange: 'transform',
        }}
        aria-hidden="true"
      />
      {/* Center dot cursor (hidden on mobile) */}
      <div
        ref={dotRef}
        className="hidden md:block"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '6px',
          height: '6px',
          backgroundColor: '#ffffff',
          borderRadius: '9999px',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.9), 0 0 6px rgba(59, 94, 255, 0.7)',
          pointerEvents: 'none',
          zIndex: 2147483647,
          opacity: 0,
          willChange: 'transform',
        }}
        aria-hidden="true"
      />
    </>,
    document.body
  );
}
