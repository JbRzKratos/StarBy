'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

// Map Supabase error messages to user-friendly text
function getFriendlyError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Incorrect email or password. Please try again.';
  if (msg.includes('Email not confirmed')) return 'Please verify your email before signing in.';
  if (msg.includes('Too many requests')) return 'Too many attempts. Please wait a moment and try again.';
  if (msg.includes('User not found')) return 'No account found with that email address.';
  return msg;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateEmail = (val: string) => {
    if (!val) { setEmailError('Email is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { setEmailError('Please enter a valid email address'); return false; }
    setEmailError(null);
    return true;
  };

  const validatePassword = (val: string) => {
    if (!val) { setPasswordError('Password is required'); return false; }
    setPasswordError(null);
    return true;
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const emailOk = validateEmail(email);
    const passOk = validatePassword(password);
    if (!emailOk || !passOk) return;

    setAuthError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      // After login, clear the session from localStorage if rememberMe is false
      // so it behaves as a session-only cookie (expires when browser closes)
      if (!rememberMe) {
        // Supabase JS v2 persists session by default; we convert the token to session-scoped
        // by removing the persisted key so the next page load won't auto-restore it
        try {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith('sb-') && k.endsWith('-auth-token')) localStorage.removeItem(k);
          });
        } catch {
          // localStorage unavailable — no-op
        }
      }

      if (authError) {
        setAuthError(getFriendlyError(authError.message));
        setLoading(false);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setAuthError('An unexpected error occurred. Please try again.');
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

          {authError && (
            <div className="mb-8 p-4 bg-ember/10 border border-ember/40 rounded text-ember font-mono text-caption flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block font-mono text-caption text-pearl uppercase tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={(e) => validateEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full bg-graphite border rounded-lg px-4 py-4 pl-12 text-bone font-mono text-body-sm focus:ring-1 outline-none transition-all placeholder:text-smoke/50 ${
                    emailError
                      ? 'border-ember/60 focus:border-ember focus:ring-ember/30'
                      : 'border-smoke/30 focus:border-cobalt focus:ring-cobalt'
                  }`}
                />
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-pearl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              {emailError && <p className="mt-1.5 font-mono text-[11px] text-ember">{emailError}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="font-mono text-caption text-pearl uppercase tracking-widest">
                  Password
                </label>
                <Link href="/forgot-password" className="font-mono text-[10px] text-pearl hover:text-bone underline transition-colors uppercase tracking-wider">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={(e) => validatePassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-graphite border rounded-lg px-4 py-4 pl-12 pr-12 text-bone font-mono text-body-sm focus:ring-1 outline-none transition-all placeholder:text-smoke/50 ${
                    passwordError
                      ? 'border-ember/60 focus:border-ember focus:ring-ember/30'
                      : 'border-smoke/30 focus:border-cobalt focus:ring-cobalt'
                  }`}
                />
                {/* Lock icon */}
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-pearl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {/* Show/hide toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-pearl hover:text-bone transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <p className="mt-1.5 font-mono text-[11px] text-ember">{passwordError}</p>}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-cobalt rounded border-smoke/40"
              />
              <span className="font-mono text-caption text-pearl group-hover:text-bone transition-colors">
                Keep me signed in
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-bone hover:bg-white text-charcoal font-mono text-caption uppercase tracking-widest py-4 mt-2 rounded-lg transition-all hover:scale-[1.02] shadow-xl shadow-bone/10 disabled:opacity-60 disabled:hover:scale-100 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-bone via-white to-bone opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing In…
                  </>
                ) : (
                  <>
                    Sign In
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-smoke/10 text-center">
            <p className="font-mono text-caption text-pearl">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-cobalt hover:text-cobalt/80 font-bold transition-colors ml-1">
                Create One
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
