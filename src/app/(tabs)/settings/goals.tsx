import { usePreventRemove, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert } from "react-native";

import { Button, FormError } from "@/components/form";
import { FormScreen } from "@/components/form-screen";
import { useSaveGoals, useTargets } from "@/features/goals/goals";
import { GoalsForm } from "@/features/goals/goals-form";
import { useTheme } from "@/hooks/use-theme";

/** Cài đặt › Mục tiêu (Goals.md §2–3). Stays open after saving so warnings remain visible. */
export default function GoalsSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, goals, workoutEnabled, isPending, refetch } = useTargets();
  const save = useSaveGoals();
  const [dirty, setDirty] = useState(false);

  usePreventRemove(dirty, ({ repeat }) => {
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

  return (
    <FormScreen
      title="Mục tiêu"
      subtitle="Ô đang theo gợi ý tự đổi khi hồ sơ đổi. Giá trị bạn tự đặt được giữ nguyên."
      testID="screen-settings-goals"
      onBack={() => router.back()}
    >
      {profile && goals ? (
        <GoalsForm
          profile={profile}
          saved={goals}
          workoutEnabled={workoutEnabled}
          onSubmit={save.mutateAsync}
          onDirtyChange={setDirty}
        />
      ) : isPending ? (
        <ActivityIndicator
          color={colors.primary}
          accessibilityLabel="Đang tải"
        />
      ) : (
        <>
          <FormError
            message="Không tải được mục tiêu. Kiểm tra mạng rồi thử lại."
            testID="settings-goals-error"
          />
          <Button
            label="Thử lại"
            onPress={refetch}
            testID="settings-goals-retry"
          />
        </>
      )}
    </FormScreen>
  );
}
