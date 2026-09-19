import fitz
import os

PDFS = [
    {
        'pdf': 'public/Fashion magazine 1.pdf',
        'slug': 'fashion-1',
    },
    {
        'pdf': 'public/Fashion magazine 2.pdf',
        'slug': 'fashion-2',
    },
    {
        'pdf': 'public/Girl Birthday Magazine 1.pdf',
        'slug': 'girl-birthday-1',
    },
    {
        'pdf': 'public/Lifesytle magazine 1.pdf',
        'slug': 'lifestyle-1',
    },
    {
        'pdf': 'public/Personal Man Magazine 1.pdf',
        'slug': 'personal-man-1',
    },
]

def render_pages():
    for item in PDFS:
        pdf_path = item['pdf']
        slug = item['slug']
        out_dir = f"public/templates/canva/{slug}"
        os.makedirs(out_dir, exist_ok=True)

        if not os.path.exists(pdf_path):
            print(f"Skipping {pdf_path}: file not found")
            continue

        print(f"Rendering {pdf_path} to {out_dir}...")
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc[page_num]
            pix = page.get_pixmap(dpi=150)
            out_file = os.path.join(out_dir, f"page_{page_num}_full.png")
            pix.save(out_file)
            print(f"  Page {page_num + 1}/{len(doc)} -> {out_file} ({pix.width}x{pix.height})")
        doc.close()
    print("All pages rendered successfully!")

if __name__ == '__main__':
    render_pages()
