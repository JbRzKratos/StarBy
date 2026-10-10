import fs from 'fs';

const files = [
  'lib/wall-studio/prebuilt-walls-data.ts',
  'lib/wall-studio/themes-data.ts',
  'components/wall-studio/wall-summary-bar.tsx',
  'components/product/split-poster-visualizer/split-poster-visualizer.desktop.tsx',
  'components/product/split-poster-visualizer/split-poster-visualizer.mobile.tsx',
];

const R2_POSTERS_BASE = 'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters';

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let content = fs.readFileSync(f, 'utf8');
  const initial = content;

  // Replace /Posters/filename with R2 URL
  content = content.replace(/\/Posters\/([^'"\s]+)/g, (match, filename) => {
    return `${R2_POSTERS_BASE}/${encodeURIComponent(decodeURIComponent(filename))}`;
  });

  if (content !== initial) {
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Updated ${f} to use R2 CDN URLs`);
  }
}
