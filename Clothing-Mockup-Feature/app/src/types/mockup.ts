export interface GarmentImageMeta {
  path: string;
  width: number;
  height: number;
  png_color_type?: number;
  alpha_channel?: boolean;
  bytes?: number;
}

export interface GarmentSideMeta {
  garment: GarmentImageMeta;
  shadow: GarmentImageMeta;
}

export interface CatalogTemplate {
  name: string;
  mockup_id: number;
  front: GarmentSideMeta;
  back: GarmentSideMeta;
}

export interface ArtworkLayer {
  id: string;
  name: string;
  src: string; // base64 or object URL
  image: HTMLImageElement;
  // Position and transform relative to garment center (garment is 2048x2048)
  x: number; // Center X in garment space (0 to 2048)
  y: number; // Center Y in garment space (0 to 2048)
  width: number; // Base width in garment space
  height: number; // Base height in garment space
  scaleX: number; // Scale multiplier (1.0 default)
  scaleY: number;
  rotation: number; // Degrees
  opacity: number; // 0 to 1
  flipX: boolean;
  flipY: boolean;
  locked: boolean;
  visible: boolean;
  naturalWidth: number;
  naturalHeight: number;
  isOpaque?: boolean;
}

export type GarmentSide = 'front' | 'back';

export type BackgroundType = 'solid' | 'concrete1' | 'concrete2' | 'custom';

export interface BackgroundSettings {
  type: BackgroundType;
  color: string;
  customImageUrl?: string;
  customImageElement?: HTMLImageElement | null;
}

export interface LightingSettings {
  amount: number; // 0 to 100
  brightness: number; // -10 to 10
  contrast: number; // -10 to 10
  animated: boolean;
  frameIndex: number; // 0 to 179
}

export interface WarpSettings {
  enabled: boolean;
  strength: number; // 0 to 5, default 2.0
  blendFactor: number; // 0 to 0.6, default 0.25
}

export interface SideState {
  layers: ArtworkLayer[];
  selectedLayerId: string | null;
}

export interface ProjectState {
  templateId: number;
  activeSide: GarmentSide;
  garmentColor: string;
  warp: WarpSettings;
  background: BackgroundSettings;
  lighting: LightingSettings;
  front: SideState;
  back: SideState;
}

export interface SerializedLayer {
  id: string;
  name: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  flipX: boolean;
  flipY: boolean;
  locked: boolean;
  visible: boolean;
  naturalWidth: number;
  naturalHeight: number;
  isOpaque?: boolean;
}

export interface SerializedProject {
  version: string;
  timestamp: number;
  templateId: number;
  garmentColor: string;
  warp: WarpSettings;
  background: {
    type: BackgroundType;
    color: string;
    customImageUrl?: string;
  };
  lighting: LightingSettings;
  frontLayers: SerializedLayer[];
  backLayers: SerializedLayer[];
}

export interface ExportOptions {
  dimensions: '1200x1200' | '1920x1080' | '2048x2048' | '2560x1440' | '3840x2160';
  scope: 'current' | 'front' | 'back' | 'both_zip' | 'side_by_side';
  transparentBg: boolean;
  includeShadow: boolean;
}
