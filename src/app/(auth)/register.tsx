import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button, FormError, TextField } from "@/components/form";
import { FormScreen } from "@/components/form-screen";
import { signUp, signUpSchema, type SignUpValues } from "@/features/auth/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await signUp(values);
    if (result.ok) {
      router.replace({
        pathname: "/check-email",
        params: { email: values.email.trim() },
      });
      return;
    }
    const { field, message } = result.failure;
    if (field === "form") setFormError(message);
    else setError(field, { message });
  });

  return (
    <FormScreen title="Tạo tài khoản" testID="screen-register">
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
            testID="register-email"
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Mật khẩu (ít nhất 8 ký tự)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
            secureToggle
            autoComplete="new-password"
            testID="register-password"
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <TextField
            label="Nhập lại mật khẩu"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.confirmPassword?.message}
            secureToggle
            autoComplete="new-password"
            onSubmitEditing={() => void onSubmit()}
            testID="register-confirm"
          />
        )}
      />
      <FormError message={formError} testID="register-error" />
      <Button
        label="Tạo tài khoản"
        onPress={onSubmit}
        loading={isSubmitting}
        testID="register-submit"
      />
      <Button
        label="Đã có tài khoản? Đăng nhập"
        variant="text"
        onPress={() => router.back()}
      />
    </FormScreen>
  );
}
