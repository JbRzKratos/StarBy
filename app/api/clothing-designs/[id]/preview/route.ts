import { NextResponse } from 'next/server';
import { getPreviewImageStream, getDesignById } from '@/lib/clothing-designs/service';
import { rateLimit } from '@/lib/rate-limit';
import { getR2AssetUrl } from '@/lib/r2-public';
import { getStaffUser } from '@/app/admin/lib/auth';

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

    const typeReq = searchParams.get('type');
    const typeParam: 'thumbnail' | 'studio' | 'original' =
      typeReq === 'original' ? 'original' : typeReq === 'studio' ? 'studio' : 'thumbnail';
    const artIdParam = searchParams.get('artId') || searchParams.get('surface') || design.defaultArtworkId;
    const isDownload = searchParams.get('download') === '1' || searchParams.has('download');
    const isPrivateAsset = typeParam === 'original' || isDownload;

    // Print-quality originals and forced downloads are staff-only. Public
    // storefront views only receive the small derivative previews.
    if (isPrivateAsset) {
      const staff = await getStaffUser();
      if (!staff) {
        return new NextResponse('Forbidden', {
          status: 403,
          headers: {
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            'X-Robots-Tag': 'noindex, nofollow',
          },
        });
      }
    }

    // Serve directly with CORS headers so Three.js / WebGL / Canvas2D can safely composite textures without cross-origin blocks
    if (!isDownload && typeParam !== 'original') {
      let art = design.artworks?.find((a) => a.id.toLowerCase() === artIdParam?.toLowerCase());
      if (!art && artIdParam) {
        const normId = artIdParam.toLowerCase().replace(/^art-?0*(\d+)$/, 'art-$1');
        art = design.artworks?.find(
          (a) => a.id.toLowerCase().replace(/^art-?0*(\d+)$/, 'art-$1') === normId
        );
      }
      if (!art && artIdParam) {
        const s = artIdParam.toLowerCase();
        art = design.artworks?.find(
          (a) =>
            a.suggestedPlacement?.toLowerCase() === s ||
            a.suggestedPlacement?.toLowerCase().startsWith(s) ||
            a.suggestedPlacement?.toLowerCase().includes(s) ||
            (s === 'front' && (a.fileName?.toLowerCase().includes('front') || a.name?.toLowerCase().includes('front'))) ||
            (s === 'back' && (a.fileName?.toLowerCase().includes('back') || a.name?.toLowerCase().includes('back'))) ||
            (s === 'sleeve' && (a.fileName?.toLowerCase().includes('sleeve') || a.name?.toLowerCase().includes('sleeve')))
        );
      }
      if (!art) {
        art = design.artworks?.find((a) => a.id === design.defaultArtworkId) || design.artworks?.[0];
      }
      const r2Key = art ? (typeParam === 'studio' ? art.previewObjectKey : art.thumbnailObjectKey) : null;
      if (r2Key) {
        const cdnUrl = getR2AssetUrl(r2Key);
        try {
          const cdnRes = await fetch(cdnUrl, { next: { revalidate: 86400 } });
          if (cdnRes.ok) {
            const arrayBuf = await cdnRes.arrayBuffer();
            const contentType =
              cdnRes.headers.get('content-type') || (r2Key.endsWith('.png') ? 'image/png' : 'image/webp');
            return new Response(new Uint8Array(arrayBuf), {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Vary': 'Origin',
                'X-Content-Type-Options': 'nosniff',
              },
            });
          }
        } catch {
          // Fall through to getPreviewImageStream
        }
      }
    }

    const result = await getPreviewImageStream(id, typeParam, artIdParam);
    if (!result) {
      return new NextResponse('Preview not available', { status: 404 });
    }

    const filename = result.fileName || `${id}_${artIdParam || 'artwork'}.${result.contentType.includes('png') ? 'png' : 'webp'}`;

    const headers: Record<string, string> = {
      'Content-Type': result.contentType,
      'Cache-Control': isPrivateAsset
        ? 'private, no-store, max-age=0'
        : 'public, max-age=86400, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
      ...(isPrivateAsset
        ? { 'X-Robots-Tag': 'noindex, nofollow' }
        : {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            Vary: 'Origin',
          }),
    };

    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(filename)}"`;
    }

    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    console.error(`[API /api/clothing-designs/${params.id}/preview] Error:`, err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}
