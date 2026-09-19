'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

export function TawkToWidget() {
  const pathname = usePathname();
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
    return null;
  }

  return (
    <>
      {/* Suppress the Tawk attention-grabber close button and constrain widget on mobile */}
      <style>{`
        /* Hide Tawk attention grabber overlay / close button */
        .tawk-min-container .tawk-button-circle,
        [id^="tawk-bubble"],
        .tawk-chat-panel .tawk-close-button,
        iframe[title="chat widget"] + div,
        .tawk-chat-panel > .tawk-attention-grabber,
        div[class*="tawk-"][class*="attention"],
        div[class*="tawk-"][class*="grabber"] {
          display: none !important;
        }
        /* Keep the main chat button tidy on mobile */
        @media (max-width: 768px) {
          #tawkchat-minified-wrapper,
          .tawk-min-container {
            bottom: 12px !important;
            right: 12px !important;
            max-width: 52px !important;
            max-height: 52px !important;
            overflow: hidden !important;
          }
        }
      `}</style>
      <Script
        id="tawk-to-script"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            var Tawk_API=Tawk_API||{};
            var Tawk_LoadStart=new Date();
            Tawk_API.onLoad = function(){
              // Suppress the attention grabber that shows a big X close icon
              try {
                Tawk_API.hideWidget && Tawk_API.hideWidget();
                Tawk_API.showWidget && Tawk_API.showWidget();
              } catch(e){}
            };
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
    </>
  );
}
