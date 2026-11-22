#!/usr/bin/env python3
"""CRD hotfix (Rakazo v0.1.6): 3D hard-hat robot avatar.

  avatar-patch.py <dir>   reads <dir>/bot-avatar.tsx.orig, styles.css.orig, robot-hardhat.tsx.part,
                          hardhat.css.part and writes <dir>/bot-avatar.tsx, <dir>/styles.css
"""
import sys
from pathlib import Path

d = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
tsx = (d / "bot-avatar.tsx.orig").read_text(encoding="utf-8")
start = tsx.index("  const visorW = Math.round(size * 0.68);\n")
end = tsx.index("\nfunction OrganicAvatar(")
part = (d / "robot-hardhat.tsx.part").read_text(encoding="utf-8")
# the replaced block ends with "});\n" (close of BotAvatar); keep one blank line before OrganicAvatar
out = tsx[:start] + part.rstrip("\n") + "\n" + tsx[end:]
assert out.count("function hardHatPalette") == 1 and "const visorW" not in out
(d / "bot-avatar.tsx").write_text(out, encoding="utf-8")

css = (d / "styles.css.orig").read_text(encoding="utf-8")
(d / "styles.css").write_text(css.rstrip("\n") + "\n" + (d / "hardhat.css.part").read_text(encoding="utf-8"),
                              encoding="utf-8")
print("patched bot-avatar.tsx and styles.css")
