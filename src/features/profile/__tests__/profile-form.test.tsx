import { describe, expect, it, jest } from "@jest/globals";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import type { Profile } from "@/domain/nutrition";
import type { Result } from "@/features/auth/auth";
import { EMPTY_PROFILE_FORM } from "@/features/profile/profile";
import { ProfileForm } from "@/features/profile/profile-form";

jest.mock("@/lib/supabase", () => ({ supabase: {} }));

type Submit = (p: Profile) => Promise<Result>;

const setup = async (onSubmit: Submit) =>
  render(
    <ProfileForm
      initialValues={EMPTY_PROFILE_FORM}
      submitLabel="Tiếp tục"
      onSubmit={onSubmit}
      currentYear={2026}
    />,
  );

const fillValid = async () => {
  await fireEvent.changeText(screen.getByTestId("profile-weight"), "70,5");
  await fireEvent.changeText(screen.getByTestId("profile-height"), "175");
  await fireEvent.press(screen.getByTestId("profile-sex-male"));
  await fireEvent.changeText(screen.getByTestId("profile-birth-year"), "1996");
  await fireEvent.press(screen.getByTestId("profile-activity-moderate"));
  await fireEvent.press(screen.getByTestId("profile-goal-lose"));
};

const submitDisabled = () =>
  screen.getByTestId("profile-submit").props.accessibilityState?.disabled;

describe("ProfileForm", () => {
  it("ACC-05: 'Tiếp tục' stays locked and the error shows under the right field", async () => {
    const onSubmit = jest.fn<Submit>();
    await setup(onSubmit);
    expect(submitDisabled()).toBe(true);

    await fillValid();
    await waitFor(() => expect(submitDisabled()).toBe(false));

    await fireEvent.changeText(screen.getByTestId("profile-height"), "99");
    expect(await screen.findByText("Chiều cao từ 100 đến 250 cm")).toBeTruthy();
    expect(screen.getByTestId("profile-height-error")).toBeTruthy();
    expect(submitDisabled()).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("ACC-05: a blank field shows its error on blur and the missing fields are named", async () => {
    await setup(jest.fn<Submit>());
    expect(screen.getByTestId("profile-missing").props.children).toContain(
      "Mong muốn",
    );
    await fireEvent(screen.getByTestId("profile-weight"), "blur");
    expect(await screen.findByTestId("profile-weight-error")).toBeTruthy();

    await fillValid();
    await waitFor(() =>
      expect(screen.queryByTestId("profile-missing")).toBeNull(),
    );
  });

  it("submits the parsed profile", async () => {
    const onSubmit = jest.fn<Submit>().mockResolvedValue({ ok: true });
    await setup(onSubmit);
    await fillValid();
    await waitFor(() => expect(submitDisabled()).toBe(false));
    await fireEvent.press(screen.getByTestId("profile-submit"));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        weightKg: 70.5,
        heightCm: 175,
        sex: "male",
        birthYear: 1996,
        activityLevel: "moderate",
        goalType: "lose",
      }),
    );
  });

  it("ACC-14: a failed save shows the message and keeps the typed data", async () => {
    const onSubmit = jest.fn<Submit>().mockResolvedValue({
      ok: false,
      failure: {
        field: "form",
        message: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
      },
    });
    await setup(onSubmit);
    await fillValid();
    await waitFor(() => expect(submitDisabled()).toBe(false));
    await fireEvent.press(screen.getByTestId("profile-submit"));
    expect(await screen.findByTestId("profile-error")).toBeTruthy();
    expect(screen.getByTestId("profile-weight").props.value).toBe("70,5");
    expect(
      screen.getByTestId("profile-sex-male").props.accessibilityState?.checked,
    ).toBe(true);
  });
});
