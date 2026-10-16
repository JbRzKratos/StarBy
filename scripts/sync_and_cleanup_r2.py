import os
import sys
import argparse
import mimetypes
from pathlib import Path
from PIL import Image
import boto3
from dotenv import load_dotenv

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

parser = argparse.ArgumentParser(description="Sync clothing designs to Cloudflare R2 and purge stale keys.")
parser.add_argument("--force", action="store_true", help="Force regenerate and re-upload all files and previews")
args = parser.parse_args()

load_dotenv('.env.local')
load_dotenv('.env')

ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID')
ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID')
SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY')
BUCKET_NAME = os.getenv('R2_BUCKET_NAME')
R2_ENDPOINT = os.getenv('R2_ENDPOINT') or f'https://{ACCOUNT_ID}.r2.cloudflarestorage.com'

if not all([ACCOUNT_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY, BUCKET_NAME]):
    print("Error: Missing R2 environment variables.")
    sys.exit(1)

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
expected_local_cache_files = set()
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

        expected_local_cache_files.add(cache_dir / design_id / f"thumb_{art_id}.webp")
        expected_local_cache_files.add(cache_dir / design_id / f"studio_{art_id}.webp")

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

print(f"Total design folders: {len(folders)}")
print(f"Total current disk image files: {len(artworks_to_sync)}")
print(f"Total expected R2 keys: {len(expected_keys)}")

# 2. Get all current R2 keys under clothing-designs/ with object sizes
print("\nFetching current R2 keys under clothing-designs/...")
paginator = s3.get_paginator('list_objects_v2')
pages = paginator.paginate(Bucket=BUCKET_NAME, Prefix='clothing-designs/')

current_r2_objects = {}
for page in pages:
    for obj in page.get('Contents', []):
        current_r2_objects[obj['Key']] = {
            'size': obj['Size'],
            'last_modified': obj['LastModified']
        }

print(f"Found {len(current_r2_objects)} existing keys in R2.")

unwanted_keys = sorted(list(set(current_r2_objects.keys()) - expected_keys))
print(f"Unwanted/obsolete keys in R2 to delete: {len(unwanted_keys)}")
for uk in unwanted_keys[:10]:
    print(f"  - {uk}")
if len(unwanted_keys) > 10:
    print(f"  ... and {len(unwanted_keys) - 10} more")

# 3. Delete unwanted keys from R2 in batches of 500
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
    print("No unwanted keys to delete in R2.")

# 4. Clean up obsolete local cache files
print("\nChecking for obsolete local cached preview files...")
cleaned_cache_count = 0
for d_dir in cache_dir.iterdir():
    if d_dir.is_dir():
        for cfile in d_dir.iterdir():
            if cfile.is_file() and cfile not in expected_local_cache_files:
                try:
                    cfile.unlink()
                    cleaned_cache_count += 1
                except Exception as e:
                    print(f"  Error deleting stale cache file {cfile}: {e}")
if cleaned_cache_count > 0:
    print(f"Purged {cleaned_cache_count} obsolete local cache files.")
else:
    print("Local preview cache is clean.")

# 5. Generate derivatives and upload missing/updated files
print(f"\nEvaluating artworks to sync (force={args.force})...")
uploaded_orig = 0
uploaded_thumbs = 0
uploaded_studios = 0
skipped_artworks = 0

for item in artworks_to_sync:
    design_id = item['design_id']
    art_id = item['art_id']
    src_path = item['src_path']

    src_stat = src_path.stat()
    src_size = src_stat.st_size
    src_mtime = src_stat.st_mtime

    design_cache = cache_dir / design_id
    design_cache.mkdir(parents=True, exist_ok=True)
    thumb_path = design_cache / f"thumb_{art_id}.webp"
    studio_path = design_cache / f"studio_{art_id}.webp"

    orig_r2 = current_r2_objects.get(item['orig_key'])
    need_orig = args.force or (orig_r2 is None) or (orig_r2['size'] != src_size)

    # Check if local derivatives need regeneration
    need_thumb_gen = (
        args.force
        or need_orig
        or not thumb_path.exists()
        or (thumb_path.stat().st_mtime < src_mtime)
    )
    need_studio_gen = (
        args.force
        or need_orig
        or not studio_path.exists()
        or (studio_path.stat().st_mtime < src_mtime)
    )

    if need_thumb_gen or need_studio_gen:
        print(f"Generating derivatives for {design_id}/{item['file']} ({art_id})...")
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

    # Check if derivatives need uploading to R2
    thumb_r2 = current_r2_objects.get(item['thumb_key'])
    need_thumb_upload = (
        args.force
        or need_thumb_gen
        or (thumb_r2 is None)
        or (thumb_r2['size'] != thumb_path.stat().st_size)
    )

    studio_r2 = current_r2_objects.get(item['studio_key'])
    need_studio_upload = (
        args.force
        or need_studio_gen
        or (studio_r2 is None)
        or (studio_r2['size'] != studio_path.stat().st_size)
    )

    if not (need_orig or need_thumb_upload or need_studio_upload):
        skipped_artworks += 1
        continue

    # Upload original
    if need_orig:
        mime = mimetypes.guess_type(src_path.name)[0] or 'application/octet-stream'
        with open(src_path, 'rb') as f:
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=item['orig_key'],
                Body=f,
                ContentType=mime,
                CacheControl='public, max-age=31536000, immutable'
            )
        uploaded_orig += 1
        print(f"  [OK] Uploaded original: {item['orig_key']} ({src_size} bytes)")

    # Upload thumb
    if need_thumb_upload:
        with open(thumb_path, 'rb') as f:
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=item['thumb_key'],
                Body=f,
                ContentType='image/webp',
                CacheControl='public, max-age=31536000, immutable'
            )
        uploaded_thumbs += 1
        print(f"  [OK] Uploaded thumb: {item['thumb_key']}")

    # Upload studio
    if need_studio_upload:
        with open(studio_path, 'rb') as f:
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=item['studio_key'],
                Body=f,
                ContentType='image/webp',
                CacheControl='public, max-age=31536000, immutable'
            )
        uploaded_studios += 1
        print(f"  [OK] Uploaded studio: {item['studio_key']}")

print(f"\nSync complete!")
print(f"  - Uploaded originals: {uploaded_orig}")
print(f"  - Uploaded thumbnails: {uploaded_thumbs}")
print(f"  - Uploaded studio previews: {uploaded_studios}")
print(f"  - Unchanged & skipped artworks: {skipped_artworks}")

# Final verification
print("\nVerifying final R2 state...")
pages = paginator.paginate(Bucket=BUCKET_NAME, Prefix='clothing-designs/')
final_r2_keys = set()
for page in pages:
    for obj in page.get('Contents', []):
        final_r2_keys.add(obj['Key'])

missing_keys = expected_keys - final_r2_keys
extra_keys = final_r2_keys - expected_keys

print(f"Final total keys in R2 under clothing-designs/: {len(final_r2_keys)}")
print(f"Expected keys: {len(expected_keys)}")
if missing_keys:
    print(f"WARNING: Missing {len(missing_keys)} keys in R2:")
    for k in list(missing_keys)[:10]:
        print(f"  - {k}")
if extra_keys:
    print(f"WARNING: Extra {len(extra_keys)} keys in R2:")
    for k in list(extra_keys)[:10]:
        print(f"  - {k}")

if not missing_keys and not extra_keys:
    print("SUCCESS: R2 is 100% in sync with local t_shirt_designs!")
