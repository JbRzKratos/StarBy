import { NextResponse } from 'next/server';
import { getProductsFromDB } from '@/lib/services/db-service';



export async function GET() {
  try {
    const products = await getProductsFromDB();
    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch products' },
      { status: 500 },
    );
  }
}
