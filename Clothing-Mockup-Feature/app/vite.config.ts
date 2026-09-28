import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// ─────────────────────────────────────────────────────────────────────────────
// Clothing-Mockup-Feature – portable Vite config
//
// Asset roots (relative to THIS file):
//   ../assets/3d-assets/   → served as  /3d-assets/…
//   ../assets/2d-assets/   → served as  /designs/…  /backgrounds/…  /gobo/…
//   ../assets/2d-catalog.json → served as /2d-catalog.json
//
// To mount the app under a sub-path on your host server set the BASE env var:
//   BASE=/tools/clothing-mockup npm run build
// ─────────────────────────────────────────────────────────────────────────────

const ASSETS_ROOT = path.resolve(import.meta.dirname, '../assets');

export default defineConfig(({command}) => ({
  base: command === 'build'
    ? (process.env.BASE ?? '/tools/clothing-mockup/')
    : '/',
  build: {
    outDir: path.resolve(import.meta.dirname, '../../public/tools/clothing-mockup'),
    emptyOutDir: true,
  },
  plugins: [
    react(),
    {
      name: 'serve-mockup-assets',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next();
          const cleanUrl = decodeURIComponent(req.url.split('?')[0]);

          let targetPath: string | null = null;

          if (
            cleanUrl.startsWith('/designs/') ||
            cleanUrl.startsWith('/backgrounds/') ||
            cleanUrl.startsWith('/gobo/')
          ) {
            targetPath = path.resolve(ASSETS_ROOT, '2d-assets', '.' + cleanUrl);
          } else if (cleanUrl.startsWith('/3d-assets/')) {
            const relPath = cleanUrl.replace(/^\/3d-assets\//, '');
            targetPath = path.resolve(ASSETS_ROOT, '3d-assets', relPath);
          } else if (cleanUrl === '/2d-catalog.json') {
            targetPath = path.resolve(ASSETS_ROOT, '2d-catalog.json');
          } else if (cleanUrl.startsWith('/reference/')) {
            targetPath = path.resolve(ASSETS_ROOT, '.' + cleanUrl);
          }

          if (targetPath && fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
            const ext = path.extname(targetPath).toLowerCase();
            const mimeTypes: Record<string, string> = {
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.json': 'application/json',
              '.svg': 'image/svg+xml',
              '.glb': 'model/gltf-binary',
              '.gltf': 'model/gltf+json',
              '.bin': 'application/octet-stream',
              '.hdr': 'image/vnd.radiance',
              '.wasm': 'application/wasm',
            };
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            fs.createReadStream(targetPath).pipe(res);
            return;
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5174,
    fs: {
      allow: ['..'],
    },
  },
}));

