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

    // ── Step 4: Cursor State Helpers ─────────────────────────────────────────
    const setHoverMode = (active: boolean) => {
      if (active && !isHovering) {
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
      } else if (!active && isHovering) {
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

    const setCrosshairMode = (active: boolean) => {
      if (active && !isCrosshair) {
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
      } else if (!active && isCrosshair) {
        isCrosshair = false;
        setHoverMode(false);
      }
    };

    const updateCursorPosition = (clientX: number, clientY: number) => {
      showCursor();
      xToCursor?.(clientX);
      yToCursor?.(clientY);
      xToDot?.(clientX);
      yToDot?.(clientY);
    };

    // ── Step 5: Event Handlers ───────────────────────────────────────────────
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

      updateCursorPosition(e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 768) return;
      updateCursorPosition(e.clientX, e.clientY);
    };

    const onCustomCoords = (e: Event) => {
      if (window.innerWidth < 768) return;
      const customEv = e as CustomEvent<{ clientX: number; clientY: number }>;
      if (typeof customEv.detail?.clientX === 'number' && typeof customEv.detail?.clientY === 'number') {
        updateCursorPosition(customEv.detail.clientX, customEv.detail.clientY);
      }
    };

    const onPointerDown = (e: PointerEvent | MouseEvent) => {
      if ((e as PointerEvent).pointerType === 'touch') {
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

    const onPointerUp = (e: PointerEvent | MouseEvent) => {
      if ((e as PointerEvent).pointerType === 'touch') return;
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

      showCursor();

      // 2. Precision Crosshair Targets
      const isTargetCrosshair = !!target.closest('.cursor-crosshair, [data-cursor="crosshair"]');
      if (isTargetCrosshair) {
        setCrosshairMode(true);
        return;
      } else if (isCrosshair) {
        setCrosshairMode(false);
      }

      // 3. Interactive Click Targets
      const isInteractive = !!target.closest(
        'a, button, select, [role="button"], .cursor-pointer, [data-cursor-hover], input[type="button"], input[type="submit"], input[type="radio"], input[type="checkbox"], input[type="range"], input[type="color"], label[for], .clickable, .side-btn, .nav-tab-btn, .header-btn, .btn-card-subtle, .quick-action-pill, .color-swatch-btn, .catalog-card, .layer-item, .toggle-row, .camera-preset-btn, .uv-tab-btn, .uv-tool-btn, .btn-add-to-cart, .interactive'
      );

      setHoverMode(isInteractive);
    };

    const onCustomHover = (e: Event) => {
      if (window.innerWidth < 768) return;
      const customEv = e as CustomEvent<{ isInteractive?: boolean }>;
      const isInteractive = !!customEv.detail?.isInteractive;
      setHoverMode(isInteractive);
    };

    const onResize = () => {
      if (window.innerWidth < 768) {
        hideCursor();
        document.documentElement.classList.remove('cursor-ready');
      }
    };

    // ── Step 6: Direct Same-Origin Iframe Bridge (for 3D Mockup Studio) ───────
    const bridgedIframes = new WeakSet<HTMLIFrameElement>();
    const iframeCleanups: (() => void)[] = [];

    const bridgeIframe = (iframe: HTMLIFrameElement) => {
      if (bridgedIframes.has(iframe)) return;
      bridgedIframes.add(iframe);

      const attachBridge = () => {
        try {
          const doc = iframe.contentDocument;
          const win = iframe.contentWindow;
          if (!doc || !win) return;

          // 1. Sync cursor-ready class to iframe root
          doc.documentElement.classList.add('cursor-ready');
          doc.documentElement.classList.remove('cursor-hidden');

          // 2. Inject strong cursor suppression style inside iframe
          let styleEl = doc.getElementById('starby-iframe-cursor-suppress') as HTMLStyleElement | null;
          if (!styleEl) {
            styleEl = doc.createElement('style');
            styleEl.id = 'starby-iframe-cursor-suppress';
            styleEl.textContent = `
              html.cursor-ready:not(.cursor-hidden),
              html.cursor-ready:not(.cursor-hidden) * {
                cursor: none !important;
              }
              html.cursor-ready:not(.cursor-hidden) input,
              html.cursor-ready:not(.cursor-hidden) textarea,
              html.cursor-ready:not(.cursor-hidden) [contenteditable="true"] {
                cursor: text !important;
              }
            `;
            doc.head?.appendChild(styleEl);
          }

          // 3. Iframe move handler with coordinate translation
          const onIframeMove = (e: MouseEvent | PointerEvent) => {
            if ((e as PointerEvent).pointerType === 'touch') {
              hideCursor();
              return;
            }
            if (window.innerWidth < 768) return;

            const rect = iframe.getBoundingClientRect();
            const clientX = e.clientX + rect.left;
            const clientY = e.clientY + rect.top;
            updateCursorPosition(clientX, clientY);
          };

          const onIframeDown = (e: MouseEvent | PointerEvent) => {
            if ((e as PointerEvent).pointerType === 'touch') return;
            onPointerDown(e);
          };

          const onIframeUp = (e: MouseEvent | PointerEvent) => {
            if ((e as PointerEvent).pointerType === 'touch') return;
            onPointerUp(e);
          };

          const onIframeOver = (e: MouseEvent) => {
            if (window.innerWidth < 768) return;
            const target = e.target as HTMLElement;
            if (!target || !target.closest) return;

            const isInput = !!target.closest(
              'input:not([type="button"]):not([type="submit"]):not([type="radio"]):not([type="checkbox"]):not([type="range"]):not([type="color"]), textarea, [contenteditable="true"]'
            );
            if (isInput) {
              hideCursor();
              return;
            }

            showCursor();

            const isTargetCrosshair = !!target.closest(
              '.cursor-crosshair, [data-cursor="crosshair"], .uv-canvas'
            );
            if (isTargetCrosshair) {
              setCrosshairMode(true);
              return;
            } else if (isCrosshair) {
              setCrosshairMode(false);
            }

            const isInteractive = !!target.closest(
              'a, button, select, [role="button"], .cursor-pointer, [data-cursor-hover], input[type="button"], input[type="submit"], input[type="radio"], input[type="checkbox"], input[type="range"], input[type="color"], label[for], .clickable, .side-btn, .nav-tab-btn, .header-btn, .btn-card-subtle, .quick-action-pill, .color-swatch-btn, .catalog-card, .layer-item, .toggle-row, .camera-preset-btn, .uv-tab-btn, .uv-tool-btn, .btn-add-to-cart, .interactive'
            );
            setHoverMode(isInteractive);
          };

          win.addEventListener('pointermove', onIframeMove, { passive: true });
          win.addEventListener('mousemove', onIframeMove, { passive: true });
          win.addEventListener('pointerdown', onIframeDown, { passive: true });
          win.addEventListener('mousedown', onIframeDown, { passive: true });
          win.addEventListener('pointerup', onIframeUp, { passive: true });
          win.addEventListener('mouseup', onIframeUp, { passive: true });
          win.addEventListener('mouseover', onIframeOver, { passive: true });

          iframeCleanups.push(() => {
            try {
              win.removeEventListener('pointermove', onIframeMove);
              win.removeEventListener('mousemove', onIframeMove);
              win.removeEventListener('pointerdown', onIframeDown);
              win.removeEventListener('mousedown', onIframeDown);
              win.removeEventListener('pointerup', onIframeUp);
              win.removeEventListener('mouseup', onIframeUp);
              win.removeEventListener('mouseover', onIframeOver);
            } catch {}
          });
        } catch {
          // Cross-origin iframe or restricted
        }
      };

      if (iframe.contentDocument?.readyState === 'complete') {
        attachBridge();
      } else {
        iframe.addEventListener('load', attachBridge, { once: true });
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
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('custom-cursor-coords', onCustomCoords);
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
      window.addEventListener('mousedown', onPointerDown, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { passive: true });
      window.addEventListener('mouseup', onPointerUp, { passive: true });
      window.addEventListener('mouseover', onMouseOver, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      window.addEventListener('custom-cursor-hover', onCustomHover);

      // Window blur & focus handlers ensure native cursor is restored when user alt-tabs
      window.addEventListener('blur', hideCursor);
      window.addEventListener('focus', showCursor);

      // Document boundary handlers
      document.addEventListener('mouseleave', hideCursor);
      document.addEventListener('mouseenter', showCursor);

      // Connect existing iframes and observe new ones
      document.querySelectorAll('iframe').forEach(bridgeIframe);

      const iframeObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
          m.addedNodes.forEach((node) => {
            if (node instanceof HTMLIFrameElement) {
              bridgeIframe(node);
            } else if (node instanceof HTMLElement) {
              node.querySelectorAll('iframe').forEach(bridgeIframe);
            }
          });
        }
      });
      iframeObserver.observe(document.body, { childList: true, subtree: true });
      iframeCleanups.push(() => iframeObserver.disconnect());
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
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('custom-cursor-coords', onCustomCoords);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('custom-cursor-hover', onCustomHover);
      window.removeEventListener('blur', hideCursor);
      window.removeEventListener('focus', showCursor);
      document.removeEventListener('mouseleave', hideCursor);
      document.removeEventListener('mouseenter', showCursor);
      iframeCleanups.forEach((fn) => fn());
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
