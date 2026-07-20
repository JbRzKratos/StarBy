import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with StarBy. Questions, collaborations, or feedback.',
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

        <form className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="overline-label block mb-2">Name</label>
              <input
                type="text"
                className="w-full bg-graphite border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="overline-label block mb-2">Email</label>
              <input
                type="email"
                className="w-full bg-graphite border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
                placeholder="you@email.com"
              />
            </div>
          </div>

          <div>
            <label className="overline-label block mb-2">Subject</label>
            <select className="w-full bg-graphite border border-smoke text-pearl font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt">
              <option>General Inquiry</option>
              <option>Order Issue</option>
              <option>Collaboration</option>
              <option>Press</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="overline-label block mb-2">Message</label>
            <textarea
              rows={6}
              className="w-full bg-graphite border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash resize-none"
              placeholder="Tell us what's on your mind..."
            />
          </div>

          <button
            type="submit"
            className="self-start px-10 py-3.5 bg-cobalt text-bone font-mono text-caption uppercase tracking-widest hover:bg-cobalt/90 transition-colors"
          >
            Send Message
          </button>
        </form>
      </div>
    </main>
  );
}
