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
 * CSS in globals.css uses `html.cursor-ready` as the gate, never `body` directly,
 * and never via an unconditional selector.
 *
 * Cleanup on unmount: removes all event listeners AND removes cursor-ready from <html>.
 */

import { useRef, useEffect } from 'react';
import { gsap } from '@/lib/gsap-config';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ── Step 1: Feature detection ────────────────────────────────────────────
    // Only proceed if this is a genuine pointer device (mouse/trackpad).
    // matchMedia('(pointer: fine)') returns false on touch-only devices.
    // The ontouchstart check catches hybrid devices that report pointer: fine
    // but are primarily touch (e.g. some Surface/iPad configurations).
    const isPointerFine =
      typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

    const isTouchOnly = 'ontouchstart' in window;

    if (!isPointerFine || isTouchOnly) {
      // Touch or coarse-pointer device: leave native cursor intact, do nothing.
      return;
    }

    // ── Step 2: DOM element guards ───────────────────────────────────────────
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    // ── Step 3: GSAP setup + mousemove — all inside try/catch ────────────────
    // Any failure here aborts the entire init WITHOUT adding cursor-ready.
    let xToCursor: ((val: number) => void) | null = null;
    let yToCursor: ((val: number) => void) | null = null;
    let xToDot: ((val: number) => void) | null = null;
    let yToDot: ((val: number) => void) | null = null;
    let isHovering = false;

    let hasMoved = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!hasMoved) {
        hasMoved = true;
        // ── Step 4: Only NOW add cursor-ready to <html> ───────────────────────
        // We do this on the FIRST mouse move to ensure the custom cursor is
        // actually tracking correctly before we hide the native cursor.
        document.documentElement.classList.add('cursor-ready');
        gsap.to([cursor, dot], { opacity: 1, duration: 0.3 });
      }
      xToCursor?.(e.clientX);
      yToCursor?.(e.clientY);
      xToDot?.(e.clientX);
      yToDot?.(e.clientY);
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = !!target.closest('a, button, input, select, textarea, [role="button"]');
      if (isInteractive && !isHovering) {
        isHovering = true;
        gsap.to(cursor, {
          scale: 1.5,
          backgroundColor: '#ffffff',
          borderColor: 'transparent',
          duration: 0.3,
        });
        gsap.to(dot, { scale: 0, duration: 0.3 });
      } else if (!isInteractive && isHovering) {
        isHovering = false;
        gsap.to(cursor, {
          scale: 1,
          backgroundColor: 'transparent',
          borderColor: 'rgba(255, 255, 255, 0.5)',
          duration: 0.3,
        });
        gsap.to(dot, { scale: 1, duration: 0.3 });
      }
    };

    const onMouseDown = () => gsap.to(cursor, { scale: 0.8, duration: 0.1 });
    const onMouseUp = () => gsap.to(cursor, { scale: isHovering ? 1.5 : 1, duration: 0.1 });

    try {
      // Set initial position off-screen
      gsap.set(cursor, { xPercent: -50, yPercent: -50, x: -100, y: -100 });
      gsap.set(dot, { xPercent: -50, yPercent: -50, x: -100, y: -100 });

      // Create quickTo instances — this can throw if GSAP is misconfigured
      xToCursor = gsap.quickTo(cursor, 'x', { duration: 0.1, ease: 'power3' });
      yToCursor = gsap.quickTo(cursor, 'y', { duration: 0.1, ease: 'power3' });
      xToDot = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
      yToDot = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });

      // Attach listeners
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mouseover', onMouseOver, { passive: true });
      window.addEventListener('mousedown', onMouseDown, { passive: true });
      window.addEventListener('mouseup', onMouseUp, { passive: true });

      // Listeners are attached. The cursor-ready class and fade-in are now
      // handled inside onMouseMove so we only hide native cursor if it works.
    } catch (err) {
      // Init failed — log it but DO NOT add cursor-ready.
      // Native cursor remains visible — this is safe/correct behaviour.
      console.error('[CustomCursor] Failed to initialize:', err);
      // Do NOT add cursor-ready class
      return;
    }

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      // Remove the gate class so native cursor comes back immediately
      document.documentElement.classList.remove('cursor-ready');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      gsap.killTweensOf([cursor, dot]);
    };
  }, []); // Empty deps: runs once on mount, cleans up on unmount

  // Always render the DOM elements — they are invisible (opacity-0) until
  // the cursor-ready class and fade-in succeed. They use pointer-events:none
  // so they never interfere with interaction regardless of state.
  return (
    <>
      {/* Outer ring cursor */}
      <div
        ref={cursorRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '2rem',
          height: '2rem',
          borderRadius: '9999px',
          border: '1px solid rgba(255,255,255,0.5)',
          pointerEvents: 'none',
          zIndex: 999999,
          opacity: 0,
          mixBlendMode: 'difference',
          willChange: 'transform',
        }}
        aria-hidden="true"
      />
      {/* Center dot cursor */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '6px',
          height: '6px',
          backgroundColor: 'white',
          borderRadius: '9999px',
          pointerEvents: 'none',
          zIndex: 999999,
          opacity: 0,
          mixBlendMode: 'difference',
          willChange: 'transform',
        }}
        aria-hidden="true"
      />
    </>
  );
}
