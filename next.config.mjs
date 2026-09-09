/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable X-Powered-By header for security
  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 375, 425, 768, 1024, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Cache optimized images for 30 days (default is 60s)
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
    ],
  },

  async headers() {
    /** @type {import('next/dist/lib/load-custom-routes').Header['headers']} */
    const isProd = process.env.NODE_ENV === 'production';

    const securityHeaders = [
      // Prevent MIME-type sniffing
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Block iframe embedding (clickjacking protection)
      { key: 'X-Frame-Options', value: 'DENY' },
      // Legacy XSS filter for older browsers
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      // Only send origin on cross-origin requests
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Restrict powerful browser APIs — camera allowed for AR/WebXR features
      {
        key: 'Permissions-Policy',
        value: 'camera=(self), microphone=(), geolocation=()',
      },
      // HSTS: enforce HTTPS for 1 year on production (with subdomains + preload)
      ...(isProd
        ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            },
          ]
        : []),
      // Content Security Policy — enforced in production only to avoid blocking local dev / HMR / 3D models
      ...(isProd
        ? [
            {
              key: 'Content-Security-Policy',
              value: [
                `default-src 'self'`,
                // Scripts: self + inline/eval for Next.js + fabric.js (cdnjs) + cashfree/tawk
                // blob: required for Three.js inline worker strings
                `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.cashfree.com https://embed.tawk.to https://va.tawk.to https://cdn.jsdelivr.net https://cdnjs.cloudflare.com`,
                // Styles: self + inline (Tailwind/fabric) + Google Fonts + cdnjs + jsdelivr
                `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com`,
                // Fonts: self + Google Fonts CDN + data URIs
                `font-src 'self' https://fonts.gstatic.com data:`,
                // Images: self + data URIs + blob (canvas/Three.js) + Supabase + Unsplash + cdnjs + R2 + Drei assets
                `img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://plus.unsplash.com https://*.tawk.to https://cdnjs.cloudflare.com https://raw.githack.com https://dl.polyhaven.org https://cdn.jsdelivr.net https://*.r2.cloudflarestorage.com`,
                // Fetch/XHR: self + Supabase + Cashfree + Tawk + cdnjs + Drei assets + Polyhaven + jsDelivr + R2
                `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cashfree.com https://sandbox.cashfree.com https://*.tawk.to wss://*.tawk.to https://cdnjs.cloudflare.com https://raw.githack.com https://dl.polyhaven.org https://cdn.jsdelivr.net https://*.r2.cloudflarestorage.com ws://localhost:* http://localhost:*`,
                // iframes: Cashfree checkout + Tawk.to chat widget
                `frame-src https://payments.cashfree.com https://checkout.cashfree.com https://sandbox.cashfree.com https://*.tawk.to`,
                // Workers: self + blob for Three.js draco workers and fabric.js
                `worker-src 'self' blob:`,
                // Media: self + blob (canvas export)
                `media-src 'self' blob:`,
                // Manifest
                `manifest-src 'self'`,
                // Object (PDF embeds etc): none
                `object-src 'none'`,
                // Base URI: restrict to self to prevent base tag injection
                `base-uri 'self'`,
                // Form action: self only
                `form-action 'self'`,
              ].join('; '),
            },
          ]
        : []),
    ];

    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Immutable long-lived cache for all _next/static/* assets (JS chunks, CSS, fonts)
        // These are content-hashed so safe to cache permanently
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache static public images for 7 days with revalidation
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Cache fonts permanently (they never change)
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
