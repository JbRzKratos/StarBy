import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FREGORO_ARTWORKS } from '@/lib/wall-studio/artworks-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase() || '';
    const theme = searchParams.get('theme') || '';
    const orientation = searchParams.get('orientation') || '';
    const isSplit = searchParams.get('isSplit');
    const isHero = searchParams.get('isHero');

    // Attempt DB query
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = { status: 'published' };

      if (theme && theme !== 'all') {
        where.themeSlug = theme;
      }
      if (orientation) {
        where.orientation = orientation;
      }
      if (isSplit === 'true') {
        where.isSplitCompatible = true;
      }
      if (isHero === 'true') {
        where.heroCompatible = true;
      }
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { themeSlug: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ];
      }

      const posters = await prisma.posterArtwork.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        take: 100,
      });

      if (posters && posters.length > 0) {
        return NextResponse.json({ success: true, posters });
      }
    } catch (e) {
      console.warn('DB poster search fallback to in-memory:', e);
    }

    // In-memory fallback
    let filtered = [...FREGORO_ARTWORKS];

    if (theme && theme !== 'all') {
      filtered = filtered.filter((p) => p.themeSlug === theme);
    }
    if (orientation) {
      filtered = filtered.filter((p) => p.orientation === orientation);
    }
    if (isSplit === 'true') {
      filtered = filtered.filter((p) => p.isSplitCompatible);
    }
    if (isHero === 'true') {
      filtered = filtered.filter((p) => p.heroCompatible);
    }
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.themeSlug.toLowerCase().includes(search) ||
          p.tags.some((t) => t.toLowerCase().includes(search)),
      );
    }

    return NextResponse.json({ success: true, posters: filtered });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch posters', error: String(error) },
      { status: 500 },
    );
  }
}
