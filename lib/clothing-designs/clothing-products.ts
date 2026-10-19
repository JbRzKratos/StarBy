import type { Product } from '@/data/products';
import { getManifest } from './manifest';

let cachedProducts: Product[] | null = null;

export function getClothingDesignProducts(): Product[] {
  if (cachedProducts) return cachedProducts;

  try {
    const manifest = getManifest();
    if (!manifest || !manifest.designs || manifest.designs.length === 0) {
      return [];
    }

    cachedProducts = manifest.designs.map((design) => {
      const artCount = design.artworks?.length || 1;
      const primaryArt = design.artworks?.[0];
      const previewImg = design.previewUrl || primaryArt?.previewUrl || `/api/clothing-designs/${design.id}/preview?type=thumbnail`;
      const isOneRupee = design.id === 'design-001';

      const isHoodie = design.category === 'hoodies';
      const resolvedBasePrice = isOneRupee ? 1 : (isHoodie ? 750 : 600);
      const resolvedSizePrices: Record<string, number> = isOneRupee
        ? { S: 1, M: 1, L: 1, XL: 1, '2XL': 1, XXL: 1, '3XL': 1, XXXL: 1 }
        : isHoodie
        ? { S: 750, M: 750, L: 750, XL: 750, '2XL': 750, XXL: 750, '3XL': 780, XXXL: 780 }
        : { S: 600, M: 600, L: 600, XL: 600, '2XL': 600, XXL: 600, '3XL': 645, XXXL: 645 };

      return {
        id: design.id,
        slug: design.id,
        name: design.name,
        tagline: artCount > 1 ? `${artCount} Artwork Files • 3D Customizer` : '240 GSM Heavyweight Tee',
        description: `Premium graphic design tailored on heavyweight cotton. Click to choose garment cut, approved fabric color, and place in interactive 3D.`,
        categorySlug: isHoodie ? 'hoodies' : 'tees',
        basePrice: resolvedBasePrice,
        customizable: true,
        tags: ['apparel', 'featured', 'clothing-design', ...(design.tags || [])],
        featured: true,
        sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
        sizePrices: resolvedSizePrices,
        variants: [
          {
            id: `v-${design.id}-white`,
            name: 'White',
            color: 'white',
            colorHex: '#FFFFFF',
            price: resolvedBasePrice,
            images: [previewImg],
            inStock: true,
          },
          {
            id: `v-${design.id}-black`,
            name: 'Black',
            color: 'black',
            colorHex: '#111216',
            price: resolvedBasePrice,
            images: [previewImg],
            inStock: true,
          },
        ],
      };
    });

    return cachedProducts;
  } catch (error) {
    console.error('[clothing-products] Failed to map clothing design products:', error);
    return [];
  }
}
