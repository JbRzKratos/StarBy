'use client';

import React from 'react';
import Image from 'next/image';
import type { MagazineTemplate, WizardContentMap } from '@/types/magazine';
import type { TemplateWizardSchema } from '@/types/magazine';
import { getPageCompletion } from '@/lib/magazine/wizard-schema';

interface CompletionSidebarProps {
  template: MagazineTemplate;
  schema: TemplateWizardSchema;
  contentMap: WizardContentMap;
  currentPageIndex: number;
  onPageSelect: (index: number) => void;
}

export function CompletionSidebar({
  template,
  schema,
  contentMap,
  currentPageIndex,
  onPageSelect,
}: CompletionSidebarProps) {
  const totalRequired = schema.pages.reduce(
    (sum, p) => sum + p.elements.filter((e) => e.required).length,
    0,
  );
  const totalFilled = schema.pages.reduce((sum, p) => {
    return (
      sum +
      p.elements.filter((e) => e.required && (contentMap[e.elementId] ?? '').trim().length > 0)
        .length
    );
  }, 0);

  const completedPages = schema.pages.filter(
    (p) => getPageCompletion(p, contentMap) === 'complete',
  ).length;

  const progressPct = totalRequired > 0 ? Math.round((totalFilled / totalRequired) * 100) : 100;

  return (
    <aside className="h-full flex flex-col bg-[#0E0E12] border-r border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-white/10 flex-shrink-0">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#0057FF] font-bold mb-1">
          {template.name}
        </p>
        <h2 className="font-display text-sm font-bold text-white leading-tight">
          Page-by-Page Content
        </h2>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] text-white/40">
              {completedPages}/{schema.pages.length} pages done
            </span>
            <span className="font-mono text-[10px] text-white/40">{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#0057FF] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Page list */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5">
        {schema.pages.map((pageSchema, index) => {
          const status = getPageCompletion(pageSchema, contentMap);
          const isActive = index === currentPageIndex;
          const hasContent = pageSchema.elements.length > 0;

          // Thumbnail: use the pristine page render if available, else spreadPreviews or coverImage
          const bgEl = template.pages[index]?.elements.find(
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
            <button
              key={pageSchema.pageId}
              onClick={() => onPageSelect(index)}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-200 text-left ${
                isActive
                  ? 'bg-[#0057FF]/15 border border-[#0057FF]/40'
                  : 'hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {/* Thumbnail */}
              <div
                className={`relative flex-shrink-0 rounded-md overflow-hidden ${
                  isActive ? 'ring-2 ring-[#0057FF]' : 'ring-1 ring-white/10'
                }`}
                style={{ width: 36, height: 51 }}
              >
                <Image
                  src={thumbSrc}
                  alt={pageSchema.pageLabel}
                  fill
                  priority={index === 0}
                  className="object-cover"
                  sizes="36px"
                />
              </div>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <p
                  className={`font-mono text-[11px] font-bold truncate ${
                    isActive ? 'text-white' : 'text-white/70'
                  }`}
                >
                  {pageSchema.pageLabel}
                </p>
                {hasContent ? (
                  <p className="font-mono text-[10px] text-white/35 mt-0.5">
                    {pageSchema.elements.length} field{pageSchema.elements.length !== 1 ? 's' : ''}
                  </p>
                ) : (
                  <p className="font-mono text-[10px] text-white/25 mt-0.5 italic">Design only</p>
                )}
              </div>

              {/* Status badge */}
              <StatusBadge status={hasContent ? status : 'complete'} />
            </button>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="p-4 border-t border-white/10 flex-shrink-0">
        {progressPct === 100 ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            <span className="text-emerald-400 text-sm">✓</span>
            <span className="font-mono text-[11px] text-emerald-400 font-bold uppercase tracking-widest">
              All done!
            </span>
          </div>
        ) : (
          <p className="font-mono text-[10px] text-white/30 text-center">
            Fill required fields (●) on each page
          </p>
        )}
      </div>
    </aside>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'complete' | 'partial' | 'empty' }) {
  if (status === 'complete') {
    return (
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
        <span className="text-emerald-400 font-bold" style={{ fontSize: 10 }}>
          ✓
        </span>
      </div>
    );
  }
  if (status === 'partial') {
    return (
      <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
        <span className="text-amber-400 font-bold" style={{ fontSize: 8 }}>
          ◑
        </span>
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full bg-white/5 border border-white/15 flex items-center justify-center flex-shrink-0">
      <span className="text-white/25 font-bold" style={{ fontSize: 8 }}>
        ○
      </span>
    </div>
  );
}
