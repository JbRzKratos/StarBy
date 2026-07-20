import Link from 'next/link';

const footerLinks = {
  shop: [
    { href: '/products/all', label: 'Shop All' },
    { href: '/products/hoodies', label: 'Hoodies' },
    { href: '/products/skins', label: 'Device Skins' },
    { href: '/products/posters', label: 'Posters' },
    { href: '/split-poster', label: 'Split Posters' },
  ],
  company: [
    { href: '/studio', label: 'Studio' },
    { href: '/faq', label: 'FAQ' },
    { href: '/shipping', label: 'Shipping' },
    { href: '/contact', label: 'Contact' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-smoke bg-graphite">
      <div className="section-container py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h2 className="font-display text-display-md font-bold text-bone mb-4">StarBy</h2>
            <p className="text-pearl text-body-sm max-w-sm leading-relaxed">
              Your story, engineered into design objects. Premium customizable products for people
              who refuse to be generic.
            </p>
          </div>

          {/* Shop links */}
          <div>
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
          <div>
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
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-smoke flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-caption text-ash">
            © {new Date().getFullYear()} StarBy. All rights reserved.
          </p>
          <p className="font-mono text-caption text-ash">
            Designed with intention. Made on demand.
          </p>
        </div>
      </div>
    </footer>
  );
}
