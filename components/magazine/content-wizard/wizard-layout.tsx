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
    <div className="flex h-full bg-[#0D0D0E] text-[#F5F1EA] overflow-hidden">
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
        <div className="flex-1 overflow-hidden flex items-center justify-center p-3 md:p-6 bg-[#111113]">
          <div className="h-full max-h-[calc(100vh-140px)] w-auto max-w-full flex items-center justify-center">
            {currentPage && (
              <PageCanvasPreview
                page={currentPage}
                contentMap={contentMap}
                focusedElementId={focusedElementId}
                onSelectElement={setFocusedElementId}
              />
            )}
          </div>
        </div>

        {/* Canvas bottom nav */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-[#0E0E12] flex-shrink-0">
          <button
            onClick={goPrev}
            disabled={currentPageIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 text-white/70"
          >
            ← Previous
          </button>

          {/* Mobile: page indicator */}
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
      </div>

      {/* ── Right: Content Form ── */}
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
        pageLabel={currentPageSchema?.pageLabel ?? ''}
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
  pageLabel: string;
  pageSchema: PageWizardSchema | undefined;
  contentMap: WizardContentMap;
  focusedElementId: string | null;
  onContentChange: (id: string, v: string) => void;
  onFocusElement: (id: string | null) => void;
}

function MobileContentSheet({
  pageLabel,
  pageSchema,
  contentMap,
  focusedElementId,
  onContentChange,
  onFocusElement,
}: MobileContentSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile form trigger bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="w-full py-4 bg-[#0057FF] font-mono text-xs font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2 shadow-2xl"
        >
          <span>◈ Fill Content for {pageLabel}</span>
          <span className="opacity-60">↑</span>
        </button>
      </div>

      {/* Sheet backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sheet drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-[#0E0E12]/95 backdrop-blur-2xl border-t border-white/15 rounded-t-2xl transition-transform duration-300 md:hidden ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '75vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Sheet header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-white/10 flex-shrink-0">
          <h3 className="font-display text-sm font-bold text-white">{pageLabel}</h3>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center font-mono text-white/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-8">
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
