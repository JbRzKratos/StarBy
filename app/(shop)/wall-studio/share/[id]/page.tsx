import React from 'next/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getLayoutById } from '@/lib/wall-studio/layouts-data';
import { Layers, Ruler, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function SharedWallPage({ params }: PageProps) {
  let savedWall = null;

  try {
    savedWall = await prisma.savedWall.findFirst({
      where: {
        OR: [{ id: params.id }, { shareCode: params.id }],
      },
    });
  } catch (e) {
    console.warn('DB lookup for shared wall failed:', e);
  }

  if (!savedWall) {
    notFound();
  }

  const layout = getLayoutById(savedWall.layoutId) || getLayoutById('stepped-hero-05');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slotsData = (savedWall.slotsData as any[]) || [];

  return (
    <div className="min-h-screen bg-[#090A0D] text-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
        <Link href="/" className="font-bold text-base tracking-wider font-mono">
          FREGORO <span className="text-[#3B5EFF]">STUDIOS</span>
        </Link>
        <Link
          href="/wall-studio"
          className="text-xs text-white/60 hover:text-white font-mono flex items-center gap-1"
        >
          <span>Open Wall Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Hero Showcase */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-10 flex flex-col items-center justify-center space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B5EFF]/15 border border-[#3B5EFF]/30 text-[#3B5EFF] text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Shared Wall Composition</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            {savedWall.title}
          </h1>
          <p className="text-sm text-white/50 font-mono">
            Layout: {layout?.name} • {layout?.coverageLabel} • {layout?.physicalPrintCount} Physical
            Prints
          </p>
        </div>

        {/* ─── WALL COMPOSITION PREVIEW ─── */}
        <div className="relative w-full max-w-3xl aspect-16/10 bg-[#121316] rounded-2xl border border-white/10 p-6 shadow-2xl overflow-hidden flex items-center justify-center">
          {layout && (
            <div
              className="relative w-full h-full max-h-[480px]"
              style={{
                aspectRatio: `${layout.wallWidthMm / layout.wallHeightMm}`,
              }}
            >
              {layout.slots.map((slot, index) => {
                const filledSlot = slotsData.find((s) => s.slotId === slot.id) || slotsData[index];
                return (
                  <div
                    key={slot.id}
                    style={{
                      position: 'absolute',
                      left: `${slot.x * 100}%`,
                      top: `${slot.y * 100}%`,
                      width: `${slot.width * 100}%`,
                      height: `${slot.height * 100}%`,
                    }}
                    className="rounded-[2px] overflow-hidden bg-black/60 border border-white/20 shadow-md"
                  >
                    {filledSlot?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={filledSlot.imageUrl}
                        alt="Slot artwork"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5 font-mono text-[9px] text-white/30">
                        {slot.size}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions & Specs Bar */}
        <div className="w-full max-w-xl p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 font-mono text-xs text-white/60">
            <div className="flex items-center gap-2 text-white font-bold">
              <Layers className="w-4 h-4 text-[#3B5EFF]" />
              <span>{layout?.physicalPrintCount} Physical Giclée Prints</span>
            </div>
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-white/40" />
              <span>Coverage: {layout?.coverageLabel}</span>
            </div>
          </div>

          <Link
            href={`/wall-studio?layout=${layout?.slug || 'stepped-hero'}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#3B5EFF] hover:bg-[#2B4EFF] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#3B5EFF]/25 flex items-center justify-center gap-2 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customize / Buy This Wall</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
