from appium.webdriver.common.appiumby import AppiumBy


def test_app_launches_signed_out(driver):
    """TC-E2E-00 · smoke: a fresh install of the debug APK opens on Đăng nhập (testID screen-login)."""
    assert driver.find_element(AppiumBy.ID, "screen-login").is_displayed()
