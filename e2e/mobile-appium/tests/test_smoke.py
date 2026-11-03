from appium.webdriver.common.appiumby import AppiumBy


def test_app_launches_on_today_tab(driver):
    """TC-E2E-00 · smoke: the debug APK starts and shows the Hôm nay tab (testID screen-today)."""
    assert driver.find_element(AppiumBy.ID, "screen-today").is_displayed()
