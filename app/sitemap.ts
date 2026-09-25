import type { MetadataRoute } from 'next';
import { products as staticProducts } from '@/data/products';
import { categories as staticCategories } from '@/data/categories';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fregoro.com';

  const productUrls: MetadataRoute.Sitemap = staticProducts.map((p) => ({
    url: `${baseUrl}/products/${p.categorySlug}/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = staticCategories.map((c) => ({
    url: `${baseUrl}/products/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // Static routes
  const staticRoutes = [
    '',
    '/products/all',
    '/split-poster',
    '/wall-studio',
    '/wall',
    '/magazine',
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
