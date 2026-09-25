import { FREGORO_ARTWORKS } from '../lib/wall-studio/artworks-data';

console.log('Checking all', FREGORO_ARTWORKS.length, 'artwork URLs...');

async function checkUrls() {
  const deadUrls: Array<{ id: string; title: string; url: string }> = [];

  for (const a of FREGORO_ARTWORKS) {
    try {
      const res = await fetch(a.thumbnailUrl || a.imageUrl, { method: 'HEAD' });
      if (!res.ok) {
        deadUrls.push({ id: a.id, title: a.title, url: a.thumbnailUrl || a.imageUrl });
      }
    } catch {
      deadUrls.push({ id: a.id, title: a.title, url: a.thumbnailUrl || a.imageUrl });
    }
  }

  if (deadUrls.length > 0) {
    console.log('Dead URLs found:', deadUrls.length);
    deadUrls.forEach((d) => console.log(` - [${d.id}] "${d.title}": ${d.url}`));
  } else {
    console.log('All artwork URLs are working 100%!');
  }
}

checkUrls();
