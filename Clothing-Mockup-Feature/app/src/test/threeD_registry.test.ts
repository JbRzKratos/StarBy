import { describe, it, expect } from 'vitest';
import { GARMENT_3D_CATALOG, getGarmentConfig } from '../engine/3d/registry';
import { ANIMATION_ACTION_RANGES } from '../engine/3d/animationController';

describe('3D Garment Registry & Action Verification', () => {
  it('contains exactly 11 audited 3D garments with unique IDs', () => {
    expect(GARMENT_3D_CATALOG.length).toBe(11);
    const ids = GARMENT_3D_CATALOG.map((g) => g.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(11);
  });

  it('verifies all 11 model filenames match requirements', () => {
    const expectedFilenames = [
      'Regular_T-Shirt.glb',
      'Oversized_T-Shirt.glb',
      'Fitted_T-Shirt.glb',
      'Hoodie.glb',
      'Zip_Hoodie.glb',
      'Sweatshirt.glb',
      'Sweatpants.glb',
      'Jeans.glb',
      'tank-top.glb',
      'Cap.glb',
      'Balaclava.glb',
    ];

    const catalogFilenames = GARMENT_3D_CATALOG.map((g) => g.modelFilename);
    for (const filename of expectedFilenames) {
      expect(catalogFilenames).toContain(filename);
    }
  });

  it('validates each garment has complete texture maps and printable regions', () => {
    for (const garment of GARMENT_3D_CATALOG) {
      expect(garment.textures.diffuse).toBeTruthy();
      expect(garment.textures.normal).toBeTruthy();
      expect(garment.textures.roughness).toBeTruthy();

      expect(garment.regions.length).toBeGreaterThanOrEqual(1);
      for (const region of garment.regions) {
        expect(region.uvCenter[0]).toBeGreaterThanOrEqual(0);
        expect(region.uvCenter[0]).toBeLessThanOrEqual(1);
        expect(region.uvCenter[1]).toBeGreaterThanOrEqual(0);
        expect(region.uvCenter[1]).toBeLessThanOrEqual(1);
        expect(region.uvSpan[0]).toBeGreaterThan(0);
        expect(region.uvSpan[1]).toBeGreaterThan(0);
      }

      expect(garment.cameraDefaults.distance).toBeGreaterThan(0);
      expect(garment.cameraDefaults.fov).toBeGreaterThan(0);
    }
  });

  it('validates all 6 reconstructed animation action frame ranges', () => {
    expect(ANIMATION_ACTION_RANGES.length).toBe(6);

    const expectedActions = [
      { name: 'IDLE', startFrame: 0, endFrame: 2, fps: 30 },
      { name: 'WALK', startFrame: 3, endFrame: 34, fps: 30 },
      { name: 'DANCE', startFrame: 35, endFrame: 70, fps: 30 },
      { name: 'RUN', startFrame: 71, endFrame: 114, fps: 30 },
      { name: 'FIGHTER', startFrame: 115, endFrame: 281, fps: 30 },
      { name: 'STRUT', startFrame: 282, endFrame: 327, fps: 30 },
    ];

    for (let i = 0; i < expectedActions.length; i++) {
      expect(ANIMATION_ACTION_RANGES[i].name).toBe(expectedActions[i].name);
      expect(ANIMATION_ACTION_RANGES[i].startFrame).toBe(expectedActions[i].startFrame);
      expect(ANIMATION_ACTION_RANGES[i].endFrame).toBe(expectedActions[i].endFrame);
      expect(ANIMATION_ACTION_RANGES[i].fps).toBe(expectedActions[i].fps);
    }
  });

  it('retrieves garment configuration safely with fallback', () => {
    const regular = getGarmentConfig('regular-t-shirt');
    expect(regular.name).toBe('Regular T-Shirt');

    const fallback = getGarmentConfig('non-existent-item');
    expect(fallback).toBeDefined();
    expect(fallback.id).toBe('regular-t-shirt');
  });

  it('validates anatomically verified front chest and upper back UV coordinates', () => {
    const regular = getGarmentConfig('regular-t-shirt');
    const regFront = regular.regions.find((r) => r.id === 'front');
    const regBack = regular.regions.find((r) => r.id === 'back');
    expect(regFront?.uvCenter).toEqual([0.25, 0.65]);
    expect(regBack?.uvCenter).toEqual([0.75, 0.64]);

    const oversized = getGarmentConfig('oversized-t-shirt');
    const overFront = oversized.regions.find((r) => r.id === 'front');
    const overBack = oversized.regions.find((r) => r.id === 'back');
    expect(overFront?.uvCenter).toEqual([0.75, 0.66]);
    expect(overBack?.uvCenter).toEqual([0.25, 0.28]);

    const fitted = getGarmentConfig('fitted-t-shirt');
    const fitFront = fitted.regions.find((r) => r.id === 'front');
    const fitBack = fitted.regions.find((r) => r.id === 'back');
    expect(fitFront?.uvCenter).toEqual([0.26, 0.59]);
    expect(fitBack?.uvCenter).toEqual([0.74, 0.35]);
  });
});
