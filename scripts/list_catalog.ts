import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const categories = await prisma.category.findMany();
  console.log('=== CATEGORIES ===');
  categories.forEach((c) => console.log(` - ${c.slug} (${c.name})`));

  const products = await prisma.product.findMany({
    include: { variants: true },
  });
  console.log('\n=== PRODUCTS ===');
  products.forEach((p) => {
    const varPrices = p.variants.map((v) => `${v.name}: ₹${v.price}`).join('; ');
    console.log(
      ` - [${p.categorySlug}] ${p.id} | "${p.name}" | basePrice: ₹${p.basePrice} | variants: [${varPrices}]`
    );
  });
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
