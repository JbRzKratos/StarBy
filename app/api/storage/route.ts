import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Legacy open redirect. It let anyone turn an arbitrary R2 key into a public
 * CDN URL (including original print artwork). The storefront now uses the
 * browser-safe R2 URL helpers directly, so this endpoint is intentionally gone.
 */
export async function GET() {
  return new NextResponse('Not found', {
    status: 404,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
