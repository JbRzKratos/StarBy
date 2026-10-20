import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getCachedPricesPayload,
  setCachedPricesPayload,
  invalidateProductsCache,
  getLiveProductBySlug,
} from '@/lib/services/products-service';

export const dynamic = 'force-dynamic';

export function invalidatePricesCache() {
  invalidateProductsCache();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('id');
    const slug = searchParams.get('slug');

    if (productId || slug) {
      const targetQuery = productId || slug || '';
      // 1. Instant sub-millisecond memory cache lookup
      const cached = await getLiveProductBySlug(targetQuery);
      if (cached) {
        return NextResponse.json(
          {
            success: true,
            product: {
              id: cached.id,
              slug: cached.slug,
              name: cached.name,
              basePrice: cached.basePrice,
              sizes: cached.sizes,
              sizePrices: cached.sizePrices,
              variants:
                cached.variants?.map((v) => ({
                  id: v.id,
                  name: v.name,
                  color: v.color,
                  price: v.price,
                  inStock: v.inStock,
                })) || [],
            },
          },
          {
            headers: {
              'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
            },
          },
        );
      }

      // 2. Direct DB fallback if not found in cache
      const product = await prisma.product.findFirst({
        where: productId ? { id: productId } : { slug: slug ?? '' },
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
            sizes: product.sizes,
            sizePrices: product.sizePrices,
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
            'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
          },
        },
      );
    }

    // Check fast in-memory cache for bulk prices
    const cachedPayload = getCachedPricesPayload();
    if (cachedPayload) {
      return NextResponse.json(cachedPayload, {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // Return complete price & name dictionary for fast client sync across all products, walls, splits, and magazines
    const [products, variants, wallLayouts, prebuiltWalls] = await Promise.all([
      prisma.product.findMany({
        select: { id: true, basePrice: true, slug: true, categorySlug: true, name: true, sizePrices: true, sizeStock: true },
      }),
      prisma.productVariant.findMany({
        select: { id: true, price: true, inStock: true, productId: true },
      }),
      prisma.wallLayout.findMany({
        select: { id: true, slug: true, basePrice: true, name: true },
      }),
      prisma.prebuiltWallProduct.findMany({
        select: { id: true, slug: true, basePrice: true, title: true },
      }),
    ]);

    const productPriceMap: Record<string, number> = {};
    const productNameMap: Record<string, string> = {};
    const productSizePricesMap: Record<string, Record<string, number>> = {};
    const productSizeStockMap: Record<string, Record<string, unknown>> = {};
    for (const p of products) {
      productPriceMap[p.id] = p.basePrice;
      if (p.slug) productPriceMap[p.slug] = p.basePrice;
      if (p.name) {
        productNameMap[p.id] = p.name;
        if (p.slug) productNameMap[p.slug] = p.name;
      }
      if (p.sizePrices && typeof p.sizePrices === 'object') {
        productSizePricesMap[p.id] = p.sizePrices as Record<string, number>;
        if (p.slug) productSizePricesMap[p.slug] = p.sizePrices as Record<string, number>;
      }
      if (p.sizeStock && typeof p.sizeStock === 'object') {
        productSizeStockMap[p.id] = p.sizeStock as Record<string, unknown>;
        if (p.slug) productSizeStockMap[p.slug] = p.sizeStock as Record<string, unknown>;
      }
    }

    const wallLayoutPriceMap: Record<string, number> = {};
    for (const wl of wallLayouts) {
      wallLayoutPriceMap[wl.id] = wl.basePrice;
      wallLayoutPriceMap[wl.slug] = wl.basePrice;
      productPriceMap[`wall_${wl.slug}`] = wl.basePrice;
      productPriceMap[`wall_${wl.id}`] = wl.basePrice;
      productPriceMap[`wall-layout-${wl.slug}`] = wl.basePrice;
      if (wl.name) {
        productNameMap[`wall_${wl.slug}`] = wl.name;
        productNameMap[`wall_${wl.id}`] = wl.name;
        productNameMap[`wall-layout-${wl.slug}`] = wl.name;
      }
    }

    const prebuiltPriceMap: Record<string, number> = {};
    for (const pw of prebuiltWalls) {
      prebuiltPriceMap[pw.id] = pw.basePrice;
      prebuiltPriceMap[pw.slug] = pw.basePrice;
      productPriceMap[`prebuilt_${pw.slug}`] = pw.basePrice;
      productPriceMap[`prebuilt_${pw.id}`] = pw.basePrice;
      productPriceMap[`prebuilt-wall-${pw.slug}`] = pw.basePrice;
      if (pw.title) {
        productNameMap[`prebuilt_${pw.slug}`] = pw.title;
        productNameMap[`prebuilt_${pw.id}`] = pw.title;
        productNameMap[`prebuilt-wall-${pw.slug}`] = pw.title;
      }
    }

    const variantPriceMap: Record<string, { price: number; inStock: boolean }> = {};
    for (const v of variants) {
      variantPriceMap[v.id] = { price: v.price, inStock: v.inStock };
    }

    const payload = {
      success: true,
      timestamp: Date.now(),
      products: productPriceMap,
      names: productNameMap,
      sizePrices: productSizePricesMap,
      sizeStock: productSizeStockMap,
      variants: variantPriceMap,
      wallLayouts: wallLayoutPriceMap,
      prebuiltWalls: prebuiltPriceMap,
    };
    setCachedPricesPayload(payload);

    return NextResponse.json(
      payload,
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
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
