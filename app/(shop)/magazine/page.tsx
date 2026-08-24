'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MAGAZINE_TEMPLATES } from '@/data/magazineTemplates';
import type { MagazineCategory, MagazineTemplate } from '@/types/magazine';

const CATEGORIES: Array<{ id: MagazineCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All Templates' },
  { id: 'fashion', label: 'Fashion & Lifestyle' },
  { id: 'technology', label: 'Technology & Catalogue' },
  { id: 'mens-style', label: 'Men’s Style' },
  { id: 'catalogue', label: 'Product Catalogues' },
  { id: 'editorial', label: 'Creative & Editorial' },
  { id: 'business', label: 'Business & Reports' },
  { id: 'blank', label: 'Start from Blank' },
];

export default function MagazineStudioLanding() {
  const [activeCategory, setActiveCategory] = useState<MagazineCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] =
    useState<MagazineTemplate | null>(null);

  const filteredTemplates = MAGAZINE_TEMPLATES.filter((tpl) => {
    const matchesCategory = activeCategory === 'all' || tpl.category === activeCategory;
    const matchesSearch =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.styleTags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0D0D0E] text-[#F5F1EA] pt-24 pb-20">
      {/* ── 1. Hero Section ── */}
      <section className="section-container relative overflow-hidden pt-8 pb-16 md:pb-24">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#0057FF]/15 blur-[140px] pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1A1E] border border-[#F5F1EA]/15">
            <span className="w-2 h-2 rounded-full bg-[#0057FF] animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#0057FF]">
              FREGORO MAGAZINE STUDIO
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white leading-[1.05]">
            Create a Magazine That Looks Like You
          </h1>

          <p className="font-mono text-sm sm:text-base md:text-lg text-[#F5F1EA]/75 max-w-2xl mx-auto leading-relaxed">
            Choose a professional FREGORO template, customize every page with your own content, and
            turn your design into a print-ready magazine delivered to your door.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/magazine/templates"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#0057FF] hover:bg-[#0046CC] text-white font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-[#0057FF]/30 hover:scale-105"
            >
              Create Your Magazine →
            </Link>
            <Link
              href="/magazine/upload-pdf"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#1A1A1E] hover:bg-[#25252E] border border-[#F5F1EA]/20 text-[#F5F1EA] font-mono text-xs font-bold uppercase tracking-widest transition-all"
            >
              Already Have a PDF? Upload Here
            </Link>
          </div>
        </div>

        {/* Hero Featured Spreads Collage */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {MAGAZINE_TEMPLATES.slice(0, 3).map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => setSelectedTemplateForPreview(tpl)}
              className="group relative rounded-2xl overflow-hidden bg-[#16161A] border border-[#F5F1EA]/10 hover:border-[#0057FF]/60 transition-all duration-500 cursor-pointer shadow-2xl"
            >
              <div className="aspect-[3/4] relative w-full overflow-hidden bg-black">
                <Image
                  src={tpl.coverImage}
                  alt={tpl.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                {tpl.badge && (
                  <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-[#0057FF] font-mono text-[9px] font-bold tracking-widest text-white uppercase">
                    {tpl.badge}
                  </div>
                )}
              </div>

              <div className="p-5 space-y-2 relative z-10 -mt-16">
                <div className="flex items-center justify-between text-xs font-mono text-[#F5F1EA]/60">
                  <span className="uppercase">{tpl.category}</span>
                  <span>{tpl.pageCount} Pages · A4</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white group-hover:text-[#0057FF] transition-colors">
                  {tpl.name}
                </h3>
                <p className="font-mono text-xs text-[#F5F1EA]/70 line-clamp-2">
                  {tpl.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. Two Distinct Workflows (Path A vs Path B) ── */}
      <section className="section-container py-16 border-y border-[#F5F1EA]/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Path A */}
          <div className="p-8 rounded-2xl bg-[#141418] border border-[#0057FF]/30 space-y-4 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#0057FF]/20 border border-[#0057FF]/40 flex items-center justify-center font-mono text-sm font-bold text-[#0057FF]">
              01
            </div>
            <h3 className="font-display text-2xl font-bold text-white">
              Create With FREGORO Studio
            </h3>
            <p className="font-mono text-xs text-[#F5F1EA]/70 leading-relaxed">
              Select from curated editorial layouts, replace images and typography with smart
              auto-fitting, inspect through real-time 300 DPI preflight, and order high-spec
              physical copies.
            </p>
            <Link
              href="/magazine/templates"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase font-bold text-[#0057FF] hover:text-white transition-colors pt-2"
            >
              <span>Explore Templates</span>
              <span>→</span>
            </Link>
          </div>

          {/* Path B */}
          <div className="p-8 rounded-2xl bg-[#141418] border border-[#F5F1EA]/10 hover:border-[#F5F1EA]/30 space-y-4 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1E] border border-[#F5F1EA]/20 flex items-center justify-center font-mono text-sm font-bold text-white">
              02
            </div>
            <h3 className="font-display text-2xl font-bold text-white">
              Already Have a Finished PDF?
            </h3>
            <p className="font-mono text-xs text-[#F5F1EA]/70 leading-relaxed">
              Designed your publication in InDesign, Canva, or Figma? Upload your print-ready PDF
              (up to 50MB) for automated plate verification, paper selection, and door-to-door
              delivery.
            </p>
            <Link
              href="/magazine/upload-pdf"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase font-bold text-[#F5F1EA] hover:text-[#0057FF] transition-colors pt-2"
            >
              <span>Upload Finished PDF</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. Template Library Showcase ── */}
      <section className="section-container py-20 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-mono text-xs text-[#0057FF] uppercase tracking-widest font-bold block mb-2">
              CURATED TEMPLATE REGISTRY
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
              Explore Editorial Formats
            </h2>
          </div>

          {/* Search Input */}
          <div className="w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fashion, tech, catalogue..."
              className="w-full bg-[#16161A] border border-[#F5F1EA]/15 focus:border-[#0057FF] px-4 py-2.5 rounded-xl font-mono text-xs text-white placeholder-[#F5F1EA]/40 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-4 border-b border-[#F5F1EA]/10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full font-mono text-xs uppercase font-bold whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#16161A] text-[#F5F1EA]/60 hover:text-white hover:bg-[#202028]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="group bg-[#121214] border border-[#F5F1EA]/10 hover:border-[#0057FF]/50 rounded-2xl p-5 space-y-4 transition-all duration-300 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div
                  onClick={() => setSelectedTemplateForPreview(tpl)}
                  className="aspect-[3/4] relative w-full rounded-xl overflow-hidden bg-black cursor-pointer group-hover:scale-[1.01] transition-transform"
                >
                  <Image
                    src={tpl.coverImage}
                    alt={tpl.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 rounded-lg bg-black/80 backdrop-blur font-mono text-xs text-white uppercase font-bold">
                      Quick Spread Preview
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#F5F1EA]/50 uppercase mb-1">
                    <span>{tpl.category}</span>
                    <span>{tpl.pageCount} Pages</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-white group-hover:text-[#0057FF] transition-colors">
                    {tpl.name}
                  </h3>
                  <p className="font-mono text-xs text-[#F5F1EA]/70 mt-1 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-[#F5F1EA]/5 flex items-center gap-2">
                <button
                  onClick={() => setSelectedTemplateForPreview(tpl)}
                  className="flex-1 py-2.5 rounded-lg bg-[#1A1A1E] hover:bg-[#25252E] font-mono text-xs font-bold text-[#F5F1EA] uppercase transition-colors"
                >
                  Preview
                </button>
                <Link
                  href={`/magazine/editor?template=${tpl.id}`}
                  className="flex-1 py-2.5 rounded-lg bg-[#0057FF] hover:bg-[#0046CC] text-center font-mono text-xs font-bold text-white uppercase transition-colors shadow-md shadow-[#0057FF]/20"
                >
                  Customize →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Quick Template Preview Modal ── */}
      {selectedTemplateForPreview && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#F5F1EA]/15 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-[#F5F1EA] shadow-2xl">
            <div className="p-6 border-b border-[#F5F1EA]/10 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#0057FF] font-bold">
                  {selectedTemplateForPreview.category} · {selectedTemplateForPreview.pageCount}{' '}
                  Pages
                </span>
                <h3 className="font-display text-2xl font-bold text-white">
                  {selectedTemplateForPreview.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTemplateForPreview(null)}
                className="p-2 rounded-lg bg-[#1A1A1E] text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-black">
                  <Image
                    src={selectedTemplateForPreview.coverImage}
                    alt="cover"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-[9px] font-mono">
                    Cover Page
                  </div>
                </div>

                {selectedTemplateForPreview.spreadPreviews?.[0] && (
                  <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-black">
                    <Image
                      src={selectedTemplateForPreview.spreadPreviews[0]}
                      alt="spread"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-[9px] font-mono">
                      Inside Spread
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 font-mono text-xs text-[#F5F1EA]/80 leading-relaxed">
                <h4 className="font-bold text-white uppercase">About this layout:</h4>
                <p>{selectedTemplateForPreview.description}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedTemplateForPreview.styleTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded bg-[#1A1A1E] border border-[#F5F1EA]/10 text-[10px] text-[#F5F1EA]/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#F5F1EA]/10 flex items-center justify-between bg-[#0D0D0E]">
              <button
                onClick={() => setSelectedTemplateForPreview(null)}
                className="px-4 py-2.5 rounded-lg bg-[#1A1A1E] font-mono text-xs font-bold uppercase"
              >
                Close Preview
              </button>
              <Link
                href={`/magazine/editor?template=${selectedTemplateForPreview.id}`}
                className="px-6 py-2.5 rounded-lg bg-[#0057FF] hover:bg-[#0046CC] font-mono text-xs font-bold text-white uppercase shadow-lg shadow-[#0057FF]/30"
              >
                Open in Editor →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
