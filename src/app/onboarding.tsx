import { Button } from "@/components/form";
import { FormScreen } from "@/components/form-screen";
import { signOut } from "@/features/auth/auth";

/** Placeholder until issue #13 builds the profile form. Reached when signed in without a profile. */
export default function OnboardingScreen() {
  return (
    <FormScreen
      title="Nhập hồ sơ"
      subtitle="Màn nhập hồ sơ đang được xây dựng."
      testID="screen-onboarding"
    >
      <Button
        label="Đăng xuất"
        variant="text"
        onPress={() => void signOut()}
        testID="onboarding-signout"
      />
    </FormScreen>
  );
}
