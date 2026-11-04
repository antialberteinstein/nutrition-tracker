import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { WarningNote } from "@/components/warning-note";
import { space } from "@/constants/theme";
import { formatDecimal1, formatInt, formatSigned } from "@/domain/format";
import type { NutrientTarget, Targets, WarningField } from "@/domain/nutrition";
import { BMI_CATEGORY_LABELS, WARNING_MESSAGES } from "@/features/goals/goals";

type RowProps = { label: string; value: string; testID?: string };

/** Label on the left, tabular number on the right. */
export function MetricRow({ label, value, testID }: RowProps) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${label}, ${value}`}
    >
      <ThemedText variant="body" color="onSurfaceVariant">
        {label}
      </ThemedText>
      <ThemedText variant="titleMedium" numeric testID={testID}>
        {value}
      </ThemedText>
    </View>
  );
}

export function FieldWarnings({
  targets,
  field,
}: {
  targets: Targets;
  field: WarningField;
}) {
  return (
    <>
      {targets.warnings
        .filter((w) => w.field === field)
        .map((w) => (
          <WarningNote
            key={w.code}
            message={WARNING_MESSAGES[w.code]}
            testID={`warning-${w.code}-${field}`}
          />
        ))}
    </>
  );
}

/** Chỉ số cơ thể: BMI with category, BMR, TDEE (Goals.md §2). */
export function BodyMetrics({
  targets,
  workoutEnabled,
}: {
  targets: Targets;
  workoutEnabled: boolean;
}) {
  return (
    <View style={styles.section}>
      <ThemedText variant="titleMedium" accessibilityRole="header">
        Chỉ số cơ thể
      </ThemedText>
      <MetricRow
        label="BMI"
        value={`${formatDecimal1(targets.bmi)} · ${BMI_CATEGORY_LABELS[targets.bmiCategory]}`}
        testID="summary-bmi"
      />
      <FieldWarnings targets={targets} field="goalType" />
      <MetricRow
        label="BMR"
        value={`${formatInt(targets.bmr)} kcal`}
        testID="summary-bmr"
      />
      <MetricRow
        label="TDEE"
        value={`${formatInt(targets.tdee)} kcal`}
        testID="summary-tdee"
      />
      {workoutEnabled ? (
        <ThemedText variant="bodySmall" color="onSurfaceVariant">
          Đang dùng hệ số 1.2 vì Workout bật; calo tập được tính riêng.
        </ThemedText>
      ) : null}
    </View>
  );
}

const range = (n: NutrientTarget, unit: string) =>
  `${formatInt(n.lower)} · ${formatInt(n.target)} · ${formatInt(n.upper)} ${unit}`;

/** Read-only summary at the end of onboarding (GOAL-01, GOAL-02). */
export function TargetsSummary({
  targets,
  workoutEnabled,
}: {
  targets: Targets;
  workoutEnabled: boolean;
}) {
  return (
    <>
      <BodyMetrics targets={targets} workoutEnabled={workoutEnabled} />
      <View style={styles.section}>
        <ThemedText variant="titleMedium" accessibilityRole="header">
          Mục tiêu mỗi ngày
        </ThemedText>
        <MetricRow
          label="Calo"
          value={`${formatInt(targets.calories.target)} kcal`}
          testID="summary-calories"
        />
        <ThemedText variant="bodySmall" color="onSurfaceVariant">
          {`TDEE ${formatSigned(targets.calorieAdjustment)} kcal theo mong muốn`}
        </ThemedText>
        <FieldWarnings targets={targets} field="calorieTarget" />
        <ThemedText variant="bodySmall" color="onSurfaceVariant">
          Dưới · mục tiêu · trên
        </ThemedText>
        <MetricRow
          label="Đạm"
          value={range(targets.protein, "g")}
          testID="summary-protein"
        />
        <MetricRow
          label="Natri"
          value={range(targets.sodium, "mg")}
          testID="summary-sodium"
        />
        <MetricRow
          label="Đường"
          value={range(targets.sugar, "g")}
          testID="summary-sugar"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.s },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: space.m,
  },
});
