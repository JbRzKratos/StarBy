'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';

interface UpcomingConcept {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  image: string;
  badge: string;
}

const UPCOMING_MUGS: UpcomingConcept[] = [
  {
    id: 'classic-11oz',
    name: 'Classic Stoneware Mug',
    category: 'Ceramics',
    description:
      'High-fired ceramic stoneware with a comfort-grip ergonomic handle. Engineered for daily studio and desk rituals.',
    features: ['11oz Capacity', 'High-Gloss Ceramic', 'Microwave & Dishwasher Safe'],
    image: '/images/products/classic_mug_11oz.png',
    badge: 'In Development',
  },
  {
    id: 'matte-15oz',
    name: 'Heavyweight Studio Mug',
    category: 'Stoneware',
    description:
      'Substantial 15oz silhouette with weighted base and velvet tactile glaze. Designed for extended focus sessions.',
    features: ['15oz Deep Volume', 'Weighted Base', 'Matte Stone Glaze'],
    image: '/images/products/classic_mug_15oz.png',
    badge: 'Material Testing',
  },
  {
    id: 'thermal-tumbler',
    name: 'Insulated Travel Tumbler',
    category: 'Thermal Gear',
    description:
      'Double-wall vacuum-sealed stainless steel tumbler. Retains heat for 8 hours and cold for 16 hours on the move.',
    features: ['Vacuum Insulated', 'Leak-Proof Seal', 'Laser-Etched Finish'],
    image: '/images/products/tumbler.png',
    badge: 'Prototyping',
  },
  {
    id: 'magic-thermal',
    name: 'Thermal Color-Shift Mug',
    category: 'Special Edition',
    description:
      'Heat-activated pigment technology that shifts from solid obsidian black to reveal your bespoke design upon pouring.',
    features: ['Heat-Reactive Layer', 'Obsidian Mask', 'Bespoke Reveal'],
    image: '/images/products/magic_mug.png',
    badge: 'Lab Formulation',
  },
  {
    id: 'artisan-latte',
    name: 'Artisan Conical Mug',
    category: 'Specialty Drinkware',
    description:
      'Flared conical profile crafted for specialty coffee, matcha, and loose-leaf teas with balance and thermal retention.',
    features: ['Conical Flare', 'Barista Standard', 'Comfort Lip'],
    image: '/images/products/latte_mug.png',
    badge: 'Sampling',
  },
  {
    id: 'rugged-enamel',
    name: 'Camp Enamel Steel Cup',
    category: 'Outdoor & Studio',
    description:
      'Lightweight cold-rolled steel coated in fused glass enamel. Indestructible drinkware built for travel and outdoors.',
    features: ['Steel Core', 'Fused Enamel Coating', 'Impact Resistant'],
    image: '/images/products/enamel_mug.png',
    badge: 'Tooling',
  },
];

export function CupsMugsComingSoon() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useGSAP(
    () => {
      if (!containerRef.current) return;

      // Hero content fade-in
      gsap.fromTo(
        '.coming-soon-hero-item',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: 'power3.out' },
      );

      // Card entrance animation with ScrollTrigger
      if (cardsRef.current) {
        ScrollTrigger.batch(cardsRef.current.children, {
          onEnter: (elements) => {
            gsap.fromTo(
              elements,
              { y: 45, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
            );
          },
          start: 'top 85%',
          once: true,
        });
      }
    },
    { scope: containerRef },
  );

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
        setEmail('');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || 'Unable to join waitlist. Please try again.');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full text-[#F5F1EA]">
      {/* ── 1. Hero Showcase Section ── */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pb-24 border-b border-[#F5F1EA]/10">
        {/* Subtle ambient lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#0057FF]/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10 px-4 sm:px-6">
          {/* Status Chip */}
          <div className="coming-soon-hero-item inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1A1A1E] border border-[#ED9518]/30 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#ED9518] animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#ED9518]">
              COMING SOON · 2026 ROADMAP
            </span>
          </div>

          {/* Headline */}
          <h1 className="coming-soon-hero-item font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-[#F5F1EA]">
            Cups & Mugs
          </h1>

          {/* Supporting Copy */}
          <p className="coming-soon-hero-item font-mono text-sm sm:text-base md:text-lg text-[#F5F1EA]/75 max-w-2xl mx-auto leading-relaxed">
            A new way to enjoy <strong className="text-[#F5F1EA]">FREGORO</strong> is on the way.
            Our Cups & Mugs collection is currently in development and will be available soon with
            custom-engineered drinkware and heat-reactive surfaces.
          </p>

          {/* VIP Notification Form */}
          <div className="coming-soon-hero-item pt-4 max-w-md mx-auto">
            {submitted ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                <div className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  ✓ You&apos;re On the VIP Launch List
                </div>
                <p className="font-mono text-xs text-[#F5F1EA]/70">
                  We will send you early access as soon as the first batch goes live.
                </p>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email for drop alert..."
                    aria-label="Email address for drop notification"
                    required
                    className="flex-1 bg-[#16161A] border border-[#F5F1EA]/15 focus:border-[#0057FF] px-4 py-3.5 rounded-lg text-xs font-mono text-[#F5F1EA] placeholder-[#F5F1EA]/40 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3.5 bg-[#0057FF] hover:bg-[#0046CC] disabled:opacity-50 text-[#F5F1EA] font-mono text-xs font-bold uppercase tracking-[0.2em] rounded-lg transition-all shadow-lg shadow-[#0057FF]/20 whitespace-nowrap"
                  >
                    {loading ? 'Joining...' : 'Notify Me →'}
                  </button>
                </div>
                {errorMsg && (
                  <p className="font-mono text-xs text-rose-400 text-left">{errorMsg}</p>
                )}
                <p className="font-mono text-[11px] text-[#F5F1EA]/40 text-center">
                  Exclusive early access · No spam ever · Unsubscribe anytime
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. Concept Showcase Grid ── */}
      <section className="py-16 md:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="font-mono text-xs text-[#ED9518] uppercase tracking-[0.25em] font-bold block mb-2">
              Preview Lineup
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#F5F1EA]">
              Upcoming Silhouettes
            </h2>
          </div>
          <span className="font-mono text-xs text-[#F5F1EA]/50 uppercase tracking-widest">
            6 Concepts in Development
          </span>
        </div>

        {/* Product Cards Grid */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {UPCOMING_MUGS.map((item) => (
            <div
              key={item.id}
              className="group relative bg-[#121214] border border-[#F5F1EA]/10 hover:border-[#F5F1EA]/25 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden"
            >
              {/* Top Badge */}
              <div className="flex items-center justify-between gap-2 mb-4 z-10">
                <span className="font-mono text-[10px] text-[#F5F1EA]/50 uppercase tracking-wider font-semibold">
                  {item.category}
                </span>
                <span className="px-2.5 py-1 bg-[#1A1A1E] border border-[#ED9518]/30 text-[#ED9518] font-mono text-[9px] font-bold uppercase tracking-widest rounded-full">
                  {item.badge}
                </span>
              </div>

              {/* High-Resolution Mockup Showcase */}
              <div className="relative aspect-square w-full my-4 flex items-center justify-center overflow-hidden rounded-xl bg-[#16161A]/60">
                <Image
                  src={item.image}
                  alt={`Fregoro Studios ${item.name}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Subtle coming soon overlay on hover */}
                <div className="absolute inset-0 bg-[#0A0A0A]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="px-4 py-2 rounded-md bg-[#0A0A0A]/90 border border-[#ED9518]/50 text-[#ED9518] font-mono text-[10px] uppercase tracking-[0.2em] font-bold shadow-xl">
                    Coming Soon
                  </span>
                </div>
              </div>

              {/* Product Info & Specifications */}
              <div className="mt-4 pt-4 border-t border-[#F5F1EA]/5 space-y-3">
                <h3 className="font-display text-xl font-bold uppercase tracking-tight text-[#F5F1EA] group-hover:text-[#ED9518] transition-colors">
                  {item.name}
                </h3>
                <p className="font-mono text-xs text-[#F5F1EA]/65 leading-relaxed">
                  {item.description}
                </p>

                {/* Key Spec tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {item.features.map((feat) => (
                    <span
                      key={feat}
                      className="px-2 py-0.5 rounded bg-[#1A1A1E] text-[#F5F1EA]/60 font-mono text-[10px]"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Active Collections Navigation Banner ── */}
      <section className="mt-12 p-8 sm:p-12 rounded-2xl bg-[#121214] border border-[#F5F1EA]/10 text-center space-y-6">
        <div className="max-w-xl mx-auto space-y-2">
          <span className="font-mono text-xs text-[#0057FF] uppercase tracking-[0.25em] font-bold block">
            AVAILABLE FOR ORDER NOW
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-[#F5F1EA]">
            Shop Ready-to-Ship FREGORO Pieces
          </h2>
          <p className="font-mono text-xs sm:text-sm text-[#F5F1EA]/60 leading-relaxed">
            While our drinkware line is being perfected, explore our active collections in custom
            streetwear, split posters, and precision device skins.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/products/hoodies"
            className="px-5 py-3 rounded-lg bg-[#1A1A1E] border border-[#F5F1EA]/15 text-[#F5F1EA] hover:border-[#0057FF] hover:text-[#0057FF] font-mono text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Hoodies & Tees →
          </Link>
          <Link
            href="/products/posters"
            className="px-5 py-3 rounded-lg bg-[#1A1A1E] border border-[#F5F1EA]/15 text-[#F5F1EA] hover:border-[#0057FF] hover:text-[#0057FF] font-mono text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Posters →
          </Link>
          <Link
            href="/split-poster"
            className="px-5 py-3 rounded-lg bg-[#1A1A1E] border border-[#F5F1EA]/15 text-[#F5F1EA] hover:border-[#0057FF] hover:text-[#0057FF] font-mono text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Split Posters →
          </Link>
          <Link
            href="/products/skins"
            className="px-5 py-3 rounded-lg bg-[#1A1A1E] border border-[#F5F1EA]/15 text-[#F5F1EA] hover:border-[#0057FF] hover:text-[#0057FF] font-mono text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Device Skins →
          </Link>
          <Link
            href="/customize"
            className="px-5 py-3 rounded-lg bg-[#0057FF] hover:bg-[#0046CC] text-[#F5F1EA] font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-[#0057FF]/20"
          >
            ✦ Customizer Studio
          </Link>
        </div>
      </section>
    </div>
  );
}
