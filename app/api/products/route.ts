import { NextResponse } from 'next/server';
import { getProductsFromDB } from '@/lib/services/db-service';

export async function GET() {
  try {
    const products = await getProductsFromDB();
    return NextResponse.json(
      { success: true, products },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
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
