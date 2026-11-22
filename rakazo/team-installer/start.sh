#!/usr/bin/env bash
set -euo pipefail
target="${1:-/home/rakazo/crd-bot-team}"
test -f "$target/project"
project="$(cat "$target/project")"
docker compose -p "$project" --project-directory "$target" --env-file "$target/.env" -f "$target/compose.base.yml" -f "$target/compose.team.yml" up -d --wait --wait-timeout 300
