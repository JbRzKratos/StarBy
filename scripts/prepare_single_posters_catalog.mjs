import fs from 'fs';
import path from 'path';

// 1. Read existing artworks-data.ts to extract curated titles
const artText = fs.readFileSync('lib/wall-studio/artworks-data.ts', 'utf8');
const fileToArt = new Map();
const blocks = artText.split(/\{\s*"id":/);

for (const b of blocks.slice(1)) {
  const titleMatch = b.match(/"title":\s*"([^"]+)"/);
  const imgMatch = b.match(/"imageUrl":\s*"([^"]+)"/);
  const themeMatch = b.match(/"themeSlug":\s*"([^"]+)"/);
  const tagsMatch = b.match(/"tags":\s*\[([^\]]+)\]/);
  if (titleMatch && imgMatch) {
    const filename = imgMatch[1].replace(/^\/Posters\//, '');
    let tags = [];
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map(t => t.replace(/["'\s]/g, '')).filter(Boolean);
    }
    fileToArt.set(filename, {
      title: titleMatch[1],
      themeSlug: themeMatch ? themeMatch[1] : '',
      tags,
    });
  }
}

// 2. Read products.json
const catalogPath = path.resolve('public/Single Posters/_catalog/products.json');
const products = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Catchy naming rules
function cleanTitle(raw) {
  if (!raw) return '';
  return raw
    .replace(/^Fregoro_Studios_/i, '')
    .replace(/^httpss\.mj\.run[A-Za-z0-9_-]+_/i, '')
    .replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_\d+)?/gi, '')
    .replace(/~1/g, '')
    .replace(/\.(png|jpg|webp)$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeCatchyTitle(item) {
  const webpName = (item.source_artwork || '').replace(/\.png$/i, '.webp');
  const existingArt = fileToArt.get(webpName);

  let baseTitle = '';
  if (existingArt && existingArt.title && !existingArt.title.startsWith('Fregoro')) {
    baseTitle = existingArt.title;
  } else {
    baseTitle = cleanTitle(item.source_artwork);
  }

  // If title is generic "Extend the existing background into the empty..."
  if (!baseTitle || baseTitle.toLowerCase().includes('extend the existing background')) {
    // Generate a sleek category-specific catchy name
    const seq = item.product_id.split('-')[1] || '01';
    const cat = item.category;
    const THEME_FLAVORS = {
      Marvel: ['Infinity Nexus', 'Heroic Legacy', 'Cosmic Sentinel', 'Vanguard Prime', 'Quantum Edge', 'Stark Archival', 'Multiverse Echo', 'Shadow Web', 'Thunderforge', 'Asgardian Dawn'],
      DC: ['Dark Knight Silhouette', 'Metropolis Zenith', 'Gotham Syndicate', 'Emerald Vanguard', 'Themyscira Oath', 'Speedforce Horizon', 'Arkham Midnight', 'Atlantis Crest'],
      Anime: ['Neo Tokyo Cyber', 'Demon Blade Ascension', 'Titanfall Wall Art', 'Hokage Legacy', 'Jujutsu Cursed Flow', 'Saiyan Zenith', 'Astral Shonen'],
      Cars: ['Apex Predator Turbo', 'Monza Velocity', 'Midnight GT Speciale', 'Nürburgring Edition', 'Carbon Aerodynamic', 'Le Mans Endurance', 'Stuttgart Legend'],
      Bikes: ['Superbike Apex', 'Isle of Man TT Glory', 'Ducati Desmo Rosso', 'Yamaha Factory Racing', 'Trackday Precision', 'MotoGP Slipstream'],
      F1: ['Grand Prix Paddock', 'Silverstone Apex', 'Monaco Chicane', 'Pole Position Velocity', 'Red Bull RB Aero', 'Scuderia Heritage'],
      Football: ['Golden Boot Glory', 'Santiago Bernabéu Night', 'Camp Nou Symphony', 'Balkan Maestro', 'Seleção Samba', 'Champions League Nocturne'],
      Cricket: ['Lord’s Heritage', 'The Master Blaster', 'Cover Drive Majesty', 'Wankhede Roar', 'Sixer in the Sky'],
      Gamers: ['Cyberpunk Neon District', 'Elden Ring Lands Between', 'Witcher White Wolf', 'Ghost of Tsushima Mist', 'Valorant Radiant Clutch', 'Night City Grid'],
      Kollywood: ['Thalaivar Cinematic', 'Rolex Syndicate', 'Master Archival Print', 'Vikram Ghost Mode', 'Leo Bloody Sweet', 'Kaithi Night Run'],
      'Game Of Thrones': ['Iron Throne Dragonfire', 'Winterfell Frost', 'Targaryen Bloodline', 'Night King Solitude', 'Kings Landing Zenith'],
      Interstellar: ['Gargantua Singularity', 'Endurance Deep Orbit', 'Millers Planet Tides', 'Tesseract 5th Dimension'],
      'Breaking Bad': ['Heisenberg Blue Sky', 'Los Pollos Hermanos Empire', 'Albuquerque Desert Lab', 'I Am The Danger'],
      Actress: ['Haute Couture Editorial', 'Velvet Noir Muse', 'Golden Hour Silhouette', 'Chic Studio Portrait', 'Minimalist Vogue'],
      'Cute Photos': ['Golden Retriever Sunshine', 'Doberman Noble Stride', 'Paws & Meadow Serenade', 'Cozy Companion Whisper'],
      'Ben 10': ['Omnitrix Alien Force', 'Hero Generation Matrix', 'Heatblast Inferno', 'Fourarms Titan'],
      Disney: ['Magic Kingdom Nocturne', 'Pixar Nostalgia Glow', 'Wonderland Dreamscape', 'Enchanted Castle Starlight'],
      Music: ['Vinyl Resonance 33RPM', 'Abbey Road Session', 'Sonic Horizon Studio', 'Acoustic Soul Echo'],
    };

    const flavors = THEME_FLAVORS[cat] || ['Collector Print', 'Signature Poster', 'Archival Edition'];
    const idx = (parseInt(seq, 10) || 1) % flavors.length;
    baseTitle = `${cat} — ${flavors[idx]} Vol. ${seq}`;
  }

  // Format with clean title casing
  return baseTitle
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\bOf\b/g, 'of')
    .replace(/\bAnd\b/g, '&')
    .replace(/\bThe\b/g, 'the')
    .replace(/\bIn\b/g, 'in')
    .replace(/\bAt\b/g, 'at')
    .replace(/\bTo\b/g, 'to')
    .replace(/^([a-z])/g, (c) => c.toUpperCase());
}

console.log('Sample Catchy Titles:');
for (const p of products.slice(0, 20)) {
  console.log(`[${p.product_id}] (${p.category}) -> "${makeCatchyTitle(p)}"`);
}
