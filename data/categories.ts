import { getR2AssetUrl } from '@/lib/r2';

export interface Category {
  slug: string;
  name: string;
  description: string;
  tagline: string;
  productCount: number;
  featured: boolean;
  gradient: string;
  image?: string;
  comingSoon?: boolean;
}

export const ACTIVE_PRODUCT_CATEGORIES = new Set([
  'all',
  'tees',
  'oversized-tees',
  'hoodies',
  'posters',
  'split-posters',
  'wall-studio',
  'magazine',
]);

export function isCategoryComingSoon(categorySlug?: string): boolean {
  if (!categorySlug) return false;
  const slug = categorySlug.toLowerCase().trim();
  if (slug === 'all' || slug === 'all-designs' || slug === 'all designs') return false;
  return !ACTIVE_PRODUCT_CATEGORIES.has(slug);
}

export function isProductComingSoon(product?: {
  categorySlug?: string;
  comingSoon?: boolean;
  tags?: string[];
  basePrice?: number;
}): boolean {
  if (!product) return false;
  if (product.comingSoon === true) return true;
  if (isCategoryComingSoon(product.categorySlug)) return true;
  if (product.comingSoon === false) return false;
  return false;
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
    image: getR2AssetUrl('images/hero/tees.webp'),
    comingSoon: false,
  },
  {
    slug: 'oversized-tees',
    name: 'Oversized Tees',
    tagline: 'Big canvas, bigger statement.',
    description: 'Drop-shoulder boxy fit tees built for oversized prints.',
    productCount: 0,
    featured: false,
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #4a1942 100%)',
    image: getR2AssetUrl('images/mockups/oversized-tee-black-front.webp'),
    comingSoon: false,
  },
  {
    slug: 'hoodies',
    name: 'Hoodies',
    tagline: 'Structured warmth.',
    description: 'Oversized comfort, engineered for your design.',
    productCount: 16,
    featured: true,
    gradient: 'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
    image: getR2AssetUrl('images/hero/hoodies.webp'),
    comingSoon: false,
  },
  {
    slug: 'skins',
    name: 'Device Skins',
    tagline: 'Precision armor for your tech.',
    description:
      'A new way to protect and personalize your devices is on the way. Our Device Skins collection is currently in active development.',
    productCount: 10,
    featured: true,
    gradient: 'linear-gradient(135deg, #0E0E0F 0%, #3B5EFF 100%)',
    image: getR2AssetUrl('images/hero/skins.webp'),
    comingSoon: true,
  },
  {
    slug: 'posters',
    name: 'Posters',
    tagline: 'Museum-scale art.',
    description: 'Giclée printed fine art for your walls.',
    productCount: 18,
    featured: true,
    gradient: 'linear-gradient(135deg, #434343 0%, #1a1a2e 100%)',
    image: getR2AssetUrl('images/hero/posters.webp'),
    comingSoon: false,
  },
  {
    slug: 'split-posters',
    name: 'Split Posters',
    tagline: 'One image. Many panels.',
    description: 'Your photo across multiple panels for wall art.',
    productCount: 8,
    featured: true,
    gradient: 'linear-gradient(135deg, #0E0E0F 0%, #C45D3E 100%)',
    image: getR2AssetUrl('images/hero/split_posters.webp'),
    comingSoon: false,
  },
  {
    slug: 'stationery',
    name: 'Stationery',
    tagline: 'Write your story • Coming Soon.',
    description: 'Customizable diaries, notebooks, and journals. In development — drop list open.',
    productCount: 12,
    featured: true,
    gradient: 'linear-gradient(135deg, #2A2A2F 0%, #D8D0C8 100%)',
    image: getR2AssetUrl('images/hero/stationery.webp'),
    comingSoon: true,
  },
  {
    slug: 'mugs-cups',
    name: 'Cups & Mugs',
    tagline: 'Your everyday studio ritual • Coming Soon.',
    description: 'Custom ceramic stoneware, insulated travel tumblers, and heat-reactive mugs. In development — drop list open.',
    productCount: 8,
    featured: true,
    gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    image: getR2AssetUrl('images/products/classic_mug_11oz.webp'),
    comingSoon: true,
  },
  {
    slug: 'accessories',
    name: 'Accessories',
    tagline: 'Details that define • Coming Soon.',
    description: 'Keychains, caps, and statement pieces. In development — drop list open.',
    productCount: 20,
    featured: false,
    gradient: 'linear-gradient(135deg, #1A1A1E 0%, #3A3A40 100%)',
    comingSoon: true,
  },
  {
    slug: 'prints',
    name: 'Photo Prints',
    tagline: 'Moments, materialized • Coming Soon.',
    description: 'Polaroid prints and custom photo products. In development — drop list open.',
    productCount: 10,
    featured: false,
    gradient: 'linear-gradient(135deg, #F5F1EA 0%, #D8D0C8 100%)',
    comingSoon: true,
  },
  {
    slug: 'magazine',
    name: 'Magazine Studio',
    tagline: 'Design & print your own editorial publication.',
    description:
      'Custom magazine design platform with professional templates, preflight check, and high-spec print delivery.',
    productCount: 12,
    featured: true,
    gradient: 'linear-gradient(135deg, #0D0D0E 0%, #1A1A24 50%, #0057FF 100%)',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    comingSoon: false,
  },
  {
    slug: 'wall-studio',
    name: 'Wall Studio',
    tagline: 'Signature gallery compositions.',
    description:
      'Prebuilt multi-frame curated art compositions and physical gallery arrangements.',
    productCount: 27,
    featured: true,
    gradient: 'linear-gradient(135deg, #1A1A24 0%, #0057FF 100%)',
    image: getR2AssetUrl('images/hero/split_posters.webp'),
    comingSoon: false,
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getFeaturedCategories(): Category[] {
  return categories.filter((c) => c.featured);
}
