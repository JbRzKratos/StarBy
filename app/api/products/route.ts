import { NextResponse } from 'next/server';

/**
 * GET /api/products
 * Returns all products. Stub — replace with database query.
 */
export async function GET() {
  return NextResponse.json({ products: [], message: 'Products API stub' });
}
