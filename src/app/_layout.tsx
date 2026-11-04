import { QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import { Button } from "@/components/form";
import { ThemedText } from "@/components/themed-text";
import { signOut } from "@/features/auth/auth";
import {
  AuthProvider,
  useAuth,
  useHasProfile,
} from "@/features/auth/auth-provider";
import { profileCheck, routeState } from "@/features/auth/route-state";
import { space } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { createQueryClient } from "@/lib/query-client";

/**
 * Session-based routing (Account.md §3.1, see routeState). A guarded screen that gains focus
 * redirects to the first unguarded route in filesystem sort order (groups first), not declaration
 * order, so Back can never land on it (ACC-10). Every routeState therefore leaves exactly one
 * destination open (signed out: (auth) sorts before auth/callback); keep it that way when adding
 * states, or the destination will depend on file names.
 */
function RootNavigator() {
  const { session, initializing, recovering } = useAuth();
  const hasProfile = useHasProfile();
  const { colors } = useTheme();

  const state = routeState({
    initializing,
    signedIn: !!session,
    recovering,
    profile: profileCheck(hasProfile),
  });

  if (state.kind === "loading") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator
          color={colors.primary}
          accessibilityLabel="Đang tải"
        />
      </View>
    );
  }
  if (state.kind === "profile-error") {
    return (
      <View
        style={[
          styles.center,
          styles.error,
          { backgroundColor: colors.background },
        ]}
        testID="screen-profile-error"
      >
        <ThemedText variant="body" style={styles.errorText}>
          Không tải được hồ sơ. Kiểm tra mạng rồi thử lại.
        </ThemedText>
        <Button
          label="Thử lại"
          onPress={() => void hasProfile.refetch()}
          loading={hasProfile.isFetching}
          testID="profile-error-retry"
        />
        <Button
          label="Đăng xuất"
          variant="text"
          onPress={() => void signOut()}
          testID="profile-error-signout"
        />
      </View>
    );
  }

  const { guards } = state;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={guards.auth}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={guards.recovery}>
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
      <Stack.Protected guard={guards.onboarding}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={guards.tabs}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={guards.callback}>
        <Stack.Screen name="auth/callback" />
      </Stack.Protected>
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { paddingHorizontal: space.l, gap: space.m },
  errorText: { textAlign: "center" },
});
