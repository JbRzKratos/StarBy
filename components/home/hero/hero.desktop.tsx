'use client';

import Link from 'next/link';
import { HeroThreeCharacters } from './HeroThreeCharacters';

export function HeroDesktop() {
  return (
    <section className="relative w-full min-h-[100dvh] bg-[#F5F1EA] text-[#0A0A0A] overflow-x-clip flex flex-col justify-between pt-[clamp(7.5rem,6.75rem+1.5vh,8.5rem)] pb-[clamp(1rem,1vh+0.5rem,1.75rem)] px-[clamp(1.25rem,1rem+2vw,3.5rem)] select-none">
      {/* ── 1. Kicker Text (top-left) ── */}
      <div className="relative z-20 max-w-xs">
        <p className="font-mono text-xs md:text-sm font-black tracking-[0.25em] uppercase leading-relaxed text-[#0A0A0A]">
          DESIGNED BY US.
          <br />
          MADE FOR YOU.
        </p>
        <div className="w-14 h-[2.5px] bg-[#ED9518] mt-2.5" />
      </div>

      {/* ── 2. Top-Right Rotating "NEW DROP" Stamp Badge ── */}
      <div className="absolute top-[clamp(7.5rem,6.75rem+1.5vh,8.5rem)] right-[clamp(1.25rem,1rem+2vw,3.5rem)] z-20 hidden md:block pointer-events-none">
        <div className="relative w-16 h-16 lg:w-20 lg:h-20 animate-[spin_18s_linear_infinite]">
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
      <div className="relative flex-1 w-full min-h-0 flex items-center justify-center my-auto py-1 md:py-2">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <div className="relative w-full text-center px-2 flex items-center justify-center">
            <h1
              className="font-display font-black tracking-tighter text-[#0A0A0A] leading-none select-none flex items-center justify-center whitespace-nowrap uppercase opacity-95"
              style={{ fontSize: 'clamp(4rem, 17vw, 19rem)' }}
            >
              FREGORO
            </h1>
          </div>
        </div>

        {/* ── 4. Centered Proportional Three-Character Group Visual ── */}
        <div className="relative z-10 w-auto h-full max-h-[clamp(320px,58vh,640px)] aspect-[1230/977] max-w-[min(94vw,1180px)] flex items-end justify-center pointer-events-none">
          <HeroThreeCharacters priority />
        </div>
      </div>

      {/* ── 5. Bottom Section: Editorial Headline, CTAs, and Need Help ── */}
      <div className="relative z-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-3 md:gap-6 mt-auto pt-2 md:pt-3">
        {/* Left Side: Headline & CTAs */}
        <div className="max-w-md flex flex-col gap-2 md:gap-2.5">
          <div className="flex items-center gap-2.5 font-mono text-[11px] font-bold tracking-[0.25em] uppercase text-[#0A0A0A]/85">
            <span className="w-5 h-[1.5px] bg-[#0A0A0A]" />
            <span>MADE TO STAND OUT</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-[clamp(1.75rem,1.4rem+1vw,2.25rem)] tracking-tight leading-[1.08] text-[#0A0A0A] uppercase">
            DESIGNS THAT
            <br />
            SPEAK FOR YOU.
          </h2>

          <p className="font-sans text-xs sm:text-sm text-[#0A0A0A]/70 font-normal">
            Minimal designs. Maximum impact.
          </p>

          <div className="flex items-center gap-3.5 pt-1">
            <Link
              href="/products/tees"
              className="group relative inline-flex items-center justify-center bg-[#0A0A0A] text-[#F5F1EA] px-7 py-3 md:px-8 md:py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] border-2 border-[#0A0A0A] transition-all duration-300 hover:bg-[#ED9518] hover:border-[#ED9518] hover:text-[#0A0A0A] hover:shadow-[0_0_25px_rgba(237,149,24,0.4)]"
            >
              <span className="relative z-10">SHOP NOW</span>
            </Link>

            <Link
              href="/customize/clothing-mockup"
              className="group relative inline-flex items-center gap-2.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#0A0A0A] border-2 border-[#0A0A0A] px-6 py-2.5 md:px-7 md:py-3 transition-all duration-300 hover:bg-[#0A0A0A] hover:text-[#F5F1EA] hover:border-[#0A0A0A]"
            >
              <span className="w-2 h-2 rounded-full bg-[#ED9518] animate-pulse" />
              <span>ENTER 3D STUDIO [360°]</span>
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
