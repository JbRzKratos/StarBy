import { PrismaClient } from '@prisma/client';
import { categories } from '../data/categories';
import { products } from '../data/products';
import { deviceModels } from '../data/devices';
import { templates } from '../data/customizationTemplates';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Categories
  console.log('Seeding categories...');
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        tagline: cat.tagline,
        productCount: cat.productCount,
        featured: cat.featured,
        gradient: cat.gradient,
        image: cat.image || null,
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        tagline: cat.tagline,
        productCount: cat.productCount,
        featured: cat.featured,
        gradient: cat.gradient,
        image: cat.image || null,
      },
    });
  }

  // 2. Seed Products & Variants
  console.log('Seeding products & variants...');
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        categorySlug: p.categorySlug,
        basePrice: p.basePrice,
        customizable: p.customizable,
        tags: p.tags,
        featured: p.featured,
        sizes: p.sizes || [],
      },
      create: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        categorySlug: p.categorySlug,
        basePrice: p.basePrice,
        customizable: p.customizable,
        tags: p.tags,
        featured: p.featured,
        sizes: p.sizes || [],
      },
    });

    for (const v of p.variants) {
      await prisma.productVariant.upsert({
        where: { id: v.id },
        update: {
          name: v.name,
          color: v.color,
          colorHex: v.colorHex,
          price: v.price,
          images: v.images,
          inStock: v.inStock,
        },
        create: {
          id: v.id,
          productId: p.id,
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

  // 3. Seed Device Templates
  console.log('Seeding device skin templates...');
  for (const d of deviceModels) {
    await prisma.deviceSkinTemplate.upsert({
      where: { id: d.id },
      update: {
        name: d.name,
        brand: d.brand,
        type: d.type,
        aspectRatio: d.aspectRatio,
        borderRadius: d.borderRadius,
        cameraModule: d.cameraModule ? (d.cameraModule as any) : undefined,
        logoCutout: d.logoCutout ? (d.logoCutout as any) : undefined,
        sPenSilo: d.sPenSilo || false,
        confidence: d.confidence,
        notes: d.notes || null,
      },
      create: {
        id: d.id,
        name: d.name,
        brand: d.brand,
        type: d.type,
        aspectRatio: d.aspectRatio,
        borderRadius: d.borderRadius,
        cameraModule: d.cameraModule ? (d.cameraModule as any) : undefined,
        logoCutout: d.logoCutout ? (d.logoCutout as any) : undefined,
        sPenSilo: d.sPenSilo || false,
        confidence: d.confidence,
        notes: d.notes || null,
      },
    });
  }

  // 4. Seed Customization Templates
  console.log('Seeding customization templates...');
  for (const t of Object.values(templates)) {
    await prisma.customizationTemplate.upsert({
      where: { productId: t.productId },
      update: {
        mockupImage: t.mockupImage,
        printArea: t.printArea as any,
        blendMode: t.blendMode || 'source-over',
      },
      create: {
        productId: t.productId,
        mockupImage: t.mockupImage,
        printArea: t.printArea as any,
        blendMode: t.blendMode || 'source-over',
      },
    });
  }

  console.log('✅ Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
