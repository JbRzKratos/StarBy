import type { Metadata } from 'next';
import { AccordionItem } from '@/components/ui/accordion';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about StarBy products, customization, and shipping.',
};

const faqs = [
  {
    q: 'How does the customizer work?',
    a: 'Our live customizer lets you upload any image or add text, then position, scale, and rotate it on a product mockup in real time. What you see is what you get — the preview matches the final print.',
  },
  {
    q: 'What print quality do you use?',
    a: 'We use premium DTG (Direct-to-Garment) printing for apparel and giclée fine-art printing for posters and prints. All prints are rated for 200+ wash cycles on apparel.',
  },
  {
    q: 'Can I return a customized product?',
    a: "Since each item is made to your exact specification, we can't accept returns on customized products unless there's a manufacturing defect. Non-customized items can be returned within 14 days.",
  },
  {
    q: 'How long does production take?',
    a: 'Standard production is 3-5 business days. Rush production (1-2 days) is available for select products at an additional charge.',
  },
  {
    q: 'What file formats do you accept?',
    a: 'PNG and JPG files up to 20MB. For best results, use high-resolution images (300 DPI or higher). Our customizer will warn you if your image resolution is too low for your selected print size.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Yes! We ship to 50+ countries. International shipping typically takes 7-14 business days. Exact delivery times and costs are calculated at checkout based on your location.',
  },
  {
    q: "What's a split poster?",
    a: 'A split poster takes one image and divides it across 2, 3, 4, or 6 separate panels. When hung together with slight spacing, it creates a stunning gallery-style wall art installation.',
  },
  {
    q: 'Can I see a preview before I order?',
    a: 'Absolutely. Our customizer gives you a live, real-time preview of your design on the actual product. For split posters, you can preview the panel separation effect before ordering.',
  },
];

export default function FaqPage() {
  return (
    <main className="pt-36 md:pt-40 pb-20">
      <div className="section-container max-w-3xl">
        <div className="mb-12">
          <span className="overline-label block mb-3">Help</span>
          <h1 className="font-display text-display-lg md:text-display-xl font-bold text-bone mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-pearl text-body-lg">Everything you need to know about StarBy.</p>
        </div>

        <div>
          {faqs.map((faq) => (
            <AccordionItem key={faq.q} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>
    </main>
  );
}
