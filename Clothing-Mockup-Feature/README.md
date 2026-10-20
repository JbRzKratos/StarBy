# Clothing-Mockup-Feature

A self-contained, drop-in **3D interactive garment studio**.

## Contents

```
Clothing-Mockup-Feature/
��� app/                     ��� React + Vite application
�   ��� src/                 ��� Full TypeScript source code
�   ���   ��� components/      ��� UI components (3D drawers, panels)
�   ���   ��� engine/          ��� Model loader, texture compositor, placement engine
�   ���   ��� types/           ��� TypeScript type definitions
�   ���   ��� data/            ��� Curated design catalogue
�   ��� public/              ��� Static app assets (favicon, icon sprite)
�   ��� vite.config.ts       ��� Portable Vite config (reads from ../assets/)
�   ��� package.json
��� assets/
    ��� 3d-assets/
        ��� GLB/             ��� 11 garment GLB models + product thumbnails
        ��� environment.hdr  ��� Studio HDRI lighting
        ��� *_diffuse/normal/roughness.jpg  ��� PBR texture sets
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
`assets/3d-assets/` accessible at `/3d-assets/` at the same origin.
See `INTEGRATION.md` for full details.

## Features

### 3D Garment Studio
- 11 animated garment models (t-shirts, hoodies, sweatpants, etc.)
- Surface-projected UV texture painting
- Full UV atlas editor with panel selection
- HDR environment lighting, turntable camera
- Animated walk cycle with secondary cloth physics
- Artist-calibrated placements saved per design + garment
- Export PNG/JPEG renders

## Tech Stack

- React 19 + TypeScript
- Three.js 0.186 (3D engine)
- Vite 8 (build tool)
- Zero external CSS frameworks

## License

Proprietary. Included with project delivery.
