# Performance Findings — Quick Summary

> Companion file to the full audit: [`PERFORMANCE_AUDIT.md`](./PERFORMANCE_AUDIT.md)
> Date: 2026-10-20 · Project: StarBy / Fregoro Studios (Next.js 14)

> **✅ Status: fixes implemented (2026-10-20).**
> The findings below are kept as the baseline audit. Current state:
> Next.js image optimization re-enabled (AVIF/WebP, responsive `srcset`); hero preload scoped to `/`; dead hero variants removed; single navigation/offer bar after hydration; shop desktop/mobile collapse to one tree after hydration; testimonial marquee pauses off-screen; large blur orbs replaced with gradients; cursor double-listener + shadow transitions removed; magazine catalogue split (landing/API no longer ship 860 KB); wall artwork data lazy-loaded and paginated; design manifest resolved on the server; Supabase skipped for signed-out visitors; price API cached for 60 s; `force-dynamic` removed from wall studio; unused components/scripts removed.
> Verified with `npm run typecheck`, `npm run lint`, `npm run build`, and a production `/_next/image` request (hero 245 KB → 34.7 KB AVIF at 640 px).

---

## 1. Images are not optimized at all (biggest issue)

`next.config.mjs:26-31` sets `images: { unoptimized: true }` globally.

Consequences:

- No resizing, no `srcset`, no AVIF/WebP conversion.
- Every `sizes="..."` prop in ~20 components is dead code.
- Desktop receives full-resolution originals for 250–350 px cards.

Measured live R2 assets:

| Asset | Type | Size |
|---|---|---|
| Hero desktop | WebP | 245.8 KB |
| Category tee card | **JPEG** | 276 KB |
| Hoodie card | **JPEG** | 306 KB |
| Poster card | WebP | 312–624 KB |
| Product gallery poster | WebP | ~500–650 KB |

R2 (`pub-….r2.dev`) is storage only — it does not transcode or resize. The comment claiming
"R2 already delivers optimised WebP/AVIF" is inaccurate: some assets are still JPEG and
nothing is resized.

---

## 2. Desktop over-downloads badly

- 80×80 gallery thumbnails reuse the full-size image URL (`image-gallery.tsx:90-97`).
- `/products/all` with 16 cards ≈ 5–9 MB of images.
- Homepage above-fold ≈ 890 KB before scrolling (`hero` + 2 below-fold `priority` bento tiles).
- `app/layout.tsx:104-115` preloads the **homepage hero on every route**, including product,
  checkout and account pages.

---

## 3. Both mobile and desktop variants are mounted

`hero.client.tsx` and `shop.client.tsx` render both trees and hide one with CSS.
Hero images are `eager`, so both hero files download (304 KB instead of 246/59 KB).
Shop pages double their DOM, state and hydration work.

---

## 4. Stuttering causes

- **Infinite marquee** (`testimonials.tsx:36-42`) never pauses off-screen, with permanent
  `will-change`.
- **Huge blur filters**: `blur-[100px]` to `blur-[140px]` orbs in featured products,
  bulk-orders hero, coming-soon page, magazine.
- **backdrop-blur density**: 9 bento tiles × 2 blurred chips, plus nav and overlays.
- **Custom cursor**: duplicate `pointermove` listeners on `window` + `document`, and animated
  `box-shadow` (paint-heavy). Mounted on every route.
- 300+ `transition-all` usages; `.nav-scrolled` optimized class is dead code.

---

## 5. Client JS bloat

| Import | Size | Where |
|---|---|---|
| `data/magazineTemplates/index.ts` | **860 KB** | `/magazine` and editor |
| `artworks-data.ts` | **409 KB** (369 items) | Wall Studio |
| `design-manifest.json` | **192 KB** | Every product page |
| Supabase client + `getUser()` | network call on **every page** | `navigation.desktop.tsx:61` |

The wall studio renders all 369 artwork cards without virtualization.

---

## 6. Server notes

- `force-dynamic` on wall studio (already a client page).
- Two pages fetch `/api/products/prices` with `cache: 'no-store'` on every load.
- `public/` is 2.96 GB on disk / 881 MB tracked in git, including 590 MB of `3d models`
  textures (8 × 64 MB each) with no runtime references found.

---

## Recommended order

### P0 — this week

1. Re-enable Next image optimization (`formats: ['image/avif','image/webp']`) **or** use a
   Cloudflare Image Resizing loader on a custom R2 domain.
2. Remove the global hero preload; move it to `/` only.
3. Render one hero, not two.
4. Use 160 px variants for gallery thumbnails.
5. Pause the testimonial marquee off-screen.

### P1 — next sprint

6. Replace blur orbs with radial gradients.
7. Trim backdrop-blur badges.
8. Fix cursor listeners and stop animating `box-shadow`.
9. Code-split the three large data modules.
10. Paginate/virtualize the 369-item artwork grid.

### P2 — cleanup

11. Remove desktop/mobile double mount.
12. Drop `force-dynamic`; cache price endpoints.
13. Replace `transition-all` with transform/opacity.
14. Clean `public/` unused assets.
15. Fix image dimensions for CLS.
16. Delete dead `.nav-scrolled` CSS or use it.

---

## Measurement checklist (F12)

**Image payload**

1. DevTools → **Network** → filter **Img** → disable cache → hard reload.
2. Sort by **Size**. Current: hero 246 KB, cards 130–650 KB, thumbnails identical to main image.
   After P0: cards 20–60 KB, `image/avif`/`image/webp`, `srcset` present.
3. Check **Type** for `image/jpeg` — unoptimized catalog uploads.
4. Open an image → **Headers**; note `cf-cache-status`. If absent, r2.dev is not edge-caching —
   another reason a Vercel region change would not help.

**Stutter**

1. **Performance** → CPU throttle **4×** → record 8–10 s of scrolling the homepage.
2. Look for long **Recalculate Style / Layout / Paint** blocks around bento and testimonials;
   check **Layers** for many large composited layers.
3. Idle: confirm the marquee still shows **Composite Layers** activity when off-screen (it should not).
4. Enable **Paint flashing** + **Frame rendering stats**; moving the mouse should not repaint the page.

**Targets**

| Metric | Target |
|---|---|
| Homepage image bytes (above fold) | < 250 KB desktop / < 120 KB mobile |
| Any single image request | < 150 KB |
| Category page LCP | < 2.0 s on Slow 4G |
| CLS | < 0.05 |
| Long tasks during scroll | none > 50 ms |
| Idle composite activity | 0 when nothing animates |

**Do not change the Vercel region yet** — the CDN region is not the bottleneck; the issues above
are reproducible from the asset URLs and bundle contents alone.
