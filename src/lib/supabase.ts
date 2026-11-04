import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

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
  },
});

// Refresh the session only while the app is in the foreground (Supabase React Native guidance).
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
