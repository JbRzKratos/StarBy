import { prisma } from '../lib/prisma';
import { getClothingDesignProducts } from '../lib/clothing-designs/clothing-products';

export async function syncClothingDesignsToDb() {
  console.log('--- Syncing 96 Clothing Designs to PostgreSQL Database ---');

  const clothingProducts = getClothingDesignProducts();
  console.log(`Found ${clothingProducts.length} clothing design products to sync.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const prod of clothingProducts) {
    const existing = await prisma.product.findUnique({
      where: { id: prod.id },
      include: { variants: true },
    });

    if (!existing) {
      // Create product
      await prisma.product.create({
        data: {
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
          variants: {
            create: prod.variants.map((v) => ({
              id: v.id,
              name: v.name,
              color: v.color,
              colorHex: v.colorHex,
              price: v.price,
              images: v.images,
              inStock: v.inStock,
              stockQuantity: 100,
            })),
          },
        },
      });
      createdCount++;
    } else {
      // Update metadata while preserving any admin-customized name or price
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          categorySlug: prod.categorySlug,
          tags: prod.tags,
          sizes: prod.sizes || [],
          customizable: prod.customizable,
        },
      });

      // Ensure variants exist
      for (const v of prod.variants) {
        const varExists = existing.variants.some((ev) => ev.id === v.id);
        if (!varExists) {
          await prisma.productVariant.create({
            data: {
              id: v.id,
              productId: prod.id,
              name: v.name,
              color: v.color,
              colorHex: v.colorHex,
              price: existing.basePrice || v.price,
              images: v.images,
              inStock: v.inStock,
              stockQuantity: 100,
            },
          });
        }
      }
      updatedCount++;
    }
  }

  console.log(`✓ Sync finished: ${createdCount} created, ${updatedCount} verified/updated.`);
}

if (require.main === module) {
  syncClothingDesignsToDb()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
