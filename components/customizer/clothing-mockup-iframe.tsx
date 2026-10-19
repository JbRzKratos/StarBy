'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore, type CartItem } from '@/lib/stores/cart-store';
import { createClient } from '@/lib/supabase/client';
import { isSuperAdminEmail } from '@/lib/auth-constants';

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

export interface ClothingMockupIframeProps {
  productId?: string;
  productName?: string;
  basePrice?: number;
  isPlain?: boolean;
}

export function ClothingMockupIframe({
  productId,
  productName,
  basePrice,
  isPlain,
}: ClothingMockupIframeProps = {}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isDesignerAuthorized, setIsDesignerAuthorized] = useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const searchParams = useSearchParams();

  // Verify whether the logged in user is authorized for designer mode (gokul30sep@gmail.com / superadmin)
  useEffect(() => {
    let isMounted = true;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!isMounted) return;
        const email = data.user?.email;
        const authorized = Boolean(
          email && (email.toLowerCase() === 'gokul30sep@gmail.com' || isSuperAdminEmail(email))
        );
        setIsDesignerAuthorized(authorized);
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { type: 'STARBY_DESIGNER_AUTH', authorized, email: authorized ? email : null },
            '*'
          );
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        const email = session?.user?.email;
        const authorized = Boolean(
          email && (email.toLowerCase() === 'gokul30sep@gmail.com' || isSuperAdminEmail(email))
        );
        setIsDesignerAuthorized(authorized);
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { type: 'STARBY_DESIGNER_AUTH', authorized, email: authorized ? email : null },
            '*'
          );
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    } catch (err) {
      console.warn('[ClothingMockupIframe] Auth verification error:', err);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch live server-persisted placements for this design from DB on mount and sync to iframe
  useEffect(() => {
    const designId = searchParams?.get('design') || searchParams?.get('designId');
    const garmentId = searchParams?.get('garment') || searchParams?.get('garmentId');
    if (!designId) return;

    fetch(`/api/clothing-designs/save-placement?designId=${encodeURIComponent(designId)}&_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success || !data.placements) return;
        try {
          const STORAGE_KEY = 'fregoro_curated_placements';
          const raw = window.localStorage.getItem(STORAGE_KEY) || '{}';
          const all = JSON.parse(raw);
          const merged = { ...all, ...data.placements };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged, null, 2));

          // Post to iframe to guarantee real-time reflection
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              {
                type: 'STARBY_SYNC_PLACEMENTS',
                placements: data.placements,
                designId,
                garmentId,
              },
              '*'
            );
          }
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});
  }, [searchParams]);

  const iframeSrc = React.useMemo(() => {
    const sp = new URLSearchParams(searchParams?.toString() || '');
    if (productId && !sp.has('productId')) sp.set('productId', productId);
    if (productName && !sp.has('productName')) sp.set('productName', productName);
    if (basePrice !== undefined && !sp.has('price')) sp.set('price', basePrice.toString());
    if (isPlain && !sp.has('plain')) sp.set('plain', 'true');

    if (!isDesignerAuthorized) {
      // Strip any designer query parameters if user is not authorized
      sp.delete('designer');
      sp.delete('mode');
      sp.delete('admin');
      sp.delete('designerAuth');
    } else {
      sp.set('designerAuth', '1');
    }
    const qs = sp.toString();
    return qs ? `/tools/clothing-mockup/index.html?${qs}` : '/tools/clothing-mockup/index.html';
  }, [searchParams, isDesignerAuthorized, productId, productName, basePrice, isPlain]);

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

      if (e.data && (e.data.type === 'STARBY_PLACEMENT_SAVED' || e.data.type === 'STARBY_ALL_PLACEMENTS_SAVED')) {
        try {
          const { designId, garmentId, target, artId, placement, layers } = e.data;
          const STORAGE_KEY = 'fregoro_curated_placements';
          const raw = window.localStorage.getItem(STORAGE_KEY) || '{}';
          const all = JSON.parse(raw);
          const garmentKey = (garmentId || 'regular-t-shirt').toLowerCase();

          if (Array.isArray(layers) && layers.length > 0) {
            layers.forEach((layer: Record<string, unknown>) => {
              const layerTarget = typeof layer.placementTarget === 'string' ? layer.placementTarget : undefined;
              const layerRegion = typeof layer.regionId === 'string' ? layer.regionId : undefined;
              const layerName = typeof layer.name === 'string' ? layer.name : '';
              const layerId = typeof layer.id === 'string' ? layer.id : '';

              const tgt =
                layerTarget ||
                (layerRegion === 'back' || layerName.toLowerCase().includes('back')
                  ? 'back-center'
                  : layerName.toLowerCase().includes('sleeve')
                  ? 'left-sleeve'
                  : 'front-center');
              const artMatch = layerId.match(/art-\d+/i);
              const aId = artMatch ? artMatch[0].toLowerCase() : undefined;
              const isHidden = layer.opacity === 0 || layer.hidden === true;
              const pl = {
                u: typeof layer.u === 'number' ? layer.u : 0.25,
                v: typeof layer.v === 'number' ? layer.v : 0.63,
                uvWidth: typeof layer.uvWidth === 'number' ? layer.uvWidth : 0.26,
                scale: typeof layer.scale === 'number' ? layer.scale : 0.74,
                rotation: typeof layer.rotation === 'number' ? layer.rotation : 0,
                regionId: layerRegion === 'back' || tgt.includes('back') ? 'back' : 'front',
                placementTarget: tgt,
                scalePreset: typeof layer.scalePreset === 'string' ? layer.scalePreset : 'standard',
                hidden: isHidden,
                removed: false,
                opacity: typeof layer.opacity === 'number' ? layer.opacity : (isHidden ? 0 : 1.0),
              };
              if (!isHidden) {
                all[`${designId}__${garmentKey}__${tgt}`] = pl;
                all[`${designId}__${garmentKey}__${pl.regionId}`] = pl;
              }
              if (aId) all[`${designId}__${garmentKey}__${aId}`] = pl;
            });
          } else if (placement) {
            if (target) {
              all[`${designId}__${garmentKey}__${target}`] = placement;
            }
            if (artId) {
              all[`${designId}__${garmentKey}__${String(artId).toLowerCase()}`] = placement;
            }
          }

          if (Array.isArray(e.data.removedArtIds)) {
            e.data.removedArtIds.forEach((rId: string) => {
              const rKey = `${designId}__${garmentKey}__${rId.toLowerCase()}`;
              all[rKey] = {
                ...(all[rKey] || {}),
                removed: true,
                hidden: true,
                opacity: 0,
              };
            });
          }

          if (Array.isArray(e.data.hiddenArtIds)) {
            e.data.hiddenArtIds.forEach((hId: string) => {
              const hKey = `${designId}__${garmentKey}__${hId.toLowerCase()}`;
              all[hKey] = {
                ...(all[hKey] || {}),
                hidden: true,
                removed: false,
                opacity: 0,
              };
            });
          }
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all, null, 2));
          window.dispatchEvent(new CustomEvent('starby:placement-saved', { detail: e.data }));

          // Forward to server save-placement API with first-party session token to guarantee DB persistence
          try {
            const supabase = createClient();
            supabase.auth.getSession().then(({ data: { session } }) => {
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
              }
              fetch('/api/clothing-designs/save-placement', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                  designId: e.data.designId,
                  garmentId: e.data.garmentId,
                  layers: e.data.layers,
                  placement: e.data.placement,
                  target: e.data.target,
                  artId: e.data.artId,
                  removedArtIds: e.data.removedArtIds,
                  hiddenArtIds: e.data.hiddenArtIds,
                }),
              }).catch((err) => {
                console.warn('[ClothingMockupIframe] Failed to forward placement to server:', err);
              });
            });
          } catch {
            /* ignore */
          }
        } catch {
          /* ignore */
        }
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
                  resolvedPrice = 600;
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
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 8000);

              const uploadRes = await fetch('/api/customizer/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  frontSnapshot: payload.frontPreviewUrl,
                  backSnapshot: payload.backPreviewUrl,
                  uploadedArtworks: payload.uploadedArtworks || [],
                  garmentId: payload.garmentId || 'tee',
                }),
                signal: controller.signal,
              });
              clearTimeout(timeoutId);

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
              console.warn('[ClothingMockupIframe] Upload error or timeout (using fallback):', uploadErr);
            }

            // Ensure safe image for bag display: fallback to static mockup if string is oversized
            const candidateImage =
              uploadResult.frontPreviewUrl ||
              uploadResult.previewFileUrl ||
              '/images/mockups/tee-black-front.webp';
            const safeImage =
              typeof candidateImage === 'string' &&
              candidateImage.startsWith('data:') &&
              candidateImage.length > 80000
                ? '/images/mockups/tee-black-front.webp'
                : candidateImage;

            const is2d = payload.mode === '2d';
            const variantPrefix = is2d ? 'mockup-2d' : 'mockup-3d';
            const defaultPlacementTitle = is2d ? 'Custom 2D Studio Mockup' : 'Custom 3D Studio Mockup';
            const defaultInstructions = is2d ? 'Custom 2D Studio Placement' : 'Custom 3D Studio Placement';

            const customArtworkCount =
              typeof payload.customArtworkCount === 'number'
                ? payload.customArtworkCount
                : (uploadResult.uploadedArtworks?.length || 0);
            const customPrintFee =
              typeof payload.customPrintFee === 'number'
                ? payload.customPrintFee
                : customArtworkCount * 49;
            const itemBasePrice =
              typeof payload.basePrice === 'number'
                ? payload.basePrice
                : (typeof resolvedPrice === 'number' ? resolvedPrice - customPrintFee : 600);

            const isCustomUpload = !payload.designId || Boolean(payload.plain);
            const itemDisplayName = isCustomUpload
              ? `Custom ${payload.garmentName || 'Garment'}${customArtworkCount > 0 ? ` (${customArtworkCount} Print${customArtworkCount === 1 ? '' : 's'})` : ''}`
              : (payload.designName || `Custom ${payload.garmentName || 'Garment'}`);

            const cartItem: CartItem = {
              productId: payload.productId || payload.designId || 'clothing-mockup',
              variantId: `${variantPrefix}-${payload.garmentId || 'tee'}-${String(payload.garmentColor || 'white').replace(/[^a-z0-9]/gi, '')}-${payload.size || 'L'}`,
              name: itemDisplayName,
              variant: `${payload.garmentColor || 'Custom'} / ${payload.size || 'L'}`,
              quantity: payload.quantity || 1,
              price: typeof resolvedPrice === 'number' && resolvedPrice >= 0 ? resolvedPrice : 600,
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
                customArtworkCount,
                customPrintFee,
                basePrice: itemBasePrice,
                isPlain: isCustomUpload,
                is3dMockup: !is2d,
                is2dMockup: is2d,
                mode: payload.mode || '3d',
              },
            };

            try {
              useCartStore.getState().addItem(cartItem);
            } catch (storageErr) {
              console.warn('[ClothingMockupIframe] addItem caught storage quota error, sanitizing item and retrying...', storageErr);
              // Clean any data URLs from cartItem to avoid localStorage quota issues
              const cleanItem: CartItem = {
                ...cartItem,
                image: cartItem.image && cartItem.image.startsWith('data:')
                  ? '/images/mockups/tee-black-front.png'
                  : cartItem.image,
                customization: cartItem.customization ? {
                  ...cartItem.customization,
                  frontPreviewFileUrl: cartItem.customization.frontPreviewFileUrl?.startsWith('data:') ? null : cartItem.customization.frontPreviewFileUrl,
                  backPreviewFileUrl: cartItem.customization.backPreviewFileUrl?.startsWith('data:') ? null : cartItem.customization.backPreviewFileUrl,
                  previewFileUrl: cartItem.customization.previewFileUrl?.startsWith('data:') ? null : cartItem.customization.previewFileUrl,
                  designFileUrl: cartItem.customization.designFileUrl?.startsWith('data:') ? null : cartItem.customization.designFileUrl,
                  frontDesignFileUrl: cartItem.customization.frontDesignFileUrl?.startsWith('data:') ? null : cartItem.customization.frontDesignFileUrl,
                  backDesignFileUrl: cartItem.customization.backDesignFileUrl?.startsWith('data:') ? null : cartItem.customization.backDesignFileUrl,
                  uploadedArtworks: Array.isArray(cartItem.customization.uploadedArtworks)
                    ? (cartItem.customization.uploadedArtworks as Array<{ name?: string; url?: string; side?: string }>).map((a) => ({
                        name: a.name || 'Artwork',
                        url: a.url?.startsWith('data:') ? '' : a.url,
                        side: a.side || 'front',
                      }))
                    : [],
                } : null,
              };
              useCartStore.getState().addItem(cleanItem);
            }
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

      // Send designer authorization status to the iframe
      if (win) {
        win.postMessage(
          {
            type: 'STARBY_DESIGNER_AUTH',
            authorized: isDesignerAuthorized,
          },
          '*'
        );
      }

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
