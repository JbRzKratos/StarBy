import Link from 'next/link';
import { HeroThreeCharacters } from './HeroThreeCharacters';

export function Hero() {
  return (
    <section className="relative w-full min-h-[100dvh] md:min-h-[96dvh] lg:min-h-[100dvh] bg-[#F5F1EA] text-[#0A0A0A] overflow-hidden flex flex-col justify-between pt-24 pb-6 px-5 md:pt-[clamp(6rem,5rem+2.5vw,8rem)] md:pb-[clamp(1.5rem,1rem+1.5vw,2.5rem)] md:px-[clamp(1.5rem,1rem+2.5vw,4rem)] select-none">
      {/* ── 1. Top Kicker Text ── */}
      <div className="relative z-20 max-w-xs">
        <p className="font-mono text-xs md:text-sm font-black tracking-[0.2em] md:tracking-[0.25em] uppercase leading-tight md:leading-relaxed text-[#0A0A0A]">
          DESIGNED BY US.
          <br />
          MADE FOR YOU.
        </p>
        <div className="w-10 md:w-14 h-[2px] md:h-[2.5px] bg-[#ED9518] mt-2 md:mt-3" />
      </div>

      {/* ── 2. Top-Right Rotating "NEW DROP" Stamp Badge (Desktop) ── */}
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

      {/* ── 3. Middle Visual Stage: FREGORO Wordmark + Three Characters ── */}
      <div className="relative flex-1 flex items-center justify-center my-auto min-h-[300px] max-h-[52vh] md:max-h-[85vh] py-1 md:py-0">
        {/* Giant FREGORO Wordmark in Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <div className="relative w-full text-center px-2 flex items-center justify-center">
            <h1
              className="font-display font-black tracking-tighter text-[#0A0A0A] text-center select-none whitespace-nowrap uppercase opacity-90 md:opacity-95 leading-none"
              style={{ fontSize: 'clamp(3.2rem, 18vw, 25rem)' }}
            >
              FREGORO
            </h1>
          </div>
        </div>

        {/* 3-Character Visual in Foreground */}
        <div className="relative z-10 w-full max-w-[440px] md:max-w-[1300px] md:w-[75vw] lg:w-[65vw] aspect-[1230/977] flex items-end justify-center pointer-events-none">
          <HeroThreeCharacters />
        </div>
      </div>

      {/* ── 4. Bottom Section: Editorial Headline, CTAs, and Footer Meta ── */}
      <div className="relative z-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-8 mt-auto pt-1 md:pt-8">
        {/* Left Side: Headline & CTAs */}
        <div className="max-w-md flex flex-col gap-2.5 md:gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 md:gap-2.5 font-mono text-[10px] md:text-[11px] font-bold tracking-[0.22em] md:tracking-[0.25em] uppercase text-[#0A0A0A]/85">
            <span className="w-4 md:w-5 h-[1.5px] bg-[#0A0A0A]" />
            <span>MADE TO STAND OUT</span>
          </div>

          <h2 className="font-display font-black text-[1.45rem] sm:text-2xl md:text-3xl lg:text-[2.5rem] tracking-tight leading-[1.1] md:leading-[1.05] text-[#0A0A0A] uppercase">
            DESIGNS THAT
            <br />
            SPEAK FOR YOU.
          </h2>

          <p className="font-sans text-xs sm:text-sm text-[#0A0A0A]/70 font-normal">
            Minimal designs. Maximum impact.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 md:gap-4 pt-1 md:pt-2">
            <Link
              href="/products/tees"
              className="group relative inline-flex items-center justify-center bg-[#0A0A0A] text-[#F5F1EA] py-3.5 px-6 sm:px-8 font-mono text-xs font-bold uppercase tracking-[0.2em] border-2 border-[#0A0A0A] transition-all duration-300 hover:bg-[#ED9518] hover:border-[#ED9518] hover:text-[#0A0A0A] hover:shadow-[0_0_25px_rgba(237,149,24,0.4)] active:bg-[#ED9518] active:border-[#ED9518] active:text-[#0A0A0A]"
            >
              <span className="relative z-10">SHOP NOW</span>
            </Link>

            <Link
              href="/customize/clothing-mockup"
              className="group relative inline-flex items-center justify-center gap-2 md:gap-2.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#0A0A0A] border-2 border-[#0A0A0A] py-3 px-6 sm:px-7 sm:py-3.5 transition-all duration-300 hover:bg-[#0A0A0A] hover:text-[#F5F1EA] hover:border-[#0A0A0A] active:bg-[#0A0A0A] active:text-[#F5F1EA]"
            >
              <span className="w-2 h-2 rounded-full bg-[#ED9518] animate-pulse" />
              <span>ENTER 3D STUDIO [360°]</span>
            </Link>
          </div>
        </div>

        {/* Right Side / Mobile Footer Meta Bar */}
        <div className="w-full md:w-auto flex justify-between md:justify-end items-center font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-[#0A0A0A] pt-2 md:pt-0 md:pb-1 border-t md:border-t-0 border-[#0A0A0A]/15">
          <span className="font-bold border-b border-[#0A0A0A] pb-0.5">NEED HELP?</span>
          <span className="font-bold text-[#0A0A0A] md:hidden">NEW DROP · 2026</span>
        </div>
      </div>
    </section>
  );
}
