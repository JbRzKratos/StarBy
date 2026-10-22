/**
 * Generates the browser-safe product list for curated clothing designs.
 *
 * `data/products.ts` is imported by client components. It must never pull in
 * the private design manifest (which contains original print object keys), so
 * the mapped Product records are generated into a small JSON file instead.
 *
 * Run automatically by `npm run build` (prebuild) and manually with:
 *   npm run generate:clothing-products
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'lib', 'clothing-designs', 'design-manifest.json');
const outputPath = path.join(root, 'data', 'clothing-design-products.json');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const r2Base = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev'
).replace(/\/+$/, '');

function r2AssetUrl(objectKey) {
  if (!objectKey) return '';
  if (/^https?:\/\//i.test(objectKey)) return objectKey;
  return `${r2Base}/${String(objectKey).replace(/^\/+/, '')}`;
}

const products = (manifest.designs || []).map((design) => {
  const artCount = design.artworks?.length || 1;
  const primaryArt = design.artworks?.[0];
  const previewImg =
    r2AssetUrl(primaryArt?.thumbnailObjectKey) ||
    design.previewUrl ||
    primaryArt?.previewUrl ||
    `/api/clothing-designs/${design.id}/preview?type=thumbnail`;
  const isOneRupee = design.id === 'design-001';
  const isHoodie = design.category === 'hoodies';
  const resolvedBasePrice = isOneRupee ? 1 : isHoodie ? 809 : 639;
  const resolvedSizePrices = isOneRupee
    ? { S: 1, M: 1, L: 1, XL: 1, '2XL': 1, XXL: 1, '3XL': 1, XXXL: 1 }
    : isHoodie
      ? { S: 809, M: 809, L: 809, XL: 809, '2XL': 849, XXL: 849, '3XL': 849, XXXL: 849 }
      : { S: 639, M: 639, L: 639, XL: 639, '2XL': 659, XXL: 659, '3XL': 659, XXXL: 659 };

  return {
    id: design.id,
    slug: design.id,
    name: design.name,
    tagline: artCount > 1 ? `${artCount} Artwork Files • 3D Customizer` : '240 GSM Heavyweight Tee',
    description:
      'Premium graphic design tailored on heavyweight cotton. Click to choose garment cut, approved fabric color, and place in interactive 3D.',
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

fs.writeFileSync(outputPath, `${JSON.stringify(products, null, 2)}\n`, 'utf8');
console.log(`[clothing-products] wrote ${products.length} products to ${path.relative(root, outputPath)}`);
