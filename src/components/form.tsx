import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { layout, space, typeScale } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  /** Adds a show/hide toggle for passwords. */
  secureToggle?: boolean;
};

/** Material 3 outlined text field: label above, error below, red outline on error. */
export function TextField({
  label,
  error,
  secureToggle,
  secureTextEntry,
  testID,
  style,
  ...rest
}: TextFieldProps) {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(true);
  const secure = secureToggle ? hidden : secureTextEntry;
  return (
    <View style={styles.field}>
      <ThemedText variant="label" color="onSurfaceVariant">
        {label}
      </ThemedText>
      <View
        style={[
          styles.box,
          {
            borderColor: error ? colors.error : colors.outline,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          testID={testID}
          placeholderTextColor={colors.onSurfaceVariant}
          selectionColor={colors.primary}
          secureTextEntry={secure}
          style={[
            styles.input,
            typeScale.body,
            { color: colors.onSurface },
            style,
          ]}
          {...rest}
        />
        {secureToggle ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Hiện mật khẩu" : "Ẩn mật khẩu"}
            testID={testID ? `${testID}-toggle` : undefined}
            style={styles.toggle}
          >
            <ThemedText variant="label" color="primary">
              {hidden ? "Hiện" : "Ẩn"}
            </ThemedText>
          </Pressable>
        ) : null}
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

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "filled" | "text";
  loading?: boolean;
  disabled?: boolean;
  /** Called when a disabled button is tapped, e.g. to reveal why a form is locked. */
  onPressWhileDisabled?: () => void;
  testID?: string;
};

/** Material 3 filled or text button; 48 dp touch target; spinner while loading. */
export function Button({
  label,
  onPress,
  variant = "filled",
  loading,
  disabled,
  onPressWhileDisabled,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const filled = variant === "filled";
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={disabled ? onPressWhileDisabled : onPress}
      // Stays tappable while disabled only to explain itself; still announced as disabled.
      // undefined (not false) so Pressable keeps accessibilityState.disabled.
      disabled={
        loading || (disabled && !onPressWhileDisabled) ? true : undefined
      }
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        filled && { backgroundColor: colors.primary },
        inactive && filled && { opacity: 0.38 },
        pressed && !inactive && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={filled ? colors.onPrimary : colors.primary} />
      ) : (
        <ThemedText
          variant="label"
          tint={filled ? colors.onPrimary : colors.primary}
        >
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

/** Message under a whole form (server or network error). */
export function FormError({
  message,
  testID,
}: {
  message?: string | null;
  testID?: string;
}) {
  if (!message) return null;
  return (
    <ThemedText
      variant="bodySmall"
      color="error"
      accessibilityLiveRegion="polite"
      testID={testID}
    >
      {message}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs },
  box: {
    minHeight: layout.touchTarget + 8,
    borderWidth: 1,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, paddingHorizontal: space.m, paddingVertical: space.s },
  toggle: {
    minHeight: layout.touchTarget,
    minWidth: layout.touchTarget,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: space.s,
  },
  button: {
    minHeight: layout.touchTarget,
    borderRadius: 20,
    paddingHorizontal: space.l,
    justifyContent: "center",
    alignItems: "center",
  },
});
