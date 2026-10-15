import { prisma } from '../lib/prisma';

export async function seedTest1RsProducts() {
  console.log('🚀 Seeding 1 Rupee test products in every category...');

  // 1. Ensure categories exist in DB
  const categoriesToEnsure = [
    { slug: 'tees', name: 'Tees', tagline: 'Wear your world.', description: 'Premium heavyweight essentials with custom print zones.' },
    { slug: 'oversized-tees', name: 'Oversized Tees', tagline: 'Big canvas, bigger statement.', description: 'Drop-shoulder boxy fit tees built for oversized prints.' },
    { slug: 'hoodies', name: 'Hoodies', tagline: 'Structured warmth.', description: 'Oversized comfort, engineered for your design.' },
    { slug: 'posters', name: 'Posters', tagline: 'Museum-scale art.', description: 'Giclée printed fine art for your walls.' },
    { slug: 'split-posters', name: 'Split Posters', tagline: 'One image. Many panels.', description: 'Your photo across multiple panels for wall art.' },
    { slug: 'wall-studio', name: 'Wall Studio', tagline: 'Signature gallery compositions.', description: 'Prebuilt multi-frame curated art compositions.' },
    { slug: 'magazine', name: 'Magazine Studio', tagline: 'Design & print your own editorial publication.', description: 'Custom magazine design platform with professional templates.' },
    { slug: 'stationery', name: 'Stationery', tagline: 'Write your story.', description: 'Customizable diaries, notebooks, and journals.' },
    { slug: 'mugs-cups', name: 'Cups & Mugs', tagline: 'Your everyday studio ritual.', description: 'Custom ceramic stoneware and mugs.' },
    { slug: 'skins', name: 'Device Skins', tagline: 'Precision armor for your tech.', description: 'Precision protective skins.' },
    { slug: 'accessories', name: 'Accessories', tagline: 'Details that define.', description: 'Keychains, caps, and statement pieces.' },
    { slug: 'prints', name: 'Photo Prints', tagline: 'Moments, materialized.', description: 'Polaroid prints and custom photo products.' },
  ];

  for (const cat of categoriesToEnsure) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        tagline: cat.tagline,
        description: cat.description,
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        tagline: cat.tagline,
        description: cat.description,
        gradient: 'linear-gradient(135deg, #1A1A24 0%, #0057FF 100%)',
        productCount: 1,
        featured: true,
      },
    });
  }

  // 2. Define the 1 Rupee products for every category
  const test1RsProducts = [
    // 1. TEES
    {
      id: 'prod_test_tees',
      slug: 'prod-test-tees',
      name: 'Classic Heavyweight Studio Tee (Test ₹1)',
      tagline: '240 GSM Heavyweight Cotton · Test ₹1 Edition',
      description: 'Test purchase product for deployed site testing. 100% combed cotton, 240 GSM heavyweight fabric.',
      categorySlug: 'tees',
      basePrice: 1,
      customizable: true,
      tags: ['apparel', 'tees', 'test-1rs', 'featured'],
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      variants: [
        { id: 'v_test_tee_white', name: 'White', color: 'white', colorHex: '#FFFFFF', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/mockups/tee-white-front.png'] },
        { id: 'v_test_tee_black', name: 'Black', color: 'black', colorHex: '#111216', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/mockups/tee-black-front.png'] },
      ],
    },

    // 2. OVERSIZED TEES
    {
      id: 'prod_test_oversized_tee',
      slug: 'oversized-tee-test-1rs',
      name: 'Oversized Boxy Fit Tee (Test ₹1)',
      tagline: '280 GSM Drop-Shoulder Heavyweight · Test ₹1 Edition',
      description: 'Test purchase product for deployed site testing. Oversized boxy silhouette, dropped shoulders, luxury 280 GSM French Terry.',
      categorySlug: 'oversized-tees',
      basePrice: 1,
      customizable: true,
      tags: ['apparel', 'oversized-tees', 'test-1rs', 'featured'],
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      variants: [
        { id: 'v_test_ov_black', name: 'Vintage Washed Black', color: 'black', colorHex: '#18181B', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/mockups/oversized-tee-black-front.png'] },
        { id: 'v_test_ov_white', name: 'Off White', color: 'white', colorHex: '#FAFAFA', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/mockups/tee-white-front.png'] },
      ],
    },

    // 3. HOODIES
    {
      id: 'prod_test_hoodie',
      slug: 'hoodie-test-1rs',
      name: 'Heavyweight Studio Hoodie (Test ₹1)',
      tagline: '400 GSM Double-Fleece Pullover · Test ₹1 Edition',
      description: 'Test purchase product for deployed site testing. 400 GSM heavyweight brushed fleece with double-lined hood.',
      categorySlug: 'hoodies',
      basePrice: 1,
      customizable: true,
      tags: ['apparel', 'hoodies', 'test-1rs', 'featured'],
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      variants: [
        { id: 'v_test_hoodie_black', name: 'Pitch Black', color: 'black', colorHex: '#090A0F', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/mockups/hoodie-black-front.png'] },
        { id: 'v_test_hoodie_grey', name: 'Heather Grey', color: 'grey', colorHex: '#71717A', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/mockups/hoodie-black-front.png'] },
      ],
    },

    // 4. POSTERS
    {
      id: 'poster_test_1rs',
      slug: 'poster-test-1rs',
      name: 'Celestial Fine Art Giclée Poster (Test ₹1)',
      tagline: '300 GSM Museum Archival Fine Art · Test ₹1 Edition',
      description: 'Test purchase product for deployed site testing. Giclée printed on 300 GSM acid-free archival cotton paper with fade-resistant pigment inks.',
      categorySlug: 'posters',
      basePrice: 1,
      customizable: false,
      tags: ['posters', 'test-1rs', 'featured'],
      sizes: ['12x18 inches (A3)', '18x24 inches (A2)', '24x36 inches (A1)'],
      variants: [
        { id: 'var_poster_test_matte', name: 'Archival Matte (300 GSM)', color: 'natural', colorHex: '#F5F1EA', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/hero/posters.webp'] },
        { id: 'var_poster_test_lustre', name: 'Metallic Lustre (310 GSM)', color: 'lustre', colorHex: '#E2E8F0', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/hero/posters.webp'] },
      ],
    },

    // 5. SPLIT POSTERS
    {
      id: 'prod_split_stepped_3',
      slug: 'stepped-3-split-poster',
      name: '3-Stepped Split Poster (Test ₹1)',
      tagline: 'One image. Three panels. Continuous wall flow · Test ₹1 Edition',
      description: 'Test purchase product for deployed site testing. Dynamic 3-panel tiered triptych.',
      categorySlug: 'split-posters',
      basePrice: 1,
      customizable: true,
      tags: ['split-posters', 'test-1rs', 'featured'],
      sizes: ['Set of 3 (Total Span 44×21 in)'],
      variants: [
        { id: 'var_split_s3_mat', name: 'Archival Matte (280 GSM)', color: 'natural', colorHex: '#F5F1EA', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/hero/split_posters.webp'] },
        { id: 'var_split_s3_luxe', name: 'Metallic Velvet Lustre (310 GSM)', color: 'lustre', colorHex: '#E2E8F0', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/hero/split_posters.webp'] },
      ],
    },

    // 6. WALL STUDIO
    {
      id: 'prebuilt_batman-dark-knight-archive',
      slug: 'prebuilt-wall-batman-dark-knight-archive',
      name: 'The Dark Knight Archive Setup (Test ₹1)',
      tagline: 'Curated 5-Frame Gallery Grid · Test ₹1 Edition',
      description: 'Test purchase product for deployed site testing. 5 museum-grade archival giclée prints designed for living rooms.',
      categorySlug: 'wall-studio',
      basePrice: 1,
      customizable: true,
      tags: ['wall-studio', 'test-1rs', 'featured'],
      sizes: ['5-Print Setup (Span 52×28 in)'],
      variants: [
        { id: 'var_batman-dark-knight-archive_setup', name: 'Complete Curated Setup', color: 'gallery-black', colorHex: '#0E0E0F', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/hero/split_posters.webp'] },
      ],
    },

    // 7. MAGAZINE
    {
      id: 'prod_test_magazine',
      slug: 'custom-magazine-test-1rs',
      name: 'Custom Magazine Test (₹1)',
      tagline: '12 Pages · 170gsm Silk Archival Print · Test ₹1 Edition',
      description: 'Test purchase product for deployed site testing. Bespoke editorial magazine with saddle-stitch binding.',
      categorySlug: 'magazine',
      basePrice: 1,
      customizable: true,
      tags: ['magazine', 'test-1rs', 'featured'],
      sizes: ['A4 Portrait'],
      variants: [
        { id: 'var_test_magazine_01', name: '12 Pages · 170gsm Silk', color: 'silk-white', colorHex: '#FAFAFA', price: 1, inStock: true, stockQuantity: 9999, images: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'] },
      ],
    },

    // 8. STATIONERY
    {
      id: 'prod_032',
      slug: 'chronicle-diary',
      name: 'Chronicle Diary (Test ₹1)',
      tagline: 'Vegan Leather Bound Hardcover Journal · Test ₹1 Edition',
      description: 'Test purchase product for deployed site testing. 192 ruled archival pages on 100 GSM acid-free paper.',
      categorySlug: 'stationery',
      basePrice: 1,
      customizable: true,
      tags: ['stationery', 'test-1rs', 'featured'],
      sizes: ['A5 Hardcover'],
      variants: [
        { id: 'v32a', name: 'Obsidian Black', color: 'black', colorHex: '#0E0E0F', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/hero/stationery.webp'] },
      ],
    },

    // 9. MUGS & CUPS
    {
      id: 'prod_m01',
      slug: 'classic-mug-11oz',
      name: 'Classic Mug 11oz (Test ₹1)',
      tagline: 'Premium Ceramic Stoneware · Test ₹1 Edition',
      description: 'Test purchase product for deployed site testing. High-gloss ceramic finish with microwave and dishwasher safe coating.',
      categorySlug: 'mugs-cups',
      basePrice: 1,
      customizable: true,
      tags: ['mugs-cups', 'test-1rs', 'featured'],
      sizes: ['11oz Ceramic'],
      variants: [
        { id: 'vm01a', name: 'Gloss White', color: 'white', colorHex: '#FFFFFF', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/products/classic_mug_11oz.png'] },
      ],
    },

    // 10. DEVICE SKINS
    {
      id: 'prod_022',
      slug: 'phantom-skin',
      name: 'Phantom Skin (Test ₹1)',
      tagline: '3M Ultra-Precision Textured Vinyl · Test ₹1 Edition',
      description: 'Test purchase product for deployed site testing. Precision-cut 3M vinyl skin with air-release adhesive backing.',
      categorySlug: 'skins',
      basePrice: 1,
      customizable: true,
      tags: ['skins', 'test-1rs', 'featured'],
      sizes: ['Universal Phone / Laptop'],
      variants: [
        { id: 'v22a', name: 'Matte Matrix Black', color: 'black', colorHex: '#0E0E0F', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/products/phantom-skin.webp'] },
      ],
    },

    // 11. ACCESSORIES
    {
      id: 'prod_040',
      slug: 'signal-keychain',
      name: 'Signal Keychain (Test ₹1)',
      tagline: 'Anodized Aircraft Aluminum · Test ₹1 Edition',
      description: 'Test purchase product for deployed site testing. Laser-engraved aircraft-grade aluminum keychain.',
      categorySlug: 'accessories',
      basePrice: 1,
      customizable: true,
      tags: ['accessories', 'test-1rs', 'featured'],
      sizes: ['Standard EDC'],
      variants: [
        { id: 'v40a', name: 'Space Grey', color: 'grey', colorHex: '#374151', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/hero/stationery.webp'] },
      ],
    },

    // 12. PHOTO PRINTS
    {
      id: 'prod_test_prints',
      slug: 'photo-prints-test-1rs',
      name: 'Polaroid Archival Prints Set (Test ₹1)',
      tagline: 'Museum Archival Photo Card Pack · Test ₹1 Edition',
      description: 'Test purchase product for deployed site testing. Pack of 10 archival mini prints on 350 GSM satin paper.',
      categorySlug: 'prints',
      basePrice: 1,
      customizable: true,
      tags: ['prints', 'test-1rs', 'featured'],
      sizes: ['Set of 10 (3×4 in)'],
      variants: [
        { id: 'v_test_prints_default', name: 'Classic White Border', color: 'white', colorHex: '#FFFFFF', price: 1, inStock: true, stockQuantity: 9999, images: ['/images/hero/stationery.webp'] },
      ],
    },
  ];

  // 3. Upsert products and variants in DB
  for (const item of test1RsProducts) {
    const existing = await prisma.product.findUnique({
      where: { id: item.id },
      include: { variants: true },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: item.id },
        data: {
          slug: item.slug,
          name: item.name,
          tagline: item.tagline,
          description: item.description,
          categorySlug: item.categorySlug,
          basePrice: 1,
          customizable: item.customizable,
          featured: true,
          tags: item.tags,
          sizes: item.sizes,
        },
      });

      for (const v of item.variants) {
        const existingV = existing.variants.find((ev) => ev.id === v.id);
        if (existingV) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: {
              name: v.name,
              color: v.color,
              colorHex: v.colorHex,
              price: 1,
              inStock: true,
              stockQuantity: 9999,
              images: v.images,
            },
          });
        } else {
          await prisma.productVariant.create({
            data: {
              id: v.id,
              productId: item.id,
              name: v.name,
              color: v.color,
              colorHex: v.colorHex,
              price: 1,
              inStock: true,
              stockQuantity: 9999,
              images: v.images,
            },
          });
        }
      }
    } else {
      await prisma.product.create({
        data: {
          id: item.id,
          slug: item.slug,
          name: item.name,
          tagline: item.tagline,
          description: item.description,
          categorySlug: item.categorySlug,
          basePrice: 1,
          customizable: item.customizable,
          featured: true,
          tags: item.tags,
          sizes: item.sizes,
          variants: {
            create: item.variants.map((v) => ({
              id: v.id,
              name: v.name,
              color: v.color,
              colorHex: v.colorHex,
              price: 1,
              inStock: true,
              stockQuantity: 9999,
              images: v.images,
            })),
          },
        },
      });
    }

    console.log(`✓ Configured 1-Rupee Product: [${item.categorySlug}] "${item.name}" (id: ${item.id}, slug: ${item.slug})`);
  }

  console.log('🎉 Successfully seeded/updated 1-Rupee test products across all categories!');
}

if (require.main === module) {
  seedTest1RsProducts()
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
