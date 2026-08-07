'use client';

import React, { useEffect, useRef } from 'react';
import type { ArtworkTransform } from '@/lib/skin-engine/transformMatrix';
import { transformToSVGString } from '@/lib/skin-engine/transformMatrix';

interface ArtworkLayerProps {
  imageUrl: string;
  clipId: string;
  transform: ArtworkTransform;
  artNaturalSize: { w: number; h: number } | null;
  onImageLoad: (naturalW: number, naturalH: number) => void;
  onPointerDown: (e: React.PointerEvent<SVGElement>) => void;
  onWheel: (e: React.WheelEvent<SVGElement>) => void;
}

/**
 * ArtworkLayer — Renders the user's artwork inside the phone body clip path.
 *
 * Uses an SVG <image> element with a transform derived from ArtworkTransform.
 * The image is wrapped in a <g clipPath="..."> so it never bleeds outside the phone.
 */
export function ArtworkLayer({
  imageUrl,
  clipId,
  transform,
  artNaturalSize,
  onImageLoad,
  onPointerDown,
  onWheel,
}: ArtworkLayerProps) {
  const imgRef = useRef<SVGImageElement>(null);

  // Detect natural image dimensions on load
  useEffect(() => {
    if (!imageUrl) return;
    const img = new window.Image();
    img.onload = () => onImageLoad(img.naturalWidth, img.naturalHeight);
    img.src = imageUrl;
  }, [imageUrl, onImageLoad]);

  if (!artNaturalSize) return null;

  const { w: artW, h: artH } = artNaturalSize;
  const svgTransform = transformToSVGString(transform, artW, artH);

  return (
    <g clipPath={`url(#${clipId})`} style={{ cursor: 'grab' }}>
      <image
        ref={imgRef}
        href={imageUrl}
        x={0}
        y={0}
        width={artW}
        height={artH}
        transform={svgTransform}
        preserveAspectRatio="none"
        style={{ cursor: 'grab', userSelect: 'none' }}
        onPointerDown={onPointerDown}
        onWheel={onWheel}
      />
    </g>
  );
}
