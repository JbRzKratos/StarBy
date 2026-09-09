'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

export function TawkToWidget() {
  const pathname = usePathname();
  // Replace these with your actual Tawk.to property and widget IDs
  const propertyId = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID || 'REPLACE_ME';
  const widgetId = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID || 'default';

  const isExcluded = pathname?.startsWith('/magazine/editor') || pathname?.startsWith('/admin');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as {
      Tawk_API?: { hideWidget?: () => void; showWidget?: () => void };
    };

    if (isExcluded) {
      try {
        win.Tawk_API?.hideWidget?.();
      } catch {
        // ignore
      }
    } else {
      try {
        win.Tawk_API?.showWidget?.();
      } catch {
        // ignore
      }
    }
  }, [isExcluded, pathname]);

  if (propertyId === 'REPLACE_ME' || isExcluded) {
    return null; // Don't render until configured or on excluded editor routes
  }

  return (
    <Script
      id="tawk-to-script"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src='https://embed.tawk.to/${propertyId}/${widgetId}';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
          })();
        `,
      }}
    />
  );
}
