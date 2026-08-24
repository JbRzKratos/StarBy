'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';
import { products, type Product } from '@/data/products';
import { ProductCard } from '@/components/product/product-card';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Featured' },
  { id: 'posters', label: 'Posters' },
  { id: 'split-posters', label: 'Split Posters' },
  { id: 'hoodies', label: 'Hoodies & Tees' },
  { id: 'mugs-cups', label: 'Mugs & Cups' },
  { id: 'skins', label: 'Device Skins' },
];

const MUG_PREVIEWS = [
  {
    name: 'Classic Stoneware Mug',
    tagline: '11oz ceramic stoneware for daily rituals.',
    image: '/images/products/classic_mug_11oz.png',
    stage: 'In Development',
  },
  {
    name: 'Heavyweight Studio Mug',
    tagline: '15oz velvet matte weighted stoneware.',
    image: '/images/products/classic_mug_15oz.png',
    stage: 'Material Testing',
  },
  {
    name: 'Magic Heat-Shift Mug',
    tagline: 'Obsidian thermal color-shift glaze.',
    image: '/images/products/magic_mug.png',
    stage: 'Lab Formulation',
  },
  {
    name: 'Insulated Travel Tumbler',
    tagline: 'Double-wall stainless vacuum vessel.',
    image: '/images/products/tumbler.png',
    stage: 'Prototyping',
  },
];

export function FeaturedProducts() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('all');

  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);

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

  let filtered: Product[] = [];
  if (activeTab === 'all') {
    filtered = products.filter((p) => p.featured && p.categorySlug !== 'mugs-cups').slice(0, 8);
  } else if (activeTab === 'hoodies') {
    filtered = products
      .filter((p) => p.categorySlug === 'hoodies' || p.categorySlug === 'tees')
      .slice(0, 8);
  } else if (activeTab !== 'mugs-cups') {
    filtered = products.filter((p) => p.categorySlug === activeTab).slice(0, 8);
  }

  // Fallback if empty and not mugs
  if (filtered.length === 0 && activeTab !== 'mugs-cups') {
    filtered = products.filter((p) => p.categorySlug !== 'mugs-cups').slice(0, 8);
  }

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
    <section ref={sectionRef} className="py-20 md:py-32 bg-charcoal relative">
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

        {/* Category Tabs */}
        <div
          role="tablist"
          aria-label="Product categories"
          className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-6 mb-8 border-b border-smoke/30"
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

        {/* Dynamic Content: Coming Soon state vs Active Products Grid */}
        {activeTab === 'mugs-cups' ? (
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
                  Cups & Mugs Collection
                </h3>
                <p className="font-mono text-xs sm:text-sm text-[#F5F1EA]/75 leading-relaxed max-w-2xl">
                  A new way to enjoy <strong className="text-[#F5F1EA]">FREGORO</strong> is on the
                  way. Our Cups & Mugs collection is currently in development and will be available
                  soon with custom stoneware, thermal drinkware, and heat-reactive finishes.
                </p>

                {/* VIP Early Access Form */}
                <div className="pt-3 max-w-md">
                  {waitlistDone ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg font-mono text-xs text-emerald-400">
                      ✓ You are on the launch list! We will notify you when the first drop goes
                      live.
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
                        className="px-5 py-3 bg-[#0057FF] hover:bg-[#0046CC] disabled:opacity-50 text-[#F5F1EA] font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap shadow-lg shadow-[#0057FF]/20"
                      >
                        {waitlistLoading ? '...' : 'Notify Me →'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Concept Previews */}
            <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {MUG_PREVIEWS.map((item) => (
                <Link
                  key={item.name}
                  href="/products/mugs-cups"
                  className="group block relative bg-[#121214] border border-[#F5F1EA]/10 hover:border-[#ED9518]/40 rounded-2xl p-5 transition-all duration-300 shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1A1A1E] border border-[#ED9518]/30 text-[#ED9518] font-mono text-[9px] uppercase tracking-widest font-bold">
                      {item.stage}
                    </span>
                    <span className="font-mono text-[10px] text-[#F5F1EA]/40 uppercase tracking-widest">
                      Preview
                    </span>
                  </div>

                  <div className="relative aspect-square w-full my-2 flex items-center justify-center overflow-hidden rounded-xl bg-[#16161A]/50">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F5F1EA]/5 space-y-1">
                    <h4 className="font-display text-lg font-bold uppercase tracking-tight text-[#F5F1EA] group-hover:text-[#ED9518] transition-colors">
                      {item.name}
                    </h4>
                    <p className="font-mono text-xs text-[#F5F1EA]/60">{item.tagline}</p>
                    <div className="pt-2 flex items-center justify-between font-mono text-xs">
                      <span className="text-[#ED9518] font-bold uppercase tracking-wider text-[11px]">
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
                href="/products/mugs-cups"
                className="group inline-flex items-center gap-3 bg-[#1A1A1E] hover:bg-[#222228] border border-[#ED9518]/40 text-[#ED9518] font-mono text-caption uppercase tracking-widest px-8 py-4 rounded-lg transition-all hover:scale-105 shadow-xl"
              >
                <span>Explore Full 2026 Cups & Mugs Roadmap</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Products Grid for Active Categories */
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Explore More Products CTA Button */}
        {activeTab !== 'mugs-cups' && (
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
      </div>
    </section>
  );
}
