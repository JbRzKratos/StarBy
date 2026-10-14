import { prisma } from '@/lib/prisma';
import {
  products as fallbackProducts,
  type Product,
  type ProductVariant,
} from '@/data/products';

/**
 * Service to fetch live product data directly from the PostgreSQL database,
 * overlaid onto catalog metadata.
 *
 * Ensures all prices set in the Admin Panel reflect immediately in real-time
 * on storefront screens, cart, checkout recalculations, and tax invoices.
 */
const DUMMY_APPAREL_KEYS = new Set([
  'prod_001', 'prod_002', 'prod_003', 'prod_004', 'prod_005', 'prod_006',
  'prod_007', 'prod_008', 'prod_009', 'prod_010', 'prod_011', 'prod_012',
  'prod_test_tees', 'void-tee', 'eclipse-tee', 'solar-tee', 'lunar-tee',
  'nova-tee', 'zenith-tee', 'orbit-hoodie', 'pulse-hoodie', 'core-hoodie',
  'vanguard-hoodie', 'oasis-hoodie', 'echo-hoodie', 'titan-hoodie', 'apex-hoodie'
]);

function filterOutDummyApparel(list: Product[]): Product[] {
  return list.filter((p) => !DUMMY_APPAREL_KEYS.has(p.id) && !DUMMY_APPAREL_KEYS.has(p.slug));
}

export async function getLiveProducts(): Promise<Product[]> {
  try {
    const dbProducts = await prisma.product.findMany({
      include: {
        variants: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!dbProducts || dbProducts.length === 0) {
      return filterOutDummyApparel(fallbackProducts);
    }

    const dbProductMap = new Map(dbProducts.map((p) => [p.id, p]));
    const dbSlugMap = new Map(dbProducts.map((p) => [p.slug, p]));

    // Map each fallback product and overlay the latest live DB prices and stock
    const liveProducts: Product[] = fallbackProducts.map((fallback) => {
      const dbProduct = dbProductMap.get(fallback.id) || dbSlugMap.get(fallback.slug);
      if (!dbProduct) return fallback;

      const dbVariantMap = new Map(dbProduct.variants.map((v) => [v.id, v]));

      const updatedVariants: ProductVariant[] = fallback.variants.map((v) => {
        const dbVariant = dbVariantMap.get(v.id);
        if (!dbVariant) return v;
        return {
          ...v,
          price: dbVariant.price,
          inStock: dbVariant.inStock,
          images: dbVariant.images && dbVariant.images.length > 0 ? dbVariant.images : v.images,
        };
      });

      return {
        ...fallback,
        name: dbProduct.name || fallback.name,
        tagline: dbProduct.tagline || fallback.tagline,
        description: dbProduct.description || fallback.description,
        basePrice: dbProduct.basePrice,
        featured: dbProduct.featured,
        customizable: dbProduct.customizable,
        variants: updatedVariants,
      };
    });

    // Also include any new products created in the admin DB that are not in data/products.ts
    const knownIds = new Set(fallbackProducts.map((p) => p.id));
    const knownSlugs = new Set(fallbackProducts.map((p) => p.slug));

    for (const dbP of dbProducts) {
      if (!knownIds.has(dbP.id) && !knownSlugs.has(dbP.slug)) {
        liveProducts.push({
          id: dbP.id,
          slug: dbP.slug,
          name: dbP.name,
          tagline: dbP.tagline,
          description: dbP.description,
          categorySlug: dbP.categorySlug,
          basePrice: dbP.basePrice,
          customizable: dbP.customizable,
          featured: dbP.featured,
          tags: dbP.tags,
          sizes: dbP.sizes,
          variants: dbP.variants.map((v) => ({
            id: v.id,
            name: v.name,
            color: v.color,
            colorHex: v.colorHex,
            price: v.price,
            images: v.images,
            inStock: v.inStock,
          })),
        });
      }
    }

    return filterOutDummyApparel(liveProducts);
  } catch (error) {
    console.error('[products-service] Error fetching live products from DB, using fallback:', error);
    return filterOutDummyApparel(fallbackProducts);
  }
}

/**
 * Fetch a single product with live pricing by slug or id.
 */
export async function getLiveProductBySlug(slug: string): Promise<Product | undefined> {
  if (!slug) return undefined;
  const all = await getLiveProducts();
  const slugHyphen = slug.replace(/_/g, '-');
  const slugUnderscore = slug.replace(/-/g, '_');
  return all.find(
    (p) =>
      p.slug === slug ||
      p.slug === slugHyphen ||
      p.slug === slugUnderscore ||
      p.id === slug,
  );
}

/**
 * Fetch all products in a given category with live pricing.
 */
export async function getLiveProductsByCategory(categorySlug: string): Promise<Product[]> {
  const all = await getLiveProducts();
  if (!categorySlug || categorySlug === 'all') return all;
  return all.filter((p) => p.categorySlug === categorySlug);
}

/**
 * Fetch featured products with live pricing.
 */
export async function getLiveFeaturedProducts(): Promise<Product[]> {
  const all = await getLiveProducts();
  return all.filter((p) => p.featured);
}
