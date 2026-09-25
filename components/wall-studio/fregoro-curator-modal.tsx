'use client';

import React, { useState } from 'react';
import { useWallStudioStore } from '@/lib/wall-studio/store';
import { FREGORO_THEMES } from '@/lib/wall-studio/themes-data';
import { FREGORO_LAYOUTS } from '@/lib/wall-studio/layouts-data';
import { oneTapThemeFill } from '@/lib/wall-studio/recommendations';
import { X, Sparkles, Wand2 } from 'lucide-react';

export const FregoroCuratorModal: React.FC = () => {
  const { isCuratorModalOpen, closeCuratorModal, setLayout } = useWallStudioStore();

  const [selectedTheme, setSelectedTheme] = useState('gaming');
  const [selectedMood, setSelectedMood] = useState('dark');
  const [selectedRoom, setSelectedRoom] = useState('living');
  const [selectedScale, setSelectedScale] = useState('medium');

  if (!isCuratorModalOpen) return null;

  // Deterministic curator recommendation logic
  const handleGenerate = () => {
    let targetLayoutId = 'stepped-hero-05';

    if (selectedRoom === 'desk') {
      targetLayoutId = 'cinema-07';
    } else if (selectedRoom === 'bed') {
      targetLayoutId = 'panorama-08';
    } else if (selectedRoom === 'stairs') {
      targetLayoutId = 'ascent-12';
    } else if (selectedScale === 'compact') {
      targetLayoutId = 'compact-01';
    } else if (selectedScale === 'grand') {
      targetLayoutId = 'stepped-grand-06';
    } else if (selectedMood === 'minimal') {
      targetLayoutId = 'core-14';
    }

    const layout = FREGORO_LAYOUTS.find((l) => l.id === targetLayoutId) || FREGORO_LAYOUTS[4];
    const filledSelections = oneTapThemeFill(layout, {}, selectedTheme);

    setLayout(layout.id, filledSelections);
    closeCuratorModal();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fregoro Curator"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-xl bg-[#111216] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] max-h-[90dvh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Fregoro Wall Curator
              </h2>
              <p className="text-xs text-amber-300/80 font-mono">
                Smart art direction tailored to your space & vibe.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCuratorModal}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 text-white/60 hover:text-white transition-colors"
            aria-label="Close curator modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 space-y-5 text-xs font-mono overflow-y-auto flex-1 custom-scrollbar">
          {/* Step 1: Theme */}
          <div className="space-y-2">
            <label className="text-white/60 uppercase tracking-wider block">1. Select Theme</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {FREGORO_THEMES.slice(0, 8).map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => setSelectedTheme(t.slug)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    selectedTheme === t.slug
                      ? 'border-amber-400 bg-amber-400/15 text-white font-bold'
                      : 'border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Mood */}
          <div className="space-y-2">
            <label className="text-white/60 uppercase tracking-wider block">2. Visual Mood</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'dark', label: 'Dark & Moody' },
                { id: 'cinematic', label: 'Cinematic' },
                { id: 'minimal', label: 'Minimalist' },
                { id: 'vibrant', label: 'Vibrant Pop' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMood(m.id)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    selectedMood === m.id
                      ? 'border-amber-400 bg-amber-400/15 text-white font-bold'
                      : 'border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Room Type */}
          <div className="space-y-2">
            <label className="text-white/60 uppercase tracking-wider block">
              3. Room Placement
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'living', label: 'Living Room' },
                { id: 'desk', label: 'TV / Desk' },
                { id: 'bed', label: 'Above Bed' },
                { id: 'stairs', label: 'Stairs / Hall' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoom(r.id)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    selectedRoom === r.id
                      ? 'border-amber-400 bg-amber-400/15 text-white font-bold'
                      : 'border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Scale */}
          <div className="space-y-2">
            <label className="text-white/60 uppercase tracking-wider block">4. Wall Scale</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'compact', label: 'Compact (5-8 Prints)' },
                { id: 'medium', label: 'Medium (10-15 Prints)' },
                { id: 'grand', label: 'Grand (17-23 Prints)' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedScale(s.id)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    selectedScale === s.id
                      ? 'border-amber-400 bg-amber-400/15 text-white font-bold'
                      : 'border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-white/10 bg-black/60 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={closeCuratorModal}
            className="text-xs text-white/50 hover:text-white font-mono min-h-[44px] px-2 flex items-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all font-mono min-h-[44px]"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Generate Curated Wall</span>
          </button>
        </div>
      </div>
    </div>
  );
};
