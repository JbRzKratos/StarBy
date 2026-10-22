'use client';

import type { ClothingDesignEntry } from './types';

/**
 * Small client-side cache for a single curated design.
 *
 * The product grid only has the lightweight Product record, so it needs the
 * full catalog entry before the modal can render. Hovering/focusing a design
 * card warms this cache; clicking reuses the same in-flight request instead of
 * starting a second one.
 */
const designCache = new Map<string, ClothingDesignEntry>();
const inFlight = new Map<string, Promise<ClothingDesignEntry | null>>();

export function getCachedDesign(designId: string): ClothingDesignEntry | null {
  return designCache.get(designId) || null;
}

export function prefetchDesign(designId: string): Promise<ClothingDesignEntry | null> {
  const cached = designCache.get(designId);
  if (cached) return Promise.resolve(cached);

  const existing = inFlight.get(designId);
  if (existing) return existing;

  const request = fetch(`/api/clothing-designs?id=${encodeURIComponent(designId)}`, {
    headers: { Accept: 'application/json' },
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const data = (await response.json()) as {
        success?: boolean;
        designs?: ClothingDesignEntry[];
      };
      const design = data.success ? data.designs?.[0] : null;
      if (design) designCache.set(designId, design);
      return design || null;
    })
    .catch(() => null)
    .finally(() => {
      inFlight.delete(designId);
    });

  inFlight.set(designId, request);
  return request;
}

export function loadDesign(designId: string): Promise<ClothingDesignEntry | null> {
  return prefetchDesign(designId);
}
