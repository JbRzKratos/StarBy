import { describe, it, expect } from 'vitest';

/**
 * Pure mathematical model test for artwork lighting integration:
 * - Macro fold illumination
 * - Cotton weave micro-texture
 * - Bounded ridge sheen for dark/black ink
 * - Luminance & color preservation
 */
describe('Artwork Surface Lighting Model Calculations', () => {
  const evaluateInkLighting = (
    r: number,
    g: number,
    b: number,
    a: number,
    smoothLuma: number,
    rawLuma: number,
    blendFactor: number = 0.5
  ) => {
    // 1. Broad macroscopic fold illumination normalized to neutral garment midtone 0.55
    const foldRatio = smoothLuma / 0.55;

    let foldShade = 1.0;
    if (blendFactor > 0) {
      if (foldRatio < 1.0) {
        foldShade = 1.0 + (foldRatio - 1.0) * (blendFactor * 1.10);
      } else {
        foldShade = 1.0 + (foldRatio - 1.0) * (blendFactor * 0.72);
      }
    }

    // 2. High-frequency fabric weave micro-texture (zero-centered)
    const weaveDelta = Math.max(-0.25, Math.min(0.25, (rawLuma - smoothLuma) / 0.55));
    const weaveMod = 1.0 + weaveDelta * (0.36 * blendFactor);

    // 3. Conversion to linear color space
    const rLin = Math.pow(r / 255.0, 2.2);
    const gLin = Math.pow(g / 255.0, 2.2);
    const bLin = Math.pow(b / 255.0, 2.2);
    const cMax = Math.max(rLin, gLin, bLin);

    // 4. Physical diffuse reflectance floor for black/dark ink:
    // Real screenprinting pigment reflects diffuse ambient light and reveals underlying thread structure.
    // Pure black is not a digital void; it reflects ~3.8% in linear space, allowing weave and folds through.
    // Applied strictly to dark achromatic inks (cMax < 0.25) so saturated colors remain 100% pure.
    const darkFloor = 0.038 * Math.max(0, 1.0 - cMax * 4.0);
    const effR = Math.max(rLin, darkFloor);
    const effG = Math.max(gLin, darkFloor);
    const effB = Math.max(bLin, darkFloor);

    // 5. Subtle, bounded surface sheen on illuminated fold ridges and weave peaks:
    let sheen = 0;
    if (blendFactor > 0) {
      const ridgeCatch = Math.max(0, foldRatio - 1.0) * 0.040;
      const threadCatch = Math.max(0, weaveDelta) * 0.036;
      sheen = (ridgeCatch + threadCatch) * Math.max(0, 1.0 - cMax * 2.0) * blendFactor;
    }

    // 6. Lit linear color channels
    const litR = effR * foldShade * weaveMod + sheen;
    const litG = effG * foldShade * weaveMod + sheen;
    const litB = effB * foldShade * weaveMod + sheen;

    // 7. Convert back to sRGB (1/2.2)
    const outR = Math.min(255, Math.max(0, Math.round(Math.pow(Math.max(0, litR), 1.0 / 2.2) * 255.0)));
    const outG = Math.min(255, Math.max(0, Math.round(Math.pow(Math.max(0, litG), 1.0 / 2.2) * 255.0)));
    const outB = Math.min(255, Math.max(0, Math.round(Math.pow(Math.max(0, litB), 1.0 / 2.2) * 255.0)));

    return {
      r: outR,
      g: outG,
      b: outB,
      a: Math.round(a),
    };
  };

  it('modulates white ink across folds without turning it permanently dull', () => {
    // In fold valley (smoothLuma = 0.35):
    const valley = evaluateInkLighting(255, 255, 255, 255, 0.35, 0.35, 0.5);
    // On illuminated fold ridge (smoothLuma = 0.75):
    const ridge = evaluateInkLighting(255, 255, 255, 255, 0.75, 0.75, 0.5);
    // On flat neutral midtone (smoothLuma = 0.55):
    const flat = evaluateInkLighting(255, 255, 255, 255, 0.55, 0.55, 0.5);

    // Valley must be darker than ridge
    expect(valley.r).toBeLessThan(ridge.r);
    // Valley white ink darkens naturally (~200-230)
    expect(valley.r).toBeGreaterThanOrEqual(195);
    expect(valley.r).toBeLessThan(235);
    // Flat area remains bright white
    expect(flat.r).toBe(255);
    // Ridge remains bright white without blowout
    expect(ridge.r).toBe(255);
  });

  it('imparts authentic fabric texture, fold response, and matte sheen to black ink', () => {
    // In fold valley (smoothLuma = 0.35):
    const valley = evaluateInkLighting(0, 0, 0, 255, 0.35, 0.35, 0.5);
    // On flat neutral midtone (smoothLuma = 0.55):
    const flat = evaluateInkLighting(0, 0, 0, 255, 0.55, 0.55, 0.5);
    // On illuminated fold ridge (smoothLuma = 0.75):
    const ridge = evaluateInkLighting(0, 0, 0, 255, 0.75, 0.75, 0.5);

    // Black ink in valley is darker than flat, and ridge is lighter (folds carry through black print!)
    expect(valley.r).toBeLessThan(flat.r);
    expect(flat.r).toBeLessThan(ridge.r);

    // Black ink remains deep rich charcoal black (~45-70 levels, never washed out to light gray)
    expect(valley.r).toBeGreaterThanOrEqual(40);
    expect(valley.r).toBeLessThan(58);
    expect(flat.r).toBeGreaterThanOrEqual(50);
    expect(flat.r).toBeLessThan(65);
    expect(ridge.r).toBeGreaterThan(60);
    expect(ridge.r).toBeLessThan(75);

    // Neutral gray sheen (R == G == B)
    expect(ridge.r).toBe(ridge.g);
    expect(ridge.r).toBe(ridge.b);
  });

  it('preserves color chromaticity for saturated colors', () => {
    // Saturated Red (255, 0, 0)
    const redValley = evaluateInkLighting(255, 0, 0, 255, 0.40, 0.40, 0.5);
    expect(redValley.r).toBeGreaterThan(180);
    expect(redValley.g).toBe(0);
    expect(redValley.b).toBe(0);

    // Saturated Blue (0, 0, 255)
    const blueRidge = evaluateInkLighting(0, 0, 255, 255, 0.70, 0.70, 0.5);
    expect(blueRidge.b).toBeGreaterThan(200);
    expect(blueRidge.r).toBeLessThan(20); // only subtle bounded sheen
    expect(blueRidge.g).toBeLessThan(20);
  });

  it('incorporates authentic cotton weave texture without overwhelming print', () => {
    // Base flat area (smoothLuma = 0.55), but with weave peak (rawLuma = 0.60) vs weave valley (rawLuma = 0.50)
    const peak = evaluateInkLighting(200, 200, 200, 255, 0.55, 0.60, 0.5);
    const valley = evaluateInkLighting(200, 200, 200, 255, 0.55, 0.50, 0.5);

    expect(peak.r).toBeGreaterThan(valley.r);
    // Micro-variation is subtle (around 2-10 levels)
    const diff = peak.r - valley.r;
    expect(diff).toBeGreaterThan(1);
    expect(diff).toBeLessThan(15);
  });
});
