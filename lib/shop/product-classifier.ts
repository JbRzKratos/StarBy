import type { Product } from '@/data/products';

export type ProductType = 'plain-tees' | 'tees-designs' | 'posters' | 'split-posters' | 'other';

/**
 * Robust product classifier that categorizes products by structural attributes
 * (ID prefix, categorySlug, tags, and product traits) WITHOUT relying on mutable product names.
 *
 * Even if an administrator renames a product to anything in the Admin Panel,
 * its classification, filtering, and ordering will remain 100% stable and intact.
 */
export function classifyProduct(product: Product): ProductType {
  const id = (product.id || '').toLowerCase();
  const slug = (product.slug || '').toLowerCase();
  const categorySlug = (product.categorySlug || '').toLowerCase();
  const tags = Array.isArray(product.tags) ? product.tags.map((t) => t.toLowerCase()) : [];
  const name = (product.name || '').toLowerCase();

  // 1. Plain Apparel Essentials (Blank Tees & Hoodies)
  // Identified primarily by immutable ID prefix or tags or plain apparel ID list
  const isPlainId =
    id.startsWith('plain_') ||
    id.startsWith('plain-') ||
    id === 'plain_regular_tee' ||
    id === 'plain_oversized_tee' ||
    id === 'plain_acid_wash_tee' ||
    id === 'plain_heavyweight_hoodie';

  const isPlainSlug =
    slug.startsWith('plain-') ||
    slug.startsWith('plain_');

  const hasPlainTag = tags.some((t) =>
    ['plain', 'blank', 'blanks', 'plain-apparel', 'essentials', 'unprinted'].includes(t),
  );

  if (isPlainId || isPlainSlug || hasPlainTag) {
    return 'plain-tees';
  }

  // 2. Curated Clothing Designs (Tees & Hoodie Graphic Artworks / 3D Studio Canvases)
  const isClothingDesignId = id.startsWith('design-') || slug.startsWith('design-');
  const hasClothingDesignTag = tags.some((t) =>
    ['clothing-design', 'clothing-art', 'tee-design', 'apparel-graphic', 'graphic-tee'].includes(t),
  );

  if (isClothingDesignId || hasClothingDesignTag) {
    return 'tees-designs';
  }

  // 3. Split Posters (Multi-panel split wall art)
  const isSplitPosterCat = categorySlug === 'split-posters';
  const isSplitPosterId = id.startsWith('split-poster') || id.startsWith('split-') || slug.startsWith('split-');
  const hasSplitPosterTag = tags.some((t) =>
    ['split-poster', 'split-posters', 'split-art', 'multi-panel', 'triptych'].includes(t),
  );

  if (isSplitPosterCat || isSplitPosterId || hasSplitPosterTag) {
    return 'split-posters';
  }

  // 4. Single Art Posters
  const isPosterCat = categorySlug === 'posters';
  const isPosterId = id.startsWith('poster-') || id.startsWith('poster_') || slug.startsWith('poster');
  const hasPosterTag = tags.some((t) => ['poster', 'posters', 'single-poster'].includes(t));

  if (isPosterCat || isPosterId || hasPosterTag) {
    return 'posters';
  }

  // 5. Apparel fallbacks if category is tees or hoodies but not classified yet
  if (['tees', 'oversized-tees', 'hoodies'].includes(categorySlug)) {
    // If name or tags mention plain/blank, treat as plain-tees
    if (name.includes('plain') || name.includes('blank')) {
      return 'plain-tees';
    }
    // Otherwise treat as graphic design canvas
    return 'tees-designs';
  }

  // 6. Other Active Products (e.g. Magazine, Wall Studio)
  return 'other';
}

/**
 * Strict rank order for catalog display:
 * 1. Plain Tees & Hoodies (Blank essentials)
 * 2. Tees Designs (Graphic artworks for tees & hoodies)
 * 3. Posters (Single art posters)
 * 4. Split Posters (Multi-panel split wall art)
 * 5. Other Active Products
 */
export const PRODUCT_RANK_ORDER: Record<ProductType, number> = {
  'plain-tees': 1,
  'tees-designs': 2,
  'posters': 3,
  'split-posters': 4,
  'other': 5,
};

/**
 * Explicit priority weights for the 4 core plain blank apparel items
 */
const PLAIN_APPAREL_ORDER: Record<string, number> = {
  plain_regular_tee: 1,
  'plain-regular-cotton-tee': 1,
  plain_oversized_tee: 2,
  'plain-oversized-french-terry-tee': 2,
  plain_acid_wash_tee: 3,
  'plain-vintage-acid-wash-tee': 3,
  plain_heavyweight_hoodie: 4,
  'plain-heavyweight-studio-hoodie': 4,
};

/**
 * Sorts catalog products according to rank priority and sorting method.
 */
export function sortCatalogProducts(products: Product[], sortMethod: string): Product[] {
  if (sortMethod === 'price-asc') {
    return [...products].sort((a, b) => a.basePrice - b.basePrice);
  }
  if (sortMethod === 'price-desc') {
    return [...products].sort((a, b) => b.basePrice - a.basePrice);
  }
  if (sortMethod === 'new') {
    return [...products].sort((a, b) => {
      const aIsNew = a.tags?.includes('new') ? 1 : 0;
      const bIsNew = b.tags?.includes('new') ? 1 : 0;
      return bIsNew - aIsNew;
    });
  }

  // Default 'featured' sorting: Group by Rank (Plain Tees -> Tees Designs -> Posters -> Split Posters -> Others)
  return [...products].sort((a, b) => {
    const typeA = classifyProduct(a);
    const typeB = classifyProduct(b);
    const rankA = PRODUCT_RANK_ORDER[typeA];
    const rankB = PRODUCT_RANK_ORDER[typeB];

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // Within Plain Tees rank: sort by canonical essential order (Regular -> Oversized -> Acid Wash -> Hoodie)
    if (typeA === 'plain-tees') {
      const plainOrderA = PLAIN_APPAREL_ORDER[a.id] || PLAIN_APPAREL_ORDER[a.slug] || 99;
      const plainOrderB = PLAIN_APPAREL_ORDER[b.id] || PLAIN_APPAREL_ORDER[b.slug] || 99;
      if (plainOrderA !== plainOrderB) {
        return plainOrderA - plainOrderB;
      }
    }

    // Within same group: prioritize featured products
    const aFeat = a.featured ? 1 : 0;
    const bFeat = b.featured ? 1 : 0;
    return bFeat - aFeat;
  });
}

/**
 * Comprehensive dictionary of everyday synonyms and general words
 * that customers use to search or filter products.
 */
export const GENERAL_KEYWORD_SYNONYMS: Record<string, string[]> = {
  // Tees & Tops
  tee: ['tee', 'tees', 'tshirt', 't-shirt', 'tshirts', 'shirt', 'shirts', 'top', 'tops', 'cotton', 'crewneck', 'apparel', 'clothing'],
  tees: ['tee', 'tees', 'tshirt', 't-shirt', 'tshirts', 'shirt', 'shirts', 'top', 'tops', 'cotton', 'crewneck', 'apparel', 'clothing'],
  tshirt: ['tee', 'tees', 'tshirt', 't-shirt', 'tshirts', 'shirt', 'shirts', 'top', 'apparel'],
  tshirts: ['tee', 'tees', 'tshirt', 't-shirt', 'tshirts', 'shirt', 'shirts', 'top', 'apparel'],
  't-shirt': ['tee', 'tees', 'tshirt', 't-shirt', 'tshirts', 'shirt', 'shirts', 'top', 'apparel'],
  't-shirts': ['tee', 'tees', 'tshirt', 't-shirt', 'tshirts', 'shirt', 'shirts', 'top', 'apparel'],
  shirt: ['tee', 'tees', 'tshirt', 't-shirt', 'shirt', 'shirts', 'apparel', 'top'],
  shirts: ['tee', 'tees', 'tshirt', 't-shirt', 'shirt', 'shirts', 'apparel', 'top'],
  top: ['tee', 'tees', 'tshirt', 'shirt', 'apparel'],
  tops: ['tee', 'tees', 'tshirt', 'shirt', 'apparel'],
  apparel: ['tee', 'tees', 'hoodie', 'hoodies', 'shirt', 'clothing', 'garment', 'wear'],
  clothing: ['tee', 'tees', 'hoodie', 'hoodies', 'shirt', 'apparel', 'garment'],

  // Plain / Blank Essentials
  plain: ['plain', 'blank', 'blanks', 'basic', 'basics', 'solid', 'empty', 'clean', 'raw', 'essential', 'essentials', 'minimal', 'unprinted'],
  blank: ['plain', 'blank', 'blanks', 'basic', 'basics', 'solid', 'empty', 'clean', 'raw', 'essential', 'essentials', 'minimal', 'unprinted'],
  blanks: ['plain', 'blank', 'blanks', 'basic', 'basics', 'solid', 'empty', 'clean', 'raw', 'essential', 'essentials', 'minimal'],
  basic: ['plain', 'blank', 'blanks', 'basic', 'basics', 'solid', 'essential', 'essentials'],
  basics: ['plain', 'blank', 'blanks', 'basic', 'basics', 'solid', 'essential', 'essentials'],
  solid: ['plain', 'blank', 'solid', 'basic', 'clean'],
  empty: ['plain', 'blank', 'empty', 'clean'],
  raw: ['plain', 'blank', 'raw', 'essential'],
  clean: ['plain', 'blank', 'clean', 'minimal'],
  essential: ['plain', 'blank', 'essential', 'essentials', 'basic'],
  essentials: ['plain', 'blank', 'essential', 'essentials', 'basic'],
  unprinted: ['plain', 'blank', 'unprinted'],

  // Fits, GSM & Fabrics
  oversize: ['oversized', 'oversize', 'baggy', 'drop shoulder', 'loose', 'boxy', 'french terry', 'heavyweight', '240 gsm'],
  oversized: ['oversized', 'oversize', 'baggy', 'drop shoulder', 'loose', 'boxy', 'french terry', 'heavyweight', '240 gsm'],
  baggy: ['oversized', 'oversize', 'baggy', 'loose', 'boxy', 'drop shoulder'],
  loose: ['oversized', 'oversize', 'loose', 'baggy'],
  boxy: ['oversized', 'oversize', 'boxy', 'drop shoulder'],
  'drop shoulder': ['oversized', 'oversize', 'drop shoulder', 'french terry', 'boxy'],
  heavy: ['heavyweight', 'heavy', 'gsm', 'french terry', 'combed cotton', '380', '400', '240'],
  heavyweight: ['heavyweight', 'heavy', 'gsm', 'french terry', 'combed cotton', '380', '400', '240'],
  gsm: ['gsm', '180 gsm', '240 gsm', '380 gsm', '400 gsm', 'heavyweight', 'cotton'],
  cotton: ['combed cotton', 'cotton', '180 gsm', '240 gsm', 'french terry'],
  'french terry': ['french terry', 'oversized', '240 gsm', 'heavyweight'],

  // Vintage & Acid Wash
  acid: ['acid wash', 'acid', 'vintage', 'washed', 'mineral wash', 'distressed', 'retro', 'charcoal'],
  'acid wash': ['acid wash', 'acid', 'vintage', 'washed', 'mineral wash', 'distressed', 'retro', 'charcoal'],
  vintage: ['vintage', 'acid wash', 'washed', 'retro', 'distressed', 'mineral wash'],
  washed: ['acid wash', 'vintage', 'washed', 'mineral wash'],
  retro: ['retro', 'vintage', 'acid wash', 'nostalgia'],

  // Hoodies & Sweaters
  hoodie: ['hoodie', 'hoodies', 'sweatshirt', 'sweatshirts', 'pullover', 'fleece', 'winter', 'warmth', 'hood'],
  hoodies: ['hoodie', 'hoodies', 'sweatshirt', 'sweatshirts', 'pullover', 'fleece', 'winter', 'warmth', 'hood'],
  sweatshirt: ['hoodie', 'hoodies', 'sweatshirt', 'sweatshirts', 'pullover'],
  sweatshirts: ['hoodie', 'hoodies', 'sweatshirt', 'sweatshirts', 'pullover'],
  pullover: ['hoodie', 'hoodies', 'sweatshirt', 'pullover'],
  fleece: ['hoodie', 'hoodies', 'fleece', 'sweatshirt'],

  // Art, Graphics & Customizer
  design: ['design', 'designs', 'graphic', 'graphics', 'artwork', 'art', 'print', 'custom', 'customizer', '3d'],
  designs: ['design', 'designs', 'graphic', 'graphics', 'artwork', 'art', 'print', 'custom', 'customizer', '3d'],
  graphic: ['graphic', 'graphics', 'design', 'designs', 'artwork', 'art', 'print', 'illustration', 'canvas'],
  graphics: ['graphic', 'graphics', 'design', 'designs', 'artwork', 'art', 'print', 'illustration', 'canvas'],
  art: ['art', 'artwork', 'graphic', 'poster', 'posters', 'print', 'illustration', 'canvas'],
  artwork: ['art', 'artwork', 'graphic', 'poster', 'posters', 'print', 'illustration', 'canvas'],
  print: ['print', 'prints', 'graphic', 'dtf', 'poster', 'printed'],
  prints: ['print', 'prints', 'graphic', 'dtf', 'poster', 'printed'],
  custom: ['custom', 'customizer', 'customizable', '3d', 'studio', 'personalized'],

  // Posters & Wall Decor
  poster: ['poster', 'posters', 'wall', 'wall art', 'frame', 'framed', 'canvas', 'decor', 'room decor', 'art print'],
  posters: ['poster', 'posters', 'wall', 'wall art', 'frame', 'framed', 'canvas', 'decor', 'room decor', 'art print'],
  wall: ['wall', 'wall art', 'poster', 'posters', 'split-posters', 'frame', 'decor', 'room'],
  'wall art': ['wall', 'wall art', 'poster', 'posters', 'split-posters', 'canvas', 'frame', 'decor'],
  frame: ['frame', 'frames', 'framed', 'poster', 'posters', 'wall art', 'canvas'],
  framed: ['frame', 'frames', 'framed', 'poster', 'posters', 'wall art', 'canvas'],
  canvas: ['canvas', 'wall art', 'poster', 'posters', 'split-posters'],
  decor: ['decor', 'room decor', 'wall art', 'poster', 'posters'],

  // Split Posters
  split: ['split', 'split poster', 'split posters', 'panels', 'multi panel', 'triptych', '3 piece', '5 piece', 'split art'],
  'split poster': ['split', 'split poster', 'split posters', 'panels', 'multi panel', 'triptych', '3 piece', '5 piece'],
  'split posters': ['split', 'split poster', 'split posters', 'panels', 'multi panel', 'triptych', '3 piece', '5 piece'],
  panel: ['split', 'panels', 'multi panel', 'triptych', 'split-posters'],
  panels: ['split', 'panels', 'multi panel', 'triptych', 'split-posters'],
  triptych: ['split', 'split-posters', 'multi panel', 'triptych', '3 piece'],

  // Anime & Manga
  anime: ['anime', 'manga', 'naruto', 'goku', 'dragon ball', 'itachi', 'demon slayer', 'jujutsu', 'sukuna', 'gojo', 'one piece', 'luffy', 'zoro', 'bleach', 'attack on titan', 'death note', 'otaku', 'solo leveling'],
  manga: ['anime', 'manga', 'naruto', 'goku', 'dragon ball', 'jujutsu', 'one piece', 'demon slayer'],
  naruto: ['naruto', 'anime', 'manga', 'itachi', 'sasuke', 'ninja'],
  goku: ['goku', 'dragon ball', 'anime', 'manga', 'saiyan'],
  jujutsu: ['jujutsu', 'gojo', 'sukuna', 'anime', 'manga'],

  // Cars, JDM & Automotive
  car: ['car', 'cars', 'automotive', 'jdm', 'gtr', 'skyline', 'porsche', '911', 'turbo', 'ferrari', 'lamborghini', 'supra', 'drift', 'racing', 'supercar', 'speed', 'bmw'],
  cars: ['car', 'cars', 'automotive', 'jdm', 'gtr', 'skyline', 'porsche', '911', 'turbo', 'ferrari', 'lamborghini', 'supra', 'drift', 'racing', 'supercar', 'speed', 'bmw'],
  automotive: ['automotive', 'car', 'cars', 'jdm', 'racing', 'porsche', 'gtr', 'supercar'],
  jdm: ['jdm', 'car', 'cars', 'skyline', 'gtr', 'supra', 'rx7', 'drift', 'japan', 'automotive'],
  porsche: ['porsche', '911', 'gt3', 'turbo', 'car', 'cars', 'automotive', 'supercar'],
  gtr: ['gtr', 'skyline', 'r34', 'r35', 'jdm', 'car', 'cars', 'automotive', 'nissan'],

  // Football & Sports
  football: ['football', 'soccer', 'ronaldo', 'cr7', 'messi', 'trophy', 'fifa', 'world cup', 'real madrid', 'barcelona', 'manchester', 'ballon dor', 'champion'],
  soccer: ['football', 'soccer', 'ronaldo', 'cr7', 'messi', 'trophy', 'fifa', 'world cup'],
  ronaldo: ['ronaldo', 'cr7', 'football', 'soccer', 'legend', 'real madrid', 'manchester', 'trophy'],
  cr7: ['ronaldo', 'cr7', 'football', 'soccer', 'real madrid', 'trophy'],
  messi: ['messi', 'football', 'soccer', 'barcelona', 'argentina', 'world cup', 'goat'],

  // Superheroes & Comics
  marvel: ['marvel', 'superhero', 'superheroes', 'batman', 'flash', 'spiderman', 'spider-man', 'iron man', 'avengers', 'comics', 'dc', 'joker'],
  superhero: ['superhero', 'superheroes', 'marvel', 'dc', 'batman', 'flash', 'spiderman', 'iron man', 'avengers', 'comics'],
  batman: ['batman', 'dark knight', 'dc', 'superhero', 'gotham', 'joker'],
  flash: ['flash', 'barry allen', 'dc', 'superhero', 'speedster'],
  spiderman: ['spiderman', 'spider-man', 'peter parker', 'marvel', 'superhero'],

  // Aesthetic & Streetwear
  aesthetic: ['aesthetic', 'nature', 'cyberpunk', 'neon', 'minimal', 'japan', 'tokyo', 'streetwear', 'dark', 'urban'],
  streetwear: ['streetwear', 'urban', 'hype', 'drip', 'aesthetic', 'fashion', 'tokyo'],
  minimal: ['minimal', 'minimalist', 'clean', 'simple', 'plain', 'basic'],
  minimalist: ['minimal', 'minimalist', 'clean', 'simple', 'plain', 'basic'],
};

/**
 * Checks whether a given product matches a user search query,
 * matching across name, tagline, description, categorySlug, tags, variant colors,
 * classifier type, and rich semantic keyword expansions.
 */
export function matchesProductSearch(product: Product, query: string): boolean {
  if (!query || !query.trim()) return true;

  const normalized = query.toLowerCase().trim();
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const pName = (product.name || '').toLowerCase();
  const pTagline = (product.tagline || '').toLowerCase();
  const pDesc = (product.description || '').toLowerCase();
  const pCat = (product.categorySlug || '').toLowerCase();
  const pTags = Array.isArray(product.tags) ? product.tags.map((t) => t.toLowerCase()) : [];
  const pType = classifyProduct(product);

  const pVariants = Array.isArray(product.variants)
    ? product.variants.map((v) => `${v.name || ''} ${v.color || ''}`.toLowerCase()).join(' ')
    : '';

  // Combine full searchable text for this product
  const searchableText = `${pName} ${pTagline} ${pDesc} ${pCat} ${pTags.join(' ')} ${pVariants} ${pType}`;

  // Every token in the query must have a match either directly or through synonyms
  return tokens.every((token) => {
    // 1. Direct substring match in any searchable field
    if (searchableText.includes(token)) return true;

    // 2. Expand token using synonym dictionary
    const synonyms = GENERAL_KEYWORD_SYNONYMS[token];
    if (synonyms && synonyms.length > 0) {
      const synMatch = synonyms.some((syn) => {
        if (searchableText.includes(syn)) return true;
        // Direct category/type matching with synonyms
        if (syn === 'plain' || syn === 'blank') return pType === 'plain-tees';
        if (syn === 'tee' || syn === 'tees' || syn === 'shirt' || syn === 'tshirt') {
          return pType === 'plain-tees' || pType === 'tees-designs';
        }
        if (syn === 'poster' || syn === 'posters') return pType === 'posters';
        if (syn === 'split' || syn === 'split-posters') return pType === 'split-posters';
        if (syn === 'hoodie' || syn === 'hoodies') {
          return pCat === 'hoodies' || pTags.includes('hoodies') || pName.includes('hoodie');
        }
        return false;
      });
      if (synMatch) return true;
    }

    // 3. Fallback: check if token matches the classified product type
    if (token === 'plain' || token === 'blank' || token === 'blanks') {
      return pType === 'plain-tees';
    }
    if (token === 'design' || token === 'designs' || token === 'graphic' || token === 'graphics') {
      return pType === 'tees-designs';
    }
    if (token === 'poster' || token === 'posters') {
      return pType === 'posters';
    }
    if (token === 'split' || token === 'panels') {
      return pType === 'split-posters';
    }

    return false;
  });
}

/**
 * Quick filter presets for instant one-tap filtering on desktop and mobile.
 */
export interface QuickFilterPreset {
  id: string;
  label: string;
  icon?: string;
  badge?: string;
}

export const QUICK_FILTER_PRESETS: QuickFilterPreset[] = [
  { id: 'all', label: 'All Catalog', icon: '✦' },
  { id: 'plain-blanks', label: 'Plain Essentials (Blanks)', icon: '◻', badge: 'Blanks' },
  { id: 'tees-designs', label: 'Tees & Hoodie Graphics', icon: '◈', badge: '3D Canvas' },
  { id: 'posters', label: 'Posters', icon: '▦', badge: 'Wall Art' },
  { id: 'split-posters', label: 'Split Posters', icon: '⊞', badge: 'Multi-Panel' },
  { id: 'oversized', label: 'Oversized Fits', icon: '▲' },
  { id: 'hoodies', label: 'Hoodies', icon: '⌂' },
  { id: 'anime', label: 'Anime & Manga', icon: '✧' },
  { id: 'automotive', label: 'Cars & JDM', icon: '⚙' },
  { id: 'football', label: 'Football & Sports', icon: '◎' },
  { id: 'marvel', label: 'Superheroes', icon: '🛡' },
  { id: 'vintage', label: 'Vintage Washed', icon: '↺' },
];

/**
 * Filters a list of products by a quick filter preset.
 */
export function filterByPreset(products: Product[], presetId: string): Product[] {
  if (!presetId || presetId === 'all') return products;

  switch (presetId) {
    case 'plain-blanks':
      return products.filter((p) => classifyProduct(p) === 'plain-tees');
    case 'tees-designs':
      return products.filter((p) => classifyProduct(p) === 'tees-designs');
    case 'posters':
      return products.filter((p) => classifyProduct(p) === 'posters');
    case 'split-posters':
      return products.filter((p) => classifyProduct(p) === 'split-posters');
    case 'oversized':
      return products.filter(
        (p) =>
          p.tags?.includes('oversized') ||
          p.categorySlug === 'oversized-tees' ||
          p.name?.toLowerCase().includes('oversized') ||
          p.tagline?.toLowerCase().includes('oversized') ||
          p.id === 'plain_oversized_tee',
      );
    case 'hoodies':
      return products.filter(
        (p) =>
          p.categorySlug === 'hoodies' ||
          p.tags?.includes('hoodies') ||
          p.name?.toLowerCase().includes('hoodie') ||
          p.id === 'plain_heavyweight_hoodie',
      );
    case 'anime':
      return products.filter((p) => matchesProductSearch(p, 'anime manga'));
    case 'automotive':
      return products.filter((p) => matchesProductSearch(p, 'car automotive jdm'));
    case 'football':
      return products.filter((p) => matchesProductSearch(p, 'football soccer ronaldo'));
    case 'marvel':
      return products.filter((p) => matchesProductSearch(p, 'marvel superhero batman flash'));
    case 'vintage':
      return products.filter((p) => matchesProductSearch(p, 'vintage acid wash'));
    default:
      return products.filter((p) => matchesProductSearch(p, presetId));
  }
}
