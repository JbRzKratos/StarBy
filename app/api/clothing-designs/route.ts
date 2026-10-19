import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getManifest } from '@/lib/clothing-designs/manifest';
import { getAllServerPlacements, isCoordinatePhysicallyInRegion, type SavedPlacementItem } from '@/lib/clothing-designs/placements-store';
import { rateLimit } from '@/lib/rate-limit';
import { getR2AssetUrl } from '@/lib/r2';

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

      const defaultArt = (d.artworks || []).find((a) => a.id === d.defaultArtworkId) || d.artworks?.[0];
      const defaultThumbKey = defaultArt?.thumbnailObjectKey || `clothing-designs/${d.id}/previews/thumb_${d.defaultArtworkId || 'art-1'}.webp`;
      const defaultStudioKey = defaultArt?.previewObjectKey || `clothing-designs/${d.id}/previews/studio_${d.defaultArtworkId || 'art-1'}.webp`;

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
        previewUrl: getR2AssetUrl(defaultThumbKey),
        studioPreviewUrl: getR2AssetUrl(defaultStudioKey),
        compatibleGarments: d.compatibleGarments,
        artworks: (d.artworks || []).map((a) => {
          const targetGarment = (garment || 'regular-t-shirt').toLowerCase();
          const aId = a.id.toLowerCase();
          const artKey = `${d.id}__${targetGarment}__${aId}`;
          const targetKey = `${d.id}__${targetGarment}__${a.suggestedPlacement}`;

          const reqIsBack = a.suggestedPlacement.includes('back') || a.suggestedPlacement.includes('collar');
          const reqIsSleeve = a.suggestedPlacement.includes('sleeve');

          const isRegionConsistent = (cand?: SavedPlacementItem | null): boolean => {
            if (!cand || typeof cand.u !== 'number' || typeof cand.v !== 'number') return false;
            const expectedRegion: 'front' | 'back' | 'sleeve' = reqIsBack ? 'back' : reqIsSleeve ? 'sleeve' : 'front';
            return isCoordinatePhysicallyInRegion(targetGarment, expectedRegion, cand.u, cand.v);
          };

          const candArt = serverPlacements[artKey];
          const candTarget = serverPlacements[targetKey];
          const candFrontCenter = serverPlacements[`${d.id}__${targetGarment}__front-center`];
          const candRegion = serverPlacements[`${d.id}__${targetGarment}__${reqIsBack ? 'back' : 'front'}`];

          let savedPlacement: SavedPlacementItem | null = null;
          if (isRegionConsistent(candArt)) {
            savedPlacement = candArt;
          } else if (isRegionConsistent(candTarget)) {
            savedPlacement = candTarget;
          } else if (!reqIsBack && !reqIsSleeve && isRegionConsistent(candFrontCenter)) {
            savedPlacement = candFrontCenter;
          } else if (isRegionConsistent(candRegion)) {
            savedPlacement = candRegion;
          } else if (candArt && !candTarget) {
            savedPlacement = candArt;
          } else {
            savedPlacement = candTarget || null;
          }

          if (savedPlacement?.removed) {
            savedPlacement = null;
          }

          const isRemoved = savedPlacement?.removed === true;
          const isHidden = savedPlacement?.hidden === true || savedPlacement?.opacity === 0;
          return {
            id: a.id,
            name: a.name,
            fileName: a.fileName,
            suggestedPlacement: (savedPlacement && isRegionConsistent(savedPlacement)) ? (savedPlacement.placementTarget || a.suggestedPlacement) : a.suggestedPlacement,
            calibratedPlacement: savedPlacement || null,
            hidden: isHidden,
            removed: isRemoved,
            colorHint: a.colorHint,
            previewUrl: getR2AssetUrl(a.thumbnailObjectKey || `clothing-designs/${d.id}/previews/thumb_${a.id}.webp`),
            studioPreviewUrl: getR2AssetUrl(a.previewObjectKey || `clothing-designs/${d.id}/previews/studio_${a.id}.webp`),
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
