import { describe, it, expect } from 'vitest';
import { checkEffectiveResolution } from '../engine/validation';

describe('Layer Transformations and Resolution', () => {
  it('correctly calculates effective DPI resolution quality', () => {
    // Normal size: 600x600 placed at 500x500 (scale ~0.83x)
    const normal = checkEffectiveResolution(600, 600, 500, 500);
    expect(normal.dpiQuality).toBe('high');
    expect(normal.warning).toBeUndefined();

    // Medium enlarged: 600x600 placed at 900x900 (scale 1.5x)
    const medium = checkEffectiveResolution(600, 600, 900, 900);
    expect(medium.dpiQuality).toBe('good');

    // Excessively enlarged: 200x200 placed at 800x800 (scale 4.0x)
    const low = checkEffectiveResolution(200, 200, 800, 800);
    expect(low.dpiQuality).toBe('low');
    expect(low.warning).toContain('pixelated');
  });

  it('correctly calculates local coordinate rotation un-projection', () => {
    const layerX = 1024;
    const layerY = 1024;
    const rotDeg = 90; // 90 degrees clockwise
    const rad = (rotDeg * Math.PI) / 180.0;
    const cosT = Math.cos(rad);
    const sinT = Math.sin(rad);

    // Click at point (1024, 1124) which is 100px below center in garment space
    const clickX = 1024;
    const clickY = 1124;

    const dx = clickX - layerX;
    const dy = clickY - layerY;

    // Unrotate by -90 deg:
    const lx = dx * cosT + dy * sinT;
    const ly = -dx * sinT + dy * cosT;

    // After 90 deg rotation, a point directly below (dy=100) un-rotates to lx=100, ly=0
    expect(Math.round(lx)).toBe(100);
    expect(Math.round(ly)).toBe(0);
  });
});
