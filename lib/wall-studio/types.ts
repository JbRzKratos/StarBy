/**
 * FREGORO WALL STUDIO - CORE DATA TYPES
 *
 * Scalable data model distinguishing:
 * - Physical Prints (actual paper pieces printed: A3, A4, A5, etc.)
 * - Logical Artwork Groups (single poster vs multi-panel split artwork)
 * - Normalized Coordinates (0.0 to 1.0) scaled to responsive canvas
 * - Physical Dimensions in millimeters
 */

export type PosterSize = 'A6' | 'A5' | 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | '13x19' | 'CUSTOM';

export type SlotOrientation = 'portrait' | 'landscape' | 'square';
export type Orientation = SlotOrientation;

export type SlotType =
  | 'hero'
  | 'hero-panel'
  | 'support'
  | 'accent'
  | 'portrait'
  | 'landscape'
  | 'quote'
  | 'photo'
  | 'custom';

export interface PhysicalSizeMm {
  widthMm: number;
  heightMm: number;
}

export const PHYSICAL_SIZES_MM: Record<PosterSize, PhysicalSizeMm> = {
  A6: { widthMm: 105, heightMm: 148 },
  A5: { widthMm: 148, heightMm: 210 },
  A4: { widthMm: 210, heightMm: 297 },
  A3: { widthMm: 297, heightMm: 420 },
  '13x19': { widthMm: 330, heightMm: 483 }, // 13 x 19 inches (330.2 x 482.6 mm)
  A2: { widthMm: 420, heightMm: 594 },
  A1: { widthMm: 594, heightMm: 841 },
  A0: { widthMm: 841, heightMm: 1189 },
  CUSTOM: { widthMm: 300, heightMm: 300 },
};

/**
 * Split Group definition for multi-panel continuous artwork
 */
export interface WallSplitGroup {
  splitGroupId: string;
  id?: string;
  name: string;
  panelCount: number;
  orientation: SlotOrientation;
  physicalSize: PosterSize;
  slotIds: string[]; // Ordered list of slotIds representing panels from left to right (or top to bottom)
  staggered?: boolean; // For stepped hero layouts where vertical offsets vary
  aspectRatio?: number;
  stepOffsetMm?: number;
}

/**
 * Slot Definition in normalized coordinates (0.0 - 1.0)
 */
export interface WallSlot {
  id: string;
  slotType: SlotType;
  x: number; // Normalized x coordinate (0.0 to 1.0)
  y: number; // Normalized y coordinate (0.0 to 1.0)
  width: number; // Normalized width (0.0 to 1.0)
  height: number; // Normalized height (0.0 to 1.0)
  rotation?: number; // In degrees, default 0
  size: PosterSize;
  physicalWidthMm: number;
  physicalHeightMm: number;
  orientation: SlotOrientation;
  splitGroupId?: string | null;
  panelIndex?: number | null; // 0-indexed within its splitGroup
  required?: boolean;
  allowedProductTypes?: string[];
  allowedSizes?: PosterSize[];
  preferredThemes?: string[];
  allowCustomUpload?: boolean;
  label?: string; // e.g. "Hero Center", "Top Left Accent"
}

/**
 * Normalized Crop & Zoom data for custom or split images
 */
export interface CropData {
  focusX: number; // 0.0 to 1.0 (default 0.5)
  focusY: number; // 0.0 to 1.0 (default 0.5)
  zoom: number; // 1.0 to 3.0 (default 1.0)
  rotation: number; // 0, 90, 180, 270
  aspectRatio?: number;
  fitMode?: 'fill' | 'fit';
}

/**
 * Selected Artwork State on a Slot
 */
export interface SlotSelection {
  slotId: string;
  artworkId?: string | null;
  title?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  isCustomUpload?: boolean;
  customUploadId?: string;
  splitGroupId?: string | null;
  panelIndex?: number | null;
  cropData?: CropData;
  isLocked?: boolean;
  physicalSize: PosterSize;
  price: number;
}

/**
 * Wall Layout Metadata & Definition
 */
export interface WallLayoutData {
  id: string;
  slug: string;
  name: string;
  category?: 'split' | 'gallery' | 'hybrid';
  description: string;
  badge?: string | null;
  wallWidthMm: number;
  wallHeightMm: number;
  coverageLabel: string; // e.g. "160 × 105 cm"
  physicalPrintCount: number; // Total physical printed sheets
  logicalArtworkCount: number; // Total logical artworks (a 5-panel split counts as 1)
  recommendedRoom?: string;
  recommendedWallWidth?: string;
  recommendedThemes: string[];
  basePrice: number;
  compareAtPrice?: number | null;
  slots: WallSlot[];
  splitGroups: WallSplitGroup[];
  published?: boolean;
  version: number;
  previewImage?: string;
  sortOrder?: number;
}

export type WallLayout = WallLayoutData;

/**
 * Poster Artwork Metadata
 */
export interface PosterArtworkData {
  id: string;
  slug: string;
  title: string;
  artist?: string;
  description?: string;
  themeSlug: string;
  category: string;
  subcategory?: string;
  tags: string[];
  orientation: SlotOrientation;
  availableSizes: PosterSize[];
  productType: string; // 'poster' | 'split' | 'quote' | 'minimal'
  isSplitCompatible: boolean;
  heroCompatible: boolean;
  supportCompatible: boolean;
  dominantColor?: string;
  secondaryColor?: string;
  brightness?: 'dark' | 'mid' | 'bright';
  mood?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  price: number;
  featured?: boolean;
}

/**
 * Wall Theme Metadata
 */
export interface WallThemeData {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  accentColor: string;
  gradient: string;
  previewImage?: string;
  featured?: boolean;
  sortOrder?: number;
}

/**
 * Ready-made Prebuilt Wall Product
 */
export interface PrebuiltWallProductData {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  themeSlug: string;
  layoutId: string;
  basePrice: number;
  compareAtPrice?: number;
  heroImage: string;
  roomPhoto?: string;
  presetSelections: Record<string, SlotSelection>; // slotId -> SlotSelection
  material: string;
  whatsIncluded: string[];
  featured?: boolean;
  rating?: number;
  reviewCount?: number;
}

/**
 * Full Immutable Cart / Order Configuration Snapshot
 */
export interface WallConfigurationSnapshot {
  wallConfigurationId: string;
  layoutId: string;
  layoutSlug: string;
  layoutName: string;
  layoutVersion: number;
  wallWidthMm: number;
  wallHeightMm: number;
  coverageLabel: string;
  physicalPrintCount: number;
  logicalArtworkCount: number;
  sizeBreakdown: Record<string, number>; // e.g. { A3: 3, A4: 4, A5: 8 }
  slots: Array<{
    slotId: string;
    slotType: SlotType;
    physicalSize: PosterSize;
    physicalWidthMm: number;
    physicalHeightMm: number;
    orientation: SlotOrientation;
    splitGroupId?: string | null;
    panelIndex?: number | null;
    artworkId?: string | null;
    artworkTitle?: string;
    imageUrl: string;
    thumbnailUrl?: string;
    isCustomUpload?: boolean;
    cropData?: CropData;
    panelNumber: number; // 1-indexed physical piece sequence
  }>;
  splitGroups: WallSplitGroup[];
  previewUrl?: string;
  calculatedPrice: number;
  compareAtPrice?: number;
  createdAt: string;
}

/**
 * Production Print Manifest for Order Fulfillment
 */
export interface ProductionPrintItem {
  itemNumber: number; // Physical print # 1, 2, 3...
  slotId: string;
  slotType: SlotType;
  title: string;
  physicalSize: PosterSize;
  widthMm: number;
  heightMm: number;
  orientation: SlotOrientation;
  isSplit: boolean;
  splitGroupTitle?: string;
  panelIndex?: number;
  totalPanels?: number;
  highResImageUrl: string;
  thumbnailUrl: string;
  isCustomUpload: boolean;
  cropData?: CropData;
}
