#!/usr/bin/env bash
# Build skills into Rakazo: bake skill folders into the bot computer image (/opt/crd-skills/<name>/)
# and generate built-in skills (hotfix/builtin-skills.ts) so every account sees them without setup.
# CRD skills are NOT stored in this repo — they are read from CRD_SKILLS_DIR at build time.
# Only skill-installer (repo: skills/skill-installer) is always included.
#   CRD_SKILLS_DIR=/mnt/c/Users/<you>/.claude/skills bash build-skills.sh            # used by 30-install-rakazo.sh
#   CRD_SKILLS_DIR=/mnt/c/Users/<you>/.claude/skills bash build-skills.sh --apply    # update skills on a running system
# Run as user rakazo. Requires hotfix/ from 30-install-rakazo.sh step 4.
set -euo pipefail
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
need_not_root
apply=0; [ "${1:-}" = "--apply" ] && apply=1
cd "$RAKAZO_HOME"
ctx=computer-crd
rm -rf "$ctx" && mkdir -p "$ctx/skills" hotfix

stage() {  # stage <skill dir>
  local src="${1%/}" name; name="$(basename "$src")"
  [ -f "$src/SKILL.md" ] || { info "ข้าม $name (ไม่พบ SKILL.md)"; return 0; }
  mkdir -p "$ctx/skills/$name"
  tar -C "$src" --exclude=./evals --exclude=./tests --exclude='__pycache__' --exclude='*.pyc' -cf - . \
    | tar -C "$ctx/skills/$name" -xf -
  find "$ctx/skills/$name" -type f \( -name '*.py' -o -name '*.md' -o -name '*.sh' -o -name '*.json' -o -name '*.yaml' -o -name '*.csv' \) \
    -exec sed -i 's/\r$//' {} +
  # the skill's own install path on the authoring PC -> path inside the bot computer
  sed -i -E 's#[Cc]:\\\\?Users\\\\?[^\\]+\\\\?\.claude\\\\?skills\\\\?#/opt/crd-skills/#g
             s#\$env:USERPROFILE\\\\?\.claude\\\\?skills\\\\?#/opt/crd-skills/#g
             s#(~|\$HOME|\$\{HOME\})/\.claude/skills/#/opt/crd-skills/#g' \
    "$ctx/skills/$name/SKILL.md"
  ok "skill $name ($(find "$ctx/skills/$name" -type f | wc -l) ไฟล์)"
}

stage "$REPO_ROOT/skills/skill-installer"
if [ -n "${CRD_SKILLS_DIR:-}" ]; then
  [ -d "$CRD_SKILLS_DIR" ] || fail "ไม่พบ CRD_SKILLS_DIR=$CRD_SKILLS_DIR"
  for s in $CRD_SKILLS; do stage "$CRD_SKILLS_DIR/$s"; done
else
  info "ไม่ได้ตั้ง CRD_SKILLS_DIR — ติดตั้งเฉพาะ skill-installer (ตั้งแล้วรัน build-skills.sh --apply ภายหลังได้)"
fi

# Built-in skills: patch builtin-skills.ts from the pinned app image
cid="$(docker create "ghcr.io/elie222/rakazo/app:${RAKAZO_TAG}")"
docker cp "$cid:/app/packages/adapters/src/builtin-skills.ts" hotfix/builtin-skills.ts.orig
docker rm "$cid" >/dev/null
grep 'builtin-skills.ts.orig$' "$REPO_ROOT/checksums/SHA256SUMS-skills" | sha256sum -c - || fail "builtin-skills.ts ใน image ไม่ตรง v0.1.6 — หยุด"
python3 "$REPO_ROOT/scripts/wsl/builtin-skills-patch.py" "$ctx/skills" hotfix/builtin-skills.ts.orig hotfix/builtin-skills.ts

# Bot computer image with Python libs + skill folders
cp "$REPO_ROOT/config/computer-crd/Dockerfile" "$ctx/"
docker build -q -t "$COMPUTER_CRD_IMAGE" "$ctx" >/dev/null
ok "build $COMPUTER_CRD_IMAGE"

if [ "$apply" = 1 ]; then
  dc up -d --wait --wait-timeout 300 api worker supervisor
  # bot computers pick up the new image when they start again (home folders are kept)
  for c in $(docker ps --format '{{.Names}}' | grep '^rakazo-bot-' || true); do docker stop "$c" >/dev/null && info "หยุด $c"; done
  ok "อัปเดต skill แล้ว — บอทจะเห็น skill ใหม่ในข้อความถัดไป"
fi
