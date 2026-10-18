import { NextResponse } from 'next/server';
import { getLiveProducts } from '@/lib/services/products-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await getLiveProducts();
    return NextResponse.json(
      { success: true, products },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      },
    );
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch products' },
      { status: 500 },
    );
  }
}
