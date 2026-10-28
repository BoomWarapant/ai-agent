#!/usr/bin/env bash
set -euo pipefail
source_dir="$(cd "$(dirname "$0")" && pwd)"
target="${1:-/home/rakazo/crd-bot-team}"
project="${2:-crd-bot-team}"
web="${3:-5173}"
api="${4:-3100}"
[[ "$target" = /* && "$project" =~ ^crd-bot-[a-z0-9-]+$ ]] || { echo "Invalid target/project"; exit 1; }
[[ "$web" =~ ^[0-9]+$ && "$api" =~ ^[0-9]+$ && "$web" != "$api" ]] || exit 1
docker info >/dev/null
if [ -e "$target/.env" ]; then
 [ -f "$target/.installation-incomplete" ] && [ "$(cat "$target/project")" = "$project" ] && [ "$(cat "$target/web-port")" = "$web" ] || { echo "Already installed/different configuration. Use Start-crd-bot.ps1."; exit 1; }
 echo "Resuming incomplete installation with existing credentials."
else
 for port in "$web" "$api"; do
  if ss -ltnH | awk '{print $4}' | grep -Eq ":$port$"; then echo "Port $port is occupied"; exit 1; fi
 done
 mkdir -p "$target"
 umask 077
 touch "$target/.installation-incomplete"
 printf '%s\n' "$project" > "$target/project"
 printf '%s\n' "$web" > "$target/web-port"
python3 - "$target/.env" "$web" "$api" <<'PY'
import secrets,sys
from pathlib import Path
p=Path(sys.argv[1]);web,api=sys.argv[2:]
data={k:secrets.token_hex(32) for k in ['POSTGRES_PASSWORD','BETTER_AUTH_SECRET','SCREEN_PROXY_SECRET','SANDBOX_SUPERVISOR_TOKEN','ENCRYPTION_KEY']}
data.update(RAKAZO_IMAGE_TAG='v0.1.6',RAKAZO_COMPUTER_IMAGE_TAG='v0.1.6',RAKAZO_WEB_PORT=web,RAKAZO_API_PORT=api,BETTER_AUTH_URL='http://127.0.0.1:'+web,WEB_ORIGIN='http://127.0.0.1:'+web,API_URL='http://127.0.0.1:'+web,SIGNUPS_ENABLED='true',TZ='Asia/Bangkok')
with p.open('x') as f:f.write(''.join(k+'='+v+chr(10) for k,v in data.items()))
PY
fi
cp "$source_dir/compose.base.yml" "$source_dir/compose.team.yml" "$target/"
printf '%s\n' "$project" > "$target/project"
printf '%s\n' "$web" > "$target/web-port"
docker build -t crd/team-app:2026.10.29 "$source_dir/app"
docker build -t crd/team-computer:2026.10.29 "$source_dir/computer"
docker compose -p "$project" --project-directory "$target" --env-file "$target/.env" -f "$target/compose.base.yml" -f "$target/compose.team.yml" up -d --wait --wait-timeout 300
mv "$target/.installation-incomplete" "$target/.installed"
echo "Installed: http://127.0.0.1:$web - create your own account, then connect your model."
