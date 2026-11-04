import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MarginRow, NotebookPage } from "@/components/notebook";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { space } from "@/constants/theme";

type Props = {
  title: string;
  testID: string;
};

/** Temporary screen body used by the repo skeleton until each feature issue is built. */
export function ScreenPlaceholder({ title, testID }: Props) {
  return (
    <ThemedView style={styles.container} testID={testID}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <NotebookPage style={styles.page}>
          <MarginRow>
            <ThemedText variant="headline" accessibilityRole="header">
              {title}
            </ThemedText>
            <ThemedText
              variant="bodySmall"
              color="onSurfaceVariant"
              style={styles.note}
            >
              Đang xây dựng
            </ThemedText>
          </MarginRow>
        </NotebookPage>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  page: { paddingTop: space.l },
  note: { marginTop: space.xs },
});
