'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore, type CartItem } from '@/lib/stores/cart-store';

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
  const searchParams = useSearchParams();

  const iframeSrc = React.useMemo(() => {
    const qs = searchParams?.toString();
    return qs ? `/tools/clothing-mockup/index.html?${qs}` : '/tools/clothing-mockup/index.html';
  }, [searchParams]);

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

  // PostMessage coordinate listener and cart bridge
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

      if (e.data && e.data.type === 'ADD_CLOTHING_MOCKUP_TO_CART') {
        const payload = e.data.payload;
        if (!payload) return;

        const executeAdd = async () => {
          let resolvedPrice = payload.price;
          if (typeof resolvedPrice !== 'number' || resolvedPrice <= 0) {
            try {
              const res = await fetch('/api/products/prices?id=prod_test_tees', { cache: 'no-store' });
              if (res.ok) {
                const data = await res.json();
                if (data.success && typeof data.product?.basePrice === 'number') {
                  resolvedPrice = data.product.basePrice;
                }
              }
            } catch {
              resolvedPrice = 999;
            }
          }

          const cartItem: CartItem = {
            productId: 'prod_test_tees',
            variantId: `mockup-3d-${payload.garmentId || 'tee'}-${String(payload.garmentColor || 'white').replace(/[^a-z0-9]/gi, '')}`,
            name: `Custom ${payload.garmentName || 'T-Shirt'}`,
            variant: `${payload.garmentColor || 'Custom'} / ${payload.size || 'L'}`,
            quantity: payload.quantity || 1,
            price: resolvedPrice || 999,
            size: payload.size || 'L',
            image: payload.frontPreviewUrl || payload.previewFileUrl || undefined,
            customization: {
              garment: payload.garmentName,
              color: payload.garmentColor,
              size: payload.size,
              frontDesignFileUrl: payload.frontDesignFileUrl || null,
              backDesignFileUrl: payload.backDesignFileUrl || null,
              designFileUrl:
                payload.designFileUrl ||
                payload.frontDesignFileUrl ||
                payload.backDesignFileUrl ||
                null,
              frontPreviewFileUrl: payload.frontPreviewUrl || null,
              backPreviewFileUrl: payload.backPreviewUrl || null,
              previewFileUrl: payload.previewFileUrl || payload.frontPreviewUrl || null,
              printPosition: 'Custom 3D Studio Mockup',
              printInstructions: payload.printInstructions || 'Custom 3D Studio Placement',
              customerNotes: payload.customerNotes || payload.printInstructions || null,
              designId: payload.designId || null,
              uploadedArtworks: payload.uploadedArtworks || [],
              is3dMockup: true,
            },
          };

          useCartStore.getState().addItem(cartItem);
          useCartStore.getState().setCartOpen(true);
        };

        void executeAdd();
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail) {
        handleMessage({
          data: { type: 'ADD_CLOTHING_MOCKUP_TO_CART', payload: customEvt.detail },
        } as MessageEvent);
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('ADD_CLOTHING_MOCKUP_TO_CART', handleCustomEvent);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('ADD_CLOTHING_MOCKUP_TO_CART', handleCustomEvent);
    };
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
        (win as Window & { __parentCursorBridgeActive?: boolean }).__parentCursorBridgeActive =
          true;
        let pendingMove: MouseEvent | null = null;
        let rafId: number | null = null;
        let lastInteractive: boolean | null = null;

        const forwardMove = () => {
          rafId = null;
          if (!pendingMove || !iframeRef.current) return;
          const rect = iframeRef.current.getBoundingClientRect();
          window.dispatchEvent(
            new MouseEvent('mousemove', {
              clientX: pendingMove.clientX + rect.left,
              clientY: pendingMove.clientY + rect.top,
              bubbles: true,
            }),
          );
        };

        win.addEventListener(
          'mousemove',
          (e: MouseEvent) => {
            pendingMove = e;
            if (rafId === null) {
              rafId = requestAnimationFrame(forwardMove);
            }

            const target = e.target as HTMLElement | null;
            const isInteractive = !!target?.closest(
              'button, a, input, select, textarea, [role="button"], .interactive, .nav-tab-btn, .side-btn, .header-btn, .btn-card-subtle',
            );
            if (isInteractive !== lastInteractive) {
              lastInteractive = isInteractive;
              window.dispatchEvent(
                new CustomEvent('custom-cursor-hover', {
                  detail: { isInteractive },
                }),
              );
            }
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
        src={iframeSrc}
        className="w-full h-full border-none block"
        allow="fullscreen"
        title="Fregoro Mockup Studio — Design your garment"
        onLoad={handleIframeLoad}
      />
    </div>
  );
}
