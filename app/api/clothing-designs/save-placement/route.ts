import { NextResponse } from 'next/server';
import {
  getAllServerPlacements,
  saveServerPlacements,
  type SavedPlacementItem,
} from '@/lib/clothing-designs/placements-store';
import { getManifest } from '@/lib/clothing-designs/manifest';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/auth-constants';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const designId = searchParams.get('designId');
    const garmentId = searchParams.get('garmentId');

    const all = getAllServerPlacements();

    if (designId) {
      const filtered: Record<string, SavedPlacementItem> = {};
      const prefix = `${designId}__`;
      for (const [key, val] of Object.entries(all)) {
        if (key.startsWith(prefix)) {
          filtered[key] = val;
        }
      }
      return NextResponse.json({ success: true, placements: filtered });
    }

    return NextResponse.json({ success: true, placements: all });
  } catch (err) {
    console.error('[API save-placement GET] Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve placements' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Verify that the caller is authorized as a designer (gokul30sep@gmail.com / superadmin)
    const supabase = createClient();
    let authUser: { id: string; email?: string } | null = null;
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) authUser = user;
    } catch {}
    if (!authUser) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) authUser = session.user;
      } catch {}
    }

    const email = authUser?.email?.trim().toLowerCase();
    const isAuthorized = Boolean(
      email && (email === 'gokul30sep@gmail.com' || isSuperAdminEmail(email))
    );

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: Studio placement saving is restricted to authorized designers only' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { designId, garmentId, placements, layers, removedArtIds, hiddenArtIds } = body;

    if (!designId || !garmentId) {
      return NextResponse.json(
        { error: 'designId and garmentId are required' },
        { status: 400 }
      );
    }

    const garmentKey = (garmentId || 'regular-t-shirt').toLowerCase();
    const all = getAllServerPlacements();
    const updates: Record<string, SavedPlacementItem> = {};
    const now = new Date().toISOString();
    const activeArtIds = new Set<string>();

    // 1. If explicit placements dictionary provided
    if (placements && typeof placements === 'object') {
      for (const [key, val] of Object.entries(placements)) {
        const item = val as SavedPlacementItem;
        const normalizedItem: SavedPlacementItem = {
          u: typeof item.u === 'number' ? parseFloat(item.u.toFixed(5)) : 0.25,
          v: typeof item.v === 'number' ? parseFloat(item.v.toFixed(5)) : 0.63,
          uvWidth: typeof item.uvWidth === 'number' ? parseFloat(item.uvWidth.toFixed(5)) : 0.26,
          scale: typeof item.scale === 'number' ? parseFloat(item.scale.toFixed(5)) : 0.74,
          rotation: Math.round(item.rotation || 0),
          regionId: item.regionId || 'front',
          placementTarget: item.placementTarget,
          scalePreset: item.scalePreset,
          hidden: item.hidden ?? (item.opacity === 0),
          removed: item.removed ?? false,
          opacity: typeof item.opacity === 'number' ? item.opacity : (item.hidden ? 0 : 1.0),
          savedAt: now,
        };

        if (key.includes('__')) {
          updates[key] = normalizedItem;
        } else {
          updates[`${designId}__${garmentKey}__${key}`] = normalizedItem;
        }
      }
    }

    // 2. If layers list provided directly from 3D project
    if (Array.isArray(layers) && layers.length > 0) {
      layers.forEach((layer: any) => {
        const target =
          layer.placementTarget ||
          (layer.regionId === 'back' || (layer.name && layer.name.toLowerCase().includes('back'))
            ? 'back-center'
            : layer.name && layer.name.toLowerCase().includes('sleeve')
            ? 'left-sleeve'
            : 'front-center');

        const artMatch = (layer.id || '').match(/art-\d+/i);
        const artId = artMatch ? artMatch[0].toLowerCase() : undefined;
        const isHidden = layer.opacity === 0 || layer.hidden === true;
        const isRemoved = layer.removed === true;

        if (artId && !isHidden && !isRemoved) {
          activeArtIds.add(artId);
        }

        const placementItem: SavedPlacementItem = {
          u: typeof layer.u === 'number' ? parseFloat(layer.u.toFixed(5)) : 0.25,
          v: typeof layer.v === 'number' ? parseFloat(layer.v.toFixed(5)) : 0.63,
          uvWidth: typeof layer.uvWidth === 'number' ? parseFloat(layer.uvWidth.toFixed(5)) : 0.26,
          scale: typeof layer.scale === 'number' ? parseFloat(layer.scale.toFixed(5)) : 0.74,
          rotation: Math.round(layer.rotation || 0),
          regionId: layer.regionId === 'back' || target.includes('back') ? 'back' : 'front',
          placementTarget: target,
          scalePreset: layer.scalePreset || 'standard',
          hidden: isHidden,
          removed: isRemoved,
          opacity: typeof layer.opacity === 'number' ? layer.opacity : (isHidden ? 0 : 1.0),
          savedAt: now,
        };

        // Key by artId (always isolate individual artwork calibration)
        if (artId) {
          updates[`${designId}__${garmentKey}__${artId}`] = placementItem;
        }

        // Only update shared target spot & region keys if the layer is active and visible
        if (!isHidden && !isRemoved) {
          updates[`${designId}__${garmentKey}__${target}`] = placementItem;
          updates[`${designId}__${garmentKey}__${placementItem.regionId}`] = placementItem;
        }
      });
    }

    // 3. Explicitly removed art IDs
    const finalRemovedIds = new Set<string>();
    if (Array.isArray(removedArtIds)) {
      removedArtIds.forEach((id: string) => finalRemovedIds.add(id.toLowerCase()));
    }

    // Auto-detect removed artworks from manifest if layers array was provided
    if (Array.isArray(layers)) {
      const manifestArtworks = getManifest().designs.find((d) => d.id === designId)?.artworks || [];
      manifestArtworks.forEach((a) => {
        const aId = a.id.toLowerCase();
        const isPresentInLayers = layers.some((l: any) => {
          const m = (l.id || '').match(/art-\d+/i);
          return (
            (m && m[0].toLowerCase() === aId) ||
            (l.id && l.id.toLowerCase().includes(aId)) ||
            (l.name && l.name.toLowerCase().includes(a.name.toLowerCase()))
          );
        });
        if (!isPresentInLayers) {
          finalRemovedIds.add(aId);
        }
      });
    }

    // Apply removed markers
    finalRemovedIds.forEach((aId) => {
      const artKey = `${designId}__${garmentKey}__${aId}`;
      const existingItem = all[artKey];
      updates[artKey] = {
        ...(existingItem || {
          u: 0.25,
          v: 0.63,
          uvWidth: 0.26,
          scale: 0.74,
          rotation: 0,
          regionId: 'front',
        }),
        removed: true,
        hidden: true,
        opacity: 0,
        savedAt: now,
      };
    });

    // 4. Explicitly hidden art IDs
    if (Array.isArray(hiddenArtIds)) {
      hiddenArtIds.forEach((id: string) => {
        const aId = id.toLowerCase();
        const artKey = `${designId}__${garmentKey}__${aId}`;
        const existingItem = updates[artKey] || all[artKey];
        updates[artKey] = {
          ...(existingItem || {
            u: 0.25,
            v: 0.63,
            uvWidth: 0.26,
            scale: 0.74,
            rotation: 0,
            regionId: 'front',
          }),
          hidden: true,
          removed: false,
          opacity: 0,
          savedAt: now,
        };
      });
    }

    // Save summary configuration key for this design on this garment
    updates[`${designId}__${garmentKey}__config`] = {
      u: 0,
      v: 0,
      uvWidth: 0,
      scale: 0,
      rotation: 0,
      regionId: 'front',
      includedArtIds: Array.from(activeArtIds),
      savedAt: now,
    };

    const ok = saveServerPlacements(updates);
    if (!ok) {
      return NextResponse.json({ error: 'Failed to write placements to storage' }, { status: 500 });
    }

    console.log(
      `[API save-placement] Successfully persisted ${Object.keys(updates).length} placement keys for ${designId} on ${garmentKey}`
    );

    return NextResponse.json({
      success: true,
      designId,
      garmentId: garmentKey,
      savedKeys: Object.keys(updates),
      savedAt: now,
    });
  } catch (err) {
    console.error('[API save-placement POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
