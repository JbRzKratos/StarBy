import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET_NAME || 'fregorostudios';
const ENDPOINT = process.env.R2_ENDPOINT || `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;
const PUBLIC_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || `https://pub-${ACCOUNT_ID}.r2.dev`;

if (!ACCESS_KEY_ID || !SECRET_KEY) {
  console.error('Missing R2 credentials in environment.');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_KEY,
  },
});

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.webp': return 'image/webp';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.json': return 'application/json';
    default: return 'application/octet-stream';
  }
}

// Gather all files
const uploadQueue = [];

// 1. Single Posters
const singlePostersDir = path.resolve('public/Single Posters');
function walkSinglePosters(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '_catalog') {
        walkSinglePosters(fullPath);
      }
    } else if (/\.(webp|png|jpg|jpeg)$/i.test(entry.name)) {
      const relPath = path.relative(singlePostersDir, fullPath).replace(/\\/g, '/');
      const r2Key = `single-posters/${relPath}`;
      uploadQueue.push({
        localPath: fullPath,
        r2Key,
        mime: getMime(fullPath),
        size: fs.statSync(fullPath).size,
      });
    }
  }
}
walkSinglePosters(singlePostersDir);

// 2. Wall Studio Posters
const wallPostersDir = path.resolve('public/Posters');
if (fs.existsSync(wallPostersDir)) {
  const entries = fs.readdirSync(wallPostersDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() && /\.(webp|png|jpg|jpeg)$/i.test(entry.name)) {
      const fullPath = path.join(wallPostersDir, entry.name);
      const r2Key = `posters/${entry.name}`;
      uploadQueue.push({
        localPath: fullPath,
        r2Key,
        mime: getMime(fullPath),
        size: fs.statSync(fullPath).size,
      });
    }
  }
}

console.log(`=======================================================`);
console.log(`TOTAL FILES TO UPLOAD: ${uploadQueue.length}`);
const totalBytes = uploadQueue.reduce((acc, f) => acc + f.size, 0);
console.log(`TOTAL PAYLOAD SIZE: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`BUCKET: ${BUCKET}`);
console.log(`PUBLIC CDN BASE: ${PUBLIC_BASE}`);
console.log(`=======================================================\n`);

let completed = 0;
let skipped = 0;
let uploaded = 0;
let failed = 0;
let uploadedBytes = 0;

const CONCURRENCY = 20;

async function checkExists(key, size) {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return head.ContentLength === size;
  } catch (err) {
    return false;
  }
}

async function uploadFile(item) {
  try {
    const alreadyThere = await checkExists(item.r2Key, item.size);
    if (alreadyThere) {
      skipped++;
      completed++;
      return;
    }

    const fileStream = fs.createReadStream(item.localPath);
    await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: item.r2Key,
      Body: fileStream,
      ContentType: item.mime,
      CacheControl: 'public, max-age=31536000, immutable',
    }));

    uploaded++;
    completed++;
    uploadedBytes += item.size;
  } catch (err) {
    failed++;
    completed++;
    console.error(`[FAIL] ${item.r2Key}: ${err.message}`);
  }
}

async function runPool() {
  const startTime = Date.now();
  let index = 0;

  async function worker() {
    while (index < uploadQueue.length) {
      const current = uploadQueue[index++];
      await uploadFile(current);
      if (completed % 50 === 0 || completed === uploadQueue.length) {
        const elapsedSec = (Date.now() - startTime) / 1000;
        const percent = ((completed / uploadQueue.length) * 100).toFixed(1);
        const mbUploaded = (uploadedBytes / 1024 / 1024).toFixed(1);
        console.log(`Progress: ${completed}/${uploadQueue.length} (${percent}%) | Uploaded: ${uploaded} (${mbUploaded}MB), Skipped: ${skipped}, Failed: ${failed} | ${elapsedSec.toFixed(0)}s`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=======================================================`);
  console.log(`UPLOAD COMPLETE in ${durationSec}s!`);
  console.log(`Total: ${completed} | Uploaded: ${uploaded} | Skipped: ${skipped} | Failed: ${failed}`);
  console.log(`=======================================================`);
}

runPool().catch(console.error);
