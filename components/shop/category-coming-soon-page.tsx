'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap-config';
import { getR2AssetUrl } from '@/lib/r2-public';

export interface ComingSoonConcept {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  image: string;
  badge: string;
  dropTimeline?: string;
}

export interface ComingSoonSpecBlock {
  num: string;
  title: string;
  desc: string;
  colorHex?: string;
}

export interface ComingSoonTimelineStep {
  status: 'Completed' | 'In Progress' | 'Upcoming';
  title: string;
  desc: string;
}

export interface CategoryShowcaseData {
  title: string;
  headline: string;
  roadmapTag: string;
  description: string;
  conceptsHeader: string;
  conceptsSubtext: string;
  specsHeaderTag: string;
  specsTitle: string;
  specsDescription: string;
  specs: ComingSoonSpecBlock[];
  timeline: ComingSoonTimelineStep[];
  concepts: ComingSoonConcept[];
}

const SHOWCASE_DATA: Record<string, CategoryShowcaseData> = {
  skins: {
    title: 'Device Skins',
    headline: 'Device Skins',
    roadmapTag: 'COMING SOON · 2026 ROADMAP',
    description:
      'A new way to personalize your technology is on the way. Our Device Skins collection is currently in development, featuring precision laser-cut 3M architectural vinyl, tactile finishes, and zero-residue adhesion.',
    conceptsHeader: 'PROTOTYPES IN TESTING',
    conceptsSubtext:
      'Each skin is engineered from 3M architectural cast vinyl with micro-air channels for a 100% bubble-free application.',
    specsHeaderTag: 'Engineering Specs',
    specsTitle: 'Built to Military Precision',
    specsDescription:
      'We partnered with leading vinyl manufacturers to develop skins that protect without adding bulk.',
    specs: [
      {
        num: '01',
        title: '3M Architectural Cast',
        desc: 'Premium commercial-grade vinyl engineered with invisible microscopic air channels. Guarantees an effortless, bubble-free installation and leaves zero adhesive residue upon removal.',
        colorHex: '#0057FF',
      },
      {
        num: '02',
        title: 'Sub-Millimeter Tolerances',
        desc: 'Precision CNC laser cutting mapped to exact CAD coordinates. Accommodates buttons, camera sensors, speaker grilles, and port cutouts with <0.1mm micro tolerances.',
        colorHex: '#ED9518',
      },
      {
        num: '03',
        title: 'Thermal & Scratch Defense',
        desc: 'Shields your anodized aluminum and glass backings against daily keys, abrasions, and scratches while maintaining original thermal dissipation performance under heavy loads.',
        colorHex: '#10B981',
      },
    ],
    timeline: [
      {
        status: 'Completed',
        title: 'CAD Modeling',
        desc: 'Precision 3D digitizing of flagship smartphone, laptop, and console chassis.',
      },
      {
        status: 'In Progress',
        title: 'Die Tooling',
        desc: 'High-speed laser die calibration and thermal corner stretch optimization.',
      },
      {
        status: 'Upcoming',
        title: 'VIP Beta Drops',
        desc: 'Closed beta test batch delivered to waitlist members for feedback.',
      },
      {
        status: 'Upcoming',
        title: 'Official Launch',
        desc: 'Full catalog release with instant custom DIY skin generator online.',
      },
    ],
    concepts: [
      {
        id: 'phantom-skin',
        slug: 'phantom-skin',
        name: 'Phantom Carbon Armor',
        category: 'Textured Weave',
        description:
          'Ultra-deep matte forged carbon weave offering high-traction grip and zero fingerprint smudging.',
        features: ['3M Cast Vinyl', 'Air-Release Microchannels', 'Matte Carbon Texture'],
        image: getR2AssetUrl('images/products/phantom-skin.webp'),
        badge: 'Lab Formulation',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'stealth-skin',
        slug: 'stealth-skin',
        name: 'Stealth Obsidian Skin',
        category: 'Matte Stealth',
        description:
          'Anti-reflective deep black finish engineered for minimalist aesthetics and edge-to-edge scratch protection.',
        features: ['Sub-Zero Reflection', 'Scratch Resistant', 'Precision Cut <0.1mm'],
        image: getR2AssetUrl('images/products/stealth-skin.webp'),
        badge: 'In Development',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'aura-skin',
        slug: 'aura-skin',
        name: 'Aura Iridescent Matrix',
        category: 'Prismatic Series',
        description:
          'Chameleonic color-shift micro-film that catches ambient light gradients across device contours.',
        features: ['Light-Reactive Layer', 'Zero-Residue Removal', 'Thermal Stability'],
        image: getR2AssetUrl('images/products/aura-skin.webp'),
        badge: 'Material Testing',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'cypher-skin',
        slug: 'cypher-skin',
        name: 'Cypher Cybernetic Mesh',
        category: 'Geometric Tech',
        description:
          'Precision tactile geometric circuit patterns designed for laptops, phones, and gaming consoles.',
        features: ['Tactile Embossing', 'Laser Edge Alignment', 'Edge Wrap Retention'],
        image: getR2AssetUrl('images/products/cypher-skin.webp'),
        badge: 'Prototyping',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'void-skin',
        slug: 'void-skin',
        name: 'Void Ultra-Black Skin',
        category: 'Vantablack Aesthetic',
        description:
          'Absorptive true-black surface that creates an ultra-clean monolithic aesthetic across any chassis.',
        features: ['Absorptive Pigment', 'Anti-Fingerprint Coating', 'Device Heat Vent Safe'],
        image: getR2AssetUrl('images/products/void-skin.webp'),
        badge: 'Sampling',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'spectre-skin',
        slug: 'spectre-skin',
        name: 'Spectre Frost Titanium',
        category: 'Metallic Series',
        description:
          'Brushed metallic architectural texture mimicking industrial titanium and space-grade alloys.',
        features: ['Brushed Metal Grain', '3D Contoured Corners', 'Clean Peel Guarantee'],
        image: getR2AssetUrl('images/products/spectre-skin.webp'),
        badge: 'Tooling',
        dropTimeline: 'Q4 2026 Drop',
      },
    ],
  },
  'mugs-cups': {
    title: 'Cups & Mugs',
    headline: 'Cups & Mugs',
    roadmapTag: 'COMING SOON · 2026 ROADMAP',
    description:
      'A new standard for creative studio drinkware is on the way. Our Cups & Mugs collection is currently in development, featuring high-density kiln-fired ceramic stoneware, double-wall vacuum insulation, thermo-reactive heat reveal glazes, and dishwasher-safe full-wrap prints.',
    conceptsHeader: 'CERAMIC & INSULATED PROTOTYPES',
    conceptsSubtext:
      'Each piece is high-fired at 1280°C for exceptional density, thermal shock defiance, and non-porous hygiene.',
    specsHeaderTag: 'Craftsmanship Specs',
    specsTitle: 'Engineered for the Studio Ritual',
    specsDescription:
      'From 1280°C high-fire kilns to seamless 360° sublimation, built for creators who value craftsmanship in every sip.',
    specs: [
      {
        num: '01',
        title: '1280°C High-Fire Stoneware',
        desc: 'Fired in specialized tunnel kilns at extreme temperatures for non-porous density, superior chip resistance, and maximum thermal heat retention.',
        colorHex: '#0057FF',
      },
      {
        num: '02',
        title: 'Hydrophobic Hydro-Glaze',
        desc: 'Deep pigment infusion with a glass-hard clear coat lock. Guaranteed to withstand 500+ commercial dishwashing and microwave heating cycles without fading.',
        colorHex: '#ED9518',
      },
      {
        num: '03',
        title: 'Ergonomic Weight Balancing',
        desc: 'Calibrated center-of-gravity with generous C-shaped handles and comfort-tapered drinking rims tailored to reduce wrist strain and prevent spills.',
        colorHex: '#10B981',
      },
    ],
    timeline: [
      {
        status: 'Completed',
        title: 'Clay Body Formulation',
        desc: 'High-density mineral stoneware selected for uniform heat distribution.',
      },
      {
        status: 'In Progress',
        title: 'Kiln & Glaze Testing',
        desc: '500+ commercial dishwashing and thermal shock cycle tests in progress.',
      },
      {
        status: 'Upcoming',
        title: 'VIP First Pour Drop',
        desc: 'Exclusive first-run batch shipped to early waitlist subscribers with custom studio box.',
      },
      {
        status: 'Upcoming',
        title: '3D Studio Launch',
        desc: 'Interactive 3D customizer with full 360° rotational print zone positioning.',
      },
    ],
    concepts: [
      {
        id: 'classic-mug-11oz',
        slug: 'classic-mug-11oz',
        name: 'Classic Ceramic Mug 11oz',
        category: 'Stoneware',
        description:
          'High-density ceramic stoneware with ergonomic C-handle grip and glossy thermal glaze.',
        features: ['11oz Studio Spec', 'Glossy Hydrophobic Glaze', 'Microwave & Dishwasher Safe'],
        image: getR2AssetUrl('images/products/classic_mug_11oz.webp'),
        badge: 'Kiln Formulation',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'magic-mug',
        slug: 'magic-mug',
        name: 'Magic Heat-Reveal Mug',
        category: 'Thermo-Reactive',
        description:
          'Matte black magic glaze that reveals full-color custom artwork when filled with hot liquid.',
        features: ['Heat-Sensitive Pigment Matrix', 'Reveal Full Color Art', 'Matte Black Stealth Base'],
        image: getR2AssetUrl('images/products/magic_mug.webp'),
        badge: 'Thermal Testing',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'enamel-camping-mug',
        slug: 'enamel-camping-mug',
        name: 'Enamel Studio Camping Mug',
        category: 'Outdoor Steel',
        description:
          'Rugged stainless steel core coated with vintage-fired enamel glaze for studio or outdoor use.',
        features: ['Stainless Steel Core', 'Fired Vitreous Enamel Rim', 'Shatterproof Architecture'],
        image: getR2AssetUrl('images/products/enamel_mug.webp'),
        badge: 'Prototyping',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'travel-tumbler',
        slug: 'travel-tumbler',
        name: 'Travel Insulated Tumbler',
        category: 'Vacuum Insulated',
        description:
          'Double-wall vacuum insulated 304 stainless steel tumbler with splash-proof slider lid.',
        features: ['Double-Wall 304 Steel', '12-Hour Heat / 24-Hour Cold', 'Car Cup Holder Optimized'],
        image: getR2AssetUrl('images/products/tumbler.webp'),
        badge: 'Tooling & Mold',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'classic-mug-15oz',
        slug: 'classic-mug-15oz',
        name: 'Classic Ceramic Mug 15oz',
        category: 'Large Stoneware',
        description:
          'Generous 15oz ceramic mug for extra caffeine runs, tailored for edge-to-edge custom wrap.',
        features: ['15oz Heavyweight Volume', 'Ergonomic Wide Grip', 'Scratch-Proof Color Lock'],
        image: getR2AssetUrl('images/products/classic_mug_15oz.webp'),
        badge: 'In Development',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'latte-mug',
        slug: 'latte-mug',
        name: 'Latte Barista Mug',
        category: 'Barista Spec',
        description:
          'Conical flared stoneware mug engineered for latte art and smooth sipping ergonomics.',
        features: ['Conical Flare Silhouette', 'Comfort Taper Lip', 'Commercial Cafe Durable'],
        image: getR2AssetUrl('images/products/latte_mug.webp'),
        badge: 'Sampling',
        dropTimeline: 'Q4 2026 Drop',
      },
    ],
  },
  stationery: {
    title: 'Archival Stationery',
    headline: 'Archival Stationery',
    roadmapTag: 'COMING SOON · 2026 ROADMAP',
    description:
      'Crafted for thinkers, creators, and builders. Our Archival Stationery collection is currently in development, featuring 120 GSM bleed-proof milled paper, lay-flat thread-sewn bindings, tactile linen covers, and bespoke debossed personalization.',
    conceptsHeader: 'PROTOTYPES IN TESTING',
    conceptsSubtext:
      'Engineered with acid-free Japanese milled paper and Smyth-sewn binding to lay 180° flat on any desk forever.',
    specsHeaderTag: 'Milling & Craft',
    specsTitle: 'Archival Quality for Decades',
    specsDescription:
      'Paper and binding engineered to preserve your sketches, thoughts, and systems with zero bleed-through.',
    specs: [
      {
        num: '01',
        title: 'Zero-Bleed 120 GSM Milling',
        desc: 'Custom-milled woodfree paper engineered to eliminate feathering and ghosting, even under heavy fountain pen nibs and wet pigment ink.',
        colorHex: '#0057FF',
      },
      {
        num: '02',
        title: 'Lay-Flat 180° Smyth-Sewn',
        desc: 'Section-sewn thread binding allows the journal to open completely flat across two pages without cracking the spine or loose page separation.',
        colorHex: '#ED9518',
      },
      {
        num: '03',
        title: 'Precision Blind Debossing',
        desc: 'Deep tactile blind debossing and hot-foil stamping options to embed custom typography and marks permanently into architectural bookcloth.',
        colorHex: '#10B981',
      },
    ],
    timeline: [
      {
        status: 'Completed',
        title: 'Paper Stock Milling',
        desc: '120 GSM acid-free bleed-resistant woodfree paper approved for production.',
      },
      {
        status: 'In Progress',
        title: 'Binding Calibration',
        desc: 'Smyth-sewn lay-flat stress testing and spine glue flexibility trials.',
      },
      {
        status: 'Upcoming',
        title: 'Creator Beta Testing',
        desc: 'Closed sample batches shipped to architects, designers, and writers.',
      },
      {
        status: 'Upcoming',
        title: 'Official Launch',
        desc: 'Full stationery studio with custom cover debossing and grid layout options.',
      },
    ],
    concepts: [
      {
        id: 'chronicle-diary',
        slug: 'chronicle-diary',
        name: 'Chronicle Archival Diary',
        category: 'Archival Bound',
        description:
          'Premium daily archival diary with custom debossed personalization and lay-flat binding.',
        features: ['120 GSM Bleed-Proof Stock', 'Fountain Pen Safe', 'Lay-Flat 180° Smyth Sewn'],
        image: getR2AssetUrl('images/products/chronicle-diary.webp'),
        badge: 'Paper Formulation',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'atlas-notebook',
        slug: 'atlas-notebook',
        name: 'Atlas Hardcover Notebook',
        category: 'Hardcover Studio',
        description:
          'Rigid hardcover notebook wrapped in tactile bookcloth with expandable rear document pocket.',
        features: ['Tactile Linen Hardcover', 'Rear Storage Gusset', 'Dual Woven Ribbon Bookmarks'],
        image: getR2AssetUrl('images/products/atlas-notebook.webp'),
        badge: 'Tooling & Die',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'cipher-journal',
        slug: 'cipher-journal',
        name: 'Cipher Bullet Journal',
        category: 'Dot Matrix',
        description:
          '5mm precision dot grid matrix designed for rapid visual mapping, habit tracking, and sketching.',
        features: ['5mm Subtle Dot Grid', 'Numbered Pages + Index', 'Elastic Enclosure Band'],
        image: getR2AssetUrl('images/products/cipher-journal.webp'),
        badge: 'In Development',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'apex-planner',
        slug: 'apex-planner',
        name: 'Apex Weekly Planner',
        category: 'Productivity',
        description:
          'Undated 12-month productivity system with weekly spreads, milestone trackers, and pen loop.',
        features: ['Undated Flexible Spreads', 'Quarterly Milestone Maps', 'Integrated Pen Loop'],
        image: getR2AssetUrl('images/products/apex-planner.webp'),
        badge: 'Layout Testing',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'lumina-notebook',
        slug: 'lumina-notebook',
        name: 'Lumina Minimalist Notebook',
        category: 'Softcover Studio',
        description:
          'Featherweight flexible cardstock cover with perforated tear-out notes for field ideas.',
        features: ['Flex Cardstock Cover', 'Perforated Rear Notes', 'Acid-Free Archival Paper'],
        image: getR2AssetUrl('images/products/lumina-notebook.webp'),
        badge: 'Sampling',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'nexus-diary',
        slug: 'nexus-diary',
        name: 'Nexus Creative Journal',
        category: 'Mixed Media',
        description:
          'Heavyweight 160 GSM art paper crafted for ink washes, fineliners, markers, and mixed media.',
        features: ['160 GSM Heavyweight Paper', 'Zero Ghosting / Bleed', 'Hand-Stitched Spine'],
        image: getR2AssetUrl('images/products/nexus-diary.webp'),
        badge: 'Prototyping',
        dropTimeline: 'Q4 2026 Drop',
      },
    ],
  },
  accessories: {
    title: 'Studio Accessories',
    headline: 'Studio Accessories',
    roadmapTag: 'COMING SOON · 2026 ROADMAP',
    description:
      'Details that define your everyday carry. Our Studio Accessories collection is currently in development, featuring CNC-machined aerospace alloy keychains, PVD matte hardware, and tactile statement pieces.',
    conceptsHeader: 'PROTOTYPES IN TESTING',
    conceptsSubtext:
      'Crafted from solid aerospace aluminum and high-tensile woven cables for enduring daily resilience.',
    specsHeaderTag: 'Material Specs',
    specsTitle: 'Precision Machined Hardware',
    specsDescription:
      'Every accessory is CNC cut from solid billets with laser debossed branding and micro bead-blast finish.',
    specs: [
      {
        num: '01',
        title: '6061 Aerospace Aluminum',
        desc: 'Milled from aircraft-grade solid aluminum billets for maximum structural strength with minimal pocket weight.',
        colorHex: '#0057FF',
      },
      {
        num: '02',
        title: 'Type III Hard Anodizing',
        desc: 'Military-spec electro-chemical surface coating providing extreme resistance to scratches, corrosion, and key abrasions.',
        colorHex: '#ED9518',
      },
      {
        num: '03',
        title: 'Braided Steel Lanyards',
        desc: 'High-tensile multi-strand braided wire with threaded screw lock mechanism to secure your essentials effortlessly.',
        colorHex: '#10B981',
      },
    ],
    timeline: [
      {
        status: 'Completed',
        title: 'CAD & Ergonomics',
        desc: 'Tactile grip profiles and weight balancing modeled for everyday pocket carry.',
      },
      {
        status: 'In Progress',
        title: 'CNC Mill Calibration',
        desc: 'Micro-bevel edge chamfering and laser logo engraving tolerance optimization.',
      },
      {
        status: 'Upcoming',
        title: 'Drop 01 Production',
        desc: 'Initial limited run of numbered alloy keychains and statement pieces.',
      },
      {
        status: 'Upcoming',
        title: 'Official Launch',
        desc: 'Full accessory catalog launch with custom colorway options.',
      },
    ],
    concepts: [
      {
        id: 'signal-keychain',
        slug: 'signal-keychain',
        name: 'Signal Alloy Keychain',
        category: 'Precision Carry',
        description:
          'Precision CNC-machined alloy keychain with braided steel cable and laser engraved branding.',
        features: ['6061 Aerospace Aluminum', 'Braided Steel Wire', 'Matte PVD Finish'],
        image: getR2AssetUrl('images/products/signal-keychain.webp'),
        badge: 'Sampling',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'onyx-keychain',
        slug: 'onyx-keychain',
        name: 'Onyx Stealth Keychain',
        category: 'Matte Stealth',
        description:
          'Monolithic matte black hardware engineered for understated style and rugged daily pocket carry.',
        features: ['Hard Anodized Matte', 'Threaded Fastener', 'Micro-Chamfered Edges'],
        image: getR2AssetUrl('images/products/onyx-keychain.webp'),
        badge: 'Prototyping',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'pulse-keychain',
        slug: 'pulse-keychain',
        name: 'Pulse Geometric Keychain',
        category: 'Architectural',
        description:
          'Chiseled faceted geometric geometry that catches light and feels ultra-satisfying in hand.',
        features: ['Faceted Geometry', 'Featherweight Alloy', 'Scratch-Proof Coating'],
        image: getR2AssetUrl('images/products/pulse-keychain.webp'),
        badge: 'Tooling',
        dropTimeline: 'Q4 2026 Drop',
      },
      {
        id: 'core-keychain',
        slug: 'core-keychain',
        name: 'Core Heavy Duty Ring',
        category: 'Studio Essential',
        description:
          'Industrial circular carabiner clip with spring-tensioned quick release and bead-blast texture.',
        features: ['Quick-Release Spring Gate', 'Heavy Tensile Rating', 'Compact Profile'],
        image: getR2AssetUrl('images/products/core-keychain.webp'),
        badge: 'Testing',
        dropTimeline: 'Q4 2026 Drop',
      },
    ],
  },
};

export function CategoryComingSoonPage({ category }: { category: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const data: CategoryShowcaseData = SHOWCASE_DATA[category] || SHOWCASE_DATA['skins'];

  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.fromTo(
        '.coming-soon-hero-item',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: 'power3.out' },
      );

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
    { scope: containerRef, dependencies: [category] },
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
        const resData = await res.json().catch(() => ({}));
        setErrorMsg(resData.message || 'Unable to join waitlist. Please try again.');
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
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] pointer-events-none rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(0,87,255,0.10) 0%, transparent 70%)' }}
        />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10 px-4 sm:px-6">
          {/* Status Chip */}
          <div className="coming-soon-hero-item inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1A1A1E] border border-[#ED9518]/30 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#ED9518] animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#ED9518]">
              {data.roadmapTag}
            </span>
          </div>

          {/* Headline */}
          <h1 className="coming-soon-hero-item font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-[#F5F1EA]">
            {data.headline}
          </h1>

          {/* Supporting Copy */}
          <p className="coming-soon-hero-item font-mono text-sm sm:text-base md:text-lg text-[#F5F1EA]/75 max-w-2xl mx-auto leading-relaxed">
            {data.description}
          </p>

          {/* VIP Notification Form */}
          <div className="coming-soon-hero-item pt-4 max-w-md mx-auto">
            {submitted ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                <div className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  ✓ You&apos;re On the VIP Launch List
                </div>
                <div className="font-mono text-[11px] text-[#F5F1EA]/70">
                  We&apos;ll notify you first when the pre-order window opens with launch pricing.
                </div>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email for drop alert..."
                    aria-label="Email for drop alert"
                    required
                    className="flex-1 bg-[#1A1A1E] border border-[#F5F1EA]/15 focus:border-[#0057FF] px-5 py-3.5 rounded-xl text-sm font-mono text-[#F5F1EA] placeholder-[#F5F1EA]/40 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-7 py-3.5 bg-[#0057FF] hover:bg-[#0046CC] disabled:opacity-50 text-[#F5F1EA] font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#0057FF]/25 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer"
                  >
                    {loading ? 'Subscribing...' : 'Get Early Access →'}
                  </button>
                </div>
                {errorMsg && <p className="font-mono text-xs text-rose-400">{errorMsg}</p>}
                <p className="font-mono text-[11px] text-[#F5F1EA]/45">
                  ★ Priority access · Limited first batch · Free worldwide shipping on drop day
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. Concept Previews Grid ── */}
      <section className="py-16 md:py-24 border-b border-[#F5F1EA]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="font-mono text-xs text-[#ED9518] uppercase tracking-widest font-bold">
                Concept Previews
              </span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-[#F5F1EA]">
                {data.conceptsHeader}
              </h2>
            </div>
            <p className="font-mono text-xs text-[#F5F1EA]/60 max-w-md">
              {data.conceptsSubtext}
            </p>
          </div>

          {/* Cards Grid */}
          <div
            ref={cardsRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {data.concepts.map((item, idx) => (
              <Link
                key={item.id}
                href={`/products/${category}/${item.slug || item.id}`}
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
                <div className="relative aspect-square w-full my-4 flex items-center justify-center overflow-hidden rounded-xl bg-[#16161A]/80 border border-white/5 group-hover:border-[#ED9518]/30 transition-colors">
                  <div
                    className="absolute inset-0 pointer-events-none opacity-40"
                    style={{
                      background: `radial-gradient(ellipse at 60% 40%, ${['#1a1a2e', '#16213e', '#0f3460', '#2d1b4e', '#1a2634', '#1a1a2e'][idx % 6]} 0%, #0a0a0c 100%)`,
                    }}
                  />
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain p-6 transition-transform duration-700 ease-out group-hover:scale-108 relative z-10 drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121214]/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Details */}
                <div className="space-y-4 pt-4 border-t border-[#F5F1EA]/5">
                  <div>
                    <h3 className="font-display text-xl font-bold uppercase tracking-tight text-[#F5F1EA] group-hover:text-[#ED9518] transition-colors">
                      {item.name}
                    </h3>
                    <p className="font-mono text-xs text-[#F5F1EA]/70 mt-1 leading-relaxed line-clamp-2">
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
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ED9518] animate-pulse" />
                      Pre-Release
                    </span>
                    <span className="text-[#F5F1EA]/40 group-hover:text-[#F5F1EA] transition-colors">
                      {item.dropTimeline || 'Q4 2026 Drop'} →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Engineering & Material Standards ── */}
      <section className="py-16 md:py-24 border-b border-[#F5F1EA]/10 bg-[#0E0E10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="font-mono text-xs text-[#0057FF] uppercase tracking-widest font-bold">
              {data.specsHeaderTag}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-[#F5F1EA]">
              {data.specsTitle}
            </h2>
            <p className="font-mono text-xs sm:text-sm text-[#F5F1EA]/70 leading-relaxed">
              {data.specsDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data.specs.map((spec) => (
              <div
                key={spec.num}
                className="bg-[#141416] border border-[#F5F1EA]/10 p-8 rounded-2xl space-y-4 hover:border-white/20 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold"
                  style={{
                    backgroundColor: `${spec.colorHex || '#0057FF'}20`,
                    borderColor: `${spec.colorHex || '#0057FF'}40`,
                    borderWidth: '1px',
                    color: spec.colorHex || '#0057FF',
                  }}
                >
                  {spec.num}
                </div>
                <h3 className="font-display text-xl font-bold uppercase text-[#F5F1EA]">
                  {spec.title}
                </h3>
                <p className="font-mono text-xs text-[#F5F1EA]/70 leading-relaxed">
                  {spec.desc}
                </p>
              </div>
            ))}
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
            {data.timeline.map((step) => (
              <div
                key={step.title}
                className={`p-5 rounded-xl bg-[#141416] space-y-2 relative overflow-hidden ${
                  step.status === 'Completed'
                    ? 'border border-emerald-500/30'
                    : step.status === 'In Progress'
                      ? 'border border-[#ED9518]/50'
                      : 'border border-[#F5F1EA]/10'
                }`}
              >
                {step.status === 'In Progress' && (
                  <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#ED9518] animate-ping m-2" />
                )}
                <span
                  className={`font-mono text-[10px] uppercase tracking-wider font-bold ${
                    step.status === 'Completed'
                      ? 'text-emerald-400'
                      : step.status === 'In Progress'
                        ? 'text-[#ED9518]'
                        : 'text-[#F5F1EA]/40'
                  }`}
                >
                  {step.status === 'Completed'
                    ? '✓ Completed'
                    : step.status === 'In Progress'
                      ? '● In Progress'
                      : '○ Upcoming'}
                </span>
                <h4 className="font-display text-base font-bold text-[#F5F1EA]">{step.title}</h4>
                <p className="font-mono text-[11px] text-[#F5F1EA]/60 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
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
