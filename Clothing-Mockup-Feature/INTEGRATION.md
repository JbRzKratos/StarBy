# INTEGRATION.md – Embedding Clothing-Mockup-Feature into an existing project

## Overview

This feature is a complete, self-contained React/Vite app. You have two
integration options:

| Option | Best for | Description |
|--------|----------|-------------|
| **A – iframe embed** | Any host stack | Mount the built `dist/` at a URL and embed in an `<iframe>` |
| **B – React component embed** | React host | Import the `<App />` component directly into your React tree |

---

## Option A – iframe embed (recommended for non-React hosts)

### 1. Build the package

```bash
cd Clothing-Mockup-Feature/app
npm install

# Replace /tools/mockup/ with whatever path you will serve it on
BASE=/tools/mockup/ npm run build
```

### 2. Copy build output and assets to your server

```
your-project/
  public/
    tools/
      mockup/            ← copy contents of app/dist/ here
    3d-assets/           ← copy contents of assets/3d-assets/ here
    designs/             ← copy contents of assets/2d-assets/designs/ here
    backgrounds/         ← copy contents of assets/2d-assets/backgrounds/ here
    gobo/                ← copy contents of assets/2d-assets/gobo/ here
    2d-catalog.json      ← copy assets/2d-catalog.json here
```

> **Important:** The 3D assets are large (≈ 400 MB of GLB + textures).
> Serve them behind a CDN for best performance.

### 3. Embed the iframe

```html
<iframe
  src="/tools/mockup/"
  width="100%"
  height="800"
  style="border:none; border-radius:12px;"
  allow="fullscreen"
  title="Clothing Mockup Studio"
></iframe>
```

---

## Option B – React component embed

### 1. Copy the source tree into your project

```
your-project/src/
  features/
    clothing-mockup/     ← copy contents of Clothing-Mockup-Feature/app/src/ here
```

### 2. Install peer dependencies

Add to your `package.json`:

```json
{
  "dependencies": {
    "three": "^0.186.1",
    "jszip": "^3.10.2",
    "lucide-react": "^1.48.0"
  },
  "devDependencies": {
    "@types/three": "^0.186.0",
    "@types/jszip": "^3.4.0"
  }
}
```

```bash
npm install
```

### 3. Serve the assets

Configure your Vite / webpack / Next.js server to serve:

| URL prefix       | Folder                                |
|------------------|---------------------------------------|
| `/3d-assets/`    | `Clothing-Mockup-Feature/assets/3d-assets/` |
| `/designs/`      | `Clothing-Mockup-Feature/assets/2d-assets/designs/` |
| `/backgrounds/`  | `Clothing-Mockup-Feature/assets/2d-assets/backgrounds/` |
| `/gobo/`         | `Clothing-Mockup-Feature/assets/2d-assets/gobo/` |
| `/2d-catalog.json` | `Clothing-Mockup-Feature/assets/2d-catalog.json` |

For Vite, copy the middleware block from
`Clothing-Mockup-Feature/app/vite.config.ts` into your own `vite.config.ts`.

### 4. Mount the component

```tsx
// your-project/src/pages/MockupPage.tsx
import { App as ClothingMockup } from '@/features/clothing-mockup/App';
import '@/features/clothing-mockup/index.css';

export default function MockupPage() {
  return (
    <div className="mockup-host">
      <ClothingMockup />
    </div>
  );
}
```

> **CSS isolation note:** The feature uses a global `index.css`. If your host
> project has conflicting resets or global styles, wrap the component in a
> scoped container and review `index.css` for any rules that bleed outside
> `.studio-root` (the root class used throughout the feature).

---

## Removing the feature

To remove the feature cleanly:

1. Delete the iframe `<src>` route and the `dist/` folder from your server.  
2. Or, for Option B, delete `src/features/clothing-mockup/` and remove the
   peer dependencies from `package.json`.
3. Remove any asset folders you copied (`/3d-assets/`, `/designs/`, etc.).
4. Remove the Vite middleware block from `vite.config.ts`.

No database migrations, global state mutations, or service workers are
introduced. Removal is fully reversible.

---

## Sub-path routing

The app uses `import.meta.env.BASE_URL` (injected by Vite) for all internal
asset references. Always set `BASE` when building for a sub-path:

```bash
BASE=/tools/mockup/ npm run build
```

Never hardcode the base URL in source files; the Vite `base` option handles it.

---

## Browser support

Requires WebGL 2. Works in all modern browsers (Chrome 90+, Firefox 90+,
Safari 15+, Edge 90+). Mobile is supported but performance depends on GPU.
