#!/usr/bin/env bash
# Build the Android debug APK used by the Appium E2E suite (ADR-012).
# Output: build/app-debug.apk. The debug build loads JS from Metro (scripts/run-metro.sh).
# Does not start emulators and does not talk to any device.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v java >/dev/null 2>&1; then
  echo "[build-debug-apk] Cần JDK (khuyến nghị JDK 17) trong PATH hoặc JAVA_HOME." >&2
  exit 2
fi
java_major="$(java -version 2>&1 | sed -nE 's/.*version "([0-9]+).*/\1/p' | head -1)"
if [ "${java_major:-0}" != "17" ]; then
  echo "[build-debug-apk] Cảnh báo: đang dùng JDK ${java_major:-?}. React Native Android thường cần JDK 17;" >&2
  echo "                  nếu Gradle lỗi, đặt JAVA_HOME tới JDK 17 rồi chạy lại." >&2
fi

echo "[build-debug-apk] expo prebuild (android)…"
npx expo prebuild --platform android --no-install

echo "[build-debug-apk] gradle assembleDebug…"
(cd android && ./gradlew assembleDebug)

mkdir -p build
cp android/app/build/outputs/apk/debug/app-debug.apk build/app-debug.apk
echo "[build-debug-apk] Xong: $ROOT/build/app-debug.apk"
