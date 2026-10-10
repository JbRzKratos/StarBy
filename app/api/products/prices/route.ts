import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('id');
    const slug = searchParams.get('slug');

    if (productId || slug) {
      const product = await prisma.product.findFirst({
        where: productId ? { id: productId } : { slug: slug! },
        include: { variants: true },
      });

      if (!product) {
        return NextResponse.json(
          { success: false, message: 'Product not found' },
          {
            status: 404,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            },
          },
        );
      }

      return NextResponse.json(
        {
          success: true,
          product: {
            id: product.id,
            slug: product.slug,
            name: product.name,
            basePrice: product.basePrice,
            variants: product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              color: v.color,
              price: v.price,
              inStock: v.inStock,
            })),
          },
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          },
        },
      );
    }

    // Return complete price dictionary for fast client sync across all products, walls, splits, and magazines
    const [products, variants, wallLayouts, prebuiltWalls] = await Promise.all([
      prisma.product.findMany({
        select: { id: true, basePrice: true, slug: true, categorySlug: true },
      }),
      prisma.productVariant.findMany({
        select: { id: true, price: true, inStock: true, productId: true },
      }),
      prisma.wallLayout.findMany({
        select: { id: true, slug: true, basePrice: true },
      }),
      prisma.prebuiltWallProduct.findMany({
        select: { id: true, slug: true, basePrice: true },
      }),
    ]);

    const productPriceMap: Record<string, number> = {};
    for (const p of products) {
      productPriceMap[p.id] = p.basePrice;
      if (p.slug) productPriceMap[p.slug] = p.basePrice;
    }

    const wallLayoutPriceMap: Record<string, number> = {};
    for (const wl of wallLayouts) {
      wallLayoutPriceMap[wl.id] = wl.basePrice;
      wallLayoutPriceMap[wl.slug] = wl.basePrice;
      productPriceMap[`wall_${wl.slug}`] = wl.basePrice;
      productPriceMap[`wall_${wl.id}`] = wl.basePrice;
      productPriceMap[`wall-layout-${wl.slug}`] = wl.basePrice;
    }

    const prebuiltPriceMap: Record<string, number> = {};
    for (const pw of prebuiltWalls) {
      prebuiltPriceMap[pw.id] = pw.basePrice;
      prebuiltPriceMap[pw.slug] = pw.basePrice;
      productPriceMap[`prebuilt_${pw.slug}`] = pw.basePrice;
      productPriceMap[`prebuilt_${pw.id}`] = pw.basePrice;
      productPriceMap[`prebuilt-wall-${pw.slug}`] = pw.basePrice;
    }

    const variantPriceMap: Record<string, { price: number; inStock: boolean }> = {};
    for (const v of variants) {
      variantPriceMap[v.id] = { price: v.price, inStock: v.inStock };
    }

    return NextResponse.json(
      {
        success: true,
        timestamp: Date.now(),
        products: productPriceMap,
        variants: variantPriceMap,
        wallLayouts: wallLayoutPriceMap,
        prebuiltWalls: prebuiltPriceMap,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      },
    );
  } catch (error) {
    console.error('[API /api/products/prices] Error fetching prices:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve prices' },
      { status: 500 },
    );
  }
}
