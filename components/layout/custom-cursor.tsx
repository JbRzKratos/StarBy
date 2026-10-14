'use client';

/**
 * custom-cursor.tsx
 *
 * ARCHITECTURE & RESILIENCE:
 * 1. Native cursor is NEVER permanently hidden without a functioning custom cursor.
 * 2. `cursor: none` is applied via `html.cursor-ready:not(.cursor-hidden)`.
 *    The moment the mouse leaves the viewport, enters an iframe, or hovers a text field,
 *    `cursor-hidden` is activated, INSTANTLY restoring the native operating system cursor.
 * 3. On systems with touchscreens or 2-in-1 hybrid displays (e.g. Surface, Yoga, touch laptops):
 *    `pointerType === 'touch'` dynamically disables the custom cursor and restores touch behavior.
 * 4. Resolves the "disappearing cursor" bug where moving mouse across an iframe or alt-tabbing
 *    previously left the custom cursor stuck at `opacity: 0` while native cursor remained suppressed.
 * 5. Uses a dual-contour border + drop-shadow aesthetic that is razor-sharp and high-contrast
 *    across ALL sectors (pure black, pure white, gray cards, and WebGL canvases).
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

    // ── Step 1: Accessibility & Capability Detection ──────────────────────────
    // Respect user's OS-level motion preference (e.g. Windows/Mac "Reduce motion")
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      document.documentElement.classList.remove('cursor-ready');
      return;
    }

    // Support both primary pointer and secondary pointer (e.g. laptop with touchscreen + mouse)
    const hasFinePointer =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: fine)').matches ||
        window.matchMedia('(any-pointer: fine)').matches);

    const isMobileWidth = window.innerWidth < 768;

    if (!hasFinePointer || isMobileWidth) {
      document.documentElement.classList.remove('cursor-ready');
      return;
    }

    // ── Step 2: DOM Element Guards ───────────────────────────────────────────
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    // ── Step 3: State & GSAP QuickTo Setup ───────────────────────────────────
    let xToCursor: ((val: number) => void) | null = null;
    let yToCursor: ((val: number) => void) | null = null;
    let xToDot: ((val: number) => void) | null = null;
    let yToDot: ((val: number) => void) | null = null;

    let isHovering = false;
    let isCrosshair = false;
    let isCursorVisible = false;

    const showCursor = () => {
      if (!isCursorVisible) {
        isCursorVisible = true;
        document.documentElement.classList.add('cursor-ready');
        document.documentElement.classList.remove('cursor-hidden');
        gsap.to([cursor, dot], { opacity: 1, duration: 0.15, overwrite: 'auto' });
      }
    };

    const hideCursor = () => {
      if (isCursorVisible) {
        isCursorVisible = false;
        document.documentElement.classList.add('cursor-hidden');
        gsap.to([cursor, dot], { opacity: 0, duration: 0.12, overwrite: 'auto' });
      }
    };

    // ── Step 4: Event Handlers ───────────────────────────────────────────────
    const onPointerMove = (e: PointerEvent) => {
      // Touch interaction on hybrid touchscreen laptops -> always hide custom cursor
      if (e.pointerType === 'touch') {
        hideCursor();
        return;
      }

      if (window.innerWidth < 768) {
        hideCursor();
        document.documentElement.classList.remove('cursor-ready');
        return;
      }

      // Ensure cursor is visible whenever moving over the viewport
      showCursor();

      xToCursor?.(e.clientX);
      yToCursor?.(e.clientY);
      xToDot?.(e.clientX);
      yToDot?.(e.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        hideCursor();
        return;
      }
      if (window.innerWidth >= 768) {
        gsap.to(cursor, {
          scale: isHovering ? 1.25 : 0.85,
          duration: 0.1,
          overwrite: 'auto',
        });
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (window.innerWidth >= 768) {
        gsap.to(cursor, {
          scale: isCrosshair ? 0.8 : isHovering ? 1.45 : 1,
          duration: 0.15,
          overwrite: 'auto',
        });
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      if (window.innerWidth < 768) return;
      const target = e.target as HTMLElement;
      if (!target || !target.closest) return;

      // 1. Text Inputs / Textareas: hide custom cursor so native caret is crisp & accessible
      const isInput = !!target.closest(
        'input:not([type="button"]):not([type="submit"]):not([type="radio"]):not([type="checkbox"]):not([type="range"]):not([type="color"]), textarea, [contenteditable="true"]'
      );
      if (isInput) {
        hideCursor();
        return;
      }

      // 2. Iframes (e.g. 3D Clothing Mockup Studio, payment gateways): hide custom cursor so iframe has full native interaction
      const isIframe = target.tagName === 'IFRAME' || !!target.closest('iframe');
      if (isIframe) {
        hideCursor();
        return;
      }

      // Re-enable visibility if moving out of an input or iframe
      showCursor();

      // 3. Precision Crosshair Targets
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
          overwrite: 'auto',
        });
        gsap.to(dot, {
          scale: 1,
          backgroundColor: '#10B981',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.9), 0 0 6px #10b981',
          duration: 0.2,
          overwrite: 'auto',
        });
        return;
      } else if (isCrosshair) {
        isCrosshair = false;
      }

      // 4. Interactive Click Targets
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
          overwrite: 'auto',
        });
        gsap.to(dot, { scale: 0, duration: 0.18, overwrite: 'auto' });
      } else if (!isInteractive && isHovering) {
        isHovering = false;
        gsap.to(cursor, {
          scale: 1,
          backgroundColor: 'transparent',
          borderColor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.8), 0 0 10px rgba(59, 94, 255, 0.35)',
          duration: 0.22,
          overwrite: 'auto',
        });
        gsap.to(dot, {
          scale: 1,
          backgroundColor: '#ffffff',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.9), 0 0 6px rgba(59, 94, 255, 0.7)',
          duration: 0.22,
          overwrite: 'auto',
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
          overwrite: 'auto',
        });
        gsap.to(dot, { scale: 0, duration: 0.18, overwrite: 'auto' });
      } else if (!isInteractive && isHovering) {
        isHovering = false;
        gsap.to(cursor, {
          scale: 1,
          backgroundColor: 'transparent',
          borderColor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.8), 0 0 10px rgba(59, 94, 255, 0.35)',
          duration: 0.22,
          overwrite: 'auto',
        });
        gsap.to(dot, {
          scale: 1,
          backgroundColor: '#ffffff',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.9), 0 0 6px rgba(59, 94, 255, 0.7)',
          duration: 0.22,
          overwrite: 'auto',
        });
      }
    };

    const onResize = () => {
      if (window.innerWidth < 768) {
        hideCursor();
        document.documentElement.classList.remove('cursor-ready');
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

      // Attach modern pointer events (handles mouse, trackpad, pen)
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { passive: true });
      window.addEventListener('mouseover', onMouseOver, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      window.addEventListener('custom-cursor-hover', onCustomHover);

      // Window blur & focus handlers ensure native cursor is restored when user alt-tabs
      window.addEventListener('blur', hideCursor);
      window.addEventListener('focus', showCursor);

      // Document boundary handlers
      document.addEventListener('mouseleave', hideCursor);
      document.addEventListener('mouseenter', showCursor);
    } catch (err) {
      console.error('[CustomCursor] Failed to initialize:', err);
      document.documentElement.classList.remove('cursor-ready');
      return;
    }

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      document.documentElement.classList.remove('cursor-ready');
      document.documentElement.classList.remove('cursor-hidden');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('custom-cursor-hover', onCustomHover);
      window.removeEventListener('blur', hideCursor);
      window.removeEventListener('focus', showCursor);
      document.removeEventListener('mouseleave', hideCursor);
      document.removeEventListener('mouseenter', showCursor);
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
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.85), 0 0 10px rgba(59, 94, 255, 0.35)',
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
