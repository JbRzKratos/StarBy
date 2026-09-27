'use client';

import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { getWhatsappLink } from '@/lib/whatsapp';

interface BulkOrderHeroProps {
  onStartClick: () => void;
}

export function BulkOrderHero({ onStartClick }: BulkOrderHeroProps) {
  const whatsappUrl = getWhatsappLink(
    'Hi Fregoro Studios, I would like to enquire about a custom bulk apparel order for my team/event.',
  );

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] text-[#F5F1EA] pt-28 pb-16 md:pt-36 md:pb-24 border-b border-white/10">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3B5EFF]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-2/3 right-10 w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono tracking-widest uppercase text-pearl">
            <Sparkles className="w-3.5 h-3.5 text-[#3B5EFF]" />
            <span>Fregoro B2B & Custom Studio</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-[#F5F1EA] leading-[1.05]">
            Custom Apparel.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-bone via-pearl to-[#3B5EFF]">
              Built For Your Event.
            </span>
          </h1>

          {/* Supporting Copy */}
          <p className="font-sans text-base sm:text-lg md:text-xl text-[#F5F1EA]/70 max-w-2xl mx-auto leading-relaxed">
            Ordering for your team, event, company, college, or brand? Upload your design, choose
            your apparel and quantities, and we&apos;ll take care of the rest.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartClick}
              className="w-full sm:w-auto px-8 py-4 bg-[#3B5EFF] hover:bg-[#2b4be6] text-white font-mono text-sm font-bold uppercase tracking-wider rounded-xl shadow-xl shadow-[#3B5EFF]/25 hover:shadow-[#3B5EFF]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              <span>Request A Bulk Quote</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] font-mono text-sm font-bold uppercase tracking-wider rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Talk To Us On WhatsApp</span>
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-white/5 text-left">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 text-white font-mono text-xs uppercase tracking-wider font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>240+ GSM Fabrics</span>
              </div>
              <p className="text-[11px] text-pearl/60 mt-1 font-sans">
                Heavyweight combed cotton, fleece & French terry options.
              </p>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 text-white font-mono text-xs uppercase tracking-wider font-bold">
                <ShieldCheck className="w-4 h-4 text-[#3B5EFF] shrink-0" />
                <span>High-Definition Prints</span>
              </div>
              <p className="text-[11px] text-pearl/60 mt-1 font-sans">
                Ultra-vibrant DTF, screen printing & bespoke embroidery.
              </p>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 text-white font-mono text-xs uppercase tracking-wider font-bold">
                <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Flexible Matrix</span>
              </div>
              <p className="text-[11px] text-pearl/60 mt-1 font-sans">
                Mix XS–5XL sizes & multiple garment colors seamlessly.
              </p>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 text-white font-mono text-xs uppercase tracking-wider font-bold">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Fast Event Delivery</span>
              </div>
              <p className="text-[11px] text-pearl/60 mt-1 font-sans">
                Direct dispatch across India with dedicated project support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
