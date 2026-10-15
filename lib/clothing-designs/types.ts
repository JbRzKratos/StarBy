export type DesignPlacementTarget =
  | 'front'
  | 'back'
  | 'left-chest'
  | 'right-chest'
  | 'front-center'
  | 'full-front'
  | 'back-collar'
  | 'back-center'
  | 'full-back'
  | 'left-sleeve'
  | 'right-sleeve'
  | 'bottom-hem'
  | 'sleeve';
export type DesignScalePreset = 'compact' | 'standard' | 'oversized';

export interface DesignArtworkOption {
  id: string; // e.g. "art-1", "art-2"
  fileName: string;
  name: string; // User-friendly label, e.g. "Left Chest Graphic", "Collar to Back Print", "Front"
  suggestedPlacement: DesignPlacementTarget;
  colorHint?: 'black' | 'white' | 'any';
  originalPath: string;
  originalObjectKey: string;
  thumbnailObjectKey: string;
  previewObjectKey: string;
  previewUrl: string; // /api/clothing-designs/{id}/preview?artId={artId}&type=thumbnail
  studioPreviewUrl: string; // /api/clothing-designs/{id}/preview?artId={artId}&type=studio
}

export interface ClothingDesignEntry {
  id: string; // e.g. "design-001"
  folder: string; // e.g. "Design 1"
  name: string; // Display title, e.g. "Design 01" or named graphic
  category: 'tees' | 'hoodies' | 'apparel';
  tags: string[];
  basePrice?: number;
  price?: number;
  artworks: DesignArtworkOption[]; // All artwork options from this folder
  defaultArtworkId: string;
  defaultSurface: 'front' | 'back';
  availableSurfaces: ('front' | 'back' | 'sleeve')[];
  previewUrl: string; // Primary thumbnail for catalog grid
  studioPreviewUrl: string; // Primary 3D studio texture
  status: 'active' | 'archived';
  compatibleGarments: ('regular-t-shirt' | 'oversized-t-shirt' | 'acid-wash-t-shirt' | 'hoodie')[];
  createdAt: string;
}

export interface ClothingDesignManifest {
  version: string;
  generatedAt: string;
  totalDesigns: number;
  totalArtworks: number;
  designs: ClothingDesignEntry[];
}
