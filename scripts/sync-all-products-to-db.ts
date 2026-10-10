import { prisma } from '../lib/prisma';
import { categories as catalogCategories } from '../data/categories';
import { products as catalogProducts } from '../data/products';
import { FREGORO_LAYOUTS } from '../lib/wall-studio/layouts-data';
import { FREGORO_PREBUILT_WALLS as PREBUILT_WALLS } from '../lib/wall-studio/prebuilt-walls-data';
import { syncSinglePostersToDatabase } from './sync_single_posters';

export async function syncAllProductsToDatabase() {
  console.log('🚀 [syncAllProductsToDatabase] Starting full catalog sync...');

  // 1. ─── Ensure All Categories Exist ───
  const extendedCategories = [
    ...catalogCategories,
    {
      slug: 'wall-studio',
      name: 'Wall Studio',
      tagline: 'Architectural gallery & multi-panel wall setups.',
      description:
        'Precision museum wall art setups, hybrid stepped combos, and multi-panel split galleries.',
      productCount: FREGORO_LAYOUTS.length + PREBUILT_WALLS.length,
      featured: true,
      gradient: 'linear-gradient(135deg, #0A0B0E 0%, #1E293B 50%, #3B82F6 100%)',
    },
    {
      slug: 'split-posters',
      name: 'Split Posters',
      tagline: 'One image. Many panels.',
      description:
        'Multi-panel split wall art: 3-Stepped, 5-Stepped, Classic Horizontals & Grids.',
      productCount: 12,
      featured: true,
      gradient: 'linear-gradient(135deg, #0E0E0F 0%, #C45D3E 100%)',
    },
  ];

  for (const cat of extendedCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        tagline: cat.tagline,
        featured: cat.featured,
        gradient: cat.gradient,
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        tagline: cat.tagline,
        productCount: cat.productCount || 0,
        featured: cat.featured,
        gradient: cat.gradient,
      },
    });
  }
  console.log(`✅ Synced categories in DB.`);

  // 2. ─── Sync All Catalog Products (Tees, Hoodies, Skins, Posters, Diaries, Mugs, Magazines) ───
  let syncedCatalogCount = 0;
  for (const p of catalogProducts) {
    // Check if product already exists to preserve any custom price changes made by the admin
    const existing = await prisma.product.findUnique({
      where: { id: p.id },
      include: { variants: true },
    });

    if (existing) {
      // Update metadata while preserving existing basePrice if it was already customized
      await prisma.product.update({
        where: { id: p.id },
        data: {
          slug: p.slug,
          name: p.name,
          tagline: p.tagline,
          description: p.description,
          categorySlug: p.categorySlug,
          customizable: p.customizable,
          featured: p.featured,
          tags: p.tags,
          sizes: p.sizes || [],
        },
      });

      // Ensure all variants exist
      for (const v of p.variants) {
        const existingVar = existing.variants.find((ev) => ev.id === v.id);
        if (existingVar) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: {
              name: v.name,
              color: v.color,
              colorHex: v.colorHex,
              images: v.images,
            },
          });
        } else {
          await prisma.productVariant.create({
            data: {
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
    } else {
      // Create new product
      await prisma.product.create({
        data: {
          id: p.id,
          slug: p.slug,
          name: p.name,
          tagline: p.tagline,
          description: p.description,
          categorySlug: p.categorySlug,
          basePrice: p.basePrice,
          customizable: p.customizable,
          featured: p.featured,
          tags: p.tags,
          sizes: p.sizes || [],
          variants: {
            create: p.variants.map((v) => ({
              id: v.id,
              name: v.name,
              color: v.color,
              colorHex: v.colorHex,
              price: v.price,
              images: v.images,
              inStock: v.inStock,
            })),
          },
        },
      });
    }
    syncedCatalogCount++;
  }
  console.log(`✅ Synced ${syncedCatalogCount} standard catalog products in DB.`);

  // 3. ─── Sync Dedicated Split Poster Products ───
  const splitPosterProducts = [
    {
      id: 'prod_split_stepped_3',
      slug: 'stepped-3-split-poster',
      name: '3-Stepped Split Poster (19:11 Continuous Art)',
      tagline: 'Iconic 3-panel dynamic wave continuous composition.',
      description:
        'Engineered for 19:11 aspect ratios. Middle 6×11" hero panel with dual 6×9" flanking wings creating continuous motion.',
      categorySlug: 'split-posters',
      basePrice: 599,
      customizable: true,
      featured: true,
      tags: ['split-poster', 'stepped', '3-panel', '19:11', 'bestseller'],
      sizes: ['Small (46×28cm)', 'Medium (69×42cm)', 'Large (92×56cm)'],
      variants: [
        {
          id: 'var_split_s3_mat',
          name: 'Archival Matte (280 GSM)',
          color: 'Matte',
          colorHex: '#121214',
          price: 599,
          images: ['https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3%20Split%20Poster.webp'],
          inStock: true,
        },
        {
          id: 'var_split_s3_luxe',
          name: 'Metallic Velvet Lustre (310 GSM)',
          color: 'Velvet',
          colorHex: '#C45D3E',
          price: 799,
          images: ['https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3%20Split%20Poster.webp'],
          inStock: true,
        },
      ],
    },
    {
      id: 'prod_split_stepped_5',
      slug: 'stepped-5-split-poster',
      name: '5-Stepped Split Poster (44:21 Continuous Art)',
      tagline: 'Commanding 5-panel panoramic crest composition.',
      description:
        'Engineered for 44:21 widescreen artworks. Stepped graduated heights ascending toward the center focal panel.',
      categorySlug: 'split-posters',
      basePrice: 999,
      customizable: true,
      featured: true,
      tags: ['split-poster', 'stepped', '5-panel', '44:21', 'featured'],
      sizes: ['Standard (110×53cm)', 'Grand (140×67cm)'],
      variants: [
        {
          id: 'var_split_s5_mat',
          name: 'Archival Matte (280 GSM)',
          color: 'Matte',
          colorHex: '#121214',
          price: 999,
          images: [
            'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Thomas_Shelby_Peaky_Blinders_series_character_c500f4a2-4a00-482a-a9e9-d9fcfe6ceeb9.webp',
          ],
          inStock: true,
        },
        {
          id: 'var_split_s5_luxe',
          name: 'Metallic Velvet Lustre (310 GSM)',
          color: 'Velvet',
          colorHex: '#3B5EFF',
          price: 1299,
          images: [
            'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Thomas_Shelby_Peaky_Blinders_series_character_c500f4a2-4a00-482a-a9e9-d9fcfe6ceeb9.webp',
          ],
          inStock: true,
        },
      ],
    },
    {
      id: 'prod_split_classic_triptych',
      slug: 'classic-horizon-split-poster',
      name: 'Classic Horizon Multi-Panel Split (17:8 Horizon)',
      tagline: 'Pure horizontal continuous panoramic split artwork.',
      description:
        'Symmetrical split panels (3, 4, or 5 panels) engineered for wide cinematic automotive and landscape prints.',
      categorySlug: 'split-posters',
      basePrice: 649,
      customizable: true,
      featured: false,
      tags: ['split-poster', 'classic', 'triptych', 'cinema', '17:8'],
      sizes: ['3-Panel (90×42cm)', '4-Panel (120×42cm)', '5-Panel (150×42cm)'],
      variants: [
        {
          id: 'var_split_cl_3p',
          name: '3-Panel Horizon Split',
          color: 'Standard',
          colorHex: '#121214',
          price: 649,
          images: [
            'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Cinematic_wide_horizontal_split_poster_of_Toyota_1c1186fc-773a-4424-aa61-59fc10a6234b.webp',
          ],
          inStock: true,
        },
        {
          id: 'var_split_cl_4p',
          name: '4-Panel Horizon Split',
          color: 'Wide',
          colorHex: '#1E293B',
          price: 799,
          images: [
            'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Cinematic_wide_horizontal_split_poster_of_Toyota_1c1186fc-773a-4424-aa61-59fc10a6234b.webp',
          ],
          inStock: true,
        },
        {
          id: 'var_split_cl_5p',
          name: '5-Panel Horizon Split',
          color: 'Ultra-Wide',
          colorHex: '#3B82F6',
          price: 949,
          images: [
            'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Cinematic_wide_horizontal_split_poster_of_Toyota_1c1186fc-773a-4424-aa61-59fc10a6234b.webp',
          ],
          inStock: true,
        },
      ],
    },
    {
      id: 'prod_split_grid_matrix',
      slug: 'grid-matrix-split-poster',
      name: 'Grid Multi-Panel Split Poster (17:16 Mosaic)',
      tagline: 'Architectural mosaic grid split art (2×2, 3×2, 3×3).',
      description:
        'Evenly spaced gallery tile composition dividing complex high-density artworks across geometric panels.',
      categorySlug: 'split-posters',
      basePrice: 699,
      customizable: true,
      featured: false,
      tags: ['split-poster', 'grid', 'mosaic', 'matrix', '17:16'],
      sizes: ['2×2 Grid (60×60cm)', '3×2 Grid (90×60cm)', '3×3 Matrix (90×90cm)'],
      variants: [
        {
          id: 'var_split_grid_2x2',
          name: '2×2 Quad Grid',
          color: '2x2',
          colorHex: '#121214',
          price: 699,
          images: ['https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/10%20Split%20Poster.webp'],
          inStock: true,
        },
        {
          id: 'var_split_grid_3x2',
          name: '3×2 Hex Grid',
          color: '3x2',
          colorHex: '#1E293B',
          price: 899,
          images: ['https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/10%20Split%20Poster.webp'],
          inStock: true,
        },
        {
          id: 'var_split_grid_3x3',
          name: '3×3 Matrix Grid',
          color: '3x3',
          colorHex: '#3B82F6',
          price: 1199,
          images: ['https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/10%20Split%20Poster.webp'],
          inStock: true,
        },
      ],
    },
  ];

  for (const sp of splitPosterProducts) {
    const existing = await prisma.product.findUnique({
      where: { id: sp.id },
      include: { variants: true },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: sp.id },
        data: {
          slug: sp.slug,
          name: sp.name,
          tagline: sp.tagline,
          description: sp.description,
          categorySlug: sp.categorySlug,
          customizable: sp.customizable,
          featured: sp.featured,
          tags: sp.tags,
          sizes: sp.sizes,
        },
      });
      for (const v of sp.variants) {
        const ev = existing.variants.find((ex) => ex.id === v.id);
        if (ev) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: { name: v.name, color: v.color, colorHex: v.colorHex, images: v.images },
          });
        } else {
          await prisma.productVariant.create({
            data: {
              id: v.id,
              productId: sp.id,
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
    } else {
      await prisma.product.create({
        data: {
          id: sp.id,
          slug: sp.slug,
          name: sp.name,
          tagline: sp.tagline,
          description: sp.description,
          categorySlug: sp.categorySlug,
          basePrice: sp.basePrice,
          customizable: sp.customizable,
          featured: sp.featured,
          tags: sp.tags,
          sizes: sp.sizes,
          variants: {
            create: sp.variants.map((v) => ({
              id: v.id,
              name: v.name,
              color: v.color,
              colorHex: v.colorHex,
              price: v.price,
              images: v.images,
              inStock: v.inStock,
            })),
          },
        },
      });
    }
  }
  console.log(`✅ Synced ${splitPosterProducts.length} dedicated Split Poster products in DB.`);

  // 4. ─── Sync Wall Studio Layouts to Both `WallLayout` & `Product` ───
  let syncedWallLayouts = 0;
  for (const l of FREGORO_LAYOUTS) {
    const wallProdId = `wall_${l.slug}`;

    // Sync to Prisma WallLayout table
    await prisma.wallLayout.upsert({
      where: { slug: l.slug },
      update: {
        name: l.name,
        description: l.description,
        badge: l.badge || null,
        wallWidthMm: l.wallWidthMm,
        wallHeightMm: l.wallHeightMm,
        coverageLabel: l.coverageLabel,
        physicalPrintCount: l.physicalPrintCount,
        logicalArtworkCount: l.logicalArtworkCount,
        recommendedRoom: l.recommendedRoom || null,
        recommendedWallWidth: l.recommendedWallWidth || null,
        recommendedThemes: l.recommendedThemes,
        slots: l.slots as any,
        splitGroups: (l.splitGroups || []) as any,
        published: true,
        version: l.version,
        updatedAt: new Date(),
      },
      create: {
        id: l.id,
        slug: l.slug,
        name: l.name,
        description: l.description,
        badge: l.badge || null,
        wallWidthMm: l.wallWidthMm,
        wallHeightMm: l.wallHeightMm,
        coverageLabel: l.coverageLabel,
        physicalPrintCount: l.physicalPrintCount,
        logicalArtworkCount: l.logicalArtworkCount,
        recommendedRoom: l.recommendedRoom || null,
        recommendedWallWidth: l.recommendedWallWidth || null,
        recommendedThemes: l.recommendedThemes,
        basePrice: l.basePrice,
        compareAtPrice: l.compareAtPrice || null,
        slots: l.slots as any,
        splitGroups: (l.splitGroups || []) as any,
        published: true,
        version: l.version,
        updatedAt: new Date(),
      },
    });

    // Check if Product row exists (preserve price if admin already changed it)
    const existingWallProd = await prisma.product.findFirst({
      where: {
        OR: [{ id: wallProdId }, { slug: `wall-layout-${l.slug}` }, { slug: l.slug }],
      },
      include: { variants: true },
    });

    if (existingWallProd) {
      await prisma.product.update({
        where: { id: existingWallProd.id },
        data: {
          name: `${l.name} (${l.physicalPrintCount} Prints)`,
          tagline: `${l.coverageLabel} · ${l.badge || 'Signature Setup'}`,
          description: l.description,
          categorySlug: 'wall-studio',
          tags: ['wall-studio', 'layout', l.category || 'hybrid', `${l.physicalPrintCount}-prints`],
          sizes: [l.coverageLabel],
        },
      });

      // Also sync back the admin's custom price to WallLayout if it was updated in Product
      if (existingWallProd.basePrice !== l.basePrice) {
        await prisma.wallLayout.update({
          where: { slug: l.slug },
          data: { basePrice: existingWallProd.basePrice },
        });
      }
    } else {
      await prisma.product.create({
        data: {
          id: wallProdId,
          slug: `wall-layout-${l.slug}`,
          name: `${l.name} (${l.physicalPrintCount} Prints)`,
          tagline: `${l.coverageLabel} · ${l.badge || 'Signature Setup'}`,
          description: l.description,
          categorySlug: 'wall-studio',
          basePrice: l.basePrice,
          customizable: true,
          featured: Boolean(l.badge),
          tags: ['wall-studio', 'layout', l.category || 'hybrid', `${l.physicalPrintCount}-prints`],
          sizes: [l.coverageLabel],
          variants: {
            create: [
              {
                id: `var_${l.slug}_complete`,
                name: `Complete Wall Set (${l.physicalPrintCount} Prints)`,
                color: 'Curated Matte',
                colorHex: '#0D0D0E',
                price: l.basePrice,
                images: ['https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3%20Split%20Poster.webp'],
                inStock: true,
              },
            ],
          },
        },
      });
    }
    syncedWallLayouts++;
  }
  console.log(`✅ Synced ${syncedWallLayouts} Wall Studio Layouts to DB.`);

  // 5. ─── Sync Prebuilt Curated Walls to Both `PrebuiltWallProduct` & `Product` ───
  let syncedPrebuilt = 0;
  for (const pw of PREBUILT_WALLS) {
    const prebuiltProdId = `prebuilt_${pw.slug}`;

    await prisma.prebuiltWallProduct.upsert({
      where: { id: pw.id },
      update: {
        title: pw.title,
        tagline: pw.tagline,
        description: pw.description,
        themeSlug: pw.themeSlug,
        layoutId: pw.layoutId,
        heroImage: pw.heroImage,
        roomPhoto: pw.roomPhoto || null,
        presetSlots: ((pw as any).presetSelections || (pw as any).presetSlots) as any,
        material: pw.material,
        whatsIncluded: pw.whatsIncluded,
        featured: pw.featured,
        updatedAt: new Date(),
      },
      create: {
        id: pw.id,
        slug: pw.slug,
        title: pw.title,
        tagline: pw.tagline,
        description: pw.description,
        themeSlug: pw.themeSlug,
        layoutId: pw.layoutId,
        basePrice: pw.basePrice,
        compareAtPrice: pw.compareAtPrice || null,
        heroImage: pw.heroImage,
        roomPhoto: pw.roomPhoto || null,
        presetSlots: ((pw as any).presetSelections || (pw as any).presetSlots) as any,
        material: pw.material,
        whatsIncluded: pw.whatsIncluded,
        featured: pw.featured,
        updatedAt: new Date(),
      },
    });

    const existingPrebuiltProd = await prisma.product.findFirst({
      where: {
        OR: [{ id: prebuiltProdId }, { slug: `prebuilt-wall-${pw.slug}` }, { slug: pw.slug }],
      },
    });

    if (existingPrebuiltProd) {
      await prisma.product.update({
        where: { id: existingPrebuiltProd.id },
        data: {
          name: pw.title,
          tagline: pw.tagline,
          description: pw.description,
          categorySlug: 'wall-studio',
          tags: ['wall-studio', 'prebuilt', pw.themeSlug],
        },
      });

      if (existingPrebuiltProd.basePrice !== pw.basePrice) {
        await prisma.prebuiltWallProduct.update({
          where: { slug: pw.slug },
          data: { basePrice: existingPrebuiltProd.basePrice },
        });
      }
    } else {
      await prisma.product.create({
        data: {
          id: prebuiltProdId,
          slug: `prebuilt-wall-${pw.slug}`,
          name: pw.title,
          tagline: pw.tagline,
          description: pw.description,
          categorySlug: 'wall-studio',
          basePrice: pw.basePrice,
          customizable: true,
          featured: pw.featured,
          tags: ['wall-studio', 'prebuilt', pw.themeSlug],
          sizes: ['Standard Setup'],
          variants: {
            create: [
              {
                id: `var_${pw.slug}_setup`,
                name: 'Complete Curated Setup',
                color: 'Museum Matte',
                colorHex: '#0D0D0E',
                price: pw.basePrice,
                images: [pw.heroImage],
                inStock: true,
              },
            ],
          },
        },
      });
    }
    syncedPrebuilt++;
  }
  console.log(`✅ Synced ${syncedPrebuilt} Prebuilt Curated Walls to DB.`);

  // 5. ─── Sync All Single Posters to DB ───
  await syncSinglePostersToDatabase();

  const totalInDb = await prisma.product.count();
  console.log(`🎉 [syncAllProductsToDatabase] DONE! Total products in database: ${totalInDb}`);
  return { success: true, totalInDb };
}

// Allow direct CLI execution: `npx tsx scripts/sync-all-products-to-db.ts`
if (require.main === module) {
  syncAllProductsToDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Sync failed:', err);
      process.exit(1);
    });
}
