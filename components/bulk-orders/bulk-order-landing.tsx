'use client';

import { useState, useRef } from 'react';
import { BulkOrderHero } from './bulk-order-hero';
import { UseCaseCards } from './use-case-cards';
import { BulkOrderForm } from './bulk-order-form';
import { HowItWorks } from './how-it-works';
import { ArtworkGuideSection } from './artwork-guide-section';
import { BulkOrdersFaq } from './faq-section';
import type { BulkOrderType } from '@/lib/bulk-orders/types';
import { getWhatsappLink } from '@/lib/whatsapp';
import { MessageCircle, ArrowRight, Sparkles } from 'lucide-react';

export function BulkOrderLanding() {
  const [selectedType, setSelectedType] = useState<BulkOrderType | undefined>(undefined);
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    if (formRef.current) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const headerOffset = isMobile ? 105 : 90;
      const elementTop = formRef.current.getBoundingClientRect().top;
      const targetY = elementTop + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth',
      });
    }
  };

  const handleSelectUseCase = (type: BulkOrderType) => {
    setSelectedType(type);
    scrollToForm();
  };

  const directWhatsappLink = getWhatsappLink(
    'Hi Fregoro Studios, I would like to discuss a custom bulk apparel order for my organization/event.',
  );

  return (
    <div className="bg-[#0A0A0A] text-[#F5F1EA] min-h-screen">
      {/* 1. Hero Section */}
      <BulkOrderHero onStartClick={scrollToForm} />

      {/* 2. Trust Metrics / Highlights */}
      <section className="border-b border-white/10 bg-[#0F0F0F] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <span className="font-display text-2xl sm:text-3xl font-black text-white">50k+</span>
              <p className="text-xs font-mono uppercase tracking-wider text-pearl">
                Garments Delivered
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-display text-2xl sm:text-3xl font-black text-[#3B5EFF]">
                180–280 GSM
              </span>
              <p className="text-xs font-mono uppercase tracking-wider text-pearl">
                Custom Fabric Weights
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-display text-2xl sm:text-3xl font-black text-white">
                DTF & Screen
              </span>
              <p className="text-xs font-mono uppercase tracking-wider text-pearl">
                Industrial Print Tech
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-display text-2xl sm:text-3xl font-black text-emerald-400">
                100% Guaranteed
              </span>
              <p className="text-xs font-mono uppercase tracking-wider text-pearl">
                Quality Inspection
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Use Case Cards (Select order type with 1 click) */}
      <UseCaseCards onSelectType={handleSelectUseCase} />

      {/* 4. Interactive Order Request Builder Form */}
      <div ref={formRef} id="order-builder" className="scroll-mt-28 md:scroll-mt-36 relative z-20">
        <BulkOrderForm initialOrderType={selectedType} />
      </div>

      {/* 5. How It Works (8 Step Journey) */}
      <HowItWorks />

      {/* 6. Artwork Guidelines */}
      <ArtworkGuideSection />

      {/* 7. FAQ */}
      <BulkOrdersFaq />

      {/* 8. Bottom CTA Banner */}
      <section className="py-20 border-t border-white/10 bg-gradient-to-b from-[#0F0F0F] to-[#0A0A0A] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,#3B5EFF_0%,transparent_60%)] opacity-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-pearl tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#3B5EFF]" />
            <span>Direct Manufacturer Concierge</span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            Have A Complex Or Urgent Requirement?
          </h2>

          <p className="text-base sm:text-lg text-pearl max-w-2xl mx-auto leading-relaxed">
            Need custom cut-and-sew dimensions, custom dyeing, specific pantone match, or express
            dispatch for an upcoming festival or summit? Talk with our production team immediately.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href={directWhatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#1ebc57] text-black font-mono text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2.5"
            >
              <MessageCircle className="w-5 h-5" />
              <span>WhatsApp Production Lead</span>
            </a>

            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-sm font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Build Order In Request Tool</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
