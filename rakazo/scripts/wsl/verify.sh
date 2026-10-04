#!/usr/bin/env bash
# shellcheck disable=SC2016  # checks are single-quoted on purpose and evaluated by chk()
# All checkpoints in one place. Run as user rakazo (or root). Read-only (R0).
set -uo pipefail
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
rc=0
chk() { if eval "$2" >/dev/null 2>&1; then ok "$1"; else printf '\033[31m[FAIL]\033[0m %s\n' "$1"; rc=1; fi; }

chk "systemd เป็น PID 1"                      '[ "$(ps -p 1 -o comm=)" = systemd ]'
chk "docker active + enabled"                  '[ "$(systemctl is-active docker)" = active ] && [ "$(systemctl is-enabled docker)" = enabled ]'
for s in postgres api worker web supervisor; do
  chk "container rakazo-$s-1 running"          "[ \"\$(docker inspect -f '{{.State.Running}}' rakazo-$s-1)\" = true ]"
done
chk "API /health ok"                           'curl -fs http://127.0.0.1:3100/health | grep -q "\"ok\":true"'
chk "Web 127.0.0.1:5173 ตอบ"                   'curl -fs -o /dev/null http://127.0.0.1:5173'
chk "web/api ผูก 127.0.0.1 เท่านั้น"            '! ss -ltn | grep -E "0\.0\.0\.0:(5173|3100) |\[::\]:(5173|3100) "'
chk "image tag = ${RAKAZO_TAG}"                "docker inspect -f '{{.Config.Image}}' rakazo-api-1 | grep -q ':${RAKAZO_TAG}$'"
chk "hotfix ถูกโหลดใน worker"                  '[ "$(docker exec rakazo-worker-1 grep -c dispatcherFetch /app/packages/adapters/src/web-ssrf.ts)" -ge 2 ]'
chk "supervisor ใช้ image ฟอนต์ไทย"            "[ \"\$(docker exec rakazo-supervisor-1 printenv RAKAZO_COMPUTER_IMAGE)\" = '${COMPUTER_TH_IMAGE}' ]"
chk "rakazo-lan-block active"                  '[ "$(systemctl is-active rakazo-lan-block)" = active ]'
if systemctl cat maw-serve >/dev/null 2>&1; then
  chk "maw-serve (oracle fleet) ยัง active"     '[ "$(systemctl is-active maw-serve)" = active ]'
fi
echo; free -g | head -2
docker stats --no-stream --format '{{.Name}}: {{.MemUsage}}' | grep -E 'rakazo' || true
exit $rc
