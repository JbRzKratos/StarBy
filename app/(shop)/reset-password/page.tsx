'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // When clicking the link in the email, Supabase sets the session in the hash or URL.
  // We need a session to update the password.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setStatus('error');
        setMessage('Invalid or expired reset link. Please request a new one.');
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('success');
      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };

  return (
    <main className="min-h-screen bg-charcoal text-bone flex items-center justify-center px-5 py-24">
      <div className="max-w-md w-full bg-graphite border border-smoke/20 rounded-xl p-8">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl mb-2">Set New Password</h1>
          <p className="font-mono text-xs text-pearl">Please enter your new password below.</p>
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
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-smoke/10 border border-smoke/20 rounded-lg px-4 py-3 text-bone font-mono text-sm outline-none focus:border-bone transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || status === 'error'}
              className="w-full bg-bone text-charcoal font-mono text-[11px] uppercase tracking-widest py-4 rounded-lg hover:bg-pearl transition-colors disabled:opacity-50 mt-2"
            >
              {status === 'loading' ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
