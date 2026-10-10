import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return { status: res.status, ok: res.ok };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

async function main() {
  console.log('--- Testing Split Posters URLs ---');
  const splitPosters = await p.product.findMany({
    where: { categorySlug: 'split-posters' },
    include: { variants: true }
  });
  for (const prod of splitPosters) {
    for (const v of prod.variants) {
      for (const img of v.images) {
        const res = await checkUrl(img);
        console.log(`[${res.status}] ${prod.name} -> ${img}`);
      }
    }
  }

  console.log('\n--- Testing Wall Studio URLs ---');
  const wallStudio = await p.product.findMany({
    where: { categorySlug: 'wall-studio' },
    include: { variants: true }
  });
  console.log(`Found ${wallStudio.length} wall-studio products in DB`);
  for (const prod of wallStudio.slice(0, 10)) {
    for (const v of prod.variants) {
      for (const img of v.images) {
        console.log(`Wall Studio img: ${img}`);
      }
    }
  }

  console.log('\n--- Testing Posters Sample URLs ---');
  const posters = await p.product.findMany({
    where: { categorySlug: 'posters', featured: true },
    include: { variants: true },
    take: 5
  });
  for (const prod of posters) {
    const img = prod.variants[0]?.images[0];
    const res = await checkUrl(img);
    console.log(`[${res.status}] Poster ${prod.name} -> ${img}`);
  }
}

main().finally(() => p.$disconnect());
