'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';

interface SkinConcept {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  image: string;
  badge: string;
}

const UPCOMING_SKINS: SkinConcept[] = [
  {
    id: 'phantom-skin',
    name: 'Phantom Carbon Armor',
    category: 'Textured Weave',
    description:
      'Ultra-deep matte forged carbon weave offering high-traction grip and zero fingerprint smudging.',
    features: ['3M Cast Vinyl', 'Air-Release Microchannels', 'Matte Carbon Texture'],
    image: '/images/products/phantom-skin.webp',
    badge: 'Lab Formulation',
  },
  {
    id: 'stealth-skin',
    name: 'Stealth Obsidian Skin',
    category: 'Matte Stealth',
    description:
      'Anti-reflective deep black finish engineered for minimalist aesthetics and edge-to-edge scratch protection.',
    features: ['Sub-Zero Reflection', 'Scratch Resistant', 'Precision Cut <0.1mm'],
    image: '/images/products/stealth-skin.webp',
    badge: 'In Development',
  },
  {
    id: 'aura-skin',
    name: 'Aura Iridescent Matrix',
    category: 'Prismatic Series',
    description:
      'Chameleonic color-shift micro-film that catches ambient light gradients across device contours.',
    features: ['Light-Reactive Layer', 'Zero-Residue Removal', 'Thermal Stability'],
    image: '/images/products/aura-skin.webp',
    badge: 'Material Testing',
  },
  {
    id: 'cypher-skin',
    name: 'Cypher Cybernetic Mesh',
    category: 'Geometric Tech',
    description:
      'Precision tactile geometric circuit patterns designed for laptops, phones, and gaming consoles.',
    features: ['Tactile Embossing', 'Laser Edge Alignment', 'Edge Wrap Retention'],
    image: '/images/products/cypher-skin.webp',
    badge: 'Prototyping',
  },
  {
    id: 'void-skin',
    name: 'Void Ultra-Black Skin',
    category: 'Vantablack Aesthetic',
    description:
      'Absorptive true-black surface that creates an ultra-clean monolithic aesthetic across any chassis.',
    features: ['Absorptive Pigment', 'Anti-Fingerprint Coating', 'Device Heat Vent Safe'],
    image: '/images/products/void-skin.webp',
    badge: 'Sampling',
  },
  {
    id: 'spectre-skin',
    name: 'Spectre Frost Titanium',
    category: 'Metallic Series',
    description:
      'Brushed metallic architectural texture mimicking industrial titanium and space-grade alloys.',
    features: ['Brushed Metal Grain', '3D Contoured Corners', 'Clean Peel Guarantee'],
    image: '/images/products/spectre-skin.webp',
    badge: 'Tooling',
  },
];

export function DeviceSkinsComingSoon() {
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
            Device Skins
          </h1>

          {/* Supporting Copy */}
          <p className="coming-soon-hero-item font-mono text-sm sm:text-base md:text-lg text-[#F5F1EA]/75 max-w-2xl mx-auto leading-relaxed">
            A new way to personalize your technology is on the way. Our Device Skins collection is
            currently in development, featuring precision laser-cut 3M architectural vinyl, tactile
            finishes, and zero-residue adhesion.
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
                    className="px-6 py-3.5 bg-[#0057FF] hover:bg-[#0046CC] disabled:opacity-50 text-[#F5F1EA] font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap shadow-lg shadow-[#0057FF]/25"
                  >
                    {loading ? 'Joining...' : 'Get Early Access →'}
                  </button>
                </div>
                {errorMsg && <p className="font-mono text-xs text-rose-400">{errorMsg}</p>}
                <p className="font-mono text-[10px] text-[#F5F1EA]/40 tracking-wider">
                  ✦ Priority access · Limited first batch · Free worldwide shipping on drop day
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. Upcoming Product Showcase Grid ── */}
      <section className="py-16 md:py-24 border-b border-[#F5F1EA]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#F5F1EA]/10 pb-6">
            <div>
              <span className="font-mono text-xs text-[#ED9518] uppercase tracking-widest font-semibold">
                Concept Previews
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#F5F1EA] mt-1">
                Prototypes in Testing
              </h2>
            </div>
            <p className="font-mono text-xs text-[#F5F1EA]/60 max-w-sm">
              Each skin is engineered from 3M architectural cast vinyl with micro-air channels for a
              100% bubble-free application.
            </p>
          </div>

          <div
            ref={cardsRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {UPCOMING_SKINS.map((item) => (
              <div
                key={item.id}
                className="group relative bg-[#121214] border border-[#F5F1EA]/10 hover:border-[#ED9518]/40 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-[#ED9518]/5"
              >
                {/* Top meta tags */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#1A1A1E] border border-[#ED9518]/30 text-[#ED9518] font-mono text-[10px] uppercase tracking-widest font-bold">
                    {item.badge}
                  </span>
                  <span className="font-mono text-[10px] text-[#F5F1EA]/40 uppercase tracking-widest">
                    {item.category}
                  </span>
                </div>

                {/* Concept Product Visual */}
                <div className="relative aspect-square w-full my-4 flex items-center justify-center overflow-hidden rounded-xl bg-[#16161A]/50">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain p-6 transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-transparent opacity-40" />
                </div>

                {/* Details */}
                <div className="space-y-4 pt-4 border-t border-[#F5F1EA]/5">
                  <div>
                    <h3 className="font-display text-xl font-bold uppercase tracking-tight text-[#F5F1EA] group-hover:text-[#ED9518] transition-colors">
                      {item.name}
                    </h3>
                    <p className="font-mono text-xs text-[#F5F1EA]/70 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Bullet Spec Highlights */}
                  <ul className="space-y-1.5 pt-2">
                    {item.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-center gap-2 font-mono text-[11px] text-[#F5F1EA]/80"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0057FF]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Lock Indicator */}
                  <div className="pt-3 flex items-center justify-between text-xs font-mono border-t border-[#F5F1EA]/5">
                    <span className="text-[#ED9518] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <span>🔒</span> Pre-Release
                    </span>
                    <span className="text-[#F5F1EA]/40">Q4 2026 Drop</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Engineering & Material Standards ── */}
      <section className="py-16 md:py-24 border-b border-[#F5F1EA]/10 bg-[#0E0E10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="font-mono text-xs text-[#0057FF] uppercase tracking-widest font-bold">
              Engineering Specs
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-[#F5F1EA]">
              Built to Military Precision
            </h2>
            <p className="font-mono text-xs sm:text-sm text-[#F5F1EA]/70 leading-relaxed">
              We partnered with leading vinyl manufacturers to develop skins that protect without
              adding bulk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#141416] border border-[#F5F1EA]/10 p-8 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#0057FF]/20 border border-[#0057FF]/40 flex items-center justify-center font-mono text-sm text-[#0057FF] font-bold">
                01
              </div>
              <h3 className="font-display text-xl font-bold uppercase text-[#F5F1EA]">
                3M Architectural Cast
              </h3>
              <p className="font-mono text-xs text-[#F5F1EA]/70 leading-relaxed">
                Premium commercial-grade vinyl engineered with invisible microscopic air channels.
                Guarantees an effortless, bubble-free installation and leaves zero adhesive residue
                upon removal.
              </p>
            </div>

            <div className="bg-[#141416] border border-[#F5F1EA]/10 p-8 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#ED9518]/20 border border-[#ED9518]/40 flex items-center justify-center font-mono text-sm text-[#ED9518] font-bold">
                02
              </div>
              <h3 className="font-display text-xl font-bold uppercase text-[#F5F1EA]">
                Sub-Millimeter Tolerances
              </h3>
              <p className="font-mono text-xs text-[#F5F1EA]/70 leading-relaxed">
                Precision CNC laser cutting mapped to exact CAD coordinates. Accommodates buttons,
                camera sensors, speaker grilles, and port cutouts with &lt;0.1mm micro tolerances.
              </p>
            </div>

            <div className="bg-[#141416] border border-[#F5F1EA]/10 p-8 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono text-sm text-emerald-400 font-bold">
                03
              </div>
              <h3 className="font-display text-xl font-bold uppercase text-[#F5F1EA]">
                Thermal & Scratch Defense
              </h3>
              <p className="font-mono text-xs text-[#F5F1EA]/70 leading-relaxed">
                Shields your anodized aluminum and glass backings against daily keys, abrasions, and
                scratches while maintaining original thermal dissipation performance under heavy
                loads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Development Roadmap Progress ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-2">
            <span className="font-mono text-xs text-[#ED9518] uppercase tracking-widest font-bold">
              Production Roadmap
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#F5F1EA]">
              Development Timeline
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-[#141416] border border-emerald-500/30 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                ✓ Completed
              </span>
              <h4 className="font-display text-base font-bold text-[#F5F1EA]">CAD Modeling</h4>
              <p className="font-mono text-[11px] text-[#F5F1EA]/60">
                Precision 3D digitizing of flagship smartphone, laptop, and console chassis.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#141416] border border-[#ED9518]/50 space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#ED9518] animate-ping m-2" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#ED9518] font-bold">
                ● In Progress
              </span>
              <h4 className="font-display text-base font-bold text-[#F5F1EA]">Die Tooling</h4>
              <p className="font-mono text-[11px] text-[#F5F1EA]/60">
                High-speed laser die calibration and thermal corner stretch optimization.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#141416] border border-[#F5F1EA]/10 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#F5F1EA]/40 font-bold">
                ○ Upcoming
              </span>
              <h4 className="font-display text-base font-bold text-[#F5F1EA]">VIP Beta Drops</h4>
              <p className="font-mono text-[11px] text-[#F5F1EA]/60">
                Closed beta test batch delivered to waitlist members for feedback.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#141416] border border-[#F5F1EA]/10 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#F5F1EA]/40 font-bold">
                ○ Upcoming
              </span>
              <h4 className="font-display text-base font-bold text-[#F5F1EA]">Official Launch</h4>
              <p className="font-mono text-[11px] text-[#F5F1EA]/60">
                Full catalog release with instant custom DIY skin generator online.
              </p>
            </div>
          </div>

          <div className="text-center pt-6">
            <Link
              href="/products/all"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#F5F1EA]/60 hover:text-[#0057FF] transition-colors"
            >
              <span>Explore Available Drops in Store</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
