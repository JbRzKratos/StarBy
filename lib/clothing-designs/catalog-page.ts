import { prisma } from '@/lib/prisma';
import { getManifest } from '@/lib/clothing-designs/manifest';
import {
  getAllServerPlacements,
  getServerPlacementsForDesign,
  isCoordinatePhysicallyInRegion,
  type SavedPlacementItem,
} from '@/lib/clothing-designs/placements-store';
import { getR2AssetUrl } from '@/lib/r2';

/**
 * Shared server-side builder for the clothing-designs catalogue.
 *
 * Both the public JSON API and the server-rendered shop page use this so the
 * first screenful of designs is identical in both places — and so the images
 * can be referenced straight from the R2 CDN instead of being proxied through
 * the preview API route.
 */

export interface CatalogArtworkOption {
  id: string;
  name: string;
  fileName: string;
  suggestedPlacement: string;
  calibratedPlacement: SavedPlacementItem | null;
  hidden: boolean;
  removed: boolean;
  colorHint?: string;
  previewUrl: string;
  studioPreviewUrl: string;
  /** Direct R2 CDN URL for the small thumbnail (fast, no API hop). */
  cdnThumbnailUrl: string;
}

export interface CatalogDesignEntry {
  id: string;
  name: string;
  basePrice: number;
  price: number;
  category: string;
  tags: string[];
  defaultSurface: string;
  availableSurfaces: string[];
  defaultArtworkId: string;
  previewUrl: string;
  studioPreviewUrl: string;
  cdnThumbnailUrl: string;
  compatibleGarments: string[];
  artworks: CatalogArtworkOption[];
}

export interface CatalogPageParams {
  page?: number;
  limit?: number;
  theme?: string | null;
  q?: string | null;
  garment?: string | null;
  id?: string | null;
}

export interface CatalogPageResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  designs: CatalogDesignEntry[];
}

function withVersion(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  return url.includes('&v=') ? url : `${url}&v=v3`;
}

export async function getCatalogPage(params: CatalogPageParams): Promise<CatalogPageResult> {
  const manifest = getManifest();
  const requestedId = params.id?.trim() || null;
  let designs = requestedId
    ? manifest.designs.filter((design) => design.id === requestedId)
    : manifest.designs;

  const page = Math.max(1, Math.floor(params.page || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(params.limit || 36)));

  // A missing id is a real 404-ish result; don't pay for a database round-trip.
  if (requestedId && designs.length === 0) {
    return { page, limit, total: 0, totalPages: 0, designs: [] };
  }

  const targetGarment = (params.garment || 'regular-t-shirt').toLowerCase();

  // Overlay live product prices and customised names from PostgreSQL. For a
  // single-design lookup this is a primary-key read instead of scanning every
  // design product in the catalogue.
  const dbProductsPromise = requestedId
    ? prisma.product
        .findUnique({
          where: { id: requestedId },
          select: { id: true, name: true, basePrice: true },
        })
        .then((product) => (product ? [product] : []))
    : prisma.product.findMany({
        where: { id: { startsWith: 'design-' } },
        select: { id: true, name: true, basePrice: true },
      });

  // Placements are independent of the product query, so start them now. A
  // single-design request only needs that design's keys, not the whole table.
  const placementsPromise = requestedId
    ? getServerPlacementsForDesign(requestedId, targetGarment)
    : getAllServerPlacements();

  const dbMap = new Map<string, { id: string; name: string; basePrice: number }>();
  try {
    const dbProducts = await dbProductsPromise;
    for (const p of dbProducts) dbMap.set(p.id, p);
  } catch {
    // The manifest still renders fine without the live price overlay.
  }

  const q = params.q?.toLowerCase()?.trim();
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

  const theme = params.theme?.toLowerCase();
  if (theme && theme !== 'all') {
    designs = designs.filter((d) => d.tags.some((t) => t.toLowerCase() === theme));
  }

  if (params.garment) {
    designs = designs.filter((d) => d.compatibleGarments.some((g) => g === targetGarment));
  }

  const total = designs.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginated = designs.slice(offset, offset + limit);

  if (paginated.length === 0) {
    void placementsPromise.catch(() => undefined);
    return { page, limit, total, totalPages, designs: [] };
  }

  let serverPlacements: Record<string, SavedPlacementItem> = {};
  try {
    serverPlacements = await placementsPromise;
  } catch {
    // The catalog can render without calibrated placements.
  }

  const sanitized: CatalogDesignEntry[] = paginated.map((d) => {
    const dbProduct = dbMap.get(d.id);
    const isOneRupee = d.id === 'design-001';
    const livePrice =
      typeof dbProduct?.basePrice === 'number' && dbProduct.basePrice > 0
        ? dbProduct.basePrice
        : isOneRupee
          ? 1
          : d.category === 'hoodies'
            ? 849
            : 639;
    const liveName = dbProduct?.name || d.name;

    const artworks: CatalogArtworkOption[] = (d.artworks || []).map((a) => {
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
        suggestedPlacement:
          savedPlacement && isRegionConsistent(savedPlacement)
            ? savedPlacement.placementTarget || a.suggestedPlacement
            : a.suggestedPlacement,
        calibratedPlacement: savedPlacement || null,
        hidden: isHidden,
        removed: isRemoved,
        colorHint: a.colorHint,
        previewUrl: withVersion(
          a.previewUrl,
          `/api/clothing-designs/${d.id}/preview?artId=${a.id}&type=thumbnail`
        ),
        studioPreviewUrl: withVersion(
          a.studioPreviewUrl,
          `/api/clothing-designs/${d.id}/preview?artId=${a.id}&type=studio`
        ),
        cdnThumbnailUrl: getR2AssetUrl(a.thumbnailObjectKey),
      };
    });

    const defaultArtwork =
      artworks.find((a) => a.id === d.defaultArtworkId) || artworks[0] || null;

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
      previewUrl: withVersion(
        d.previewUrl,
        `/api/clothing-designs/${d.id}/preview?type=thumbnail`
      ),
      studioPreviewUrl: withVersion(
        d.studioPreviewUrl,
        `/api/clothing-designs/${d.id}/preview?type=studio`
      ),
      cdnThumbnailUrl: defaultArtwork?.cdnThumbnailUrl || '',
      compatibleGarments: d.compatibleGarments,
      artworks,
    };
  });

  return { page, limit, total, totalPages, designs: sanitized };
}
