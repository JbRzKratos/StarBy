'use client';

import { useState } from 'react';

interface TrackResult {
  status: string;
  estimatedDeliveryDate?: string;
  paymentStatus: string;
  total: number;
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [tracking, setTracking] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setTracking(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, email }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'Failed to track order');
      }
    } catch {
      setError('An error occurred. Please try again later.');
    } finally {
      setTracking(false);
    }
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
              placeholder="e.g. ORD_..."
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

        {error && (
          <div className="mt-8 p-4 bg-ember/10 border border-ember/40 rounded text-ember font-mono text-caption">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 bg-graphite border border-smoke/40 p-6 rounded-lg">
            <h2 className="font-display text-2xl text-bone uppercase mb-6 border-b border-smoke/30 pb-4">
              Order Status
            </h2>

            <div className="space-y-6">
              <div>
                <span className="font-mono text-caption text-ash uppercase block mb-1">
                  Current Status
                </span>
                <span className="inline-block bg-cobalt/10 text-cobalt px-3 py-1 font-mono text-caption uppercase tracking-widest border border-cobalt/30 rounded">
                  {result.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                <span className="font-mono text-caption text-ash uppercase block mb-1">
                  Estimated Delivery Date
                </span>
                <span className="font-mono text-body-md text-emerald-400">
                  {result.estimatedDeliveryDate
                    ? new Date(result.estimatedDeliveryDate).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'TBD'}
                </span>
              </div>

              <div>
                <span className="font-mono text-caption text-ash uppercase block mb-1">
                  Payment Status
                </span>
                <span
                  className={`font-mono text-body-sm ${result.paymentStatus === 'paid' ? 'text-bone' : 'text-amber-400'}`}
                >
                  {result.paymentStatus.toUpperCase()}
                </span>
              </div>

              <div>
                <span className="font-mono text-caption text-ash uppercase block mb-1">
                  Total Amount
                </span>
                <span className="font-display text-xl text-bone">₹{result.total}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
