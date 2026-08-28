'use client';

import Link from 'next/link';
import { HeroThreeCharacters } from './HeroThreeCharacters';

export function HeroMobile() {
  return (
    <section className="relative w-full min-h-[100dvh] bg-[#F5F1EA] text-[#0A0A0A] overflow-hidden flex flex-col justify-between pt-24 pb-6 px-5 select-none">
      {/* ── 1. Top Kicker Text ── */}
      <div className="relative z-20">
        <p className="font-mono text-xs font-black tracking-[0.2em] uppercase leading-tight text-[#0A0A0A]">
          DESIGNED BY US.
          <br />
          MADE FOR YOU.
        </p>
        <div className="w-10 h-[2px] bg-[#ED9518] mt-2" />
      </div>

      {/* ── 2. Middle Visual Stage: FREGORO Wordmark + Three Characters ── */}
      <div className="relative flex-1 flex items-center justify-center my-auto min-h-[300px] max-h-[52vh] py-1">
        {/* Giant FREGORO Wordmark in Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <h1
            className="font-display font-black tracking-tighter text-[#0A0A0A] text-center select-none whitespace-nowrap uppercase opacity-90"
            style={{ fontSize: 'clamp(3.2rem, 19vw, 6rem)' }}
          >
            FREGORO
          </h1>
        </div>

        {/* 3-Character Visual in Foreground */}
        <div className="relative z-10 w-full h-[clamp(280px,46dvh,420px)] max-w-[440px] flex items-end justify-center pointer-events-none">
          <HeroThreeCharacters priority isMobile />
        </div>
      </div>

      {/* ── 3. Bottom Section: Editorial Headline, CTAs, and Footer Meta ── */}
      <div className="relative z-20 flex flex-col gap-3.5 pt-1">
        {/* Editorial Text */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.22em] uppercase text-[#0A0A0A]/80">
            <span className="w-4 h-[1.5px] bg-[#0A0A0A]" />
            <span>MADE TO STAND OUT</span>
          </div>

          <h2 className="font-display font-black text-[1.45rem] leading-[1.1] tracking-tight text-[#0A0A0A] uppercase">
            CLOTHING THAT
            <br />
            SPEAKS FOR YOU.
          </h2>

          <p className="font-sans text-xs text-[#0A0A0A]/70">
            Minimal designs. Maximum impact.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <Link
            href="/products/all"
            className="w-full text-center bg-[#0A0A0A] text-[#F5F1EA] py-3.5 px-6 font-mono text-xs font-bold uppercase tracking-[0.2em] border-2 border-[#0A0A0A] active:bg-[#ED9518] active:border-[#ED9518] active:text-[#0A0A0A] transition-all"
          >
            SHOP NOW
          </Link>

          <Link
            href="/customize"
            className="w-full text-center bg-transparent text-[#0A0A0A] py-3 px-6 font-mono text-xs font-bold uppercase tracking-[0.2em] border-2 border-[#0A0A0A] active:bg-[#ED9518] active:border-[#ED9518] active:text-[#0A0A0A] transition-all"
          >
            EXPLORE THE DROP
          </Link>
        </div>

        {/* Footer Meta Bar */}
        <div className="flex justify-between items-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#0A0A0A] pt-2 border-t border-[#0A0A0A]/15">
          <span className="font-bold border-b border-[#0A0A0A] pb-0.5">NEED HELP?</span>
          <span className="font-bold text-[#0A0A0A]">NEW DROP · 2026</span>
        </div>
      </div>
    </section>
  );
}
