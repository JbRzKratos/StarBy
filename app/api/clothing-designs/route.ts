import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getManifest } from '@/lib/clothing-designs/manifest';
import { getAllServerPlacements } from '@/lib/clothing-designs/placements-store';
import { rateLimit } from '@/lib/rate-limit';

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

    const manifest = getManifest();
    let designs = manifest.designs;

    // Overlay live product prices and customized names from PostgreSQL
    let dbMap = new Map<string, { id: string; name: string; basePrice: number }>();
    try {
      const dbProducts = await prisma.product.findMany({
        where: { id: { startsWith: 'design-' } },
        select: { id: true, name: true, basePrice: true },
      });
      dbMap = new Map(dbProducts.map((p) => [p.id, p]));
    } catch (e) {
      console.warn('[clothing-designs] Could not fetch dbProducts overlay:', e);
    }

    // Filter by specific design id
    const specificId = searchParams.get('id');
    if (specificId) {
      designs = designs.filter((d) => d.id === specificId);
    }

    // Filter by query (searches both manifest name AND live DB customized name, plus tags)
    const q = searchParams.get('q')?.toLowerCase()?.trim();
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      designs = designs.filter((d) => {
        const dbProduct = dbMap.get(d.id);
        const manifestName = d.name.toLowerCase();
        const liveName = (dbProduct?.name || '').toLowerCase();
        const idLower = d.id.toLowerCase();
        const tagsJoined = d.tags.map((t) => t.toLowerCase()).join(' ');
        const fullSearch = `${manifestName} ${liveName} ${idLower} ${tagsJoined}`;

        return tokens.every((token) => fullSearch.includes(token));
      });
    }

    // Filter by theme category (e.g. anime, automotive, streetwear, etc.)
    const theme = searchParams.get('theme')?.toLowerCase();
    if (theme && theme !== 'all') {
      designs = designs.filter((d) => d.tags.some((t) => t.toLowerCase() === theme));
    }

    // Filter by category or garment compatibility
    const garment = searchParams.get('garment');
    if (garment) {
      designs = designs.filter((d) => d.compatibleGarments.some((g) => g === garment));
    }

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '36', 10)));
    const total = designs.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginated = designs.slice(offset, offset + limit);

    const serverPlacements = await getAllServerPlacements();

    // Strip any internal or raw object keys from the public response
    const sanitized = paginated.map((d) => {
      const dbProduct = dbMap.get(d.id);
      const isOneRupee = d.id === 'design-001';
      const livePrice =
        typeof dbProduct?.basePrice === 'number' && dbProduct.basePrice > 0
          ? dbProduct.basePrice
          : isOneRupee
            ? 1
            : d.category === 'hoodies'
              ? 1499
              : 999;
      const liveName = dbProduct?.name || d.name;

      return {
        id: d.id,
        name: liveName,
        basePrice: livePrice,
        price: livePrice,
        category: d.category,
        tags: d.tags,
        defaultSurface: d.defaultSurface,
        availableSurfaces: d.availableSurfaces,
        defaultArtworkId: d.defaultArtworkId,
        previewUrl: d.previewUrl,
        studioPreviewUrl: d.studioPreviewUrl,
        compatibleGarments: d.compatibleGarments,
        artworks: (d.artworks || []).map((a) => {
          const targetGarment = (garment || 'regular-t-shirt').toLowerCase();
          const aId = a.id.toLowerCase();
          const artKey = `${d.id}__${targetGarment}__${aId}`;
          const targetKey = `${d.id}__${targetGarment}__${a.suggestedPlacement}`;
          const savedPlacement =
            serverPlacements[artKey] ||
            (serverPlacements[targetKey]?.removed ? null : serverPlacements[targetKey]);
          const isRemoved = savedPlacement?.removed === true;
          const isHidden = savedPlacement?.hidden === true || savedPlacement?.opacity === 0;
          return {
            id: a.id,
            name: a.name,
            fileName: a.fileName,
            suggestedPlacement: savedPlacement?.placementTarget || a.suggestedPlacement,
            calibratedPlacement: savedPlacement || null,
            hidden: isHidden,
            removed: isRemoved,
            colorHint: a.colorHint,
            previewUrl: a.previewUrl,
            studioPreviewUrl: a.studioPreviewUrl,
          };
        }),
      };
    });

    return NextResponse.json(
      {
        success: true,
        page,
        limit,
        total,
        totalPages,
        designs: sanitized,
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
