'use client';

import Link from 'next/link';
import { HeroThreeCharacters } from './HeroThreeCharacters';

export function HeroDesktop() {
  return (
    <section className="relative w-full min-h-[96dvh] lg:min-h-[100dvh] bg-[#F5F1EA] text-[#0A0A0A] overflow-hidden flex flex-col justify-between pt-[clamp(6rem,5rem+2.5vw,8rem)] pb-[clamp(1.5rem,1rem+1.5vw,2.5rem)] px-[clamp(1.5rem,1rem+2.5vw,4rem)] select-none">
      {/* ── 1. Kicker Text (top-left) ── */}
      <div className="relative z-20 max-w-xs">
        <p className="font-mono text-xs md:text-sm font-black tracking-[0.25em] uppercase leading-relaxed text-[#0A0A0A]">
          DESIGNED BY US.
          <br />
          MADE FOR YOU.
        </p>
        <div className="w-14 h-[2.5px] bg-[#ED9518] mt-3" />
      </div>

      {/* ── 2. Top-Right Rotating "NEW DROP" Stamp Badge ── */}
      <div className="absolute top-[clamp(5rem,4.5rem+2vw,7rem)] right-[clamp(1.5rem,1rem+2.5vw,4rem)] z-20 hidden md:block pointer-events-none">
        <div className="relative w-20 h-20 lg:w-24 lg:h-24 animate-[spin_18s_linear_infinite]">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              id="heroCirclePath"
              d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
              fill="none"
            />
            <text className="text-[9px] font-mono uppercase tracking-[0.26em] fill-[#0A0A0A] font-bold">
              <textPath href="#heroCirclePath" startOffset="0%">
                • NEW DROP • NEW DROP •
              </textPath>
            </text>
          </svg>
        </div>
      </div>

      {/* ── 3. Giant Official FREGORO Wordmark Behind Models ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <div className="relative w-full text-center px-2 flex items-center justify-center">
          <h1
            className="font-display font-black tracking-tighter text-[#0A0A0A] leading-none select-none flex items-center justify-center whitespace-nowrap uppercase opacity-95"
            style={{ fontSize: 'clamp(4.5rem, 18vw, 25rem)' }}
          >
            <span className="inline-flex items-center whitespace-nowrap">
              <span className="leading-none">FREGORO</span>
            </span>
          </h1>
        </div>
      </div>

      {/* ── 4. Centered Extra-Large Three-Character Group Visual ── */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none z-10 pt-10 pb-0">
        <div className="relative h-[86vh] lg:h-[92vh] 2xl:h-[95vh] w-full max-w-[1100px] md:max-w-[1260px] lg:max-w-[1420px] 2xl:max-w-[1600px]">
          <HeroThreeCharacters priority />
        </div>
      </div>

      {/* ── 5. Bottom Section: Editorial Headline, CTAs, and Need Help ── */}
      <div className="relative z-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mt-auto pt-8">
        {/* Left Side: Headline & CTAs */}
        <div className="max-w-md flex flex-col gap-3">
          <div className="flex items-center gap-2.5 font-mono text-[11px] font-bold tracking-[0.25em] uppercase text-[#0A0A0A]/85">
            <span className="w-5 h-[1.5px] bg-[#0A0A0A]" />
            <span>MADE TO STAND OUT</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-[2.5rem] tracking-tight leading-[1.05] text-[#0A0A0A] uppercase">
            CLOTHING THAT
            <br />
            SPEAKS FOR YOU.
          </h2>

          <p className="font-sans text-xs sm:text-sm text-[#0A0A0A]/70 font-normal">
            Minimal designs. Maximum impact.
          </p>

          <div className="flex items-center gap-6 pt-2">
            <Link
              href="/products/all"
              className="group relative inline-flex items-center justify-center bg-[#0A0A0A] text-[#F5F1EA] px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] border-2 border-[#0A0A0A] transition-all duration-300 hover:bg-[#ED9518] hover:border-[#ED9518] hover:text-[#0A0A0A] hover:shadow-[0_0_25px_rgba(237,149,24,0.4)]"
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
        </div>

        {/* Right Side: Need Help Label */}
        <div className="hidden md:flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#0A0A0A] pb-1">
          <span className="font-bold border-b border-[#0A0A0A] pb-0.5">NEED HELP?</span>
        </div>
      </div>
    </section>
  );
}
