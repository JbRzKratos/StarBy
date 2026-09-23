import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact-form';

export const metadata: Metadata = {
  title: 'Contact — Fregoro Studios',
  description: 'Get in touch with Fregoro Studios. Questions, collaborations, or feedback.',
};

export default function ContactPage() {
  return (
    <main className="pt-36 md:pt-40 pb-20">
      <div className="section-container max-w-3xl">
        <div className="mb-10">
          <span className="overline-label block mb-3">Reach Out</span>
          <h1 className="font-display text-display-lg md:text-display-xl font-bold text-bone mb-4">
            Contact Us
          </h1>
          <p className="text-pearl text-body-lg mb-6">
            Questions, collaborations, or custom orders — we&apos;re here to help.
          </p>

          <div className="bg-graphite/60 border border-smoke/60 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] text-ash uppercase tracking-widest block mb-1">
                Official Business Email
              </span>
              <a
                href="mailto:fregorostudios@gmail.com"
                className="font-mono text-base sm:text-lg text-cobalt hover:underline font-bold"
              >
                fregorostudios@gmail.com
              </a>
            </div>
            <span className="font-mono text-xs text-pearl/80 bg-smoke/20 px-3 py-1.5 rounded-md">
              ✦ Typically replies within 24 hours
            </span>
          </div>
        </div>

        <ContactForm />
      </div>
    </main>
  );
}
