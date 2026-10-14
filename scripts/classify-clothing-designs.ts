import fs from 'fs';
import path from 'path';
import type {
  ClothingDesignEntry,
  ClothingDesignManifest,
  DesignArtworkOption,
  DesignPlacementTarget,
} from '../lib/clothing-designs/types';

const SOURCE_DIR = path.resolve(process.cwd(), 'public', 't_shirt_designs');
const OUTPUT_FILE = path.resolve(process.cwd(), 'lib', 'clothing-designs', 'design-manifest.json');

const EXCLUDED_FILE_PATTERNS = [
  /mockup/i,
  /preview/i,
  /manifest/i,
  /status/i,
  /read-me/i,
  /documentation/i,
  /\.html$/i,
  /\.json$/i,
  /\.txt$/i,
];

const VALID_EXTS = ['.png', '.webp', '.jpg', '.jpeg', '.jfif'];

function isExcludedFile(fileName: string): boolean {
  return EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(fileName));
}

function cleanArtworkLabel(fileName: string): string {
  let label = fileName.replace(/\.[^/.]+$/, '').trim();

  // Normalize common phrases
  if (/^Front \( Left Chest\)$/i.test(label)) return 'Front (Left Chest)';
  if (/^Back \( From collor to full back\)$/i.test(label) || /^Back \( From Collor to full back\)$/i.test(label)) {
    return 'Back (Collar to Full Back)';
  }
  if (/^Sleeve \(on any side bottom\)$/i.test(label)) return 'Sleeve Graphic';
  if (/^Front \( full front only for black tees\)$/i.test(label)) return 'Front (Black Tees)';
  if (/^Front \( full front only for white tees\)$/i.test(label)) return 'Front (White Tees)';
  if (/^Back \( Black tees\)$/i.test(label)) return 'Back (Black Tees)';
  if (/^Back \( white tees\)$/i.test(label)) return 'Back (White Tees)';
  if (/^Front \( Black tees\)$/i.test(label) || /^Front \(Black Tees\)$/i.test(label)) return 'Front (Black Tees)';
  if (/^Front \( White tees\)$/i.test(label) || /^Front \(White Tees\)$/i.test(label)) return 'Front (White Tees)';
  if (/^Sleeve \( Black Tees\)$/i.test(label)) return 'Sleeve (Black Tees)';
  if (/^Sleeve \( White Tees\)$/i.test(label)) return 'Sleeve (White Tees)';
  if (/^Back$/i.test(label)) return 'Back Print';
  if (/^Front$/i.test(label)) return 'Front Print';
  if (/^Front Rotated$/i.test(label)) return 'Front Graphic';
  if (/^Front Bottom$/i.test(label)) return 'Front Bottom Print';
  if (/^Both Front and Back$/i.test(label)) return 'Full Front & Back Set';
  if (/^Toyota-Supra-Logo$/i.test(label)) return 'Toyota Supra Chest Logo';

  // Fallback cleanup
  return label
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectPlacement(fileName: string, idx: number, total: number): DesignPlacementTarget {
  const lower = fileName.toLowerCase();
  if (lower.includes('left chest')) return 'left-chest';
  if (lower.includes('sleeve')) return 'sleeve';
  if (lower.includes('back')) return 'back';
  if (lower.includes('front')) return 'front';

  // If named custom artwork (e.g. logo, illustration)
  if (lower.includes('logo')) return 'left-chest';
  return 'front';
}

function detectColorHint(fileName: string): 'black' | 'white' | 'any' {
  const lower = fileName.toLowerCase();
  if (lower.includes('black tee') || lower.includes('black tees') || lower.includes('only for black')) {
    return 'black';
  }
  if (lower.includes('white tee') || lower.includes('white tees') || lower.includes('only for white')) {
    return 'white';
  }
  return 'any';
}

function cleanTitle(folderName: string, customFileName?: string): string {
  if (customFileName) {
    const base = customFileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]/g, ' ')
      .replace(/tees design/gi, '')
      .replace(/shirt design/gi, '')
      .trim();
    if (base.length > 3 && !/^(front|back|both|sleeve)/i.test(base)) {
      return base.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  const num = parseInt(folderName.replace(/\D/g, ''), 10) || 1;
  return `Design ${String(num).padStart(2, '0')}`;
}

export function generateManifest(): ClothingDesignManifest {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Source directory not found: ${SOURCE_DIR}`);
  }

  const entries = fs.readdirSync(SOURCE_DIR, { withFileTypes: true });
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  folders.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  const designs: ClothingDesignEntry[] = [];
  let totalArtworksCount = 0;

  for (const folder of folders) {
    const folderPath = path.join(SOURCE_DIR, folder);
    const num = parseInt(folder.replace(/\D/g, ''), 10) || 1;
    const designId = `design-${String(num).padStart(3, '0')}`;

    const items = fs.readdirSync(folderPath);
    const rootFiles = items.filter((it) => {
      const full = path.join(folderPath, it);
      return (
        fs.statSync(full).isFile() &&
        VALID_EXTS.includes(path.extname(it).toLowerCase()) &&
        !isExcludedFile(it)
      );
    });

    // Check for Splited or Seperated subdirectories if root files are empty
    let filesToProcess: { fileName: string; relPath: string }[] = rootFiles.map((f) => ({
      fileName: f,
      relPath: f,
    }));

    if (filesToProcess.length === 0) {
      for (const splitDir of ['Splited', 'Seperated']) {
        const spPath = path.join(folderPath, splitDir);
        if (fs.existsSync(spPath) && fs.statSync(spPath).isDirectory()) {
          const subFiles = fs.readdirSync(spPath);
          for (const sf of subFiles) {
            if (VALID_EXTS.includes(path.extname(sf).toLowerCase()) && !isExcludedFile(sf)) {
              filesToProcess.push({ fileName: sf, relPath: path.join(splitDir, sf).replace(/\\/g, '/') });
            }
          }
        }
      }
    }

    let customNamedFile: string | undefined;
    const artworkOptions: DesignArtworkOption[] = [];

    // Sort files logically: Front first, then Left Chest, Back, Sleeve
    filesToProcess.sort((a, b) => {
      const order = (name: string) => {
        const l = name.toLowerCase();
        if (l.includes('front ( left chest)')) return 1;
        if (l.includes('front')) return 2;
        if (l.includes('back')) return 3;
        if (l.includes('sleeve')) return 4;
        return 5;
      };
      return order(a.fileName) - order(b.fileName);
    });

    for (let i = 0; i < filesToProcess.length; i++) {
      const { fileName, relPath } = filesToProcess[i];
      const artId = `art-${i + 1}`;
      const suggestedPlacement = detectPlacement(fileName, i, filesToProcess.length);
      const colorHint = detectColorHint(fileName);
      const name = cleanArtworkLabel(fileName);

      if (!customNamedFile && !/^(front|back|both|sleeve)/i.test(fileName)) {
        customNamedFile = fileName;
      }

      artworkOptions.push({
        id: artId,
        fileName,
        name,
        suggestedPlacement,
        colorHint,
        originalPath: relPath,
        originalObjectKey: `clothing-designs/${designId}/original/${fileName}`,
        thumbnailObjectKey: `clothing-designs/${designId}/previews/thumb_${artId}.webp`,
        previewObjectKey: `clothing-designs/${designId}/previews/studio_${artId}.webp`,
        previewUrl: `/api/clothing-designs/${designId}/preview?artId=${artId}&type=thumbnail`,
        studioPreviewUrl: `/api/clothing-designs/${designId}/preview?artId=${artId}&type=studio`,
      });
    }

    totalArtworksCount += artworkOptions.length;

    // Pick default artwork: prefer Front, or Left Chest, else first
    let defaultArt = artworkOptions.find(
      (a) => a.suggestedPlacement === 'front' || a.suggestedPlacement === 'left-chest'
    );
    if (!defaultArt && artworkOptions.length > 0) {
      defaultArt = artworkOptions[0];
    }
    const defaultArtworkId = defaultArt ? defaultArt.id : 'art-1';

    // Backwards compatibility surfaces
    const surfaceSet = new Set<('front' | 'back' | 'sleeve')>();
    artworkOptions.forEach((a) => {
      if (a.suggestedPlacement === 'left-chest' || a.suggestedPlacement === 'front') surfaceSet.add('front');
      else if (a.suggestedPlacement === 'back') surfaceSet.add('back');
      else if (a.suggestedPlacement === 'sleeve') surfaceSet.add('sleeve');
    });
    if (surfaceSet.size === 0) surfaceSet.add('front');

    const availableSurfaces = Array.from(surfaceSet);
    const defaultSurface: 'front' | 'back' = availableSurfaces.includes('front') ? 'front' : 'back';

    const entry: ClothingDesignEntry = {
      id: designId,
      folder,
      name: cleanTitle(folder, customNamedFile),
      category: 'tees',
      tags: ['apparel', 'graphic-tees', 'customizable'],
      artworks: artworkOptions,
      defaultArtworkId,
      defaultSurface,
      availableSurfaces,
      previewUrl: `/api/clothing-designs/${designId}/preview?artId=${defaultArtworkId}&type=thumbnail`,
      studioPreviewUrl: `/api/clothing-designs/${designId}/preview?artId=${defaultArtworkId}&type=studio`,
      status: 'active',
      compatibleGarments: ['regular-t-shirt', 'oversized-t-shirt', 'acid-wash-t-shirt', 'hoodie'],
      createdAt: new Date().toISOString(),
    };

    designs.push(entry);
  }

  const manifest: ClothingDesignManifest = {
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    totalDesigns: designs.length,
    totalArtworks: totalArtworksCount,
    designs,
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(
    `Manifest successfully generated with ${designs.length} designs and ${totalArtworksCount} artworks -> ${OUTPUT_FILE}`
  );
  return manifest;
}

if (process.argv[1]?.includes('classify-clothing-designs')) {
  generateManifest();
}
