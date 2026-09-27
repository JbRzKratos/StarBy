'use client';

import { Check, X, AlertCircle } from 'lucide-react';

export function ArtworkGuideSection() {
  return (
    <section className="py-16 md:py-24 bg-[#0A0A0A] text-[#F5F1EA] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-mono tracking-widest uppercase text-[#3B5EFF] block font-bold">
            Print-Ready Specifications
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-[#F5F1EA]">
            Artwork Requirements
          </h2>
          <p className="text-sm md:text-base text-pearl/70 font-sans">
            Clear, high-resolution artwork ensures crisp edges, accurate Pantone matching, and
            vibrant fabric prints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Best Practices */}
          <div className="p-7 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white">
                Recommended Artwork
              </h3>
            </div>

            <ul className="space-y-3 text-sm text-pearl/80 font-sans">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Vector Files (SVG, PDF, AI, EPS):</strong> Best for
                  crisp scalability without any pixelation or quality loss.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Transparent PNG at 300 DPI:</strong> Ensures only
                  your design is printed without unwanted rectangular background boxes.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">RGB or CMYK Color Mode:</strong> For photographic
                  prints and rich saturation across dark and light garments.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Fonts Outlined / Converted to Curves:</strong>{' '}
                  Guarantees your custom typography stays 100% intact.
                </span>
              </li>
            </ul>
          </div>

          {/* Formats to Avoid */}
          <div className="p-7 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <X className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-bold uppercase tracking-tight text-white">
                Things To Avoid
              </h3>
            </div>

            <ul className="space-y-3 text-sm text-pearl/80 font-sans">
              <li className="flex items-start gap-2.5">
                <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Screenshots or Web Thumbnails:</strong> Low
                  resolution images under 150 DPI produce blurry or pixelated prints on garments.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Solid Backgrounds on Transparent Designs:</strong>{' '}
                  White or black boxes around logos will be printed unless removed.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Word Documents or Excel Files:</strong> Please
                  export artworks as PDF, PNG, or vector graphics before uploading.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">
                    Extremely Thin Hairline Strokes (&lt;0.5mm):
                  </strong>{' '}
                  Fine details may not hold up during washing on heavy textured fabrics.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Note */}
        <div className="mt-8 p-4 rounded-xl bg-white/[0.03] border border-white/10 max-w-5xl mx-auto flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs sm:text-sm text-pearl/70 font-sans">
            <strong className="text-white">Don&apos;t have a print-ready vector file?</strong>{' '}
            Don&apos;t worry! Upload whatever high-quality image you have. Our internal design team
            reviews every submission and will help vectorize or enhance it before production.
          </p>
        </div>
      </div>
    </section>
  );
}
