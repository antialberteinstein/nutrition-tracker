"""Onboarding and Cài đặt › Hồ sơ E2E (issue #13). Requires a freshly reset Supabase local
(`npx supabase db reset`, test-plan §3): seed user e2e-a starts without a profile.

Runs after test_auth.py (alphabetical order), which leaves the app on Đăng nhập.
"""

import datetime

import pytest
from appium.webdriver.common.appiumby import AppiumBy

from test_auth import SEED_EMAIL, SEED_PASSWORD, by_id, go_to_login, type_into

YEAR = datetime.date.today().year


def sign_in(driver):
    go_to_login(driver)
    type_into(driver, "login-email", SEED_EMAIL)
    type_into(driver, "login-password", SEED_PASSWORD)
    by_id(driver, "login-submit").click()


def submit_enabled(driver):
    return by_id(driver, "profile-submit").get_attribute("enabled") == "true"


def field_error_shown(driver, test_id, value):
    type_into(driver, test_id, value)
    return bool(driver.find_elements(AppiumBy.ID, f"{test_id}-error"))


def by_text(driver, pattern):
    """Case-insensitive text match (Android dialogs may upper-case button labels)."""
    return driver.find_element(
        AppiumBy.ANDROID_UIAUTOMATOR, f'new UiSelector().textMatches("(?iu){pattern}")'
    )


def sign_out_from_tabs(driver):
    by_text(driver, "Cài đặt").click()
    by_id(driver, "settings-signout").click()
    assert by_id(driver, "screen-login").is_displayed()


def test_onboarding_validation_then_save(driver):
    """TC-E2E-04 · ACC-04, ACC-05: first sign-in lands on onboarding; invalid values lock 'Tiếp tục'."""
    sign_in(driver)
    if driver.find_elements(AppiumBy.ID, "screen-today"):
        sign_out_from_tabs(driver)  # leave the app signed out for the tests that follow
        pytest.skip("e2e-a already has a profile: run `npx supabase db reset` first")
    assert by_id(driver, "screen-onboarding").is_displayed()
    assert not submit_enabled(driver)

    for value in ("19.9", "300.1"):
        assert field_error_shown(driver, "profile-weight", value), value
    assert not field_error_shown(driver, "profile-weight", "70")
    assert field_error_shown(driver, "profile-height", "99")
    assert not field_error_shown(driver, "profile-height", "175")
    for age in (12, 101):
        assert field_error_shown(driver, "profile-birth-year", str(YEAR - age)), age
    assert not field_error_shown(driver, "profile-birth-year", str(YEAR - 30))
    by_id(driver, "profile-sex-male").click()
    by_id(driver, "profile-activity-moderate").click()
    assert not submit_enabled(driver)  # goal still empty

    by_id(driver, "profile-goal-lose").click()
    assert submit_enabled(driver)
    by_id(driver, "profile-submit").click()
    assert by_id(driver, "screen-today").is_displayed()


def test_profile_unsaved_changes_then_save(driver):
    """TC-E2E-08 · ACC-08 (ACC-07 goal recalculation is checked once #14 shows goals)."""
    if not driver.find_elements(AppiumBy.ID, "screen-today"):
        pytest.skip("needs the profile created by test_onboarding_validation_then_save")
    by_text(driver, "Cài đặt").click()
    by_id(driver, "settings-profile").click()
    assert by_id(driver, "screen-settings-profile").is_displayed()

    type_into(driver, "profile-weight", "72")
    driver.back()
    by_text(driver, "Ở lại").click()
    assert by_id(driver, "screen-settings-profile").is_displayed()
    assert by_id(driver, "profile-weight").text == "72"  # typed data is kept

    by_id(driver, "profile-submit").click()
    assert by_id(driver, "screen-settings").is_displayed()
    assert "72 kg" in by_id(driver, "settings-profile").get_attribute("content-desc")

    by_id(driver, "settings-signout").click()
    assert by_id(driver, "screen-login").is_displayed()
