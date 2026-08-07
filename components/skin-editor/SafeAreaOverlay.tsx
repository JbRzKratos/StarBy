'use client';

import type { PhoneTemplate } from '@/hooks/usePhoneTemplate';

interface SafeAreaOverlayProps {
  template: PhoneTemplate;
  visible: boolean;
}

/**
 * SafeAreaOverlay — Renders print guide overlays.
 *
 * Three zones:
 * - RED dashed: cut line (device edge = body path)
 * - YELLOW dashed: bleed area (2mm outside edge)
 * - GREEN dashed: safe area (2.5mm inside edge)
 *
 * Photographers and designers use these to ensure important content
 * stays inside the safe area and all edges have bleed.
 *
 * Set data-export-hide="true" so this never appears in exported files.
 */
export function SafeAreaOverlay({ template, visible }: SafeAreaOverlayProps) {
  if (!visible) return null;

  const { bodyPath, safeAreaRect, bleedAreaRect, dims } = template;

  return (
    <g data-interactive-only="true" data-export-hide="true" style={{ pointerEvents: 'none' }}>
      {/* Bleed area (2mm outside — yellow) */}
      <rect
        x={bleedAreaRect.x}
        y={bleedAreaRect.y}
        width={bleedAreaRect.w}
        height={bleedAreaRect.h}
        rx={dims.widthPx * 0.2}
        fill="none"
        stroke="rgba(255, 200, 40, 0.7)"
        strokeWidth={1}
        strokeDasharray="4 3"
      />

      {/* Cut line (device edge — red, matches body shape) */}
      <path
        d={bodyPath}
        fill="none"
        stroke="rgba(255, 60, 60, 0.85)"
        strokeWidth={1.5}
        strokeDasharray="6 3"
      />

      {/* Safe area (2.5mm inset — green) */}
      <rect
        x={safeAreaRect.x}
        y={safeAreaRect.y}
        width={safeAreaRect.w}
        height={safeAreaRect.h}
        rx={Math.max(0, dims.widthPx * template.device.borderRadius - dims.scale * 2.5)}
        fill="none"
        stroke="rgba(80, 230, 120, 0.75)"
        strokeWidth={1}
        strokeDasharray="4 3"
      />

      {/* Legend labels */}
      <SafeAreaLabel
        x={bleedAreaRect.x + 4}
        y={bleedAreaRect.y - 4}
        color="rgba(255,200,40,0.9)"
        label="Bleed +2mm"
      />
      <SafeAreaLabel
        x={safeAreaRect.x + 4}
        y={safeAreaRect.y + 12}
        color="rgba(80,230,120,0.9)"
        label="Safe Area"
      />
    </g>
  );
}

function SafeAreaLabel({
  x,
  y,
  color,
  label,
}: {
  x: number;
  y: number;
  color: string;
  label: string;
}) {
  return (
    <text x={x} y={y} fill={color} fontSize={7} fontFamily="monospace" letterSpacing={0.3}>
      {label}
    </text>
  );
}
