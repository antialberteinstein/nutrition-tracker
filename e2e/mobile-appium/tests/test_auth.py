"""Account E2E (issue #12). Requires Supabase local with supabase/seed.sql (test-plan §3).

The driver fixture installs the app once per session, so the first test starts signed out;
every test that signs in signs out again before it ends.
"""

import time

from appium.webdriver.common.appiumby import AppiumBy

SEED_EMAIL = "e2e-a@test.local"  # confirmed, no profile yet
SEED_PASSWORD = "E2e-local-only-1"  # local-only synthetic password (supabase/seed.sql)


def by_id(driver, test_id):
    return driver.find_element(AppiumBy.ID, test_id)


def type_into(driver, test_id, text):
    field = by_id(driver, test_id)
    field.clear()
    field.send_keys(text)


def go_to_login(driver):
    """From any auth screen, return to Đăng nhập."""
    for _ in range(3):
        if driver.find_elements(AppiumBy.ID, "screen-login"):
            return
        driver.back()
    assert by_id(driver, "screen-login").is_displayed()


def test_register_new_email_shows_check_email(driver):
    """TC-E2E-01 · ACC-01: a new email goes to 'Kiểm tra email' and does not enter the app."""
    go_to_login(driver)
    by_id(driver, "login-register").click()
    type_into(driver, "register-email", f"e2e-new-{int(time.time())}@test.local")
    type_into(driver, "register-password", "12345678")
    type_into(driver, "register-confirm", "12345678")
    by_id(driver, "register-submit").click()
    assert by_id(driver, "screen-check-email").is_displayed()
    by_id(driver, "check-email-login").click()


def test_register_invalid_input(driver):
    """TC-E2E-02 · ACC-02: existing email, short password and mismatched passwords are rejected."""
    go_to_login(driver)
    by_id(driver, "login-register").click()
    type_into(driver, "register-email", SEED_EMAIL)
    type_into(driver, "register-password", "1234567")
    type_into(driver, "register-confirm", "7654321")
    by_id(driver, "register-submit").click()
    assert by_id(driver, "register-password-error").is_displayed()
    assert by_id(driver, "register-confirm-error").is_displayed()
    type_into(driver, "register-password", "12345678")
    type_into(driver, "register-confirm", "12345678")
    by_id(driver, "register-submit").click()
    assert "đã được đăng ký" in by_id(driver, "register-email-error").text
    assert by_id(driver, "register-email").text == SEED_EMAIL  # typed data is kept
    driver.back()


def test_wrong_password(driver):
    """TC-E2E-03 · ACC-03: wrong password shows one generic message."""
    go_to_login(driver)
    type_into(driver, "login-email", SEED_EMAIL)
    type_into(driver, "login-password", "wrong-password")
    by_id(driver, "login-submit").click()
    assert by_id(driver, "login-error").text == "Email hoặc mật khẩu không đúng"


def test_forgot_password_same_message(driver):
    """TC-E2E-07 · ACC-09: unknown and known emails get the same confirmation."""
    messages = []
    for email in ("nobody-here@test.local", SEED_EMAIL):
        # Open the screen fresh each time so the second read waits for the second response.
        go_to_login(driver)
        by_id(driver, "login-forgot").click()
        assert not driver.find_elements(AppiumBy.ID, "forgot-sent")
        type_into(driver, "forgot-email", email)
        by_id(driver, "forgot-submit").click()
        messages.append(by_id(driver, "forgot-sent").text)
        driver.back()
    assert messages[0] == messages[1]


def test_sign_in_then_sign_out(driver, config):
    """TC-E2E-19 · ACC-04, ACC-10: first sign-in lands on onboarding; sign-out returns to login for good."""
    go_to_login(driver)
    type_into(driver, "login-email", SEED_EMAIL)
    type_into(driver, "login-password", SEED_PASSWORD)
    by_id(driver, "login-submit").click()
    assert by_id(driver, "screen-onboarding").is_displayed()
    by_id(driver, "onboarding-signout").click()
    assert by_id(driver, "screen-login").is_displayed()
    # Back on the root screen leaves the app; it must not reveal a signed-in screen first.
    driver.back()
    assert not driver.find_elements(AppiumBy.ID, "screen-onboarding")
    driver.activate_app(config["appPackage"])
    assert by_id(driver, "screen-login").is_displayed()
    assert not driver.find_elements(AppiumBy.ID, "screen-onboarding")
