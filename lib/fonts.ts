import localFont from 'next/font/local';

/**
 * Display font — Clash Display (bold editorial grotesk).
 * Variable font: weight range 200–700.
 */
export const fontDisplay = localFont({
  src: '../public/fonts/ClashDisplay-Variable.woff2',
  variable: '--font-display',
  display: 'swap',
  weight: '200 700',
  fallback: ['Georgia', 'serif'],
});

/**
 * Mono/accent font — JetBrains Mono (technical monospace).
 * Individual weight files since variable woff2 wasn't available.
 */
export const fontMono = localFont({
  src: [
    { path: '../public/fonts/JetBrainsMono-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/JetBrainsMono-Medium.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
  fallback: ['Courier New', 'monospace'],
});
