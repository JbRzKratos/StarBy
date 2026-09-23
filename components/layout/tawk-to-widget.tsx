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
  isChatMaximized?: () => boolean;
  maximize?: () => void;
  minimize?: () => void;
  toggle?: () => void;
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
    pathname?.startsWith('/admin'),
  );

  const isExcludedRef = useRef(isExcluded);
  isExcludedRef.current = isExcluded;

  const syncWidgetVisibility = () => {
    if (typeof window === 'undefined') return;
    const api = window.Tawk_API;
    if (!api) return;

    try {
      if (isExcludedRef.current) {
        api.hideWidget?.();
      } else {
        api.showWidget?.();
      }
    } catch {
      // Ignore if Tawk_API is not fully mounted yet
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
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.Tawk_API = window.Tawk_API || {};
            window.Tawk_LoadStart = new Date();
          `,
        }}
      />
      <Script
        id="tawk-to-script"
        strategy="afterInteractive"
        src={`https://embed.tawk.to/${propertyId}/${widgetId}`}
        crossOrigin="anonymous"
        onLoad={syncWidgetVisibility}
      />
    </>
  );
}
