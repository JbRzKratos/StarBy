import manifest from './plain-mockups-manifest.json';
import type { Product } from './products';

type ManifestType = typeof manifest;

const m = manifest as ManifestType;

export const plainApparelProducts: Product[] = [
  // 1. Regular Cotton Tee (180 GSM)
  {
    id: 'plain_regular_tee',
    slug: 'plain-regular-cotton-tee',
    name: 'Plain Regular Cotton Tee (180 GSM)',
    tagline: '180 GSM 100% Combed Cotton · Clean Streetwear Essential',
    description:
      'Crafted from 180 GSM premium combed cotton with high-density knit, pre-shrunk finish, and reinforced neckline ribbing. A timeless classic crewneck cut engineered for daily wear and clean minimalist aesthetics.',
    categorySlug: 'tees',
    basePrice: 799,
    customizable: true,
    tags: ['apparel', 'tees', 'plain', 'essentials', 'cotton', 'featured'],
    featured: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    variants: [
      {
        id: 'v_plain_reg_white',
        name: 'White',
        color: 'white',
        colorHex: '#FFFFFF',
        price: 799,
        images: m['Regular-Cotton-180GSM']['White'].allImages,
        inStock: true,
      },
      {
        id: 'v_plain_reg_black',
        name: 'Black',
        color: 'black',
        colorHex: '#111215',
        price: 799,
        images: m['Regular-Cotton-180GSM']['Black'].allImages,
        inStock: true,
      },
      {
        id: 'v_plain_reg_olive',
        name: 'Olive Green',
        color: 'olive-green',
        colorHex: '#3B443B',
        price: 799,
        images: m['Regular-Cotton-180GSM']['Olive-Green'].allImages,
        inStock: true,
      },
      {
        id: 'v_plain_reg_brown',
        name: 'C.Brown',
        color: 'c-brown',
        colorHex: '#5A3825',
        price: 799,
        images: m['Regular-Cotton-180GSM']['C-Brown'].allImages,
        inStock: true,
      },
      {
        id: 'v_plain_reg_maroon',
        name: 'Maroon',
        color: 'maroon',
        colorHex: '#800000',
        price: 799,
        images: m['Regular-Cotton-180GSM']['Maroon'].allImages,
        inStock: true,
      },
    ],
  },

  // 2. Oversized French Terry Tee (240 GSM)
  {
    id: 'plain_oversized_tee',
    slug: 'plain-oversized-french-terry-tee',
    name: 'Plain Oversized French Terry Tee (240 GSM)',
    tagline: '240 GSM Heavyweight French Terry · Boxy Drop-Shoulder Fit',
    description:
      'Constructed from luxury 240 GSM French Terry cotton. Engineered with dropped shoulders, a relaxed boxy silhouette, seamless neckband, and ultra-soft loopback interior texture.',
    categorySlug: 'tees',
    basePrice: 999,
    customizable: true,
    tags: ['apparel', 'tees', 'oversized-tees', 'plain', 'essentials', 'french-terry', 'featured'],
    featured: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    variants: [
      {
        id: 'v_plain_ov_white',
        name: 'White',
        color: 'white',
        colorHex: '#FFFFFF',
        price: 999,
        images: m['Oversized-French-Terry-240GSM']['White'].allImages,
        inStock: true,
      },
      {
        id: 'v_plain_ov_black',
        name: 'Black',
        color: 'black',
        colorHex: '#111215',
        price: 999,
        images: m['Oversized-French-Terry-240GSM']['Black'].allImages,
        inStock: true,
      },
      {
        id: 'v_plain_ov_pink',
        name: 'Dusky Pink',
        color: 'dusky-pink',
        colorHex: '#D8A1A8',
        price: 999,
        images: m['Oversized-French-Terry-240GSM']['Dusky-Pink'].allImages,
        inStock: true,
      },
      {
        id: 'v_plain_ov_beige',
        name: 'Beige',
        color: 'beige',
        colorHex: '#D4C5B9',
        price: 999,
        images: m['Oversized-French-Terry-240GSM']['Beige'].allImages,
        inStock: true,
      },
      {
        id: 'v_plain_ov_navy',
        name: 'Navy Blue',
        color: 'navy-blue',
        colorHex: '#1B263B',
        price: 999,
        images: m['Oversized-French-Terry-240GSM']['Navy-Blue'].allImages,
        inStock: true,
      },
    ],
  },

  // 3. Vintage Acid Wash Tee (240 GSM)
  {
    id: 'plain_acid_wash_tee',
    slug: 'plain-vintage-acid-wash-tee',
    name: 'Plain Vintage Acid Wash Tee (240 GSM)',
    tagline: '240 GSM Heavy Cotton · Authentic Marbled Mineral Wash',
    description:
      'Heavyweight 240 GSM cotton treated with artisanal acid washing and mineral wash finish. Features individual marbled patterns, softened distressed fabric hand-feel, and authentic vintage streetwear drape.',
    categorySlug: 'tees',
    basePrice: 1099,
    customizable: true,
    tags: ['apparel', 'tees', 'plain', 'acid-wash', 'vintage', 'streetwear', 'featured'],
    featured: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    variants: [
      {
        id: 'v_plain_acid_black',
        name: 'Black',
        color: 'black',
        colorHex: '#2B2B2B',
        price: 1099,
        images: m['Acid-Wash-240GSM']['Black'].allImages,
        inStock: true,
      },
      {
        id: 'v_plain_acid_white',
        name: 'White',
        color: 'white',
        colorHex: '#E5E5E5',
        price: 1099,
        images: m['Acid-Wash-240GSM']['White'].allImages,
        inStock: true,
      },
      {
        id: 'v_plain_acid_violet',
        name: 'Violet',
        color: 'violet',
        colorHex: '#5E4B8B',
        price: 1099,
        images: m['Acid-Wash-240GSM']['Violet'].allImages,
        inStock: true,
      },
    ],
  },

  // 4. Heavyweight Studio Hoodie (300 GSM)
  {
    id: 'plain_hoodie',
    slug: 'plain-heavyweight-studio-hoodie',
    name: 'Plain Heavyweight Studio Hoodie (300 GSM)',
    tagline: '300 GSM Brushed Fleece Pullover · Double-Lined Hood & Kangaroo Pocket',
    description:
      'Engineered from 300 GSM heavyweight brushed fleece for superior warmth and structured silhouette. Equipped with a generous double-layer drawstring hood, heavyweight ribbed cuffs and hem, and seamless kangaroo pocket.',
    categorySlug: 'hoodies',
    basePrice: 1499,
    customizable: true,
    tags: ['apparel', 'hoodies', 'plain', 'fleece', 'heavyweight', 'featured'],
    featured: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    variants: [
      {
        id: 'v_plain_hoodie_black',
        name: 'Black',
        color: 'black',
        colorHex: '#111215',
        price: 1499,
        images: m['Hoodie-Brushed-Fleece-300GSM']['Black'].allImages,
        inStock: true,
      },
      {
        id: 'v_plain_hoodie_white',
        name: 'White',
        color: 'white',
        colorHex: '#FFFFFF',
        price: 1499,
        images: m['Hoodie-Brushed-Fleece-300GSM']['White'].allImages,
        inStock: true,
      },
    ],
  },
];
