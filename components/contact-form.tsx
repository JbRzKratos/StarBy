'use client';

import { useState } from 'react';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
      website: formData.get('website'), // honeypot
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatus('success');
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to send message.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again later.');
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {/* Honeypot field — hidden from humans, filled by bots */}
      <input type="text" name="website" aria-hidden="true" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />
      {status === 'success' && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-sm font-mono text-sm">
          Thank you for reaching out! Your message has been sent successfully. We will get back to
          you soon.
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-sm font-mono text-sm">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="overline-label block mb-2" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full bg-graphite border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="overline-label block mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full bg-graphite border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash"
            placeholder="you@email.com"
          />
        </div>
      </div>

      <div>
        <label className="overline-label block mb-2" htmlFor="subject">
          Subject
        </label>
        <select
          id="subject"
          name="subject"
          className="w-full bg-graphite border border-smoke text-pearl font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt"
        >
          <option value="General Inquiry">General Inquiry</option>
          <option value="Order Issue">Order Issue</option>
          <option value="Collaboration">Collaboration</option>
          <option value="Press">Press</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="overline-label block mb-2" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className="w-full bg-graphite border border-smoke text-bone font-mono text-body-sm px-4 py-3 rounded-sm focus:outline-none focus:border-cobalt placeholder:text-ash resize-none"
          placeholder="Tell us what's on your mind..."
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="self-start px-10 py-3.5 bg-cobalt text-bone font-mono text-caption uppercase tracking-widest hover:bg-cobalt/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
