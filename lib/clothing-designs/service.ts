import fs from 'fs';
import path from 'path';
import os from 'os';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getManifest, getDesignById } from './manifest';

export { getManifest, getDesignById };

// Use /tmp on Vercel/serverless environments to prevent read-only filesystem errors
const CACHE_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'clothing-design-previews')
  : path.resolve(process.cwd(), 'storage', 'clothing-design-previews');

let s3Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (s3Client) return s3Client;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 storage credentials not configured');
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return s3Client;
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('R2_BUCKET_NAME not configured');
  return bucket;
}

export async function getPreviewImageStream(
  designId: string,
  type: 'thumbnail' | 'studio',
  artIdOrSurface?: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const design = getDesignById(designId);
  if (!design || !design.artworks || design.artworks.length === 0) return null;

  // Resolve target artwork:
  // 1. By exact artwork ID (e.g. "art-1", "art-2")
  // 2. By suggested placement (e.g. "front", "back", "sleeve")
  // 3. Fallback to defaultArtworkId or first artwork
  let art = design.artworks.find((a) => a.id === artIdOrSurface);
  if (!art && artIdOrSurface) {
    art = design.artworks.find((a) => a.suggestedPlacement === artIdOrSurface);
  }
  if (!art) {
    art = design.artworks.find((a) => a.id === design.defaultArtworkId) || design.artworks[0];
  }

  const primaryFileName = `${type === 'thumbnail' ? 'thumb' : 'studio'}_${art.id}.webp`;
  const legacyFileName = `${type === 'thumbnail' ? 'thumb' : 'studio'}_${art.suggestedPlacement}.webp`;
  
  const localCachePath = path.join(CACHE_DIR, designId, primaryFileName);
  const legacyCachePath = path.join(CACHE_DIR, designId, legacyFileName);

  // 1. Check local derivative cache first for instant millisecond response
  if (fs.existsSync(localCachePath)) {
    try {
      const buffer = fs.readFileSync(localCachePath);
      return { buffer, contentType: 'image/webp' };
    } catch {
      // Fall through
    }
  }

  if (fs.existsSync(legacyCachePath)) {
    try {
      const buffer = fs.readFileSync(legacyCachePath);
      return { buffer, contentType: 'image/webp' };
    } catch {
      // Fall through
    }
  }

  // 2. Stream derivative from private Cloudflare R2
  const r2Key = type === 'thumbnail' ? art.thumbnailObjectKey : art.previewObjectKey;

  try {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: getBucketName(),
      Key: r2Key,
    });

    const response = await client.send(command);
    if (!response.Body) return null;

    // Convert stream to Buffer
    const chunks: Uint8Array[] = [];
    // @ts-expect-error - aws-sdk body is async iterable in Node
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Save to local cache for future queries
    try {
      fs.mkdirSync(path.dirname(localCachePath), { recursive: true });
      fs.writeFileSync(localCachePath, buffer);
    } catch {
      // Cache write error is non-fatal
    }

    return {
      buffer,
      contentType: response.ContentType || 'image/webp',
    };
  } catch (err) {
    console.warn(`[ClothingDesignService] R2 fetch error for ${r2Key}:`, err);
    return null;
  }
}
