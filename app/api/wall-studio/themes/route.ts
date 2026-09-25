import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FREGORO_THEMES } from '@/lib/wall-studio/themes-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbThemes = await prisma.wallTheme.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    if (dbThemes && dbThemes.length > 0) {
      return NextResponse.json({ success: true, themes: dbThemes });
    }
  } catch (error) {
    console.warn('Fallback to local themes:', error);
  }

  return NextResponse.json({ success: true, themes: FREGORO_THEMES });
}
