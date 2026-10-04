#!/usr/bin/env bash
# Steps 3.3–4A: install Rakazo (pinned), Thai-font computer image, hotfix override, start, verify.
# Run as user rakazo. Safe to re-run (keeps existing .env and data).
set -euo pipefail
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
need_not_root
[ "$(id -un)" = rakazo ] || fail "รันด้วย user rakazo เท่านั้น (ตอนนี้: $(id -un))"
id -nG | grep -qw docker || fail "user นี้ไม่อยู่ใน group docker — รัน 20-create-user.sh แล้ว logout/login ใหม่"

mkdir -p "$RAKAZO_HOME" && cd "$RAKAZO_HOME"

# 1) Port check (only when Rakazo is not already running)
if ! docker ps --format '{{.Names}}' | grep -q '^rakazo-web-1$'; then
  if ss -ltn | grep -Eq ':(5173|3100) '; then fail "port 5173 หรือ 3100 ถูกใช้อยู่ — ตรวจด้วย: ss -ltnp | grep -E ':(5173|3100) '"; fi
  ok "port 5173/3100 ว่าง"
fi

# 2) Installer + compose files pinned to the Rakazo release tag
curl -fsSLO "${RAKAZO_RAW}/install-images.sh"
RAKAZO_DOWNLOAD_BASE="$RAKAZO_RAW" bash install-images.sh --prepare-only
[ -f .env ] && [ -f docker-compose.images.yml ] || fail "ไม่พบ .env หรือ docker-compose.images.yml"
chmod 600 .env

# 3) Pin image tags
for k in RAKAZO_IMAGE_TAG RAKAZO_COMPUTER_IMAGE_TAG; do
  if grep -q "^$k=" .env; then sed -i "s/^$k=.*/$k=${RAKAZO_TAG}/" .env; else echo "$k=${RAKAZO_TAG}" >> .env; fi
done
if [ "$(grep -cE "^RAKAZO_(COMPUTER_)?IMAGE_TAG=${RAKAZO_TAG}$" .env)" -eq 2 ]; then ok "pin tag = ${RAKAZO_TAG}"; else fail "pin tag ไม่สำเร็จ"; fi

# 4) Fetch hotfix + Thai-font Dockerfile, verify checksums
mkdir -p hotfix computer-th
for f in web-ssrf keyless-http-web undici-fetch remote-mcp; do curl -fsSL "${BOTTEAM_RAW}/hotfix/$f.ts" -o "hotfix/$f.ts"; done
curl -fsSL "${BOTTEAM_RAW}/computer-th/Dockerfile" -o computer-th/Dockerfile
sha256sum -c "$REPO_ROOT/checksums/SHA256SUMS" || fail "checksum ไม่ตรง — หยุด อย่าใช้ไฟล์เหล่านี้"
ok "checksum ครบ 5 ไฟล์"

# 4b) CRD hotfix: Office attachments (.xlsx/.docx/.pptx) — patched from the pinned app image (not redistributed)
docker pull -q "ghcr.io/elie222/rakazo/app:${RAKAZO_TAG}" >/dev/null
cid="$(docker create "ghcr.io/elie222/rakazo/app:${RAKAZO_TAG}")"
docker cp "$cid:/app/packages/contracts/src/attachments.ts" hotfix/contracts-attachments.ts.orig
docker cp "$cid:/app/packages/core/src/attachments.ts" hotfix/core-attachments.ts.orig
docker rm "$cid" >/dev/null
grep '\.orig$' "$REPO_ROOT/checksums/SHA256SUMS-office" | sha256sum -c - || fail "ไฟล์ต้นฉบับใน image ไม่ตรง v0.1.6 — หยุด"
python3 "$REPO_ROOT/scripts/wsl/office-attachments-patch.py" hotfix
sha256sum -c "$REPO_ROOT/checksums/SHA256SUMS-office" || fail "checksum hotfix Office ไม่ตรง — หยุด"
ok "hotfix แนบไฟล์ Office พร้อม"

# 5) Thai-font bot computer image (pull base first so FROM resolves offline-safe)
docker pull "ghcr.io/elie222/rakazo/computer:${RAKAZO_TAG}" >/dev/null
docker build -q -t "$COMPUTER_TH_IMAGE" computer-th
ok "build $COMPUTER_TH_IMAGE"

# 5b) Web rebuilt with the Office-attachment hotfix (users can upload .xlsx/.docx/.pptx)
mkdir -p app-office
cp "$REPO_ROOT/config/app-office/Dockerfile" hotfix/contracts-attachments.ts hotfix/core-attachments.ts app-office/
docker build -q -t "$WEB_OFFICE_IMAGE" app-office
ok "build $WEB_OFFICE_IMAGE"

# 6) Override from this repo
cp "$REPO_ROOT/config/docker-compose.override.yml" docker-compose.override.yml

# 7) Convenience function `dc` (always loads the override)
if ! grep -q '^dc() ' ~/.bashrc; then
  echo 'dc() { (cd ~/rakazo && docker compose --env-file .env -f docker-compose.images.yml -f docker-compose.override.yml "$@"); }' >> ~/.bashrc
fi

# 8) Start (installer is NOT used to start: it would ignore the override)
dc pull --quiet
dc up -d --wait --wait-timeout 300
ok "Rakazo ทำงาน — ตรวจละเอียดด้วย scripts/wsl/verify.sh"
