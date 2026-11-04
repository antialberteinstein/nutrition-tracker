import { QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import {
  AuthProvider,
  useAuth,
  useHasProfile,
} from "@/features/auth/auth-provider";
import { useTheme } from "@/hooks/use-theme";
import { createQueryClient } from "@/lib/query-client";

/**
 * Session-based routing (Account.md §3.1):
 * no session → (auth); session without profile → onboarding; session with profile → (tabs).
 * Stack.Protected removes unreachable screens, so Back can never return to them (ACC-10).
 */
function RootNavigator() {
  const { session, initializing } = useAuth();
  const hasProfile = useHasProfile();
  const { colors } = useTheme();

  const signedIn = !!session;
  const profileKnown = !signedIn || hasProfile.isSuccess || hasProfile.isError;
  if (initializing || !profileKnown) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.background }]}>
        <ActivityIndicator
          color={colors.primary}
          accessibilityLabel="Đang tải"
        />
      </View>
    );
  }
  // A failed profile check falls back to onboarding rather than a dead end; saving there will
  // surface the network error to the user.
  const onboarded = signedIn && hasProfile.data === true;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
      <Stack.Screen name="auth/callback" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
});
