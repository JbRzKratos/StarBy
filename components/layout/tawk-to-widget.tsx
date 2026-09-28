'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

interface TawkApi {
  hideWidget?: () => void;
  showWidget?: () => void;
  setAttributes?: (
    attributes: Record<string, unknown>,
    callback?: (error?: unknown) => void,
  ) => void;
  onLoad?: () => void;
  onLoaded?: () => void;
  onChatMaximized?: () => void;
  onChatMinimized?: () => void;
  onChatHidden?: () => void;
  onChatStarted?: () => void;
  onStatusChange?: (status: string) => void;
  isChatMaximized?: () => boolean;
  maximize?: () => void;
  minimize?: () => void;
  toggle?: () => void;
  [key: string]: unknown;
}

declare global {
  interface Window {
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}

export function TawkToWidget() {
  const pathname = usePathname();
  const propertyId = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID || '';
  const widgetId = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID || 'default';

  const isExcluded = Boolean(
    pathname?.startsWith('/magazine/editor') ||
    pathname?.startsWith('/magazine/content-wizard') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/wall-studio') ||
    pathname?.startsWith('/customize') ||
    pathname?.includes('/customize') ||
    (typeof document !== 'undefined' && document.body?.classList?.contains('mockup-studio-active')),
  );

  const isExcludedRef = useRef(isExcluded);
  isExcludedRef.current = isExcluded;

  const syncWidgetVisibility = () => {
    if (typeof window === 'undefined') return;
    const api = window.Tawk_API;
    const shouldExclude =
      isExcludedRef.current ||
      Boolean(typeof document !== 'undefined' && document.body?.classList?.contains('mockup-studio-active'));

    if (api) {
      try {
        if (shouldExclude) {
          api.hideWidget?.();
          api.minimize?.();
        } else {
          api.showWidget?.();
        }
      } catch {
        // Ignore if Tawk_API is not fully mounted yet
      }
    }

    if (shouldExclude) {
      try {
        document.querySelectorAll('iframe[src*="tawk.to"], [id*="tawk"], [class*="tawk"]').forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.setProperty('display', 'none', 'important');
          htmlEl.style.setProperty('visibility', 'hidden', 'important');
        });
      } catch {
        /* ignore */
      }
    }
  };

  // Synchronize on route changes
  useEffect(() => {
    syncWidgetVisibility();
  }, [pathname, isExcluded]);

  // Hook into Tawk_API initialization lifecycle
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = window.Tawk_LoadStart || new Date();

    const prevOnLoad = window.Tawk_API.onLoad;
    window.Tawk_API.onLoad = function () {
      if (typeof prevOnLoad === 'function') {
        try {
          prevOnLoad();
        } catch {
          // Ignore
        }
      }
      syncWidgetVisibility();
    };

    const prevOnLoaded = window.Tawk_API.onLoaded;
    window.Tawk_API.onLoaded = function () {
      if (typeof prevOnLoaded === 'function') {
        try {
          prevOnLoaded();
        } catch {
          // Ignore
        }
      }
      syncWidgetVisibility();
    };

    const prevOnChatMaximized = window.Tawk_API.onChatMaximized;
    window.Tawk_API.onChatMaximized = function () {
      if (typeof prevOnChatMaximized === 'function') {
        try {
          prevOnChatMaximized();
        } catch {
          // Ignore
        }
      }
      if (
        isExcludedRef.current ||
        (typeof document !== 'undefined' && document.body?.classList?.contains('mockup-studio-active'))
      ) {
        window.Tawk_API?.minimize?.();
        window.Tawk_API?.hideWidget?.();
      }
    };

    // Initial sync
    syncWidgetVisibility();

    // Optionally set visitor attributes if logged in with Supabase
    import('@/lib/supabase/client')
      .then(({ createClient }) => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user?.email && window.Tawk_API?.setAttributes) {
            window.Tawk_API.setAttributes(
              {
                name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
                email: data.user.email,
              },
              () => {},
            );
          }
        });
      })
      .catch(() => {});
  }, []);

  if (!propertyId || propertyId === 'REPLACE_ME') {
    return null;
  }

  return (
    <>
      <Script
        id="tawk-to-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.Tawk_API = window.Tawk_API || {};
            window.Tawk_LoadStart = new Date();
          `,
        }}
      />
      <Script
        id="tawk-to-script"
        strategy="lazyOnload"
        src={`https://embed.tawk.to/${propertyId}/${widgetId}`}
        crossOrigin="anonymous"
        onLoad={syncWidgetVisibility}
      />
    </>
  );
}
