'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MAGAZINE_TEMPLATES } from '@/data/magazineTemplates';
import type { MagazineDocument, WizardContentMap } from '@/types/magazine';
import { DEFAULT_THEME } from '@/types/magazine';
import { getWizardSchema, getPageCompletion } from '@/lib/magazine/wizard-schema';
import { useCartStore } from '@/lib/stores/cart-store';

function ReviewInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const templateId = searchParams.get('template') ?? '';
  const template =
    MAGAZINE_TEMPLATES.find((t) => t.id === templateId || t.slug === templateId) ?? null;

  const [contentMap, setContentMap] = useState<WizardContentMap>({});
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(`wizard-review-${templateId}`);
    if (saved) {
      try {
        setContentMap(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
  }, [templateId]);

  const schema = useMemo(() => (template ? getWizardSchema(template) : null), [template]);

  const userInstructions = useMemo(() => {
    if (!schema) return [];
    const list: { page: string; label: string; instruction: string }[] = [];
    schema.pages.forEach((p) => {
      p.elements.forEach((el) => {
        const note = (contentMap[`${el.elementId}__instructions`] ?? '').trim();
        if (note) {
          list.push({ page: p.pageLabel, label: el.label, instruction: note });
        }
      });
    });
    return list;
  }, [schema, contentMap]);

  if (!template || !schema) {
    return (
      <div className="min-h-screen bg-[#0D0D0E] flex flex-col items-center justify-center text-center px-6">
        <p className="font-mono text-xs text-white/50 mb-6">Template not found.</p>
        <Link href="/magazine" className="text-[#0057FF] font-mono text-xs underline">
          ← Back to templates
        </Link>
      </div>
    );
  }

  const totalFields = schema.pages.reduce((s, p) => s + p.elements.length, 0);
  const filledFields = schema.pages.reduce(
    (s, p) =>
      s + p.elements.filter((e) => (contentMap[e.elementId] ?? '').trim().length > 0).length,
    0,
  );
  const completedPages = schema.pages.filter(
    (p) => getPageCompletion(p, contentMap) === 'complete',
  ).length;
  const requiredUnfilled = schema.pages.reduce(
    (arr, p) => {
      const missing = p.elements.filter(
        (e) => e.required && !(contentMap[e.elementId] ?? '').trim(),
      );
      return [...arr, ...missing.map((e) => ({ page: p.pageLabel, label: e.label }))];
    },
    [] as { page: string; label: string }[],
  );

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const populatedPages = template.pages.map((page) => ({
        ...page,
        elements: page.elements.map((el) => {
          const override = contentMap[el.id];
          if (override !== undefined) {
            return { ...el, content: override };
          }
          return el;
        }),
      }));

      const doc: MagazineDocument = {
        id: `mag-wizard-${Date.now()}`,
        title: template.name,
        templateId: template.id,
        dimensionKey: template.dimensionKey,
        theme: template.theme ?? DEFAULT_THEME,
        pages: populatedPages,
        pageCount: populatedPages.length,
        coverFinish: 'soft-touch',
        paperWeight: '170gsm-silk',
        bindingType: 'saddle-stitch',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(`magazine-doc-${doc.id}`, JSON.stringify(doc));

      addItem({
        productId: doc.id,
        variantId: 'magazine-wizard',
        quantity: 1,
        price: 1499,
        name: template.name,
        image: template.coverImage,
        customization: {
          magazineId: doc.id,
          magazineTitle: template.name,
          pageCount: doc.pageCount,
          paperWeight: doc.paperWeight,
          coverFinish: doc.coverFinish,
          bindingType: doc.bindingType,
          thumbnail: template.coverImage,
        },
      });

      sessionStorage.removeItem(`wizard-review-${template.id}`);
      sessionStorage.removeItem(`wizard-content-${template.id}`);

      router.push('/cart');
    } catch (err) {
      console.error('Error adding to cart:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0E] text-[#F5F1EA] pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/10 bg-[#0D0D0E]/95 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center font-mono text-white/60 hover:text-white transition-all"
          >
            ←
          </button>
          <div>
            <span className="font-mono text-[10px] text-[#0057FF] font-bold uppercase tracking-widest block">
              Review
            </span>
            <h1 className="font-display text-sm font-bold text-white leading-none">
              {template.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-white/50">
            {filledFields}/{totalFields} fields filled
          </span>
          <Link
            href={`/magazine/content-wizard?template=${template.id}`}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 font-mono text-[10px] font-bold uppercase tracking-widest text-white/60 transition-all"
          >
            ← Edit Content
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-8 space-y-10">
        {/* Completion summary */}
        <div className="p-6 rounded-2xl bg-[#141418] border border-white/10 grid grid-cols-3 gap-6">
          <StatBlock
            value={`${completedPages}/${schema.pages.length}`}
            label="Pages Complete"
            color={completedPages === schema.pages.length ? '#10b981' : '#0057FF'}
          />
          <StatBlock
            value={`${filledFields}/${totalFields}`}
            label="Fields Filled"
            color="#0057FF"
          />
          <StatBlock
            value={requiredUnfilled.length === 0 ? '✓' : `${requiredUnfilled.length} missing`}
            label="Required Fields"
            color={requiredUnfilled.length === 0 ? '#10b981' : '#f59e0b'}
          />
        </div>

        {/* Missing required fields warning */}
        {requiredUnfilled.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">
              ⚠ Required fields missing
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {requiredUnfilled.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="font-mono text-[11px] text-amber-400/80">
                    {item.page} → {item.label}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href={`/magazine/content-wizard?template=${template.id}`}
              className="inline-flex items-center gap-1.5 mt-4 font-mono text-xs font-bold text-amber-400 hover:text-white transition-colors"
            >
              ← Go back and fill them →
            </Link>
          </div>
        )}

        {/* Page-by-page review grid */}
        <section>
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-white/50 mb-5">
            All Pages
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {template.pages.map((page, index) => {
              const pageSchema = schema.pages[index];
              const status = pageSchema ? getPageCompletion(pageSchema, contentMap) : 'complete';
              const bgEl = page.elements.find(
                (e) =>
                  e.placeholderKey === 'background-image' ||
                  (e.frame.x <= 1 && e.frame.y <= 1 && e.frame.width >= 99 && e.frame.height >= 99),
              );
              const rawBg = bgEl?.content ?? '';
              const thumbSrc = rawBg.includes('_bg.png')
                ? rawBg.replace('_bg.png', '_full.png')
                : index === 0
                  ? template.coverImage
                  : (template.spreadPreviews?.[index - 1] ?? template.coverImage);

              return (
                <Link
                  key={page.id}
                  href={`/magazine/content-wizard?template=${template.id}`}
                  className="group block"
                >
                  <div
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border transition-all ${
                      status === 'complete'
                        ? 'border-emerald-500/30'
                        : status === 'partial'
                          ? 'border-amber-500/30'
                          : 'border-white/10'
                    }`}
                  >
                    <Image
                      src={thumbSrc}
                      alt={pageSchema?.pageLabel ?? `Page ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    <div className="absolute top-2 right-2">
                      {status === 'complete' && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-[9px] shadow-lg">
                          ✓
                        </span>
                      )}
                      {status === 'partial' && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-[9px] shadow-lg">
                          ◑
                        </span>
                      )}
                      {status === 'empty' && (
                        <span className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/40 font-bold text-[9px] shadow-lg">
                          ○
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="font-mono text-[10px] text-white font-bold">Edit</span>
                    </div>
                  </div>
                  <p className="font-mono text-[10px] text-white/50 mt-1.5 truncate text-center">
                    {pageSchema?.pageLabel ?? `Page ${index + 1}`}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Custom instructions summary */}
        {userInstructions.length > 0 && (
          <section>
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
              <span className="text-[#0057FF]">✎</span>
              <span>Your Custom Design Instructions ({userInstructions.length})</span>
            </h2>
            <div className="p-5 rounded-2xl bg-[#141418] border border-white/10 space-y-3">
              {userInstructions.map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-xs"
                >
                  <span className="font-mono text-[10px] font-bold text-[#0057FF] uppercase tracking-wider min-w-[140px]">
                    {item.page} · {item.label}:
                  </span>
                  <span className="font-mono text-white/80 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                    "{item.instruction}"
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Print configuration */}
        <section>
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-white/50 mb-5">
            Print Configuration
          </h2>
          <div className="p-6 rounded-2xl bg-[#141418] border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <PrintStat label="Cover" value="Soft Touch Matte" />
            <PrintStat label="Paper" value="170gsm Silk" />
            <PrintStat label="Binding" value="Saddle Stitch" />
            <PrintStat label="Format" value="A4 Portrait" />
          </div>
        </section>

        {/* Pricing & CTA */}
        <div className="p-6 rounded-2xl bg-[#141418] border border-[#0057FF]/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-mono text-xs text-white/50 mb-1">Starting from</p>
            <p className="font-display text-3xl font-black text-white">
              ₹1,499
              <span className="font-mono text-sm text-white/40 ml-2">/ copy</span>
            </p>
            <p className="font-mono text-[10px] text-white/35 mt-1">
              Includes print, lamination & delivery. VAT not included.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href={`/magazine/content-wizard?template=${template.id}`}
              className="flex-1 md:flex-none px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 font-mono text-xs font-bold uppercase tracking-widest text-white/70 text-center transition-all"
            >
              ← Edit More
            </Link>
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="flex-1 md:flex-none px-8 py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-widest text-white shadow-2xl shadow-[#0057FF]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #0057FF, #003FBF)' }}
            >
              {isAdding ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-white/50 border-t-transparent rounded-full animate-spin" />
                  Adding...
                </span>
              ) : (
                'Add to Cart & Order →'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-2xl font-black" style={{ color }}>
        {value}
      </p>
      <p className="font-mono text-[10px] text-white/40 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function PrintStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className="font-mono text-xs text-white font-bold">{value}</p>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D0D0E] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#0057FF] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ReviewInner />
    </Suspense>
  );
}
