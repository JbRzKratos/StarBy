import fitz
import json
import os
import uuid

import sys

if len(sys.argv) < 3:
    print("Usage: python generate_template.py <pdf_path> <out_dir>")
    sys.exit(1)

pdf_path = sys.argv[1]
out_dir = sys.argv[2]
doc = fitz.open(pdf_path)
os.makedirs(out_dir, exist_ok=True)

pages_data = []

for page_num in range(len(doc)):
    page = doc[page_num]
    page_width = page.rect.width
    page_height = page.rect.height

    # 1. Extract text and images
    text_instances = page.get_text("dict")
    spans = []
    image_blocks = []
    
    for block in text_instances.get("blocks", []):
        if block.get("type") == 0:  # text
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    if span["text"].strip():
                        spans.append(span)
        elif block.get("type") == 1: # image
            image_blocks.append(block)

    # 2. Add background element
    elements = []
    bg_filename = f"page_{page_num}_bg.png"
    bg_url_dir = out_dir.replace('public', '').replace('\\', '/')
    bg_path = f"{bg_url_dir}/{bg_filename}"
    
    elements.append({
        "id": f"p{page_num}-bg",
        "type": "image",
        "name": "Background Design",
        "frame": { "x": 0, "y": 0, "width": 100, "height": 100, "zIndex": 0 },
        "content": bg_path,
        "imageStyle": { "objectFit": "cover" },
        "isReplaceable": False
    })
    
    # 3. Process images
    for idx, img_block in enumerate(image_blocks):
        bbox = img_block["bbox"]
        rect = fitz.Rect(bbox)
        # Redact image from background
        page.add_redact_annot(rect, fill=None)
        
        x_pct = (rect.x0 / page_width) * 100
        y_pct = (rect.y0 / page_height) * 100
        w_pct = (rect.width / page_width) * 100
        h_pct = (rect.height / page_height) * 100
        
        ext = img_block.get("ext", "png")
        img_filename = f"page_{page_num}_img_{idx}.{ext}"
        img_path = os.path.join(out_dir, img_filename)
        img_url = f"{bg_url_dir}/{img_filename}"
        
        with open(img_path, "wb") as f:
            f.write(img_block["image"])
            
        elements.append({
            "id": f"p{page_num}-img-{idx}",
            "type": "image",
            "name": f"Image {idx}",
            "frame": {
                "x": round(x_pct, 2),
                "y": round(y_pct, 2),
                "width": round(w_pct, 2),
                "height": round(h_pct, 2),
                "zIndex": 5
            },
            "content": img_url,
            "imageStyle": { "objectFit": "cover" },
            "isReplaceable": True,
            "placeholderKey": "image-placeholder"
        })

    # 4. Process text
    for idx, span in enumerate(spans):
        bbox = span["bbox"]
        rect = fitz.Rect(bbox)
        page.add_redact_annot(rect, fill=None)
        
        x_pct = (rect.x0 / page_width) * 100
        y_pct = (rect.y0 / page_height) * 100
        w_pct = (rect.width / page_width) * 100
        h_pct = (rect.height / page_height) * 100
        
        color_int = span["color"]
        color_hex = f"#{color_int:06x}"
        font_size = span["size"]
        
        elements.append({
            "id": f"p{page_num}-text-{idx}",
            "type": "text",
            "name": f"Text Element {idx}",
            "frame": {
                "x": round(x_pct, 2),
                "y": round(y_pct, 2),
                "width": round(w_pct, 2),
                "height": round(h_pct, 2),
                "zIndex": 10
            },
            "content": span["text"],
            "textStyle": {
                "fontFamily": span["font"],
                "fontSize": round(font_size, 1),
                "fontWeight": 400,
                "color": color_hex,
                "textAlign": "left"
            },
            "isEditable": True,
            "isReplaceable": True,
            "placeholderKey": "text-placeholder"
        })
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_PIXELS)
    
    # 3. Render clean page
    pix = page.get_pixmap(dpi=150)
    pix.save(os.path.join(out_dir, bg_filename))
    
    pages_data.append({
        "id": f"page-{page_num}",
        "pageNumber": page_num + 1,
        "layoutType": "cover" if page_num == 0 else "blank",
        "title": f"Page {page_num + 1}",
        "backgroundColor": "#FFFFFF",
        "elements": elements
    })

template_data = {
    "pages": pages_data
}

json_out_path = os.path.join(out_dir, "canva_template.json")
with open(json_out_path, "w") as f:
    json.dump(template_data, f, indent=2)

print(f"Successfully generated {json_out_path} and saved backgrounds.")
