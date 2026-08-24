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
    const securityHeaders = [
      // Prevent MIME-type sniffing
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Block iframe embedding (clickjacking protection)
      { key: 'X-Frame-Options', value: 'DENY' },
      // Legacy XSS filter for older browsers
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      // Only send origin on cross-origin requests
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Restrict powerful browser APIs
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
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
