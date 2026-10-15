'use client';

/**
 * custom-cursor.tsx
 *
 * WORLD-CLASS HIGH-PERFORMANCE CUSTOM CURSOR:
 * 1. ZERO INPUT LATENCY:
 *    Center dot tracks hardware pointer 1:1 with zero delay.
 * 2. 144Hz / HIGH-REFRESH-RATE INDEPENDENCE:
 *    Outer ring uses frame-rate-independent exponential damping
 *    `ring += (target - ring) * (1 - Math.exp(-lambda * dt))`.
 *    Consistent, fluid trailing physics across 60Hz, 90Hz, 120Hz, 144Hz, and 240Hz.
 * 3. HARDWARE COMPOSITOR ACCELERATION:
 *    Transforms use `translate3d` with sub-pixel precision. Color, glow, and shadow transitions
 *    run on the GPU compositor via CSS classes without JavaScript string thrashing.
 * 4. EVENT DEDUPLICATION & PASSIVE LISTENERS:
 *    Uses modern Pointer Events (`pointermove`, `pointerdown`, `pointerup`) with `{ passive: true }`.
 *    No duplicate `mousemove` or `mousedown` double-firing.
 * 5. FAST-PATH DOM HOVER DETECTION:
 *    Fast-paths interactive tags (`A`, `BUTTON`, `INPUT`, `SELECT`, `LABEL`) and caches parent hits.
 * 6. ZERO-CPU IDLE PAUSE:
 *    Automatically pauses the animation loop when cursor is stationary at rest.
 * 7. ZERO DESIGN CHANGE:
 *    Preserves 100% of the original dual-contour styling, colors, glow, hover size (1.45),
 *    click compression, crosshair mode, and iframe bridging for the 3D studio.
 */

import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      document.documentElement.classList.remove('cursor-ready');
      return;
    }

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

    // ── Step 3: Coordinates, Physics & State ──────────────────────────────────
    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;

    let targetRingScale = 1.0;
    let currentRingScale = 1.0;
    let targetDotScale = 1.0;
    let currentDotScale = 1.0;

    let isHovering = false;
    let isCrosshair = false;
    let isMouseDown = false;
    let isCursorVisible = false;

    let rafId: number | null = null;
    let lastTime = 0;
    let isLoopRunning = false;

    // Physics parameters:
    // Exponential damping rate for outer ring (higher = snappier, lower = more floaty)
    // 28.0 gives instantaneous response with organic smooth follow-through
    const RING_DECAY = 28.0;
    const SCALE_DECAY = 26.0;

    const showCursor = () => {
      if (!isCursorVisible) {
        isCursorVisible = true;
        document.documentElement.classList.add('cursor-ready');
        document.documentElement.classList.remove('cursor-hidden');
        cursor.style.opacity = '1';
        dot.style.opacity = '1';
        startLoop();
      }
    };

    const hideCursor = () => {
      if (isCursorVisible) {
        isCursorVisible = false;
        document.documentElement.classList.add('cursor-hidden');
        cursor.style.opacity = '0';
        dot.style.opacity = '0';
      }
    };

    // ── Step 4: Mode & Scale State Management ────────────────────────────────
    const updateTargetScales = () => {
      if (isMouseDown) {
        targetRingScale = isHovering ? 1.25 : 0.85;
      } else if (isCrosshair) {
        targetRingScale = 0.8;
      } else if (isHovering) {
        targetRingScale = 1.45;
      } else {
        targetRingScale = 1.0;
      }

      // Hide center dot when hovering interactive buttons to avoid visual obstruction
      targetDotScale = isHovering ? 0 : 1;
      startLoop();
    };

    const setHoverMode = (active: boolean) => {
      if (active === isHovering) return;
      isHovering = active;
      if (active) {
        cursor.classList.add('cursor-state-hover');
        cursor.classList.remove('cursor-state-crosshair');
        dot.classList.remove('cursor-state-crosshair');
      } else {
        cursor.classList.remove('cursor-state-hover');
      }
      updateTargetScales();
    };

    const setCrosshairMode = (active: boolean) => {
      if (active === isCrosshair) return;
      isCrosshair = active;
      if (active) {
        isHovering = false;
        cursor.classList.remove('cursor-state-hover');
        cursor.classList.add('cursor-state-crosshair');
        dot.classList.add('cursor-state-crosshair');
      } else {
        cursor.classList.remove('cursor-state-crosshair');
        dot.classList.remove('cursor-state-crosshair');
      }
      updateTargetScales();
    };

    // ── Step 5: Animation Frame Loop (Zero-Latency Dot + Exponential Ring Damping)
    const renderFrame = (now: number) => {
      if (!isCursorVisible) {
        isLoopRunning = false;
        rafId = null;
        return;
      }

      if (lastTime === 0) lastTime = now;
      // Clamp dt to 0.05s (50ms) to prevent teleportation after tab suspension/resume
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // 1. Center dot: 1:1 hardware pointer synchronization with immediate transform
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%) scale(${currentDotScale})`;

      // 2. Outer ring: Frame-rate independent exponential decay
      const ringFactor = 1 - Math.exp(-RING_DECAY * dt);
      ringX += (targetX - ringX) * ringFactor;
      ringY += (targetY - ringY) * ringFactor;

      const scaleFactor = 1 - Math.exp(-SCALE_DECAY * dt);
      currentRingScale += (targetRingScale - currentRingScale) * scaleFactor;
      currentDotScale += (targetDotScale - currentDotScale) * scaleFactor;

      // 3. Apply compositor transform
      cursor.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0) translate(-50%, -50%) scale(${currentRingScale.toFixed(4)})`;

      // 4. Idle Check: If ring is at rest within 0.05px and scales converged, sleep loop
      const distSq = (targetX - ringX) ** 2 + (targetY - ringY) ** 2;
      const scaleDiff = Math.abs(targetRingScale - currentRingScale) + Math.abs(targetDotScale - currentDotScale);

      if (distSq < 0.0025 && scaleDiff < 0.001) {
        // Snap to exact target coordinates to prevent micro-drift
        ringX = targetX;
        ringY = targetY;
        currentRingScale = targetRingScale;
        currentDotScale = targetDotScale;
        cursor.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${currentRingScale})`;
        dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%) scale(${currentDotScale})`;

        isLoopRunning = false;
        rafId = null;
        return;
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    const startLoop = () => {
      if (!isLoopRunning && isCursorVisible) {
        isLoopRunning = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    // ── Step 6: High-Frequency Pointer Handler ───────────────────────────────
    const setCoords = (clientX: number, clientY: number) => {
      targetX = clientX;
      targetY = clientY;

      // If this is the very first motion, snap outer ring directly to eliminate spawn travel
      if (ringX < -50) {
        ringX = clientX;
        ringY = clientY;
      }

      showCursor();
      startLoop();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        hideCursor();
        return;
      }

      if (window.innerWidth < 768) {
        hideCursor();
        document.documentElement.classList.remove('cursor-ready');
        return;
      }

      setCoords(e.clientX, e.clientY);
    };

    const onCustomCoords = (e: Event) => {
      if (window.innerWidth < 768) return;
      const customEv = e as CustomEvent<{ clientX: number; clientY: number }>;
      if (typeof customEv.detail?.clientX === 'number' && typeof customEv.detail?.clientY === 'number') {
        setCoords(customEv.detail.clientX, customEv.detail.clientY);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        hideCursor();
        return;
      }
      if (window.innerWidth >= 768) {
        isMouseDown = true;
        updateTargetScales();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (window.innerWidth >= 768) {
        isMouseDown = false;
        updateTargetScales();
      }
    };

    // ── Step 7: Fast-Path Interactive Element Detection ──────────────────────
    let lastHoverTarget: HTMLElement | null = null;
    let lastHoverResult = false;
    let lastCrosshairResult = false;

    const INTERACTIVE_SELECTOR =
      'a, button, select, [role="button"], .cursor-pointer, [data-cursor-hover], input[type="button"], input[type="submit"], input[type="radio"], input[type="checkbox"], input[type="range"], input[type="color"], label[for], .clickable, .side-btn, .nav-tab-btn, .header-btn, .btn-card-subtle, .quick-action-pill, .color-swatch-btn, .catalog-card, .layer-item, .toggle-row, .camera-preset-btn, .uv-tab-btn, .uv-tool-btn, .btn-add-to-cart, .interactive';

    const onMouseOver = (e: MouseEvent) => {
      if (window.innerWidth < 768) return;
      const target = e.target as HTMLElement;
      if (!target || !target.closest) return;

      // 1. Text Inputs / Textareas: hide custom cursor so native caret is crisp & accessible
      const tag = target.tagName;
      if (
        (tag === 'INPUT' && !['button', 'submit', 'radio', 'checkbox', 'range', 'color'].includes((target as HTMLInputElement).type)) ||
        tag === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        hideCursor();
        return;
      }

      showCursor();

      // Check cache to avoid running heavy `.closest()` during continuous movement inside the same node
      if (target === lastHoverTarget) {
        if (lastCrosshairResult) {
          setCrosshairMode(true);
        } else {
          setHoverMode(lastHoverResult);
        }
        return;
      }
      lastHoverTarget = target;

      // 2. Precision Crosshair Targets
      const isTargetCrosshair =
        target.classList.contains('cursor-crosshair') ||
        target.getAttribute('data-cursor') === 'crosshair' ||
        !!target.closest('.cursor-crosshair, [data-cursor="crosshair"], .uv-canvas');

      lastCrosshairResult = isTargetCrosshair;
      if (isTargetCrosshair) {
        setCrosshairMode(true);
        return;
      } else if (isCrosshair) {
        setCrosshairMode(false);
      }

      // 3. Fast-path check for direct interactive tags
      if (
        tag === 'A' ||
        tag === 'BUTTON' ||
        tag === 'SELECT' ||
        tag === 'LABEL' ||
        target.getAttribute('role') === 'button' ||
        target.hasAttribute('data-cursor-hover') ||
        target.classList.contains('cursor-pointer') ||
        target.classList.contains('clickable')
      ) {
        lastHoverResult = true;
        setHoverMode(true);
        return;
      }

      // Full hierarchical ancestor check
      const isInteractive = !!target.closest(INTERACTIVE_SELECTOR);
      lastHoverResult = isInteractive;
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

    // ── Step 8: Same-Origin Iframe Bridge (for 3D Mockup Studio) ──────────────
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

          const onIframePointerMove = (e: PointerEvent) => {
            if (e.pointerType === 'touch') {
              hideCursor();
              return;
            }
            if (window.innerWidth < 768) return;

            const rect = iframe.getBoundingClientRect();
            setCoords(e.clientX + rect.left, e.clientY + rect.top);
          };

          const onIframePointerDown = (e: PointerEvent) => {
            if (e.pointerType === 'touch') return;
            onPointerDown(e);
          };

          const onIframePointerUp = (e: PointerEvent) => {
            if (e.pointerType === 'touch') return;
            onPointerUp(e);
          };

          const onIframeMouseOver = (e: MouseEvent) => {
            if (window.innerWidth < 768) return;
            onMouseOver(e);
          };

          win.addEventListener('pointermove', onIframePointerMove, { passive: true });
          win.addEventListener('pointerdown', onIframePointerDown, { passive: true });
          win.addEventListener('pointerup', onIframePointerUp, { passive: true });
          win.addEventListener('mouseover', onIframeMouseOver, { passive: true });

          iframeCleanups.push(() => {
            try {
              win.removeEventListener('pointermove', onIframePointerMove);
              win.removeEventListener('pointerdown', onIframePointerDown);
              win.removeEventListener('pointerup', onIframePointerUp);
              win.removeEventListener('mouseover', onIframeMouseOver);
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
      // Attach single, deduplicated Pointer Event listeners
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('custom-cursor-coords', onCustomCoords);
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

      // Connect existing iframes
      document.querySelectorAll('iframe').forEach(bridgeIframe);

      // Scoped observer for iframe mounting
      const handleIframeMount = () => {
        document.querySelectorAll('iframe').forEach(bridgeIframe);
      };
      window.addEventListener('clothing-mockup-mounted', handleIframeMount);
      iframeCleanups.push(() => window.removeEventListener('clothing-mockup-mounted', handleIframeMount));
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
      window.removeEventListener('custom-cursor-coords', onCustomCoords);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('custom-cursor-hover', onCustomHover);
      window.removeEventListener('blur', hideCursor);
      window.removeEventListener('focus', showCursor);
      document.removeEventListener('mouseleave', hideCursor);
      document.removeEventListener('mouseenter', showCursor);
      if (rafId !== null) cancelAnimationFrame(rafId);
      iframeCleanups.forEach((fn) => fn());
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Outer ring cursor (hidden on mobile) */}
      <div
        ref={cursorRef}
        className="fregoro-cursor-ring hidden md:block"
        aria-hidden="true"
      />
      {/* Center dot cursor (hidden on mobile) */}
      <div
        ref={dotRef}
        className="fregoro-cursor-dot hidden md:block"
        aria-hidden="true"
      />
    </>,
    document.body
  );
}
