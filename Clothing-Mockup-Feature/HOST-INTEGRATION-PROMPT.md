# HOST-INTEGRATION-PROMPT.md

## Prompt for your host website's AI agent

Copy the block below and paste it as the first message when you ask your
host-project AI agent to integrate this feature.

---

```
I have a self-contained clothing mockup feature package in the folder
`Clothing-Mockup-Feature/` (located at the same level as this project's root).

## What the feature is

A full 2D + 3D garment mockup editor built with React 19, TypeScript, Three.js,
and Vite. It lets users:
- Upload artwork and preview it on t-shirts, hoodies, sweatpants, and 8 other
  garments in an interactive 3D scene with animated walk cycles.
- Use the 2D canvas editor to apply artwork to flat garment mockups with fabric
  warping, studio lighting, and high-res export.

## What I want you to do

1. **Read** `Clothing-Mockup-Feature/INTEGRATION.md` for the full integration
   options and asset mapping table.

2. **Choose integration option A (iframe) or B (React component)**:
   - Use **Option A** if this project is not a React project, or if you want
     the mockup to be visually isolated.
   - Use **Option B** if this project is a React + Vite project and you want
     the mockup to feel native.

3. **Do not rename or restructure** `Clothing-Mockup-Feature/` itself.
   Do not import from the source files inside it unless using Option B.

4. **Asset hosting rules:**
   The `Clothing-Mockup-Feature/assets/` folder contains ~400 MB of 3D models
   and textures. You must serve them at the correct URL prefixes:
   - `/3d-assets/` → `assets/3d-assets/`
   - `/designs/`, `/backgrounds/`, `/gobo/` → `assets/2d-assets/<folder>/`
   - `/2d-catalog.json` → `assets/2d-catalog.json`

   For Option B, add the Vite middleware from
   `Clothing-Mockup-Feature/app/vite.config.ts` to this project's
   `vite.config.ts`. For Option A, copy `app/dist/` and the asset folders
   to your `public/` folder at the correct sub-path.

5. **Sub-path builds:** If embedding at a sub-path (e.g. `/studio/mockup/`),
   build the feature with:
   ```bash
   cd Clothing-Mockup-Feature/app
   npm install
   BASE=/studio/mockup/ npm run build
   ```

6. **Do not** modify any files inside `Clothing-Mockup-Feature/` unless I
   explicitly ask you to upgrade or fix the feature.

7. After integration, verify:
   - The mockup loads without 404 errors for GLB models and textures.
   - The 2D editor shows garment thumbnails and backgrounds.
   - The 3D studio renders a garment with a sample design.
   - Exporting a PNG works.

Implement the integration now.
```
