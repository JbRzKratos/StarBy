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

export default function MagazineTemplatesDirectory() {
  const [activeCategory, setActiveCategory] = useState<MagazineCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<MagazineTemplate | null>(null);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]));
  };

  const filteredTemplates = MAGAZINE_TEMPLATES.filter((tpl) => {
    const matchesCat = activeCategory === 'all' || tpl.category === activeCategory;
    const matchesFormat = selectedFormat === 'all' || tpl.dimensionKey === selectedFormat;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      tpl.name.toLowerCase().includes(q) ||
      tpl.description.toLowerCase().includes(q) ||
      tpl.styleTags.some((tag) => tag.toLowerCase().includes(q));
    return matchesCat && matchesFormat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0D0D0E] text-[#F5F1EA] pt-28 pb-24">
      <div className="section-container space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#F5F1EA]/10">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#0057FF] uppercase font-bold mb-2">
              <Link href="/magazine" className="hover:text-white transition-colors">
                Magazine Studio
              </Link>
              <span>/</span>
              <span>Template Directory</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-black uppercase text-white">
              Curated Editorial Templates
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#F5F1EA]/70 mt-2 max-w-2xl leading-relaxed">
              Explore art-directed magazine templates engineered for print precision. Each layout
              features modular typography, 3mm bleed margins, and customizable color systems.
            </p>
          </div>

          <Link
            href="/magazine/upload-pdf"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#16161A] hover:bg-[#202028] border border-[#F5F1EA]/15 font-mono text-xs font-bold text-white uppercase whitespace-nowrap"
          >
            <span>Have Your Own PDF?</span>
            <span>→</span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates, styles, keywords..."
              className="w-full bg-[#16161A] border border-[#F5F1EA]/15 focus:border-[#0057FF] px-4 py-2.5 rounded-xl font-mono text-xs text-white placeholder-[#F5F1EA]/40 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="bg-[#16161A] border border-[#F5F1EA]/15 px-4 py-2.5 rounded-xl font-mono text-xs text-white outline-none cursor-pointer"
            >
              <option value="all">All Page Formats</option>
              <option value="a4-portrait">A4 Portrait (210×297mm)</option>
              <option value="a4-landscape">A4 Landscape (297×210mm)</option>
              <option value="a5-portrait">A5 Portrait (148×210mm)</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
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

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tpl) => {
            const isFav = favorites.includes(tpl.id);

            return (
              <div
                key={tpl.id}
                className="group bg-[#121214] border border-[#F5F1EA]/10 hover:border-[#0057FF]/50 rounded-2xl p-5 space-y-4 transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div
                    onClick={() => setPreviewTemplate(tpl)}
                    className="aspect-[3/4] relative w-full rounded-xl overflow-hidden bg-black cursor-pointer group-hover:scale-[1.01] transition-transform"
                  >
                    <Image
                      src={tpl.coverImage}
                      alt={tpl.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => toggleFavorite(tpl.id, e)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur hover:bg-black/80 text-white z-10"
                      title="Favorite"
                    >
                      {isFav ? '❤️' : '🤍'}
                    </button>

                    {tpl.badge && (
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-[#0057FF] font-mono text-[9px] font-bold text-white uppercase tracking-wider">
                        {tpl.badge}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#F5F1EA]/50 uppercase mb-1">
                      <span>{tpl.category}</span>
                      <span>{tpl.pageCount} Pages</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-white group-hover:text-[#0057FF] transition-colors">
                      {tpl.name}
                    </h3>
                    <p className="font-mono text-xs text-[#F5F1EA]/70 mt-1 line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F5F1EA]/5 flex items-center gap-2">
                  <button
                    onClick={() => setPreviewTemplate(tpl)}
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
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-20 bg-[#141418] rounded-2xl border border-[#F5F1EA]/10 space-y-4">
            <span className="text-3xl">📖</span>
            <h3 className="font-display text-xl font-bold">No templates found</h3>
            <p className="font-mono text-xs text-[#F5F1EA]/60 max-w-sm mx-auto">
              Try adjusting your search filters or start from a blank modular canvas.
            </p>
            <Link
              href="/magazine/editor?template=tpl-blank-canvas"
              className="inline-block px-6 py-3 rounded-xl bg-[#0057FF] font-mono text-xs font-bold text-white uppercase"
            >
              Start From Blank Canvas →
            </Link>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#F5F1EA]/15 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-[#F5F1EA] shadow-2xl">
            <div className="p-6 border-b border-[#F5F1EA]/10 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#0057FF] font-bold">
                  {previewTemplate.category} · {previewTemplate.pageCount} Pages
                </span>
                <h3 className="font-display text-2xl font-bold text-white">
                  {previewTemplate.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 rounded-lg bg-[#1A1A1E] text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-black">
                  <Image
                    src={previewTemplate.coverImage}
                    alt="cover"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-[9px] font-mono">
                    Cover Layout
                  </div>
                </div>

                {previewTemplate.spreadPreviews?.[0] && (
                  <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-black">
                    <Image
                      src={previewTemplate.spreadPreviews[0]}
                      alt="spread"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-[9px] font-mono">
                      Inside Spread Preview
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 font-mono text-xs text-[#F5F1EA]/80 leading-relaxed">
                <h4 className="font-bold text-white uppercase">Layout Details:</h4>
                <p>{previewTemplate.description}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {previewTemplate.styleTags.map((tag) => (
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
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2.5 rounded-lg bg-[#1A1A1E] font-mono text-xs font-bold uppercase"
              >
                Close Preview
              </button>
              <Link
                href={`/magazine/editor?template=${previewTemplate.id}`}
                className="px-6 py-2.5 rounded-lg bg-[#0057FF] hover:bg-[#0046CC] font-mono text-xs font-bold text-white uppercase shadow-lg shadow-[#0057FF]/30"
              >
                Customize This Template →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
