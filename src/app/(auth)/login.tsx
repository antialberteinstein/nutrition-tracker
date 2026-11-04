import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button, FormError, TextField } from "@/components/form";
import { FormScreen } from "@/components/form-screen";
import { ThemedText } from "@/components/themed-text";
import {
  resendConfirmation,
  signIn,
  signInSchema,
  type SignInValues,
} from "@/features/auth/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resent, setResent] = useState(false);
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setResent(false);
    const result = await signIn(values);
    if (!result.ok) {
      setFormError(result.failure.message);
      setNeedsConfirmation(!!result.failure.needsConfirmation);
    }
    // On success the root navigator switches to onboarding or the tabs.
  });

  const onResend = async () => {
    const result = await resendConfirmation(getValues("email"));
    if (result.ok) setResent(true);
    else setFormError(result.failure.message);
  };

  return (
    <FormScreen title="Đăng nhập" testID="screen-login">
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
            testID="login-email"
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Mật khẩu"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
            secureToggle
            autoComplete="current-password"
            onSubmitEditing={() => void onSubmit()}
            testID="login-password"
          />
        )}
      />
      <FormError message={formError} testID="login-error" />
      {needsConfirmation ? (
        <Button
          label={resent ? "Đã gửi lại email" : "Gửi lại email xác nhận"}
          variant="text"
          disabled={resent}
          onPress={onResend}
          testID="login-resend"
        />
      ) : null}
      <Button
        label="Đăng nhập"
        onPress={onSubmit}
        loading={isSubmitting}
        testID="login-submit"
      />
      <Button
        label="Quên mật khẩu"
        variant="text"
        onPress={() => router.push("/forgot-password")}
        testID="login-forgot"
      />
      <ThemedText variant="bodySmall" color="onSurfaceVariant">
        Chưa có tài khoản?
      </ThemedText>
      <Button
        label="Tạo tài khoản"
        variant="text"
        onPress={() => router.push("/register")}
        testID="login-register"
      />
    </FormScreen>
  );
}
