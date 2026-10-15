import fs from 'fs';
import path from 'path';

export interface SavedPlacementItem {
  u: number;
  v: number;
  uvWidth: number;
  uvHeight?: number;
  scale: number;
  rotation: number;
  regionId: 'front' | 'back';
  placementTarget?: string;
  scalePreset?: string;
  hidden?: boolean;
  removed?: boolean;
  opacity?: number;
  includedArtIds?: string[];
  savedAt?: string;
}

const PLACEMENTS_FILE_PATH = path.resolve(process.cwd(), 'lib', 'clothing-designs', 'custom-placements.json');

/**
 * Read all server-persisted calibrated placements.
 */
export function getAllServerPlacements(): Record<string, SavedPlacementItem> {
  try {
    if (fs.existsSync(PLACEMENTS_FILE_PATH)) {
      const raw = fs.readFileSync(PLACEMENTS_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[placements-store] Could not read custom-placements.json:', err);
  }
  return {};
}

/**
 * Persist placement updates to the server storage file.
 */
export function saveServerPlacements(updates: Record<string, SavedPlacementItem>): boolean {
  try {
    const existing = getAllServerPlacements();
    const merged = {
      ...existing,
      ...updates,
    };

    const dir = path.dirname(PLACEMENTS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(PLACEMENTS_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[placements-store] Failed to write custom-placements.json:', err);
    return false;
  }
}
