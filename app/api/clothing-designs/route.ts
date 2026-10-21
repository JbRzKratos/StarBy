import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { getCatalogPage } from '@/lib/clothing-designs/catalog-page';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // Rate limiting: 120 requests per minute per IP for browsing
    const rate = await rateLimit(`clothing-catalog:${ip}`, 120, 60 * 1000);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const result = await getCatalogPage({
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '36', 10),
      theme: searchParams.get('theme'),
      q: searchParams.get('q'),
      garment: searchParams.get('garment'),
      id: searchParams.get('id'),
    });

    return NextResponse.json(
      {
        success: true,
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        designs: result.designs,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      },
    );
  } catch (err: unknown) {
    console.error('[API /api/clothing-designs] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
