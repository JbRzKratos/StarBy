import type { Metadata } from 'next';
import { getProductBySlug } from '@/data/products';
import { ProductDetailClient } from '@/components/product/product-detail-client';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface ProductPageProps {
  params: { category: string; slug: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = getProductBySlug(params.slug);
  return {
    title: product?.name ?? 'Product',
    description: product?.description ?? 'StarBy premium product.',
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = getProductBySlug(params.slug);
  if (!product) return notFound();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const productUrl = `${baseUrl}/products/${params.category}/${params.slug}`;

  // Fetch aggregate rating for SEO
  let aggregateRating = undefined;
  try {
    const aggregate = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { id: true },
    });

    if (aggregate._count.id > 0) {
      aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: aggregate._avg.rating?.toFixed(1),
        reviewCount: aggregate._count.id,
      };
    }
  } catch (error) {
    console.error('Failed to fetch aggregate rating for SEO', error);
  }

  // Compute real stock status: in stock if at least one variant has inStock: true
  const isInStock = product.variants.some((v) => v.inStock !== false);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.variants?.[0]?.images?.[0] ? `${baseUrl}${product.variants[0].images[0]}` : '',
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: product.basePrice,
      availability: isInStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    ...(aggregateRating && { aggregateRating }),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: params.category,
        item: `${baseUrl}/products/${params.category}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
