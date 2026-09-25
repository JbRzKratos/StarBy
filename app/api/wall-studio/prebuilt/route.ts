import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FREGORO_PREBUILT_WALLS } from '@/lib/wall-studio/prebuilt-walls-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbPrebuilt = await prisma.prebuiltWallProduct.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (dbPrebuilt && dbPrebuilt.length > 0) {
      return NextResponse.json({ success: true, prebuiltWalls: dbPrebuilt });
    }
  } catch (e) {
    console.warn('DB prebuilt lookup fallback to static:', e);
  }

  return NextResponse.json({ success: true, prebuiltWalls: FREGORO_PREBUILT_WALLS });
}
