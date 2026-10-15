import { prisma } from '../lib/prisma';
import { plainApparelProducts } from '../data/plain-apparel-products';

async function main() {
  console.log('--- Syncing Plain Apparel Products to PostgreSQL Database ---');

  for (const prod of plainApparelProducts) {
    console.log(`Upserting product: ${prod.name} (${prod.id})...`);
    await prisma.product.upsert({
      where: { id: prod.id },
      create: {
        id: prod.id,
        slug: prod.slug,
        name: prod.name,
        tagline: prod.tagline,
        description: prod.description,
        categorySlug: prod.categorySlug,
        basePrice: prod.basePrice,
        customizable: prod.customizable,
        featured: prod.featured,
        tags: prod.tags,
        sizes: prod.sizes || [],
      },
      update: {
        slug: prod.slug,
        name: prod.name,
        tagline: prod.tagline,
        description: prod.description,
        categorySlug: prod.categorySlug,
        basePrice: prod.basePrice,
        customizable: prod.customizable,
        featured: prod.featured,
        tags: prod.tags,
        sizes: prod.sizes || [],
      },
    });

    for (const v of prod.variants) {
      await prisma.productVariant.upsert({
        where: { id: v.id },
        create: {
          id: v.id,
          productId: prod.id,
          name: v.name,
          color: v.color,
          colorHex: v.colorHex,
          price: v.price,
          images: v.images,
          inStock: v.inStock,
          stockQuantity: 100,
        },
        update: {
          productId: prod.id,
          name: v.name,
          color: v.color,
          colorHex: v.colorHex,
          price: v.price,
          images: v.images,
          inStock: v.inStock,
        },
      });
    }
  }

  console.log('✅ Successfully synced all plain apparel products and variants to PostgreSQL!');

  // Verify in DB
  const synced = await prisma.product.findMany({
    where: { id: { in: plainApparelProducts.map((p) => p.id) } },
    include: { variants: true },
  });
  console.log(`Verified ${synced.length} plain apparel products in DB:`);
  for (const p of synced) {
    console.log(` - ${p.name} [${p.categorySlug}]: ${p.variants.length} color variants, ${p.variants[0]?.images?.length || 0} images per variant`);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
