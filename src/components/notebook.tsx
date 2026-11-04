import { SymbolView } from "expo-symbols";
import type { ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { layout } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * A notebook page: content is aligned to a 40 dp margin column with a faint red rule,
 * like writing in a vở. The rule is decoration; meaning only comes from MarginRow marks.
 */
export function NotebookPage({
  children,
  style,
  ...rest
}: ViewProps & { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.page, style]} {...rest}>
      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        style={[styles.rule, { backgroundColor: colors.margin }]}
      />
      {children}
    </View>
  );
}

export type MarginMark = "alert";

type MarginRowProps = ViewProps & { children: ReactNode } & (
    | {
        /** Status mark drawn inside the margin column (never in the content). */
        mark: MarginMark;
        /** Spoken label for the mark, e.g. "Vượt ngưỡng" (required so TalkBack can name it). */
        markLabel: string;
      }
    | { mark?: null; markLabel?: never }
  );

/** A row whose status mark sits in the margin column, aligned with the row's first line. */
export function MarginRow({
  children,
  mark,
  markLabel,
  style,
  ...rest
}: MarginRowProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, style]} {...rest}>
      <View style={styles.gutter}>
        {mark === "alert" ? (
          <SymbolView
            name={{
              ios: "exclamationmark.circle.fill",
              android: "error",
              web: "error",
            }}
            tintColor={colors.error}
            size={20}
            accessibilityLabel={markLabel}
            accessible
            testID="margin-mark-alert"
          />
        ) : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  rule: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: layout.marginColumn - 8,
    width: StyleSheet.hairlineWidth * 2,
    opacity: 0.45,
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  // paddingTop 2 centres the 20 dp icon on a Body (24 dp) first line; pass style for other variants.
  gutter: { width: layout.marginColumn, alignItems: "center", paddingTop: 2 },
  content: { flex: 1, paddingRight: 16 },
});
