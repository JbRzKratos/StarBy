const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'dc27e0b13ac01c0c736ef7cbc5a86b5b';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '84a7022fe184437af99412443596fcea';
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY || '85b43e06120de36179947b7b1e1e50c6bea1f3309e943f5da2b0a41e8a2569c4';
const BUCKET = process.env.R2_BUCKET_NAME || 'fregorostudios';
const ENDPOINT = process.env.R2_ENDPOINT || `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

const client = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_KEY,
  },
});

const MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.hdr': 'image/vnd.radiance',
  '.json': 'application/json',
};

const DIRS_TO_UPLOAD = [
  { localDir: 'public/3d-assets', r2Prefix: '3d-assets' },
  { localDir: 'public/designs', r2Prefix: 'designs' },
  { localDir: 'public/backgrounds', r2Prefix: 'backgrounds' },
  { localDir: 'public/gobo', r2Prefix: 'gobo' },
];

function getFiles(dir, r2Prefix) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  function walk(currentDir, currentPrefix) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const r2Key = `${currentPrefix}/${entry.name}`.replace(/\\/g, '/');
      if (entry.isDirectory()) {
        walk(fullPath, r2Key);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const stat = fs.statSync(fullPath);
        results.push({
          localPath: fullPath,
          r2Key: r2Key,
          contentType: MIME_MAP[ext] || 'application/octet-stream',
          size: stat.size,
        });
      }
    }
  }

  walk(dir, r2Prefix);
  return results;
}

async function uploadFile(item, index, total) {
  try {
    // Check if file already exists with same size
    try {
      const head = await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: item.r2Key }));
      if (head.ContentLength === item.size) {
        console.log(`[${index + 1}/${total}] Skipped (exists): ${item.r2Key}`);
        return;
      }
    } catch (e) {
      // Not found, proceed to upload
    }

    const fileStream = fs.createReadStream(item.localPath);
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: item.r2Key,
        Body: fileStream,
        ContentType: item.contentType,
        ContentLength: item.size,
      })
    );
    console.log(`[${index + 1}/${total}] Uploaded: ${item.r2Key} (${(item.size / (1024 * 1024)).toFixed(2)} MB)`);
  } catch (err) {
    console.error(`[${index + 1}/${total}] FAILED: ${item.r2Key}`, err.message);
  }
}

async function run() {
  console.log('Collecting files to upload...');
  const allFiles = [];
  for (const item of DIRS_TO_UPLOAD) {
    const files = getFiles(item.localDir, item.r2Prefix);
    allFiles.push(...files);
  }

  const totalSizeMB = (allFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2);
  console.log(`Found ${allFiles.length} files (${totalSizeMB} MB) to upload to R2 bucket "${BUCKET}".`);

  const CONCURRENCY = 8;
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < allFiles.length) {
      const idx = currentIndex++;
      await uploadFile(allFiles[idx], idx, allFiles.length);
    }
  }

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  console.log('All files processed!');
}

run().catch(console.error);
