import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { fontDisplay, fontMono } from '@/lib/fonts';
import { GsapProvider } from '@/components/animations/gsap-provider';
import { CustomCursor } from '@/components/layout/custom-cursor';
import { FloatingActions } from '@/components/layout/floating-actions';
import { DeviceProvider } from '@/lib/providers/device-provider';
import { TawkToWidget } from '@/components/layout/tawk-to-widget';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://starby.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'StarBy — Personalized Premium',
    template: '%s | StarBy',
  },
  description:
    'Design what defines you. StarBy is a premium customizable eCommerce brand where every product is uniquely yours.',
  keywords: [
    'custom apparel',
    'personalized fashion',
    'premium streetwear',
    'StarBy',
    'custom device skins',
    'split posters',
  ],
  authors: [{ name: 'StarBy Team' }],
  creator: 'StarBy',
  publisher: 'StarBy',
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
    siteName: 'StarBy',
    title: 'StarBy — Personalized Premium',
    description:
      'Design what defines you. StarBy is a premium customizable eCommerce brand where every product is uniquely yours.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StarBy — Personalized Premium',
    description:
      'Design what defines you. StarBy is a premium customizable eCommerce brand where every product is uniquely yours.',
  },
  alternates: {
    canonical: siteUrl,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'StarBy',
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description:
    'Design what defines you. StarBy is a premium customizable eCommerce brand where every product is uniquely yours.',
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
