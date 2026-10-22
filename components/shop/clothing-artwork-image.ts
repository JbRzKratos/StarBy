'use client';

import type { DesignArtworkOption } from '@/lib/clothing-designs/types';
import { getR2AssetUrl } from '@/lib/r2-public';

/**
 * Prefer the pre-generated R2 thumbnail over the API proxy.
 *
 * The API proxy is still required for the 3D Studio texture (CORS), but the 2D
 * modal only needs a small WebP. Going straight to the R2 CDN removes a Vercel
 * function hop and avoids `/_next/image` transforming a 19 KB thumbnail into a
 * much larger variant.
 */
export function getArtworkPreviewUrl(art: DesignArtworkOption): string {
  const direct = (art as DesignArtworkOption & { cdnThumbnailUrl?: string }).cdnThumbnailUrl;
  if (direct) return direct;

  if (art.thumbnailObjectKey) {
    return getR2AssetUrl(art.thumbnailObjectKey);
  }

  return art.previewUrl;
}
