import { describe, expect, it } from "@jest/globals";

import {
  profileCheck,
  routeState,
  type RouteInput,
} from "@/features/auth/route-state";

const base: RouteInput = {
  initializing: false,
  signedIn: true,
  recovering: false,
  profile: "yes",
};

const open = (input: Partial<RouteInput>) => {
  const state = routeState({ ...base, ...input });
  if (state.kind !== "ready") return state.kind;
  return Object.entries(state.guards)
    .filter(([, on]) => on)
    .map(([name]) => name)
    .sort();
};

describe("routeState (Account.md §3.1)", () => {
  it("waits while the stored session is being read", () => {
    expect(open({ initializing: true, signedIn: false })).toBe("loading");
  });

  it("signed out: only the auth screens and the email callback are reachable", () => {
    expect(open({ signedIn: false, profile: "pending" })).toEqual([
      "auth",
      "callback",
    ]);
  });

  it("ACC-15: a recovery session goes to Đặt mật khẩu mới without waiting for the profile", () => {
    expect(open({ recovering: true, profile: "pending" })).toEqual([
      "recovery",
    ]);
    expect(open({ recovering: true, profile: "yes" })).toEqual(["recovery"]);
  });

  it("ACC-04: a session without a profile reaches onboarding only", () => {
    expect(open({ profile: "no" })).toEqual(["onboarding"]);
  });

  it("ACC-06: a session with a profile reaches the tabs only", () => {
    expect(open({ profile: "yes" })).toEqual(["tabs"]);
  });

  it("waits for the profile check instead of guessing", () => {
    expect(open({ profile: "pending" })).toBe("loading");
  });

  it("a failed profile check never falls back to onboarding", () => {
    expect(open({ profile: "error" })).toBe("profile-error");
  });
});

describe("profileCheck", () => {
  it("maps query results; cached data wins over a failed refetch", () => {
    expect(profileCheck({ data: undefined, isError: false })).toBe("pending");
    expect(profileCheck({ data: undefined, isError: true })).toBe("error");
    expect(profileCheck({ data: false, isError: false })).toBe("no");
    expect(profileCheck({ data: true, isError: true })).toBe("yes");
  });
});
