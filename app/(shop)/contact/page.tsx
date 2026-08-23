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
        <div className="mb-12">
          <span className="overline-label block mb-3">Reach Out</span>
          <h1 className="font-display text-display-lg md:text-display-xl font-bold text-bone mb-4">
            Contact Us
          </h1>
          <p className="text-pearl text-body-lg">
            Questions, collaborations, or just want to say hi — we&apos;re here.
          </p>
        </div>

        <ContactForm />
      </div>
    </main>
  );
}
