import dynamic from 'next/dynamic';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/home/hero';
import { TrustBadges } from '@/components/home/trust-badges';
import { BentoGrid } from '@/components/home/bento-grid';
import { FeaturedProducts } from '@/components/home/featured-products';
import { GlobalOverlays } from '@/components/layout/global-overlays';
import { getLiveProducts } from '@/lib/services/products-service';
import type { Product } from '@/data/products';
import { isProductComingSoon } from '@/data/categories';

const HOMEPAGE_TAB_CATEGORIES = ['posters', 'split-posters', 'hoodies'] as const;

/** Keep only the data the homepage cards actually render. */
function trimForHomepage(product: Product): Product {
  const variant = product.variants[0];

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: '',
    categorySlug: product.categorySlug,
    basePrice: product.basePrice,
    variants: variant
      ? [
          {
            id: variant.id,
            name: variant.name,
            color: variant.color,
            colorHex: variant.colorHex,
            price: variant.price,
            images: variant.images.slice(0, 1),
            inStock: variant.inStock,
          },
        ]
      : [],
    customizable: false,
    tags: product.tags,
    featured: product.featured,
    comingSoon: product.comingSoon,
  };
}

/**
 * The live catalogue contains 500+ products. Sending all of them to a client
 * component serializes hundreds of KB into the RSC payload and makes the
 * homepage hydrate the entire catalogue just to show eight cards per tab.
 * Select only the products each visible tab can display.
 */
function buildHomepageProducts(allProducts: Product[]): Product[] {
  const purchasable = allProducts.filter((product) => product.basePrice > 1);
  const selected = new Map<string, Product>();

  const add = (product?: Product) => {
    if (!product || selected.has(product.id)) return;
    selected.set(product.id, trimForHomepage(product));
  };

  const posters = purchasable.filter((product) => product.categorySlug === 'posters');
  const featuredPosters = posters.filter((product) => product.featured);

  // "All Featured" tab: four posters + four non-poster featured products.
  featuredPosters.slice(0, 4).forEach(add);
  purchasable
    .filter(
      (product) =>
        product.featured &&
        product.categorySlug !== 'posters' &&
        !isProductComingSoon(product),
    )
    .slice(0, 4)
    .forEach(add);

  if (selected.size === 0) {
    purchasable.filter((product) => !isProductComingSoon(product)).slice(0, 8).forEach(add);
  }

  // One tab's worth of products for every other visible category tab.
  for (const category of HOMEPAGE_TAB_CATEGORIES) {
    if (category === 'posters') {
      const source = featuredPosters.length >= 4 ? featuredPosters : posters;
      source.slice(0, 8).forEach(add);
    } else if (category === 'hoodies') {
      // The tab combines hoodies and tees. Add hoodies first so the single
      // hoodie is not pushed out by the much larger tee catalogue.
      purchasable
        .filter((product) => product.categorySlug === 'hoodies')
        .slice(0, 8)
        .forEach(add);
      purchasable
        .filter((product) => product.categorySlug === 'tees')
        .slice(0, 8)
        .forEach(add);
    } else {
      purchasable
        .filter((product) => product.categorySlug === category)
        .slice(0, 8)
        .forEach(add);
    }
  }

  return Array.from(selected.values());
}

// Below-the-fold visual teasers — chunked to minimize initial homepage JS execution
const SplitPosterTeaser = dynamic(
  () => import('@/components/home/split-poster-teaser').then((m) => m.SplitPosterTeaser),
);
const StudioTeaser = dynamic(
  () => import('@/components/home/studio-teaser').then((m) => m.StudioTeaser),
);
const Testimonials = dynamic(
  () => import('@/components/home/testimonials').then((m) => m.Testimonials),
);

// ISR: serve cached homepage for up to 60s, then regenerate in background
export const revalidate = 60;

export default async function HomePage() {
  const liveProducts = await getLiveProducts();
  const initialProducts = buildHomepageProducts(liveProducts);

  return (
    <>
      <Navigation variant="hero" />
      <GlobalOverlays />
      <main>
        <p className="sr-only">Fregoro Studios — Engineered Streetwear &amp; Design Objects</p>
        <Hero />
        <TrustBadges />
        <FeaturedProducts initialProducts={initialProducts} />
        <BentoGrid />
        <SplitPosterTeaser />
        <StudioTeaser />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
