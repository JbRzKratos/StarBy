export interface Category {
  slug: string;
  name: string;
  description: string;
  tagline: string;
  productCount: number;
  featured: boolean;
  gradient: string;
  image?: string;
}

export const categories: Category[] = [
  {
    slug: 'tees',
    name: 'Tees',
    tagline: 'Wear your world.',
    description: 'Premium heavyweight essentials with custom print zones.',
    productCount: 24,
    featured: true,
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    image: '/images/hero/tees.png',
  },
  {
    slug: 'hoodies',
    name: 'Hoodies',
    tagline: 'Structured warmth.',
    description: 'Oversized comfort, engineered for your design.',
    productCount: 16,
    featured: true,
    gradient: 'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
    image: '/images/hero/hoodies.png',
  },
  {
    slug: 'skins',
    name: 'Device Skins',
    tagline: 'Redefine your tech.',
    description: 'Precision-cut skins for every device.',
    productCount: 32,
    featured: true,
    gradient: 'linear-gradient(135deg, #0E0E0F 0%, #3B5EFF 100%)',
    image: '/images/hero/skins.png',
  },
  {
    slug: 'posters',
    name: 'Posters',
    tagline: 'Museum-scale art.',
    description: 'Giclée printed fine art for your walls.',
    productCount: 18,
    featured: true,
    gradient: 'linear-gradient(135deg, #434343 0%, #1a1a2e 100%)',
    image: '/images/hero/posters.png',
  },
  {
    slug: 'split-posters',
    name: 'Split Posters',
    tagline: 'One image. Many panels.',
    description: 'Your photo across multiple panels for wall art.',
    productCount: 8,
    featured: true,
    gradient: 'linear-gradient(135deg, #0E0E0F 0%, #C45D3E 100%)',
    image: '/images/hero/split_posters.png',
  },
  {
    slug: 'stationery',
    name: 'Stationery',
    tagline: 'Write your story.',
    description: 'Customizable diaries, notebooks, and journals.',
    productCount: 12,
    featured: true,
    gradient: 'linear-gradient(135deg, #2A2A2F 0%, #D8D0C8 100%)',
    image: '/images/hero/stationery.png',
  },
  {
    slug: 'accessories',
    name: 'Accessories',
    tagline: 'Details that define.',
    description: 'Keychains, caps, and statement pieces.',
    productCount: 20,
    featured: false,
    gradient: 'linear-gradient(135deg, #1A1A1E 0%, #3A3A40 100%)',
  },
  {
    slug: 'prints',
    name: 'Photo Prints',
    tagline: 'Moments, materialized.',
    description: 'Polaroid prints and custom photo products.',
    productCount: 10,
    featured: false,
    gradient: 'linear-gradient(135deg, #F5F1EA 0%, #D8D0C8 100%)',
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getFeaturedCategories(): Category[] {
  return categories.filter((c) => c.featured);
}
