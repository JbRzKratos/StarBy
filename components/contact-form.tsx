'use client';

import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, MessageCircle, RotateCcw } from 'lucide-react';
import { getWhatsappLink } from '@/lib/whatsapp';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    email: string;
    phone?: string;
    company?: string;
    subject: string;
    message: string;
  } | null>(null);

  // Form input state so user doesn't lose text on retry
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      company: String(formData.get('company') || '').trim(),
      subject: String(formData.get('subject') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      website: String(formData.get('website') || '').trim(), // Honeypot
    };

    // Client-side quick validation
    if (!payload.name) {
      setStatus('error');
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!payload.email || !payload.email.includes('@')) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!payload.message || payload.message.length < 10) {
      setStatus('error');
      setErrorMessage('Your message must be at least 10 characters long.');
      return;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSubmittedData({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          company: payload.company,
          subject: payload.subject,
          message: payload.message,
        });
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Contact submit error:', err);
      setStatus('error');
      setErrorMessage('A network interruption occurred. Please try again.');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setErrorMessage('');
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setSubject('General Inquiry');
    setMessage('');
    setSubmittedData(null);
  };

  // WhatsApp prefilled message
  const whatsappUrl = getWhatsappLink(
    `Hi Fregoro Studios, I submitted a contact enquiry regarding "${submittedData?.subject || subject}". My name is ${submittedData?.name || name || 'Customer'}.`,
  );

  // ─── SUCCESS STATE ─────────────────────────────────────────────────────────
  if (status === 'success' && submittedData) {
    return (
      <div className="bg-[#121214] border border-emerald-500/30 rounded-2xl p-6 sm:p-10 space-y-6 shadow-2xl shadow-emerald-500/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-widest block">
              Message Received
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-bone">
              Thanks for contacting Fregoro Studios.
            </h2>
          </div>
        </div>

        <p className="text-pearl text-sm sm:text-base leading-relaxed">
          Your message has been sent successfully to our studio team. Keep an eye on your inbox{' '}
          <strong className="text-bone">({submittedData.email})</strong> for our confirmation.
        </p>

        {/* Summary Card */}
        <div className="bg-graphite/60 border border-smoke/40 rounded-xl p-5 font-mono text-xs space-y-2 text-pearl">
          <div className="flex justify-between border-b border-smoke/20 pb-2">
            <span className="text-ash uppercase">Customer</span>
            <span className="text-bone font-bold">{submittedData.name}</span>
          </div>
          <div className="flex justify-between border-b border-smoke/20 pb-2">
            <span className="text-ash uppercase">Email</span>
            <span className="text-cobalt">{submittedData.email}</span>
          </div>
          {submittedData.phone && (
            <div className="flex justify-between border-b border-smoke/20 pb-2">
              <span className="text-ash uppercase">Phone</span>
              <span className="text-bone">{submittedData.phone}</span>
            </div>
          )}
          {submittedData.company && (
            <div className="flex justify-between border-b border-smoke/20 pb-2">
              <span className="text-ash uppercase">Company</span>
              <span className="text-bone">{submittedData.company}</span>
            </div>
          )}
          <div className="flex justify-between pt-1">
            <span className="text-ash uppercase">Subject</span>
            <span className="text-bone font-bold">{submittedData.subject}</span>
          </div>
        </div>

        {/* WhatsApp Fast Track CTA */}
        <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl p-5 sm:p-6 text-center space-y-3">
          <span className="font-mono text-xs uppercase tracking-wider text-[#25D366] font-bold block">
            Need a Quick Response?
          </span>
          <p className="text-xs sm:text-sm text-pearl/90 max-w-md mx-auto">
            You can chat directly with our design and production team on WhatsApp for real-time
            answers.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-black font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-[#25D366]/20"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat With Us On WhatsApp</span>
          </a>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-mono text-ash hover:text-bone uppercase tracking-wider underline decoration-smoke hover:decoration-bone transition-colors"
          >
            Send Another Message &rarr;
          </button>
        </div>
      </div>
    );
  }

  // ─── IDLE / SUBMITTING / ERROR STATE ───────────────────────────────────────
  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {/* Honeypot field — hidden from humans, filled by bots */}
      <input
        type="text"
        name="website"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        style={{ display: 'none' }}
      />

      {/* Error state alert */}
      {status === 'error' && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-sans flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">Unable to send message</p>
              <p className="text-xs text-rose-300/90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-rose-400 hover:text-white bg-rose-900/40 px-3 py-1.5 rounded border border-rose-500/30"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Row 1: Name & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="overline-label block mb-2" htmlFor="name">
            Your Name <span className="text-rose-400">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={status === 'submitting'}
            className="w-full bg-graphite border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash disabled:opacity-50"
            placeholder="Gokul or Studio Name"
          />
        </div>
        <div>
          <label className="overline-label block mb-2" htmlFor="email">
            Email Address <span className="text-rose-400">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'submitting'}
            className="w-full bg-graphite border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash disabled:opacity-50"
            placeholder="you@email.com"
          />
        </div>
      </div>

      {/* Row 2: Phone & Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="overline-label block mb-2" htmlFor="phone">
            Phone / WhatsApp Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={status === 'submitting'}
            className="w-full bg-graphite border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash disabled:opacity-50"
            placeholder="+91 98765 43210"
          />
        </div>
        <div>
          <label className="overline-label block mb-2" htmlFor="company">
            Company / Organization (Optional)
          </label>
          <input
            id="company"
            name="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={status === 'submitting'}
            className="w-full bg-graphite border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash disabled:opacity-50"
            placeholder="Brand or Agency"
          />
        </div>
      </div>

      {/* Row 3: Subject */}
      <div>
        <label className="overline-label block mb-2" htmlFor="subject">
          Subject <span className="text-rose-400">*</span>
        </label>
        <select
          id="subject"
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={status === 'submitting'}
          className="w-full bg-graphite border border-smoke text-pearl font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt disabled:opacity-50"
        >
          <option value="General Inquiry">General Inquiry</option>
          <option value="Custom Order / Bulk Printing">Custom Order / Bulk Printing</option>
          <option value="Existing Order Issue">Existing Order Issue</option>
          <option value="Artwork & Design Support">Artwork & Design Support</option>
          <option value="Collaboration & Press">Collaboration & Press</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Row 4: Message */}
      <div>
        <label className="overline-label block mb-2" htmlFor="message">
          Message <span className="text-rose-400">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={status === 'submitting'}
          className="w-full bg-graphite border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash resize-none disabled:opacity-50"
          placeholder="Tell us what you have in mind, dimensions, apparel type, or questions..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="px-10 py-3.5 bg-cobalt hover:bg-cobalt/90 text-bone font-mono text-caption uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cobalt/20"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{status === 'submitting' ? 'Sending...' : 'SEND MESSAGE'}</span>
        </button>

        <span className="font-mono text-[11px] text-ash">
          ✦ Direct response to your inbox & WhatsApp
        </span>
      </div>
    </form>
  );
}
