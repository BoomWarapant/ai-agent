#!/usr/bin/env bash
# Step 4B: block bot containers from LAN/private ranges (iptables DOCKER-USER). Run as root. Safe to re-run.
set -euo pipefail
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
need_root

curl -fsSL "${BOTTEAM_RAW}/wsl-system/rakazo-lan-block.sh" -o /usr/local/sbin/rakazo-lan-block.sh
curl -fsSL "${BOTTEAM_RAW}/wsl-system/rakazo-lan-block.service" -o /etc/systemd/system/rakazo-lan-block.service
sha256sum -c "$REPO_ROOT/checksums/SHA256SUMS-lanblock" || { rm -f /usr/local/sbin/rakazo-lan-block.sh /etc/systemd/system/rakazo-lan-block.service; fail "checksum ไม่ตรง — ลบไฟล์แล้ว"; }
chmod +x /usr/local/sbin/rakazo-lan-block.sh
systemctl daemon-reload
systemctl enable --now rakazo-lan-block >/dev/null
systemctl restart rakazo-lan-block
if [ "$(systemctl is-active rakazo-lan-block)" = active ]; then ok "rakazo-lan-block active"; else fail "service ไม่ active"; fi

info "ทดสอบด้วย network ชั่วคราว"
docker network create lbtest >/dev/null
trap 'docker network rm lbtest >/dev/null 2>&1 || true' EXIT
before=$(iptables -L RAKAZO-LAN-BLOCK -v -n -x | awk '$3=="DROP" && $9=="192.168.0.0/16"{print $1}')
docker run --rm --network lbtest busybox:1 sh -c \
  'nslookup example.com >/dev/null && echo DNS=OK || echo DNS=FAIL; wget -q -T 5 -O /dev/null http://example.com && echo PUBLIC=OK || echo PUBLIC=FAIL; wget -q -T 4 -O /dev/null http://192.168.1.1 && echo LAN=OPEN || echo LAN=BLOCKED' || true
after=$(iptables -L RAKAZO-LAN-BLOCK -v -n -x | awk '$3=="DROP" && $9=="192.168.0.0/16"{print $1}')
if [ "${after:-0}" -gt "${before:-0}" ]; then ok "กฎ DROP 192.168.0.0/16 ดัก packet จริง (${before:-0} → ${after})"; else fail "ตัวนับ DROP ไม่เพิ่ม — กฎอาจไม่ทำงาน"; fi
