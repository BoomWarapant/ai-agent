#!/usr/bin/env bash
# shellcheck disable=SC2034  # variables are used by the scripts that source this file
# Shared settings for CRD Rakazo setup scripts. Sourced by the other scripts.
RAKAZO_TAG="v0.1.6"
RAKAZO_HOME="/home/rakazo/rakazo"
COMPUTER_TH_IMAGE="crd/computer:${RAKAZO_TAG}-th"
WEB_OFFICE_IMAGE="crd/app:${RAKAZO_TAG}-office"
COMPUTER_CRD_IMAGE="crd/computer:${RAKAZO_TAG}-crd"
# CRD skills baked into bot computers by build-skills.sh (read from CRD_SKILLS_DIR; not stored in this repo).
# crd-advance-clearing is left out on purpose: it carries employee/vendor data (see docs/DECISIONS.md D18).
CRD_SKILLS="crd-bom-boq crd-daily-progress-report crd-draft-letter crd-estimation crd-plan-building-construction crd-s-curve-report-rev02"
# Pinned upstream sources
RAKAZO_RAW="https://raw.githubusercontent.com/elie222/rakazo/${RAKAZO_TAG}/infra/compose"
BOTTEAM_RAW="https://raw.githubusercontent.com/jaturapornchai/mybotdemo01/b539632eba4ef28c14cf0e2c0b2ec6c8ee122787/rakazo"
# Repo root (this file lives in scripts/wsl/)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ok()   { printf '\033[32m[PASS]\033[0m %s\n' "$*"; }
info() { printf '\033[36m[INFO]\033[0m %s\n' "$*"; }
fail() { printf '\033[31m[FAIL]\033[0m %s\n' "$*" >&2; exit 1; }
need_root()     { [ "$(id -u)" -eq 0 ] || fail "ต้องรันด้วย root (prompt ลงท้าย #)"; }
need_not_root() { [ "$(id -u)" -ne 0 ] || fail "ห้ามรันด้วย root — ใช้ user rakazo (su - rakazo)"; }
dc() { (cd "$RAKAZO_HOME" && docker compose --env-file .env -f docker-compose.images.yml -f docker-compose.override.yml "$@"); }
