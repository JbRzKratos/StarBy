/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable X-Powered-By header for security
  poweredByHeader: false,
  // `next build` and `next dev` must not share a build folder: a production
  // build overwrites the dev webpack cache, so the next `next dev` has to
  // recompile all ~3 000 modules from scratch (25 s+ on Windows). The dev
  // server therefore gets its own persistent folder.
  // Override with NEXT_DIST_DIR if you need a different location.
  distDir:
    process.env.NEXT_DIST_DIR ||
    (process.env.NODE_ENV === 'development' ? '.next-dev' : '.next'),

  // Transpile ESM packages for SSR compatibility on Node & Vercel
  transpilePackages: ['gsap', '@gsap/react'],
  compress: true,

  // pdfkit reads its standard-font metrics from node_modules at runtime. Since
  // it is externalized below, trace those files so the PDF routes keep working
  // in Vercel's serverless bundle.
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/pdfkit/js/data/**/*'],
    },
    // pdfkit loads its built-in font metrics (.afm) from its own `data`
    // directory at runtime. Bundling it rewrites __dirname to `.next/server`
    // and breaks every PDF (invoice, shipping label) with an ENOENT. Keeping
    // it external makes Node resolve the package from node_modules instead.
    serverComponentsExternalPackages: ['pdfkit'],
    optimizePackageImports: [
      'lucide-react',       // icon library — large barrel, only subset used
      'recharts',           // chart library — only used in /admin
      '@aws-sdk/client-s3', // AWS SDK — tree-shake S3 commands
      'three',              // 3D engine — avoid barrel parsing
      '@react-three/fiber', // React Three Fiber
      '@react-three/drei',  // Drei helpers
      '@supabase/supabase-js', // Supabase client
      'fabric',             // 2D Canvas library
      'clsx',
      'tailwind-merge',
    ],
  },

  images: {
    // R2 stores the original uploads. Next.js resizes and transcodes them on demand,
    // then caches the result at the edge. This gives every viewport a correctly sized
    // AVIF/WebP image instead of the full-resolution original.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 828, 1080, 1200, 1600, 1920],
    imageSizes: [64, 80, 128, 160, 256, 384],
    // 30 days: long enough for CDN efficiency, short enough that re-uploaded
    // product artwork does not stay stale for a full year.
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
      {
        // Cloudflare R2 — private endpoint
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        // Cloudflare R2 — public r2.dev subdomain (NEXT_PUBLIC_R2_PUBLIC_URL)
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        // Cloudflare R2 — specific pub- subdomain for this project
        protocol: 'https',
        hostname: 'pub-911817f7f441483a9ef72eecab9dbf49.r2.dev',
      },
    ],
  },

  webpack: (config) => {
    // webpack's filesystem cache prints a non-actionable performance notice when
    // it serializes the large inline catalogue/manifest strings used by the
    // magazine and wall editors. It is an internal cache hint, not a build
    // problem, so keep the build output clean.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      /PackFileCacheStrategy/,
    ];
    config.infrastructureLogging = {
      ...(config.infrastructureLogging ?? {}),
      level: 'error',
    };
    return config;
  },

  async headers() {
    /** @type {import('next/dist/lib/load-custom-routes').Header['headers']} */
    const isProd = process.env.NODE_ENV === 'production';

    const securityHeaders = [
      // Prevent MIME-type sniffing
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Allow same-origin iframe embedding for the clothing mockup studio; block cross-origin (clickjacking protection)
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
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
                `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://sdk.cashfree.com https://cdn.cashfree.com https://api.cashfree.com https://sandbox.cashfree.com https://*.cashfree.com https://embed.tawk.to https://va.tawk.to https://*.tawk.to https://tawk.link https://*.tawk.link https://cdn.jsdelivr.net https://cdnjs.cloudflare.com`,
                // Styles: self + inline (Tailwind/fabric) + Google Fonts + cdnjs + jsdelivr + Tawk.to CSS
                `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://embed.tawk.to https://*.tawk.to https://tawk.link https://*.tawk.link`,
                // Fonts: self + Google Fonts CDN + data URIs + Tawk.to fonts
                `font-src 'self' https://fonts.gstatic.com data: https://embed.tawk.to https://*.tawk.to https://tawk.link https://*.tawk.link`,
                // Images: self + data URIs + blob (canvas/Three.js) + Supabase + Unsplash + cdnjs + R2 + Drei assets + Cashfree bank/UPI logos + Tawk.to avatars/assets
                `img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://plus.unsplash.com https://*.cashfree.com https://*.tawk.to https://embed.tawk.to https://tawk.link https://*.tawk.link https://cdnjs.cloudflare.com https://raw.githack.com https://dl.polyhaven.org https://cdn.jsdelivr.net https://*.r2.cloudflarestorage.com https://*.r2.dev https://pub-*.r2.dev`,
                // Fetch/XHR: self + Supabase + Cashfree + Tawk + cdnjs + Drei assets + Polyhaven + jsDelivr + R2
                `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cashfree.com https://sandbox.cashfree.com https://sdk.cashfree.com https://payments.cashfree.com https://checkout.cashfree.com https://*.cashfree.com https://*.tawk.to wss://*.tawk.to https://tawk.link https://*.tawk.link wss://*.tawk.link https://cdnjs.cloudflare.com https://raw.githack.com https://dl.polyhaven.org https://cdn.jsdelivr.net https://*.r2.cloudflarestorage.com https://*.r2.dev https://pub-*.r2.dev ws://localhost:* http://localhost:*`,
                // iframes: Cashfree checkout + Tawk.to chat widget
                `frame-src 'self' https://api.cashfree.com https://sandbox.cashfree.com https://payments.cashfree.com https://checkout.cashfree.com https://*.cashfree.com https://*.tawk.to https://embed.tawk.to`,
                // Workers: self + blob for Three.js draco workers and fabric.js + Tawk.to workers
                `worker-src 'self' blob: https://*.tawk.to https://embed.tawk.to`,
                // Media: self + blob (canvas export) + Tawk notification chimes
                `media-src 'self' blob: https://*.tawk.to https://embed.tawk.to https://tawk.link https://*.tawk.link`,
                // Manifest
                `manifest-src 'self'`,
                // Object (PDF embeds etc): none
                `object-src 'none'`,
                // Base URI: restrict to self to prevent base tag injection
                `base-uri 'self'`,
                // Form action: allow submitting payment session to Cashfree checkout endpoints
                `form-action 'self' https://api.cashfree.com https://sandbox.cashfree.com https://payments.cashfree.com https://*.cashfree.com`,
                // Frame ancestors: allow same-origin iframe embedding for the clothing mockup studio
                `frame-ancestors 'self'`,
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
        // Cache fonts permanently (they never change)
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache 3D garment assets (GLB models, PBR textures, HDR environment)
        source: '/3d-assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        // Cache plain mockups permanently
        source: '/plain-mockups/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        // Cache the clothing mockup studio built assets (content-hashed JS/CSS)
        source: '/tools/clothing-mockup/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  async rewrites() {
    const r2Base =
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
      'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev';

    return [
      {
        source: '/plain-mockups/:path*',
        destination: `${r2Base}/plain-mockups/:path*`,
      },
      {
        source: '/3d-assets/:path*',
        destination: `${r2Base}/3d-assets/:path*`,
      },
    ];
  },
};

export default nextConfig;
