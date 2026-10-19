'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';
import { products, type Product } from '@/data/products';
import { isProductComingSoon } from '@/data/categories';
import { getR2AssetUrl } from '@/lib/r2';
import { ProductCard } from '@/components/product/product-card';
import dynamic from 'next/dynamic';
import type { ClothingDesignEntry } from '@/lib/clothing-designs/types';

const ClothingProductModal = dynamic(
  () => import('@/components/shop/clothing-product-modal').then((m) => m.ClothingProductModal),
  { ssr: false },
);

const CATEGORY_TABS = [
  { id: 'all', label: 'All Featured' },
  { id: 'posters', label: 'Posters' },
  { id: 'split-posters', label: 'Split Posters' },
  { id: 'hoodies', label: 'Hoodies & Tees' },
  { id: 'mugs-cups', label: 'Cups & Mugs' },
  { id: 'skins', label: 'Device Skins' },
];

interface ComingSoonItem {
  name: string;
  tagline: string;
  image: string;
  stage: string;
  category: string;
  href: string;
}

interface ComingSoonShowcaseConfig {
  title: string;
  description: string;
  roadmapLabel: string;
  roadmapLink: string;
  items: ComingSoonItem[];
}

const COMING_SOON_SHOWCASES: Record<string, ComingSoonShowcaseConfig> = {
  skins: {
    title: 'Device Skins Collection',
    description:
      'A new way to personalize your tech with FREGORO is on the way. Our Device Skins collection is currently in development and will be available soon with 3M architectural cast vinyl, sub-millimeter laser tolerances, and tactile finishes.',
    roadmapLabel: 'Explore Full 2026 Device Skins Roadmap',
    roadmapLink: '/products/skins',
    items: [
      {
        name: 'Phantom Carbon Skin',
        tagline: 'Precision 3M forged carbon weave texture.',
        image: getR2AssetUrl('images/products/phantom-skin.webp'),
        stage: 'Lab Formulation',
        category: 'Textured Weave',
        href: '/products/skins',
      },
      {
        name: 'Stealth Obsidian Skin',
        tagline: 'Anti-reflective true-matte stealth armor.',
        image: getR2AssetUrl('images/products/stealth-skin.webp'),
        stage: 'In Development',
        category: 'Matte Stealth',
        href: '/products/skins',
      },
      {
        name: 'Aura Iridescent Matrix',
        tagline: 'Chameleonic color-shifting micro-film.',
        image: getR2AssetUrl('images/products/aura-skin.webp'),
        stage: 'Material Testing',
        category: 'Prismatic Series',
        href: '/products/skins',
      },
      {
        name: 'Cypher Cybernetic Mesh',
        tagline: 'Tactile geometric circuit patterns.',
        image: getR2AssetUrl('images/products/cypher-skin.webp'),
        stage: 'Prototyping',
        category: 'Geometric Tech',
        href: '/products/skins',
      },
    ],
  },
  'mugs-cups': {
    title: 'Cups & Mugs Collection',
    description:
      'Your everyday studio ritual is getting an upgrade. Our ceramic stoneware, insulated travel tumblers, and heat-reactive custom mugs are currently in pre-production testing with kiln formulations, high-temp dishwasher resistance, and tactile glazes.',
    roadmapLabel: 'Explore Full Cups & Mugs Collection',
    roadmapLink: '/products/mugs-cups',
    items: [
      {
        name: 'Classic Ceramic Mug 11oz',
        tagline: 'High-density ceramic stoneware with ergonomic grip and glossy thermal glaze.',
        image: getR2AssetUrl('images/products/classic_mug_11oz.webp'),
        stage: 'Kiln Formulation',
        category: 'Stoneware',
        href: '/products/mugs-cups/classic-mug-11oz',
      },
      {
        name: 'Magic Heat-Reveal Mug',
        tagline: 'Thermo-reactive pigment coating that transforms when hot liquid is poured.',
        image: getR2AssetUrl('images/products/magic_mug.webp'),
        stage: 'Thermal Testing',
        category: 'Reactive Glaze',
        href: '/products/mugs-cups/magic-mug',
      },
      {
        name: 'Enamel Studio Camping Mug',
        tagline: 'Rugged stainless steel core coated with vintage-fired enamel glaze.',
        image: getR2AssetUrl('images/products/enamel_mug.webp'),
        stage: 'Prototyping',
        category: 'Outdoor Steel',
        href: '/products/mugs-cups/enamel-camping-mug',
      },
      {
        name: 'Travel Insulated Tumbler',
        tagline: 'Double-wall vacuum insulation with splash-proof slider lid.',
        image: getR2AssetUrl('images/products/tumbler.webp'),
        stage: 'Tooling & Mold',
        category: 'Vacuum Insulated',
        href: '/products/mugs-cups/travel-tumbler',
      },
    ],
  },
};

function ShowcasePreviewCardImage({
  src,
  alt,
  index,
}: {
  src: string;
  alt: string;
  index: number;
}) {
  const [imgError, setImgError] = useState(false);
  const gradients = [
    'radial-gradient(ellipse at 60% 40%, #1a1a2e 0%, #0a0a0c 100%)',
    'radial-gradient(ellipse at 60% 40%, #16213e 0%, #0a0a0c 100%)',
    'radial-gradient(ellipse at 60% 40%, #0f3460 0%, #0a0a0c 100%)',
    'radial-gradient(ellipse at 60% 40%, #2d1b4e 0%, #0a0a0c 100%)',
  ];

  return (
    <div className="relative aspect-square w-full my-3 flex items-center justify-center overflow-hidden rounded-xl bg-[#16161A]/80 border border-white/5 group-hover:border-[#ED9518]/30 transition-colors">
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{ background: gradients[index % gradients.length] }}
      />
      {!imgError ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          onError={() => setImgError(true)}
          className="object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-108 relative z-10 drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      ) : (
        <div className="relative z-10 flex flex-col items-center gap-2 text-center p-4">
          <span className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono text-xs font-bold">
            ◈
          </span>
          <span className="font-mono text-[10px] text-bone/50 uppercase tracking-widest">{alt}</span>
        </div>
      )}
    </div>
  );
}

export function FeaturedProducts({ initialProducts }: { initialProducts?: Product[] } = {}) {
  const productList = initialProducts || products;
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedClothingDesign, setSelectedClothingDesign] = useState<ClothingDesignEntry | null>(null);

  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);

  useEffect(() => {
    setWaitlistDone(false);
    setWaitlistEmail('');
  }, [activeTab]);

  useGSAP(
    () => {
      if (!gridRef.current) return;

      ScrollTrigger.batch(gridRef.current.children, {
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' },
          );
        },
        start: 'top 85%',
        once: true,
      });
    },
    { scope: sectionRef, dependencies: [activeTab] },
  );

  const filtered = useMemo(() => {
    // Filter out test items (basePrice === 1 are test/dummy products)
    const realProducts = productList.filter((p) => p.basePrice > 1);

    let result: Product[] = [];
    if (activeTab === 'all') {
      // Prioritize active purchasable items: posters first, then split-posters, tees, hoodies
      const postersFeatured = realProducts.filter((p) => p.featured && p.categorySlug === 'posters').slice(0, 4);
      const otherFeatured = realProducts
        .filter((p) => p.featured && !isProductComingSoon(p) && p.categorySlug !== 'posters')
        .slice(0, 4);
      result = [...postersFeatured, ...otherFeatured].slice(0, 8);
      // Fallback if still empty
      if (result.length === 0) {
        result = realProducts.filter((p) => !isProductComingSoon(p)).slice(0, 8);
      }
    } else if (activeTab === 'hoodies') {
      result = realProducts
        .filter((p) => p.categorySlug === 'hoodies' || p.categorySlug === 'tees')
        .slice(0, 8);
    } else if (activeTab === 'posters') {
      // Show featured posters first, then any posters
      const featuredPosters = realProducts.filter((p) => p.featured && p.categorySlug === 'posters');
      if (featuredPosters.length >= 4) {
        result = featuredPosters.slice(0, 8);
      } else {
        result = realProducts.filter((p) => p.categorySlug === 'posters').slice(0, 8);
      }
    } else if (!COMING_SOON_SHOWCASES[activeTab]) {
      result = realProducts.filter((p) => p.categorySlug === activeTab).slice(0, 8);
    }

    // Fallback if empty and not in coming soon showcase
    if (result.length === 0 && !COMING_SOON_SHOWCASES[activeTab]) {
      result = realProducts.filter((p) => !isProductComingSoon(p)).slice(0, 8);
    }

    return result;
  }, [productList, activeTab]);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes('@')) return;
    setWaitlistLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      });
      if (res.ok) {
        setWaitlistDone(true);
        setWaitlistEmail('');
      }
    } catch {
      // ignore
    } finally {
      setWaitlistLoading(false);
    }
  };

  return (
    <section ref={sectionRef} className="py-[var(--section-py)] bg-charcoal relative">
      <div className="section-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="overline-label block mb-3 text-cobalt">Curated Collection</span>
            <h2 className="font-display text-display-md md:text-display-lg font-bold text-bone">
              Trending Wall Art & Essentials
            </h2>
          </div>
          <Link
            href="/products/all"
            className="hidden md:flex items-center gap-2 font-mono text-caption text-pearl uppercase tracking-widest hover:text-cobalt transition-colors"
          >
            <span>Explore Catalog</span>
            <span>→</span>
          </Link>
        </div>

        {/* Category Tabs with Edge Fade Scroll Affordance */}
        <div className="relative mb-8 border-b border-smoke/30">
          <div
            role="tablist"
            aria-label="Product categories"
            className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-6 pr-12 scroll-smooth"
          >
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`font-mono text-caption uppercase tracking-widest px-4 py-2.5 rounded-full whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-bone text-charcoal font-bold shadow-md'
                    : 'bg-smoke/10 text-pearl hover:text-bone hover:bg-smoke/20 border border-smoke/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Subtle right-edge fade gradient cue */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-6 w-10 bg-gradient-to-l from-[#0A0A0A] to-transparent" />
        </div>

        {/* Dynamic Content: Coming Soon showcase vs Active Products Grid */}
        {COMING_SOON_SHOWCASES[activeTab] ? (
          (() => {
            const showcase = COMING_SOON_SHOWCASES[activeTab];
            return (
              <div className="space-y-12">
                {/* Coming Soon Hero Banner */}
                <div className="p-8 md:p-12 rounded-2xl bg-[#121214] border border-[#ED9518]/30 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-[#ED9518]/10 blur-[100px] pointer-events-none rounded-full" />
                  <div className="max-w-3xl space-y-4 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1A1A1E] border border-[#ED9518]/40">
                      <span className="w-2 h-2 rounded-full bg-[#ED9518] animate-pulse" />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#ED9518]">
                        COMING SOON · 2026 ROADMAP
                      </span>
                    </div>
                    <h3 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-[#F5F1EA]">
                      {showcase.title}
                    </h3>
                    <p className="font-mono text-xs sm:text-sm text-[#F5F1EA]/75 leading-relaxed max-w-2xl">
                      {showcase.description}
                    </p>

                    {/* VIP Early Access Form */}
                    <div className="pt-3 max-w-md">
                      {waitlistDone ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg font-mono text-xs text-emerald-400">
                          ✓ You are on the launch list! We will notify you when the first drop goes live.
                        </div>
                      ) : (
                        <form onSubmit={handleWaitlist} className="flex gap-2">
                          <input
                            type="email"
                            value={waitlistEmail}
                            onChange={(e) => setWaitlistEmail(e.target.value)}
                            placeholder="Enter email for drop alert..."
                            aria-label="Email for drop alert"
                            required
                            className="flex-1 bg-[#1A1A1E] border border-[#F5F1EA]/15 focus:border-[#0057FF] px-4 py-3 rounded-lg text-xs font-mono text-[#F5F1EA] placeholder-[#F5F1EA]/40 outline-none transition-colors"
                          />
                          <button
                            type="submit"
                            disabled={waitlistLoading}
                            className="px-5 py-3 bg-[#0057FF] hover:bg-[#0046CC] disabled:opacity-50 text-[#F5F1EA] font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap shadow-lg shadow-[#0057FF]/20 cursor-pointer"
                          >
                            {waitlistLoading ? '...' : 'Notify Me →'}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upcoming Concept Previews */}
                <div
                  ref={gridRef}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--grid-gap)]"
                >
                  {showcase.items.map((item, idx) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group block relative bg-[#121214] border border-[#F5F1EA]/10 hover:border-[#ED9518]/40 rounded-2xl p-5 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-[#ED9518]/5"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#1A1A1E] border border-[#ED9518]/30 text-[#ED9518] font-mono text-[9px] uppercase tracking-widest font-bold">
                          {item.stage}
                        </span>
                        <span className="font-mono text-[10px] text-[#F5F1EA]/40 uppercase tracking-widest">
                          {item.category}
                        </span>
                      </div>

                      <ShowcasePreviewCardImage src={item.image} alt={item.name} index={idx} />

                      <div className="mt-3 pt-3 border-t border-[#F5F1EA]/5 space-y-1">
                        <h4 className="font-display text-lg font-bold uppercase tracking-tight text-[#F5F1EA] group-hover:text-[#ED9518] transition-colors truncate">
                          {item.name}
                        </h4>
                        <p className="font-mono text-xs text-[#F5F1EA]/60 line-clamp-2 leading-relaxed">
                          {item.tagline}
                        </p>
                        <div className="pt-2 flex items-center justify-between font-mono text-xs">
                          <span className="text-[#ED9518] font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ED9518] animate-pulse" />
                            Coming Soon
                          </span>
                          <span className="text-[#F5F1EA]/40 group-hover:text-[#F5F1EA] group-hover:translate-x-0.5 transition-all text-xs">
                            View Details →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Explore Full Roadmap Link */}
                <div className="mt-10 flex justify-center">
                  <Link
                    href={showcase.roadmapLink}
                    className="group inline-flex items-center gap-3 bg-[#1A1A1E] hover:bg-[#222228] border border-[#ED9518]/40 text-[#ED9518] font-mono text-caption uppercase tracking-widest px-8 py-4 rounded-lg transition-all hover:scale-105 shadow-xl"
                  >
                    <span>{showcase.roadmapLabel}</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            );
          })()
        ) : (
          /* Products Grid for Active Categories */
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--grid-gap)]"
          >
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectDesign={setSelectedClothingDesign}
              />
            ))}
          </div>
        )}

        {/* Explore More Products CTA Button */}
        {!COMING_SOON_SHOWCASES[activeTab] && (
          <div className="mt-14 flex justify-center">
            <Link
              href="/products/all"
              className="group inline-flex items-center gap-3 bg-cobalt hover:bg-cobalt/90 text-bone font-mono text-caption uppercase tracking-widest px-8 py-4 rounded-lg transition-all hover:scale-105 shadow-lg shadow-cobalt/20"
            >
              <span>Explore More Products</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        )}

        {selectedClothingDesign && (
          <ClothingProductModal
            design={selectedClothingDesign}
            onClose={() => setSelectedClothingDesign(null)}
          />
        )}
      </div>
    </section>
  );
}
