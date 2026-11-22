"""Build the Windows installer from the checked release manifest."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[3]
manifest = root / "crd-bot-package.SHA256SUMS"
version = json.loads((root / "rakazo/team-installer/app/crd-version.json").read_text())["version"]


def build(output):
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", version):
        raise ValueError("Invalid release version")
    output.mkdir(parents=True, exist_ok=True)
    dest = output / f"crd-bot-Setup-{version}.exe"
    if dest.exists():
        raise FileExistsError(dest)
    compiler = Path(os.environ["WINDIR"]) / "Microsoft.NET/Framework64/v4.0.30319/csc.exe"
    with tempfile.TemporaryDirectory() as directory:
        tmp = Path(directory)
        archive = tmp / "package.zip"
        with ZipFile(archive, "w", ZIP_DEFLATED) as package:
            for line in manifest.read_text().splitlines():
                expected, name = line.split("  ", 1)
                source = (root / name).resolve()
                if not source.is_relative_to(root) or name in package.NameToInfo:
                    raise ValueError(f"Invalid manifest path: {name}")
                content = source.read_bytes()
                if hashlib.sha256(content).hexdigest() != expected:
                    raise ValueError(f"Checksum mismatch: {name}")
                if name.endswith(".sh") and b"\r\n" in content:
                    raise ValueError(f"WSL script has CRLF endings: {name}")
                package.writestr(name, content)
            package.write(manifest, manifest.name)
        info = tmp / "version.cs"
        info.write_text(
            'using System.Reflection;\n[assembly: AssemblyProduct("crd-bot")]\n'
            f'[assembly: AssemblyVersion("{version}.0")]\n'
            f'[assembly: AssemblyInformationalVersion("{version}")]\n'
        )
        exe = tmp / dest.name
        icon = root / "rakazo/team-installer/app/branding/favicon.ico"
        subprocess.run([str(compiler), "/nologo", "/target:winexe", "/platform:anycpu", "/optimize+",
                        "/codepage:65001", "/reference:System.Windows.Forms.dll",
                        "/reference:System.IO.Compression.dll", "/reference:System.IO.Compression.FileSystem.dll",
                        f"/win32icon:{icon}", f"/resource:{archive},package.zip", f"/out:{exe}",
                        str(info), str(Path(__file__).with_name("CrdBotSetup.cs"))], check=True)
        subprocess.run([str(exe), "--verify"], check=True, timeout=90)
        with exe.open("rb") as src, dest.open("xb") as target:
            shutil.copyfileobj(src, target)
    print(dest)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    build(parser.parse_args().output.resolve())
