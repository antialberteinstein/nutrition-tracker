import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";

import { Button, FormError } from "@/components/form";
import { FormScreen } from "@/components/form-screen";
import { exchangeCode, parseAuthCallback } from "@/features/auth/auth";
import { useTheme } from "@/hooks/use-theme";

/**
 * Deep link target of the confirmation and recovery emails:
 * nutritiontracker://auth/callback?code=…&next=home|reset-password (PKCE).
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; next?: string }>();
  const { colors } = useTheme();
  const { code } = parseAuthCallback(params);
  const [exchangeFailed, setExchangeFailed] = useState(false);

  useEffect(() => {
    if (!code) return;
    let active = true;
    exchangeCode(code).then((result) => {
      // On success the new session removes this screen and the root guards pick the destination
      // (Đặt mật khẩu mới for a recovery link, onboarding or Hôm nay otherwise).
      if (active && !result.ok) setExchangeFailed(true);
    });
    return () => {
      active = false;
    };
  }, [code]);

  const error =
    !code || exchangeFailed
      ? "Link không hợp lệ hoặc đã hết hạn. Thử gửi lại email."
      : null;

  return (
    <FormScreen title="Đang xác nhận" testID="screen-auth-callback">
      {error ? (
        <>
          <FormError message={error} testID="callback-error" />
          <Button
            label="Về đăng nhập"
            onPress={() => router.replace("/login")}
            testID="callback-login"
          />
        </>
      ) : (
        <ActivityIndicator
          color={colors.primary}
          accessibilityLabel="Đang xác nhận"
        />
      )}
    </FormScreen>
  );
}
