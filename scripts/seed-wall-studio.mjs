import { PrismaClient } from '@prisma/client';
import { FREGORO_LAYOUTS } from '../lib/wall-studio/layouts-data.js';
import { FREGORO_THEMES } from '../lib/wall-studio/themes-data.js';
import { FREGORO_ARTWORKS } from '../lib/wall-studio/artworks-data.js';
import { FREGORO_PREBUILT_WALLS } from '../lib/wall-studio/prebuilt-walls-data.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Fregoro Wall Studio Data...');

  // 1. Seed Wall Themes
  console.log(`Seeding ${FREGORO_THEMES.length} Themes...`);
  for (const theme of FREGORO_THEMES) {
    await prisma.wallTheme.upsert({
      where: { slug: theme.slug },
      update: {
        name: theme.name,
        tagline: theme.tagline,
        description: theme.description,
        accentColor: theme.accentColor,
        gradient: theme.gradient,
        previewImage: theme.previewImage,
        featured: theme.featured ?? false,
        sortOrder: theme.sortOrder ?? 0,
        updatedAt: new Date(),
      },
      create: {
        id: theme.id,
        slug: theme.slug,
        name: theme.name,
        tagline: theme.tagline,
        description: theme.description,
        accentColor: theme.accentColor,
        gradient: theme.gradient,
        previewImage: theme.previewImage,
        featured: theme.featured ?? false,
        sortOrder: theme.sortOrder ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // 2. Seed Wall Layouts & Versions
  console.log(`Seeding ${FREGORO_LAYOUTS.length} Layouts...`);
  for (const layout of FREGORO_LAYOUTS) {
    await prisma.wallLayout.upsert({
      where: { slug: layout.slug },
      update: {
        name: layout.name,
        description: layout.description,
        badge: layout.badge,
        wallWidthMm: layout.wallWidthMm,
        wallHeightMm: layout.wallHeightMm,
        coverageLabel: layout.coverageLabel,
        physicalPrintCount: layout.physicalPrintCount,
        logicalArtworkCount: layout.logicalArtworkCount,
        recommendedRoom: layout.recommendedRoom,
        recommendedWallWidth: layout.recommendedWallWidth,
        recommendedThemes: layout.recommendedThemes,
        basePrice: layout.basePrice,
        compareAtPrice: layout.compareAtPrice,
        slots: layout.slots,
        splitGroups: layout.splitGroups,
        published: layout.published ?? true,
        version: layout.version,
        previewImage: layout.previewImage,
        sortOrder: layout.sortOrder ?? 0,
        updatedAt: new Date(),
      },
      create: {
        id: layout.id,
        slug: layout.slug,
        name: layout.name,
        description: layout.description,
        badge: layout.badge,
        wallWidthMm: layout.wallWidthMm,
        wallHeightMm: layout.wallHeightMm,
        coverageLabel: layout.coverageLabel,
        physicalPrintCount: layout.physicalPrintCount,
        logicalArtworkCount: layout.logicalArtworkCount,
        recommendedRoom: layout.recommendedRoom,
        recommendedWallWidth: layout.recommendedWallWidth,
        recommendedThemes: layout.recommendedThemes,
        basePrice: layout.basePrice,
        compareAtPrice: layout.compareAtPrice,
        slots: layout.slots,
        splitGroups: layout.splitGroups,
        published: layout.published ?? true,
        version: layout.version,
        previewImage: layout.previewImage,
        sortOrder: layout.sortOrder ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Also record layout version snapshot
    await prisma.wallLayoutVersion.upsert({
      where: {
        layoutId_version: {
          layoutId: layout.id,
          version: layout.version,
        },
      },
      update: {
        slots: layout.slots,
        splitGroups: layout.splitGroups,
        wallWidthMm: layout.wallWidthMm,
        wallHeightMm: layout.wallHeightMm,
      },
      create: {
        id: `${layout.id}-v${layout.version}`,
        layoutId: layout.id,
        version: layout.version,
        slots: layout.slots,
        splitGroups: layout.splitGroups,
        wallWidthMm: layout.wallWidthMm,
        wallHeightMm: layout.wallHeightMm,
        createdAt: new Date(),
      },
    });
  }

  // 3. Seed Poster Artworks
  console.log(`Seeding ${FREGORO_ARTWORKS.length} Poster Artworks...`);
  for (const art of FREGORO_ARTWORKS) {
    await prisma.posterArtwork.upsert({
      where: { slug: art.slug },
      update: {
        title: art.title,
        artist: art.artist || 'Fregoro Studio',
        description: art.description,
        themeSlug: art.themeSlug,
        category: art.category,
        subcategory: art.subcategory,
        tags: art.tags,
        orientation: art.orientation,
        availableSizes: art.availableSizes,
        productType: art.productType,
        isSplitCompatible: art.isSplitCompatible,
        heroCompatible: art.heroCompatible,
        supportCompatible: art.supportCompatible,
        dominantColor: art.dominantColor,
        secondaryColor: art.secondaryColor,
        brightness: art.brightness || 'mid',
        mood: art.mood || 'cinematic',
        imageUrl: art.imageUrl,
        thumbnailUrl: art.thumbnailUrl,
        price: art.price,
        status: 'published',
        featured: art.featured ?? false,
        updatedAt: new Date(),
      },
      create: {
        id: art.id,
        slug: art.slug,
        title: art.title,
        artist: art.artist || 'Fregoro Studio',
        description: art.description,
        themeSlug: art.themeSlug,
        category: art.category,
        subcategory: art.subcategory,
        tags: art.tags,
        orientation: art.orientation,
        availableSizes: art.availableSizes,
        productType: art.productType,
        isSplitCompatible: art.isSplitCompatible,
        heroCompatible: art.heroCompatible,
        supportCompatible: art.supportCompatible,
        dominantColor: art.dominantColor,
        secondaryColor: art.secondaryColor,
        brightness: art.brightness || 'mid',
        mood: art.mood || 'cinematic',
        imageUrl: art.imageUrl,
        thumbnailUrl: art.thumbnailUrl,
        price: art.price,
        status: 'published',
        featured: art.featured ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // 4. Seed Prebuilt Wall Products
  console.log(`Seeding ${FREGORO_PREBUILT_WALLS.length} Prebuilt Wall Products...`);
  for (const prebuilt of FREGORO_PREBUILT_WALLS) {
    await prisma.prebuiltWallProduct.upsert({
      where: { slug: prebuilt.slug },
      update: {
        title: prebuilt.title,
        tagline: prebuilt.tagline,
        description: prebuilt.description,
        themeSlug: prebuilt.themeSlug,
        layoutId: prebuilt.layoutId,
        basePrice: prebuilt.basePrice,
        compareAtPrice: prebuilt.compareAtPrice,
        heroImage: prebuilt.heroImage,
        roomPhoto: prebuilt.roomPhoto,
        presetSlots: prebuilt.presetSelections,
        material: prebuilt.material,
        whatsIncluded: prebuilt.whatsIncluded,
        featured: prebuilt.featured ?? false,
        rating: prebuilt.rating ?? 4.9,
        reviewCount: prebuilt.reviewCount ?? 25,
        updatedAt: new Date(),
      },
      create: {
        id: prebuilt.id,
        slug: prebuilt.slug,
        title: prebuilt.title,
        tagline: prebuilt.tagline,
        description: prebuilt.description,
        themeSlug: prebuilt.themeSlug,
        layoutId: prebuilt.layoutId,
        basePrice: prebuilt.basePrice,
        compareAtPrice: prebuilt.compareAtPrice,
        heroImage: prebuilt.heroImage,
        roomPhoto: prebuilt.roomPhoto,
        presetSlots: prebuilt.presetSelections,
        material: prebuilt.material,
        whatsIncluded: prebuilt.whatsIncluded,
        featured: prebuilt.featured ?? false,
        rating: prebuilt.rating ?? 4.9,
        reviewCount: prebuilt.reviewCount ?? 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  console.log('Fregoro Wall Studio database seed complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding Wall Studio:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
