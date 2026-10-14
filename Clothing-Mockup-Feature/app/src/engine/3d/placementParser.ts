import type { ArtworkLayer3D } from '../../types/threeD';
import type { ArtworkLayer, GarmentSide } from '../../types/mockup';

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

export interface GarmentPlacementCoords {
  u: number;
  v: number;
  uvWidth: number;
  regionId: 'front' | 'back';
  camera: 'front' | 'back';
}

export function parseNaturalLanguagePlacement(text: string): {
  placement: DesignPlacementTarget;
  scale: DesignScalePreset;
  matchedKeywords: string[];
} {
  const clean = text.toLowerCase().trim();
  const matchedKeywords: string[] = [];

  let placement: DesignPlacementTarget = 'front-center';
  let scale: DesignScalePreset | null = null;

  if (/\b(small|tiny|mini|compact|pocket size|subtle|minimal|micro)\b/.test(clean)) {
    scale = 'compact';
    matchedKeywords.push('compact size');
  } else if (/\b(oversized|huge|giant|big|large|bold|massive|statement|full)\b/.test(clean)) {
    scale = 'oversized';
    matchedKeywords.push('oversized scale');
  } else if (/\b(standard|medium|regular|normal|balanced)\b/.test(clean)) {
    scale = 'standard';
    matchedKeywords.push('standard scale');
  }

  // ── 2. Detect Granular Placement (Hierarchy: specific compound phrases first) ──
  if (
    /\b(right chest|right pocket|right breast|right front|wearer right|chest right)\b/.test(clean)
  ) {
    placement = 'right-chest';
    matchedKeywords.push('right chest');
  } else if (
    /\b(left chest|left pocket|pocket|left breast|left front|left side chest|wearer left|chest left|heart side|heart)\b/.test(
      clean
    )
  ) {
    placement = 'left-chest';
    matchedKeywords.push('left chest');
  } else if (
    /\b(back collar|collar back|nape|back of neck|neckline|upper back|top back|yoke|collar|neck)\b/.test(
      clean
    )
  ) {
    placement = 'back-collar';
    matchedKeywords.push('back collar');
  } else if (
    /\b(full back|all over back|giant back|huge back|big back|large back|entire back|back print big|oversized back)\b/.test(
      clean
    )
  ) {
    placement = 'full-back';
    matchedKeywords.push('full back');
  } else if (
    /\b(back center|center back|middle back|rear center|back middle|behind|rear|back)\b/.test(clean)
  ) {
    placement = 'back-center';
    matchedKeywords.push('back center');
  } else if (
    /\b(full front|all over front|giant front|huge front|big front|large front|entire front|front print big|oversized front)\b/.test(
      clean
    )
  ) {
    placement = 'full-front';
    matchedKeywords.push('full front');
  } else if (/\b(left sleeve|left arm|left shoulder)\b/.test(clean)) {
    placement = 'left-sleeve';
    matchedKeywords.push('left sleeve');
  } else if (/\b(right sleeve|right arm|right shoulder)\b/.test(clean)) {
    placement = 'right-sleeve';
    matchedKeywords.push('right sleeve');
  } else if (/\b(sleeve|arm|shoulder)\b/.test(clean)) {
    placement = 'left-sleeve';
    matchedKeywords.push('sleeve');
  } else if (
    /\b(bottom hem|lower hem|bottom waist|bottom|hem|waist|lower front|lower)\b/.test(clean)
  ) {
    placement = 'bottom-hem';
    matchedKeywords.push('bottom hem');
  } else if (
    /\b(center|front center|middle of chest|middle front|chest|front middle|front)\b/.test(clean)
  ) {
    placement = 'front-center';
    matchedKeywords.push('front center');
  }

  // ── 3. Default Scale based on Placement if not explicitly stated ──────────
  if (!scale) {
    if (placement === 'left-chest' || placement === 'right-chest' || placement === 'back-collar') {
      scale = 'compact';
    } else if (placement === 'full-front' || placement === 'full-back') {
      scale = 'oversized';
    } else {
      scale = 'standard';
    }
  }

  return { placement, scale, matchedKeywords };
}

export function getExactGarmentCoords(
  garmentId: string,
  target: DesignPlacementTarget,
  scalePreset: DesignScalePreset = 'standard'
): GarmentPlacementCoords {
  const normGarment = (garmentId || 'regular-t-shirt').toLowerCase();
  const isOversized = normGarment.includes('oversized') || normGarment.includes('acid-wash');
  const isHoodie = normGarment.includes('hoodie');

  const scaleMult = scalePreset === 'compact' ? 0.75 : scalePreset === 'oversized' ? 1.35 : 1.0;

  if (isOversized) {
    switch (target) {
      case 'left-chest':
        return {
          u: 0.814,
          v: 0.649,
          uvWidth: 0.12 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
      case 'right-chest':
        return {
          u: 0.682,
          v: 0.648,
          uvWidth: 0.12 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
      case 'front':
      case 'front-center':
        return {
          u: 0.749,
          v: 0.65,
          uvWidth: 0.28 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
      case 'full-front':
        return {
          u: 0.749,
          v: 0.63,
          uvWidth: 0.40 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
      case 'back-collar':
        return {
          u: 0.251,
          v: 0.38,
          uvWidth: 0.13 * scaleMult,
          regionId: 'back',
          camera: 'back',
        };
      case 'back':
      case 'back-center':
        return {
          u: 0.251,
          v: 0.263,
          uvWidth: 0.28 * scaleMult,
          regionId: 'back',
          camera: 'back',
        };
      case 'full-back':
        return {
          u: 0.251,
          v: 0.28,
          uvWidth: 0.40 * scaleMult,
          regionId: 'back',
          camera: 'back',
        };
      case 'left-sleeve':
      case 'sleeve':
        return {
          u: 0.19,
          v: 0.74,
          uvWidth: 0.18 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
      case 'right-sleeve':
        return {
          u: 0.76,
          v: 0.25,
          uvWidth: 0.18 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
      case 'bottom-hem':
        return {
          u: 0.749,
          v: 0.46,
          uvWidth: 0.28 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
      default:
        return {
          u: 0.749,
          v: 0.65,
          uvWidth: 0.28 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
    }
  }

  if (isHoodie) {
    switch (target) {
      case 'left-chest':
        return {
          u: 0.259,
          v: 0.361,
          uvWidth: 0.11 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
      case 'right-chest':
        return {
          u: 0.165,
          v: 0.361,
          uvWidth: 0.11 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
      case 'front':
      case 'front-center':
        return {
          u: 0.211,
          v: 0.362,
          uvWidth: 0.24 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
      case 'full-front':
        return {
          u: 0.211,
          v: 0.36,
          uvWidth: 0.32 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
      case 'back-collar':
        return {
          u: 0.204,
          v: 0.85,
          uvWidth: 0.12 * scaleMult,
          regionId: 'back',
          camera: 'back',
        };
      case 'back':
      case 'back-center':
        return {
          u: 0.204,
          v: 0.752,
          uvWidth: 0.26 * scaleMult,
          regionId: 'back',
          camera: 'back',
        };
      case 'full-back':
        return {
          u: 0.204,
          v: 0.74,
          uvWidth: 0.36 * scaleMult,
          regionId: 'back',
          camera: 'back',
        };
      case 'left-sleeve':
      case 'sleeve':
        return {
          u: 0.55,
          v: 0.82,
          uvWidth: 0.18 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
      case 'right-sleeve':
        return {
          u: 0.55,
          v: 0.47,
          uvWidth: 0.18 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
      case 'bottom-hem':
        return {
          u: 0.211,
          v: 0.22,
          uvWidth: 0.24 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
      default:
        return {
          u: 0.211,
          v: 0.362,
          uvWidth: 0.24 * scaleMult,
          regionId: 'front',
          camera: 'front',
        };
    }
  }

  // Default: regular-t-shirt
  switch (target) {
    case 'left-chest':
      return {
        u: 0.312,
        v: 0.638,
        uvWidth: 0.12 * scaleMult,
        regionId: 'front',
        camera: 'front',
      };
    case 'right-chest':
      return {
        u: 0.187,
        v: 0.638,
        uvWidth: 0.12 * scaleMult,
        regionId: 'front',
        camera: 'front',
      };
    case 'front':
    case 'front-center':
      return {
        u: 0.25,
        v: 0.64,
        uvWidth: 0.26 * scaleMult,
        regionId: 'front',
        camera: 'front',
      };
    case 'full-front':
      return {
        u: 0.25,
        v: 0.61,
        uvWidth: 0.38 * scaleMult,
        regionId: 'front',
        camera: 'front',
      };
    case 'back-collar':
      return {
        u: 0.758,
        v: 0.74,
        uvWidth: 0.13 * scaleMult,
        regionId: 'back',
        camera: 'back',
      };
    case 'back':
    case 'back-center':
      return {
        u: 0.758,
        v: 0.63,
        uvWidth: 0.26 * scaleMult,
        regionId: 'back',
        camera: 'back',
      };
    case 'full-back':
      return {
        u: 0.758,
        v: 0.61,
        uvWidth: 0.38 * scaleMult,
        regionId: 'back',
        camera: 'back',
      };
    case 'left-sleeve':
    case 'sleeve':
      return {
        u: 0.75,
        v: 0.24,
        uvWidth: 0.18 * scaleMult,
        regionId: 'front',
        camera: 'front',
      };
    case 'right-sleeve':
      return {
        u: 0.21,
        v: 0.24,
        uvWidth: 0.18 * scaleMult,
        regionId: 'front',
        camera: 'front',
      };
    case 'bottom-hem':
      return {
        u: 0.25,
        v: 0.44,
        uvWidth: 0.26 * scaleMult,
        regionId: 'front',
        camera: 'front',
      };
    default:
      return {
        u: 0.25,
        v: 0.64,
        uvWidth: 0.26 * scaleMult,
        regionId: 'front',
        camera: 'front',
      };
  }
}

export function buildLayerFromPlacement(
  garmentId: string,
  input: {
    id: string;
    name: string;
    imageUrl: string;
    placementTextOrTarget?: string | null;
    scalePresetOrText?: string | null;
  }
): ArtworkLayer3D {
  let targetPlacement: DesignPlacementTarget = 'front-center';
  let targetScale: DesignScalePreset = 'standard';

  const rawText = `${input.placementTextOrTarget || ''} ${input.scalePresetOrText || ''}`.trim();
  if (rawText) {
    const parsed = parseNaturalLanguagePlacement(rawText);
    targetPlacement = parsed.placement;
    targetScale = parsed.scale;
  }

  const coords = getExactGarmentCoords(garmentId, targetPlacement, targetScale);
  const scale = parseFloat((coords.uvWidth / 0.35).toFixed(4));

  return {
    id: input.id,
    name: input.name,
    regionId: coords.regionId,
    imageUrl: input.imageUrl,
    placementMode: 'atlas',
    u: coords.u,
    v: coords.v,
    uvWidth: coords.uvWidth,
    uvHeight: coords.uvWidth,
    offsetX: parseFloat(((coords.u - 0.5) * 2).toFixed(3)),
    offsetY: parseFloat(((coords.v - 0.5) * 2).toFixed(3)),
    scale,
    rotation: 0,
    opacity: 1.0,
    lockAspectRatio: true,
    placementTarget: targetPlacement,
    scalePreset: targetScale,
  };
}

export interface Garment2DPlacementCoords {
  x: number;      // 0..2048
  y: number;      // 0..2048
  width: number;  // px in 2048 canvas
  height: number; // px in 2048 canvas
  side: GarmentSide;
  region: 'front' | 'back' | 'sleeve';
}

export function get2DPlacementCoords(
  target: string,
  scalePreset: DesignScalePreset = 'standard',
  naturalWidth: number = 1000,
  naturalHeight: number = 1000
): Garment2DPlacementCoords {
  const isBack =
    target === 'back' ||
    target === 'back-center' ||
    target === 'back-collar' ||
    target === 'full-back';
  const isSleeve = target.includes('sleeve');
  const side: GarmentSide = isBack ? 'back' : 'front';
  const region: 'front' | 'back' | 'sleeve' = isBack ? 'back' : isSleeve ? 'sleeve' : 'front';

  let scaleMult = scalePreset === 'compact' ? 0.65 : scalePreset === 'oversized' ? 1.35 : 1.0;

  let x = 1024;
  let y = 920;
  let baseSize = 600;

  switch (target) {
    case 'left-chest':
      x = 830; // wearer left chest (viewer left/pocket)
      y = 740;
      baseSize = 340;
      break;
    case 'right-chest':
      x = 1218; // wearer right chest
      y = 740;
      baseSize = 340;
      break;
    case 'full-front':
      x = 1024;
      y = 980;
      baseSize = 750;
      break;
    case 'bottom-hem':
      x = 1024;
      y = 1450;
      baseSize = 520;
      break;
    case 'left-sleeve':
      x = 520;
      y = 860;
      baseSize = 380;
      break;
    case 'right-sleeve':
      x = 1528;
      y = 860;
      baseSize = 380;
      break;
    case 'back-collar':
      x = 1024;
      y = 620;
      baseSize = 320;
      break;
    case 'full-back':
      x = 1024;
      y = 980;
      baseSize = 780;
      break;
    case 'back':
    case 'back-center':
      x = 1024;
      y = 920;
      baseSize = 620;
      break;
    case 'front':
    case 'front-center':
    default:
      x = 1024;
      y = 920;
      baseSize = 600;
      break;
  }

  const targetDim = Math.round(baseSize * scaleMult);
  const aspect = (naturalWidth || 1000) / (naturalHeight || 1000);
  let width = targetDim;
  let height = targetDim;

  if (aspect >= 1) {
    width = targetDim;
    height = Math.round(targetDim / aspect);
  } else {
    height = targetDim;
    width = Math.round(targetDim * aspect);
  }

  return { x, y, width, height, side, region };
}

export function build2DLayerFromPlacement(
  input: {
    id: string;
    name: string;
    imageUrl: string;
    image?: HTMLImageElement;
    placementTextOrTarget?: string | null;
    scalePresetOrText?: string | null;
  }
): { side: GarmentSide; layer: ArtworkLayer } {
  let targetPlacement: DesignPlacementTarget = 'front-center';
  let targetScale: DesignScalePreset = 'standard';

  const rawText = `${input.placementTextOrTarget || ''} ${input.scalePresetOrText || ''}`.trim();
  if (rawText) {
    const parsed = parseNaturalLanguagePlacement(rawText);
    targetPlacement = parsed.placement;
    targetScale = parsed.scale;
  }

  const img = input.image || new Image();
  if (!input.image) {
    img.crossOrigin = 'anonymous';
    img.src = input.imageUrl;
  }

  const coords = get2DPlacementCoords(
    targetPlacement,
    targetScale,
    img.naturalWidth || 1000,
    img.naturalHeight || 1000
  );

  const layer: ArtworkLayer = {
    id: input.id,
    name: input.name,
    src: input.imageUrl,
    image: img,
    x: coords.x,
    y: coords.y,
    width: coords.width,
    height: coords.height,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    flipX: false,
    flipY: false,
    locked: false,
    visible: true,
    naturalWidth: img.naturalWidth || 1000,
    naturalHeight: img.naturalHeight || 1000,
    isOpaque: false,
  };

  return { side: coords.side, layer };
}
