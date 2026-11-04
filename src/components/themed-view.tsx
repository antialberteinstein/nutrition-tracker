import { View, type ViewProps } from "react-native";

import { type ColorRole } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ThemedViewProps = ViewProps & {
  /** Background colour role; defaults to the page background. (`role` is RN's a11y prop.) */
  surface?: ColorRole;
};

export function ThemedView({
  surface = "background",
  style,
  ...rest
}: ThemedViewProps) {
  const { colors } = useTheme();
  return (
    <View style={[{ backgroundColor: colors[surface] }, style]} {...rest} />
  );
}
