'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { MagazineTemplate, WizardContentMap } from '@/types/magazine';
import { getWizardSchema, getPageCompletion } from '@/lib/magazine/wizard-schema';
import { CompletionSidebar } from './completion-sidebar';
import { PageCanvasPreview } from './page-canvas-preview';
import { ContentForm } from './content-form';

interface WizardLayoutProps {
  template: MagazineTemplate;
  /** Called when user completes and clicks "Review & Order" */
  onComplete: (contentMap: WizardContentMap) => void;
}

export function WizardLayout({ template, onComplete }: WizardLayoutProps) {
  const schema = useMemo(() => getWizardSchema(template), [template]);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [contentMap, setContentMap] = useState<WizardContentMap>({});
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Hide floating chat widgets (Tawk.to and WhatsApp) while in the wizard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.classList.add('magazine-editor-active');
      const win = window as unknown as {
        Tawk_API?: { hideWidget?: () => void; showWidget?: () => void };
      };
      try {
        win.Tawk_API?.hideWidget?.();
      } catch {
        /* ignore */
      }

      return () => {
        document.body.classList.remove('magazine-editor-active');
        try {
          win.Tawk_API?.showWidget?.();
        } catch {
          /* ignore */
        }
      };
    }
  }, []);

  // Auto-save to sessionStorage
  useEffect(() => {
    const key = `wizard-content-${template.id}`;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      try {
        setContentMap(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
  }, [template.id]);

  useEffect(() => {
    sessionStorage.setItem(`wizard-content-${template.id}`, JSON.stringify(contentMap));
  }, [contentMap, template.id]);

  const handleContentChange = useCallback((elementId: string, value: string) => {
    setContentMap((prev) => ({ ...prev, [elementId]: value }));
  }, []);

  const currentPage = template.pages[currentPageIndex];
  const currentPageSchema = schema.pages[currentPageIndex];

  const currentPageElements = currentPageSchema?.elements ?? [];
  const currentPageTotalCount = currentPageElements.length;
  const currentPageFilledCount = currentPageElements.filter(
    (el) => (contentMap[el.elementId] ?? '').trim().length > 0,
  ).length;

  const completedPages = schema.pages.filter(
    (p) => getPageCompletion(p, contentMap) === 'complete',
  ).length;
  const allDone = completedPages === schema.pages.length;

  const goNext = () => {
    if (currentPageIndex < schema.pages.length - 1) {
      setCurrentPageIndex((i) => i + 1);
      setFocusedElementId(null);
    }
  };

  const goPrev = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((i) => i - 1);
      setFocusedElementId(null);
    }
  };

  return (
    <div
      data-magazine-editor="true"
      className="flex h-full bg-[#0D0D0E] text-[#F5F1EA] overflow-hidden"
    >
      {/* ── Left: Completion Sidebar ── */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ${
          sidebarOpen ? 'w-52' : 'w-0'
        } overflow-hidden hidden md:block`}
      >
        <div className="w-52 h-full">
          <CompletionSidebar
            template={template}
            schema={schema}
            contentMap={contentMap}
            currentPageIndex={currentPageIndex}
            onPageSelect={(i) => {
              setCurrentPageIndex(i);
              setFocusedElementId(null);
            }}
          />
        </div>
      </div>

      {/* ── Center: Canvas Preview ── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-white/10">
        {/* Canvas top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0E0E12] flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle on md */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-mono text-sm text-white/50"
              title="Toggle page list"
            >
              ◫
            </button>

            <span className="font-mono text-xs text-white/50">
              Page {currentPageIndex + 1} of {schema.pages.length}
            </span>
            <span className="font-mono text-xs font-bold text-white/80">
              {currentPageSchema?.pageLabel}
            </span>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/60">
              Design Locked
            </span>
          </div>
        </div>

        {/* Canvas area */}
        <div
          className={`flex-1 min-h-0 overflow-hidden flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#111113] isolate ${
            mobileSheetOpen ? 'pointer-events-none' : ''
          }`}
        >
          <div className="h-full w-full max-h-full max-w-full flex items-center justify-center isolate">
            {currentPage && (
              <PageCanvasPreview
                page={currentPage}
                contentMap={contentMap}
                focusedElementId={focusedElementId}
                onSelectElement={(id) => {
                  setFocusedElementId(id);
                  setMobileSheetOpen(true);
                }}
              />
            )}
          </div>
        </div>

        {/* ── Desktop Canvas bottom nav ── */}
        <div className="hidden md:flex items-center justify-between px-4 py-3 border-t border-white/10 bg-[#0E0E12] flex-shrink-0">
          <button
            onClick={goPrev}
            disabled={currentPageIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 text-white/70"
          >
            ← Previous
          </button>

          {/* Desktop page indicator */}
          <div className="flex items-center gap-1">
            {schema.pages.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentPageIndex(i);
                  setFocusedElementId(null);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentPageIndex ? 'bg-[#0057FF] w-3' : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {currentPageIndex < schema.pages.length - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-widest bg-[#0057FF] hover:bg-[#0046CC] text-white transition-all shadow-md shadow-[#0057FF]/20"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => onComplete(contentMap)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-lg ${
                allDone
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'
                  : 'bg-[#0057FF] hover:bg-[#0046CC] text-white shadow-[#0057FF]/20'
              }`}
            >
              {allDone ? '✓ Review & Order' : 'Review →'}
            </button>
          )}
        </div>

        {/* ── Mobile Unified Bottom Action Dock (iPhone SE to iPhone 18 Pro Max) ── */}
        <div
          className="flex md:hidden flex-col gap-2 px-3 pt-2.5 border-t border-white/10 bg-[#0E0E12] flex-shrink-0 z-30 shadow-2xl"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Top micro-bar: page dots & current count */}
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[10px] text-white/50">
              Page {currentPageIndex + 1}/{schema.pages.length} · {currentPageSchema?.pageLabel}
            </span>
            <div className="flex items-center gap-1">
              {schema.pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentPageIndex(i);
                    setFocusedElementId(null);
                  }}
                  className={`h-1 rounded-full transition-all ${
                    i === currentPageIndex ? 'bg-[#0057FF] w-3' : 'bg-white/20 w-1'
                  }`}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Bottom row: Prev + Primary Fill Button + Next/Review */}
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={currentPageIndex === 0}
              className="px-3 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-25 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 text-white/80 active:scale-95 flex-shrink-0"
              aria-label="Previous Page"
            >
              ← Prev
            </button>

            <button
              onClick={() => setMobileSheetOpen(true)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#0057FF] hover:bg-[#0046CC] active:scale-[0.98] font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-1.5 shadow-lg shadow-[#0057FF]/30 truncate"
            >
              <span>◈ Fill Content</span>
              <span className="opacity-80 text-[10px]">
                ({currentPageFilledCount}/{currentPageTotalCount})
              </span>
              <span className="opacity-70 text-sm leading-none ml-0.5">↑</span>
            </button>

            {currentPageIndex < schema.pages.length - 1 ? (
              <button
                onClick={goNext}
                className="px-3 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white active:scale-95 flex-shrink-0"
                aria-label="Next Page"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => onComplete(contentMap)}
                className={`px-3 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-95 flex-shrink-0 ${
                  allDone ? 'bg-emerald-500 text-white' : 'bg-[#0057FF] text-white'
                }`}
                aria-label="Review and Order"
              >
                {allDone ? 'Review ✓' : 'Review →'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Content Form (Desktop) ── */}
      <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col bg-[#0E0E12] hidden md:flex">
        {/* Form header */}
        <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
          <h3 className="font-display text-sm font-bold text-white">
            {currentPageSchema?.pageLabel ?? 'Content'}
          </h3>
          <p className="font-mono text-[10px] text-white/40 mt-0.5">
            {currentPageSchema?.elements.length ?? 0} editable field
            {(currentPageSchema?.elements.length ?? 0) !== 1 ? 's' : ''} on this page
          </p>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {currentPageSchema && (
            <ContentForm
              schema={currentPageSchema}
              contentMap={contentMap}
              focusedElementId={focusedElementId}
              onContentChange={handleContentChange}
              onFocusElement={setFocusedElementId}
            />
          )}
        </div>
      </div>

      {/* ── Mobile: Bottom sheet for content form ── */}
      <MobileContentSheet
        isOpen={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        pageLabel={currentPageSchema?.pageLabel ?? ''}
        pageIndex={currentPageIndex}
        totalPages={schema.pages.length}
        onPrevPage={goPrev}
        onNextPage={goNext}
        pageSchema={currentPageSchema}
        contentMap={contentMap}
        focusedElementId={focusedElementId}
        onContentChange={handleContentChange}
        onFocusElement={setFocusedElementId}
      />
    </div>
  );
}

// ── Mobile bottom sheet for content form ─────────────────────────────────────

import type { PageWizardSchema } from '@/types/magazine';

interface MobileContentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pageLabel: string;
  pageIndex: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  pageSchema: PageWizardSchema | undefined;
  contentMap: WizardContentMap;
  focusedElementId: string | null;
  onContentChange: (id: string, v: string) => void;
  onFocusElement: (id: string | null) => void;
}

function MobileContentSheet({
  isOpen,
  onClose,
  pageLabel,
  pageIndex,
  totalPages,
  onPrevPage,
  onNextPage,
  pageSchema,
  contentMap,
  focusedElementId,
  onContentChange,
  onFocusElement,
}: MobileContentSheetProps) {
  return (
    <>
      {/* Sheet backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sheet drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[70] flex flex-col bg-[#0E0E12]/98 backdrop-blur-2xl border-t border-white/15 rounded-t-2xl transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
        style={{
          maxHeight: '85vh',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab" onClick={onClose}>
          <div className="w-10 h-1 rounded-full bg-white/25" />
        </div>

        {/* Sheet header with page navigation */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevPage}
              disabled={pageIndex === 0}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center font-mono text-xs text-white/60 disabled:opacity-20"
              aria-label="Previous Page"
            >
              ←
            </button>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#0057FF] font-bold block">
                Page {pageIndex + 1} of {totalPages}
              </span>
              <h3 className="font-display text-xs sm:text-sm font-bold text-white leading-tight">
                {pageLabel}
              </h3>
            </div>
            <button
              onClick={onNextPage}
              disabled={pageIndex === totalPages - 1}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center font-mono text-xs text-white/60 disabled:opacity-20"
              aria-label="Next Page"
            >
              →
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 font-mono text-[10px] font-bold uppercase tracking-wider text-white/60 transition-colors"
          >
            Done ✕
          </button>
        </div>

        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 pb-6 overscroll-contain">
          {pageSchema ? (
            <ContentForm
              schema={pageSchema}
              contentMap={contentMap}
              focusedElementId={focusedElementId}
              onContentChange={onContentChange}
              onFocusElement={onFocusElement}
            />
          ) : (
            <p className="font-mono text-xs text-white/30 text-center py-8">
              No fields on this page
            </p>
          )}
        </div>
      </div>
    </>
  );
}
