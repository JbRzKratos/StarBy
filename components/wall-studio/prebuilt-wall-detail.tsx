'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PrebuiltWallProductData } from '@/lib/wall-studio/types';
import { getLayoutById } from '@/lib/wall-studio/layouts-data';
import { useCartStore } from '@/lib/stores/cart-store';
import {
  ShoppingBag,
  SlidersHorizontal,
  Layers,
  Ruler,
  Truck,
  ShieldCheck,
  Package,
  Wrench,
  HelpCircle,
  Star,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

interface PrebuiltWallDetailProps {
  wall: PrebuiltWallProductData;
}

export const PrebuiltWallDetail: React.FC<PrebuiltWallDetailProps> = ({ wall }) => {
  const addItem = useCartStore((state) => state.addItem);
  const setCartOpen = useCartStore((state) => state.setCartOpen);

  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'installation'>('details');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const layout = getLayoutById(wall.layoutId);
  const physicalCount = layout?.physicalPrintCount || 15;
  const coverage = layout?.coverageLabel || '175 × 110 cm';

  // Direct Add to Cart for prebuilt setup
  const handleAddToCart = () => {
    addItem({
      productId: `prebuilt_${wall.slug}`,
      variantId: `v_${layout?.id || 'standard'}`,
      name: `${wall.title}`,
      price: wall.basePrice,
      quantity: 1,
      size: coverage,
      image: wall.heroImage,
      customization: {
        isWallProduct: true,
        wallConfigurationId: `prebuilt_cfg_${Date.now()}`,
        layoutId: wall.layoutId,
        layoutSlug: layout?.slug || 'stepped-hero',
        layoutName: layout?.name || 'Stepped Hero',
        layoutVersion: layout?.version || 1,
        wallWidthMm: layout?.wallWidthMm || 1750,
        wallHeightMm: layout?.wallHeightMm || 1100,
        coverageLabel: coverage,
        physicalPrintCount: physicalCount,
        logicalArtworkCount: layout?.logicalArtworkCount || 13,
        slots: layout?.slots || [],
        previewFileUrl: wall.heroImage,
      },
    });

    setCartOpen(true);
  };

  const FAQS = [
    {
      q: 'Do I need to drill holes into my wall?',
      a: 'No. Every Fregoro Wall Setup includes our damage-free industrial high-tack adhesive strips that mount cleanly without nails, screws, or wall damage.',
    },
    {
      q: 'How do I align the posters properly?',
      a: 'We include a full-scale precision laser-marked hanging guide. Simply tape the lightweight guide to your wall, stick each numbered print onto its designated marker, and pull away the template.',
    },
    {
      q: 'Can I swap any artwork before buying?',
      a: 'Yes! Click "Customize This Wall" to open the interactive Wall Studio. You can swap any individual poster, upload your own photos, or balance colors while keeping this curated layout.',
    },
    {
      q: 'What paper and ink quality is used?',
      a: 'We print exclusively on 280 GSM museum-grade archival matte paper using 12-color pigment Giclée inks with a 100+ year fade-resistance rating.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* ─── SECTION 1: PRODUCT HERO & QUICK BUY ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* LEFT: Finished Wall Images Showcase */}
          <div className="lg:col-span-7 space-y-4">
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-black/80 border border-white/10 shadow-2xl"
              style={{ aspectRatio: '16/10' }}
            >
              <Image
                src={wall.heroImage}
                alt={wall.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest bg-black/80 backdrop-blur-md text-[#3B5EFF] px-2.5 py-1 rounded-full border border-[#3B5EFF]/30 font-bold">
                  Ready-Made Wall Setup
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest bg-black/80 backdrop-blur-md text-white/80 px-2.5 py-1 rounded-full border border-white/10">
                  {physicalCount} Physical Prints
                </span>
              </div>
            </div>

            {/* Room context photo if available */}
            {wall.roomPhoto && (
              <div
                className="relative w-full rounded-xl overflow-hidden bg-black/60 border border-white/10"
                style={{ aspectRatio: '21/9' }}
              >
                <Image
                  src={wall.roomPhoto}
                  alt={`${wall.title} in living room`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover filter brightness-90"
                />
                <span className="absolute bottom-3 left-4 text-[10px] font-mono text-white/70 bg-black/70 px-2.5 py-1 rounded backdrop-blur-md">
                  Exhibition Room Scale Preview
                </span>
              </div>
            )}
          </div>

          {/* RIGHT: Specs, Pricing & Actions */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#3B5EFF] font-bold">
                FREGORO CURATED ARCHIVE
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {wall.title}
              </h1>
              <p className="text-sm text-white/60 font-mono">{wall.tagline}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-mono text-white/80 font-bold">
                  {wall.rating || 4.9}
                </span>
                <span className="text-xs font-mono text-white/40">
                  ({wall.reviewCount || 28} verified collectors)
                </span>
              </div>
            </div>

            {/* Price block */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-mono text-white/40 block mb-0.5">
                  Full Pack Price
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    ₹{wall.basePrice.toLocaleString('en-IN')}
                  </span>
                  {wall.compareAtPrice && (
                    <span className="text-sm font-mono text-white/40 line-through">
                      ₹{wall.compareAtPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
              {wall.compareAtPrice && (
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                  Save ₹{(wall.compareAtPrice - wall.basePrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Key Dimension Specs */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-white/40 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-[#3B5EFF]" /> Wall Coverage
                </span>
                <span className="text-white font-bold text-sm">{coverage}</span>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-white/40 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#3B5EFF]" /> Physical Prints
                </span>
                <span className="text-white font-bold text-sm">{physicalCount} Pieces</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-3 pt-2">
              {/* CUSTOMIZE THIS WALL BUTTON */}
              <Link
                href={`/wall-studio?prebuilt=${wall.slug}`}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-[#3B5EFF]/20 border border-amber-400/40 hover:border-amber-300 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2.5 transition-all group"
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Customize This Wall in Studio</span>
              </Link>

              {/* DIRECT ADD TO CART */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3.5 rounded-xl bg-[#3B5EFF] hover:bg-[#2B4EFF] text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-[#3B5EFF]/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add Complete Setup to Cart (₹{wall.basePrice})</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-[11px] font-mono text-white/60">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-white/40" />
                <span>Free Express Shipping Across India</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-white/40" />
                <span>Museum Archival Certified</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: WHAT'S INCLUDED & SPECS ─── */}
        <div className="border-t border-white/10 pt-12 space-y-8">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4 font-mono text-xs">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-2 border-b-2 font-bold transition-colors ${
                activeTab === 'details'
                  ? 'border-[#3B5EFF] text-white'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              What&apos;s Included
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-2 border-b-2 font-bold transition-colors ${
                activeTab === 'specs'
                  ? 'border-[#3B5EFF] text-white'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              Material & Print Specs
            </button>
            <button
              onClick={() => setActiveTab('installation')}
              className={`pb-2 border-b-2 font-bold transition-colors ${
                activeTab === 'installation'
                  ? 'border-[#3B5EFF] text-white'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              Zero-Drill Installation
            </button>
          </div>

          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Full Physical Package Manifest</h3>
                <p className="text-xs text-white/60 leading-relaxed font-mono">
                  {wall.description}
                </p>
                <div className="space-y-2.5 pt-2">
                  {wall.whatsIncluded.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs font-mono text-white/80"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#3B5EFF] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 font-mono text-xs">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Package className="w-4 h-4 text-[#3B5EFF]" />
                  <span>Packaging & Collector Box</span>
                </div>
                <p className="text-white/60 leading-relaxed">
                  Every wall set is delivered inside a reinforced rigid collector’s flatbox with
                  acid-free glassine interleaving paper between every print to ensure zero curling
                  or scratching during transit.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-2xl space-y-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-white/40 block">Archival Paper</span>
                <span className="text-white font-bold">{wall.material}</span>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-white/40 block">Inks & Longevity</span>
                <span className="text-white font-bold">
                  12-Color Canon Lucia Pro High-Density Pigment Inks (100+ Years Lightfastness)
                </span>
              </div>
            </div>
          )}

          {activeTab === 'installation' && (
            <div className="max-w-3xl space-y-4 font-mono text-xs">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <Wrench className="w-5 h-5 text-[#3B5EFF] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-white">Full-Scale Hanging Template Included</h4>
                  <p className="text-white/60 leading-relaxed">
                    1. Unroll the included hanging guide and affix it to your wall with gentle
                    masking tape.
                    <br />
                    2. Peel and place each numbered poster onto the designated outline box.
                    <br />
                    3. Remove the template sheet. Your wall art is perfectly spaced and aligned in
                    under 15 minutes.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── SECTION 3: FAQS ─── */}
        <div className="border-t border-white/10 pt-12 space-y-6 max-w-3xl">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#3B5EFF]" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.01]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-4 text-left flex items-center justify-between text-white font-bold hover:bg-white/5 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-white/50 transition-transform ${
                      openFaq === i ? 'rotate-180 text-[#3B5EFF]' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="p-4 pt-0 text-white/70 leading-relaxed border-t border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
