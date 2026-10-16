'use client';

import { useState, useEffect, Suspense, useRef, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { isSuperAdminEmail } from '@/lib/auth-constants';

// Friendly Supabase Auth Error Mapper
function getFriendlyError(msg: string): string {
  if (msg.includes('Invalid login credentials')) {
    return 'Incorrect email or password. Please verify your credentials and try again.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'Your email has not been verified yet. Please check your inbox for the confirmation email.';
  }
  if (msg.includes('Too many requests')) {
    return 'Too many login attempts. Please wait a moment before trying again.';
  }
  if (msg.includes('User not found')) {
    return 'No account was found with that email address. Please sign up first.';
  }
  return msg;
}

const SHOWCASE_ITEMS = [
  {
    image: '/images/hero/hoodies.png',
    tag: 'Archive 2026 // Drop 01',
    title: 'Boxy Heavyweight Hoodie',
    specs: '300+ GSM French Terry Cotton',
    highlight: 'Front & Back Placement in 3D',
    symbol: '👕',
  },
  {
    image: '/images/hero/tees.png',
    tag: 'Vintage Wash // Drop 02',
    title: 'Industrial Washed Tee',
    specs: '240 GSM Combed Heavy Cotton',
    highlight: 'Oversized Silhouette • Custom Graphic',
    symbol: '🎽',
  },
  {
    image: '/images/login_side_image.png',
    tag: 'Customizer Studio',
    title: 'Engineered Design Objects',
    specs: 'High-Res UV Direct-to-Garment',
    highlight: 'Curated Precision • Pan-India Delivery',
    symbol: '✦',
  },
];

function LoginContent() {
  const searchParams = useSearchParams();
  const rawRedirectTo = searchParams.get('redirectTo');
  const isVerifiedParam = searchParams.get('verified') === 'true';
  const emailParam = searchParams.get('email') || '';

  // Form State
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showcaseIndex, setShowcaseIndex] = useState(0);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Auto-rotate showcase streetwear items
  useEffect(() => {
    const interval = setInterval(() => {
      setShowcaseIndex((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // If already logged in and not verifying, forward to destination
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !isVerifiedParam) {
        if (rawRedirectTo) {
          window.location.href = rawRedirectTo;
          return;
        }
        if (isSuperAdminEmail(session.user.email)) {
          window.location.href = '/admin';
          return;
        }
        window.location.href = '/account';
      }
    });
  }, [rawRedirectTo, isVerifiedParam]);

  // If user arrived from email verification link
  useEffect(() => {
    if (isVerifiedParam) {
      if (emailParam) {
        setEmail(emailParam);
      }
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 300);
    }
  }, [isVerifiedParam, emailParam]);

  const validateEmail = (val: string) => {
    if (!val) {
      setEmailError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (val: string) => {
    if (!val) {
      setPasswordError('Password is required');
      return false;
    }
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
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authErr) {
        setAuthError(getFriendlyError(authErr.message));
        setLoading(false);
        return;
      }

      let dest = rawRedirectTo;
      if (!dest) {
        dest = isSuperAdminEmail(data?.session?.user?.email || email) ? '/admin' : '/';
      }

      window.location.href = dest;
    } catch (err) {
      console.error('[Login] Unexpected error:', err);
      setAuthError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100dvh-60px)] w-full bg-[#0A0A0C] text-[#F5F1EA] font-sans pt-28 sm:pt-32 md:pt-36 pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-[#3B5EFF]/10 via-[#ED9518]/10 to-transparent blur-[120px] pointer-events-none rounded-full"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#3B5EFF]/5 blur-[100px] pointer-events-none rounded-full"
        aria-hidden="true"
      />

      {/* Main Authentication Card */}
      <div className="relative z-10 w-full max-w-4xl rounded-2xl overflow-hidden bg-[#121215]/95 border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.7)] backdrop-blur-xl flex flex-col md:flex-row">
        {/* ── Left Column: Sign In Form ── */}
        <div className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
          <div>
            {/* Header Badge & Title */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ED9518]/10 border border-[#ED9518]/30 text-[#ED9518] font-mono text-[10px] font-bold uppercase tracking-widest">
                <span>✦</span>
                <span>Fregoro Member Access</span>
              </span>

              {/* Mobile item indicator */}
              <span className="md:hidden font-mono text-[10px] text-white/50">
                Studio Calibrated
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-bone">
              Sign In
            </h1>
            <p className="font-mono text-xs text-[#94A3B8] mt-1.5 mb-6 leading-relaxed">
              Sign in to manage your 3D customizer artwork, view orders, and access member benefits.
            </p>

            {/* Verified Email Banner Notice */}
            {isVerifiedParam && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs flex items-start gap-2.5">
                <span className="text-sm shrink-0">✓</span>
                <div>
                  <strong className="block font-bold uppercase tracking-wider text-[11px]">
                    Email Verified Successfully
                  </strong>
                  <span className="text-white/80 text-[11px] leading-snug">
                    Your account is confirmed. Enter your password below to proceed.
                  </span>
                </div>
              </div>
            )}

            {/* Auth Error Banner */}
            {authError && (
              <div className="mb-5 p-3.5 rounded-xl bg-[#C45D3E]/15 border border-[#C45D3E]/40 text-[#C45D3E] font-mono text-xs flex items-start gap-2.5">
                <span className="text-sm shrink-0">⚠️</span>
                <span className="text-[11px] leading-snug">{authError}</span>
              </div>
            )}

            {/* The Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
              {/* Email Field */}
              <div className="group rounded-xl border border-white/15 bg-black/40 p-3 transition-all focus-within:border-[#ED9518] focus-within:ring-1 focus-within:ring-[#ED9518]/30">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-email"
                    className="block font-mono text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] group-focus-within:text-[#ED9518] transition-colors"
                  >
                    Email Address
                  </label>
                  <span className="text-xs text-white/40 font-mono">@</span>
                </div>
                <input
                  ref={emailInputRef}
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={(e) => validateEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-transparent text-[#F5F1EA] font-mono text-sm outline-none mt-1 placeholder:text-white/25"
                />
                {emailError && (
                  <span className="block mt-1 font-mono text-[10px] text-[#C45D3E]">
                    {emailError}
                  </span>
                )}
              </div>

              {/* Password Field */}
              <div className="group rounded-xl border border-white/15 bg-black/40 p-3 transition-all focus-within:border-[#ED9518] focus-within:ring-1 focus-within:ring-[#ED9518]/30">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="login-password"
                    className="block font-mono text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] group-focus-within:text-[#ED9518] transition-colors"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="font-mono text-[10px] uppercase font-bold text-[#94A3B8] hover:text-[#ED9518] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={(e) => validatePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-[#F5F1EA] font-mono text-sm outline-none mt-1 placeholder:text-white/25"
                />
                {passwordError && (
                  <span className="block mt-1 font-mono text-[10px] text-[#C45D3E]">
                    {passwordError}
                  </span>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[#94A3B8] hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#ED9518] rounded w-4 h-4"
                  />
                  <span className="text-[11px]">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-[#94A3B8] hover:text-[#ED9518] underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-xl bg-[#ED9518] hover:bg-[#ffaa2b] text-black font-mono text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#ED9518]/25 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-black" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer of Card */}
          <div className="mt-8 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#94A3B8]">
            <div>
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-[#ED9518] hover:underline font-bold transition-colors ml-1"
              >
                Sign up
              </Link>
            </div>

            <Link
              href="/products/all"
              className="text-[11px] text-white/50 hover:text-white transition-colors underline flex items-center gap-1"
            >
              <span>Explore as Guest</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* ── Right Column: Showcase Preview (Desktop Only) ── */}
        <div className="hidden md:flex md:w-[45%] relative bg-[#0D0D10] overflow-hidden border-l border-white/10 select-none flex-col justify-between p-7">
          {/* Background Showcase Image with Fade Transitions */}
          {SHOWCASE_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-all duration-700 ease-out ${
                idx === showcaseIndex
                  ? 'opacity-85 scale-100 z-10'
                  : 'opacity-0 scale-105 pointer-events-none z-0'
              }`}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                priority={idx === 0}
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-black/35 to-black/60" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#121215]/80 via-transparent to-transparent" />
            </div>
          ))}

          {/* Top Status Pill */}
          <div className="relative z-20 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 border border-white/15 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/90 font-bold">
                360° Studio Online
              </span>
            </div>

            {/* Showcase Dots */}
            <div className="flex items-center gap-1.5 bg-black/80 border border-white/15 p-1 rounded-full">
              {SHOWCASE_ITEMS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setShowcaseIndex(idx)}
                  aria-label={`Show design ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === showcaseIndex
                      ? 'w-5 bg-[#ED9518]'
                      : 'w-1.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Center Subtle Reticle / Badge */}
          <div className="relative z-20 my-auto flex flex-col items-center pointer-events-none">
            <div className="px-3 py-1 rounded-full bg-black/80 border border-[#ED9518]/40 shadow-lg">
              <span className="font-mono text-[9px] font-bold text-[#ED9518] tracking-widest uppercase">
                {SHOWCASE_ITEMS[showcaseIndex].tag}
              </span>
            </div>
          </div>

          {/* Bottom Info Overlay */}
          <div className="relative z-20 p-4 rounded-xl bg-black/85 border border-white/15 shadow-2xl backdrop-blur-md">
            <h3 className="font-display text-base uppercase font-black text-white tracking-tight flex items-center gap-2">
              <span>{SHOWCASE_ITEMS[showcaseIndex].symbol}</span>
              <span>{SHOWCASE_ITEMS[showcaseIndex].title}</span>
            </h3>
            <p className="font-mono text-[11px] text-[#D8D0C8] mt-1">
              {SHOWCASE_ITEMS[showcaseIndex].specs}
            </p>
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-[#94A3B8]">
              <span>{SHOWCASE_ITEMS[showcaseIndex].highlight}</span>
              <span className="text-[#ED9518] font-bold">✓ Calibrated</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center text-[#F5F1EA] font-mono text-xs">
          Loading Fregoro Studios Gateway…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
