'use client';

import Image from 'next/image';
import Link from 'next/link';

export function HeroMobile() {
  return (
    <section className="relative w-full min-h-[90dvh] bg-[#F5F1EA] text-[#0A0A0A] overflow-hidden flex flex-col justify-between pt-28 pb-8 px-5 select-none">
      {/* ── 1. Kicker text (top) ── */}
      <div className="relative z-20">
        <p className="font-mono text-xs font-black tracking-[0.2em] uppercase leading-relaxed text-[#0A0A0A]">
          DESIGNED BY US.
          <br />
          MADE FOR YOU.
        </p>
        <div className="w-10 h-[2px] bg-[#ED9518] mt-2.5" />
      </div>

      {/* ── 2. Giant Official FREGORO Wordmark Behind Model ── */}
      <div className="relative my-auto py-6 flex items-center justify-center">
        <h1
          className="font-display font-black tracking-tighter text-[#0A0A0A] text-center select-none flex items-center justify-center whitespace-nowrap uppercase"
          style={{ fontSize: 'clamp(2.8rem, 17vw, 6.5rem)' }}
        >
          <span className="inline-flex items-center whitespace-nowrap">
            <span className="leading-none">FREGORO</span>
          </span>
        </h1>
      </div>

      {/* ── 4. Centered Full Model Cutout (Positioned cleanly between nav header and bottom CTAs) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 pt-20 pb-52">
        <div className="relative h-[clamp(260px,52dvh,480px)] w-[clamp(240px,75vw,360px)] max-w-full">
          <Image
            src="/images/hero-model-transparent.png"
            alt="Fregoro Studios Editorial Streetwear Model"
            fill
            sizes="(max-width: 430px) 320px, 360px"
            priority
            className="object-contain object-center drop-shadow-[0_20px_30px_rgba(0,0,0,0.25)]"
          />
        </div>
      </div>

      {/* ── 5. CTA Row & 6. Collection Label ── */}
      <div className="relative z-20 flex flex-col gap-5 pt-4">
        {/* Stacked CTA buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/products/all"
            className="w-full text-center bg-[#0A0A0A] text-[#F5F1EA] py-3.5 px-6 font-mono text-xs font-bold uppercase tracking-[0.2em] border-2 border-[#0A0A0A] active:bg-[#ED9518] active:text-[#0A0A0A]"
          >
            SHOP NOW
          </Link>

          <Link
            href="/customize"
            className="w-full text-center bg-[#F5F1EA] text-[#0A0A0A] py-3.5 px-6 font-mono text-xs font-bold uppercase tracking-[0.2em] border-2 border-[#0A0A0A] active:bg-[#ED9518] active:text-[#0A0A0A] transition-colors"
          >
            EXPLORE THE DROP
          </Link>
        </div>

        {/* Collection Label below CTA */}
        <div className="flex justify-between items-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#0A0A0A] pt-2 border-t border-[#0A0A0A]/20">
          <span className="font-bold border-b-2 border-[#ED9518] pb-0.5 text-[#0A0A0A]">
            NEW DROP
          </span>
          <span className="font-bold text-[#0A0A0A]">2026</span>
        </div>
      </div>
    </section>
  );
}
