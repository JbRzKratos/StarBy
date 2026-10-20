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
          email && isSuperAdminEmail(email)
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
          email && isSuperAdminEmail(email)
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
      credentials: 'same-origin',
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success || !data.placements) return;
        try {
          // Keep both placement stores in sync. The studio reads the v2 key and
          // gives it priority, so writing only the legacy key lets stale local
          // calibrations silently override the server values we just fetched.
          const STORAGE_KEYS = ['fregoro_curated_placements', 'fregoro_curated_placements_v2'];
          for (const storageKey of STORAGE_KEYS) {
            const raw = window.localStorage.getItem(storageKey) || '{}';
            const all = JSON.parse(raw);
            const merged = { ...all, ...data.placements };
            window.localStorage.setItem(storageKey, JSON.stringify(merged, null, 2));
          }

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

  // Safety timeout and readyState watcher so the studio NEVER gets stuck behind the loading screen
  useEffect(() => {
    const checkReady = () => {
      try {
        const doc = iframeRef.current?.contentDocument;
        if (doc && (doc.readyState === 'complete' || doc.readyState === 'interactive')) {
          setIsLoading(false);
        }
      } catch {
        /* cross-origin fallback */
      }
    };
    checkReady();

    const interval = setInterval(checkReady, 250);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const iframeSrc = React.useMemo(() => {
    const sp = new URLSearchParams(searchParams?.toString() || '');
    if (productId && !sp.has('productId')) sp.set('productId', productId);
    if (productName && !sp.has('productName')) sp.set('productName', productName);
    if (basePrice !== undefined && !sp.has('price')) sp.set('price', basePrice.toString());
    if (isPlain && !sp.has('plain')) sp.set('plain', 'true');

    // Strip query auth params; authorization is communicated securely via postMessage
    sp.delete('designer');
    sp.delete('mode');
    sp.delete('admin');
    sp.delete('designerAuth');

    const qs = sp.toString();
    return qs ? `/tools/clothing-mockup/index.html?${qs}` : '/tools/clothing-mockup/index.html';
  }, [searchParams, productId, productName, basePrice, isPlain]);

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
      if (e.data && typeof e.data === 'object') {
        setIsLoading(false);
      }

      if (e.data && (e.data.type === 'STARBY_PLACEMENT_SAVED' || e.data.type === 'STARBY_ALL_PLACEMENTS_SAVED')) {
        try {
          const { designId, garmentId, target, artId, placement, layers } = e.data;
          const STORAGE_KEYS = ['fregoro_curated_placements', 'fregoro_curated_placements_v2'];
          const raw = window.localStorage.getItem(STORAGE_KEYS[0]) || '{}';
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
          // Keep the legacy and v2 stores identical. The studio gives v2
          // priority, so writing only the legacy key leaves stale coordinates
          // behind and makes a successful save look like it did nothing.
          for (const storageKey of STORAGE_KEYS) {
            window.localStorage.setItem(storageKey, JSON.stringify(all, null, 2));
          }
          window.dispatchEvent(new CustomEvent('starby:placement-saved', { detail: e.data }));

          // Forward to server save-placement API with first-party session token to guarantee DB persistence
          const sourceWindow = e.source as Window | null;
          const requestId =
            typeof e.data.requestId === 'string' ? e.data.requestId : undefined;
          const sendResult = (ok: boolean, error?: string | null) => {
            sourceWindow?.postMessage(
              {
                type: 'STARBY_PLACEMENT_SAVE_RESULT',
                requestId,
                designId: e.data.designId,
                garmentId: e.data.garmentId,
                ok,
                error: ok ? null : error,
              },
              '*'
            );
          };

          void (async () => {
            try {
              const supabase = createClient();
              let { data: { session } } = await supabase.auth.getSession();
              if (
                session?.expires_at &&
                session.expires_at * 1000 <= Date.now() + 60_000
              ) {
                try {
                  const { data: refreshed } = await supabase.auth.refreshSession();
                  session = refreshed.session ?? session;
                } catch {
                  // Keep the existing session; the API also accepts the
                  // first-party cookie session as a fallback.
                }
              }
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
              }

              // artworkLayers can contain large image URLs (including data
              // URLs for uploaded artwork). The save endpoint only needs the
              // placement fields, so keep the request small and avoid hitting
              // the platform's request-body limit.
              const layers = Array.isArray(e.data.layers)
                ? e.data.layers.map((layer: Record<string, unknown>) => ({
                    id: layer.id,
                    name: layer.name,
                    regionId: layer.regionId,
                    placementTarget: layer.placementTarget,
                    u: layer.u,
                    v: layer.v,
                    uvWidth: layer.uvWidth,
                    uvHeight: layer.uvHeight,
                    scale: layer.scale,
                    rotation: layer.rotation,
                    opacity: layer.opacity,
                    hidden: layer.hidden,
                    removed: layer.removed,
                    scalePreset: layer.scalePreset,
                  }))
                : undefined;

              const body = JSON.stringify({
                designId: e.data.designId,
                garmentId: e.data.garmentId,
                layers,
                placement: e.data.placement,
                target: e.data.target,
                artId: e.data.artId,
                removedArtIds: e.data.removedArtIds,
                hiddenArtIds: e.data.hiddenArtIds,
              });

              const postSave = () =>
                fetch('/api/clothing-designs/save-placement', {
                  method: 'POST',
                  headers,
                  credentials: 'include',
                  body,
                });

              let res = await postSave();
              // A 5xx/504 can happen if a cold serverless instance is slow to
              // accept the request. Saving is an idempotent upsert, so retry
              // once instead of surfacing a false failure to the designer.
              if (!res.ok && res.status >= 500) {
                await new Promise((resolve) => setTimeout(resolve, 600));
                res = await postSave();
              }

              const ok = res.ok;
              const payload = ok ? null : await res.json().catch(() => null);
              sendResult(ok, ok ? null : payload?.error || `Server returned ${res.status}`);
            } catch (err) {
              console.warn('[ClothingMockupIframe] Failed to forward placement to server:', err);
              sendResult(false, 'Network error while saving placement');
            }
          })();
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
                  const res = await fetch(`/api/products/prices?id=${encodeURIComponent(checkId)}`);
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

        // The parent CustomCursor owns the cursor bridge (coordinates, hover,
        // native-cursor suppression and cleanup). Disable the studio's legacy
        // mousemove forwarder so every pointer move is processed exactly once.
        (win as Window & { __parentCursorBridgeActive?: boolean }).__parentCursorBridgeActive =
          true;
      }
    } catch (err) {
      console.warn('[ClothingMockupIframe] Iframe bridge notice:', err);
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
