# Performance Audit — StarBy / Fregoro Studios

**Date:** 2026-10-20
**Scope:** Full Next.js 14 app (storefront, product pages, shop, wall studio, magazine, 3D studio), `next.config.mjs`, global layout/CSS, GSAP/ScrollTrigger, images, CDN/R2.
**Method:** Static code audit + HTTP HEAD measurements of live R2 assets. No browser traces were run in this pass (see §8 for the exact F12 procedure and expected numbers).

> **✅ Status: fixes implemented (2026-10-20).** This document is the original baseline audit.
> Implemented in the follow-up pass:
> - `images.unoptimized` removed; AVIF/WebP + `deviceSizes`/`imageSizes` + long CDN cache enabled.
> - Hero image now goes through `/_next/image` with art-direction `srcset` and a page-scoped preload (245 KB WebP → 34.7 KB AVIF at 640 px).
> - Unused duplicate hero components deleted; one responsive hero.
> - `ShopClient` and `NavigationClient` keep only the active device tree after hydration; offer banner merged into one responsive component.
> - Testimonial marquee pauses when off-screen; permanent `will-change` removed.
> - Large `blur-[100–140px]` orbs replaced with radial gradients; hot-path `transition-all` narrowed.
> - Custom cursor: single `pointermove` listener, no animated `box-shadow`, disabled on admin/editor/studio routes.
> - Magazine landing + templates page + API now use a lightweight catalogue (no 860 KB template tree).
> - Wall artwork catalogue lazy-loaded when the picker opens, plus 48-item pagination.
> - Design manifest resolved server-side on product pages and imported on demand from product cards.
> - Supabase auth SDK skipped when no auth cookie exists.
> - Price API/browser caching (`max-age=60`, `s-maxage=60`); `force-dynamic` removed from `/wall-studio`.
> - Unused components, legacy generator scripts, and scratch files removed.
> - Verified: `typecheck`, `lint`, production `build`, and a live `/_next/image` AVIF request.

---

## 1. Executive summary

| Area | Status | Verdict |
|---|---|---|
| Image optimization | 🔴 Critical | `images.unoptimized: true` globally. No resize, no AVIF/WebP conversion, no `srcset`. Every `sizes` prop in the codebase is dead. |
| Desktop image sizes | 🔴 Critical | Desktop downloads full-resolution originals (JPG/WebP up to ~600 KB) for 250–350 px cards and 80 px thumbnails. |
| Stuttering / animations | 🟠 High | Infinite marquee never paused, huge `blur-[100–140px]` layers, many `backdrop-blur` chips, `transition-all`, custom cursor with duplicate pointer listeners and animated `box-shadow`. |
| Client JS weight | 🟠 High | 860 KB magazine catalog + 409 KB wall artwork data + 192 KB design manifest shipped to browser; Supabase client + auth call on every page. |
| Desktop/mobile duplication | 🟠 High | Both device variants are mounted and hydrated (`HeroClient`, `ShopClient`), doubling DOM/render work. |
| Server/network | 🟡 Medium | Global hero preload on *every* route, `force-dynamic` on wall studio, `no-store` price fetches, `getUser()` on every navigation. |
| What's already good | 🟢 | Self-hosted WOFF2 fonts with `display: swap`, ISR `revalidate = 60`, immutable R2 cache headers, lazy modals, `optimizePackageImports`, reduced-motion CSS/GSAP. |

**Bottom line:** the symptoms are not a CDN-region problem. They are caused by (a) an image pipeline that is intentionally turned off, (b) over-mounted client components, and (c) a few expensive effect layers. Fixing image delivery alone should remove the majority of the "downloads are huge / stuttering while scrolling" complaints.

---

## 2. Images (root cause #1)

### 2.1 The optimizer is completely disabled

`next.config.mjs:26-31`

```js
images: {
  unoptimized: true, // <-- global kill switch
  remotePatterns: [...]
}
```

Consequences:

- No `/ _next/image` resizing, no `srcset`, no AVIF/WebP negotiation.
- `sizes="(max-width: 640px) 100vw, 33vw"` (used in ~20 components) has **no effect**.
- `<Image>` behaves like a plain `<img>`; `fill` only sets CSS.
- AVIF is never produced anywhere in the app.

### 2.2 R2 does **not** optimize on the fly

The code comment says "R2 already delivers optimised WebP/AVIF assets". HEAD checks show that is only partly true: files that were uploaded as WebP are WebP, but nothing is resized or transcoded, and some catalog files are still JPEG.

| Asset | Served type | Size |
|---|---|---|
| `images/hero-three-models.webp` | image/webp | **245.8 KB** |
| `images/hero-three-models-mobile.webp` | image/webp | 58.7 KB |
| `plain-tees/...Black_01_Model-Front.jpg` | **image/jpeg** | **276.0 KB** |
| `plain-tees/...Hoodie...Model-Front.jpg` | **image/jpeg** | **306.2 KB** |
| `posters/...caf_3.webp` | image/webp | **312.0 KB** |
| `posters/...dbf49..._2.webp` | image/webp | 136.7 KB |
| `images/hero/posters.webp` | image/webp | 88.7 KB |
| `templates/canva/fashion-1/thumbnail.webp` | image/webp | 62.6 KB |
| `images/products/phantom-skin.webp` | image/webp | 103.6 KB |
| `images/products/chronicle-diary.webp` | image/webp | 83.8 KB |
| `images/products/classic_mug_11oz.webp` | image/webp | 22.3 KB |
| Typical product poster (product page) | image/webp | **~500–650 KB** |

The base URL is `https://pub-….r2.dev` — the R2 **dev endpoint**, not a custom domain with Cloudflare Image Resizing/Polish. There are no `?width=` / `/cdn-cgi/image/` transforms anywhere in the code (verified by grep).

Also: HEAD responses returned no `cf-cache-status`, so do not assume an edge cache tier is in front of these objects. Verify in DevTools → Network (see §8).

### 2.3 Desktop massively over-downloads

- Product grid cards are ~250–350 px wide but receive the full original (300–650 KB) file. On `/products/all` with 16 visible cards this is roughly **5–9 MB of images** on desktop.
- `components/product/image-gallery.tsx:90-97` renders 80×80 px thumbnails using the **same full-size URL** as the hero image; a 3-variant poster load can pull ~1.9 MB just for thumbnails.
- Homepage first paint: desktop hero (246 KB) **plus** the mobile hero (59 KB) **plus** two `priority` bento tiles (276 KB + 306 KB, and those tiles are below the fold). ~**890 KB before the user scrolls**, then ~3–4 MB as they scroll through bento + featured posters.
- Because the optimizer is off, there is no `srcset` fallback; even a 2× DPR phone gets desktop-sized files.

### 2.4 Hero is duplicated and preloaded everywhere

- `components/home/hero/hero.client.tsx` renders **both** `HeroDesktop` and `HeroMobile`; CSS hides one. Both `<img>` elements are `loading="eager"`, so **both hero files download on every device** (304 KB total instead of 246 KB desktop / 59 KB mobile).
- `app/layout.tsx:104-115` preloads `hero-three-models.webp` (246 KB) inside the **root layout**, so every route — product, cart, checkout, account, magazine — preloads the homepage hero and competes with that page's real LCP asset.
- `components/home/bento-grid.tsx:205` sets `priority={i < 2}` on bento tiles that sit well below the fold. They preload ahead of the featured product images the user is about to see.

### 2.5 Other image issues

- 29 raw `<img>` tags remain (wall studio, magazine, bulk orders, customizer, hero). Several lack `width`/`height` → CLS.
- `public/` is **2.96 GB** on disk (881 MB tracked in git): `3d models` 590 MB (8 textures at **64 MB each**), `Single Posters` 647 MB, `t_shirt_designs` 420 MB, `designs` 352 MB, `3d-assets` 247 MB, `templates` 211 MB. Several of these are also proxied to R2 via `rewrites`, so the local copies are likely redundant. This bloats deploys and any accidental direct request is catastrophic. No runtime reference to the `uvmap_*`/`fbx_*` textures was found in app code.

### 2.6 Recommended image architecture

**Option A — re-enable the Next.js optimizer (fastest, lowest code churn)**

```js
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [360, 480, 640, 828, 1080, 1200, 1600, 1920],
  imageSizes: [64, 80, 128, 160, 256, 384],
  minimumCacheTTL: 31536000,
  remotePatterns: [/* existing */],
}
```

Then remove `unoptimized` from every `<Image>` (25 files) and drop the global flag. Vercel transforms and edge-caches the result. Cost: Vercel Image Optimization usage — monitor the first month.

**Option B — keep R2 and optimize at the edge (recommended long-term, no Vercel proxy)**

1. Put a Cloudflare custom domain in front of the bucket (not `r2.dev`).
2. Enable Cloudflare Image Resizing, then use a custom `next/image` loader:
   ```ts
   const loader = ({ src, width, quality }) =>
     `${R2_BASE}/cdn-cgi/image/width=${width},quality=${quality ?? 78},format=auto/${src}`;
   ```
3. Remove `unoptimized`; keep `sizes` (they finally matter).
4. Alternatively pre-generate `_400`, `_800`, `_1600` variants at upload time and build `srcset` manually.

**Quick wins regardless of option:** limit the hero preload to `/`, render only one hero variant, move `priority` off bento tiles, stop using the main image for thumbnails (request a 160 px variant), and add `width`/`height` to raw `<img>` tags.

---

## 3. Stuttering & animation cost (root cause #2)

### 3.1 Infinite marquee never pauses — `components/home/testimonials.tsx:36-42`

`gsap.to(track, { xPercent: -50, repeat: -1, duration: 40 })` runs forever, on a track containing **2× the testimonial cards** with permanent `[will-change:transform]` (`line 82`). It keeps compositing even when the section is far off-screen. This is the most likely source of continuous scroll jank / battery drain on mid-tier laptops. Fix: pause with `IntersectionObserver` / `ScrollTrigger onToggle`, and drop `will-change` when idle.

### 3.2 Huge `filter: blur()` layers

| File | Effect |
|---|---|
| `components/home/featured-products.tsx:327` | `w-96 h-96 blur-[100px]` orb |
| `components/bulk-orders/bulk-order-hero.tsx:25-26` | `600×600 blur-[140px]` + `350×350 blur-[100px]` |
| `components/shop/category-coming-soon-page.tsx:622` | `600×350 blur-[120px]` |
| `app/(shop)/magazine/page.tsx:68` | `700×350 blur-[140px]` |

Large blur filters force expensive rasterization and repaint on scroll. Replace with a CSS `radial-gradient()` background (visually near-identical, no filter) or a pre-rendered PNG.

### 3.3 `backdrop-blur` density

`backdrop-blur-md/lg/xl/2xl` appears in 100+ places. On the homepage alone, each of the 9 bento tiles carries **two** backdrop-blur chips (`bento-tile.tsx:104,110`), plus nav, drawer overlays and scroll-progress bar. Each one creates a composited layer that must be re-blurred whenever anything moves underneath. At minimum: remove blur from small static badges (use `bg-black/70`), keep it only for full-screen overlays.

### 3.4 Custom cursor — `components/layout/custom-cursor.tsx`

- **Duplicate listeners:** `window` **and** `document` both register `pointermove` (`lines 465-466`), so every movement calls `onPointerMove` twice.
- **Animated `box-shadow`:** `app/globals.css:97,127` transition `box-shadow` (paint-heavy, not compositor-friendly). Animate only `transform`/`opacity` and switch glow via a pre-shadowed pseudo-element.
- **Mounted on every route** from the root layout — including `/admin`, `/magazine/editor`, `/checkout`, where it is hidden via CSS but listeners, portal and RAF machinery still exist.
- `onMouseOver` runs `target.closest(INTERACTIVE_SELECTOR)` (a very long selector, `line 280`) on hover changes.
- Idle pause is implemented well — keep it.

### 3.5 GSAP / ScrollTrigger

- `featured-products.tsx:192-209` and `bento-grid.tsx:34-51` recreate `ScrollTrigger.batch` on every tab change (`dependencies: [activeTab]`). With `once: true` this is acceptable but causes a refresh + layout read on each tab switch; consider `ScrollTrigger.refresh()` or pre-creating triggers once.
- `product-detail-client.tsx:181-192` and `image-gallery.tsx:18-28` animate whole subtrees with `stagger` on mount; fine, but they also animate `opacity` + `transform` on elements containing large images, forcing extra composite layers during first paint.
- `gsap-config.ts` registers ScrollTrigger + Flip and `transpilePackages: ['gsap']`; Flip is only used by wall studio — split it into a lazily loaded module.
- Reduced-motion handling is correct (good).

### 3.6 `transition-all` sprawl (300+ occurrences)

`transition-all` on cards/images (e.g. `bento-tile.tsx:81,92`) transitions layout-affecting properties. On hover this can trigger layout/paint instead of compositing. Standardize on `transition-[transform,opacity]` / `transition-colors`.

### 3.7 Miscellaneous

- `html, body { overflow-x: hidden; max-width: 100vw }` (`globals.css:14-27`) — `100vw` includes the scrollbar and the dual overflow containers can cause layout thrash; prefer `overflow-x: clip`.
- `.nav-scrolled` with `backdrop-filter` (`globals.css:308-312`) is **dead code** — no component uses the class. The nav instead uses `shadow-2xl` on scroll (`navigation.desktop.tsx:53-56`).
- `animate-[spin_18s_linear_infinite]` SVG stamp (`hero.desktop.tsx:21`) and several `animate-pulse` dots keep running continuously.

---

## 4. Client JavaScript weight

| Import | Size | Shipped to |
|---|---|---|
| `data/magazineTemplates/index.ts` | **860 KB** source | `/magazine` (client page, line 6) and `/magazine/editor` (`components/magazine/editor/index.tsx:16`) |
| `lib/wall-studio/artworks-data.ts` | **409 KB** (369 artworks) | Wall Studio via `poster-picker-drawer.tsx:5` |
| `lib/wall-studio/layouts-data.ts` | 96.5 KB | Wall Studio store |
| `lib/clothing-designs/design-manifest.json` | **192 KB** | Product pages via `manifest.ts:1` (`getDesignById`) |
| Supabase browser client | ~2.6 MB dev chunk | Every page via `navigation.desktop.tsx:61` dynamic import |

Notes:

- Magazine templates include **full page/element JSON**, not just metadata. Move catalog parsing server-side or split into a lightweight `{id,name,coverImage,category}` index.
- The wall-studio picker renders **all 369 artwork cards** with no virtualization/windowing when the drawer opens (`poster-picker-drawer.tsx:332`). `loading="lazy"` helps network but not DOM/JS. Paginate or virtualize (e.g. 40 at a time).
- `getDesignById` only needs one entry — build a server-side lookup or a small ID→design map instead of bundling the whole manifest.
- `navigation.desktop.tsx:61-68` runs `supabase.auth.getUser()` on **every page load** (an extra network round-trip) even for anonymous visitors. Gate it on a cookie/session hint, or move user display to a server component.
- Root layout mounts `CustomCursor`, `FloatingActions`, `TawkToWidget`, `TopProgressBar`, `GsapProvider` on every route. Tawk is already deferred (3.5 s / first interaction) — keep that. Consider route-gating the cursor and floating actions.

---

## 5. Desktop/mobile component duplication

`components/shop/shop.client.tsx` and `components/home/hero/hero.client.tsx` render **both** variants and hide one with `hidden md:block` / `block md:hidden`.

- React still renders, hydrates and keeps state for both trees.
- Both `ShopDesktop`/`ShopMobile` run filtering, `useMemo`, `useSearchParams`, and their own hooks.
- Hero images are `eager`, so **both files are fetched** (confirmed issue above).
- Shop card images are `lazy`; browsers usually defer the hidden tree's images, but DOM size, memory, hydration and React work are still doubled, and some browsers/conditions will fetch them.

Fix: choose one variant (`useDevice()` exists but is client-only; use a CSS-only card layout or a server-read device cookie already set by `middleware.ts`). At minimum, make the hidden hero image `loading="lazy"`/`fetchPriority="low"`.

---

## 6. Server, caching & network

- `app/layout.tsx:104-115` — global hero preload (see §2.4). Move to `app/page.tsx`.
- `app/(shop)/wall-studio/page.tsx:5` — `export const dynamic = 'force-dynamic'` on a fully client-rendered page. This prevents any static shell caching and adds server work on every visit. Remove; the page is already `'use client'` downstream.
- `wall-studio-editor.tsx:43` and `split-poster-visualizer.desktop.tsx:51` fetch `/api/products/prices` with `{ cache: 'no-store' }` on every mount. Serve with `s-maxage=60` or pass prices from a server component.
- `middleware.ts` — good: matcher excludes assets and only calls `getUser()` on `/account`, `/admin`, `/checkout`. Device cookie logic is cheap. Keep.
- ISR `revalidate = 60` is present on home, category and product pages (good), but the in-memory product cache (`products-service.ts`) is per-instance and only 60 s — fine for now, just know it does not dedupe across lambdas.
- `next.config.mjs` sets immutable cache headers for `/_next/static`, fonts, `3d-assets`, `designs/backgrounds/gobo`, `plain-mockups`, and the mockup tool — correct.
- Fonts: self-hosted WOFF2, `display: swap`, only 3 files (good).

---

## 7. Prioritized action plan

### P0 — this week (biggest, lowest-risk impact)

1. **Turn image optimization back on.**
   - Either remove `images.unoptimized` + per-component `unoptimized` props and add `formats: ['image/avif','image/webp']`, or add a Cloudflare Image Resizing loader (§2.6).
   - Expected: 60–85 % reduction in image bytes; grid cards drop from ~300–600 KB to ~20–50 KB.
2. **Stop the global hero preload** and remove `priority` from bento tiles.
3. **Render one hero, not two** (or at least lazy-load the hidden one).
4. **Use 160 px variants for gallery thumbnails** (`image-gallery.tsx`).
5. **Pause the testimonials marquee off-screen** and remove permanent `will-change`.

### P1 — next sprint

6. Replace `blur-[100–140px]` orbs with `radial-gradient` backgrounds.
7. Remove `backdrop-blur` from small static badges (start with the 9 bento tiles).
8. Reduce custom-cursor cost: remove the duplicate `document` pointer listener, stop transitioning `box-shadow`, don't mount it on `/admin` and editor routes.
9. Code-split data: magazine template catalog (860 KB), wall artwork data (409 KB), design manifest (192 KB).
10. Virtualize/paginate the 369-item wall artwork grid.

### P2 — cleanup / hardening

11. Remove the desktop/mobile double mount in `ShopClient` (use one responsive tree).
12. Remove `force-dynamic` from wall studio; cache the price endpoints.
13. Replace `transition-all` with transform/opacity transitions.
14. Audit `public/` — 881 MB is tracked; `3d models` (590 MB) and `t_shirt_designs` (420 MB) appear unused by app code. Deleting or moving them to R2 cuts deploy size and risk.
15. Fix CLS: add `width`/`height` to remaining raw `<img>` tags.
16. Delete dead `.nav-scrolled` CSS or use it as the intended compositor-friendly nav style.

---

## 8. How to measure and confirm (F12)

**Image payload**

1. DevTools → **Network** → filter **Img** → disable cache → hard reload.
2. Sort by **Size**. Expect current results: hero 246 KB, cards 130–650 KB, product thumbnails identical to main image. After P0, card sizes should be 20–60 KB and you should see `image/avif` or `image/webp` with `srcset`.
3. Check **Type** column for `image/jpeg` — those are unoptimized catalog uploads.
4. Open an image request → **Headers** → confirm `cache-control: public, max-age=31536000, immutable` and note whether `cf-cache-status` is present. If absent, the r2.dev endpoint is not edge-caching — this is exactly why changing the Vercel region would not help.

**Stutter**

1. DevTools → **Performance** → CPU throttle **4×** → record 8–10 s of scrolling the homepage.
2. Look for long **Recalculate Style / Layout / Paint** blocks around bento and testimonials; check **Layers** for many large composited layers (backdrop-blur + blur orbs).
3. While idle, confirm the marquee still shows continuous **Composite Layers** activity when the testimonials section is off-screen (it should not).
4. Move the mouse on desktop with **Rendering → Paint flashing** and **Frame rendering stats** enabled: the custom cursor should not cause full-page paints.

**Budgets to target**

| Metric | Target |
|---|---|
| Homepage image bytes (above fold) | < 250 KB desktop / < 120 KB mobile |
| Any single image request | < 150 KB |
| Category page LCP | < 2.0 s on Slow 4G |
| CLS | < 0.05 |
| Long tasks during scroll | none > 50 ms |
| Idle composite activity | 0 when nothing animates |

**Do not change the Vercel region yet** — the CDN region is not the bottleneck; the issues above are reproducible from the asset URLs and bundle contents alone.
