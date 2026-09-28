export type GarmentCategory3D = 't-shirts' | 'hoodies' | 'pants' | 'headwear';

export interface PrintableRegion3D {
  id: string;
  name: string;
  uvCenter: [number, number]; // [U, V] normalized 0..1
  uvSpan: [number, number];   // [width, height] normalized 0..1
  description?: string;
}

export interface Garment3DConfig {
  id: string;
  name: string;
  category: GarmentCategory3D;
  modelFilename: string; // e.g. 'Regular_T-Shirt.glb'
  modelPath: string;     // e.g. '/3d-assets/GLB/Regular_T-Shirt.glb'
  thumbnailPath: string; // e.g. '/3d-assets/GLB/Product_Images/regular-t-shirt.jpg'
  garmentNodeName: string; // Node name in GLTF containing the garment mesh
  neckTagNodeName?: string; // Node name for neck tag if present
  positionNodeName: string; // ModelPosition node name
  masterClipName: string;  // e.g. 'WALK' or 'WALK_Hoodie'
  textures: {
    diffuse: string;
    normal: string;
    roughness: string;
  };
  regions: PrintableRegion3D[];
  cameraDefaults: {
    target: [number, number, number];
    distance: number;
    fov: number;
  };
  wiggleBoneNames?: string[];
  description: string;
}

export type PlacementMode3D = 'atlas' | 'surface' | 'region';

export type SurfaceProjectorPreset =
  | 'chest_to_sleeve'
  | 'chest_to_left_sleeve'
  | 'torso_front'
  | 'torso_back'
  | 'sleeve_right'
  | 'sleeve_left'
  | 'chest-to-sleeve'
  | 'front-center'
  | 'back-center'
  | 'custom';

export interface SurfaceProjectorConfig {
  preset: SurfaceProjectorPreset;
  posX: number;       // 3D position X in rest pose (model units)
  posY: number;       // 3D position Y in rest pose
  posZ: number;       // 3D position Z in rest pose
  dirX: number;       // Projection direction X
  dirY: number;       // Projection direction Y
  dirZ: number;       // Projection direction Z
  sizeX: number;      // Projection width span
  sizeY: number;      // Projection height span
  facingAngle: number; // Normal angle cutoff (-0.2 to 0.5) to prevent projection through the garment
  depth?: number;     // Projection depth penetration
}

export interface ArtworkLayer3D {
  id: string;
  name: string;
  regionId: string;
  imageUrl: string;
  placementMode?: PlacementMode3D; // 'atlas' (unrestricted full UV) | 'surface' (cross-seam projection) | 'region'
  // Direct UV Coordinates (for Full Atlas mode)
  u?: number;          // Center U on atlas (0..1, allows negative/out of bounds)
  v?: number;          // Center V on atlas (0..1, allows negative/out of bounds)
  uvWidth?: number;    // Width on atlas (normalized 0..1)
  uvHeight?: number;   // Height on atlas (normalized 0..1)
  lockAspectRatio?: boolean;
  // Region-relative coordinates (legacy & region-safe mode)
  offsetX: number;     // offset from region center (-1 to 1)
  offsetY: number;     // offset from region center (-1 to 1)
  scale: number;       // relative scale factor (0.1 to 3.0)
  rotation: number;    // in degrees (-180 to 180)
  opacity: number;     // 0 to 1
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  // Cross-seam 3D Surface Projector configuration
  surfaceProjector?: SurfaceProjectorConfig;
}

export type AnimationActionName = 'IDLE' | 'WALK' | 'DANCE' | 'RUN' | 'FIGHTER' | 'STRUT';

export type CameraPreset3D = 'front' | 'back' | 'left' | 'right' | 'threeQuarter' | 'top' | 'custom';

export interface LightingConfig3D {
  hdrIntensity: number;
  sunIntensity: number;
  ambientIntensity: number;
  sunAzimuth: number; // in degrees
  sunElevation: number; // in degrees
  shadowIntensity: number;
  bgColor: string;
  isTransparentBg: boolean;
}

export interface ProjectState3D {
  version: number;
  id: string;
  name: string;
  updatedAt: string;
  garmentId: string;
  garmentColor: string;
  roughness: number;
  metalness: number;
  artworkLayers: ArtworkLayer3D[];
  activeRegionId: string;
  isAnimated: boolean;
  currentAction: AnimationActionName;
  isPlaying: boolean;
  playbackSpeed: number;
  secondaryMotionEnabled: boolean;
  lighting: LightingConfig3D;
  camera: {
    preset: CameraPreset3D;
    turntable: boolean;
    turntableSpeed: number;
  };
}
