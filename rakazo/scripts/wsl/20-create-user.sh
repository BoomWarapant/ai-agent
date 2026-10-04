#!/usr/bin/env bash
# Step 3.2: create the non-root user that owns Rakazo. Run as root. Safe to re-run.
set -euo pipefail
# shellcheck source=common.sh
source "$(dirname "$0")/common.sh"
need_root

if id rakazo >/dev/null 2>&1; then
  info "user rakazo มีอยู่แล้ว"
else
  useradd -m -s /bin/bash rakazo
fi
usermod -aG docker rakazo
if id -nG rakazo | grep -qw docker; then ok "rakazo อยู่ใน group docker"; else fail "rakazo ไม่อยู่ใน group docker"; fi
info "หมายเหตุ: group docker มีสิทธิ์เทียบเท่า root ใน WSL (ยอมรับได้สำหรับเครื่องที่ใช้คนเดียว)"
