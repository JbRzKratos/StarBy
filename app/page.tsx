import dynamic from 'next/dynamic';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/home/hero';
import { TrustBadges } from '@/components/home/trust-badges';
import { BentoGrid } from '@/components/home/bento-grid';
import { FeaturedProducts } from '@/components/home/featured-products';
import { getLiveProducts } from '@/lib/services/products-service';

// Interactive modals/drawers — load lazily on the client without blocking critical path
const CartDrawer = dynamic(
  () => import('@/components/layout/cart-drawer').then((m) => m.CartDrawer),
  { ssr: false },
);
const WishlistDrawer = dynamic(
  () => import('@/components/layout/wishlist-drawer').then((m) => m.WishlistDrawer),
  { ssr: false },
);
const SearchOverlay = dynamic(
  () => import('@/components/layout/search-overlay').then((m) => m.SearchOverlay),
  { ssr: false },
);

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

  return (
    <>
      <Navigation variant="hero" />
      <CartDrawer />
      <WishlistDrawer />
      <SearchOverlay />
      <main>
        <p className="sr-only">Fregoro Studios — Engineered Streetwear &amp; Design Objects</p>
        <Hero />
        <TrustBadges />
        <FeaturedProducts initialProducts={liveProducts} />
        <BentoGrid />
        <SplitPosterTeaser />
        <StudioTeaser />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
