'use client';

import { useState } from 'react';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [tracking, setTracking] = useState(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setTracking(true);
    // Mock tracking
    setTimeout(() => {
      alert('Order tracking system will be integrated with backend API.');
      setTracking(false);
    }, 1000);
  };

  return (
    <main className="min-h-screen pt-32 pb-16 px-5 md:px-8">
      <div className="max-w-xl mx-auto">
        <h1 className="font-display text-display-md text-bone mb-4">Track Order.</h1>
        <p className="font-mono text-body-sm text-pearl mb-8">
          Enter your order ID and email address to get the latest status of your shipment.
        </p>

        <form onSubmit={handleTrack} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="orderId" className="block font-mono text-caption uppercase text-ash">
              Order ID
            </label>
            <input
              type="text"
              id="orderId"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. SB-12345"
              className="w-full bg-graphite border border-smoke/50 px-4 py-3 text-bone font-mono text-body-sm focus:outline-none focus:border-cobalt transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block font-mono text-caption uppercase text-ash">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
              className="w-full bg-graphite border border-smoke/50 px-4 py-3 text-bone font-mono text-body-sm focus:outline-none focus:border-cobalt transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={tracking}
            className="w-full bg-bone text-charcoal px-6 py-4 font-mono text-caption uppercase tracking-widest font-bold hover:bg-cobalt hover:text-bone transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tracking ? 'Tracking...' : 'Track Package'}
          </button>
        </form>
      </div>
    </main>
  );
}
