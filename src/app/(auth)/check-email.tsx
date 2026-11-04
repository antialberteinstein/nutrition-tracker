import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { Button, FormError } from "@/components/form";
import { FormScreen } from "@/components/form-screen";
import { resendConfirmation } from "@/features/auth/auth";

export default function CheckEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onResend = async () => {
    if (!email) return;
    setError(null);
    const result = await resendConfirmation(email);
    if (result.ok) setSent(true);
    else setError(result.failure.message);
  };

  return (
    <FormScreen
      title="Kiểm tra email"
      subtitle={`Mở link xác nhận vừa được gửi tới ${email ?? "email của bạn"} để bắt đầu dùng app.`}
      testID="screen-check-email"
    >
      <FormError message={error} />
      {email ? (
        <Button
          label={sent ? "Đã gửi lại email" : "Gửi lại email"}
          variant="text"
          disabled={sent}
          onPress={onResend}
          testID="check-email-resend"
        />
      ) : null}
      <Button
        label="Về đăng nhập"
        onPress={() => router.replace("/login")}
        testID="check-email-login"
      />
    </FormScreen>
  );
}
