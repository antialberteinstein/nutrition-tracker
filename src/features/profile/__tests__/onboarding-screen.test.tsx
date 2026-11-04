import { describe, expect, it, jest } from "@jest/globals";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import OnboardingScreen from "@/app/onboarding";

const mockMutateAsync = jest.fn<() => Promise<{ ok: true }>>();

jest.mock("expo-router", () => ({ useFocusEffect: () => undefined }));
jest.mock("react-native-safe-area-context", () => {
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return { SafeAreaView: View };
});
jest.mock("expo-symbols", () => ({ SymbolView: () => null }));
jest.mock("@/lib/supabase", () => ({ supabase: {} }));
jest.mock("@/features/profile/profile", () => {
  const actual = jest.requireActual<
    typeof import("@/features/profile/profile")
  >("@/features/profile/profile");
  return {
    ...actual,
    useSaveProfile: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  };
});

const fill = async () => {
  await fireEvent.changeText(screen.getByTestId("profile-weight"), "70");
  await fireEvent.changeText(screen.getByTestId("profile-height"), "175");
  await fireEvent.press(screen.getByTestId("profile-sex-male"));
  await fireEvent.changeText(
    screen.getByTestId("profile-birth-year"),
    String(new Date().getFullYear() - 30),
  );
  await fireEvent.press(screen.getByTestId("profile-activity-moderate"));
  await fireEvent.press(screen.getByTestId("profile-goal-lose"));
};

const continueToSummary = async () => {
  await waitFor(() =>
    expect(
      screen.getByTestId("profile-submit").props.accessibilityState?.disabled,
    ).toBe(false),
  );
  await fireEvent.press(screen.getByTestId("profile-submit"));
  expect(await screen.findByTestId("screen-onboarding-summary")).toBeTruthy();
};

describe("OnboardingScreen", () => {
  it("'Tiếp tục' shows the summary without saving; only 'Bắt đầu' saves", async () => {
    mockMutateAsync.mockResolvedValue({ ok: true });
    await render(<OnboardingScreen />);
    await fill();
    await continueToSummary();
    expect(screen.getByTestId("summary-calories").props.children).toBe(
      "2.056 kcal",
    );
    expect(mockMutateAsync).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId("onboarding-start"));
    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ weightKg: 70, goalType: "lose" }),
      ),
    );
  });

  it("Back from the summary returns to the form with everything still filled in", async () => {
    await render(<OnboardingScreen />);
    await fill();
    await continueToSummary();

    await fireEvent.press(screen.getByTestId("screen-onboarding-summary-back"));
    expect(await screen.findByTestId("screen-onboarding")).toBeTruthy();
    expect(screen.getByTestId("profile-weight").props.value).toBe("70");
    expect(
      screen.getByTestId("profile-goal-lose").props.accessibilityState?.checked,
    ).toBe(true);
  });
});
