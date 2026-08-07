'use client';

import React from 'react';
import type { PhoneTemplate } from '@/hooks/usePhoneTemplate';

interface PhoneRendererProps {
  template: PhoneTemplate;
  /** Unique SVG filter ID suffix */
  filterId: string;
}

/**
 * PhoneRenderer — Renders the phone body: shadow, frame, body fill.
 * Pure visual chrome, no interactivity.
 */
export function PhoneRenderer({ template, filterId }: PhoneRendererProps) {
  const { bodyPath, dims, device } = template;
  const shadowFilterId = `phone-shadow-${filterId}`;
  const frameGradId = `phone-frame-${filterId}`;

  return (
    <>
      <defs>
        {/* Drop shadow for depth */}
        <filter id={shadowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="18" floodColor="#000000" floodOpacity="0.65" />
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
        </filter>

        {/* Subtle radial gradient for the phone body edge glow */}
        <radialGradient id={frameGradId} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#101010" />
        </radialGradient>
      </defs>

      {/* Outer shadow envelope */}
      <path d={bodyPath} fill={`url(#${frameGradId})`} filter={`url(#${shadowFilterId})`} />

      {/* Phone frame border */}
      <path d={bodyPath} fill="none" stroke="#2c2c2c" strokeWidth={dims.widthPx * 0.012} />

      {/* S-Pen silo indicator (Samsung Ultra/Note series) */}
      {device.sPenSilo && (
        <rect
          x={dims.widthPx * 0.92}
          y={dims.heightPx * 0.72}
          width={dims.widthPx * 0.035}
          height={dims.heightPx * 0.22}
          rx={dims.widthPx * 0.015}
          fill="#1a1a1a"
          stroke="#2a2a2a"
          strokeWidth={1}
        />
      )}
    </>
  );
}
