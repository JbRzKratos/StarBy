import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { fontDisplay, fontMono } from '@/lib/fonts';
import { GsapProvider } from '@/components/animations/gsap-provider';
import { CustomCursor } from '@/components/layout/custom-cursor';
import { FloatingActions } from '@/components/layout/floating-actions';
import { DeviceProvider } from '@/lib/providers/device-provider';
import { TawkToWidget } from '@/components/layout/tawk-to-widget';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'StarBy — Personalized Premium',
    template: '%s | StarBy',
  },
  description:
    'Design what defines you. StarBy is a premium customizable eCommerce brand where every product is uniquely yours.',
  keywords: ['custom apparel', 'personalized fashion', 'premium streetwear', 'StarBy'],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <DeviceProvider initialDevice="desktop">
          <GsapProvider>
            <CustomCursor />
            <FloatingActions />
            <TawkToWidget />
            {children}
          </GsapProvider>
        </DeviceProvider>
      </body>
    </html>
  );
}
