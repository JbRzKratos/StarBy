"""
Fix JSX src attributes that got broken by fix_image_urls.py.
The issue: src=getR2AssetUrl("...") needs to be src={getR2AssetUrl("...")}
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent


def fix_jsx_attrs(filepath: Path):
    """Fix src=getR2AssetUrl(...) -> src={getR2AssetUrl(...)} in JSX files."""
    content = filepath.read_text(encoding="utf-8")

    # Fix: src=getR2AssetUrl("...") -> src={getR2AssetUrl("...")}
    # Also handles other JSX attributes like href, alt, etc.
    # Pattern: attr=getR2AssetUrl(...) where the value is NOT already wrapped in {}
    new_content = re.sub(
        r'(\s)(src|href|alt|logo)=getR2AssetUrl\(("([^"]+)"|\'([^\']+)\')\)',
        r'\1\2={getR2AssetUrl(\3)}',
        content
    )

    if new_content != content:
        filepath.write_text(new_content, encoding="utf-8")
        print(f"[OK]  Fixed JSX attrs: {filepath.relative_to(ROOT)}")
    else:
        print(f"[-]   No changes needed: {filepath.relative_to(ROOT)}")


def main():
    tsx_files = list(ROOT.rglob("*.tsx")) + list(ROOT.rglob("*.ts"))
    # Exclude node_modules and .next
    tsx_files = [f for f in tsx_files if "node_modules" not in str(f) and ".next" not in str(f)]

    print(f"Scanning {len(tsx_files)} files...")
    fixed = 0
    for f in tsx_files:
        content = f.read_text(encoding="utf-8", errors="ignore")
        if "getR2AssetUrl" in content and "src=getR2AssetUrl" in content:
            fix_jsx_attrs(f)
            fixed += 1

    print(f"\nDone. Fixed {fixed} files.")


if __name__ == "__main__":
    main()
