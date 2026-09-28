# Clothing-Mockup-Feature

A self-contained, drop-in clothing mockup editor with both a **2D canvas editor** and a **3D interactive garment studio**.

## Contents

```
Clothing-Mockup-Feature/
├── app/                     ← React + Vite application
│   ├── src/                 ← Full TypeScript source code
│   │   ├── components/      ← UI components (2D + 3D drawers, panels)
│   │   ├── engine/          ← Compositor, model loader, texture engine
│   │   ├── types/           ← TypeScript type definitions
│   │   └── data/            ← 2D garment catalog
│   ├── public/              ← Static app assets (favicon, icon sprite)
│   ├── vite.config.ts       ← Portable Vite config (reads from ../assets/)
│   └── package.json
└── assets/
    ├── 3d-assets/
    │   ├── GLB/             ← 11 garment GLB models + product thumbnails
    │   ├── environment.hdr  ← Studio HDRI lighting
    │   └── *_diffuse/normal/roughness.jpg  ← PBR texture sets
    └── 2d-assets/
        ├── designs/         ← Sample artwork designs
        ├── backgrounds/     ← Studio background images
        └── gobo/            ← Lighting gobo textures
```

## Quick Start (standalone)

```bash
cd Clothing-Mockup-Feature/app
npm install
npm run dev
# Opens at http://localhost:5174
```

## Building for production

```bash
cd Clothing-Mockup-Feature/app
npm install
npm run build
# Output: app/dist/
```

To build for a sub-path (e.g. `/tools/clothing-mockup/`):

```bash
BASE=/tools/clothing-mockup/ npm run build
```

Then serve `app/dist/` from that path on your web server, with
`assets/3d-assets/` and `assets/2d-assets/` accessible at `/3d-assets/` and
`/designs/` etc. at the same origin. See `INTEGRATION.md` for full details.

## Features

### 2D Mockup Editor
- Upload artwork PNG/JPG, position on front or back
- 10+ garment templates with garment color picker
- Fabric warp/displacement for realistic drape
- Studio lighting with animated gobos
- Export at 1×, 2×, 4× resolution with transparent background

### 3D Garment Studio
- 11 animated garment models (t-shirts, hoodies, sweatpants, etc.)
- Surface-projected UV texture painting
- Full UV atlas editor with panel selection
- HDR environment lighting, turntable camera
- Animated walk cycle with secondary cloth physics
- Export PNG/JPEG renders

## Tech Stack

- React 19 + TypeScript
- Three.js 0.186 (3D engine)
- Vite 8 (build tool)
- Zero external CSS frameworks

## License

Proprietary. Included with project delivery.
