"""Shared Appium fixtures for the mobile E2E suite (ADR-012, docs/testing/test-plan.md).

- Reads the device config from config.json (gitignored; copy config.example.json).
- Creates one UiAutomator2 session per test session.
- On a failed test, saves a screenshot and the UI page source into reports/.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

import pytest
from appium import webdriver
from appium.options.android import UiAutomator2Options

E2E_DIR = Path(__file__).resolve().parent
REPO_ROOT = E2E_DIR.parent.parent
CONFIG_PATH = Path(os.environ.get("E2E_CONFIG", E2E_DIR / "config.json"))
REPORTS_DIR = Path(os.environ.get("E2E_REPORTS_DIR", REPO_ROOT / "reports"))


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        pytest.exit(
            f"Missing {CONFIG_PATH}. Copy config.example.json to config.json and set the device UDID.",
            returncode=2,
        )
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    for key in ("udid", "appiumServer", "apkPath", "appPackage"):
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
    session.implicitly_wait(10)
    yield session
    session.quit()


def _safe_name(nodeid: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", nodeid).strip("_")


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when != "call" or not report.failed:
        return
    session = item.funcargs.get("driver")
    if session is None:
        return
    name = _safe_name(item.nodeid)
    shots = REPORTS_DIR / "screenshots"
    sources = REPORTS_DIR / "page-source"
    shots.mkdir(parents=True, exist_ok=True)
    sources.mkdir(parents=True, exist_ok=True)
    try:
        session.get_screenshot_as_file(str(shots / f"{name}.png"))
        (sources / f"{name}.xml").write_text(session.page_source, encoding="utf-8")
    except Exception as exc:  # the report must still be written if the session died
        print(f"[e2e] could not capture failure artifacts for {name}: {exc}")
