import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import type { SavedPlacementItem } from './types';

export type { SavedPlacementItem };

export function isCoordinatePhysicallyInRegion(
  garment3dId: string,
  region: 'front' | 'back' | 'sleeve',
  u?: number,
  v?: number
): boolean {
  if (u === undefined || v === undefined) return true;
  const g = (garment3dId || 'regular-t-shirt').toLowerCase();

  if (g.includes('oversized') || g.includes('acid')) {
    // Oversized & Acid Wash: Front is U: [0.51..0.99], Back is U: [0.01..0.49], Sleeves: Left [0.01..0.37], Right [0.58..0.94]
    if (region === 'back') {
      return u <= 0.50 && v <= 0.65;
    }
    if (region === 'front') {
      return u >= 0.50 && v >= 0.35;
    }
    if (region === 'sleeve') {
      return (u < 0.45 && v > 0.60) || (u > 0.55 && v < 0.40);
    }
  } else if (g.includes('hoodie')) {
    // Hoodie: Front torso V: [0.18..0.60], Back torso V: [0.59..0.99], Sleeves U: [0.39..0.71]
    if (region === 'back') {
      return v >= 0.58 && u <= 0.45;
    }
    if (region === 'front') {
      return v <= 0.60 && u <= 0.45;
    }
    if (region === 'sleeve') {
      return u >= 0.38 && u <= 0.75;
    }
  } else {
    // Regular T-Shirt: Front is U: [0.01..0.49], Back is U: [0.51..0.99], Sleeves V: [0.14..0.34]
    if (region === 'back') {
      return u >= 0.50 && v >= 0.35;
    }
    if (region === 'front') {
      return u <= 0.50 && v >= 0.35;
    }
    if (region === 'sleeve') {
      return v <= 0.38;
    }
  }

  return true;
}

const PLACEMENTS_FILE_PATH = path.resolve(process.cwd(), 'lib', 'clothing-designs', 'custom-placements.json');

/**
 * Synchronous file fallback reader.
 */
function getPlacementsFromFile(): Record<string, SavedPlacementItem> {
  try {
    if (fs.existsSync(PLACEMENTS_FILE_PATH)) {
      const raw = fs.readFileSync(PLACEMENTS_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[placements-store] Could not read custom-placements.json fallback:', err);
  }
  return {};
}

let tableChecked = false;
async function ensurePlacementsTable(): Promise<void> {
  if (tableChecked) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ClothingCuratedPlacement" (
        "key" TEXT PRIMARY KEY,
        "data" JSONB NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    tableChecked = true;
  } catch (err) {
    console.warn('[placements-store] Warning ensuring ClothingCuratedPlacement table:', err);
  }
}

/**
 * Read all server-persisted calibrated placements.
 * Reads directly from PostgreSQL database ("ClothingCuratedPlacement" table)
 * and falls back to bundled JSON file if DB is empty or unreachable.
 */
export async function getAllServerPlacements(): Promise<Record<string, SavedPlacementItem>> {
  try {
    await ensurePlacementsTable();
    const rows = await prisma.$queryRawUnsafe<Array<{ key: string; data: unknown }>>(
      `SELECT "key", "data" FROM "ClothingCuratedPlacement"`
    );

    if (rows && rows.length > 0) {
      const dbPlacements: Record<string, SavedPlacementItem> = {};
      for (const row of rows) {
        dbPlacements[row.key] = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data as SavedPlacementItem);
      }
      // Merge with file fallbacks so any non-overridden presets remain intact
      const filePlacements = getPlacementsFromFile();
      return {
        ...filePlacements,
        ...dbPlacements,
      };
    }
  } catch (err) {
    console.warn('[placements-store] Failed to read from DB, using file fallback:', err);
  }

  return getPlacementsFromFile();
}

/**
 * Persist placement updates to PostgreSQL database table.
 * Also best-effort writes to local file if writable (local development).
 */
export async function saveServerPlacements(updates: Record<string, SavedPlacementItem>): Promise<boolean> {
  let dbOk = false;

  try {
    await ensurePlacementsTable();
    for (const [key, val] of Object.entries(updates)) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "ClothingCuratedPlacement" ("key", "data", "updatedAt")
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT ("key") DO UPDATE SET "data" = EXCLUDED."data", "updatedAt" = EXCLUDED."updatedAt"`,
        key,
        JSON.stringify(val)
      );
    }
    dbOk = true;
  } catch (err) {
    console.error('[placements-store] Failed to save placements to PostgreSQL DB:', err);
  }

  // Best-effort local file update (works in dev, safely ignored on Vercel read-only system)
  try {
    const existing = getPlacementsFromFile();
    const merged = {
      ...existing,
      ...updates,
    };
    const dir = path.dirname(PLACEMENTS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PLACEMENTS_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  } catch {
    // Expected on Vercel serverless / read-only environment
  }

  return dbOk;
}
