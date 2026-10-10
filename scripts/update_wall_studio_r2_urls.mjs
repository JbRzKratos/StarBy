import fs from 'fs';

const R2_PREFIX = 'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/';

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const countBefore = (content.match(/\/Posters\//g) || []).length;
  
  // Replace /Posters/<filename> with R2 URL, encoding spaces if present
  content = content.replace(/\/Posters\/([^"'\s]+)/g, (match, filename) => {
    return `${R2_PREFIX}${filename}`;
  });
  
  // Also handle any filenames with spaces like /Posters/3 Split Poster.webp
  content = content.replace(/\/Posters\/([^"']+)/g, (match, filename) => {
    const encoded = filename.split('/').map(seg => encodeURIComponent(seg)).join('/');
    return `${R2_PREFIX}${encoded}`;
  });

  const countAfter = (content.match(/\/Posters\//g) || []).length;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}: replaced ${countBefore - countAfter} occurrences (remaining: ${countAfter})`);
}

updateFile('lib/wall-studio/artworks-data.ts');
updateFile('lib/wall-studio/design-placements.ts');
