#!/usr/bin/env python3
"""
Fregor Studios — Clothing Design Library R2 Ingestion & Derivative Sync
Safely generates browser-safe preview derivatives (WebP) from master artwork,
uploads originals to private R2 storage, and uploads previews to R2.
Idempotent and resumable.
"""

import os
import sys
import json
import argparse
import mimetypes
from pathlib import Path
from PIL import Image
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')
load_dotenv('.env')

ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID')
ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID')
SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY')
BUCKET_NAME = os.getenv('R2_BUCKET_NAME')
R2_ENDPOINT = os.getenv('R2_ENDPOINT') or f'https://{ACCOUNT_ID}.r2.cloudflarestorage.com'

MANIFEST_PATH = Path('lib/clothing-designs/design-manifest.json')
SOURCE_DIR = Path('public/t_shirt_designs')
CACHE_DIR = Path('storage/clothing-design-previews')

THUMB_MAX_SIZE = (600, 600)
STUDIO_MAX_SIZE = (1200, 1200)

def get_s3_client():
    if not (ACCOUNT_ID and ACCESS_KEY_ID and SECRET_ACCESS_KEY and BUCKET_NAME):
        raise RuntimeError("Missing R2 environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)")
    
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=ACCESS_KEY_ID,
        aws_secret_access_key=SECRET_ACCESS_KEY,
        region_name='auto'
    )

def object_exists(s3_client, key):
    try:
        s3_client.head_object(Bucket=BUCKET_NAME, Key=key)
        return True
    except ClientError as e:
        if e.response['Error']['Code'] in ('404', 'NoSuchKey'):
            return False
        raise

def generate_derivatives(src_file: Path, out_dir: Path, surface: str):
    out_dir.mkdir(parents=True, exist_ok=True)
    thumb_path = out_dir / f"thumb_{surface}.webp"
    studio_path = out_dir / f"studio_{surface}.webp"

    with Image.open(src_file) as img:
        # Convert to RGBA if not already
        if img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGBA')

        # 1. Studio Preview (max 1200x1200)
        studio_img = img.copy()
        studio_img.thumbnail(STUDIO_MAX_SIZE, Image.Resampling.LANCZOS)
        studio_img.save(studio_path, 'WEBP', quality=85, method=4)

        # 2. Thumbnail Preview (max 600x600)
        thumb_img = img.copy()
        thumb_img.thumbnail(THUMB_MAX_SIZE, Image.Resampling.LANCZOS)
        thumb_img.save(thumb_path, 'WEBP', quality=80, method=4)

    return thumb_path, studio_path

def sync_designs(dry_run=False, limit=None, force=False):
    if not MANIFEST_PATH.exists():
        print(f"Error: Manifest not found at {MANIFEST_PATH}. Run 'npm run classify' or equivalent first.")
        sys.exit(1)

    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    designs = manifest.get('designs', [])
    if limit:
        designs = designs[:limit]

    print(f"Loaded {len(designs)} designs from manifest.")
    print(f"Target Bucket: {BUCKET_NAME}")
    print(f"Dry Run: {dry_run} | Force Overwrite: {force}")

    s3_client = get_s3_client() if not dry_run else None

    total_uploaded = 0
    total_skipped = 0
    total_derivatives_generated = 0
    errors = []

    for idx, design in enumerate(designs, start=1):
        design_id = design['id']
        folder = design['folder']
        artworks = design.get('artworks', {})

        print(f"[{idx}/{len(designs)}] Processing {design_id} ({folder}) - {design['name']}...")

        for art in artworks:
            art_id = art['id']
            placement = art.get('suggestedPlacement', 'front')
            rel_path = art['originalPath']
            orig_src = SOURCE_DIR / folder / rel_path

            if not orig_src.exists():
                err = f"Original file not found: {orig_src}"
                print(f"  [ERROR] {err}")
                errors.append(err)
                continue

            orig_key = art['originalObjectKey']
            thumb_key = art['thumbnailObjectKey']
            studio_key = art['previewObjectKey']

            # Generate local derivatives
            design_cache_dir = CACHE_DIR / design_id
            thumb_local = design_cache_dir / f"thumb_{art_id}.webp"
            studio_local = design_cache_dir / f"studio_{art_id}.webp"

            if not (thumb_local.exists() and studio_local.exists()) or force:
                try:
                    generate_derivatives(orig_src, design_cache_dir, art_id)
                    total_derivatives_generated += 2

                    # Also copy/save surface aliases (e.g. thumb_front.webp) for legacy fallback
                    if placement in ('front', 'back', 'sleeve'):
                        legacy_thumb = design_cache_dir / f"thumb_{placement}.webp"
                        legacy_studio = design_cache_dir / f"studio_{placement}.webp"
                        if not legacy_thumb.exists() or art_id == design.get('defaultArtworkId'):
                            import shutil
                            shutil.copyfile(thumb_local, legacy_thumb)
                            shutil.copyfile(studio_local, legacy_studio)
                except Exception as e:
                    err = f"Failed to generate derivatives for {orig_src}: {e}"
                    print(f"  [ERROR] {err}")
                    errors.append(err)
                    continue

            if dry_run:
                print(f"  [DRY RUN] Would upload original: {orig_key} ({orig_src.stat().st_size} bytes)")
                print(f"  [DRY RUN] Would upload thumbnail: {thumb_key}")
                print(f"  [DRY RUN] Would upload studio: {studio_key}")
                total_uploaded += 3
                continue

            # Upload Original to Private R2
            try:
                orig_exists = not force and object_exists(s3_client, orig_key)
                if not orig_exists:
                    content_type, _ = mimetypes.guess_type(str(orig_src))
                    content_type = content_type or 'application/octet-stream'
                    s3_client.upload_file(
                        str(orig_src),
                        BUCKET_NAME,
                        orig_key,
                        ExtraArgs={'ContentType': content_type}
                    )
                    total_uploaded += 1
                else:
                    total_skipped += 1

                # Upload Thumbnail
                thumb_exists = not force and object_exists(s3_client, thumb_key)
                if not thumb_exists:
                    s3_client.upload_file(
                        str(thumb_local),
                        BUCKET_NAME,
                        thumb_key,
                        ExtraArgs={'ContentType': 'image/webp'}
                    )
                    total_uploaded += 1
                else:
                    total_skipped += 1

                # Upload Studio Preview
                studio_exists = not force and object_exists(s3_client, studio_key)
                if not studio_exists:
                    s3_client.upload_file(
                        str(studio_local),
                        BUCKET_NAME,
                        studio_key,
                        ExtraArgs={'ContentType': 'image/webp'}
                    )
                    total_uploaded += 1
                else:
                    total_skipped += 1

            except Exception as e:
                err = f"R2 Upload error for {design_id}/{surface}: {e}"
                print(f"  [ERROR] {err}")
                errors.append(err)

    print("\n" + "="*50)
    print("MIGRATION & SYNC SUMMARY")
    print(f"Total Designs Processed: {len(designs)}")
    print(f"Local Derivatives Generated: {total_derivatives_generated}")
    print(f"Objects Uploaded to R2: {total_uploaded}")
    print(f"Objects Skipped (Already Exist): {total_skipped}")
    print(f"Errors Encountered: {len(errors)}")
    if errors:
        for e in errors[:10]:
            print(f" - {e}")
    print("="*50)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Sync Clothing Designs to Cloudflare R2")
    parser.add_argument('--dry-run', action='store_true', help="Simulate execution without uploading")
    parser.add_argument('--force', action='store_true', help="Force re-generation and re-upload")
    parser.add_argument('--limit', type=int, help="Limit number of designs to process")
    args = parser.parse_args()

    sync_designs(dry_run=args.dry_run, limit=args.limit, force=args.force)
