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

    // Signal cursor bridge that clothing mockup studio iframe is ready
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('clothing-mockup-mounted'));
    }

    return () => {
      document.body.classList.remove('mockup-studio-active');
      const win = window as unknown as WindowWithTawk;
      try {
        win.Tawk_API?.showWidget?.();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const [isAddingToCart, setIsAddingToCart] = useState(false);

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
          setIsAddingToCart(true);
          try {
            let resolvedPrice = payload.price;
            if (typeof resolvedPrice !== 'number' || resolvedPrice <= 0) {
              if (payload.designId === 'design-001') {
                resolvedPrice = 1;
              } else {
                try {
                  const checkId = payload.designId || 'clothing-mockup';
                  const res = await fetch(`/api/products/prices?id=${encodeURIComponent(checkId)}`, { cache: 'no-store' });
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
            }

            // 1. Upload high-res snapshots and original uploaded artworks to Cloudflare R2
            // This prevents massive base64 strings in localStorage which causes quota errors.
            let uploadResult = {
              frontPreviewUrl: payload.frontPreviewUrl || null,
              backPreviewUrl: payload.backPreviewUrl || null,
              previewFileUrl: payload.previewFileUrl || payload.frontPreviewUrl || null,
              frontDesignFileUrl: payload.frontDesignFileUrl || null,
              backDesignFileUrl: payload.backDesignFileUrl || null,
              designFileUrl: payload.designFileUrl || payload.frontDesignFileUrl || null,
              uploadedArtworks: payload.uploadedArtworks || [],
            };

            try {
              const uploadRes = await fetch('/api/customizer/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  frontSnapshot: payload.frontPreviewUrl,
                  backSnapshot: payload.backPreviewUrl,
                  uploadedArtworks: payload.uploadedArtworks || [],
                  garmentId: payload.garmentId || 'tee',
                }),
              });

              if (uploadRes.ok) {
                const uploadJson = await uploadRes.json();
                if (uploadJson.success) {
                  uploadResult = {
                    frontPreviewUrl: uploadJson.frontPreviewUrl || uploadResult.frontPreviewUrl,
                    backPreviewUrl: uploadJson.backPreviewUrl || uploadResult.backPreviewUrl,
                    previewFileUrl: uploadJson.previewFileUrl || uploadResult.previewFileUrl,
                    frontDesignFileUrl: uploadJson.frontDesignFileUrl || uploadResult.frontDesignFileUrl,
                    backDesignFileUrl: uploadJson.backDesignFileUrl || uploadResult.backDesignFileUrl,
                    designFileUrl: uploadJson.designFileUrl || uploadResult.designFileUrl,
                    uploadedArtworks: uploadJson.uploadedArtworks || uploadResult.uploadedArtworks,
                  };
                }
              }
            } catch (uploadErr) {
              console.warn('[ClothingMockupIframe] Upload error (using fallback):', uploadErr);
            }

            const safeImage =
              uploadResult.frontPreviewUrl ||
              uploadResult.previewFileUrl ||
              '/images/mockups/tee-black-front.png';

            const is2d = payload.mode === '2d';
            const variantPrefix = is2d ? 'mockup-2d' : 'mockup-3d';
            const defaultPlacementTitle = is2d ? 'Custom 2D Studio Mockup' : 'Custom 3D Studio Mockup';
            const defaultInstructions = is2d ? 'Custom 2D Studio Placement' : 'Custom 3D Studio Placement';

            const cartItem: CartItem = {
              productId: payload.designId || 'clothing-mockup',
              variantId: `${variantPrefix}-${payload.garmentId || 'tee'}-${String(payload.garmentColor || 'white').replace(/[^a-z0-9]/gi, '')}-${payload.size || 'L'}`,
              name: `Custom ${payload.garmentName || 'Garment'}`,
              variant: `${payload.garmentColor || 'Custom'} / ${payload.size || 'L'}`,
              quantity: payload.quantity || 1,
              price: typeof resolvedPrice === 'number' && resolvedPrice >= 0 ? resolvedPrice : 999,
              size: payload.size || 'L',
              image: safeImage,
              customization: {
                garment: payload.garmentName,
                color: payload.garmentColor,
                size: payload.size,
                frontDesignFileUrl: uploadResult.frontDesignFileUrl,
                backDesignFileUrl: uploadResult.backDesignFileUrl,
                designFileUrl: uploadResult.designFileUrl,
                frontPreviewFileUrl: uploadResult.frontPreviewUrl,
                backPreviewFileUrl: uploadResult.backPreviewUrl,
                previewFileUrl: uploadResult.previewFileUrl,
                printPosition: defaultPlacementTitle,
                printInstructions: payload.printInstructions || defaultInstructions,
                customerNotes: payload.customerNotes || payload.printInstructions || null,
                designId: payload.designId || null,
                uploadedArtworks: uploadResult.uploadedArtworks,
                is3dMockup: !is2d,
                is2dMockup: is2d,
                mode: payload.mode || '3d',
              },
            };

            useCartStore.getState().addItem(cartItem);
            useCartStore.getState().setCartOpen(true);
          } catch (err) {
            console.error('[ClothingMockupIframe] Failed to add item to bag:', err);
          } finally {
            setIsAddingToCart(false);
          }
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

      // 1. Sync cursor-ready class from parent to iframe document and suppress native cursor inside iframe
      if (doc) {
        doc.documentElement.classList.add('cursor-ready');
        doc.documentElement.classList.remove('cursor-hidden');

        // Inject strong cursor suppression style inside iframe
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
          const clientX = pendingMove.clientX + rect.left;
          const clientY = pendingMove.clientY + rect.top;

          window.dispatchEvent(
            new PointerEvent('pointermove', {
              clientX,
              clientY,
              bubbles: true,
              pointerType: 'mouse',
            }),
          );
          window.dispatchEvent(
            new CustomEvent('custom-cursor-coords', {
              detail: { clientX, clientY },
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
              'button, a, input, select, textarea, [role="button"], .interactive, .nav-tab-btn, .side-btn, .header-btn, .btn-card-subtle, .quick-action-pill, .color-swatch-btn, .catalog-card, .layer-item, .toggle-row, .camera-preset-btn, .uv-tab-btn, .uv-tool-btn, .btn-add-to-cart',
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

        win.addEventListener('pointerdown', (e: PointerEvent) => {
          if (e.pointerType === 'touch') return;
          window.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'mouse', bubbles: true }));
        });

        win.addEventListener('pointerup', (e: PointerEvent) => {
          if (e.pointerType === 'touch') return;
          window.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'mouse', bubbles: true }));
        });

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

      {/* ── Adding to bag overlay ─────────────────────────────────────────── */}
      {isAddingToCart && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0c0e12]/85 backdrop-blur-md"
          aria-live="assertive"
          aria-label="Saving design and adding to bag"
        >
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-[#3B5EFF]/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[#3B5EFF] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center px-4">
            <p className="text-sm font-bold tracking-wider text-[#F5F1EA] uppercase font-mono">
              Adding Custom 3D Garment to Bag
            </p>
            <p className="text-xs text-[#9E9EA7] font-mono">
              Rendering 3D proofs &amp; securing original artwork files…
            </p>
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
