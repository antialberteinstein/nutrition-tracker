import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { layout, space } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  label: string;
  /** One-line summary under the label, e.g. "70 kg · 175 cm". */
  supporting?: string;
  onPress: () => void;
  testID?: string;
};

/** Material 3 one- or two-line list item that opens a sub-screen (chevron on the right). */
export function ListRow({ label, supporting, onPress, testID }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={supporting ? `${label}, ${supporting}` : label}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.surfaceContainer },
      ]}
    >
      <View style={styles.text}>
        <ThemedText variant="body">{label}</ThemedText>
        {supporting ? (
          <ThemedText variant="bodySmall" color="onSurfaceVariant">
            {supporting}
          </ThemedText>
        ) : null}
      </View>
      <SymbolView
        name={{
          ios: "chevron.right",
          android: "chevron_right",
          web: "chevron_right",
        }}
        tintColor={colors.onSurfaceVariant}
        size={24}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.touchTarget + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: space.m,
    paddingVertical: space.s,
  },
  text: { flex: 1 },
});
