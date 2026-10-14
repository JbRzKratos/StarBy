import manifestJson from './design-manifest.json';
import type { ClothingDesignManifest, ClothingDesignEntry } from './types';

export const clothingDesignManifest: ClothingDesignManifest = manifestJson as unknown as ClothingDesignManifest;

export function getManifest(): ClothingDesignManifest {
  return clothingDesignManifest;
}

export function getDesignById(id: string): ClothingDesignEntry | null {
  return clothingDesignManifest.designs.find((d) => d.id === id) || null;
}
