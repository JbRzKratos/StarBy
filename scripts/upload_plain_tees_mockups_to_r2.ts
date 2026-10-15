import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'fregorostudios';
const R2_PUBLIC_BASE = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev').replace(/\/+$/, '');

function getAllFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

async function uploadFile(localPath: string, r2Key: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);
  
  // Upload to R2
  const putCmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: r2Key,
    Body: fileBuffer,
    ContentType: 'image/jpeg',
    CacheControl: 'public, max-age=31536000, immutable',
  });
  await client.send(putCmd);
  return `${R2_PUBLIC_BASE}/${r2Key}`;
}

async function main() {
  const baseDir = path.resolve('public/Plain_Tees_mockups');
  if (!fs.existsSync(baseDir)) {
    console.error('Directory not found:', baseDir);
    process.exit(1);
  }

  const allFiles = getAllFiles(baseDir);
  console.log(`Found ${allFiles.length} plain mockups files to upload to R2...`);

  const manifest: Record<string, Record<string, {
    primaryImage: string;
    modelFront: string;
    modelBack: string;
    garmentFront: string;
    garmentBack: string;
    allImages: string[];
  }>> = {};

  const concurrency = 6;
  let index = 0;
  let uploadedCount = 0;

  async function worker() {
    while (index < allFiles.length) {
      const i = index++;
      const localPath = allFiles[i];
      const relPath = path.relative(baseDir, localPath).split(path.sep).join('/');
      const r2Key = `plain-mockups/${relPath}`;

      try {
        const publicUrl = await uploadFile(localPath, r2Key);
        uploadedCount++;
        if (uploadedCount % 15 === 0 || uploadedCount === allFiles.length) {
          console.log(`[${uploadedCount}/${allFiles.length}] Uploaded: ${r2Key}`);
        }

        // Parse path: category / color / filename
        const parts = relPath.split('/');
        const category = parts[0];
        const color = parts[1];
        const filename = parts[2];

        if (!manifest[category]) manifest[category] = {};
        if (!manifest[category][color]) {
          manifest[category][color] = {
            primaryImage: '',
            modelFront: '',
            modelBack: '',
            garmentFront: '',
            garmentBack: '',
            allImages: [],
          };
        }

        manifest[category][color].allImages.push(publicUrl);

        if (filename.includes('01_Model-Front')) {
          manifest[category][color].modelFront = publicUrl;
          manifest[category][color].primaryImage = publicUrl;
        } else if (filename.includes('02_Model-Back')) {
          manifest[category][color].modelBack = publicUrl;
        } else if (filename.includes('07_Garment-Front')) {
          manifest[category][color].garmentFront = publicUrl;
        } else if (filename.includes('08_Garment-Back')) {
          manifest[category][color].garmentBack = publicUrl;
        }
      } catch (err) {
        console.error(`Failed to upload ${localPath}:`, err);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  // Sort allImages in each category/color to maintain 01 to 10 order
  for (const cat of Object.keys(manifest)) {
    for (const col of Object.keys(manifest[cat])) {
      manifest[cat][col].allImages.sort();
      if (!manifest[cat][col].primaryImage && manifest[cat][col].allImages.length > 0) {
        manifest[cat][col].primaryImage = manifest[cat][col].allImages[0];
      }
    }
  }

  // Save manifest to data/plain-mockups-manifest.json
  const manifestPath = path.resolve('data/plain-mockups-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ Successfully uploaded ${uploadedCount} images to R2!`);
  console.log(`✅ Saved R2 mockup manifest to ${manifestPath}`);
}

main().catch(err => {
  console.error('Upload failed:', err);
  process.exit(1);
});
