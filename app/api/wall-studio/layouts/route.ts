import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FREGORO_LAYOUTS } from '@/lib/wall-studio/layouts-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbLayouts = await prisma.wallLayout.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (dbLayouts && dbLayouts.length > 0) {
      return NextResponse.json({ success: true, layouts: dbLayouts });
    }
  } catch (error) {
    console.warn('Fallback to local layouts due to database query error:', error);
  }

  // Fallback to coded in-memory layouts
  return NextResponse.json({ success: true, layouts: FREGORO_LAYOUTS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      badge,
      wallWidthMm,
      wallHeightMm,
      coverageLabel,
      physicalPrintCount,
      logicalArtworkCount,
      recommendedRoom,
      recommendedWallWidth,
      recommendedThemes,
      basePrice,
      compareAtPrice,
      slots,
      splitGroups,
      published = true,
    } = body;

    if (!name || !slug || !slots || !wallWidthMm || !wallHeightMm) {
      return NextResponse.json(
        { success: false, message: 'Missing required layout parameters' },
        { status: 400 },
      );
    }

    // Check if layout exists to increment version
    const existing = await prisma.wallLayout.findUnique({ where: { slug } });
    const version = existing ? existing.version + 1 : 1;
    const layoutId = existing ? existing.id : `layout_${Date.now()}`;

    const layout = await prisma.wallLayout.upsert({
      where: { slug },
      update: {
        name,
        description,
        badge,
        wallWidthMm,
        wallHeightMm,
        coverageLabel:
          coverageLabel || `${Math.round(wallWidthMm / 10)} × ${Math.round(wallHeightMm / 10)} cm`,
        physicalPrintCount: physicalPrintCount || slots.length,
        logicalArtworkCount: logicalArtworkCount || slots.length,
        recommendedRoom,
        recommendedWallWidth,
        recommendedThemes: recommendedThemes || [],
        basePrice: parseFloat(basePrice) || 999,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        slots,
        splitGroups: splitGroups || [],
        published,
        version,
        updatedAt: new Date(),
      },
      create: {
        id: layoutId,
        slug,
        name,
        description,
        badge,
        wallWidthMm,
        wallHeightMm,
        coverageLabel:
          coverageLabel || `${Math.round(wallWidthMm / 10)} × ${Math.round(wallHeightMm / 10)} cm`,
        physicalPrintCount: physicalPrintCount || slots.length,
        logicalArtworkCount: logicalArtworkCount || slots.length,
        recommendedRoom,
        recommendedWallWidth,
        recommendedThemes: recommendedThemes || [],
        basePrice: parseFloat(basePrice) || 999,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        slots,
        splitGroups: splitGroups || [],
        published,
        version,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create immutable version snapshot
    await prisma.wallLayoutVersion.create({
      data: {
        id: `${layout.id}-v${version}`,
        layoutId: layout.id,
        version,
        slots,
        splitGroups: splitGroups || [],
        wallWidthMm,
        wallHeightMm,
      },
    });

    return NextResponse.json({ success: true, layout });
  } catch (err: unknown) {
    console.error('Error saving layout:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to save layout', error: String(err) },
      { status: 500 },
    );
  }
}
