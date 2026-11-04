"""Shared Appium fixtures for the mobile E2E suite (ADR-012, docs/testing/test-plan.md).

- Reads the device config and the cloud test account from config.json (gitignored; copy
  config.example.json). E2E runs against the Supabase cloud project (ADR-015).
- Creates one UiAutomator2 session per test session.
- Before every test, brings the app under test to the foreground and fails fast if it is not there,
  so a test never runs against another app.
- On a failed test, saves a screenshot, the UI page source and the app's logcat into reports/.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

import pytest
from appium import webdriver
from appium.options.android import UiAutomator2Options
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait

E2E_DIR = Path(__file__).resolve().parent
REPO_ROOT = E2E_DIR.parent.parent
CONFIG_PATH = Path(os.environ.get("E2E_CONFIG", E2E_DIR / "config.json"))
REPORTS_DIR = Path(os.environ.get("E2E_REPORTS_DIR", REPO_ROOT / "reports"))
STARTUP_TIMEOUT = 90  # seconds for the first screen after install (bundle download included)


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        pytest.exit(
            f"Missing {CONFIG_PATH}. Copy config.example.json to config.json and set the device UDID.",
            returncode=2,
        )
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    for key in ("udid", "appiumServer", "apkPath", "appPackage", "testEmail", "testPassword"):
        if not config.get(key):
            pytest.exit(f"config.json is missing '{key}'.", returncode=2)
    return config


@pytest.fixture(scope="session")
def config() -> dict:
    return load_config()


@pytest.fixture(scope="session")
def driver(config: dict):
    apk = Path(config["apkPath"])
    if not apk.is_absolute():
        apk = REPO_ROOT / apk

    options = UiAutomator2Options()
    options.udid = config["udid"]
    options.app = str(apk)
    options.app_package = config["appPackage"]
    options.auto_grant_permissions = False  # permission dialogs are part of the flows under test
    options.new_command_timeout = 120

    session = webdriver.Remote(config["appiumServer"], options=options)
    # React Native sets testID as a bare resource-id ("screen-login"); without this, UiAutomator2
    # rewrites AppiumBy.ID lookups to "<appPackage>:id/screen-login" and never finds them.
    session.update_settings({"disableIdLocatorAutocompletion": True})
    # Cold start: the debug APK downloads the JS bundle from Metro (over Wi-Fi when adb is wireless),
    # which can take longer than the implicit wait. Wait once for the first app screen (testID screen-*).
    WebDriverWait(session, STARTUP_TIMEOUT, poll_frequency=1).until(
        lambda d: d.find_elements(AppiumBy.XPATH, '//*[starts-with(@resource-id, "screen-")]')
    )
    session.implicitly_wait(10)
    yield session
    session.quit()


@pytest.fixture(autouse=True)
def app_in_foreground(request, config: dict):
    """Each test starts with the app under test on screen; otherwise it fails with what is on screen."""
    if "driver" not in request.fixturenames:
        yield
        return
    session = request.getfixturevalue("driver")
    package = config["appPackage"]
    if session.current_package != package:
        session.activate_app(package)
    current = session.current_package
    if current != package:
        pytest.fail(f"App {package} is not in the foreground (on screen: {current}).")
    yield


# Logcat tags worth keeping: JS console/errors, native crashes, Expo modules. Other apps' lines are dropped.
_LOGCAT_KEEP = re.compile(r"ReactNativeJS|ReactNative|AndroidRuntime|Expo|Hermes|FATAL|nutritiontracker")


def _safe_name(nodeid: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", nodeid).strip("_")


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    # Fixtures can read item.rep_call to act only after a failed test.
    setattr(item, f"rep_{report.when}", report)
    if report.when not in ("setup", "call") or not report.failed:
        return
    session = item.funcargs.get("driver")
    if session is None:
        return
    name = _safe_name(item.nodeid)
    shots = REPORTS_DIR / "screenshots"
    sources = REPORTS_DIR / "page-source"
    logcat = REPORTS_DIR / "logcat"
    for folder in (shots, sources, logcat):
        folder.mkdir(parents=True, exist_ok=True)
    try:
        session.get_screenshot_as_file(str(shots / f"{name}.png"))
        (sources / f"{name}.xml").write_text(session.page_source, encoding="utf-8")
        lines = [e.get("message", "") for e in session.get_log("logcat")]
        kept = [line for line in lines if _LOGCAT_KEEP.search(line)]
        (logcat / f"{name}.txt").write_text("\n".join(kept), encoding="utf-8")
    except Exception as exc:  # the report must still be written if the session died
        print(f"[e2e] could not capture failure artifacts for {name}: {exc}")
