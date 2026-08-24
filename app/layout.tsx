import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { fontDisplay, fontMono } from '@/lib/fonts';
import { GsapProvider } from '@/components/animations/gsap-provider';
import { CustomCursor } from '@/components/layout/custom-cursor';
import { FloatingActions } from '@/components/layout/floating-actions';
import { DeviceProvider } from '@/lib/providers/device-provider';
import { TawkToWidget } from '@/components/layout/tawk-to-widget';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fregoro.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Fregoro Studios — Engineered Streetwear & Design Objects',
    template: '%s | Fregoro Studios',
  },
  description:
    'Design what defines you. Fregoro Studios delivers premium customizable streetwear, wall art, split posters, device skins & more — crafted on demand, shipped across India.',
  keywords: [
    'Fregoro Studios',
    'Fregoro',
    'custom apparel',
    'personalized fashion',
    'premium streetwear',
    'custom device skins',
    'split posters',
  ],
  authors: [{ name: 'Fregoro Studios' }],
  creator: 'Fregoro Studios',
  publisher: 'Fregoro Studios',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Fregoro Studios',
    title: 'Fregoro Studios — Engineered Streetwear & Design Objects',
    description:
      'Design what defines you. Fregoro Studios is a premium customizable eCommerce brand where every product is uniquely yours.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fregoro Studios — Engineered Streetwear & Design Objects',
    description:
      'Design what defines you. Fregoro Studios is a premium customizable eCommerce brand where every product is uniquely yours.',
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  themeColor: '#0E0E0F',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Fregoro Studios',
  url: siteUrl,
  logo: `${siteUrl}/images/fregoro-logo.png`,
  description:
    'Design what defines you. Fregoro Studios is a premium customizable eCommerce brand where every product is uniquely yours.',
  sameAs: [],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
