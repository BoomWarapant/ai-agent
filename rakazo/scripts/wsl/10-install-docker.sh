#!/usr/bin/env bash
# Step 2: install Docker Engine inside WSL (official apt repo). Run as root. Safe to re-run.
set -euo pipefail
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
need_root

if command -v docker >/dev/null 2>&1; then
  info "Docker มีอยู่แล้ว: $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo 'daemon ยังไม่ทำงาน')"
else
  info "ติดตั้ง Docker Engine จาก download.docker.com"
  apt-get update
  apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  codename="$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")"
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${codename} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

systemctl enable --now docker >/dev/null
hw="$(docker run --rm hello-world)"
if grep -q "Hello from Docker" <<<"$hw"; then ok "hello-world ทำงาน"; else fail "hello-world ไม่ผ่าน"; fi
if [ "$(systemctl is-enabled docker)" = enabled ]; then ok "docker เปิดเองตอนบูต"; else fail "docker ไม่ได้ enabled"; fi
docker compose version
