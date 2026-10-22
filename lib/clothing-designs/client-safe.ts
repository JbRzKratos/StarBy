import type { ClothingDesignEntry } from './types';

/**
 * Removes private print-file locations before a design is serialized into a
 * client component or API response. The browser only needs derivative preview
 * URLs and design metadata; it must never receive original R2 object keys.
 */
export function toClientSafeDesign(design: ClothingDesignEntry): ClothingDesignEntry {
  return {
    ...design,
    artworks: (design.artworks || []).map((artwork) => ({
      ...artwork,
      originalPath: '',
      originalObjectKey: '',
    })),
  };
}
