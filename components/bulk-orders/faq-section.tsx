'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'What is the minimum order quantity (MOQ) for bulk orders?',
    a: 'Our bulk quotation system generally starts at 20–25 pieces per design. For smaller bespoke runs or prototyping, please contact our team directly on WhatsApp and we will accommodate based on production capacity.',
  },
  {
    q: 'Can we mix different garment colors and sizes within the same order?',
    a: 'Yes, absolutely! Our size and color matrix allows you to allocate exact counts across any combination of colors (e.g., 50 Black, 30 White) and standard sizes (XS through 5XL).',
  },
  {
    q: 'How long does production and delivery take?',
    a: 'Standard production typically takes 5–8 business days after quote approval and artwork sign-off, followed by 2–4 days express courier transit across India. If you have an urgent event deadline, toggle "Urgent Order" and our team will fast-track scheduling.',
  },
  {
    q: 'Can we get a sample before placing the full bulk order?',
    a: 'Yes. For orders exceeding 100 pieces, we offer digital 3D/photographic proofing and can produce a physical pre-production sample garment upon initial quote confirmation.',
  },
  {
    q: 'Which printing method should I choose?',
    a: 'If you are unsure, select "Not Sure (Recommend for me)". Direct-to-Film (DTF) is ideal for colorful, detailed graphics on cotton; Screen Printing is cost-effective for large single/two-color runs; Embroidery provides a premium stitched feel for corporate logos on polos and hoodies; and Sublimation is best for all-over sports jerseys.',
  },
  {
    q: 'Do you provide custom neck tags, woven labels, and packaging?',
    a: 'Yes! We offer end-to-end private labeling services including printed heat-transfer neck labels, woven hem labels, branded hang tags, and individual retail-ready polybags for brand merchandise and corporate gifting.',
  },
  {
    q: 'When do we have to pay?',
    a: 'Submitting a bulk order request is 100% free and does not charge your card. Our team reviews your requirements and provides an official itemized quotation. You only pay once you review and explicitly accept the quotation.',
  },
];

export function BulkOrdersFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-16 md:py-24 bg-[#0E0E10] text-[#F5F1EA] border-b border-white/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 space-y-3">
          <span className="text-xs font-mono tracking-widest uppercase text-[#3B5EFF] block font-bold">
            Frequently Asked Questions
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#F5F1EA]">
            Everything You Need To Know
          </h2>
          <p className="text-sm text-pearl/70 font-sans">
            Got questions about bulk custom manufacturing? We have answers.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-display text-base sm:text-lg font-bold uppercase tracking-tight text-white hover:text-pearl transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-pearl/60 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-pearl/75 font-sans leading-relaxed border-t border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
