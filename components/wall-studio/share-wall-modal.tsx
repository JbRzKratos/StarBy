'use client';

import React, { useState } from 'react';
import { useWallStudioStore } from '@/lib/wall-studio/store';
import { X, Copy, Check, Sparkles } from 'lucide-react';

export const ShareWallModal: React.FC = () => {
  const { isShareModalOpen, closeShareModal, currentLayout, getSnapshot } = useWallStudioStore();

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isShareModalOpen) return null;

  const handleGenerateShareLink = async () => {
    setIsGenerating(true);
    try {
      const snapshot = getSnapshot();
      const res = await fetch('/api/wall-studio/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Custom ${currentLayout.name} Wall`,
          layoutId: currentLayout.id,
          layoutVersion: currentLayout.version,
          slotsData: snapshot.slots,
        }),
      });

      const data = await res.json();
      if (data.success && data.shareUrl) {
        setShareUrl(data.shareUrl);
      } else {
        const origin = window.location.origin;
        setShareUrl(`${origin}/wall-studio?layout=${currentLayout.slug}`);
      }
    } catch (e) {
      console.warn('Share API fallback to url query:', e);
      const origin = window.location.origin;
      setShareUrl(`${origin}/wall-studio?layout=${currentLayout.slug}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share Your Wall"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md bg-[#111216] border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] max-h-[90dvh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#3B5EFF] font-bold">
              Collaborative Wall
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
              Share Your Wall Design
            </h2>
          </div>
          <button
            type="button"
            onClick={closeShareModal}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 text-white/60 hover:text-white transition-colors"
            aria-label="Close share modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-white/60 leading-relaxed font-mono">
          Share your {currentLayout.name} composition with friends, family, or your interior
          designer. Anyone with this link can view and purchase or customize your wall.
        </p>

        {!shareUrl ? (
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateShareLink}
            className="w-full py-3 rounded-xl bg-[#3B5EFF] text-white font-semibold text-xs shadow-lg shadow-[#3B5EFF]/25 hover:bg-[#2B4EFF] flex items-center justify-center gap-2 transition-all font-mono min-h-[44px]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Generating Unique Link...' : 'Create Shareable Link'}</span>
          </button>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 p-1.5 bg-black/50 border border-white/10 rounded-xl">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent text-xs text-white/90 font-mono focus:outline-none pl-2.5"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="w-11 h-11 flex items-center justify-center rounded-lg bg-[#3B5EFF] text-white hover:bg-[#2B4EFF] transition-colors shrink-0"
                aria-label="Copy link"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && (
              <p className="text-[11px] text-emerald-400 font-mono text-center">
                Link copied to clipboard!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
