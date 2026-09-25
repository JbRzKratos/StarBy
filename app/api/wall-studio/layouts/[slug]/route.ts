import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLayoutById } from '@/lib/wall-studio/layouts-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const layout = await prisma.wallLayout.findFirst({
      where: {
        OR: [{ slug: params.slug }, { id: params.slug }],
      },
    });

    if (layout) {
      return NextResponse.json({ success: true, layout });
    }
  } catch (e) {
    console.warn('DB lookup failed, checking static layouts:', e);
  }

  const fallback = getLayoutById(params.slug);
  if (fallback) {
    return NextResponse.json({ success: true, layout: fallback });
  }

  return NextResponse.json({ success: false, message: 'Layout not found' }, { status: 404 });
}
