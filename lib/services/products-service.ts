import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import {
  products as fallbackProducts,
  type Product,
  type ProductVariant,
} from '@/data/products';

const memoize = typeof cache === 'function' ? cache : <T extends (...args: any[]) => any>(fn: T): T => fn;

/**
 * High-Performance In-Memory & Edge-Optimized Product Service.
 *
 * Provides sub-millisecond memory caching for the product catalog so that
 * user navigation across storefront pages, product details, wall studio, and cart
 * loads instantaneously without repeated cross-continent PostgreSQL round-trips.
 *
 * Cache automatically invalidates on admin price/product mutations or after TTL.
 */

const DUMMY_APPAREL_KEYS = new Set([
  'prod_001', 'prod_002', 'prod_003', 'prod_004', 'prod_005', 'prod_006',
  'prod_007', 'prod_008', 'prod_009', 'prod_010', 'prod_011', 'prod_012',
  'void-tee', 'eclipse-tee', 'solar-tee', 'lunar-tee',
  'nova-tee', 'zenith-tee', 'orbit-hoodie', 'pulse-hoodie', 'core-hoodie',
  'vanguard-hoodie', 'oasis-hoodie', 'echo-hoodie', 'titan-hoodie', 'apex-hoodie'
]);

function filterOutDummyApparel(list: Product[]): Product[] {
  return list.filter((p) => !DUMMY_APPAREL_KEYS.has(p.id) && !DUMMY_APPAREL_KEYS.has(p.slug));
}

// In-memory cache variables (persists across requests in Node server runtime)
let cachedProducts: Product[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds memory TTL

// O(1) indexed lookup map for instant product access by slug and id
const cachedProductMap = new Map<string, Product>();

// In-memory cache for API price dictionaries
let cachedPricesPayload: any = null;
let cachedPricesTimestamp = 0;

export function getCachedPricesPayload<T = any>(): T | null {
  if (cachedPricesPayload && Date.now() - cachedPricesTimestamp < CACHE_TTL_MS) {
    return cachedPricesPayload as T;
  }
  return null;
}

export function setCachedPricesPayload(payload: any) {
  cachedPricesPayload = payload;
  cachedPricesTimestamp = Date.now();
}

/**
 * Invalidate the in-memory product and price cache.
 * Called whenever an admin updates prices, variants, or product catalog details.
 */
export function invalidateProductsCache() {
  cachedProducts = null;
  lastFetchTime = 0;
  cachedProductMap.clear();
  cachedPricesPayload = null;
  cachedPricesTimestamp = 0;
}

/**
 * Fetch live products with in-memory caching and fallback overlay.
 */
export async function getLiveProducts(forceRefresh = false): Promise<Product[]> {
  const now = Date.now();
  if (!forceRefresh && cachedProducts && (now - lastFetchTime < CACHE_TTL_MS)) {
    return cachedProducts;
  }

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
      const fallbackFiltered = filterOutDummyApparel(fallbackProducts);
      cachedProducts = fallbackFiltered;
      lastFetchTime = now;
      cachedProductMap.clear();
      for (const p of fallbackFiltered) {
        if (p.id) cachedProductMap.set(p.id, p);
        if (p.slug) {
          cachedProductMap.set(p.slug, p);
          cachedProductMap.set(p.slug.replace(/_/g, '-'), p);
          cachedProductMap.set(p.slug.replace(/-/g, '_'), p);
        }
      }
      return fallbackFiltered;
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

    const filtered = filterOutDummyApparel(liveProducts);
    cachedProducts = filtered;
    lastFetchTime = now;

    cachedProductMap.clear();
    for (const p of filtered) {
      if (p.id) cachedProductMap.set(p.id, p);
      if (p.slug) {
        cachedProductMap.set(p.slug, p);
        cachedProductMap.set(p.slug.replace(/_/g, '-'), p);
        cachedProductMap.set(p.slug.replace(/-/g, '_'), p);
      }
    }

    return filtered;
  } catch (error) {
    console.error('[products-service] Error fetching live products from DB, using fallback:', error);
    const fallbackFiltered = filterOutDummyApparel(fallbackProducts);
    return fallbackFiltered;
  }
}

/**
 * Fetch a single product with live pricing by slug or id.
 * Wrapped with React cache() to deduplicate execution within the same request
 * (e.g. generateMetadata and Page component sharing the result).
 */
export const getLiveProductBySlug = memoize(async (slug: string): Promise<Product | undefined> => {
  if (!slug) return undefined;

  const slugHyphen = slug.replace(/_/g, '-');
  const slugUnderscore = slug.replace(/-/g, '_');

  // 1. Instant O(1) memory lookup
  const cached =
    cachedProductMap.get(slug) ||
    cachedProductMap.get(slugHyphen) ||
    cachedProductMap.get(slugUnderscore);
  if (cached) return cached;

  // 2. Warm up cache if not loaded yet
  const all = await getLiveProducts();
  const found =
    cachedProductMap.get(slug) ||
    cachedProductMap.get(slugHyphen) ||
    cachedProductMap.get(slugUnderscore) ||
    all.find(
      (p) =>
        p.slug === slug ||
        p.slug === slugHyphen ||
        p.slug === slugUnderscore ||
        p.id === slug,
    );
  if (found) return found;

  // 3. Fallback direct single-row query if a newly added product is requested directly
  try {
    const dbP = await prisma.product.findFirst({
      where: {
        OR: [
          { slug },
          { slug: slugHyphen },
          { slug: slugUnderscore },
          { id: slug },
        ],
      },
      include: {
        variants: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (dbP) {
      const p: Product = {
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
      };
      cachedProductMap.set(p.id, p);
      cachedProductMap.set(p.slug, p);
      return p;
    }
  } catch (err) {
    console.warn('[products-service] Error querying single product by slug:', err);
  }

  return undefined;
});

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
