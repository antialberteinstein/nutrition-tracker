#!/usr/bin/env bash
# Run the Appium E2E suite on a real Android device (ADR-012, docs/testing/test-plan.md).
# Usage: e2e/mobile-appium/scripts/run-test.sh [pytest args…]
# Exit codes: 0 pass · 1 test failures · 2 missing config/tools/APK · 3 device not connected.
# Never starts an emulator. adb is only used here (read-only device check + port reverse for Metro).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
E2E="$ROOT/e2e/mobile-appium"
CONFIG="$E2E/config.json"
REPORTS="$ROOT/reports"

fail() { echo "[run-test] $2" >&2; exit "$1"; }

[ -f "$CONFIG" ] || fail 2 "Thiếu $CONFIG. Chép config.example.json thành config.json và điền UDID máy test."
for tool in uv appium adb node; do
  command -v "$tool" >/dev/null 2>&1 || fail 2 "Thiếu công cụ '$tool' trong PATH."
done

cfg() { node -e "const c=require(process.argv[1]);process.stdout.write(String(c[process.argv[2]]??''))" "$CONFIG" "$1"; }
UDID="$(cfg udid)"
APK="$(cfg apkPath)"
SERVER="$(cfg appiumServer)"
[ -n "$UDID" ] && [ "$UDID" != "REPLACE_WITH_DEVICE_UDID" ] || fail 2 "config.json chưa có UDID thật."
case "$APK" in /*) ;; *) APK="$ROOT/$APK" ;; esac
[ -f "$APK" ] || fail 2 "Không thấy APK $APK. Chạy scripts/build-debug-apk.sh trước."

if ! adb devices | awk 'NR>1 && $2=="device" {print $1}' | grep -qx "$UDID"; then
  fail 3 "Thiết bị $UDID chưa kết nối (hoặc chưa mở khoá / chưa cho phép USB debugging). Cắm máy, mở khoá, chấp nhận máy tính rồi chạy lại. Script không khởi động máy ảo."
fi

# Fresh reports every run: the previous run is overwritten.
rm -rf "$REPORTS"
mkdir -p "$REPORTS/screenshots" "$REPORTS/page-source"

# Let the USB-connected device reach Metro on the host (e2e/mobile-appium/scripts/run-metro.sh).
adb -s "$UDID" reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || echo "[run-test] Cảnh báo: không đặt được adb reverse cho Metro." >&2

APPIUM_PID=""
if ! curl -fsS "$SERVER/status" >/dev/null 2>&1; then
  port="$(node -e "process.stdout.write(new URL(process.argv[1]).port||'4723')" "$SERVER")"
  appium --port "$port" --log "$REPORTS/appium.log" >/dev/null 2>&1 &
  APPIUM_PID=$!
  trap '[ -n "$APPIUM_PID" ] && kill "$APPIUM_PID" 2>/dev/null' EXIT
  for _ in $(seq 1 30); do
    curl -fsS "$SERVER/status" >/dev/null 2>&1 && break
    sleep 1
  done
  curl -fsS "$SERVER/status" >/dev/null 2>&1 || fail 2 "Appium không khởi động được. Xem $REPORTS/appium.log"
else
  echo "[run-test] Dùng Appium server đang chạy tại $SERVER (log không nằm trong reports/)."
fi

cd "$E2E"
uv run pytest \
  --junitxml="$REPORTS/junit.xml" \
  --html="$REPORTS/report.html" --self-contained-html \
  "$@"
rc=$?

echo "[run-test] Báo cáo: $REPORTS (report.html, junit.xml, screenshots/, page-source/, appium.log)"
case "$rc" in
  0) exit 0 ;;
  2) exit 2 ;;
  *) exit 1 ;;
esac
