"""Onboarding and Cài đặt › Hồ sơ E2E (issue #13). Requires a cloud test account that has no
profile yet (ADR-015, test-plan §3); after a passing run, create a new account for the next one.

Runs after test_auth.py (alphabetical order), which leaves the app on Đăng nhập.
"""

import datetime

import pytest
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait

from test_auth import TEST_EMAIL, TEST_PASSWORD, by_id, go_to_login, type_into

YEAR = datetime.date.today().year


def sign_in(driver):
    go_to_login(driver)
    type_into(driver, "login-email", TEST_EMAIL)
    type_into(driver, "login-password", TEST_PASSWORD)
    by_id(driver, "login-submit").click()


def wait_until(driver, condition, timeout=5):
    """Explicit wait with implicit waits off, so negative checks are fast and not racy."""
    driver.implicitly_wait(0)
    try:
        return WebDriverWait(driver, timeout, poll_frequency=0.25).until(lambda d: condition(d))
    finally:
        driver.implicitly_wait(10)


def present(test_id):
    return lambda d: bool(d.find_elements(AppiumBy.ID, test_id))


def absent(test_id):
    return lambda d: not d.find_elements(AppiumBy.ID, test_id)


def submit_is(enabled):
    want = "true" if enabled else "false"
    return lambda d: d.find_element(AppiumBy.ID, "profile-submit").get_attribute("enabled") == want


def expect_field_error(driver, test_id, value, shown):
    type_into(driver, test_id, value)
    wait_until(driver, (present if shown else absent)(f"{test_id}-error"))


def hide_keyboard(driver):
    if driver.is_keyboard_shown():
        driver.hide_keyboard()


def by_text(driver, pattern):
    """Case-insensitive text match (Android dialogs may upper-case button labels)."""
    return driver.find_element(
        AppiumBy.ANDROID_UIAUTOMATOR, f'new UiSelector().textMatches("(?iu){pattern}")'
    )


@pytest.fixture(autouse=True)
def back_to_login(driver, request):
    """If a test fails midway, sign out so later files (test_smoke) start on Đăng nhập.

    Passing tests hand their state to the next test in this file, so only failures clean up.
    """
    yield
    rep = getattr(request.node, "rep_call", None)
    if rep is None or not rep.failed:
        return
    driver.implicitly_wait(0)
    try:
        for _ in range(4):
            if driver.find_elements(AppiumBy.ID, "screen-login"):
                return
            if driver.find_elements(AppiumBy.ID, "screen-today"):
                sign_out_from_tabs(driver)  # Back on a tab root would background the app
                continue
            for sign_out in ("onboarding-signout", "settings-signout"):
                found = driver.find_elements(AppiumBy.ID, sign_out)
                if found:
                    found[0].click()
                    break
            else:
                hide_keyboard(driver)
                driver.back()
                dialogs = driver.find_elements(AppiumBy.ID, "android:id/button1")
                if dialogs and not driver.find_elements(AppiumBy.ID, "screen-onboarding"):
                    dialogs[0].click()  # "Bỏ thay đổi" on a dirty Hồ sơ screen
    finally:
        driver.implicitly_wait(10)


def sign_out_from_tabs(driver):
    by_text(driver, "Cài đặt").click()
    by_id(driver, "settings-signout").click()
    assert by_id(driver, "screen-login").is_displayed()


def test_onboarding_validation_then_save(driver, config):
    """TC-E2E-04 · ACC-04, ACC-05: first sign-in lands on onboarding; invalid values lock 'Tiếp tục'.
    TC-E2E-05 · ACC-06, GOAL-01, GOAL-02: the summary shows example 1; reopening goes to Hôm nay."""
    sign_in(driver)
    if driver.find_elements(AppiumBy.ID, "screen-today"):
        sign_out_from_tabs(driver)  # leave the app signed out for the tests that follow
        pytest.skip("the test account already has a profile: create a new one (test-plan §3)")
    assert by_id(driver, "screen-onboarding").is_displayed()
    wait_until(driver, submit_is(False))

    for value in ("19.9", "300.1"):
        expect_field_error(driver, "profile-weight", value, shown=True)
    expect_field_error(driver, "profile-weight", "70", shown=False)
    expect_field_error(driver, "profile-height", "99", shown=True)
    expect_field_error(driver, "profile-height", "175", shown=False)
    for age in (12, 101):
        expect_field_error(driver, "profile-birth-year", str(YEAR - age), shown=True)
    expect_field_error(driver, "profile-birth-year", str(YEAR - 30), shown=False)
    hide_keyboard(driver)
    by_id(driver, "profile-sex-male").click()
    by_id(driver, "profile-activity-moderate").click()
    # One field left blank: still locked, and the form says which one.
    wait_until(driver, submit_is(False))
    assert "Mong muốn" in by_id(driver, "profile-missing").text

    by_id(driver, "profile-goal-lose").click()
    wait_until(driver, submit_is(True))
    by_id(driver, "profile-submit").click()

    # Goals.md §4 example 1 (male, 70 kg, 175 cm, 30, moderate, lose).
    assert by_id(driver, "screen-onboarding-summary").is_displayed()
    assert by_id(driver, "summary-bmr").text == "1.649 kcal"
    assert by_id(driver, "summary-tdee").text == "2.556 kcal"
    assert by_id(driver, "summary-calories").text == "2.056 kcal"
    assert by_id(driver, "summary-protein").text == "56 · 112 · 154 g"
    assert by_id(driver, "summary-sugar").text == "0 · 26 · 51 g"
    driver.implicitly_wait(0)
    assert not driver.find_elements(
        AppiumBy.ANDROID_UIAUTOMATOR, 'new UiSelector().textContains("Tự đặt")'
    )
    driver.implicitly_wait(10)
    by_id(driver, "onboarding-start").click()
    assert by_id(driver, "screen-today").is_displayed()

    driver.terminate_app(config["appPackage"])
    driver.activate_app(config["appPackage"])
    assert by_id(driver, "screen-today").is_displayed()


def open_goals(driver):
    by_text(driver, "Cài đặt").click()
    by_id(driver, "settings-goals").click()
    assert by_id(driver, "screen-settings-goals").is_displayed()


def save_goals(driver):
    hide_keyboard(driver)
    by_id(driver, "goals-submit").click()
    wait_until(driver, present("goals-saved"))


def test_goal_warnings_then_use_suggestion(driver):
    """TC-E2E-06 · GOAL-03, GOAL-04, GOAL-06, GOAL-10: warnings never block; 'Dùng gợi ý' clears."""
    if not driver.find_elements(AppiumBy.ID, "screen-today"):
        pytest.skip("needs the profile created by test_onboarding_validation_then_save")
    open_goals(driver)
    type_into(driver, "goal-calorieAdjustment", "+1")
    wait_until(driver, present("warning-W1-calorieAdjustment"))
    save_goals(driver)

    # Switch the profile to 'gain'; the custom +1 adjustment is kept.
    driver.back()
    by_id(driver, "settings-profile").click()
    by_id(driver, "profile-goal-gain").click()
    by_id(driver, "profile-submit").click()
    by_id(driver, "settings-goals").click()
    assert by_id(driver, "goal-calorieAdjustment").text == "+1"
    type_into(driver, "goal-calorieAdjustment", "-1")
    wait_until(driver, present("warning-W2-calorieAdjustment"))
    type_into(driver, "goal-calorieTarget", "1500")
    wait_until(driver, present("warning-W3-calorieTarget"))
    save_goals(driver)

    hide_keyboard(driver)
    by_id(driver, "goal-calorieTarget-reset").click()
    wait_until(driver, absent("goal-calorieTarget-custom"))
    save_goals(driver)
    driver.back()
    by_id(driver, "settings-goals").click()  # reopened: still following the suggestion
    wait_until(driver, absent("goal-calorieTarget-custom"))
    driver.back()


def test_profile_unsaved_changes_then_save(driver):
    """TC-E2E-08 · ACC-07, ACC-08: 'Ở lại' keeps typed data; saved weight updates suggested goals."""
    if driver.find_elements(AppiumBy.ID, "screen-login"):
        pytest.skip("needs the profile created by test_onboarding_validation_then_save")
    by_text(driver, "Cài đặt").click()
    by_id(driver, "settings-profile").click()
    assert by_id(driver, "screen-settings-profile").is_displayed()

    type_into(driver, "profile-weight", "72")
    hide_keyboard(driver)  # with the keyboard open, Back only hides it (ACC-16)
    driver.back()
    by_text(driver, "Ở lại").click()
    assert by_id(driver, "screen-settings-profile").is_displayed()
    assert by_id(driver, "profile-weight").text == "72"  # typed data is kept

    by_id(driver, "profile-submit").click()
    assert by_id(driver, "screen-settings").is_displayed()
    assert "72 kg" in by_id(driver, "settings-profile").get_attribute("content-desc")
    by_id(driver, "settings-goals").click()
    assert by_id(driver, "goal-proteinTargetG").text == "115"  # round(1.6 × 72), suggested
    driver.back()

    by_id(driver, "settings-signout").click()
    assert by_id(driver, "screen-login").is_displayed()
