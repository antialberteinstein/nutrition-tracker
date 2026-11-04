import { Text, type TextProps } from "react-native";

import { type ColorRole, typeScale, type TypeVariant } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ThemedTextProps = TextProps & {
  /** Material 3 type role. */
  variant?: TypeVariant;
  /** Colour role from the palette; defaults to onSurface. */
  color?: ColorRole;
  /** Explicit colour (e.g. a nutrient hue); wins over `color`. */
  tint?: string;
  /** Tabular figures for numbers that line up. */
  numeric?: boolean;
};

export function ThemedText({
  variant = "body",
  color = "onSurface",
  tint,
  numeric,
  style,
  ...rest
}: ThemedTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        typeScale[variant],
        { color: tint ?? colors[color] },
        numeric ? { fontVariant: ["tabular-nums"] } : null,
        style,
      ]}
      {...rest}
    />
  );
}
