import json
import re
import sys
import os

if len(sys.argv) < 5:
    print("Usage: python inject_ts.py <json_file> <id> <slug> <name>")
    sys.exit(1)

json_file = sys.argv[1]
tpl_id = sys.argv[2]
tpl_slug = sys.argv[3]
tpl_name = sys.argv[4]

with open(json_file, 'r') as f:
    template_data = json.load(f)

template_data['id'] = tpl_id
template_data['slug'] = tpl_slug
template_data['name'] = tpl_name
template_data['category'] = 'fashion'
template_data['description'] = 'Automatically extracted Canva PDF'
template_data['styleTags'] = ['imported', 'canva']
template_data['theme'] = {
    'id': 'imported-theme',
    'name': 'Imported Theme',
    'primaryColor': '#000000',
    'secondaryColor': '#666666',
    'accentColor': '#0057FF',
    'backgroundColor': '#FFFFFF',
    'textColor': '#000000',
    'surfaceColor': '#F5F5F5',
    'cardColor': '#FFFFFF'
}
# Use the first real image placeholder (not the blanked background) as the cover
pages = template_data.get('pages', [])
cover_image = ''
for page in pages[:1]:  # Only check first page
    for el in page.get('elements', []):
        if el.get('type') == 'image' and el.get('isReplaceable', True) and 'img' in el.get('id', ''):
            cover_image = el.get('content', '')
            break
if not cover_image:
    # Fallback: take any image content from first page elements
    for el in pages[0].get('elements', []) if pages else []:
        if el.get('type') == 'image':
            cover_image = el.get('content', '')
            break
template_data['coverImage'] = cover_image

template_data['dimensionKey'] = 'a4-portrait'
template_data['pageCount'] = len(template_data.get('pages', []))
template_data['featured'] = True
template_data['subcategory'] = 'Fashion Editorial'
template_data['spreadPreviews'] = []

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
        escaped = str(val).replace('\\', '\\\\').replace("'", "\\'")
        return f"'{escaped}'"

ts_obj = to_ts_value(template_data, 1)

# Inject 'theme: PRESET_THEMES[0] || DEFAULT_THEME' as a raw TS expression
# by inserting it after the opening brace of the object
ts_obj = ts_obj.replace(
    "{\n    id: 'tpl_canva_import_1',",
    "{\n    theme: PRESET_THEMES[0] || DEFAULT_THEME,\n    id: 'tpl_canva_import_1',",
    1
)

ts_path = 'data/magazineTemplates/index.ts'
with open(ts_path, 'r', encoding='utf-8') as f:
    content = f.read()

target_str = 'export const MAGAZINE_TEMPLATES: MagazineTemplate[] = ['
if target_str in content:
    insert_idx = content.index(target_str) + len(target_str)
    new_content = content[:insert_idx] + '\n  ' + ts_obj + ',' + content[insert_idx:]
    
    with open(ts_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Done! Template injected as valid TypeScript.")
else:
    print("ERROR: Could not find MAGAZINE_TEMPLATES array.")
