import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  let productUrls: MetadataRoute.Sitemap = [];
  let categoryUrls: MetadataRoute.Sitemap = [];

  try {
    // Fetch products from DB
    const dbProducts = await prisma.product.findMany({
      select: { slug: true, categorySlug: true, updatedAt: true },
    });

    productUrls = dbProducts.map((p) => ({
      url: `${baseUrl}/products/${p.categorySlug}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    const dbCategories = await prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    });

    categoryUrls = dbCategories.map((c) => ({
      url: `${baseUrl}/products/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  } catch {
    console.warn(
      '[Sitemap] DB connection unavailable during build, using static products fallback.',
    );
    const { products: staticProducts } = await import('@/data/products');

    productUrls = staticProducts.map((p) => ({
      url: `${baseUrl}/products/${p.categorySlug}/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    const uniqueCategories = Array.from(new Set(staticProducts.map((p) => p.categorySlug)));
    categoryUrls = uniqueCategories.map((cat) => ({
      url: `${baseUrl}/products/${cat}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  }

  // Static routes
  const staticRoutes = [
    '',
    '/products/all',
    '/customize',
    '/split-poster',
    '/studio',
    '/about',
    '/contact',
    '/faq',
    '/shipping',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return [...staticRoutes, ...categoryUrls, ...productUrls];
}
