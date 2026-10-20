import { NextResponse } from 'next/server';
import { getLiveProducts } from '@/lib/services/products-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const idsParam = new URL(request.url).searchParams.get('ids');
    const products = await getLiveProducts();
    const requestedIds = idsParam
      ? new Set(
          idsParam
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
            .slice(0, 100),
        )
      : null;
    const payload = requestedIds
      ? products.filter((product) => requestedIds.has(product.id))
      : products;

    return NextResponse.json(
      { success: true, products: payload },
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
