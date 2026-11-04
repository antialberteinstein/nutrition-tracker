import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button, FormError, TextField } from "@/components/form";
import { FormScreen } from "@/components/form-screen";
import { ThemedText } from "@/components/themed-text";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
  requestPasswordReset,
} from "@/features/auth/auth";

/** ACC-09: the confirmation never reveals whether the email has an account. */
const RESET_SENT_MESSAGE =
  "Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await requestPasswordReset(values);
    if (result.ok) setSent(true);
    else setFormError(result.failure.message);
  });

  return (
    <FormScreen title="Quên mật khẩu" testID="screen-forgot-password">
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            onSubmitEditing={() => void onSubmit()}
            testID="forgot-email"
          />
        )}
      />
      <FormError message={formError} />
      {sent ? (
        <ThemedText
          variant="body"
          accessibilityLiveRegion="polite"
          testID="forgot-sent"
        >
          {RESET_SENT_MESSAGE}
        </ThemedText>
      ) : null}
      <Button
        label="Gửi link"
        onPress={onSubmit}
        loading={isSubmitting}
        testID="forgot-submit"
      />
      <Button
        label="Về đăng nhập"
        variant="text"
        onPress={() => router.back()}
      />
    </FormScreen>
  );
}
