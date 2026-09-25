import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title = 'My Custom Wall', layoutId, layoutVersion = 1, slotsData, previewUrl } = body;

    if (!layoutId || !slotsData) {
      return NextResponse.json(
        { success: false, message: 'Missing layout or slot data' },
        { status: 400 },
      );
    }

    // Try to get authenticated user if available
    let userId: string | null = null;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch (e) {
      console.warn('Anonymous user saving wall:', e);
    }

    // Generate unique shareCode
    const shareCode = `FRG-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const id = `saved_wall_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const savedWall = await prisma.savedWall.create({
      data: {
        id,
        userId,
        title,
        layoutId,
        layoutVersion,
        slotsData,
        previewUrl,
        isPublic: true,
        shareCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const origin =
      request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const shareUrl = `${origin}/wall-studio/share/${savedWall.shareCode}`;

    return NextResponse.json({
      success: true,
      savedWall,
      shareCode: savedWall.shareCode,
      shareUrl,
    });
  } catch (error) {
    console.error('Failed to save wall:', error);
    return NextResponse.json(
      { success: false, message: 'Could not save wall configuration', error: String(error) },
      { status: 500 },
    );
  }
}

export async function GET(_request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, savedWalls: [] });
    }

    const savedWalls = await prisma.savedWall.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, savedWalls });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Could not fetch saved walls', error: String(error) },
      { status: 500 },
    );
  }
}
