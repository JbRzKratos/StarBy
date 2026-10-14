/**
 * PostCSS config for the Clothing-Mockup-Feature Vite app.
 *
 * The studio CSS is 100% vanilla CSS — no @tailwind directives are used.
 * This local config intentionally excludes tailwindcss to prevent Vite
 * from picking up the root-level postcss.config.mjs (which includes Tailwind
 * for the Next.js host), which produces a confusing "content option missing"
 * warning during `npm run build`.
 *
 * Vite's esbuild handles vendor prefix injection natively, so no
 * additional PostCSS plugins are required here.
 */

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {},
};

export default config;

