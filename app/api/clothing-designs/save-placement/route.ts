import { NextResponse } from 'next/server';
import {
  getAllServerPlacements,
  getServerPlacementsForDesign,
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

    const all = await getAllServerPlacements();

    const responseHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    };

    if (designId) {
      const filtered: Record<string, SavedPlacementItem> = {};
      const prefix = `${designId}__`;
      for (const [key, val] of Object.entries(all)) {
        if (key.startsWith(prefix)) {
          filtered[key] = val;
        }
      }
      return NextResponse.json({ success: true, placements: filtered }, { headers: responseHeaders });
    }

    return NextResponse.json({ success: true, placements: all }, { headers: responseHeaders });
  } catch (err) {
    console.error('[API save-placement GET] Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve placements' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Verify that the caller is authorized as a designer (gokul30sep@gmail.com / superadmin)
    const supabase = createClient();
    const authCandidates: Array<{ id: string; email?: string }> = [];

    // Check Authorization header for Bearer token first
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token) {
        try {
          const { data: tokenData } = await supabase.auth.getUser(token);
          if (tokenData?.user) authCandidates.push(tokenData.user);
        } catch {}
      }
    }

    if (!authCandidates.some((candidate) => isSuperAdminEmail(candidate.email))) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) authCandidates.push(user);
      } catch {}
    }
    if (!authCandidates.some((candidate) => isSuperAdminEmail(candidate.email))) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) authCandidates.push(session.user);
      } catch {}
    }

    // Prefer a candidate that is actually the super admin. A stale/non-admin
    // bearer token must not shadow a valid first-party admin cookie session.
    const authUser =
      authCandidates.find((candidate) => isSuperAdminEmail(candidate.email)) ||
      authCandidates[0] ||
      null;
    const email = authUser?.email?.trim().toLowerCase();
    const isAuthorized = Boolean(
      email && isSuperAdminEmail(email)
    );

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: Studio placement saving is restricted to authorized designers only' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      designId,
      garmentId,
      placements,
      placement,
      target,
      artId: singleArtId,
      layers,
      removedArtIds,
      hiddenArtIds,
    } = body;

    if (!designId || !garmentId) {
      return NextResponse.json(
        { error: 'designId and garmentId are required' },
        { status: 400 }
      );
    }

    const garmentKey = (garmentId || 'regular-t-shirt').toLowerCase();
    const all = await getServerPlacementsForDesign(designId, garmentKey);
    const updates: Record<string, SavedPlacementItem> = {};
    const now = new Date().toISOString();
    const activeArtIds = new Set<string>();

    const normalizePlacementItem = (item: SavedPlacementItem): SavedPlacementItem => ({
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
    });

    // 1. If explicit placements dictionary provided
    if (placements && typeof placements === 'object') {
      for (const [key, val] of Object.entries(placements)) {
        const normalizedItem = normalizePlacementItem(val as SavedPlacementItem);

        if (key.includes('__')) {
          updates[key] = normalizedItem;
        } else {
          updates[`${designId}__${garmentKey}__${key}`] = normalizedItem;
        }
      }
    }

    // 1b. Single placement (sent by the studio's drag/save bridge)
    if (placement && typeof placement === 'object') {
      const normalizedItem = normalizePlacementItem(placement as SavedPlacementItem);
      const normalizedArtId = typeof singleArtId === 'string' ? singleArtId.toLowerCase() : undefined;
      const normalizedTarget = typeof target === 'string' ? target : normalizedItem.placementTarget;

      if (normalizedArtId) {
        updates[`${designId}__${garmentKey}__${normalizedArtId}`] = normalizedItem;
      }
      if (normalizedTarget) {
        updates[`${designId}__${garmentKey}__${normalizedTarget}`] = normalizedItem;
      }
      if (!normalizedItem.hidden && !normalizedItem.removed) {
        updates[`${designId}__${garmentKey}__${normalizedItem.regionId}`] = normalizedItem;
      }
    }

    // 2. If layers list provided directly from 3D project
    if (Array.isArray(layers) && layers.length > 0) {
      layers.forEach((rawLayer: Record<string, unknown>) => {
        const layerPlacementTarget = typeof rawLayer.placementTarget === 'string' ? rawLayer.placementTarget : undefined;
        const layerRegionId = typeof rawLayer.regionId === 'string' ? rawLayer.regionId : undefined;
        const layerName = typeof rawLayer.name === 'string' ? rawLayer.name : '';
        const layerId = typeof rawLayer.id === 'string' ? rawLayer.id : '';

        const target =
          layerPlacementTarget ||
          (layerRegionId === 'back' || layerName.toLowerCase().includes('back')
            ? 'back-center'
            : layerName.toLowerCase().includes('sleeve')
            ? 'left-sleeve'
            : 'front-center');

        const artMatch = layerId.match(/art-\d+/i);
        const artId = artMatch ? artMatch[0].toLowerCase() : undefined;
        const isHidden = rawLayer.opacity === 0 || rawLayer.hidden === true;
        const isRemoved = rawLayer.removed === true;

        if (artId && !isHidden && !isRemoved) {
          activeArtIds.add(artId);
        }

        const placementItem: SavedPlacementItem = {
          u: typeof rawLayer.u === 'number' ? parseFloat(rawLayer.u.toFixed(5)) : 0.25,
          v: typeof rawLayer.v === 'number' ? parseFloat(rawLayer.v.toFixed(5)) : 0.63,
          uvWidth: typeof rawLayer.uvWidth === 'number' ? parseFloat(rawLayer.uvWidth.toFixed(5)) : 0.26,
          scale: typeof rawLayer.scale === 'number' ? parseFloat(rawLayer.scale.toFixed(5)) : 0.74,
          rotation: Math.round((typeof rawLayer.rotation === 'number' ? rawLayer.rotation : 0)),
          regionId: layerRegionId === 'back' || target.includes('back') ? 'back' : 'front',
          placementTarget: target,
          scalePreset: typeof rawLayer.scalePreset === 'string' ? rawLayer.scalePreset : 'standard',
          hidden: isHidden,
          removed: isRemoved,
          opacity: typeof rawLayer.opacity === 'number' ? rawLayer.opacity : (isHidden ? 0 : 1.0),
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
        const isPresentInLayers = layers.some((l: Record<string, unknown>) => {
          const lId = typeof l.id === 'string' ? l.id : '';
          const lName = typeof l.name === 'string' ? l.name : '';
          const m = lId.match(/art-\d+/i);
          return (
            (m && m[0].toLowerCase() === aId) ||
            lId.toLowerCase().includes(aId) ||
            lName.toLowerCase().includes(a.name.toLowerCase())
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

    // Save summary configuration key for this design on this garment.
    // Preserve the previous included set for single-placement saves so a
    // calibration drag never wipes the design's artwork list.
    const configKey = `${designId}__${garmentKey}__config`;
    const includedArtIds = new Set<string>();

    if (Array.isArray(layers)) {
      activeArtIds.forEach((id) => includedArtIds.add(id));
    } else {
      const previousConfig = all[configKey];
      if (Array.isArray(previousConfig?.includedArtIds)) {
        previousConfig.includedArtIds.forEach((id) => includedArtIds.add(id));
      }

      for (const [key, item] of Object.entries(updates)) {
        const suffix = key.startsWith(`${designId}__${garmentKey}__`)
          ? key.slice(`${designId}__${garmentKey}__`.length)
          : '';
        if (/^art-\d+$/i.test(suffix) && !item.hidden && !item.removed && (item.opacity ?? 1) > 0) {
          includedArtIds.add(suffix.toLowerCase());
        }
      }
    }

    finalRemovedIds.forEach((id) => includedArtIds.delete(id.toLowerCase()));
    if (Array.isArray(hiddenArtIds)) {
      hiddenArtIds.forEach((id: string) => includedArtIds.delete(id.toLowerCase()));
    }

    updates[configKey] = {
      u: 0,
      v: 0,
      uvWidth: 0,
      scale: 0,
      rotation: 0,
      regionId: 'front',
      includedArtIds: Array.from(includedArtIds),
      savedAt: now,
    };

    const ok = await saveServerPlacements(updates);
    if (!ok) {
      return NextResponse.json({ error: 'Failed to write placements to storage' }, { status: 500 });
    }

    console.log(
      `[API save-placement] Successfully persisted ${Object.keys(updates).length} placement keys for ${designId} on ${garmentKey}`
    );

    return NextResponse.json(
      {
        success: true,
        designId,
        garmentId: garmentKey,
        savedKeys: Object.keys(updates),
        savedAt: now,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    console.error('[API save-placement POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
