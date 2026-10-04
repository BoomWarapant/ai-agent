#!/usr/bin/env bash
# Backup Rakazo: Postgres dump + bot data volume + config. Run as user rakazo. (R0 on the system, writes a backup folder)
# Backups contain bot data and encrypted secrets — keep them local, never commit or share.
set -euo pipefail
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
dest="${1:-$HOME/backups}/rakazo-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$dest" && chmod 700 "$dest"
cd "$RAKAZO_HOME"
db_user=$(grep -E '^POSTGRES_USER=' .env | cut -d= -f2- || true); db_user=${db_user:-rakazo}
db_name=$(grep -E '^POSTGRES_DB=' .env | cut -d= -f2- || true); db_name=${db_name:-rakazo}
docker exec rakazo-postgres-1 pg_dump -U "$db_user" -d "$db_name" -Fc > "$dest/rakazo.dump"
docker run --rm -v rakazo_appdata:/data:ro -v "$dest":/out busybox:1 tar czf /out/appdata.tgz -C /data .
cp .env "$dest/env.backup" && chmod 600 "$dest/env.backup"
cp docker-compose.override.yml "$dest/"
if [ -s "$dest/rakazo.dump" ] && [ -s "$dest/appdata.tgz" ]; then ok "backup: $dest"; else fail "backup ไม่สมบูรณ์ — ลบ $dest แล้วลองใหม่"; fi
ls -lh "$dest"
info ".env มีกุญแจถอดรหัส (ENCRYPTION_KEY) — ต้องใช้คู่กับ dump ตอนกู้คืน"
