import { NextResponse } from 'next/server';
import { getPreviewImageStream, getDesignById } from '@/lib/clothing-designs/service';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

interface RouteProps {
  params: { id: string };
}

export async function GET(req: Request, { params }: RouteProps) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);

    // Validate ID format (design-XXX)
    if (!id || !/^design-\d{3}$/i.test(id)) {
      return new NextResponse('Invalid design ID', { status: 400 });
    }

    const design = getDesignById(id);
    if (!design) {
      return new NextResponse('Design not found', { status: 404 });
    }

    // Rate limiting: 300 preview requests per minute per IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const rate = await rateLimit(`clothing-preview:${ip}`, 300, 60 * 1000);
    if (!rate.success) {
      return new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: { 'Retry-After': '60' },
      });
    }

    const typeParam = searchParams.get('type') === 'studio' ? 'studio' : 'thumbnail';
    const artIdParam = searchParams.get('artId') || searchParams.get('surface') || design.defaultArtworkId;

    const result = await getPreviewImageStream(id, typeParam, artIdParam);
    if (!result) {
      return new NextResponse('Preview not available', { status: 404 });
    }

    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  } catch (err: unknown) {
    console.error(`[API /api/clothing-designs/${params.id}/preview] Error:`, err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
