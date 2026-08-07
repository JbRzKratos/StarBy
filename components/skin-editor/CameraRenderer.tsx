'use client';

import React from 'react';
import type { PhoneTemplate } from '@/hooks/usePhoneTemplate';
import type { CameraGeometry } from '@/lib/skin-engine/svgPath';

interface CameraRendererProps {
  template: PhoneTemplate;
  filterId: string;
}

/**
 * CameraRenderer — Renders the camera module on top of artwork.
 *
 * Render order (back to front):
 * 1. Camera island housing (dark fill)
 * 2. Lens housings (dark with rim)
 * 3. Lens glass (gradient blue-tinted circle)
 * 4. Lens highlight (small white arc)
 * 5. Flash module (warm orange tint)
 * 6. Sensor dots
 */
export function CameraRenderer({ template, filterId }: CameraRendererProps) {
  const { cameraGeo, device } = template;

  if (!cameraGeo || !device.cameraModule) return null;

  const cam = device.cameraModule;
  const { islandPath, lensPaths, flashPath, islandX, islandY, islandW, islandH } = cameraGeo;

  const lensGlassGradId = `lens-glass-${filterId}`;
  const islandShadowId = `island-shadow-${filterId}`;
  const lensGlossGradId = `lens-gloss-${filterId}`;

  return (
    <>
      <defs>
        {/* Camera island drop shadow */}
        <filter id={islandShadowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.7" />
        </filter>

        {/* Lens glass gradient — realistic dark teal glass */}
        <radialGradient id={lensGlassGradId} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#1a2535" />
          <stop offset="45%" stopColor="#0d1520" />
          <stop offset="100%" stopColor="#060c14" />
        </radialGradient>

        {/* Lens gloss — small highlight arc */}
        <radialGradient id={lensGlossGradId} cx="30%" cy="25%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Camera island housing */}
      <path
        d={islandPath}
        fill="#0a0a0a"
        stroke="#1e1e1e"
        strokeWidth={1.5}
        filter={`url(#${islandShadowId})`}
      />

      {/* Inner raised area (depth effect) */}
      {cam.shape !== 'strip-vertical' && (
        <path
          d={islandPath}
          fill="none"
          stroke="#252525"
          strokeWidth={1}
          transform={`translate(0, 0.5)`}
        />
      )}

      {/* Lens apertures */}
      {lensPaths.map((lensPath, i) => (
        <g key={i}>
          {/* Lens outer ring */}
          <path d={lensPath} fill="#0f0f0f" stroke="#1a1a1a" strokeWidth={1.5} />
          {/* Lens inner ring */}
          <path
            d={lensPath}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth={0.8}
            transform={`scale(0.85) translate(${((islandX + islandW / 2) * 0.15) / 0.85} ${((islandY + islandH / 2) * 0.15) / 0.85})`}
          />
          {/* Lens glass */}
          <path d={lensPath} fill={`url(#${lensGlassGradId})`} />
          {/* Lens gloss highlight */}
          <path d={lensPath} fill={`url(#${lensGlossGradId})`} />
          {/* Lens reflection dot (small bright specular) */}
          {null /* rendered via gradient above */}
        </g>
      ))}

      {/* Flash module */}
      {flashPath && (
        <g>
          <path d={flashPath} fill="#1a1008" stroke="#252010" strokeWidth={1} />
          {/* Warm glow */}
          <path d={flashPath} fill="rgba(255,200,80,0.15)" />
          {/* Flash gloss */}
          <path d={flashPath} fill="rgba(255,255,255,0.08)" />
        </g>
      )}

      {/* Lidar/depth sensor (for Pro models — appears near flash) */}
      {device.id.includes('pro') && flashPath && (
        <LidarSensor cameraGeo={cameraGeo} filterId={filterId} />
      )}
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function LidarSensor({ cameraGeo }: { cameraGeo: CameraGeometry; filterId: string }) {
  const { islandX, islandY, islandW, islandH } = cameraGeo;
  // Lidar typically appears in the lower-left of the camera island
  const cx = islandX + islandW * 0.15;
  const cy = islandY + islandH * 0.8;
  const r = islandW * 0.055;

  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#0a0a0a" stroke="#1a1a1a" strokeWidth={0.8} />
      <circle cx={cx} cy={cy} r={r * 0.6} fill="#111820" />
      <circle cx={cx - r * 0.25} cy={cy - r * 0.25} r={r * 0.2} fill="rgba(255,255,255,0.12)" />
    </g>
  );
}
