import { useState } from "react";

import { Button, FormError } from "@/components/form";
import { FormScreen } from "@/components/form-screen";
import { ThemedText } from "@/components/themed-text";
import { signOut } from "@/features/auth/auth";
import { useAuth } from "@/features/auth/auth-provider";

/** Cài đặt. 0.1.0 adds Hồ sơ, Mục tiêu, Nhắc nhở, Món đã lưu, Xoá tài khoản in later issues. */
export default function SettingsScreen() {
  const { session } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSignOut = async () => {
    setBusy(true);
    setError(null);
    const result = await signOut();
    setBusy(false);
    // On success the root navigator removes the tabs and shows Đăng nhập (ACC-10).
    if (!result.ok) setError(result.failure.message);
  };

  return (
    <FormScreen title="Cài đặt" testID="screen-settings">
      <ThemedText variant="titleMedium">Tài khoản</ThemedText>
      <ThemedText
        variant="body"
        color="onSurfaceVariant"
        testID="settings-email"
      >
        {session?.user.email ?? ""}
      </ThemedText>
      <FormError message={error} />
      <Button
        label="Đăng xuất"
        variant="text"
        onPress={onSignOut}
        loading={busy}
        testID="settings-signout"
      />
    </FormScreen>
  );
}
