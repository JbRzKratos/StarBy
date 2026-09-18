"""
Fix products.ts and other data files to use R2 CDN URLs
instead of local /public/ paths.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent

R2_BASE = "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev"


def fix_file_with_helper(filepath: Path):
    """Replace '/images/...' with getR2AssetUrl('images/...') and add import."""
    content = filepath.read_text(encoding="utf-8")

    # Add import if not already present
    if "getR2AssetUrl" not in content:
        content = "import { getR2AssetUrl } from '@/lib/r2';\n\n" + content

    # Replace all '/images/xxx' patterns with getR2AssetUrl('images/xxx')
    content = re.sub(r"'/images/([^']+)'", r"getR2AssetUrl('images/\1')", content)
    content = re.sub(r'"/images/([^"]+)"', r'getR2AssetUrl("images/\1")', content)

    filepath.write_text(content, encoding="utf-8")
    print(f"  [OK]  Fixed: {filepath.relative_to(ROOT)}")


def fix_component_with_helper(filepath: Path):
    """Same but also handles template literals and JSX src props."""
    content = filepath.read_text(encoding="utf-8")

    # Check if already migrated
    if "getR2AssetUrl" in content and "/images/" not in content:
        print(f"  [--]  Already migrated: {filepath.relative_to(ROOT)}")
        return

    needs_import = "getR2AssetUrl" not in content
    changed = False

    # Replace '/images/...' string literals
    new_content = re.sub(r"'/images/([^']+)'", r"getR2AssetUrl('images/\1')", content)
    if new_content != content:
        changed = True
        content = new_content

    # Replace "/images/..." string literals
    new_content = re.sub(r'"/images/([^"]+)"', r'getR2AssetUrl("images/\1")', content)
    if new_content != content:
        changed = True
        content = new_content

    if changed and needs_import:
        # Add import after the last existing import block or at top if no imports
        last_import_match = None
        for m in re.finditer(r"^import .+;", content, re.MULTILINE):
            last_import_match = m

        if last_import_match:
            insert_pos = last_import_match.end()
            content = (
                content[:insert_pos]
                + "\nimport { getR2AssetUrl } from '@/lib/r2';"
                + content[insert_pos:]
            )
        else:
            content = "import { getR2AssetUrl } from '@/lib/r2';\n\n" + content

    if changed:
        filepath.write_text(content, encoding="utf-8")
        print(f"  [OK]  Fixed: {filepath.relative_to(ROOT)}")
    else:
        print(f"  [-]   No changes: {filepath.relative_to(ROOT)}")


def fix_layout(filepath: Path):
    """Fix app/layout.tsx logo URL in JSON-LD."""
    content = filepath.read_text(encoding="utf-8")
    old = '`${siteUrl}/images/fregoro-logo.png`'
    new = f'`{R2_BASE}/images/fregoro-logo.png`'
    if old in content:
        content = content.replace(old, new)
        filepath.write_text(content, encoding="utf-8")
        print(f"  [OK]  Fixed logo URL in: {filepath.relative_to(ROOT)}")
    else:
        print(f"  [-]   No changes: {filepath.relative_to(ROOT)}")


def main():
    print("\n=== Migrating /images/ paths to R2 CDN URLs ===\n")

    # Data files
    fix_file_with_helper(ROOT / "data" / "products.ts")

    # Component files
    components_to_fix = [
        ROOT / "components" / "home" / "hero" / "hero.shared.ts",
        ROOT / "components" / "home" / "hero" / "HeroThreeCharacters.tsx",
        ROOT / "components" / "ui" / "fregoro-logo.tsx",
        ROOT / "app" / "(shop)" / "login" / "page.tsx",
        ROOT / "app" / "(shop)" / "signup" / "page.tsx",
    ]
    for f in components_to_fix:
        if f.exists():
            fix_component_with_helper(f)
        else:
            print(f"  [!]  Not found: {f.relative_to(ROOT)}")

    # Fix layout.tsx logo URL
    fix_layout(ROOT / "app" / "layout.tsx")

    print("\n=== Done ===")


if __name__ == "__main__":
    main()
