import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * POST /api/checkout
 * Processes checkout. Stub — replace with payment integration.
 */
export async function POST() {
  return NextResponse.json({ success: false, message: 'Checkout API stub' });
}
