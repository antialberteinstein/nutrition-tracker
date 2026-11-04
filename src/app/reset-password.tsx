import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button, FormError, TextField } from "@/components/form";
import { FormScreen } from "@/components/form-screen";
import {
  newPasswordSchema,
  type NewPasswordValues,
  signOut,
  updatePassword,
} from "@/features/auth/auth";

/** Shown while a recovery session is active (password-recovery link → /auth/callback). */
export default function ResetPasswordScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await updatePassword(values);
    // On success USER_UPDATED ends recovery and the root guards move on to the app.
    if (result.ok) return;
    const { field, message } = result.failure;
    if (field === "password") setError("password", { message });
    else setFormError(message);
  });

  return (
    <FormScreen title="Đặt mật khẩu mới" testID="screen-reset-password">
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Mật khẩu mới (ít nhất 8 ký tự)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
            secureToggle
            autoComplete="new-password"
            testID="reset-password"
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
            testID="reset-confirm"
          />
        )}
      />
      <FormError message={formError} />
      <Button
        label="Lưu mật khẩu"
        onPress={onSubmit}
        loading={isSubmitting}
        testID="reset-submit"
      />
      <Button
        label="Huỷ và đăng xuất"
        variant="text"
        onPress={() => void signOut()}
        testID="reset-signout"
      />
    </FormScreen>
  );
}
