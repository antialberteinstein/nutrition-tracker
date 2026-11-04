import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, BackHandler } from "react-native";

import { Button, FormError } from "@/components/form";
import { FormScreen } from "@/components/form-screen";
import { computeTargets, type Profile } from "@/domain/nutrition";
import { signOut } from "@/features/auth/auth";
import { TargetsSummary } from "@/features/goals/targets-summary";
import {
  EMPTY_PROFILE_FORM,
  toFormValues,
  useSaveProfile,
} from "@/features/profile/profile";
import { ProfileForm } from "@/features/profile/profile-form";

/**
 * Account.md §2: profile form → "Tiếp tục" → summary of BMI, BMR and suggested goals → "Bắt đầu".
 * Only "Bắt đầu" saves, so the root guards move on to the tabs after the user saw the summary.
 */
export default function OnboardingScreen() {
  const save = useSaveProfile();
  const [draft, setDraft] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Back on the summary returns to the form; on the form it asks to leave the app (§3.5).
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (draft) {
          setDraft(null);
          return true;
        }
        Alert.alert("Thoát app?", "Hồ sơ chưa được lưu.", [
          { text: "Ở lại", style: "cancel" },
          {
            text: "Thoát",
            style: "destructive",
            onPress: () => BackHandler.exitApp(),
          },
        ]);
        return true;
      });
      return () => sub.remove();
    }, [draft]),
  );

  if (draft) {
    // A new account has no custom goals yet and Workout is off (GOAL-02).
    const targets = computeTargets(
      draft,
      {},
      { currentYear: new Date().getFullYear(), workoutEnabled: false },
    );
    const start = async () => {
      setError(null);
      const result = await save.mutateAsync(draft);
      if (!result.ok) setError(result.failure.message); // stay here, keep the draft (ACC-14)
    };
    return (
      <FormScreen
        title="Mục tiêu gợi ý"
        subtitle="Tính từ hồ sơ của bạn. Bạn sửa được trong Cài đặt › Mục tiêu."
        testID="screen-onboarding-summary"
        onBack={() => setDraft(null)}
      >
        <TargetsSummary targets={targets} workoutEnabled={false} />
        <FormError message={error} testID="onboarding-error" />
        <Button
          label="Bắt đầu"
          onPress={() => void start()}
          loading={save.isPending}
          testID="onboarding-start"
        />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Hồ sơ của bạn"
      subtitle="Dùng để tính mục tiêu calo và dinh dưỡng mỗi ngày. Bạn sửa được trong Cài đặt."
      testID="screen-onboarding"
    >
      <ProfileForm
        initialValues={
          save.variables ? toFormValues(save.variables) : EMPTY_PROFILE_FORM
        }
        submitLabel="Tiếp tục"
        onSubmit={async (p) => {
          setDraft(p);
          return { ok: true };
        }}
      />
      <Button
        label="Đăng xuất"
        variant="text"
        onPress={() => void signOut()}
        testID="onboarding-signout"
      />
    </FormScreen>
  );
}
