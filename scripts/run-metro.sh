#!/usr/bin/env bash
# Start the Expo Metro bundler for the debug APK (ADR-012). Run it in its own terminal.
# Loads E2E environment variables from .env.e2e when present (local Supabase, never real data).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env.e2e ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.e2e
  set +a
  echo "[run-metro] Đã nạp biến môi trường từ .env.e2e"
fi

exec npx expo start --port 8081 "$@"
