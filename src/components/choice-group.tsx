import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { layout, space } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Option<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type Props<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
  /** "row" for 2–3 short options (segmented), "list" for options with descriptions. */
  layout?: "row" | "list";
  testID?: string;
};

/** Material 3 single-choice group with radio semantics and 48 dp rows. */
export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  layout: kind = "row",
  testID,
}: Props<T>) {
  const { colors } = useTheme();
  return (
    <View
      style={styles.group}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      testID={testID}
    >
      <ThemedText variant="label" color="onSurfaceVariant">
        {label}
      </ThemedText>
      <View style={kind === "row" ? styles.row : styles.list}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={
                o.description ? `${o.label}, ${o.description}` : o.label
              }
              testID={testID ? `${testID}-${o.value}` : undefined}
              style={[
                styles.option,
                kind === "row" && styles.optionRow,
                {
                  borderColor: selected ? colors.primary : colors.outline,
                  backgroundColor: selected
                    ? colors.primaryContainer
                    : colors.background,
                },
              ]}
            >
              <ThemedText
                variant="label"
                color={selected ? "onPrimaryContainer" : "onSurface"}
              >
                {o.label}
              </ThemedText>
              {o.description ? (
                <ThemedText
                  variant="bodySmall"
                  color={selected ? "onPrimaryContainer" : "onSurfaceVariant"}
                >
                  {o.description}
                </ThemedText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <ThemedText
          variant="bodySmall"
          color="error"
          accessibilityLiveRegion="polite"
          testID={testID ? `${testID}-error` : undefined}
        >
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.xs },
  row: { flexDirection: "row", gap: space.s },
  list: { gap: space.s },
  option: {
    minHeight: layout.touchTarget,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: space.m,
    paddingVertical: space.s,
    justifyContent: "center",
  },
  optionRow: { flex: 1, alignItems: "center" },
});
