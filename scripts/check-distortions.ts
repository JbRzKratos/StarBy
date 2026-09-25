import { FREGORO_LAYOUTS } from '../lib/wall-studio/layouts-data';

console.log('Checking aspect ratios and physical dimensions across all layouts...');

let distortionCount = 0;

FREGORO_LAYOUTS.forEach((layout) => {
  const distortions: Array<{
    slot: string;
    size: string;
    actualW: number;
    actualH: number;
    expectedW: number;
    expectedH: number;
  }> = [];

  layout.slots.forEach((s) => {
    const actualW = Math.round(s.width * layout.wallWidthMm);
    const actualH = Math.round(s.height * layout.wallHeightMm);
    const expectedW = s.physicalWidthMm;
    const expectedH = s.physicalHeightMm;

    // Tolerance of 5mm
    if (Math.abs(actualW - expectedW) > 5 || Math.abs(actualH - expectedH) > 5) {
      distortions.push({
        slot: s.id,
        size: s.size,
        actualW,
        actualH,
        expectedW,
        expectedH,
      });
    }
  });

  if (distortions.length > 0) {
    distortionCount += distortions.length;
    console.log(
      `[DISTORTION] Layout "${layout.name}" (${layout.id}) has ${distortions.length} distorted slots:`,
    );
    distortions.forEach((d) => {
      console.log(
        `   - ${d.slot} (${d.size}): is ${d.actualW}x${d.actualH}mm, expected ${d.expectedW}x${d.expectedH}mm (diff: ${d.actualW - d.expectedW}mm, ${d.actualH - d.expectedH}mm)`,
      );
    });
  }
});

console.log('\nTOTAL DISTORTED SLOTS:', distortionCount);
