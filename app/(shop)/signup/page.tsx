'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push('/account');
        router.refresh();
      } else {
        setError('Account created! Please check your email to verify your registration.');
        setLoading(false);
      }
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
            Join the <br />
            <span className="text-cobalt">Revolution</span>
          </h2>
          <p className="font-mono text-body text-pearl leading-relaxed">
            Create an account to unleash your creativity in our DIY Studio, save your favorite
            skins, and get faster checkout.
          </p>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-24 sm:px-12 lg:px-24 xl:px-32 relative">
        <div className="w-full max-w-md mt-12 lg:mt-0">
          <div className="mb-10">
            <span className="inline-block font-mono text-caption text-cobalt uppercase tracking-widest bg-cobalt/10 px-3 py-1 rounded-full mb-4">
              Get Started
            </span>
            <h1 className="font-display text-4xl text-bone uppercase tracking-tighter">
              Create Account
            </h1>
            <p className="font-mono text-body-sm text-pearl mt-2">
              Fill in your details below to join StarBy.
            </p>
          </div>

          {error && (
            <div
              className={`mb-8 p-4 border rounded font-mono text-caption flex items-start gap-3 ${
                error.includes('verify')
                  ? 'bg-cobalt/10 border-cobalt/40 text-cobalt'
                  : 'bg-ember/10 border-ember/40 text-ember'
              }`}
            >
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
                  d={
                    error.includes('verify')
                      ? 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                  }
                />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="flex flex-col gap-6">
            <div>
              <label className="block font-mono text-caption text-pearl uppercase tracking-widest mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>

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
              <label className="block font-mono text-caption text-pearl uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
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
                {loading ? 'Creating Account...' : 'Create Account'}
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
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-cobalt hover:text-cobalt/80 font-bold transition-colors ml-1"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
