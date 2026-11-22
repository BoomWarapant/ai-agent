"""Stage private, local skill packages in the Rakazo owner's office."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tarfile
import tempfile


def discover(user_dir, requested=()):
    selected = {}
    for root in (user_dir / ".agents/skills", user_dir / ".codex/skills"):
        for pattern in ("*/SKILL.md", "synced/*/*/SKILL.md"):
            for doc in sorted(root.glob(pattern)):
                name = doc.parent.name
                if not re.fullmatch(r"[a-zA-Z0-9_.-]{1,64}", name):
                    continue
                if name not in requested and (requested or not name.startswith("crd-")):
                    continue
                if doc.resolve().is_relative_to(root.resolve()):
                    selected.setdefault(name, doc.parent)
    missing = set(requested) - selected.keys()
    if missing or not selected:
        raise ValueError("No local skill found: " + ", ".join(sorted(missing or requested)))
    return selected


def files(directory):
    # Package instructions and their runtime resources, excluding machine configuration and caches.
    yield directory / "SKILL.md"
    for name in ("scripts","references","reference-data","assets","templates","schema","examples","example","requirements.txt"):
        item = directory / name
        for f in sorted(item.rglob("*")) if item.is_dir() else [item]:
            if not f.is_file() or not f.resolve().is_relative_to(directory.resolve()):
                continue
            if any(p.startswith(".") or p in ("__pycache__","node_modules") for p in f.relative_to(directory).parts):
                continue
            if f.suffix.lower() not in (".pyc",".pyo",".pem",".key",".pfx"):
                yield f


def install(compose, user_dir, requested=()):
    selected = discover(user_dir, requested)
    catalog = []
    with tempfile.TemporaryFile() as archive:
        with tarfile.open(fileobj=archive, mode="w:gz", dereference=True) as bundle:
            for name, directory in selected.items():
                content = (directory / "SKILL.md").read_text(encoding="utf-8-sig")
                desc = re.search(r"(?m)^description:\s*(.+)$", content)
                fingerprint = hashlib.sha256()
                for f in files(directory):
                    rel = f.relative_to(directory).as_posix()
                    fingerprint.update(rel.encode()+b"\0"+hashlib.sha256(f.read_bytes()).digest())
                    bundle.add(f, arcname=f"{name}/{rel}", recursive=False)
                catalog.append(dict(name=name,version=fingerprint.hexdigest()[:24],
                                    description=desc.group(1)[:1800] if desc else name))
        archive.seek(0)
        target = [*compose, "exec","-T","api"]
        stage = subprocess.check_output([*target,"mktemp","-d","/tmp/crd-skills-XXXXXXXX"],text=True).strip()
        if not re.fullmatch(r"/tmp/crd-skills-[a-zA-Z0-9]+",stage):
            raise RuntimeError("Invalid skill staging directory")
        try:
            subprocess.run([*target,"tar","--no-same-owner","-xzf","-","-C",stage],stdin=archive,check=True)
            script = Path(__file__).with_name("install-skill-catalog.mjs").read_text(encoding="utf8")
            payload = "const input="+json.dumps(dict(stage=stage,skills=catalog))+";\n"+script
            subprocess.run([*target,"sh","-c","cd /app/apps/api && exec pnpm exec tsx --input-type=module -"],
                           input=payload.encode(), check=True)
        finally:
            subprocess.run([*target,"rm","-rf","--",stage],check=True)
