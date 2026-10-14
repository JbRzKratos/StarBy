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

      return {
        id: design.id,
        slug: design.id,
        name: design.name,
        tagline: artCount > 1 ? `${artCount} Artwork Files • 3D Customizer` : '240 GSM Heavyweight Tee',
        description: `Premium graphic design tailored on heavyweight cotton. Click to choose garment cut, approved fabric color, and place in interactive 3D.`,
        categorySlug: design.category === 'hoodies' ? 'hoodies' : 'tees',
        basePrice: design.category === 'hoodies' ? 1499 : 999,
        customizable: true,
        tags: ['apparel', 'featured', 'clothing-design', ...(design.tags || [])],
        featured: true,
        sizes: ['S', 'M', 'L', 'XL', '2XL'],
        variants: [
          {
            id: `v-${design.id}-white`,
            name: 'White',
            color: 'white',
            colorHex: '#FFFFFF',
            price: design.category === 'hoodies' ? 1499 : 999,
            images: [previewImg],
            inStock: true,
          },
          {
            id: `v-${design.id}-black`,
            name: 'Black',
            color: 'black',
            colorHex: '#111216',
            price: design.category === 'hoodies' ? 1499 : 999,
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
