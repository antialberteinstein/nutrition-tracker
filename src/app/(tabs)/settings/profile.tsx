import { usePreventRemove, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert } from "react-native";

import { Button, FormError } from "@/components/form";
import { FormScreen } from "@/components/form-screen";
import type { Profile } from "@/domain/nutrition";
import type { Result } from "@/features/auth/auth";
import {
  toFormValues,
  useProfile,
  useSaveProfile,
} from "@/features/profile/profile";
import { ProfileForm } from "@/features/profile/profile-form";
import { useTheme } from "@/hooks/use-theme";

/** Cài đặt › Hồ sơ (Account.md §2): same fields as onboarding, "Lưu", confirm before discarding. */
export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const profile = useProfile();
  const save = useSaveProfile();
  const [dirty, setDirty] = useState(false);

  // ACC-08: leaving with unsaved changes asks first; "Ở lại" keeps the typed data.
  const disablePrevention = usePreventRemove(dirty, ({ repeat }) => {
    Alert.alert("Bỏ thay đổi?", "Thay đổi chưa được lưu.", [
      { text: "Ở lại", style: "cancel" },
      {
        text: "Bỏ thay đổi",
        style: "destructive",
        onPress: () => {
          setDirty(false);
          repeat();
        },
      },
    ]);
  });

  const onSubmit = async (p: Profile): Promise<Result> => {
    const result = await save.mutateAsync(p);
    if (result.ok) {
      // Suggested goals are computed from the saved profile, so they follow it (ACC-07).
      setDirty(false);
      disablePrevention();
      router.back();
    }
    return result;
  };

  return (
    <FormScreen
      title="Hồ sơ"
      testID="screen-settings-profile"
      onBack={() => router.back()}
    >
      {profile.data ? (
        <ProfileForm
          initialValues={toFormValues(profile.data)}
          submitLabel="Lưu"
          onSubmit={onSubmit}
          onDirtyChange={setDirty}
        />
      ) : profile.isPending ? (
        <ActivityIndicator
          color={colors.primary}
          accessibilityLabel="Đang tải"
        />
      ) : (
        <>
          <FormError
            message="Không tải được hồ sơ. Kiểm tra mạng rồi thử lại."
            testID="settings-profile-error"
          />
          <Button
            label="Thử lại"
            onPress={() => void profile.refetch()}
            loading={profile.isFetching}
            testID="settings-profile-retry"
          />
        </>
      )}
    </FormScreen>
  );
}
