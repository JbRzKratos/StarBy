/**
 * Cloudflare R2 — Storage client for customer design uploads
 *
 * Uses S3-compatible API via @aws-sdk/client-s3 for pre-signed URLs.
 * All uploads go through pre-signed URLs (browser → R2 directly).
 * All downloads are served via pre-signed URLs (time-limited).
 *
 * NEVER import this from client-side code.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ─── Configuration ──────────────────────────────────────────────────────────

let s3Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (s3Client) return s3Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 storage credentials not configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)',
    );
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3Client;
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('R2_BUCKET_NAME not configured');
  return bucket;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PresignedUploadResult {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
}

export interface PresignedDownloadResult {
  downloadUrl: string;
  expiresIn: number;
}

// ─── Allowed file types ─────────────────────────────────────────────────────

const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'image/tiff',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export function validateDesignFile(
  contentType: string,
  contentLength: number,
): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(contentType)) {
    return {
      valid: false,
      error: `File type "${contentType}" not allowed. Accepted: PNG, JPEG, WEBP, SVG, PDF, TIFF.`,
    };
  }
  if (contentLength > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size ${(contentLength / 1024 / 1024).toFixed(1)} MB exceeds maximum of 50 MB.`,
    };
  }
  return { valid: true };
}

// ─── Generate Pre-signed Upload URL ─────────────────────────────────────────

export async function generatePresignedUploadUrl(
  userId: string,
  fileName: string,
  contentType: string,
): Promise<PresignedUploadResult> {
  const client = getR2Client();
  const bucket = getBucketName();
  const expiresIn = 3600; // 1 hour

  // Generate secure, non-guessable object key
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
  const objectKey = `designs/${userId}/${timestamp}_${randomSuffix}_${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  return { uploadUrl, objectKey, expiresIn };
}

// ─── Generate Pre-signed Download URL ───────────────────────────────────────

export async function generatePresignedDownloadUrl(
  objectKey: string,
  expiresIn = 3600,
): Promise<PresignedDownloadResult> {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });

  const downloadUrl = await getSignedUrl(client, command, { expiresIn });

  return { downloadUrl, expiresIn };
}

// ─── Delete Object ──────────────────────────────────────────────────────────

export async function deleteR2Object(objectKey: string): Promise<void> {
  const client = getR2Client();
  const bucket = getBucketName();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
  );
}

// ─── Upload Buffer ────────────────────────────────────────────────────────────

export async function uploadBufferToR2(
  buffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<{ objectKey: string }> {
  const client = getR2Client();
  const bucket = getBucketName();

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
  const objectKey = `designs/checkout/${timestamp}_${randomSuffix}_${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  return { objectKey };
}

// ─── List Objects ─────────────────────────────────────────────────────────────

export async function listR2Objects(prefix?: string) {
  const client = getR2Client();
  const bucket = getBucketName();

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  });

  const response = await client.send(command);
  return response.Contents || [];
}

// ─── Delete Multiple Objects ──────────────────────────────────────────────────

export async function deleteR2Objects(keys: string[]) {
  if (keys.length === 0) return;
  const client = getR2Client();
  const bucket = getBucketName();

  // AWS S3 allows deleting max 1000 objects per request
  const chunks = [];
  for (let i = 0; i < keys.length; i += 1000) {
    chunks.push(keys.slice(i, i + 1000));
  }

  for (const chunk of chunks) {
    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: chunk.map((key) => ({ Key: key })),
      },
    });
    await client.send(command);
  }
}

// ─── Get Object Buffer ────────────────────────────────────────────────────────

export async function getR2ObjectBuffer(key: string): Promise<Buffer | null> {
  const client = getR2Client();
  const bucket = getBucketName();

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await client.send(command);
    if (response.Body) {
      const byteArray = await response.Body.transformToByteArray();
      return Buffer.from(byteArray);
    }
  } catch (error) {
    console.error(`Error fetching R2 object ${key}:`, error);
  }
  return null;
}
