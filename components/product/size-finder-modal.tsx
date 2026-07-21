'use client';

import { useState } from 'react';

interface SizeFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSizeSelect: (size: string) => void;
}

// Size lookup table for Indian sizing
const sizeTable = [
  { size: 'XS', heightMin: 150, heightMax: 161, weightMin: 40, weightMax: 54 },
  { size: 'S', heightMin: 158, heightMax: 168, weightMin: 50, weightMax: 64 },
  { size: 'M', heightMin: 165, heightMax: 175, weightMin: 60, weightMax: 74 },
  { size: 'L', heightMin: 172, heightMax: 181, weightMin: 70, weightMax: 84 },
  { size: 'XL', heightMin: 178, heightMax: 188, weightMin: 80, weightMax: 95 },
  { size: 'XXL', heightMin: 184, heightMax: 200, weightMin: 90, weightMax: 120 },
];

const fitOffsets: Record<string, number> = {
  slim: -1,
  regular: 0,
  oversized: 1,
};

function recommendSize(
  height: number,
  weight: number,
  fit: string,
): { size: string; confidence: number } {
  // Score each size based on how well height + weight match
  const scores = sizeTable.map((entry) => {
    const hScore =
      height >= entry.heightMin && height <= entry.heightMax
        ? 2
        : Math.max(
            0,
            1 -
              Math.min(Math.abs(height - entry.heightMin), Math.abs(height - entry.heightMax)) / 10,
          );
    const wScore =
      weight >= entry.weightMin && weight <= entry.weightMax
        ? 2
        : Math.max(
            0,
            1 -
              Math.min(Math.abs(weight - entry.weightMin), Math.abs(weight - entry.weightMax)) / 10,
          );
    return { size: entry.size, score: hScore + wScore };
  });

  scores.sort((a, b) => b.score - a.score);

  // Apply fit offset — shift index up/down
  const offset = fitOffsets[fit] ?? 0;
  const baseIndex = sizeTable.findIndex((e) => e.size === scores[0]?.size);
  const finalIndex = Math.max(0, Math.min(sizeTable.length - 1, baseIndex + offset));
  const finalSize = sizeTable[finalIndex]?.size ?? 'M';
  const confidence = Math.min(100, Math.round(((scores[0]?.score ?? 0) / 4) * 100));

  return { size: finalSize, confidence };
}

export function SizeFinderModal({ isOpen, onClose, onSizeSelect }: SizeFinderModalProps) {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [fit, setFit] = useState('regular');
  const [result, setResult] = useState<{ size: string; confidence: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'smart' | 'chart'>('smart');

  if (!isOpen) return null;

  const handleFind = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h < 100 || h > 250 || w < 30 || w > 200) return;
    setResult(recommendSize(h, w, fit));
  };

  const handleApply = () => {
    if (result) {
      onSizeSelect(result.size);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-charcoal/80 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:max-w-md bg-graphite border border-smoke/40 rounded-t-3xl sm:rounded-xl p-6 pb-10 sm:pb-6">
        {/* Handle */}
        <div className="w-10 h-1 bg-smoke rounded-full mx-auto mb-6 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl text-bone">Sizing Guide</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-smoke/30 flex items-center justify-center text-pearl hover:text-bone transition-colors"
            aria-label="Close size finder"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-smoke/40 mb-6">
          <button
            onClick={() => setActiveTab('smart')}
            className={`flex-1 pb-3 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              activeTab === 'smart' ? 'text-cobalt border-b-2 border-cobalt' : 'text-ash hover:text-pearl'
            }`}
          >
            Smart Calculator
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex-1 pb-3 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              activeTab === 'chart' ? 'text-cobalt border-b-2 border-cobalt' : 'text-ash hover:text-pearl'
            }`}
          >
            Standard Chart
          </button>
        </div>

        {/* Inputs */}
        {activeTab === 'smart' && (
          <>
            <div className="flex flex-col gap-4 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-ash uppercase tracking-widest">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 172"
                min={100}
                max={250}
                className="bg-smoke/20 border border-smoke/40 text-bone font-mono text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-cobalt transition-colors placeholder:text-ash"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-ash uppercase tracking-widest">
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 68"
                min={30}
                max={200}
                className="bg-smoke/20 border border-smoke/40 text-bone font-mono text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-cobalt transition-colors placeholder:text-ash"
              />
            </div>
          </div>

          {/* Fit Preference */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] text-ash uppercase tracking-widest">
              Preferred Fit
            </label>
            <div className="flex border border-smoke rounded-sm overflow-hidden">
              {(['slim', 'regular', 'oversized'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFit(f)}
                  className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors border-l first:border-l-0 border-smoke ${
                    fit === f ? 'bg-cobalt text-bone' : 'bg-charcoal text-ash hover:text-pearl'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleFind}
          className="w-full py-3 bg-bone text-charcoal font-mono text-caption uppercase tracking-widest hover:bg-cobalt hover:text-bone transition-colors rounded-sm mb-5"
        >
          Calculate My Size →
        </button>

            {/* Result */}
            {result && (
              <div className="border border-smoke/40 rounded-sm p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] text-pearl uppercase tracking-widest mb-1">
                    Recommended
                  </p>
                  <p className="font-display text-4xl text-bone">{result.size}</p>
                  {/* Confidence bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-smoke/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cobalt rounded-full transition-all duration-700"
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-pearl">{result.confidence}% match</span>
                  </div>
                </div>
                <button
                  onClick={handleApply}
                  className="px-5 py-3 bg-cobalt text-bone font-mono text-[10px] uppercase tracking-widest hover:bg-cobalt/80 transition-colors rounded-sm shrink-0"
                >
                  Apply Size
                </button>
              </div>
            )}
          </>
        )}

        {/* Standard Chart */}
        {activeTab === 'chart' && (
          <div className="flex flex-col gap-4 mb-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-smoke/40">
                    <th className="py-2 pr-4 font-mono text-[10px] text-ash uppercase tracking-widest font-normal">Size</th>
                    <th className="py-2 px-2 font-mono text-[10px] text-ash uppercase tracking-widest font-normal">Chest (in)</th>
                    <th className="py-2 px-2 font-mono text-[10px] text-ash uppercase tracking-widest font-normal">Chest (cm)</th>
                    <th className="py-2 pl-2 font-mono text-[10px] text-ash uppercase tracking-widest font-normal">Length (in)</th>
                  </tr>
                </thead>
                <tbody className="text-bone font-mono text-xs">
                  <tr className="border-b border-smoke/20"><td className="py-3 pr-4 text-cobalt font-bold">XS</td><td className="py-3 px-2">36"</td><td className="py-3 px-2">91</td><td className="py-3 pl-2">26"</td></tr>
                  <tr className="border-b border-smoke/20"><td className="py-3 pr-4 text-cobalt font-bold">S</td><td className="py-3 px-2">38"</td><td className="py-3 px-2">96</td><td className="py-3 pl-2">27"</td></tr>
                  <tr className="border-b border-smoke/20"><td className="py-3 pr-4 text-cobalt font-bold">M</td><td className="py-3 px-2">40"</td><td className="py-3 px-2">101</td><td className="py-3 pl-2">28"</td></tr>
                  <tr className="border-b border-smoke/20"><td className="py-3 pr-4 text-cobalt font-bold">L</td><td className="py-3 px-2">42"</td><td className="py-3 px-2">106</td><td className="py-3 pl-2">29"</td></tr>
                  <tr className="border-b border-smoke/20"><td className="py-3 pr-4 text-cobalt font-bold">XL</td><td className="py-3 px-2">44"</td><td className="py-3 px-2">112</td><td className="py-3 pl-2">30"</td></tr>
                  <tr className="border-b border-smoke/20"><td className="py-3 pr-4 text-cobalt font-bold">XXL</td><td className="py-3 px-2">46"</td><td className="py-3 px-2">117</td><td className="py-3 pl-2">31"</td></tr>
                </tbody>
              </table>
            </div>
            <p className="font-mono text-[9px] text-ash leading-relaxed mt-2 p-3 bg-smoke/10 rounded-sm">
              * Measurements may have a tolerance of +/- 0.5 to 1 inch (1.25–2.5 cm). Hoodies are typically styled slightly larger to accommodate layering.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
