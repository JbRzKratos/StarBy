import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPrebuiltWallBySlug } from '@/lib/wall-studio/prebuilt-walls-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const wall = await prisma.prebuiltWallProduct.findFirst({
      where: {
        OR: [{ slug: params.slug }, { id: params.slug }],
      },
    });

    if (wall) {
      return NextResponse.json({ success: true, prebuiltWall: wall });
    }
  } catch (e) {
    console.warn('DB prebuilt slug lookup fallback:', e);
  }

  const fallback = getPrebuiltWallBySlug(params.slug);
  if (fallback) {
    return NextResponse.json({ success: true, prebuiltWall: fallback });
  }

  return NextResponse.json({ success: false, message: 'Prebuilt wall not found' }, { status: 404 });
}
