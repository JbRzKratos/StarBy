import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const dummyProducts = [
  {
    id: 'prod_test_tees',
    slug: 'tees-test-1rs',
    name: 'Tees Test Item (₹1)',
    tagline: 'Custom test tee for ₹1.',
    description: 'Dummy customizable tee priced at ₹1 for live checkout & artwork upload testing.',
    categorySlug: 'tees',
    basePrice: 1,
    customizable: true,
    tags: ['featured', 'bestseller', 'test'],
    featured: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    variants: [
      {
        id: 'var_test_tees_white',
        name: 'White',
        color: 'white',
        colorHex: '#FFFFFF',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/mockups/tee-white-front.png',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
      {
        id: 'var_test_tees_black',
        name: 'Black',
        color: 'black',
        colorHex: '#0E0E0F',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/products/void-tee.webp',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
      {
        id: 'var_test_tees_olive',
        name: 'Olive Green',
        color: 'olive-green',
        colorHex: '#4B5320',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/products/void-tee.webp',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
      {
        id: 'var_test_tees_cbrown',
        name: 'C.Brown',
        color: 'cbrown',
        colorHex: '#4A2E1B',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/products/void-tee.webp',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
      {
        id: 'var_test_tees_maroon',
        name: 'Maroon',
        color: 'maroon',
        colorHex: '#7B1123',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/products/void-tee.webp',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
      {
        id: 'var_test_tees_01',
        name: 'Standard Black',
        color: 'charcoal',
        colorHex: '#0E0E0F',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/products/void-tee.webp',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
    ],
  },
  {
    id: 'prod_test_oversized_tees',
    slug: 'oversized-tee-test-1rs',
    name: 'Oversized Tee Test (₹1)',
    tagline: 'Custom test oversized tee for ₹1.',
    description:
      'Dummy customizable oversized tee priced at ₹1 for live checkout & artwork upload testing.',
    categorySlug: 'oversized-tees',
    basePrice: 1,
    customizable: true,
    tags: ['featured', 'test'],
    featured: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    variants: [
      {
        id: 'var_test_oversized_white',
        name: 'White',
        color: 'white',
        colorHex: '#FFFFFF',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/mockups/tee-white-front.png',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
      {
        id: 'var_test_oversized_black',
        name: 'Black',
        color: 'black',
        colorHex: '#0E0E0F',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/mockups/oversized-tee-black-front.png',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
      {
        id: 'var_test_oversized_duskypink',
        name: 'Dusky Pink',
        color: 'dusky-pink',
        colorHex: '#C08081',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/mockups/oversized-tee-black-front.png',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
      {
        id: 'var_test_oversized_beige',
        name: 'Beige',
        color: 'beige',
        colorHex: '#D4C5B9',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/mockups/oversized-tee-black-front.png',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
      {
        id: 'var_test_oversized_navyblue',
        name: 'Navy Blue',
        color: 'navy-blue',
        colorHex: '#1B263B',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/mockups/oversized-tee-black-front.png',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
      {
        id: 'var_test_oversized_tees_01',
        name: 'Oversized Black',
        color: 'charcoal',
        colorHex: '#0E0E0F',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/mockups/oversized-tee-black-front.png',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
    ],
  },
  {
    id: 'prod_test_acid_wash',
    slug: 'acid-wash-test-1rs',
    name: 'Acid Wash Tee Test (₹1)',
    tagline: 'Custom test acid wash vintage tee for ₹1.',
    description:
      'Dummy customizable acid wash mineral tee priced at ₹1 for live checkout & artwork upload testing.',
    categorySlug: 'tees',
    basePrice: 1,
    customizable: true,
    tags: ['featured', 'acid-wash', 'test'],
    featured: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    variants: [
      {
        id: 'var_test_acid_black',
        name: 'Black',
        color: 'black',
        colorHex: '#2B2B2B',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/products/void-tee.webp',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
      {
        id: 'var_test_acid_white',
        name: 'White',
        color: 'white',
        colorHex: '#EAEAEA',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/mockups/tee-white-front.png',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
      {
        id: 'var_test_acid_violet',
        name: 'Violet',
        color: 'violet',
        colorHex: '#5B2C6F',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/products/void-tee.webp',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
    ],
  },
  {
    id: 'prod_test_hoodies',
    slug: 'hoodie-test-1rs',
    name: 'Hoodie Test Item (₹1)',
    tagline: 'Custom test hoodie for ₹1.',
    description:
      'Dummy customizable hoodie priced at ₹1 for live checkout & artwork upload testing.',
    categorySlug: 'hoodies',
    basePrice: 1,
    customizable: true,
    tags: ['featured', 'test'],
    featured: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    variants: [
      {
        id: 'var_test_hoodies_black',
        name: 'Black',
        color: 'black',
        colorHex: '#0E0E0F',
        price: 1,
        images: ['https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/hero/hoodies.webp'],
        inStock: true,
        stockQuantity: 9999,
      },
      {
        id: 'var_test_hoodies_white',
        name: 'White',
        color: 'white',
        colorHex: '#FFFFFF',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/mockups/hoodie-white-front.png',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
      {
        id: 'var_test_hoodies_01',
        name: 'Standard Black',
        color: 'charcoal',
        colorHex: '#0E0E0F',
        price: 1,
        images: ['https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/hero/hoodies.webp'],
        inStock: true,
        stockQuantity: 9999,
      },
    ],
  },
  {
    id: 'prod_test_skins',
    slug: 'device-skin-test-1rs',
    name: 'Device Skin Test (₹1)',
    tagline: 'Custom test skin for ₹1.',
    description: 'Dummy tech skin priced at ₹1 for live checkout & testing.',
    categorySlug: 'skins',
    basePrice: 1,
    customizable: true,
    tags: ['featured', 'test'],
    featured: true,
    sizes: ['Standard'],
    variants: [
      {
        id: 'var_test_skins_01',
        name: 'Matte Carbon',
        color: 'carbon',
        colorHex: '#1A1A1E',
        price: 1,
        images: ['https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/hero/skins.webp'],
        inStock: true,
        stockQuantity: 9999,
      },
    ],
  },
  {
    id: 'prod_test_posters',
    slug: 'poster-test-1rs',
    name: 'Poster Test Item (₹1)',
    tagline: 'Custom test poster for ₹1.',
    description:
      'Dummy customizable poster priced at ₹1 for live checkout & high-res print testing.',
    categorySlug: 'posters',
    basePrice: 1,
    customizable: true,
    tags: ['featured', 'test'],
    featured: true,
    sizes: ['A3', 'A4'],
    variants: [
      {
        id: 'var_test_posters_01',
        name: 'Fine Art Print',
        color: 'white',
        colorHex: '#F5F1EA',
        price: 1,
        images: ['https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/hero/posters.webp'],
        inStock: true,
        stockQuantity: 9999,
      },
    ],
  },
  {
    id: 'prod_test_split_posters',
    slug: 'split-poster-test-1rs',
    name: 'Split Poster Test (₹1)',
    tagline: 'Custom 3-panel split poster for ₹1.',
    description: 'Dummy split panel poster priced at ₹1 for live checkout & upload testing.',
    categorySlug: 'split-posters',
    basePrice: 1,
    customizable: true,
    tags: ['featured', 'test'],
    featured: true,
    sizes: ['3-Panel (Medium)'],
    variants: [
      {
        id: 'var_test_split_posters_01',
        name: '3-Panel Gallery',
        color: 'black',
        colorHex: '#0E0E0F',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/hero/split_posters.webp',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
    ],
  },
  {
    id: 'prod_test_stationery',
    slug: 'stationery-test-1rs',
    name: 'Custom Diary Test (₹1)',
    tagline: 'Custom test hardcover journal for ₹1.',
    description:
      'Dummy custom diary/notebook priced at ₹1 for live checkout & cover print testing.',
    categorySlug: 'stationery',
    basePrice: 1,
    customizable: true,
    tags: ['featured', 'test'],
    featured: true,
    sizes: ['A5 Hardcover'],
    variants: [
      {
        id: 'var_test_stationery_01',
        name: 'Hardcover Notebook',
        color: 'noir',
        colorHex: '#2A2A2F',
        price: 1,
        images: ['https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/hero/stationery.webp'],
        inStock: true,
        stockQuantity: 9999,
      },
    ],
  },
  {
    id: 'prod_test_mugs',
    slug: 'mug-test-1rs',
    name: 'Ceramic Mug Test (₹1)',
    tagline: 'Custom test mug for ₹1.',
    description: 'Dummy custom ceramic mug priced at ₹1 for live checkout & wrap print testing.',
    categorySlug: 'mugs-cups',
    basePrice: 1,
    customizable: true,
    tags: ['featured', 'test'],
    featured: true,
    sizes: ['11 oz Ceramic'],
    variants: [
      {
        id: 'var_test_mugs_01',
        name: 'Classic 11oz',
        color: 'white',
        colorHex: '#FFFFFF',
        price: 1,
        images: [
          'https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/products/classic_mug_11oz.png',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
    ],
  },
  {
    id: 'prod_test_accessories',
    slug: 'accessory-test-1rs',
    name: 'Accessory Test Item (₹1)',
    tagline: 'Custom test accessory for ₹1.',
    description: 'Dummy accessory item priced at ₹1 for live checkout testing.',
    categorySlug: 'accessories',
    basePrice: 1,
    customizable: true,
    tags: ['featured', 'test'],
    featured: true,
    sizes: ['One Size'],
    variants: [
      {
        id: 'var_test_accessories_01',
        name: 'Standard',
        color: 'black',
        colorHex: '#0E0E0F',
        price: 1,
        images: ['https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/hero/tees.webp'],
        inStock: true,
        stockQuantity: 9999,
      },
    ],
  },
  {
    id: 'prod_test_prints',
    slug: 'photo-print-test-1rs',
    name: 'Photo Print Test (₹1)',
    tagline: 'Custom test photo print for ₹1.',
    description: 'Dummy photo print pack priced at ₹1 for live checkout & photo upload testing.',
    categorySlug: 'prints',
    basePrice: 1,
    customizable: true,
    tags: ['featured', 'test'],
    featured: true,
    sizes: ['4x6 inches'],
    variants: [
      {
        id: 'var_test_prints_01',
        name: 'Lustre Finish',
        color: 'white',
        colorHex: '#FFFFFF',
        price: 1,
        images: ['https://pub-28da5e54eb864b91b97951ce30ef48ff.r2.dev/images/hero/posters.webp'],
        inStock: true,
        stockQuantity: 9999,
      },
    ],
  },
  {
    id: 'prod_test_magazine',
    slug: 'custom-magazine-test-1rs',
    name: 'Custom Magazine Test (₹1)',
    tagline: 'Custom test editorial publication for ₹1.',
    description:
      'Dummy custom magazine priced at ₹1 for live checkout, content wizard & editorial photo upload testing.',
    categorySlug: 'magazine',
    basePrice: 1,
    customizable: true,
    tags: ['featured', 'editorial', 'test'],
    featured: true,
    sizes: ['A4 Portrait (12 Pages)'],
    variants: [
      {
        id: 'var_test_magazine_01',
        name: '12 Pages · 170gsm Silk',
        color: 'standard',
        colorHex: '#0057FF',
        price: 1,
        images: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
    ],
  },
];

async function main() {
  console.log('Upserting 11 dummy ₹1 products into database...');

  for (const p of dummyProducts) {
    const { variants, ...prodData } = p;
    await prisma.product.upsert({
      where: { id: prodData.id },
      update: {
        ...prodData,
      },
      create: {
        ...prodData,
      },
    });

    for (const v of variants) {
      await prisma.productVariant.upsert({
        where: { id: v.id },
        update: {
          productId: prodData.id,
          name: v.name,
          color: v.color,
          colorHex: v.colorHex,
          price: v.price,
          images: v.images,
          inStock: v.inStock,
          stockQuantity: v.stockQuantity,
        },
        create: {
          id: v.id,
          productId: prodData.id,
          name: v.name,
          color: v.color,
          colorHex: v.colorHex,
          price: v.price,
          images: v.images,
          inStock: v.inStock,
          stockQuantity: v.stockQuantity,
        },
      });
    }
    console.log(`✓ Product ${prodData.id} (${prodData.name}) synced.`);
  }

  // Also check if prod_mag_01 exists or if we should add v_mag_test_1rs to it
  const prodMag01 = await prisma.product.findUnique({ where: { id: 'prod_mag_01' } });
  if (prodMag01) {
    await prisma.productVariant.upsert({
      where: { id: 'v_mag_test_1rs' },
      update: {
        productId: 'prod_mag_01',
        name: 'Test ₹1 Magazine Variant',
        color: 'standard',
        colorHex: '#0057FF',
        price: 1,
        images: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
      create: {
        id: 'v_mag_test_1rs',
        productId: 'prod_mag_01',
        name: 'Test ₹1 Magazine Variant',
        color: 'standard',
        colorHex: '#0057FF',
        price: 1,
        images: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        ],
        inStock: true,
        stockQuantity: 9999,
      },
    });
    console.log('✓ Added v_mag_test_1rs to prod_mag_01.');
  }

  const count = await prisma.product.count();
  console.log(`Done! Total products in DB: ${count}`);
}

main()
  .catch((e) => {
    console.error('Error seeding dummy products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
