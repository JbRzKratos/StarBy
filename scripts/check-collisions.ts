import { FREGORO_LAYOUTS } from '../lib/wall-studio/layouts-data';

console.log('Testing total layouts:', FREGORO_LAYOUTS.length);

let totalCollisions = 0;

FREGORO_LAYOUTS.forEach((layout) => {
  const collisions: Array<{ slotA: string; slotB: string; overlapX: number; overlapY: number }> = [];
  const slots = layout.slots;

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];

      // Convert to physical millimeters
      const aX = a.x * layout.wallWidthMm;
      const aY = a.y * layout.wallHeightMm;
      const aW = a.width * layout.wallWidthMm;
      const aH = a.height * layout.wallHeightMm;

      const bX = b.x * layout.wallWidthMm;
      const bY = b.y * layout.wallHeightMm;
      const bW = b.width * layout.wallWidthMm;
      const bH = b.height * layout.wallHeightMm;

      // Check overlap with 2mm tolerance
      const overlapX = Math.max(0, Math.min(aX + aW, bX + bW) - Math.max(aX, bX));
      const overlapY = Math.max(0, Math.min(aY + aH, bY + bH) - Math.max(aY, bY));

      if (overlapX > 2 && overlapY > 2) {
        collisions.push({
          slotA: a.id,
          slotB: b.id,
          overlapX: Math.round(overlapX),
          overlapY: Math.round(overlapY),
        });
      }
    }
  }

  if (collisions.length > 0) {
    totalCollisions += collisions.length;
    console.log(`[COLLISION] Layout "${layout.name}" (${layout.id}) has ${collisions.length} overlapping slot pairs:`);
    collisions.forEach((c) => {
      console.log(`   - ${c.slotA} overlaps ${c.slotB} by ${c.overlapX}mm x ${c.overlapY}mm`);
    });
  } else {
    console.log(`[OK] Layout "${layout.name}" (${layout.id}): 0 collisions.`);
  }
});

console.log('\nTOTAL OVERLAPPING PAIRS ACROSS ALL LAYOUTS:', totalCollisions);
