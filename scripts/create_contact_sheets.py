import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

src_dir = Path('public/t_shirt_designs')
out_dir = Path('storage/contact_sheets')
out_dir.mkdir(parents=True, exist_ok=True)

# Grid parameters
COLS = 5
ROWS = 2
CELL_W = 300
CELL_H = 360
SHEET_W = COLS * CELL_W
SHEET_H = ROWS * CELL_H

folders = sorted(
    [f for f in src_dir.iterdir() if f.is_dir()],
    key=lambda x: int(x.name.replace('Design ', '')) if x.name.replace('Design ', '').isdigit() else 999
)

print(f"Creating contact sheets for {len(folders)} designs...")

sheet_idx = 0
for start in range(0, len(folders), COLS * ROWS):
    batch = folders[start:start + (COLS * ROWS)]
    sheet = Image.new('RGB', (SHEET_W, SHEET_H), color=(20, 20, 24))
    draw = ImageDraw.Draw(sheet)

    for i, folder in enumerate(batch):
        col = i % COLS
        row = i // COLS
        x = col * CELL_W
        y = row * CELL_H

        # Find primary image
        img_files = [p for p in folder.iterdir() if p.suffix.lower() in ('.png', '.webp', '.jpg', '.jpeg', '.jfif')]
        if not img_files:
            continue

        # Prefer front or back or first
        primary = next((p for p in img_files if 'front' in p.name.lower()), img_files[0])

        try:
            with Image.open(primary) as im:
                if im.mode not in ('RGB', 'RGBA'):
                    im = im.convert('RGBA')

                # Thumbnail to fit 260x280
                thumb = im.copy()
                thumb.thumbnail((260, 270), Image.Resampling.LANCZOS)

                # Center thumb
                tx = x + (CELL_W - thumb.width) // 2
                ty = y + 10 + (270 - thumb.height) // 2

                if thumb.mode == 'RGBA':
                    sheet.paste(thumb, (tx, ty), thumb)
                else:
                    sheet.paste(thumb, (tx, ty))
        except Exception as e:
            print(f"Error loading {primary}: {e}")

        # Draw border & label
        draw.rectangle([x + 5, y + 5, x + CELL_W - 5, y + CELL_H - 5], outline=(60, 60, 70), width=1)
        label = f"{folder.name} ({len(img_files)} arts)"
        draw.text((x + 15, y + CELL_H - 45), label, fill=(240, 240, 240))
        sub = primary.name[:28]
        draw.text((x + 15, y + CELL_H - 25), sub, fill=(150, 150, 160))

    sheet_path = out_dir / f"sheet_{sheet_idx + 1}.webp"
    sheet.save(sheet_path, 'WEBP', quality=85)
    print(f"Saved {sheet_path} with {len(batch)} designs")
    sheet_idx += 1

print(f"Total contact sheets created: {sheet_idx}")
