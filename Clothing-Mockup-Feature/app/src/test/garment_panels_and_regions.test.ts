import { describe, it, expect } from 'vitest';
import { GARMENT_3D_CATALOG } from '../engine/3d/registry';
import {
  VERIFIED_GARMENT_PANELS,
  getGarmentPanels,
  findPanelAtUV,
  findPanelById,
} from '../engine/3d/garmentPanels';

describe('3D Garment Panels & UV Region Verification', () => {
  it('covers all 11 catalog garments with dedicated verified panel sets', () => {
    expect(GARMENT_3D_CATALOG.length).toBe(11);
    GARMENT_3D_CATALOG.forEach((garment) => {
      const panels = getGarmentPanels(garment.id);
      expect(panels).toBeDefined();
      expect(panels.length).toBeGreaterThanOrEqual(4);
      expect(VERIFIED_GARMENT_PANELS[garment.id]).toBeDefined();
    });
  });

  it('ensures no user-facing panel names have axis suffixes (-X, +X)', () => {
    Object.entries(VERIFIED_GARMENT_PANELS).forEach(([garmentId, panels]) => {
      panels.forEach((p) => {
        expect(p.name, `${garmentId} panel ${p.id} contains -X`).not.toContain('(-X)');
        expect(p.name, `${garmentId} panel ${p.id} contains +X`).not.toContain('(+X)');
      });
    });
  });

  it('ensures all panel anchors and bounds are in the normalized [0, 1] range', () => {
    Object.entries(VERIFIED_GARMENT_PANELS).forEach(([_garmentId, panels]) => {
      panels.forEach((p) => {
        expect(p.u).toBeGreaterThanOrEqual(0);
        expect(p.u).toBeLessThanOrEqual(1);
        expect(p.v).toBeGreaterThanOrEqual(0);
        expect(p.v).toBeLessThanOrEqual(1);

        expect(p.minU).toBeGreaterThanOrEqual(0);
        expect(p.maxU).toBeLessThanOrEqual(1);
        expect(p.minV).toBeGreaterThanOrEqual(0);
        expect(p.maxV).toBeLessThanOrEqual(1);

        expect(p.minU).toBeLessThanOrEqual(p.maxU);
        expect(p.minV).toBeLessThanOrEqual(p.maxV);
      });
    });
  });

  it('ensures every garment printable region maps to valid UV center inside an island', () => {
    GARMENT_3D_CATALOG.forEach((garment) => {
      garment.regions.forEach((region) => {
        const [u, v] = region.uvCenter;
        expect(u).toBeGreaterThanOrEqual(0);
        expect(u).toBeLessThanOrEqual(1);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);

        // Verify the region resolves to a valid panel
        const panel = findPanelAtUV(garment.id, u, v);
        expect(
          panel,
          `Region ${region.name} (${region.id}) on ${garment.id} at [${u}, ${v}] must match a panel`
        ).not.toBeNull();
      });
    });
  });

  it('verifies wearer-relative orientation on regular t-shirt and oversized t-shirt', () => {
    // Regular T-Shirt: Left Sleeve (+X) at U ~ 0.75, Right Sleeve (-X) at U ~ 0.21
    const regPanels = getGarmentPanels('regular-t-shirt');
    const regLeft = regPanels.find((p) => p.id === 'left_sleeve')!;
    const regRight = regPanels.find((p) => p.id === 'right_sleeve')!;
    expect(regLeft.name).toBe('Left Sleeve');
    expect(regRight.name).toBe('Right Sleeve');
    expect(regLeft.u).toBeGreaterThan(regRight.u);

    // Oversized T-Shirt has inverted layout (Front at U ~ 0.75, Back at U ~ 0.25)
    const overPanels = getGarmentPanels('oversized-t-shirt');
    const overFront = overPanels.find((p) => p.id === 'front_body')!;
    const overBack = overPanels.find((p) => p.id === 'back_body')!;
    expect(overFront.name).toBe('Front Body');
    expect(overBack.name).toBe('Back Body');
    expect(overFront.u).toBeGreaterThan(overBack.u);
  });

  it('findPanelById retrieves expected panels', () => {
    const hoodie = findPanelById('hoodie', 'hood');
    expect(hoodie).not.toBeNull();
    expect(hoodie?.name).toBe('Hood');

    const pocket = findPanelById('hoodie', 'pocket');
    expect(pocket).not.toBeNull();
    expect(pocket?.name).toBe('Kangaroo Pocket');

    const zipLeft = findPanelById('zip-hoodie', 'front_left');
    expect(zipLeft).not.toBeNull();
    expect(zipLeft?.name).toBe('Front Left Body');
  });
});

