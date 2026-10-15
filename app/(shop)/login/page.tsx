'use client';

import { useState, useEffect, Suspense, useRef, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
    tag: 'Drop 2026 // Archive 01',
    title: 'Boxy Heavyweight Hoodie',
    specs: '300+ GSM French Terry Cotton',
    target: 'Front Center // 3D Verified',
    cut: 'Brushed Fleece • Double-Lined Hood',
    symbol: '👕',
  },
  {
    image: '/images/hero/tees.png',
    tag: 'Drop 2026 // Vintage Wash 02',
    title: 'Industrial Washed Tee',
    specs: '240 GSM Heavy Combed Cotton',
    target: 'Oversized Drape // High-Density Print',
    cut: 'Pre-Shrunk • Drop Shoulder Silhouette',
    symbol: '🎽',
  },
  {
    image:
      '/Plain_Tees_mockups/Hoodie-Brushed-Fleece-300GSM/Black/Plain_Hoodie-Brushed-Fleece-300GSM_Black_01_Model-Front.jpg',
    tag: 'Studio Spec // Model Fit 03',
    title: 'Engineered Streetwear Cut',
    specs: 'Reinforced Ribbing & Double Stitching',
    target: '360° Inspection // Studio Verified',
    cut: 'Signature Boxy Fit • Worldwide Delivery',
    symbol: '🏷️',
  },
];

function LoginContent() {
  const router = useRouter();
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

  // Modal & Lockout State (Open by default for instant, zero-friction UX)
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showcaseIndex, setShowcaseIndex] = useState(0);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Auto-rotate showcase streetwear items (lightweight interval)
  useEffect(() => {
    if (!isModalOpen) return;
    const interval = setInterval(() => {
      setShowcaseIndex((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isModalOpen]);

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
      setIsModalOpen(true);
      if (emailParam) {
        setEmail(emailParam);
      }
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 400);
    }
  }, [isVerifiedParam, emailParam]);

  // Escape key listener to minimize modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

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

      // Success: Play seamless unlock sequence
      setIsUnlocking(true);
      setIsModalOpen(false);

      let dest = rawRedirectTo;
      if (!dest) {
        dest = isSuperAdminEmail(data?.session?.user?.email || email) ? '/admin' : '/';
      }

      // 600ms transition into crisp studio clarity before routing
      setTimeout(() => {
        window.location.href = dest;
      }, 600);
    } catch (err) {
      console.error('[Login] Unexpected error:', err);
      setAuthError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#0A0A0C] text-[#F5F1EA] font-sans selection:bg-[#ED9518] selection:text-[#0A0A0C] overflow-hidden flex flex-col justify-between">
      {/* ── 1. HARDWARE-ACCELERATED BACKGROUND: ZERO-LAG STUDIO LOCKOUT VIEW ── */}
      <div
        className={`fixed inset-0 pointer-events-none select-none transition-all duration-700 ease-out z-0 ${
          isUnlocking
            ? 'opacity-100 scale-100 filter-none'
            : 'opacity-40 scale-[1.02] filter blur-[6px] brightness-[0.25]'
        }`}
        style={{
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform, opacity, filter',
        }}
        aria-hidden="true"
      >
        {/* Subtle Cyber Grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Studio Spotlight Orbs (GPU composited) */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#ED9518]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Mock Minimal Studio Header */}
        <header className="w-full border-b border-white/10 bg-[#0E0E10]/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#ED9518] flex items-center justify-center font-bold text-black text-xs">
              ✦
            </div>
            <span className="font-mono text-xs tracking-widest font-black uppercase text-white">
              StarBy Studios
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#94A3B8]">
            <span>360° Studio Mode</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </header>

        {/* Mock Center Ambient Visuals */}
        <div className="max-w-4xl mx-auto px-6 pt-20 flex flex-col items-center text-center">
          <span className="font-mono text-xs text-[#ED9518] uppercase tracking-[0.25em] mb-4">
            High-Density Garment Compositor // WebGL
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white/90">
            Engineered Streetwear &amp; 3D Apparel Studio
          </h1>
        </div>
      </div>

      {/* ── 2. TOP SECURITY TELEMETRY BAR ── */}
      <div className="relative z-20 w-full px-4 sm:px-8 pt-4 pb-2 flex items-center justify-between shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[#F5F1EA] hover:text-[#ED9518] transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#161618] border border-white/15 flex items-center justify-center font-bold text-xs text-[#ED9518] group-hover:border-[#ED9518]/50 transition-all shadow-sm">
            ✦
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-xs font-black tracking-widest uppercase">
              StarBy Studios
            </span>
            <span className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase">
              Gateway v2.6
            </span>
          </div>
        </Link>

        {/* Security Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161618]/90 border border-white/10 shadow-md">
          <span className="text-xs">🔒</span>
          <span className="font-mono text-[10px] text-[#D8D0C8] uppercase tracking-wider font-semibold">
            Member Gateway
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* ── 3. MAIN INTERACTIVE LOGIN PORTAL (OPTIMIZED FOR MOBILE & DESKTOP) ── */}
      <main className="relative z-30 flex-1 flex items-center justify-center p-3 sm:p-6 w-full">
        {/* The Card Modal Container */}
        <div
          className={`relative max-w-4xl w-full rounded-2xl overflow-hidden bg-[#141416] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col md:flex-row transition-all duration-300 ease-out max-h-[92dvh] ${
            isModalOpen
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none hidden'
          }`}
          style={{
            willChange: 'transform, opacity',
            contain: 'paint',
          }}
        >
          {/* ── Left Column: Form Section ── */}
          <div className="flex-1 p-6 sm:p-9 flex flex-col justify-between overflow-y-auto custom-scrollbar bg-[#141416]">
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#ED9518]/10 border border-[#ED9518]/30 text-[#ED9518] font-mono text-[10px] font-bold uppercase tracking-widest">
                  <span>✦ Member Access</span>
                </div>

                {/* Mobile Apparel Peek Pill */}
                <div className="md:hidden flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/70">
                  <span>{SHOWCASE_ITEMS[showcaseIndex].symbol}</span>
                  <span className="truncate max-w-[120px]">{SHOWCASE_ITEMS[showcaseIndex].title}</span>
                </div>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#F5F1EA]">
                Welcome Back
              </h2>
              <p className="font-mono text-xs text-[#94A3B8] mt-1 mb-5 leading-relaxed">
                Sign in to customize garments in 360° Studio, view past orders, and save your placements.
              </p>

              {/* Verified Email Banner Notice */}
              {isVerifiedParam && (
                <div className="mb-5 p-3 rounded-lg bg-[#10b981]/15 border border-[#10b981]/40 text-[#10b981] font-mono text-xs flex items-start gap-2.5">
                  <span className="text-sm shrink-0">✦</span>
                  <div>
                    <strong className="block font-bold uppercase tracking-wider text-[11px]">
                      Email Verified Successfully!
                    </strong>
                    <span className="text-[#F5F1EA]/85 text-[11px] leading-snug">
                      Your account is active. Log in below to proceed directly into your studio account.
                    </span>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {authError && (
                <div className="mb-5 p-3 rounded-lg bg-[#C45D3E]/15 border border-[#C45D3E]/40 text-[#C45D3E] font-mono text-xs flex items-start gap-2">
                  <span className="text-sm shrink-0">⚠️</span>
                  <span className="text-[11px] leading-snug">{authError}</span>
                </div>
              )}

              {/* The Form */}
              <form onSubmit={handleLogin} className="flex flex-col gap-3.5" noValidate>
                {/* Email Input */}
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

                {/* Password Input */}
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
                      className="font-mono text-[11px] text-[#94A3B8] hover:text-[#ED9518] flex items-center gap-1 transition-colors"
                      tabIndex={-1}
                    >
                      <span>{showPassword ? '👁‍🗨' : '👁'}</span>
                      <span className="text-[10px] uppercase font-bold">{showPassword ? 'Hide' : 'Show'}</span>
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

                {/* Remember & Forgot Row */}
                <div className="flex items-center justify-between text-xs font-mono pt-0.5">
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

                {/* Primary Unlock & Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 rounded-xl bg-[#ED9518] hover:bg-[#ffaa2b] text-black font-mono text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#ED9518]/25 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                      <span>⚡</span>
                      <span>Unlock &amp; Sign In</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Footer Row with Sign Up & Guest Explore */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#94A3B8]">
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
                <span>Browse as Guest</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* ── Right Column: 3D Studio Showcase (Desktop Verified) ── */}
          <div className="hidden md:flex md:w-[46%] relative bg-[#0D0D0F] overflow-hidden border-l border-white/10 select-none flex-col justify-between p-6">
            {/* Background Apparel Image Transitions */}
            {SHOWCASE_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-700 ease-out ${
                  idx === showcaseIndex
                    ? 'opacity-80 scale-100 z-10'
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-black/40 to-black/60" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#141416] via-transparent to-transparent" />
              </div>
            ))}

            {/* Subtle Scanning Laser Line */}
            <div
              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ED9518] to-transparent z-20 pointer-events-none opacity-60 shadow-[0_0_10px_#ED9518]"
              style={{
                animation: 'studioScanline 4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              }}
            />

            {/* Top Telemetry Tag */}
            <div className="relative z-20 flex items-center justify-between">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/75 border border-white/10 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/90 font-bold flex items-center gap-1">
                  <span>↺</span>
                  <span>3D Studio Online</span>
                </span>
              </div>

              {/* Slider Pills */}
              <div className="flex items-center gap-1.5 bg-black/75 border border-white/10 p-1 rounded-full">
                {SHOWCASE_ITEMS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setShowcaseIndex(idx)}
                    aria-label={`Show cut ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === showcaseIndex ? 'w-5 bg-[#ED9518]' : 'w-1.5 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Center HUD Reticle */}
            <div className="relative z-20 my-auto flex flex-col items-center pointer-events-none">
              <div className="relative w-28 h-28 border border-white/20 rounded-lg flex items-center justify-center">
                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#ED9518]" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#ED9518]" />
                <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#ED9518]" />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#ED9518]" />

                <div
                  className="w-16 h-16 rounded-full border border-dashed border-[#ED9518]/60 flex items-center justify-center"
                  style={{ animation: 'spin 16s linear infinite' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ED9518] animate-ping" />
                </div>
              </div>

              <div className="mt-2 px-2.5 py-0.5 rounded bg-black/80 border border-[#ED9518]/30">
                <span className="font-mono text-[9px] font-bold text-[#ED9518] tracking-widest uppercase">
                  {SHOWCASE_ITEMS[showcaseIndex].target}
                </span>
              </div>
            </div>

            {/* Bottom Apparel Info Card */}
            <div className="relative z-20 p-3.5 rounded-xl bg-black/85 border border-white/15 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-[#ED9518] uppercase tracking-[0.2em]">
                  {SHOWCASE_ITEMS[showcaseIndex].tag}
                </span>
                <span className="font-mono text-[9px] text-[#94A3B8]">
                  0{showcaseIndex + 1} / 0{SHOWCASE_ITEMS.length}
                </span>
              </div>
              <h3 className="font-display text-base uppercase font-black text-white tracking-tight mt-1 flex items-center gap-1.5">
                <span>{SHOWCASE_ITEMS[showcaseIndex].symbol}</span>
                <span>{SHOWCASE_ITEMS[showcaseIndex].title}</span>
              </h3>
              <p className="font-mono text-[11px] text-[#D8D0C8] mt-0.5">
                {SHOWCASE_ITEMS[showcaseIndex].specs}
              </p>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-[#94A3B8]">
                <span>{SHOWCASE_ITEMS[showcaseIndex].cut}</span>
                <span className="text-[#ED9518] font-bold">✓ Calibrated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsed Dock Prompt (If minimized) */}
        {!isModalOpen && !isUnlocking && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-6 z-40 group flex items-center gap-3 px-6 py-3 rounded-full bg-[#ED9518] text-black font-mono text-xs font-bold uppercase tracking-widest hover:bg-[#ffaa2b] transition-all shadow-[0_10px_30px_rgba(237,149,24,0.35)] active:scale-95"
          >
            <span>🔒</span>
            <span>Tap to Open Sign In Gateway</span>
            <span>→</span>
          </button>
        )}
      </main>

      {/* ── 4. FOOTER NOTE ── */}
      <footer className="relative z-20 w-full px-6 py-3 text-center border-t border-white/5 bg-[#0A0A0C]/90 text-[10px] font-mono text-[#94A3B8]/60 uppercase tracking-widest shrink-0">
        StarBy &bull; Studio Calibrated 360° Customizer &bull; All Rights Reserved
      </footer>

      {/* Lightweight Keyframe for Scanline */}
      <style>{`
        @keyframes studioScanline {
          0% { top: 6%; opacity: 0; }
          15% { opacity: 0.8; }
          85% { opacity: 0.8; }
          100% { top: 94%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center text-[#F5F1EA] font-mono text-xs">
          Loading StarBy Studios Gateway…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
