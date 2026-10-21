import type { ArtworkLayer3D } from '../../types/threeD';

export type ArtworkSide = 'front' | 'back' | 'left-sleeve' | 'right-sleeve';

/**
 * Resolve which physical surface an artwork layer was placed on.
 *
 * `placementTarget` is authoritative because sleeve layers intentionally keep
 * `regionId: 'front'` (the UV atlas region) while their target identifies the
 * actual sleeve. Falling back to `u >= 0.5` used to misclassify right-sleeve
 * artwork as a back print, so it is deliberately not used here.
 */
export function getArtworkSide(
  layer: Pick<ArtworkLayer3D, 'regionId' | 'placementTarget' | 'name'>,
): ArtworkSide {
  const target = (layer.placementTarget || '').toLowerCase().replace(/_/g, '-');
  const name = (layer.name || '').toLowerCase();
  const region = (layer.regionId || '').toLowerCase();

  if (target.includes('right') && target.includes('sleeve')) return 'right-sleeve';
  if (target.includes('left') && target.includes('sleeve')) return 'left-sleeve';
  if (target.includes('sleeve')) {
    return name.includes('right') ? 'right-sleeve' : 'left-sleeve';
  }
  if (name.includes('right sleeve') || name.includes('right-sleeve')) return 'right-sleeve';
  if (name.includes('left sleeve') || name.includes('left-sleeve')) return 'left-sleeve';
  if (region.includes('back') || target.includes('back')) return 'back';
  return 'front';
}

export function artworkSideLabel(side: ArtworkSide): string {
  switch (side) {
    case 'back':
      return 'Back';
    case 'left-sleeve':
      return 'Left Sleeve';
    case 'right-sleeve':
      return 'Right Sleeve';
    case 'front':
    default:
      return 'Front';
  }
}
