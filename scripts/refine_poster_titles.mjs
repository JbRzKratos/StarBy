import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const posters = await prisma.product.findMany({
    where: { categorySlug: 'posters' },
    select: { id: true, name: true, tags: true },
  });

  console.log(`Analyzing ${posters.length} posters for title polish...`);

  const updates = [];

  for (const p of posters) {
    let name = p.name;
    const orig = name;

    // Clean up Midjourney Editor patterns
    if (name.toLowerCase().includes('midjourney editor')) {
      const tagTheme = p.tags[1] || 'Art';
      name = `${tagTheme.toUpperCase()}: Collector Masterpiece Edition`;
    }

    // Clean up random hashes or weird Midjourney prompt relics
    if (name.match(/^[0-9a-z]{1,4}\s+[a-z]{3,6}\s+highly/i) || name.includes('Highly Detailed Vertic')) {
      name = 'Spider-Man — Cybernetic Web Slinger';
    }

    // Clean up truncated endings or awkward words
    name = name
      .replace(/\bGive a Sh T\b/gi, 'Full Throttle Champion')
      .replace(/\bCinematic Won\b/gi, 'Wonder Woman — Amazonian Champion')
      .replace(/\bFull Body Por\b/gi, 'Classic Character Silhouette')
      .replace(/\bDiana Prince Wonder Woman —\b/gi, 'Wonder Woman —')
      .replace(/\bWonder Woman Wonder Woman —\b/gi, 'Wonder Woman —')
      .replace(/\bBatman Batman —\b/gi, 'Batman —')
      .replace(/\bSpider-Man Spider-Man —\b/gi, 'Spider-Man —')
      .replace(/\bIron Man Iron Man —\b/gi, 'Iron Man —')
      .replace(/\bSuperman Superman —\b/gi, 'Superman —')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (name !== orig) {
      updates.push({ id: p.id, from: orig, to: name });
    }
  }

  console.log(`Found ${updates.length} titles to refine:`);
  for (const u of updates) {
    console.log(`  - [${u.id}] "${u.from}" -> "${u.to}"`);
    await prisma.product.update({
      where: { id: u.id },
      data: { name: u.to },
    });
  }

  console.log('Done refining titles!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
