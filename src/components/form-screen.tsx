import { SymbolView } from "expo-symbols";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MarginRow, NotebookPage } from "@/components/notebook";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { layout, space } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  testID?: string;
  /** Shows an up arrow above the title on sub-screens (e.g. Cài đặt › Hồ sơ). */
  onBack?: () => void;
};

/**
 * Notebook-page layout for forms: scrolls, stays above the keyboard (IME insets), keeps taps
 * working while the keyboard is open. Android Back with the keyboard open only hides it.
 */
export function FormScreen({
  title,
  subtitle,
  children,
  testID,
  onBack,
}: Props) {
  const { colors } = useTheme();
  return (
    <ThemedView style={styles.flex} testID={testID}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <NotebookPage>
              <MarginRow>
                {onBack ? (
                  <Pressable
                    onPress={onBack}
                    accessibilityRole="button"
                    accessibilityLabel="Quay lại"
                    hitSlop={4}
                    testID={testID ? `${testID}-back` : undefined}
                    style={styles.back}
                  >
                    <SymbolView
                      name={{
                        ios: "chevron.left",
                        android: "arrow_back",
                        web: "arrow_back",
                      }}
                      tintColor={colors.onSurface}
                      size={24}
                    />
                  </Pressable>
                ) : null}
                <ThemedText variant="headline" accessibilityRole="header">
                  {title}
                </ThemedText>
                {subtitle ? (
                  <ThemedText
                    variant="body"
                    color="onSurfaceVariant"
                    style={styles.subtitle}
                  >
                    {subtitle}
                  </ThemedText>
                ) : null}
                <View style={styles.body}>{children}</View>
              </MarginRow>
            </NotebookPage>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingTop: space.block, paddingBottom: space.block },
  subtitle: { marginTop: space.s },
  back: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    marginLeft: -12,
    marginBottom: space.s,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { marginTop: space.block, gap: space.m },
});
