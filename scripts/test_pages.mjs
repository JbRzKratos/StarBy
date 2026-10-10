async function testPage(url) {
  try {
    const res = await fetch(url);
    console.log(`\n=== Testing ${url} (Status: ${res.status}) ===`);
    const html = await res.text();
    const imgMatches = [...html.matchAll(/<img[^>]+src="([^">]+)"/g)].map(m => decodeURIComponent(m[1]));
    console.log(`Total images on page: ${imgMatches.length}`);
    const r2Imgs = imgMatches.filter(s => s.includes('r2.dev') || s.includes('single-posters') || s.includes('posters'));
    console.log(`R2/poster images count: ${r2Imgs.length}`);
    if (r2Imgs.length > 0) {
      console.log('Sample R2 images:', r2Imgs.slice(0, 3));
    }
    const brokenLocalImgs = imgMatches.filter(s => s.startsWith('/Posters/'));
    if (brokenLocalImgs.length > 0) {
      console.warn(`WARNING: Found ${brokenLocalImgs.length} local /Posters/ images on page!`, brokenLocalImgs.slice(0, 3));
    }
  } catch (e) {
    console.error(`Error testing ${url}:`, e.message);
  }
}

async function main() {
  await testPage('http://localhost:3000/');
  await testPage('http://localhost:3000/products/posters');
  await testPage('http://localhost:3000/products/split-posters');
  await testPage('http://localhost:3000/wall-studio');
  await testPage('http://localhost:3000/admin/products');
}

main();
