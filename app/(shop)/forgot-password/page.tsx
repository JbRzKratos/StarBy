'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('success');
      setMessage('Check your email for the password reset link.');
    }
  };

  return (
    <main className="min-h-screen bg-charcoal text-bone flex items-center justify-center px-5 py-24">
      <div className="max-w-md w-full bg-graphite border border-smoke/20 rounded-xl p-8">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl mb-2">Reset Password</h1>
          <p className="font-mono text-xs text-pearl">Enter your email to receive a reset link</p>
        </div>

        {status === 'success' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg font-mono text-xs text-center mb-6">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg font-mono text-xs">
                {message}
              </div>
            )}

            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-pearl block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-smoke/10 border border-smoke/20 rounded-lg px-4 py-3 text-bone font-mono text-sm outline-none focus:border-bone transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-bone text-charcoal font-mono text-[11px] uppercase tracking-widest py-4 rounded-lg hover:bg-pearl transition-colors disabled:opacity-50 mt-2"
            >
              {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="font-mono text-xs text-cobalt hover:text-bone transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
