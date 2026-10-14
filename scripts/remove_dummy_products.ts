import { prisma } from '../lib/prisma';

async function main() {
  const dummySlugs = [
    'void-tee',
    'eclipse-tee',
    'solar-tee',
    'lunar-tee',
    'nova-tee',
    'zenith-tee',
    'orbit-hoodie',
    'pulse-hoodie',
    'core-hoodie',
    'vanguard-hoodie',
    'oasis-hoodie',
    'echo-hoodie',
    'titan-hoodie',
    'apex-hoodie'
  ];

  const dummyIds = [
    'prod_001', 'prod_002', 'prod_003', 'prod_004', 'prod_005', 'prod_006',
    'prod_007', 'prod_008', 'prod_009', 'prod_010', 'prod_011', 'prod_012',
    'prod_test_tees'
  ];

  console.log('Finding dummy products in DB...');
  const found = await prisma.product.findMany({
    where: {
      OR: [
        { id: { in: dummyIds } },
        { slug: { in: dummySlugs } }
      ]
    },
    include: { variants: true }
  });

  console.log(`Found ${found.length} dummy products in DB.`);

  for (const p of found) {
    console.log(`Deleting product ${p.id} (${p.slug}) - ${p.name}`);
    await prisma.productVariant.deleteMany({
      where: { productId: p.id }
    });
    await prisma.product.delete({
      where: { id: p.id }
    });
  }

  console.log('Dummy products successfully deleted from database.');
}

main().catch(console.error).finally(() => process.exit(0));
