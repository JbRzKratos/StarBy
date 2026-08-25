'use client';

import Image from 'next/image';
import Link from 'next/link';

export function HeroDesktop() {
  return (
    <section className="relative w-full min-h-[92dvh] lg:min-h-[100dvh] bg-[#F5F1EA] text-[#0A0A0A] overflow-hidden flex flex-col justify-between pt-[clamp(7rem,6rem+4vw,9.5rem)] pb-[clamp(2rem,1.5rem+2vw,3.5rem)] px-[clamp(1.5rem,1rem+2.5vw,4rem)] select-none">
      {/* ── 1. Kicker text (top-left) ── */}
      <div className="relative z-20 max-w-xs">
        <p className="font-mono text-xs md:text-sm font-black tracking-[0.25em] uppercase leading-relaxed text-[#0A0A0A]">
          DESIGNED BY US.
          <br />
          MADE FOR YOU.
        </p>
        <div className="w-14 h-[2.5px] bg-[#ED9518] mt-3" />
      </div>

      {/* ── 2. Giant Official FREGORO Wordmark Behind Model ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <div className="relative w-full text-center px-2 flex items-center justify-center">
          <h1
            className="font-display font-black tracking-tighter text-[#0A0A0A] leading-none select-none flex items-center justify-center whitespace-nowrap uppercase"
            style={{ fontSize: 'clamp(3.5rem, 15vw, 21rem)' }}
          >
            <span className="inline-flex items-center whitespace-nowrap">
              <span className="leading-none">FREGORO</span>
            </span>
          </h1>
        </div>
      </div>

      {/* ── 3. Centered Full Model Cutout Photograph (Positioned so head is 100% visible below header nav) ── */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none z-10 pt-28 pb-6">
        <div className="relative h-[80vh] lg:h-[85vh] 2xl:h-[88vh] w-[500px] lg:w-[650px] 2xl:w-[750px] max-w-full">
          <Image
            src="/images/hero-model-transparent.png"
            alt="Fregoro Studios Editorial Streetwear Model"
            fill
            sizes="(max-width: 1024px) 500px, (max-width: 1536px) 650px, 750px"
            priority
            className="object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.3)]"
          />
        </div>
      </div>

      {/* ── 4. CTA Row (bottom-left) & Collection Label (bottom-right) ── */}
      <div className="relative z-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mt-auto pt-12">
        {/* CTA Row */}
        <div className="flex items-center gap-6">
          <Link
            href="/products/all"
            className="group relative inline-flex items-center justify-center bg-[#0A0A0A] text-[#F5F1EA] px-9 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] border-2 border-[#0A0A0A] transition-all duration-300 hover:bg-[#ED9518] hover:border-[#ED9518] hover:text-[#0A0A0A] hover:shadow-[0_0_25px_rgba(237,149,24,0.4)]"
          >
            <span className="relative z-10">SHOP NOW</span>
          </Link>

          <Link
            href="/customize"
            className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#0A0A0A] border-b-2 border-[#0A0A0A] pb-1 hover:text-[#ED9518] hover:border-[#ED9518] transition-colors"
          >
            EXPLORE THE DROP
          </Link>
        </div>

        {/* Collection Label (bottom-right) */}
        <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0A]">
          <span className="font-bold border-b-2 border-[#ED9518] pb-0.5 text-[#0A0A0A]">
            NEW DROP
          </span>
          <span className="text-[#0A0A0A]/40">•</span>
          <span className="font-bold text-[#0A0A0A]">2026</span>
        </div>
      </div>
    </section>
  );
}
