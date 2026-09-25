'use client';

import { useState } from 'react';

interface SizeFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSizeSelect: (size: string) => void;
}

// Size lookup table for Indian sizing (Selling sizes: S to 3XL)
const sizeTable = [
  { size: 'S', heightMin: 150, heightMax: 165, weightMin: 42, weightMax: 58 },
  { size: 'M', heightMin: 162, heightMax: 172, weightMin: 56, weightMax: 68 },
  { size: 'L', heightMin: 168, heightMax: 178, weightMin: 66, weightMax: 78 },
  { size: 'XL', heightMin: 174, heightMax: 184, weightMin: 76, weightMax: 88 },
  { size: 'XXL', heightMin: 178, heightMax: 190, weightMin: 86, weightMax: 100 },
  { size: '3XL', heightMin: 182, heightMax: 205, weightMin: 96, weightMax: 130 },
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

  // Apply fit offset — shift index up/down within selling range [S ... 3XL]
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
      <div className="relative z-10 w-full sm:max-w-lg bg-graphite border border-smoke/60 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 shadow-2xl max-h-[90vh] max-h-[90dvh] overflow-y-auto custom-scrollbar">
        {/* Handle */}
        <div className="w-10 h-1 bg-smoke rounded-full mx-auto mb-5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl text-bone">Find My Size</h2>
            <p className="font-mono text-xs text-ash mt-0.5">Sizing from S to 3XL</p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-smoke/30 flex items-center justify-center text-pearl hover:text-bone hover:bg-smoke/60 transition-colors"
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
            className={`flex-1 pb-3 font-mono text-[11px] uppercase tracking-widest transition-colors ${
              activeTab === 'smart'
                ? 'text-cobalt border-b-2 border-cobalt font-bold'
                : 'text-ash hover:text-pearl'
            }`}
          >
            Smart Calculator
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex-1 pb-3 font-mono text-[11px] uppercase tracking-widest transition-colors ${
              activeTab === 'chart'
                ? 'text-cobalt border-b-2 border-cobalt font-bold'
                : 'text-ash hover:text-pearl'
            }`}
          >
            Standard Chart (S – 3XL)
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
                    className="bg-smoke/20 border border-smoke/40 text-bone font-mono text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-cobalt transition-colors placeholder:text-ash"
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
                    className="bg-smoke/20 border border-smoke/40 text-bone font-mono text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-cobalt transition-colors placeholder:text-ash"
                  />
                </div>
              </div>

              {/* Fit Preference */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] text-ash uppercase tracking-widest">
                  Preferred Fit
                </label>
                <div className="flex border border-smoke/60 rounded-lg overflow-hidden bg-black/20 p-0.5">
                  {(['slim', 'regular', 'oversized'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFit(f)}
                      className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-widest transition-all rounded-md ${
                        fit === f
                          ? 'bg-cobalt text-bone font-bold shadow-sm'
                          : 'text-ash hover:text-pearl'
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
              className="w-full py-3 bg-bone text-charcoal font-mono text-caption uppercase tracking-widest hover:bg-cobalt hover:text-bone transition-colors rounded-lg mb-5 font-bold"
            >
              Calculate My Size →
            </button>

            {/* Result */}
            {result && (
              <div className="border border-cobalt/40 bg-cobalt/5 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] text-pearl uppercase tracking-widest mb-1">
                    Recommended Size
                  </p>
                  <p className="font-display text-4xl text-bone font-bold text-cobalt">
                    {result.size}
                  </p>
                  {/* Confidence bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-28 h-1.5 bg-smoke/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cobalt rounded-full transition-all duration-700"
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-pearl font-medium">
                      {result.confidence}% match
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleApply}
                  className="px-5 py-2.5 bg-cobalt text-bone font-mono text-xs uppercase tracking-widest hover:bg-cobalt/80 transition-colors rounded-lg shrink-0 font-bold"
                >
                  Apply Size
                </button>
              </div>
            )}
          </>
        )}

        {/* Standard Chart */}
        {activeTab === 'chart' && (
          <div className="flex flex-col gap-3 mb-2">
            <div className="overflow-x-auto rounded-lg border border-smoke/40 bg-black/20">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-smoke/40 bg-black/40 text-ash text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-bold text-bone">Size</th>
                    <th className="py-2.5 px-3 font-bold">Bust (in)</th>
                    <th className="py-2.5 px-3 font-bold">Length (in)</th>
                    <th className="py-2.5 px-3 font-bold">Shoulder (in)</th>
                    <th className="py-2.5 px-3 font-bold">Sleeve (in)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-smoke/20">
                  {[
                    { size: 'S', bust: 36, length: 24, shoulder: 14, sleeve: 5.5 },
                    { size: 'M', bust: 38, length: 25, shoulder: 15, sleeve: 6.0 },
                    { size: 'L', bust: 40, length: 26, shoulder: 16, sleeve: 6.5 },
                    { size: 'XL', bust: 42, length: 27, shoulder: 17, sleeve: 7.0 },
                    { size: 'XXL', bust: 44, length: 28, shoulder: 18, sleeve: 7.5 },
                    { size: '3XL', bust: 46, length: 29, shoulder: 19, sleeve: 8.0 },
                  ].map((row) => (
                    <tr
                      key={row.size}
                      onClick={() => {
                        onSizeSelect(row.size);
                        onClose();
                      }}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 font-bold text-cobalt group-hover:underline">
                        {row.size}
                      </td>
                      <td className="py-2.5 px-3 text-bone">{row.bust}"</td>
                      <td className="py-2.5 px-3 text-pearl">{row.length}"</td>
                      <td className="py-2.5 px-3 text-pearl">{row.shoulder}"</td>
                      <td className="py-2.5 px-3 text-pearl">{row.sleeve}"</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="font-mono text-[10px] text-ash/80 leading-relaxed p-2.5 bg-smoke/10 rounded-lg">
              Click any size row to select it directly. Measurements based on Indian standard sizing
              with a tolerance of ±0.5 inches.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
