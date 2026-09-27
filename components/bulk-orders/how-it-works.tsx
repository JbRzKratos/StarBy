'use client';

import {
  FileText,
  UploadCloud,
  Layers,
  Search,
  FileCheck,
  CheckCircle2,
  Cpu,
  Truck,
} from 'lucide-react';

const STEPS = [
  {
    num: '01',
    title: 'Tell Us What You Need',
    desc: 'Select your event type, required delivery date, apparel preferences, and target quantities.',
    icon: FileText,
  },
  {
    num: '02',
    title: 'Upload Your Artwork',
    desc: 'Share your front, back, or sleeve graphics in PNG, SVG, or PDF format with placement notes.',
    icon: UploadCloud,
  },
  {
    num: '03',
    title: 'Size & Colour Matrix',
    desc: 'Allocate exact piece counts across multiple colors and sizes (XS to 5XL) in a live calculator.',
    icon: Layers,
  },
  {
    num: '04',
    title: 'Expert Technical Review',
    desc: 'Our apparel specialists inspect artwork DPI, fabric compatibility, and print placement specs.',
    icon: Search,
  },
  {
    num: '05',
    title: 'Receive Custom Quote',
    desc: 'Get an itemized quotation with transparent garment, print, packaging, and delivery pricing.',
    icon: FileCheck,
  },
  {
    num: '06',
    title: 'Approve & Confirm',
    desc: 'Review digital proofing and confirm the quote directly online with your team.',
    icon: CheckCircle2,
  },
  {
    num: '07',
    title: 'Precision Production',
    desc: 'High-density DTF, screen printing, or embroidery crafted with multi-point quality control.',
    icon: Cpu,
  },
  {
    num: '08',
    title: 'Express Doorstep Delivery',
    desc: 'Carefully packaged and dispatched with live courier tracking straight to your venue or office.',
    icon: Truck,
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-[#0E0E10] text-[#F5F1EA] border-b border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-mono tracking-widest uppercase text-[#3B5EFF] block font-bold">
            Transparent & Streamlined
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-[#F5F1EA]">
            How Bulk Ordering Works
          </h2>
          <p className="text-sm md:text-base text-pearl/70 font-sans">
            From initial idea to finished custom merchandise in your hands—engineered for zero
            headaches.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1 relative group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-[#3B5EFF] tracking-wider px-2 py-0.5 rounded bg-[#3B5EFF]/10 border border-[#3B5EFF]/20">
                    STEP {s.num}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-pearl group-hover:text-white group-hover:bg-[#3B5EFF]/20 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-[#F5F1EA]">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-pearl/70 font-sans mt-2 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
