import fitz
import json
import os
import sys
import io
import re
import shutil
from PIL import Image, ImageDraw

PDFS = [
    {
        'pdf': 'public/Fashion magazine 1.pdf',
        'slug': 'fashion-1',
        'id': 'tpl_fashion_1',
        'slug_id': 'fashion-magazine-1',
        'name': 'Fashion Magazine 1',
        'category': 'fashion',
        'subcategory': 'Fashion Editorial',
        'badge': 'POPULAR',
    },
    {
        'pdf': 'public/Fashion magazine 2.pdf',
        'slug': 'fashion-2',
        'id': 'tpl_fashion_2',
        'slug_id': 'fashion-magazine-2',
        'name': 'Fashion Magazine 2',
        'category': 'fashion',
        'subcategory': 'Fashion Editorial',
        'badge': 'NEW',
    },
    {
        'pdf': 'public/Girl Birthday Magazine 1.pdf',
        'slug': 'girl-birthday-1',
        'id': 'tpl_girl_birthday_1',
        'slug_id': 'girl-birthday-1',
        'name': 'Girl Birthday Magazine 1',
        'category': 'lifestyle',
        'subcategory': 'Birthday & Celebration',
        'badge': 'NEW',
    },
    {
        'pdf': 'public/Lifesytle magazine 1.pdf',
        'slug': 'lifestyle-1',
        'id': 'tpl_lifestyle_1',
        'slug_id': 'lifestyle-1',
        'name': 'Lifestyle Magazine 1',
        'category': 'lifestyle',
        'subcategory': 'Lifestyle & Wellness',
        'badge': 'NEW',
    },
    {
        'pdf': 'public/Personal Man Magazine 1.pdf',
        'slug': 'personal-man-1',
        'id': 'tpl_personal_man_1',
        'slug_id': 'personal-man-1',
        'name': 'Personal Man Magazine 1',
        'category': 'mens-style',
        'subcategory': "Men's Editorial",
        'badge': 'TRENDING',
    },
]

def map_font_family(font_name):
    fn = (font_name or '').lower()
    if any(s in fn for s in ['serif', 'playfair', 'didot', 'bodoni', 'merriweather', 'garamond', 'times', 'georgia']):
        return 'Playfair Display, serif'
    elif any(s in fn for s in ['mono', 'code', 'courier', 'console']):
        return 'JetBrains Mono, monospace'
    else:
        return 'Inter, sans-serif'

def get_clean_vector_bg(doc, page_num, fg_img_names):
    page = doc[page_num]
    
    # Redact all text
    raw_dict = page.get_text("dict")
    for b in raw_dict.get("blocks", []):
        if b.get("type") == 0:
            for line in b.get("lines", []):
                for span in line.get("spans", []):
                    if span.get("text", "").strip():
                        page.add_redact_annot(fitz.Rect(span["bbox"]), fill=None)
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
    
    # Collect all image names on the page (both pre and post redaction)
    post_img_names = [img[7] for img in page.get_images() if img[7]]
    all_names = list(set(fg_img_names + post_img_names))
    
    # Remove fg images from content streams
    for c_xref in page.get_contents():
        s = doc.xref_stream(c_xref).decode('latin1', errors='ignore')
        for name in all_names:
            s = re.sub(rf'/{name}\s+Do', f'% /{name} Do', s)
        doc.update_stream(c_xref, s.encode('latin1'))
        
    for xobj in page.get_xobjects():
        x_xref = xobj[0]
        try:
            s = doc.xref_stream(x_xref).decode('latin1', errors='ignore')
            for name in all_names:
                s = re.sub(rf'/{name}\s+Do', f'% /{name} Do', s)
            doc.update_stream(x_xref, s.encode('latin1'))
        except Exception:
            pass

    return page.get_pixmap(dpi=150)

def process_pdf(meta):
    pdf_path = meta['pdf']
    slug = meta['slug']
    out_dir = f"public/templates/canva/{slug}"
    url_base = f"/templates/canva/{slug}"

    if os.path.exists(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(out_dir, exist_ok=True)

    print(f"[{slug}] Opening {pdf_path}...")
    doc_raw = fitz.open(pdf_path)

    pages_data = []

    for page_num in range(len(doc_raw)):
        doc_clean = fitz.open(pdf_path)
        page_raw = doc_raw[page_num]

        page_width = page_raw.rect.width
        page_height = page_raw.rect.height

        raw_dict = page_raw.get_text("dict")
        elements = []

        # ── 1. Analyze Images on Page ──
        img_blocks = [b for b in raw_dict.get("blocks", []) if b.get("type") == 1]
        page_images_list = page_raw.get_images()

        full_bleed_block = None
        fg_blocks = []

        for idx, img_block in enumerate(img_blocks):
            rect = fitz.Rect(img_block["bbox"])
            w_pct = (rect.width / page_width) * 100
            h_pct = (rect.height / page_height) * 100
            x_pct = (rect.x0 / page_width) * 100
            y_pct = (rect.y0 / page_height) * 100

            is_full_page_bg = (w_pct >= 99.0 and h_pct >= 99.0 and x_pct <= 1.0 and y_pct <= 1.0)
            if is_full_page_bg and full_bleed_block is None:
                full_bleed_block = (idx, img_block)
            else:
                fg_blocks.append((idx, img_block, x_pct, y_pct, w_pct, h_pct))

        # ── 2. Save and Add Foreground Images (Movable, Editable) ──
        fg_image_names = []
        for fg_i, (idx, img_block, x_pct, y_pct, w_pct, h_pct) in enumerate(fg_blocks):
            if idx < len(page_images_list):
                img_info = page_images_list[idx]
                xref = img_info[0]
                smask = img_info[1]
                name = img_info[7]
                fg_image_names.append(name)

                pix = fitz.Pixmap(doc_raw, xref)
                if smask > 0:
                    mask = fitz.Pixmap(doc_raw, smask)
                    pix = fitz.Pixmap(pix, mask)
                ext = "png" if pix.alpha else ("jpg" if img_info[8] == 'DCTDecode' else "png")
            else:
                ext = img_block.get("ext", "png")
                raw_bytes = img_block["image"]
                pix = fitz.Pixmap(raw_bytes)
                if ext not in ["png", "jpg", "jpeg"]:
                    ext = "png"

            img_filename = f"page_{page_num}_img_{idx}.{ext}"
            img_out_path = os.path.join(out_dir, img_filename)
            img_url = f"{url_base}/{img_filename}"

            pix.save(img_out_path)

            elements.append({
                "id": f"p{page_num}-img-{idx}",
                "type": "image",
                "name": f"Image Element {fg_i + 1}",
                "frame": {
                    "x": round(x_pct, 2),
                    "y": round(y_pct, 2),
                    "width": round(w_pct, 2),
                    "height": round(h_pct, 2),
                    "zIndex": 10 + fg_i,
                },
                "content": img_url,
                "imageStyle": { "objectFit": "cover" },
                "isReplaceable": True,
                "isEditable": True,
                "replaceable": True,
                "editable": True,
                "locked": False,
                "placeholderKey": "image-placeholder",
            })

        # ── 3. Page Background Generation (Clean & Separated) ──
        bg_filename = f"page_{page_num}_bg.png"
        bg_out_path = os.path.join(out_dir, bg_filename)
        bg_url = f"{url_base}/{bg_filename}"

        if full_bleed_block is not None:
            fb_idx, fb_block = full_bleed_block
            fb_img = Image.open(io.BytesIO(fb_block["image"])).convert("RGB")
            
            # Fashion-1 Page 0: Clean out the man and barcode baked into the background
            if slug == 'fashion-1' and page_num == 0:
                w_img, h_img = fb_img.size
                corner_color = (219, 218, 214) # Clean paper studio backdrop
                draw = ImageDraw.Draw(fb_img)
                for (_, b, _, _, _, _) in fg_blocks:
                    r = fitz.Rect(b["bbox"])
                    x0 = max(0, int(r.x0 / page_width * w_img) - 4)
                    y0 = max(0, int(r.y0 / page_height * h_img) - 4)
                    x1 = min(w_img, int(r.x1 / page_width * w_img) + 4)
                    y1 = min(h_img, int(r.y1 / page_height * h_img) + 4)
                    draw.rectangle([x0, y0, x1, y1], fill=corner_color)
            
            fb_img.save(bg_out_path)
        else:
            pix_bg = get_clean_vector_bg(doc_clean, page_num, fg_image_names)
            pix_bg.save(bg_out_path)

        elements.insert(0, {
            "id": f"p{page_num}-bg",
            "type": "image",
            "name": f"Page Background",
            "frame": { "x": 0, "y": 0, "width": 100, "height": 100, "zIndex": 0 },
            "content": bg_url,
            "imageStyle": { "objectFit": "cover" },
            "isReplaceable": True,
            "isEditable": True,
            "replaceable": True,
            "editable": True,
            "locked": False,
            "placeholderKey": "background-image",
        })

        # ── 4. Process Text Blocks ──
        text_blocks = [b for b in raw_dict.get("blocks", []) if b.get("type") == 0]
        for b_idx, block in enumerate(text_blocks):
            lines_text = []
            first_span = None

            for line in block.get("lines", []):
                span_texts = []
                for span in line.get("spans", []):
                    if not first_span and span.get("text", "").strip():
                        first_span = span
                    t = span.get("text", "")
                    t = t.replace('\x00', '').replace('\u2019', "'").replace('\u2018', "'")
                    t = t.replace('\u201c', '"').replace('\u201d', '"').replace('\u2014', ' - ')
                    span_texts.append(t)
                line_str = "".join(span_texts).strip()
                if line_str:
                    lines_text.append(line_str)

            if not lines_text or not first_span:
                continue

            full_text = "\n".join(lines_text)
            r = fitz.Rect(block["bbox"])
            x_pct = (r.x0 / page_width) * 100
            y_pct = (r.y0 / page_height) * 100
            w_pct = (r.width / page_width) * 100
            h_pct = (r.height / page_height) * 100

            font_name = first_span.get("font", "")
            font_size = round(first_span.get("size", 12), 1)
            color_int = first_span.get("color", 0)
            color_hex = f"#{color_int:06x}"
            flags = first_span.get("flags", 0)

            is_bold = (flags & 2 != 0) or any(b in font_name.lower() for b in ["bold", "black", "heavy", "medium"])
            is_italic = (flags & 1 != 0) or ("italic" in font_name.lower())

            elements.append({
                "id": f"p{page_num}-text-{b_idx}",
                "type": "text",
                "name": f"Text Element {b_idx + 1}",
                "frame": {
                    "x": round(x_pct, 2),
                    "y": round(y_pct, 2),
                    "width": round(max(w_pct, 6.0), 2),
                    "height": round(max(h_pct, 2.5), 2),
                    "zIndex": 20 + b_idx,
                },
                "content": full_text,
                "textStyle": {
                    "fontFamily": map_font_family(font_name),
                    "fontSize": font_size,
                    "fontWeight": 700 if is_bold else 400,
                    "fontStyle": "italic" if is_italic else "normal",
                    "color": color_hex,
                    "textAlign": "left",
                },
                "isEditable": True,
                "isReplaceable": True,
                "editable": True,
                "replaceable": True,
                "locked": False,
                "placeholderKey": "text-placeholder",
            })

        # ── 5. Generate Thumbnail.webp for Page 0 Cover Alone ──
        if page_num == 0:
            pix_cover = page_raw.get_pixmap(dpi=150)
            thumb_path = os.path.join(out_dir, "thumbnail.webp")
            cover_img = Image.frombytes("RGB", [pix_cover.width, pix_cover.height], pix_cover.samples)
            cover_img.thumbnail((600, 900), Image.Resampling.LANCZOS)
            cover_img.save(thumb_path, "WEBP", quality=85)
            print(f"[{slug}] Generated cover thumbnail: {thumb_path}")

        pages_data.append({
            "id": f"page-{page_num}",
            "pageNumber": page_num + 1,
            "layoutType": "cover" if page_num == 0 else "blank",
            "title": f"Page {page_num + 1}",
            "backgroundColor": "#FFFFFF",
            "elements": elements,
        })

    template_data = {
        "pages": pages_data
    }
    json_path = os.path.join(out_dir, "canva_template.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(template_data, f, indent=2, ensure_ascii=False)

    print(f"[{slug}] Finished: {len(pages_data)} pages, JSON: {json_path}")
    return pages_data

def to_ts_value(val, indent=0):
    pad = '  ' * indent
    inner_pad = '  ' * (indent + 1)
    if isinstance(val, dict):
        if not val:
            return '{}'
        lines = ['{']
        for k, v in val.items():
            lines.append(f"{inner_pad}{k}: {to_ts_value(v, indent + 1)},")
        lines.append(pad + '}')
        return '\n'.join(lines)
    elif isinstance(val, list):
        if not val:
            return '[]'
        lines = ['[']
        for item in val:
            lines.append(f"{inner_pad}{to_ts_value(item, indent + 1)},")
        lines.append(pad + ']')
        return '\n'.join(lines)
    elif isinstance(val, bool):
        return 'true' if val else 'false'
    elif isinstance(val, (int, float)):
        return str(val)
    elif val is None:
        return 'undefined'
    else:
        escaped = str(val).replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n').replace('\r', '')
        return f"'{escaped}'"

def main():
    print("=== STARTING REBUILD: CLEAN BACKGROUNDS & ZERO DUPLICATE IMAGES ===")
    template_objects = []

    for meta in PDFS:
        pages = process_pdf(meta)
        cover_image = f"/templates/canva/{meta['slug']}/thumbnail.webp"
        tpl_obj = {
            'id': meta['id'],
            'slug': meta['slug_id'],
            'name': meta['name'],
            'category': meta['category'],
            'subcategory': meta['subcategory'],
            'description': 'Custom template created from editorial layout',
            'styleTags': ['editorial', 'magazine', meta['category']],
            'badge': meta['badge'],
            'theme': {
                'id': 'imported-theme',
                'name': 'Editorial Theme',
                'primaryColor': '#000000',
                'secondaryColor': '#666666',
                'accentColor': '#0057FF',
                'backgroundColor': '#FFFFFF',
                'textColor': '#000000',
                'surfaceColor': '#F5F5F5',
                'cardColor': '#FFFFFF',
            },
            'coverImage': cover_image,
            'dimensionKey': 'a4-portrait',
            'pageCount': len(pages),
            'featured': True,
            'spreadPreviews': [],
            'pages': pages,
        }
        template_objects.append(to_ts_value(tpl_obj, 1))

    index_content = (
        "import type { MagazineTemplate } from '@/types/magazine';\n"
        "\n"
        "export const MAGAZINE_TEMPLATES: MagazineTemplate[] = [\n"
        + ',\n'.join(template_objects)
        + ',\n];\n'
    )

    with open("data/magazineTemplates/index.ts", "w", encoding="utf-8") as f:
        f.write(index_content)

    print(f"=== ALL DONE! data/magazineTemplates/index.ts written ({len(index_content):,} bytes) ===")

if __name__ == '__main__':
    main()
