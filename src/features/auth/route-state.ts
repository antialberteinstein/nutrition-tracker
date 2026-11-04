/** What the root navigator should show, decided from the auth session and the profile check. */
export type ProfileCheck = "pending" | "yes" | "no" | "error";

export type RouteInput = {
  initializing: boolean;
  signedIn: boolean;
  /** Signed in through a password-recovery link and not yet set a new password. */
  recovering: boolean;
  profile: ProfileCheck;
};

export type Guards = {
  auth: boolean;
  callback: boolean;
  recovery: boolean;
  onboarding: boolean;
  tabs: boolean;
};

export type RouteState =
  | { kind: "loading" }
  | { kind: "profile-error" }
  | { kind: "ready"; guards: Guards };

const none: Guards = {
  auth: false,
  callback: false,
  recovery: false,
  onboarding: false,
  tabs: false,
};

/**
 * Account.md §3.1: no session → (auth); recovery session → Đặt mật khẩu mới; session without
 * profile → onboarding; session with profile → (tabs). A failed profile check is its own state so
 * an onboarded user is never sent back to onboarding by a network error (ACC-06).
 */
export function routeState({
  initializing,
  signedIn,
  recovering,
  profile,
}: RouteInput): RouteState {
  if (initializing) return { kind: "loading" };
  if (!signedIn)
    return { kind: "ready", guards: { ...none, auth: true, callback: true } };
  if (recovering) return { kind: "ready", guards: { ...none, recovery: true } };
  if (profile === "pending") return { kind: "loading" };
  if (profile === "error") return { kind: "profile-error" };
  return {
    kind: "ready",
    guards: { ...none, onboarding: profile === "no", tabs: profile === "yes" },
  };
}

/** Maps a TanStack Query result to a profile check; cached data wins over a failed refetch. */
export function profileCheck(query: {
  data: boolean | undefined;
  isError: boolean;
}): ProfileCheck {
  if (query.data !== undefined) return query.data ? "yes" : "no";
  return query.isError ? "error" : "pending";
}
