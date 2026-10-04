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
- **CRD hard-hat avatar** — `rakazo/app-office/{bot-avatar.tsx,styles.css}` are **generated at install time** from the
  `app:v0.1.6` image (originals verified with `checksums/SHA256SUMS-avatar`) by `scripts/wsl/avatar-patch.py` using
  `config/app-office/*.part` (modified Rakazo files, Apache-2.0); not redistributed. `scripts/windows/crd-bot.{svg,ico}`
  and `config/app-office/branding/*` (favicons replacing Rakazo's in the local web build) are original CRD artwork.
- **CRD branding text hotfix** — `rakazo/hotfix/{pi-models,pi-oauth,pi-runtime}.ts` are **generated at install time**
  from the `app:v0.1.6` image (originals verified with `checksums/SHA256SUMS-branding`) by replacing the word
  "Rakazo" with "crd-bot" (modified Rakazo files, Apache-2.0); not redistributed. The web build applies the same
  replacement to visible UI text and locale catalogs.
- **CRD built-in skills hotfix** — `rakazo/hotfix/builtin-skills.ts` is **generated at install time** from the
  `app:v0.1.6` image (original verified with `checksums/SHA256SUMS-skills`) by `scripts/wsl/builtin-skills-patch.py`
  (modified Rakazo file, Apache-2.0); not redistributed. CRD skill content is read from `CRD_SKILLS_DIR` on the
  machine and baked into the local image `crd/computer:v0.1.6-crd`; it is not stored in this repo.
- Docker install steps follow the official Docker documentation for Ubuntu.
