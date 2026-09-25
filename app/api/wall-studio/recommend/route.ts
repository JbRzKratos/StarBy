import { NextResponse } from 'next/server';
import { getSlotRecommendations } from '@/lib/wall-studio/recommendations';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slot, layout, currentSelections, themeSlug } = body;

    if (!slot || !layout) {
      return NextResponse.json(
        { success: false, message: 'Missing slot or layout data' },
        { status: 400 },
      );
    }

    const recommendations = getSlotRecommendations(
      slot,
      layout,
      currentSelections || {},
      themeSlug || 'all',
    );

    return NextResponse.json({
      success: true,
      recommendations: recommendations.slice(0, 15),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Recommendation error', error: String(error) },
      { status: 500 },
    );
  }
}
