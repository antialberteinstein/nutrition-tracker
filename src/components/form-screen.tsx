import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MarginRow, NotebookPage } from "@/components/notebook";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { space } from "@/constants/theme";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  testID?: string;
};

/**
 * Notebook-page layout for forms: scrolls, stays above the keyboard (IME insets), keeps taps
 * working while the keyboard is open. Android Back with the keyboard open only hides it.
 */
export function FormScreen({ title, subtitle, children, testID }: Props) {
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
  body: { marginTop: space.block, gap: space.m },
});
