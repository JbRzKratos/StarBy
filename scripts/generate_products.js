const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const generateProducts = async () => {
  const publicDir = path.join(__dirname, '../public/images/products');
  const heroDir = path.join(__dirname, '../public/images/hero');

  const baseImages = {
    tee: path.join(publicDir, 'eclipse_tee.png'),
    hoodie: path.join(publicDir, 'orbit_hoodie.png'),
    poster: path.join(publicDir, 'monolith_poster.png'),
    skin: path.join(publicDir, 'phantom_skin.png'),
    stationery: path.join(heroDir, 'stationery.png'),
  };

  const newProducts = [];
  let prodIdCounter = 1;

  const categories = [
    {
      type: 'tee',
      cat: 'tees',
      count: 6,
      names: ['Void Tee', 'Eclipse Tee', 'Solar Tee', 'Lunar Tee', 'Nova Tee', 'Zenith Tee'],
      price: 89,
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      type: 'hoodie',
      cat: 'hoodies',
      count: 6,
      names: [
        'Orbit Hoodie',
        'Pulse Hoodie',
        'Core Hoodie',
        'Vanguard Hoodie',
        'Oasis Hoodie',
        'Echo Hoodie',
      ],
      price: 149,
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      type: 'poster',
      cat: 'posters',
      count: 5,
      names: ['Monolith Poster', 'Axiom Poster', 'Nexus Poster', 'Vertex Poster', 'Horizon Poster'],
      price: 49,
      sizes: ['A3', 'A2', 'A1'],
    },
    {
      type: 'poster',
      cat: 'split-posters',
      count: 4,
      names: ['Prism Split', 'Fractal Split', 'Tesseract Split', 'Matrix Split'],
      price: 129,
      sizes: [],
    },
    {
      type: 'skin',
      cat: 'skins',
      count: 10,
      names: [
        'Phantom Skin',
        'Stealth Skin',
        'Aura Skin',
        'Cypher Skin',
        'Void Skin',
        'Spectre Skin',
        'Ghost Skin',
        'Nebula Skin',
        'Flare Skin',
        'Nova Skin',
      ],
      price: 39,
      sizes: [],
    },
    {
      type: 'stationery',
      cat: 'stationery',
      count: 8,
      names: [
        'Chronicle Diary',
        'Atlas Notebook',
        'Cipher Journal',
        'Apex Planner',
        'Lumina Notebook',
        'Nexus Diary',
        'Vertex Journal',
        'Echo Planner',
      ],
      price: 59,
      sizes: [],
    },
    {
      type: 'stationery',
      cat: 'accessories',
      count: 6,
      names: [
        'Signal Keychain',
        'Onyx Keychain',
        'Pulse Keychain',
        'Core Keychain',
        'Aura Keychain',
        'Nexus Keychain',
      ],
      price: 29,
      sizes: [],
    },
    {
      type: 'mug',
      cat: 'mugs-cups',
      count: 8,
      names: [
        'Classic Mug 11oz',
        'Classic Mug 15oz',
        'Magic Mug',
        'Latte Mug',
        'Enamel Camping Mug',
        'Heart Handle Mug',
        'Travel Tumbler',
        'Glass Coffee Cup'
      ],
      filenames: [
        'classic_mug_11oz.png',
        'classic_mug_15oz.png',
        'magic_mug.png',
        'latte_mug.png',
        'enamel_mug.png',
        'heart_mug.png',
        'tumbler.png',
        'glass_mug.png'
      ],
      price: 25,
      sizes: [],
    }
  ];

  for (const group of categories) {
    let image;
    if (group.type !== 'mug') {
      const baseImgPath = baseImages[group.type];
      image = await Jimp.read(baseImgPath);
    }

    for (let i = 0; i < group.count; i++) {
      const slug = group.names[i].toLowerCase().replace(/ /g, '-');
      let filename;
      
      if (group.type === 'mug') {
        filename = group.filenames[i];
      } else {
        filename = `${slug}.png`;
        const hueShift = i * (360 / group.count) + Math.random() * 20; // Unique color
        const newImage = image.clone();
        if (i > 0) {
          // Keep the first one original
          newImage.color([{ apply: 'hue', params: [hueShift] }]);
        }
        const outPath = path.join(publicDir, filename);
        await newImage.writeAsync(outPath);
        console.log(`Generated ${filename}`);
      }

      let pId = `prod_${prodIdCounter.toString().padStart(3, '0')}`;
      if (group.type === 'mug') {
        pId = `prod_m${(i + 1).toString().padStart(2, '0')}`;
      }

      const prod = {
        id: pId,
        slug: slug,
        name: group.names[i],
        tagline: 'Premium personalized item.',
        description: `Premium ${group.names[i].toLowerCase()} tailored for your unique style.`,
        categorySlug: group.cat,
        basePrice: group.price + Math.floor(Math.random() * 3) * 10,
        customizable: Math.random() > 0.3,
        tags: i === 0 ? ['featured', 'bestseller'] : [],
        featured: i === 0 || i === 2,
        sizes: group.sizes,
        variants: [
          {
            id: `v${prodIdCounter}a`,
            name: 'Default',
            color: 'charcoal',
            colorHex: '#0E0E0F',
            price: group.price,
            images: [`/images/products/${filename}`],
            inStock: true,
          },
        ],
      };
      newProducts.push(prod);
      prodIdCounter++;
    }
  }

  // Write new products.ts
  const tsContent = `export interface ProductVariant {
  id: string;
  name: string;
  color: string;
  colorHex: string;
  price: number;
  images: string[];
  inStock: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  categorySlug: string;
  basePrice: number;
  variants: ProductVariant[];
  customizable: boolean;
  tags: string[];
  featured: boolean;
  sizes?: string[];
}

export const products: Product[] = ${JSON.stringify(newProducts, null, 2)};

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}
`;

  fs.writeFileSync(path.join(__dirname, '../data/products.ts'), tsContent);
  console.log('Successfully generated 45 products and updated products.ts');
};

generateProducts().catch(console.error);
