import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  mapAuthError,
  newPasswordSchema,
  parseAuthCallback,
  requestPasswordReset,
  signInSchema,
  signUp,
  signUpSchema,
} from "@/features/auth/auth";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));
jest.mock("expo-linking", () => ({
  createURL: (path: string, opts?: { queryParams?: Record<string, string> }) =>
    `nutritiontracker://${path}?${new URLSearchParams(opts?.queryParams).toString()}`,
}));

const auth = supabase.auth as unknown as {
  signUp: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  resetPasswordForEmail: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
};

describe("schemas (Account.md §4)", () => {
  it("ACC-02: password needs 8 characters and both passwords must match", () => {
    const short = signUpSchema.safeParse({ email: "a@test.local", password: "1234567", confirmPassword: "1234567" });
    expect(short.success).toBe(false);
    const mismatch = signUpSchema.safeParse({ email: "a@test.local", password: "12345678", confirmPassword: "12345679" });
    expect(mismatch.success).toBe(false);
    expect(mismatch.error?.issues[0]?.path).toEqual(["confirmPassword"]);
    expect(
      signUpSchema.safeParse({ email: " a@test.local ", password: "12345678", confirmPassword: "12345678" }).success,
    ).toBe(true);
  });

  it("rejects a malformed email and an empty password on sign-in", () => {
    expect(signInSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@test.local", password: "" }).success).toBe(false);
  });

  it("new password follows the same rules", () => {
    expect(newPasswordSchema.safeParse({ password: "12345678", confirmPassword: "12345678" }).success).toBe(true);
    expect(newPasswordSchema.safeParse({ password: "1234", confirmPassword: "1234" }).success).toBe(false);
  });
});

describe("mapAuthError", () => {
  it("ACC-03: wrong credentials give one message that does not reveal the email", () => {
    expect(mapAuthError({ code: "invalid_credentials", message: "", status: 400 })).toEqual({
      field: "form",
      message: "Email hoặc mật khẩu không đúng",
    });
  });

  it("flags an unconfirmed email so the UI can offer a resend", () => {
    expect(mapAuthError({ code: "email_not_confirmed", message: "", status: 400 }).needsConfirmation).toBe(true);
  });

  it("maps network failures to a Vietnamese retry message", () => {
    expect(mapAuthError({ code: undefined, message: "Network request failed", status: 0 }).message).toMatch(
      /Kiểm tra mạng/,
    );
  });
});

describe("parseAuthCallback", () => {
  it("reads the PKCE code and destination", () => {
    expect(parseAuthCallback({ code: "abc", next: "reset-password" })).toEqual({ code: "abc", next: "reset-password" });
    expect(parseAuthCallback({ code: ["abc", "x"] })).toEqual({ code: "abc", next: "home" });
    expect(parseAuthCallback({})).toEqual({ code: null, next: "home" });
  });
});

describe("api", () => {
  beforeEach(() => {
    auth.signUp.mockReset();
    auth.resetPasswordForEmail.mockReset();
  });

  it("ACC-02: an already registered email is reported on the email field", async () => {
    auth.signUp.mockResolvedValue({ data: { user: { identities: [] } }, error: null });
    const result = await signUp({ email: "a@test.local", password: "12345678", confirmPassword: "12345678" });
    expect(result).toEqual({ ok: false, failure: { field: "email", message: "Email này đã được đăng ký" } });
  });

  it("ACC-01: sign-up asks for the in-app callback as redirect", async () => {
    auth.signUp.mockResolvedValue({ data: { user: { identities: [{}] } }, error: null });
    await expect(signUp({ email: "a@test.local", password: "12345678", confirmPassword: "12345678" })).resolves.toEqual({
      ok: true,
    });
    expect(auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { emailRedirectTo: "nutritiontracker://auth/callback?next=home" },
      }),
    );
  });

  it("ACC-09: password reset reports success even when the server returns an error", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: { code: "user_not_found", message: "x", status: 400 } });
    await expect(requestPasswordReset({ email: "nobody@test.local" })).resolves.toEqual({ ok: true });
  });

  it("password reset surfaces a network failure", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: { message: "Network request failed", status: 0 } });
    const result = await requestPasswordReset({ email: "a@test.local" });
    expect(result.ok).toBe(false);
  });
});
