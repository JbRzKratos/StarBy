'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FregoroLogo } from '@/components/ui/fregoro-logo';

const footerLinks = {
  shop: [
    { href: '/products/all', label: 'Shop All' },
    { href: '/magazine', label: 'Magazine Studio' },
    { href: '/products/hoodies', label: 'Hoodies' },
    { href: '/products/mugs-cups', label: 'Cups & Mugs' },
    { href: '/products/skins', label: 'Device Skins' },
    { href: '/products/posters', label: 'Posters' },
    { href: '/split-poster', label: 'Split Posters' },
  ],
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/studio', label: 'Studio' },
    { href: '/track', label: 'Track Order' },
    { href: '/faq', label: 'FAQ' },
    { href: '/shipping', label: 'Shipping' },
  ],
  legal: [
    { href: '/legal/terms', label: 'Terms of Service' },
    { href: '/legal/privacy', label: 'Privacy Policy' },
    { href: '/legal/returns', label: 'Return Policy' },
  ],
};

export function Footer() {
  const [newsletterMsg, setNewsletterMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  return (
    <footer className="border-t border-[#F5F1EA]/10 bg-[#0E0E10] text-[#F5F1EA]">
      <div className="section-container max-w-7xl mx-auto px-6 sm:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-5 pr-0 lg:pr-12">
            <div className="mb-5">
              <FregoroLogo size="lg" />
            </div>
            <p className="text-[#F5F1EA]/70 font-mono text-xs sm:text-sm max-w-sm leading-relaxed mb-8">
              Your story, engineered into design objects. Premium customizable streetwear and
              lifestyle essentials for people who refuse to be generic.
            </p>

            <div className="mt-8">
              <h3 className="font-mono text-xs text-[#ED9518] font-bold uppercase tracking-[0.2em] mb-3">
                Join the Collective
              </h3>
              <form
                className="flex flex-col sm:flex-row gap-3 max-w-md"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                  setNewsletterLoading(true);
                  setNewsletterMsg(null);
                  try {
                    const res = await fetch('/api/newsletter', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setNewsletterMsg({ text: 'Thanks for subscribing! 🎉', ok: true });
                      form.reset();
                    } else {
                      setNewsletterMsg({
                        text: data.message || 'Something went wrong.',
                        ok: false,
                      });
                    }
                  } catch {
                    setNewsletterMsg({ text: 'Error subscribing. Please try again.', ok: false });
                  } finally {
                    setNewsletterLoading(false);
                  }
                }}
              >
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  aria-label="Email address for newsletter"
                  required
                  className="flex-1 bg-[#1A1A1E] border border-[#F5F1EA]/15 px-4 py-3 text-[#F5F1EA] font-mono text-xs rounded-lg focus:outline-none focus:border-[#0057FF] transition-colors"
                />
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  className="bg-[#0057FF] text-[#F5F1EA] px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#0046CC] transition-colors shadow-md disabled:opacity-60"
                >
                  {newsletterLoading ? '...' : 'Subscribe'}
                </button>
              </form>
              {newsletterMsg && (
                <p
                  className={`mt-3 font-mono text-xs ${
                    newsletterMsg.ok ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {newsletterMsg.text}
                </p>
              )}
            </div>
          </div>

          {/* Shop links */}
          <div className="lg:col-span-2">
            <h3 className="font-mono text-xs text-[#ED9518] uppercase tracking-[0.2em] font-bold mb-4">
              Shop
            </h3>
            <ul className="flex flex-col gap-3 font-mono text-xs">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#F5F1EA]/70 hover:text-[#0057FF] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div className="lg:col-span-2">
            <h3 className="font-mono text-xs text-[#ED9518] uppercase tracking-[0.2em] font-bold mb-4">
              Company
            </h3>
            <ul className="flex flex-col gap-3 font-mono text-xs">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#F5F1EA]/70 hover:text-[#0057FF] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div className="lg:col-span-3">
            <h3 className="font-mono text-xs text-[#ED9518] uppercase tracking-[0.2em] font-bold mb-4">
              Legal
            </h3>
            <ul className="flex flex-col gap-3 font-mono text-xs">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#F5F1EA]/70 hover:text-[#0057FF] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-[#F5F1EA]/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#F5F1EA]/50">
          <p>© {new Date().getFullYear()} Fregoro Studios. All rights reserved.</p>
          <p>Designed with intention. Made on demand.</p>
        </div>
      </div>
    </footer>
  );
}
