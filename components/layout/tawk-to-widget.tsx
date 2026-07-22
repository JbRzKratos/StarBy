'use client';

import Script from 'next/script';

export function TawkToWidget() {
  // Replace these with your actual Tawk.to property and widget IDs
  const propertyId = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID || 'REPLACE_ME';
  const widgetId = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID || 'default';

  if (propertyId === 'REPLACE_ME') {
    return null; // Don't render until configured
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
