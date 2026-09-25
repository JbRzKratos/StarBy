import { NextResponse } from 'next/server';
import { verifyWallPriceServer } from '@/lib/wall-studio/pricing';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { layoutId, selections } = body;

    if (!layoutId) {
      return NextResponse.json({ success: false, message: 'Missing layoutId' }, { status: 400 });
    }

    const priceBreakdown = verifyWallPriceServer(layoutId, selections || {});

    if (!priceBreakdown) {
      return NextResponse.json(
        { success: false, message: 'Layout not found for pricing' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, pricing: priceBreakdown });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Pricing calculation error', error: String(error) },
      { status: 500 },
    );
  }
}
