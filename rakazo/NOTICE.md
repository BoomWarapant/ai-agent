# NOTICE

- **Rakazo** — https://github.com/elie222/rakazo — Apache License 2.0. Installed from published images
  `ghcr.io/elie222/rakazo/*:v0.1.6`; this repo does not contain Rakazo source.
- **BotTeam (jaturapornchai/mybotdemo01)** — https://github.com/jaturapornchai/mybotdemo01 — used as reference.
  The following files are **downloaded at install time** from commit `b539632eba4ef28c14cf0e2c0b2ec6c8ee122787`
  and verified with SHA-256 (see `checksums/`); they are **not redistributed** in this repo:
  - `rakazo/hotfix/{web-ssrf,keyless-http-web,undici-fetch,remote-mcp}.ts` — modified Rakazo v0.1.6 files (Apache-2.0)
  - `rakazo/computer-th/Dockerfile` — Thai fonts for bot computers
  - `rakazo/wsl-system/rakazo-lan-block.{sh,service}` — LAN egress block for containers
- **CRD Office-attachment hotfix** — `rakazo/hotfix/{contracts,core}-attachments.ts` are **generated at install time**
  from the `ghcr.io/elie222/rakazo/app:v0.1.6` image by `scripts/wsl/office-attachments-patch.py`
  (modified Rakazo files, Apache-2.0; originals and results verified with `checksums/SHA256SUMS-office`); not redistributed.
  The local image `crd/app:v0.1.6-office` (web rebuilt with these files, `config/app-office/Dockerfile`) is built
  on the machine at install time and is not published.
- Docker install steps follow the official Docker documentation for Ubuntu.
