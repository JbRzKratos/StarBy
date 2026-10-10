import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const categories = await p.product.groupBy({
    by: ['categorySlug'],
    _count: { id: true }
  });
  console.log('--- DB Categories ---');
  for (const c of categories) {
    console.log(`${c.categorySlug}: ${c._count.id} products`);
  }

  const featured = await p.product.findMany({
    where: { featured: true },
    select: { id: true, name: true, categorySlug: true, basePrice: true, variants: { take: 1, select: { images: true } } },
    take: 25,
  });
  console.log('\n--- DB Featured products (total sample of 25) ---');
  for (const f of featured) {
    console.log(`[${f.categorySlug}] ${f.id} - ${f.name} (₹${f.basePrice}) img: ${f.variants[0]?.images[0] || 'NONE'}`);
  }

  // Check split-posters
  const splitPosters = await p.product.findMany({
    where: { categorySlug: 'split-posters' },
    include: { variants: true },
  });
  console.log('\n--- Split Posters Count:', splitPosters.length);
  for (const sp of splitPosters) {
    console.log(`[${sp.id}] ${sp.name} - variants: ${sp.variants.length}`);
    for (const v of sp.variants) {
      console.log(`   var ${v.id}: ${v.name} -> images:`, v.images);
    }
  }

  // Check posters sample
  const postersSample = await p.product.findMany({
    where: { categorySlug: 'posters' },
    take: 5,
    include: { variants: true },
  });
  console.log('\n--- Posters Sample (5) ---');
  for (const pos of postersSample) {
    console.log(`[${pos.id}] ${pos.name} (featured: ${pos.featured}) -> img:`, pos.variants[0]?.images);
  }
}

main().finally(() => p.$disconnect());
