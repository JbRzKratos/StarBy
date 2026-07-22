import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      charcoal: '#0E0E0F',
      bone: '#F5F1EA',
      cobalt: '#3B5EFF',
      graphite: '#1A1A1E',
      smoke: '#2A2A2F',
      ash: '#3A3A40',
      pearl: '#D8D0C8',
      ember: '#C45D3E',
      white: '#ffffff',
      black: '#000000',
    },
    fontFamily: {
      display: ['var(--font-display)', 'serif'],
      mono: ['var(--font-mono)', 'monospace'],
      sans: ['var(--font-display)', 'system-ui', 'sans-serif'],
    },
    spacing: {
      0: '0px',
      px: '1px',
      0.5: '0.125rem',
      1: '0.25rem',
      1.5: '0.375rem',
      2: '0.5rem',
      2.5: '0.625rem',
      3: '0.75rem',
      3.5: '0.875rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      7: '1.75rem',
      8: '2rem',
      9: '2.25rem',
      10: '2.5rem',
      11: '2.75rem',
      12: '3rem',
      14: '3.5rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      28: '7rem',
      32: '8rem',
      36: '9rem',
      40: '10rem',
      44: '11rem',
      48: '12rem',
      52: '13rem',
      56: '14rem',
      60: '15rem',
      64: '16rem',
      72: '18rem',
      80: '20rem',
      96: '24rem',
    },
    borderRadius: {
      none: '0px',
      sm: '0.25rem',
      DEFAULT: '0.5rem',
      md: '0.625rem',
      lg: '1rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
      full: '9999px',
    },
    extend: {
      fontSize: {
        'display-xl': ['5rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
        'display-lg': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'display-md': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.05em' }],
        overline: ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.15em' }],
      },
      transitionDuration: {
        fast: '150ms',
        DEFAULT: '300ms',
        slow: '500ms',
        slower: '800ms',
        slowest: '1200ms',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
        'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      zIndex: {
        behind: '-1',
        base: '0',
        dropdown: '10',
        sticky: '100',
        overlay: '110',
        modal: '120',
        toast: '130',
        cursor: '9999',
      },
      boxShadow: {
        glow: '0 0 20px rgba(59, 94, 255, 0.15)',
        'glow-lg': '0 0 40px rgba(59, 94, 255, 0.25)',
        elevated: '0 8px 32px rgba(0, 0, 0, 0.4)',
        'elevated-lg': '0 16px 64px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        grain: "url('/textures/grain.svg')",
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
    screens: {
      xs: '375px', // Mobile M
      sm: '425px', // Mobile L
      md: '768px', // Tablet
      lg: '1024px', // Desktop
      xl: '1440px', // Large Desktop
    },
  },
  plugins: [],
};

export default config;
