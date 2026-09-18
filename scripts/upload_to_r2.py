"""
upload_to_r2.py — Bulk upload all StarBy assets to Cloudflare R2.

Uploads:
  public/images/        -> images/
  public/fonts/         -> fonts/
  public/textures/      -> textures/
  public/3d models/     -> 3d-models/
  public/templates/     -> templates/
  public/*.pdf          -> pdfs/

Also exports data/*.ts catalogue files as JSON and uploads to data/ prefix.

Usage:
  python scripts/upload_to_r2.py
  python scripts/upload_to_r2.py --dry-run   # preview what would be uploaded

Requirements:
  pip install boto3 python-dotenv
"""

import os
import sys
import json
import mimetypes
import hashlib
import argparse
from pathlib import Path

# ── Load .env ─────────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass  # dotenv optional if env vars are already set

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
except ImportError:
    print("[ERROR]  boto3 not installed. Run: pip install boto3 python-dotenv")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────
ACCOUNT_ID       = os.environ.get("R2_ACCOUNT_ID", "")
ACCESS_KEY_ID    = os.environ.get("R2_ACCESS_KEY_ID", "")
SECRET_KEY       = os.environ.get("R2_SECRET_ACCESS_KEY", "")
BUCKET           = os.environ.get("R2_BUCKET_NAME", "")
ENDPOINT         = os.environ.get("R2_ENDPOINT", f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com")
PUBLIC_URL       = os.environ.get("NEXT_PUBLIC_R2_PUBLIC_URL", f"https://pub-{ACCOUNT_ID}.r2.dev")

PROJECT_ROOT = Path(__file__).parent.parent
PUBLIC_DIR   = PROJECT_ROOT / "public"

# ── MIME helpers ──────────────────────────────────────────────────────────────
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("model/gltf+json", ".gltf")
mimetypes.add_type("model/gltf-binary", ".glb")
mimetypes.add_type("application/octet-stream", ".bin")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/jpeg", ".jpeg")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("application/pdf", ".pdf")

def get_mime(path: Path) -> str:
    mime, _ = mimetypes.guess_type(str(path))
    return mime or "application/octet-stream"

# ── Upload mappings ───────────────────────────────────────────────────────────
# (local_dir, r2_prefix)
UPLOAD_DIRS = [
    (PUBLIC_DIR / "images",      "images"),
    (PUBLIC_DIR / "fonts",       "fonts"),
    (PUBLIC_DIR / "textures",    "textures"),
    (PUBLIC_DIR / "3d models",   "3d-models"),
    (PUBLIC_DIR / "templates",   "templates"),
]

PDF_UPLOADS = list(PUBLIC_DIR.glob("*.pdf"))


def get_r2_client():
    return boto3.client(
        "s3",
        region_name="auto",
        endpoint_url=ENDPOINT,
        aws_access_key_id=ACCESS_KEY_ID,
        aws_secret_access_key=SECRET_KEY,
    )


def head_object(client, key: str):
    """Return metadata dict if object exists, else None."""
    try:
        return client.head_object(Bucket=BUCKET, Key=key)
    except ClientError as e:
        if e.response["Error"]["Code"] in ("404", "NoSuchKey"):
            return None
        raise


def upload_file(client, local_path: Path, r2_key: str, dry_run=False) -> str:
    """Upload a single file. Returns 'uploaded', 'skipped', or 'dry-run'."""
    if dry_run:
        print(f"  [DRY-RUN] would upload: {r2_key}")
        return "dry-run"

    mime = get_mime(local_path)
    size = local_path.stat().st_size

    # Check if already uploaded with same size
    existing = head_object(client, r2_key)
    if existing and existing.get("ContentLength") == size:
        return "skipped"

    with open(local_path, "rb") as f:
        client.put_object(
            Bucket=BUCKET,
            Key=r2_key,
            Body=f,
            ContentType=mime,
            CacheControl="public, max-age=31536000, immutable",
            Metadata={"uploaded-by": "upload_to_r2.py"},
        )
    return "uploaded"


def upload_directory(client, local_dir: Path, r2_prefix: str, dry_run=False):
    if not local_dir.exists():
        print(f"  [!]  Directory not found, skipping: {local_dir}")
        return 0, 0, 0

    uploaded = skipped = errors = 0
    files = [f for f in local_dir.rglob("*") if f.is_file()]
    print(f"\n📁  {local_dir.name}/ -> r2://{BUCKET}/{r2_prefix}/  ({len(files)} files)")

    for local_path in sorted(files):
        rel = local_path.relative_to(local_dir)
        r2_key = f"{r2_prefix}/{rel.as_posix()}"
        try:
            result = upload_file(client, local_path, r2_key, dry_run)
            if result == "uploaded":
                print(f"  [OK]  {r2_key}")
                uploaded += 1
            elif result == "skipped":
                skipped += 1
            elif result == "dry-run":
                uploaded += 1
        except Exception as e:
            print(f"  [ERROR]  {r2_key} — {e}")
            errors += 1

    return uploaded, skipped, errors


def print_summary(total_uploaded, total_skipped, total_errors, dry_run):
    print("\n" + "─" * 60)
    mode = "[DRY-RUN] " if dry_run else ""
    print(f"  {mode}Upload complete")
    print(f"  Uploaded : {total_uploaded}")
    print(f"  Skipped  : {total_skipped} (already in R2)")
    print(f"  Errors   : {total_errors}")
    print("─" * 60)
    if not dry_run and total_errors == 0:
        print(f"\n  🌐  Public URL base: {PUBLIC_URL}")
        print("  Example: image at images/products/void-tee.webp ->")
        print(f"    {PUBLIC_URL}/images/products/void-tee.webp")


def main():
    parser = argparse.ArgumentParser(description="Upload StarBy assets to Cloudflare R2")
    parser.add_argument("--dry-run", action="store_true", help="Preview without uploading")
    args = parser.parse_args()

    # Validate credentials
    if not all([ACCOUNT_ID, ACCESS_KEY_ID, SECRET_KEY, BUCKET]):
        print("[ERROR]  R2 credentials not found. Check your .env file:")
        print("   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME")
        sys.exit(1)

    print("=" * 60)
    print("  StarBy -> Cloudflare R2 Asset Upload")
    print(f"  Bucket : {BUCKET}")
    print(f"  CDN URL: {PUBLIC_URL}")
    if args.dry_run:
        print("  MODE   : DRY-RUN (no files will be uploaded)")
    print("=" * 60)

    try:
        client = get_r2_client()
        # Verify connection
        client.head_bucket(Bucket=BUCKET)
        print(f"  [OK]  Connected to R2 bucket: {BUCKET}")
    except NoCredentialsError:
        print("[ERROR]  Invalid R2 credentials")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR]  Cannot connect to R2: {e}")
        sys.exit(1)

    total_uploaded = total_skipped = total_errors = 0

    # Upload directories
    for local_dir, r2_prefix in UPLOAD_DIRS:
        u, s, e = upload_directory(client, local_dir, r2_prefix, args.dry_run)
        total_uploaded += u
        total_skipped  += s
        total_errors   += e

    # Upload PDFs
    if PDF_UPLOADS:
        print(f"\n📄  PDFs ({len(PDF_UPLOADS)} files) -> r2://{BUCKET}/pdfs/")
        for pdf_path in PDF_UPLOADS:
            r2_key = f"pdfs/{pdf_path.name}"
            try:
                result = upload_file(client, pdf_path, r2_key, args.dry_run)
                if result == "uploaded":
                    print(f"  [OK]  {r2_key}")
                    total_uploaded += 1
                elif result == "skipped":
                    total_skipped += 1
            except Exception as e:
                print(f"  [ERROR]  {r2_key} — {e}")
                total_errors += 1

    print_summary(total_uploaded, total_skipped, total_errors, args.dry_run)

    if total_errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
