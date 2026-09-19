'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MAGAZINE_TEMPLATES } from '@/data/magazineTemplates';
import type { WizardContentMap } from '@/types/magazine';
import { WizardLayout } from '@/components/magazine/content-wizard/wizard-layout';

function ContentWizardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template');

  const template = templateId
    ? (MAGAZINE_TEMPLATES.find((t) => t.id === templateId || t.slug === templateId) ?? null)
    : null;

  if (!template) {
    return (
      <div className="min-h-screen bg-[#0D0D0E] flex flex-col items-center justify-center text-[#F5F1EA] text-center px-6">
        <span className="text-4xl mb-4 opacity-20">◫</span>
        <h1 className="font-display text-2xl font-bold text-white mb-2">Template Not Found</h1>
        <p className="font-mono text-xs text-white/50 mb-8">
          The template you selected is no longer available.
        </p>
        <Link
          href="/magazine"
          className="px-6 py-3 rounded-xl bg-[#0057FF] text-white font-mono text-xs font-bold uppercase tracking-widest hover:bg-[#0046CC] transition-colors"
        >
          ← Back to Templates
        </Link>
      </div>
    );
  }

  const handleComplete = (contentMap: WizardContentMap) => {
    sessionStorage.setItem(`wizard-review-${template.id}`, JSON.stringify(contentMap));
    router.push(`/magazine/content-wizard/review?template=${template.id}`);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0D0D0E] overflow-hidden select-none">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 md:px-6 py-2.5 border-b border-white/10 bg-[#0D0D0E] z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/magazine"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center font-mono text-white/60 hover:text-white transition-all text-sm"
            title="Back to Templates"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#0057FF] font-bold">
                Content Wizard
              </span>
              <span className="text-white/20 text-[10px]">/</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 font-bold">
                Original PDF Layout Locked
              </span>
            </div>
            <h1 className="font-display text-sm font-bold text-white leading-tight">
              {template.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden lg:block font-mono text-[10px] text-white/40 uppercase tracking-wider">
            You provide content · We preserve design
          </span>
          <Link
            href={`/magazine/editor?template=${template.id}`}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 font-mono text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all border border-white/10"
          >
            Switch to Full Editor
          </Link>
        </div>
      </header>

      {/* Wizard body */}
      <div className="flex-1 overflow-hidden">
        <WizardLayout template={template} onComplete={handleComplete} />
      </div>
    </div>
  );
}

export default function ContentWizardPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-[#0D0D0E] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-[#0057FF] border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs text-white/40 uppercase tracking-widest">
              Loading wizard...
            </p>
          </div>
        </div>
      }
    >
      <ContentWizardInner />
    </Suspense>
  );
}
