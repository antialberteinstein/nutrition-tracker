import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactNode, useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { Button, FormError, TextField } from "@/components/form";
import { ThemedText } from "@/components/themed-text";
import { space } from "@/constants/theme";
import { formatInt, formatSigned } from "@/domain/format";
import {
  computeTargets,
  defaultCalorieAdjustment,
  type GoalOverrides,
  type Profile,
} from "@/domain/nutrition";
import type { Result } from "@/features/auth/auth";
import {
  draftOverrides,
  GOAL_FIELDS,
  type GoalField,
  goalsFormSchema,
  type GoalsFormOutput,
  type GoalsFormValues,
  toGoalsFormValues,
} from "@/features/goals/goals";
import { BodyMetrics, FieldWarnings } from "@/features/goals/targets-summary";

type Props = {
  profile: Profile;
  saved: GoalOverrides;
  workoutEnabled: boolean;
  onSubmit: (goals: GoalsFormOutput) => Promise<Result>;
  onDirtyChange?: (dirty: boolean) => void;
  currentYear?: number;
};

/** Text the input shows while a field follows its suggestion (parseable, ASCII sign). */
const inputText = (n: number, signed?: boolean) =>
  signed && n > 0 ? `+${n}` : String(n);

/** Cài đặt › Mục tiêu (Goals.md §2–3): edit adjustment and targets, see warnings live. */
export function GoalsForm({
  profile,
  saved,
  workoutEnabled,
  onSubmit,
  onDirtyChange,
  currentYear,
}: Props) {
  const year = currentYear ?? new Date().getFullYear();
  const [formError, setFormError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isValid, isDirty, isSubmitting },
  } = useForm<GoalsFormValues, unknown, GoalsFormOutput>({
    resolver: zodResolver(goalsFormSchema),
    defaultValues: toGoalsFormValues(saved),
    mode: "onChange",
  });
  const values = useWatch({ control }) as GoalsFormValues;
  const targets = computeTargets(profile, draftOverrides(values, saved), {
    currentYear: year,
    workoutEnabled,
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const submit = handleSubmit(async (output) => {
    setFormError(null);
    const result = await onSubmit(output);
    if (result.ok) {
      reset(getValues());
      setSavedNotice(true);
    } else {
      // GOAL-14: never claim "đã lưu"; the inputs stay so the user can retry.
      setFormError(result.failure.message);
    }
  });

  const suggested: Record<GoalField, number> = {
    calorieAdjustment: defaultCalorieAdjustment(profile.goalType),
    calorieTarget: targets.calories.suggested,
    proteinTargetG: targets.protein.suggested,
    sodiumTargetMg: targets.sodium.suggested,
    sugarTargetG: targets.sugar.suggested,
  };

  const context: Record<GoalField, string> = {
    calorieAdjustment: `Mục tiêu calo gợi ý = TDEE ${formatInt(targets.tdee)} + mức điều chỉnh`,
    calorieTarget: `BMR ${formatInt(targets.bmr)} · an toàn ${formatInt(targets.calories.safe)} · trên ${formatInt(targets.calories.upper)} kcal`,
    proteinTargetG: `Khuyến nghị ${formatInt(targets.protein.lower)}–${formatInt(targets.protein.upper)} g`,
    sodiumTargetMg: `Khuyến nghị ${formatInt(targets.sodium.lower)}–${formatInt(targets.sodium.upper)} mg`,
    sugarTargetG: `Khuyến nghị ${formatInt(targets.sugar.lower)}–${formatInt(targets.sugar.upper)} g`,
  };

  const field = (name: GoalField) => {
    const meta = GOAL_FIELDS[name];
    const display = (n: number) =>
      `${meta.signed ? formatSigned(n) : formatInt(n)} ${meta.unit}`;
    return (
      <Controller
        key={name}
        control={control}
        name={name}
        render={({ field: f }) => (
          <View style={styles.field}>
            <TextField
              label={`${meta.label} (${meta.unit})`}
              value={f.value ?? inputText(suggested[name], meta.signed)}
              onChangeText={f.onChange}
              onBlur={f.onBlur}
              error={errors[name]?.message}
              keyboardType={meta.signed ? "numeric" : "number-pad"}
              maxLength={6}
              testID={`goal-${name}`}
            />
            {f.value !== null ? (
              <View style={styles.custom}>
                <ThemedText
                  variant="bodySmall"
                  color="onSurfaceVariant"
                  style={styles.flex}
                  testID={`goal-${name}-custom`}
                >
                  {`Tự đặt · gợi ý: ${display(suggested[name])}`}
                </ThemedText>
                <Button
                  label="Dùng gợi ý"
                  variant="text"
                  onPress={() =>
                    setValue(name, null, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  testID={`goal-${name}-reset`}
                />
              </View>
            ) : null}
            <ThemedText variant="bodySmall" color="onSurfaceVariant">
              {context[name]}
            </ThemedText>
            <FieldWarnings targets={targets} field={name} />
          </View>
        )}
      />
    );
  };

  return (
    <>
      <BodyMetrics targets={targets} workoutEnabled={workoutEnabled} />
      <Section title="Calo">
        {field("calorieAdjustment")}
        {field("calorieTarget")}
      </Section>
      <Section title="Đạm, natri, đường">
        {field("proteinTargetG")}
        {field("sodiumTargetMg")}
        {field("sugarTargetG")}
      </Section>
      <FormError message={formError} testID="goals-error" />
      {/* The notice belongs to the last save; any later edit hides it. */}
      {savedNotice && !isDirty ? (
        <ThemedText
          variant="bodySmall"
          color="onSurfaceVariant"
          accessibilityLiveRegion="polite"
          testID="goals-saved"
        >
          Đã lưu mục tiêu.
        </ThemedText>
      ) : null}
      <Button
        label="Lưu"
        onPress={() => void submit()}
        disabled={!isDirty || !isValid}
        loading={isSubmitting}
        testID="goals-submit"
      />
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText variant="titleMedium" accessibilityRole="header">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.l },
  field: { gap: space.xs },
  custom: { flexDirection: "row", alignItems: "center", gap: space.s },
  flex: { flex: 1 },
});
