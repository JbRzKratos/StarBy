'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FregoroLogo } from '@/components/ui/fregoro-logo';

const footerLinks = {
  shop: [
    { href: '/products/all', label: 'Shop All' },
    { href: '/products/hoodies', label: 'Hoodies' },
    { href: '/products/mugs-cups', label: 'Mugs & Cups' },
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
    <footer className="border-t border-smoke bg-graphite">
      <div className="section-container py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 md:gap-8">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-5 pr-0 lg:pr-12">
            <div className="mb-4">
              <FregoroLogo size="lg" />
            </div>
            <p className="text-pearl text-body-sm max-w-sm leading-relaxed mb-8">
              Your story, engineered into design objects. Premium customizable products for people
              who refuse to be generic.
            </p>

            <div className="mt-8">
              <h3 className="font-mono text-caption text-bone uppercase tracking-widest mb-4">
                Join the Collective
              </h3>
              <form
                className="flex flex-col sm:flex-row gap-3"
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
                  className="flex-1 bg-charcoal border border-smoke px-4 py-3 text-bone font-mono text-body-sm rounded-lg focus:outline-none focus:border-cobalt transition-colors"
                />
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  className="bg-cobalt text-bone px-6 py-3 font-mono text-caption uppercase tracking-widest rounded-lg hover:bg-cobalt/80 transition-colors shadow-md disabled:opacity-60"
                >
                  {newsletterLoading ? '...' : 'Subscribe'}
                </button>
              </form>
              {newsletterMsg && (
                <p
                  className={`mt-3 font-mono text-caption ${
                    newsletterMsg.ok ? 'text-emerald-400' : 'text-ember'
                  }`}
                >
                  {newsletterMsg.text}
                </p>
              )}
            </div>
          </div>

          {/* Shop links */}
          <div className="lg:col-span-2">
            <h3 className="overline-label mb-4">Shop</h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-pearl text-body-sm hover:text-cobalt transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div className="lg:col-span-2">
            <h3 className="overline-label mb-4">Company</h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-pearl text-body-sm hover:text-cobalt transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div className="lg:col-span-3">
            <h3 className="overline-label mb-4">Legal</h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-pearl text-body-sm hover:text-cobalt transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-smoke flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-caption text-ash">
            © {new Date().getFullYear()} Fregoro Studios. All rights reserved.
          </p>
          <div className="flex gap-4">
            <p className="font-mono text-caption text-ash">
              Designed with intention. Made on demand.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
