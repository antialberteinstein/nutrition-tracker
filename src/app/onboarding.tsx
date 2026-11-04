import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Alert, BackHandler } from "react-native";

import { Button } from "@/components/form";
import { FormScreen } from "@/components/form-screen";
import { signOut } from "@/features/auth/auth";
import { EMPTY_PROFILE_FORM, useSaveProfile } from "@/features/profile/profile";
import { ProfileForm } from "@/features/profile/profile-form";

/**
 * Account.md §2, §3: first profile entry. Saving creates the profile, which moves the root guards
 * on to the tabs (the goal summary between the two arrives with issue #14).
 */
export default function OnboardingScreen() {
  const save = useSaveProfile();

  // Back never returns to a previous screen here; it asks to leave the app (Account.md §3.5).
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
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
    }, []),
  );

  return (
    <FormScreen
      title="Hồ sơ của bạn"
      subtitle="Dùng để tính mục tiêu calo và dinh dưỡng mỗi ngày. Bạn sửa được trong Cài đặt."
      testID="screen-onboarding"
    >
      <ProfileForm
        initialValues={EMPTY_PROFILE_FORM}
        submitLabel="Tiếp tục"
        onSubmit={save.mutateAsync}
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
