import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';

// 1. Read existing artworks-data.ts for mapped curated titles
const artText = fs.readFileSync('lib/wall-studio/artworks-data.ts', 'utf8');
const fileToArt = new Map();
const blocks = artText.split(/\{\s*"id":/);

for (const b of blocks.slice(1)) {
  const titleMatch = b.match(/"title":\s*"([^"]+)"/);
  const imgMatch = b.match(/"imageUrl":\s*"([^"]+)"/);
  const themeMatch = b.match(/"themeSlug":\s*"([^"]+)"/);
  const tagsMatch = b.match(/"tags":\s*\[([^\]]+)\]/);
  if (titleMatch && imgMatch) {
    const filename = imgMatch[1].replace(/^https:\/\/[^/]+\/posters\//, '').replace(/^\/Posters\//, '');
    let tags: string[] = [];
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map((t) => t.replace(/["'\s]/g, '')).filter(Boolean);
    }
    fileToArt.set(decodeURIComponent(filename), {
      title: titleMatch[1],
      themeSlug: themeMatch ? themeMatch[1] : '',
      tags,
    });
  }
}

const TRUNCATED_REPLACEMENTS: [RegExp, string][] = [
  [/\bStanding On An Ancient Und\b/gi, 'Ancient Atlantis Sanctum'],
  [/\bStanding On Ruins of An En\b/gi, 'Ruins of Ancient Atlantis'],
  [/\bStanding Alone On A Rain Soaked Gothic R\b/gi, 'Rain-Soaked Gothic Rooftop'],
  [/\bStanding On Gothams Highest Rooftop Duri\b/gi, 'Midnight Watch over Gotham'],
  [/\bStanding Center Left in A W\b/gi, 'Cybernetic Nexus Chamber'],
  [/\bStanding Inside A Futuristi\b/gi, 'Futuristic High-Tech Sanctum'],
  [/\bPlaying Toge\b/gi, 'Playing in the Sun Meadow'],
  [/\bHeisenberg 4K Cinematic L\b/gi, 'Heisenberg — Empire Legacy'],
  [/\bHeisenberg 4K Cinematic\b/gi, 'Walter White — The Heisenberg'],
  [/\bStanding On A Sle\b/gi, 'Gothic Gargoyle Perch'],
  [/\bSpider Man Game Character\b/gi, 'Spider-Man — Miles Morales'],
  [/\bMoving Silently Across B\b/gi, 'Nightwing — Gotham Shadows'],
  [/\bPhotorealistic Live Acti\b/gi, 'Nightwing — Shadow Vigilante'],
  [/\bStanding Powerfully On\b/gi, 'Superman — Fortress of Solitude'],
  [/\bAbove Metropolis At Golden Sunr\b/gi, 'Superman — Golden Sunrise Flight'],
  [/\bRunning Directly Toward T\b/gi, 'The Flash — Speedforce Surge'],
  [/\bCriminal Mastermind Standing\b/gi, 'The Joker — Crown Prince of Crime'],
  [/\bInside A Decaying Aban\b/gi, 'The Joker — Abandoned Arkham Asylum'],
  [/\bStanding On A Massive\b/gi, 'Wonder Woman — Themyscira Summit'],
  [/\bWalking Through Ancie\b/gi, 'Wonder Woman — Ancient Temple Gate'],
  [/\bHorizontal Widescreen\b/gi, 'Horizon Cinematic Edition'],
  [/\bVertical Monochrome Re\b/gi, 'Monochrome Noir Tribute'],
  [/\bVertical Minimalist Lu\b/gi, 'Minimalist Luxury Silhouette'],
  [/\bVertical Playful Selfi\b/gi, 'Playful Selfie Memories'],
  [/\bVertical Cinematic Won\b/gi, 'Wonder Woman — Amazonian Grace'],
  [/\bVertical Neymar Jr Fo\b/gi, 'Neymar Jr — Ousadia e Alegria'],
  [/\bVertical Cinematic Ext\b/gi, 'Cinematic World Explorer'],
  [/\bVertical Cinematic Ful\b/gi, 'Full Scale Epic Vision'],
  [/\bCinematic Horizontal M\b/gi, 'Cinematic Masterpiece Horizon'],
  [/\bVertical Editorial Foo\b/gi, 'Pitchside Editorial Hero'],
  [/\bCinematic Photorealist\b/gi, 'Photorealistic Cinematic Horizon'],
  [/\bVertical Cinematic Aut\b/gi, 'Automotive Track Master'],
  [/\bVertical Spider Gwen\b/gi, 'Spider-Gwen — Ghost Spider'],
  [/\bCinematic Widescreen A\b/gi, 'Cinematic Widescreen Apex'],
  [/\bVertical Portrait Shag\b/gi, 'Shaggy & Scooby — Mystery Gang'],
  [/\bWidescreen Justice Lea\b/gi, 'Justice League — United Pantheon'],
  [/\bVertical Full Body Por\b/gi, 'Full Body Heroic Portrait'],
  [/\bWidescreen Cinematic B\b/gi, 'Cinematic Blockbuster Vista'],
  [/\bVertical Illustrated S\b/gi, 'Illustrated Storybook Tale'],
  [/\bVertical Sci Fi Collec\b/gi, 'Interstellar — Deep Space Voyage'],
  [/\bVertical Surreal Cinem\b/gi, 'Interstellar — Surreal Tesseract'],
  [/\bVertical Epic Fantasy\b/gi, 'Epic Fantasy Realm'],
  [/\bZenitsu 3x3 Complete Set\b/gi, 'Zenitsu Agatsuma — Thunder Breathing'],
];

const THEME_CREATIVE_POOLS: Record<string, string[]> = {
  Marvel: [
    'Infinity Nexus', 'Heroic Legacy', 'Cosmic Sentinel', 'Vanguard Prime',
    'Quantum Edge', 'Stark Archival', 'Multiverse Echo', 'Shadow Web',
    'Thunderforge', 'Asgardian Dawn', 'Crimson Hex', 'Vibranium Shield',
    'Web of Shadows', 'Sanctum Sanctorum', 'Midnight Sun', 'Galactic Guardian',
  ],
  DC: [
    'Dark Knight Silhouette', 'Metropolis Zenith', 'Gotham Syndicate',
    'Emerald Vanguard', 'Themyscira Oath', 'Speedforce Horizon',
    'Arkham Midnight', 'Atlantis Crest', 'Red Hood Vigilance', 'Baphomet Vigil',
  ],
  Anime: [
    'Neo Tokyo Cyber', 'Demon Blade Ascension', 'Titanfall Wall Art',
    'Hokage Legacy', 'Jujutsu Cursed Flow', 'Saiyan Zenith', 'Astral Shonen',
    'Chainsaw Echo', 'Survey Corps Horizon',
  ],
  Cars: [
    'Apex Predator Turbo', 'Monza Velocity', 'Midnight GT Speciale',
    'Nürburgring Edition', 'Carbon Aerodynamic', 'Le Mans Endurance',
    'Stuttgart Legend', 'Bologna Bull V12', 'Maranello Scarlet',
  ],
  Bikes: [
    'Superbike Apex', 'Isle of Man TT Glory', 'Ducati Desmo Rosso',
    'Yamaha Factory Racing', 'Trackday Precision', 'MotoGP Slipstream',
    'Kawasaki Ninja Stealth', 'Trophy Lap Lean',
  ],
  F1: [
    'Grand Prix Paddock', 'Silverstone Apex', 'Monaco Chicane',
    'Pole Position Velocity', 'Red Bull RB Aero', 'Scuderia Heritage',
    'Checkered Flag Symphony', 'Eau Rouge Flat Out',
  ],
  Football: [
    'Golden Boot Glory', 'Santiago Bernabéu Night', 'Camp Nou Symphony',
    'Balkan Maestro', 'Seleção Samba', 'Champions League Nocturne',
    'World Cup Legend', 'San Siro Echo',
  ],
  Cricket: [
    'Lord’s Heritage', 'The Master Blaster', 'Cover Drive Majesty',
    'Wankhede Roar', 'Sixer in the Sky', 'Eden Gardens Solitude',
  ],
  Gamers: [
    'Cyberpunk Neon District', 'Elden Ring Lands Between', 'Witcher White Wolf',
    'Ghost of Tsushima Mist', 'Valorant Radiant Clutch', 'Night City Grid',
    'Helldivers Super Earth', 'Spartan Mjolnir Master',
  ],
  Kollywood: [
    'Thalaivar Cinematic', 'Rolex Syndicate', 'Master Archival Print',
    'Vikram Ghost Mode', 'Leo Bloody Sweet', 'Kaithi Night Run',
    'Jailer Muthuvel Pandian', 'Captain Miller Solitude',
  ],
  'Game Of Thrones': [
    'Iron Throne Dragonfire', 'Winterfell Frost', 'Targaryen Bloodline',
    'Night King Solitude', 'Kings Landing Zenith', 'Valyrian Steel',
  ],
  Interstellar: [
    'Gargantua Singularity', 'Endurance Deep Orbit', 'Millers Planet Tides',
    'Tesseract 5th Dimension', 'Stay In The Stars',
  ],
  'Breaking Bad': [
    'Heisenberg Blue Sky', 'Los Pollos Hermanos Empire',
    'Albuquerque Desert Lab', 'I Am The Danger',
  ],
  Actress: [
    'Haute Couture Editorial', 'Velvet Noir Muse', 'Golden Hour Silhouette',
    'Chic Studio Portrait', 'Minimalist Vogue', 'Monochrome Elegance',
  ],
  'Cute Photos': [
    'Golden Retriever Sunshine', 'Doberman Noble Stride',
    'Paws & Meadow Serenade', 'Cozy Companion Whisper', 'Canine Royalty',
  ],
  'Ben 10': [
    'Omnitrix Alien Force', 'Hero Generation Matrix', 'Heatblast Inferno',
    'Fourarms Titan', 'XLR8 Speed Warp', 'Diamondhead Shards',
  ],
  Disney: [
    'Magic Kingdom Nocturne', 'Pixar Nostalgia Glow',
    'Wonderland Dreamscape', 'Enchanted Castle Starlight', 'Neverland Dream',
  ],
  Music: [
    'Vinyl Resonance 33RPM', 'Abbey Road Session',
    'Sonic Horizon Studio', 'Acoustic Soul Echo',
  ],
};

function formatTitle(item: any): string {
  const webpName = (item.source_artwork || '').replace(/\.png$/i, '.webp');
  const existingArt = fileToArt.get(webpName);

  let raw = '';
  if (existingArt && existingArt.title && !existingArt.title.startsWith('Fregoro')) {
    raw = existingArt.title;
  } else {
    raw = (item.source_artwork || '')
      .replace(/^Fregoro_Studios_/i, '')
      .replace(/^httpss\.mj\.run[A-Za-z0-9_-]+_/i, '')
      .replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_\d+)?/gi, '')
      .replace(/~1/g, '')
      .replace(/\.(png|jpg|webp)$/i, '')
      .replace(/_/g, ' ')
      .trim();
  }

  for (const [pattern, replacement] of TRUNCATED_REPLACEMENTS) {
    raw = raw.replace(pattern, replacement);
  }

  if (!raw || raw.toLowerCase().includes('extend the existing background')) {
    const seq = item.product_id.split('-')[1] || '01';
    const num = parseInt(seq, 10) || 1;
    const cat = item.category;
    const pool = THEME_CREATIVE_POOLS[cat] || ['Collector Print', 'Signature Poster'];
    const pick = pool[num % pool.length];
    raw = `${cat}: ${pick} (Edition ${seq})`;
  }

  return raw
    .split(' ')
    .map((w) => {
      const lower = w.toLowerCase();
      if (['of', 'in', 'at', 'to', 'for', 'the', 'a', 'an'].includes(lower)) return lower;
      if (lower === '&' || lower === 'and') return '&';
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ')
    .replace(/^([a-z])/, (c) => c.toUpperCase());
}

export async function syncSinglePostersToDatabase() {
  console.log('🔄 [syncSinglePostersToDatabase] Beginning Single Posters database sync...');

  // 1. Remove old test poster dummy products
  const testIdsToDelete = [
    'prod_013', 'prod_014', 'prod_015', 'prod_016', 'prod_017',
    'prod_018', 'prod_019', 'prod_020', 'prod_021',
    'prod_test_posters', 'prod_test_split_posters',
  ];

  console.log(`🧹 Removing ${testIdsToDelete.length} legacy test dummy products...`);
  // Remove associated variants first (if any)
  await prisma.productVariant.deleteMany({
    where: { productId: { in: testIdsToDelete } },
  });
  await prisma.wishlistItem.deleteMany({
    where: { productId: { in: testIdsToDelete } },
  });
  await prisma.product.deleteMany({
    where: { id: { in: testIdsToDelete } },
  });
  console.log('✅ Cleaned up old test poster and mockup dummy items.');

  // 2. Read Single Posters catalog
  const catalogPath = path.resolve('public/Single Posters/_catalog/products.json');
  const products = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const R2_SINGLE_BASE = 'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/single-posters';

  let addedCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const item = products[i];
    const catchyName = formatTitle(item);

    const heroPath = item.images?.hero?.path;
    const lifestylePath = item.images?.lifestyle?.path;
    const cinematicPath = item.images?.cinematic?.path;

    const imageUrls: string[] = [];
    if (heroPath) imageUrls.push(`${R2_SINGLE_BASE}/${heroPath}`);
    if (lifestylePath) imageUrls.push(`${R2_SINGLE_BASE}/${lifestylePath}`);
    if (cinematicPath) imageUrls.push(`${R2_SINGLE_BASE}/${cinematicPath}`);

    // If hero was missing, fallback to any available
    if (imageUrls.length === 0) {
      if (item.images?.cinematic?.path) {
        imageUrls.push(`${R2_SINGLE_BASE}/${item.images.cinematic.path}`);
      }
    }

    const productId = `poster_${item.product_id}`;
    const slug = `poster-${item.product_id}`;
    const basePrice = 349;

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });

    const isFeatured = i % 15 === 0;

    const tags = [
      'posters',
      item.category_slug,
      item.category.toLowerCase(),
      item.artwork_classification ? item.artwork_classification.toLowerCase().replace(/\s+/g, '-') : 'single-poster',
    ];

    if (existing) {
      // Preserve admin pricing if already customized
      await prisma.product.update({
        where: { id: productId },
        data: {
          name: catchyName,
          slug,
          categorySlug: 'posters',
          tagline: `${item.category} Collector Edition · 300 GSM Archival Print`,
          description: `Museum-grade ${item.category} fine art poster. Printed on 300 GSM heavyweight archival stock with fade-resistant pigment inks. Vibrant contrast, razor-sharp details, and gallery-grade finish.`,
          tags,
          featured: isFeatured,
          sizes: ['A4 (8.3" x 11.7")', 'A3 (11.7" x 16.5")', 'A2 (16.5" x 23.4")', '13" x 19" (Studio)'],
        },
      });

      // Update variant images to R2 URLs
      for (const v of existing.variants) {
        await prisma.productVariant.update({
          where: { id: v.id },
          data: { images: imageUrls },
        });
      }
      updatedCount++;
    } else {
      await prisma.product.create({
        data: {
          id: productId,
          slug,
          name: catchyName,
          categorySlug: 'posters',
          basePrice,
          tagline: `${item.category} Collector Edition · 300 GSM Archival Print`,
          description: `Museum-grade ${item.category} fine art poster. Printed on 300 GSM heavyweight archival stock with fade-resistant pigment inks. Vibrant contrast, razor-sharp details, and gallery-grade finish.`,
          customizable: true,
          featured: isFeatured,
          tags,
          sizes: ['A4 (8.3" x 11.7")', 'A3 (11.7" x 16.5")', 'A2 (16.5" x 23.4")', '13" x 19" (Studio)'],
          variants: {
            create: [
              {
                id: `var_${item.product_id}_matte`,
                name: 'Archival Matte (300 GSM)',
                color: 'Matte Gallery',
                colorHex: '#121214',
                price: basePrice,
                images: imageUrls,
                inStock: true,
                stockQuantity: 100,
                reorderThreshold: 5,
              },
              {
                id: `var_${item.product_id}_lustre`,
                name: 'Metallic Lustre (310 GSM)',
                color: 'Lustre Studio',
                colorHex: '#C45D3E',
                price: basePrice + 100,
                images: imageUrls,
                inStock: true,
                stockQuantity: 100,
                reorderThreshold: 5,
              },
            ],
          },
        },
      });
      addedCount++;
    }

    if ((i + 1) % 50 === 0 || i === products.length - 1) {
      console.log(`Synced ${i + 1}/${products.length} single posters...`);
    }
  }

  console.log(`🎉 [syncSinglePostersToDatabase] Finished! Added: ${addedCount}, Updated: ${updatedCount}, Total: ${products.length}`);
}

// If run directly via node/tsx
if (require.main === module || process.argv[1]?.includes('sync_single_posters')) {
  syncSinglePostersToDatabase()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
