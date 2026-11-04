import { createClient } from "@supabase/supabase-js";
import { AppState, LogBox } from "react-native";

import { parseSupabaseEnv } from "@/lib/env";
import { LargeSecureStore } from "@/lib/large-secure-store";

const { url, anonKey } = parseSupabaseEnv(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE: confirmation/recovery links carry ?code= that /auth/callback exchanges (issue #12).
    flowType: "pkce",
  },
});

// Without WebCrypto (Hermes), supabase-js warns once per PKCE flow and falls back to the "plain"
// code challenge. Hide only that dev-mode toast: it sat on top of the bottom buttons (onboarding
// "Đăng xuất") and swallowed taps in E2E. Moving PKCE to S256 is tracked separately.
LogBox.ignoreLogs(["WebCrypto API is not supported"]);

// Refresh the session only while the app is in the foreground (Supabase React Native guidance).
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
