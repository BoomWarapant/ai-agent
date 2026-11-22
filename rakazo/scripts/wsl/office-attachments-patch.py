#!/usr/bin/env python3
"""CRD hotfix for Rakazo v0.1.6: allow Office attachments (.xlsx/.docx/.pptx).

Reads <dir>/{contracts,core}-attachments.ts.orig (copied from the pinned app image by
30-install-rakazo.sh) and writes the patched <dir>/{contracts,core}-attachments.ts.
Output is checked against checksums/SHA256SUMS-office. Called by 30-install-rakazo.sh.
"""
import sys
from pathlib import Path

X = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
D = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
P = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
HDR = "// CRD hotfix (Rakazo v0.1.6): allow Office attachments (.xlsx/.docx/.pptx). Remove after upstream supports them.\n"


def patch(path: Path, pairs):
    s = path.with_name(path.name + ".orig").read_text(encoding="utf-8")
    for old, new in pairs:
        if s.count(old) != 1:
            sys.exit(f"anchor count != 1 in {path}: {old!r} -> {s.count(old)}")
        s = s.replace(old, new)
    path.write_text(HDR + s, encoding="utf-8")
    print("patched", path)


def main():
    d = Path(sys.argv[1] if len(sys.argv) > 1 else "hotfix")
    patch(d / "contracts-attachments.ts", [(
        '  "application/json",\n] as const;',
        f'  "application/json",\n  "{X}",\n  "{D}",\n  "{P}",\n] as const;',
    )])
    patch(d / "core-attachments.ts", [
        ('  ".json": "application/json",\n',
         f'  ".json": "application/json",\n  ".xlsx": "{X}",\n  ".docx": "{D}",\n  ".pptx": "{P}",\n'),
        ('  "application/json": ".json",\n',
         f'  "application/json": ".json",\n  "{X}": ".xlsx",\n  "{D}": ".docx",\n  "{P}": ".pptx",\n'),
    ])


if __name__ == "__main__":
    main()
