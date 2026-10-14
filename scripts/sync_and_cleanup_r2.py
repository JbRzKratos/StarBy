import os
import json
import mimetypes
from pathlib import Path
from PIL import Image
import boto3
from dotenv import load_dotenv

load_dotenv('.env.local')
load_dotenv('.env')

ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID')
ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID')
SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY')
BUCKET_NAME = os.getenv('R2_BUCKET_NAME')
R2_ENDPOINT = os.getenv('R2_ENDPOINT') or f'https://{ACCOUNT_ID}.r2.cloudflarestorage.com'

src_dir = Path('public/t_shirt_designs')
cache_dir = Path('storage/clothing-design-previews')
cache_dir.mkdir(parents=True, exist_ok=True)

THUMB_MAX_SIZE = (600, 600)
STUDIO_MAX_SIZE = (1200, 1200)

folders = sorted(
    [f for f in src_dir.iterdir() if f.is_dir()],
    key=lambda x: int(x.name.replace('Design ', '')) if x.name.replace('Design ', '').isdigit() else 999
)

s3 = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=ACCESS_KEY_ID,
    aws_secret_access_key=SECRET_ACCESS_KEY,
    region_name='auto'
)

# 1. Gather all current disk files and their target keys
expected_keys = set()
artworks_to_sync = []

for f in folders:
    num = int(f.name.replace('Design ', ''))
    design_id = f"design-{num:03d}"
    
    files = sorted([
        img for img in f.iterdir()
        if img.suffix.lower() in ('.png', '.webp', '.jpg', '.jpeg', '.jfif')
        and not any(x in img.name.lower() for x in ['mockup', 'preview', 'manifest', 'status', 'readme'])
    ], key=lambda x: x.name)

    for art_idx, img in enumerate(files, start=1):
        art_id = f"art-{art_idx}"
        orig_key = f"clothing-designs/{design_id}/original/{img.name}"
        thumb_key = f"clothing-designs/{design_id}/previews/thumb_{art_id}.webp"
        studio_key = f"clothing-designs/{design_id}/previews/studio_{art_id}.webp"

        expected_keys.add(orig_key)
        expected_keys.add(thumb_key)
        expected_keys.add(studio_key)

        artworks_to_sync.append({
            'design_id': design_id,
            'folder': f.name,
            'art_id': art_id,
            'file': img.name,
            'src_path': img,
            'orig_key': orig_key,
            'thumb_key': thumb_key,
            'studio_key': studio_key
        })

print(f"Total current disk image files: {len(artworks_to_sync)}")
print(f"Total expected R2 keys: {len(expected_keys)}")

# 2. Get all current R2 keys under clothing-designs/
print("\nFetching current R2 keys under clothing-designs/...")
paginator = s3.get_paginator('list_objects_v2')
pages = paginator.paginate(Bucket=BUCKET_NAME, Prefix='clothing-designs/')

current_r2_keys = set()
for page in pages:
    for obj in page.get('Contents', []):
        current_r2_keys.add(obj['Key'])

print(f"Found {len(current_r2_keys)} existing keys in R2.")

unwanted_keys = sorted(list(current_r2_keys - expected_keys))
print(f"Unwanted keys to delete: {len(unwanted_keys)}")

# 3. Delete unwanted keys in batches of 500
if unwanted_keys:
    print(f"\nDeleting {len(unwanted_keys)} unwanted objects from R2...")
    batch_size = 500
    for i in range(0, len(unwanted_keys), batch_size):
        chunk = unwanted_keys[i:i + batch_size]
        delete_payload = {'Objects': [{'Key': k} for k in chunk]}
        res = s3.delete_objects(Bucket=BUCKET_NAME, Delete=delete_payload)
        deleted = len(res.get('Deleted', []))
        print(f"  Deleted batch {i//batch_size + 1}: {deleted} objects.")
    print("Cleanup of unwanted R2 keys complete!")
else:
    print("No unwanted keys to delete.")

# 4. Generate derivatives and upload missing/updated files
print("\nChecking for missing files to upload...")
uploaded_count = 0
skipped_count = 0

for item in artworks_to_sync:
    design_id = item['design_id']
    art_id = item['art_id']
    src_path = item['src_path']

    # Local derivative paths
    design_cache = cache_dir / design_id
    design_cache.mkdir(parents=True, exist_ok=True)
    thumb_path = design_cache / f"thumb_{art_id}.webp"
    studio_path = design_cache / f"studio_{art_id}.webp"

    # Check which of the 3 keys need uploading
    need_orig = item['orig_key'] not in current_r2_keys
    need_thumb = item['thumb_key'] not in current_r2_keys or not thumb_path.exists()
    need_studio = item['studio_key'] not in current_r2_keys or not studio_path.exists()

    if not (need_orig or need_thumb or need_studio):
        skipped_count += 1
        continue

    print(f"Processing {design_id}/{item['file']} ({art_id})...")

    # Generate derivatives if needed
    if need_thumb or need_studio:
        try:
            with Image.open(src_path) as img:
                if img.mode not in ('RGB', 'RGBA'):
                    img = img.convert('RGBA')

                # Studio
                studio_img = img.copy()
                studio_img.thumbnail(STUDIO_MAX_SIZE, Image.Resampling.LANCZOS)
                studio_img.save(studio_path, 'WEBP', quality=85, method=4)

                # Thumb
                thumb_img = img.copy()
                thumb_img.thumbnail(THUMB_MAX_SIZE, Image.Resampling.LANCZOS)
                thumb_img.save(thumb_path, 'WEBP', quality=80, method=4)
        except Exception as e:
            print(f"  Error generating derivatives for {src_path}: {e}")
            continue

    # Upload original
    if need_orig:
        mime = mimetypes.guess_type(src_path.name)[0] or 'application/octet-stream'
        with open(src_path, 'rb') as f:
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=item['orig_key'],
                Body=f,
                ContentType=mime
            )
        uploaded_count += 1
        print(f"  Uploaded original: {item['orig_key']}")

    # Upload thumb
    if item['thumb_key'] not in current_r2_keys or need_thumb:
        with open(thumb_path, 'rb') as f:
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=item['thumb_key'],
                Body=f,
                ContentType='image/webp'
            )
        uploaded_count += 1
        print(f"  Uploaded thumb: {item['thumb_key']}")

    # Upload studio
    if item['studio_key'] not in current_r2_keys or need_studio:
        with open(studio_path, 'rb') as f:
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=item['studio_key'],
                Body=f,
                ContentType='image/webp'
            )
        uploaded_count += 1
        print(f"  Uploaded studio: {item['studio_key']}")

print(f"\nUpload complete! Uploaded {uploaded_count} items, skipped {skipped_count} up-to-date items.")

# Verify final count in R2
pages = paginator.paginate(Bucket=BUCKET_NAME, Prefix='clothing-designs/')
final_r2_keys = set()
for page in pages:
    for obj in page.get('Contents', []):
        final_r2_keys.add(obj['Key'])

print(f"Final total keys in R2 under clothing-designs/: {len(final_r2_keys)}")
print(f"Exact match with expected keys: {final_r2_keys == expected_keys}")
