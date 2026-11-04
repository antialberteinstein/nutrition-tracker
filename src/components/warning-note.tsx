import { SymbolView } from "expo-symbols";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { space } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Non-blocking warning shown right under the related field: amber, icon + text (Goals.md §2). */
export function WarningNote({
  message,
  testID,
}: {
  message: string;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Cảnh báo: ${message}`}
      accessibilityLiveRegion="polite"
      testID={testID}
    >
      <SymbolView
        name={{
          ios: "exclamationmark.triangle.fill",
          android: "warning",
          web: "warning",
        }}
        tintColor={colors.warning}
        size={18}
      />
      <ThemedText variant="bodySmall" color="warning" style={styles.text}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space.s, alignItems: "flex-start" },
  text: { flex: 1 },
});
