'use client';

import React, { useState, useEffect } from 'react';

/**
 * ClothingMockupIframe
 *
 * Bridge component that embeds the self-contained Clothing-Mockup-Feature
 * (2D canvas editor + 3D garment studio) as a same-origin iframe.
 *
 * Layout strategy:
 *  - The host Navigation is ~60 px tall (py-3.5 + icon height).
 *  - We set height = 100dvh - 60px so the studio fills the remaining
 *    viewport without scroll and without the host footer overlapping.
 *  - We add a body class "mockup-studio-active" while mounted so globals.css
 *    can hide the floating widgets and footer.
 */

interface WindowWithTawk {
  Tawk_API?: {
    hideWidget?: () => void;
    minimize?: () => void;
    showWidget?: () => void;
  };
}

export function ClothingMockupIframe() {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Apply body class while the studio is mounted and aggressively suppress
  // the Tawk.to widget, WhatsApp button, and other floating UI in both 2D and 3D.
  useEffect(() => {
    document.body.classList.add('mockup-studio-active');

    const suppressTawk = () => {
      const win = window as unknown as WindowWithTawk;
      try {
        win.Tawk_API?.hideWidget?.();
        win.Tawk_API?.minimize?.();
      } catch {
        /* ignore */
      }

      // Proactively hide any Tawk DOM nodes (iframes, containers, bubbles)
      const selectors = [
        'iframe[src*="tawk.to"]',
        'iframe[title*="chat" i]',
        'iframe[title*="tawk" i]',
        '[id*="tawk" i]',
        '[class*="tawk" i]',
        '.widget-visible',
        '#tawk-default-container',
        '#tawk-bubble-container',
        '.tawk-min-container',
        '.tawk-button',
        '.tawk-badge',
      ];

      try {
        document.querySelectorAll(selectors.join(',')).forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.setProperty('display', 'none', 'important');
          htmlEl.style.setProperty('visibility', 'hidden', 'important');
          htmlEl.style.setProperty('opacity', '0', 'important');
          htmlEl.style.setProperty('pointer-events', 'none', 'important');
          htmlEl.style.setProperty('position', 'fixed', 'important');
          htmlEl.style.setProperty('bottom', '-99999px', 'important');
          htmlEl.style.setProperty('right', '-99999px', 'important');
          htmlEl.style.setProperty('z-index', '-99999', 'important');

          // If it's an iframe, also hide its immediate parent container if fixed/absolute
          if (
            htmlEl.tagName === 'IFRAME' &&
            htmlEl.parentElement &&
            htmlEl.parentElement !== document.body
          ) {
            const parent = htmlEl.parentElement;
            parent.style.setProperty('display', 'none', 'important');
            parent.style.setProperty('visibility', 'hidden', 'important');
            parent.style.setProperty('opacity', '0', 'important');
            parent.style.setProperty('pointer-events', 'none', 'important');
            parent.style.setProperty('position', 'fixed', 'important');
            parent.style.setProperty('bottom', '-99999px', 'important');
          }
        });
      } catch {
        /* ignore */
      }
    };

    suppressTawk();

    // Guard against asynchronous script load or incoming notification unhide events
    const interval = setInterval(suppressTawk, 250);

    const observer = new MutationObserver(() => {
      suppressTawk();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
      document.body.classList.remove('mockup-studio-active');
      const win = window as unknown as WindowWithTawk;
      try {
        win.Tawk_API?.showWidget?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  // PostMessage coordinate listener fallback
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CUSTOM_CURSOR_MOVE') {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const rect = iframe.getBoundingClientRect();
        window.dispatchEvent(
          new MouseEvent('mousemove', {
            clientX: e.data.clientX + rect.left,
            clientY: e.data.clientY + rect.top,
            bubbles: true,
          }),
        );
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
    try {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;

      // 1. Sync cursor-ready class from parent to iframe document
      if (doc) {
        if (document.documentElement.classList.contains('cursor-ready')) {
          doc.documentElement.classList.add('cursor-ready');
        }

        const observer = new MutationObserver(() => {
          if (document.documentElement.classList.contains('cursor-ready')) {
            doc.documentElement.classList.add('cursor-ready');
          } else {
            doc.documentElement.classList.remove('cursor-ready');
          }
        });
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class'],
        });
      }

      // 2. Direct same-origin event forwarding for buttery smooth 60fps tracking
      if (win) {
        win.addEventListener(
          'mousemove',
          (e: MouseEvent) => {
            const rect = iframe.getBoundingClientRect();
            window.dispatchEvent(
              new MouseEvent('mousemove', {
                clientX: e.clientX + rect.left,
                clientY: e.clientY + rect.top,
                bubbles: true,
              }),
            );

            const target = e.target as HTMLElement | null;
            const isInteractive = !!target?.closest(
              'button, a, input, select, textarea, [role="button"], .interactive, .nav-tab-btn, .side-btn, .header-btn, .btn-card-subtle',
            );
            window.dispatchEvent(
              new CustomEvent('custom-cursor-hover', {
                detail: { isInteractive },
              }),
            );
          },
          { passive: true },
        );

        win.addEventListener('mousedown', () => {
          window.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        });

        win.addEventListener('mouseup', () => {
          window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        });
      }
    } catch (err) {
      console.warn('[ClothingMockupIframe] Cursor bridge notice:', err);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#0c0e12]">
      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {isLoading && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[#0c0e12]"
          aria-live="polite"
          aria-label="Loading Mockup Studio"
        >
          {/* Spinner */}
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[#F5F1EA]/10" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[#3B5EFF] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>

          {/* Label */}
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-semibold tracking-wider text-[#F5F1EA]/80 uppercase font-mono">
              Loading Mockup Studio
            </p>
            <p className="text-xs text-[#F5F1EA]/30 font-mono">Initialising 3D engine…</p>
          </div>

          {/* Subtle pulse bar */}
          <div className="w-48 h-1 rounded-full bg-[#1f2530] overflow-hidden">
            <div className="h-full bg-[#3B5EFF]/60 rounded-full animate-pulse w-3/5" />
          </div>
        </div>
      )}

      {/* ── The embedded studio ───────────────────────────────────────────── */}
      <iframe
        ref={iframeRef}
        src="/tools/clothing-mockup/index.html"
        className="w-full h-full border-none block"
        allow="fullscreen"
        title="Fregoro Mockup Studio — Design your garment"
        onLoad={handleIframeLoad}
      />
    </div>
  );
}
