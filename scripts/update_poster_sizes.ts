import { prisma } from '../lib/prisma';

const NEW_POSTER_SIZES = [
  'A6 (4.1" x 5.8")',
  'A5 (5.8" x 8.3")',
  'A4 (8.3" x 11.7")',
  'A3 (11.7" x 16.5")',
  '13" x 19" (Studio)',
];

async function main() {
  console.log('Updating poster sizes in database...');
  const result = await prisma.product.updateMany({
    where: {
      categorySlug: 'posters',
    },
    data: {
      sizes: NEW_POSTER_SIZES,
    },
  });
  console.log(`Successfully updated ${result.count} poster products to:`, NEW_POSTER_SIZES);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
