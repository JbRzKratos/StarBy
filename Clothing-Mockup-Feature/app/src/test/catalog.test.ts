import { describe, it, expect } from 'vitest';
import { CATALOG, getTemplateById, getGarmentUrl, getShadowUrl } from '../data/catalog';

describe('2D Mockup Catalog', () => {
  it('contains all 17 mockup catalog templates', () => {
    expect(CATALOG.length).toBe(17);
  });

  it('retrieves the default Oversized Heavyweight Tee (mockup_id 18)', () => {
    const template = getTemplateById(18);
    expect(template).toBeDefined();
    expect(template.mockup_id).toBe(18);
    expect(template.name.toLowerCase()).toContain('oversized heavyweight');

    const frontGarment = getGarmentUrl(18, 'front');
    const frontShadow = getShadowUrl(18, 'front');
    const backGarment = getGarmentUrl(18, 'back');
    const backShadow = getShadowUrl(18, 'back');

    expect(frontGarment).toBe('/designs/18.png');
    expect(frontShadow).toBe('/designs/18_shadow.png');
    expect(backGarment).toBe('/designs/19.png');
    expect(backShadow).toBe('/designs/19_shadow.png');
  });

  it('ensures every catalog entry has valid front and back garments and shadows', () => {
    CATALOG.forEach((item) => {
      expect(item.mockup_id).toBeGreaterThan(0);
      expect(item.front.garment.path).toBeTruthy();
      expect(item.front.shadow.path).toBeTruthy();
      expect(item.back.garment.path).toBeTruthy();
      expect(item.back.shadow.path).toBeTruthy();

      expect(item.front.garment.width).toBe(2048);
      expect(item.front.garment.height).toBe(2048);
    });
  });
});
