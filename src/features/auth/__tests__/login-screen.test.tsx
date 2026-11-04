import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import LoginScreen from "@/app/(auth)/login";
import { signIn } from "@/features/auth/auth";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => {
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return { SafeAreaView: View };
});
jest.mock("expo-symbols", () => ({ SymbolView: () => null }));
jest.mock("@/features/auth/auth", () => {
  const actual = jest.requireActual<typeof import("@/features/auth/auth")>(
    "@/features/auth/auth",
  );
  return { ...actual, signIn: jest.fn(), resendConfirmation: jest.fn() };
});
jest.mock("@/lib/supabase", () => ({ supabase: {} }));

const mockedSignIn = signIn as jest.MockedFunction<typeof signIn>;

describe("LoginScreen", () => {
  beforeEach(() => {
    mockedSignIn.mockReset();
  });

  it("shows field errors and does not call the server for invalid input", async () => {
    await render(<LoginScreen />);
    await fireEvent.press(screen.getByTestId("login-submit"));
    expect(await screen.findByTestId("login-email-error")).toBeTruthy();
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it("ACC-03: wrong password shows the generic message and keeps the typed email", async () => {
    mockedSignIn.mockResolvedValue({
      ok: false,
      failure: { field: "form", message: "Email hoặc mật khẩu không đúng" },
    });
    await render(<LoginScreen />);
    await fireEvent.changeText(
      screen.getByTestId("login-email"),
      "a@test.local",
    );
    await fireEvent.changeText(
      screen.getByTestId("login-password"),
      "wrong-pass",
    );
    await fireEvent.press(screen.getByTestId("login-submit"));
    expect(
      await screen.findByText("Email hoặc mật khẩu không đúng"),
    ).toBeTruthy();
    expect(screen.getByTestId("login-email").props.value).toBe("a@test.local");
  });

  it("offers to resend the confirmation email when the email is not confirmed", async () => {
    mockedSignIn.mockResolvedValue({
      ok: false,
      failure: {
        field: "form",
        message: "Email chưa được xác nhận",
        needsConfirmation: true,
      },
    });
    await render(<LoginScreen />);
    await fireEvent.changeText(
      screen.getByTestId("login-email"),
      "a@test.local",
    );
    await fireEvent.changeText(
      screen.getByTestId("login-password"),
      "12345678",
    );
    await fireEvent.press(screen.getByTestId("login-submit"));
    await waitFor(() =>
      expect(screen.getByTestId("login-resend")).toBeTruthy(),
    );
  });
});
