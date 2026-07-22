'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push('/account');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-charcoal text-bone flex">
      {/* Left side: Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-graphite border-r border-smoke/20 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/login_side_image.png"
            alt="Premium device skin design"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-charcoal/40 to-charcoal"></div>
        </div>
        <div className="relative z-10 p-16 max-w-lg">
          <Link href="/" className="inline-block mb-12">
            <span className="font-display text-4xl font-bold tracking-tight text-bone hover:text-cobalt transition-colors">
              StarBy
            </span>
          </Link>
          <h2 className="font-display text-5xl text-bone uppercase tracking-tighter leading-[1.1] mb-6">
            Elevate Your <br />
            <span className="text-cobalt">Everyday</span> Devices
          </h2>
          <p className="font-mono text-body text-pearl leading-relaxed">
            Log in to access your custom skin designs, manage your orders, and explore premium drops
            reserved for members.
          </p>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-24 sm:px-12 lg:px-24 xl:px-32 relative">
        {/* Mobile Logo */}
        <Link href="/" className="absolute top-8 left-6 sm:left-12 lg:hidden">
          <span className="font-display text-2xl font-bold tracking-tight text-bone">StarBy</span>
        </Link>

        <div className="w-full max-w-md mt-12 lg:mt-0">
          <div className="mb-10">
            <span className="inline-block font-mono text-caption text-cobalt uppercase tracking-widest bg-cobalt/10 px-3 py-1 rounded-full mb-4">
              Welcome Back
            </span>
            <h1 className="font-display text-4xl text-bone uppercase tracking-tighter">Sign In</h1>
            <p className="font-mono text-body-sm text-pearl mt-2">
              Enter your credentials to access your account.
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-ember/10 border border-ember/40 rounded text-ember font-mono text-caption flex items-start gap-3">
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div>
              <label className="block font-mono text-caption text-pearl uppercase tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-graphite border border-smoke/30 rounded-lg px-4 py-4 pl-12 text-bone font-mono text-body-sm focus:border-cobalt focus:ring-1 focus:ring-cobalt outline-none transition-all placeholder:text-smoke/50"
                />
                <svg
                  className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-pearl"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-mono text-caption text-pearl uppercase tracking-widest">
                  Password
                </label>
                <Link
                  href="#"
                  className="font-mono text-[10px] text-pearl hover:text-bone underline transition-colors uppercase tracking-wider"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-graphite border border-smoke/30 rounded-lg px-4 py-4 pl-12 text-bone font-mono text-body-sm focus:border-cobalt focus:ring-1 focus:ring-cobalt outline-none transition-all placeholder:text-smoke/50"
                />
                <svg
                  className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-pearl"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-bone hover:bg-white text-charcoal font-mono text-caption uppercase tracking-widest py-4 mt-2 rounded-lg transition-all hover:scale-[1.02] shadow-xl shadow-bone/10 disabled:opacity-50 disabled:hover:scale-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-bone via-white to-bone opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? 'Signing In...' : 'Sign In'}
                {!loading && (
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                )}
              </span>
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-smoke/10 text-center">
            <p className="font-mono text-caption text-pearl">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-cobalt hover:text-cobalt/80 font-bold transition-colors ml-1"
              >
                Create One
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
