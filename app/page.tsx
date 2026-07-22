import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/layout/cart-drawer';
import { Hero } from '@/components/home/hero';
import { TrustBadges } from '@/components/home/trust-badges';
import { BentoGrid } from '@/components/home/bento-grid';
import { FeaturedProducts } from '@/components/home/featured-products';
import { SplitPosterTeaser } from '@/components/home/split-poster-teaser';
import { StudioTeaser } from '@/components/home/studio-teaser';
import { Testimonials } from '@/components/home/testimonials';

export default function HomePage() {
  return (
    <>
      <Navigation />
      <CartDrawer />
      <main>
        <h1 className="sr-only">StarBy — Personalized Premium</h1>
        <Hero />
        <TrustBadges />
        <FeaturedProducts />
        <BentoGrid />
        <SplitPosterTeaser />
        <StudioTeaser />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
