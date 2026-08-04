'use client';

import Image from 'next/image';
import Link from 'next/link';

export function HeroDesktop() {
  return (
    <section className="relative w-full min-h-[92vh] lg:min-h-screen bg-[#F5F1EA] text-[#0A0A0A] overflow-hidden flex flex-col justify-between pt-36 pb-12 px-8 lg:px-16 select-none">
      {/* ── 1. Kicker text (top-left) ── */}
      <div className="relative z-20 max-w-xs">
        <p className="font-mono text-xs md:text-sm font-black tracking-[0.25em] uppercase leading-relaxed text-[#0A0A0A]">
          DESIGNED BY US.
          <br />
          MADE FOR YOU.
        </p>
        <div className="w-14 h-[2.5px] bg-[#ED9518] mt-3" />
      </div>

      {/* ── 2. Giant Official StarBy Wordmark & Star ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <div className="relative w-full text-center px-4 flex items-center justify-center">
          <h1 className="font-display text-[25vw] lg:text-[22vw] font-bold tracking-tighter text-[#0A0A0A] leading-none select-none flex items-baseline">
            <span>Star</span>
            <span className="relative">
              B
              {/* Official Curved 4-Point Gold Star Icon tucked precisely above top-right of 'B' */}
              <svg
                className="absolute -top-[14%] -right-[8%] w-[3.8vw] h-[3.8vw] text-[#ED9518] animate-pulse drop-shadow-[0_0_15px_rgba(237,149,24,0.5)]"
                viewBox="0 0 100 100"
                fill="currentColor"
              >
                <path d="M50 0 C50 35, 65 50, 100 50 C65 50, 50 65, 50 100 C50 65, 35 50, 0 50 C35 50, 50 35, 50 0 Z" />
              </svg>
            </span>
            <span>y</span>
          </h1>
        </div>
      </div>

      {/* ── 3. Centered Massive Model Cutout Photograph (Dead Center Middle over Wordmark) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="relative h-[84vh] lg:h-[92vh] w-[500px] lg:w-[680px]">
          <Image
            src="/images/hero-model-transparent.png"
            alt="StarBy Editorial Streetwear Model"
            fill
            sizes="(max-width: 1024px) 500px, 680px"
            priority
            className="object-contain object-center drop-shadow-[0_30px_45px_rgba(0,0,0,0.3)]"
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
            <span>SHOP NOW</span>
          </Link>

          <Link
            href="/customize"
            className="group font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#0A0A0A] border-b-2 border-[#0A0A0A] pb-1 hover:border-[#ED9518] hover:text-[#ED9518] transition-all duration-300"
          >
            EXPLORE THE DROP
          </Link>
        </div>

        {/* Collection Label */}
        <div className="text-left md:text-right font-mono text-xs uppercase tracking-[0.22em] text-[#0A0A0A]">
          <p className="font-bold inline-block border-b-2 border-[#ED9518] pb-0.5 text-[#0A0A0A]">
            NEW DROP
          </p>
          <p className="font-bold text-[#0A0A0A] mt-1">2026</p>
        </div>
      </div>
    </section>
  );
}
