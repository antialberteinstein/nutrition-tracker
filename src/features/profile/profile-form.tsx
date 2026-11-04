import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { ChoiceGroup } from "@/components/choice-group";
import { Button, FormError, TextField } from "@/components/form";
import { ThemedText } from "@/components/themed-text";
import type { Profile } from "@/domain/nutrition";
import type { Result } from "@/features/auth/auth";
import {
  ACTIVITY_OPTIONS,
  GOAL_OPTIONS,
  missingProfileFields,
  profileFormSchema,
  type ProfileFormOutput,
  type ProfileFormValues,
  SEX_OPTIONS,
  toProfile,
} from "@/features/profile/profile";

type Props = {
  initialValues: ProfileFormValues;
  submitLabel: string;
  onSubmit: (profile: Profile) => Promise<Result>;
  /** Reports unsaved changes so the screen can confirm before leaving (ACC-08). */
  onDirtyChange?: (dirty: boolean) => void;
  /** Injected for tests; defaults to the current year. */
  currentYear?: number;
};

/** Profile form shared by Onboarding and Cài đặt › Hồ sơ (Account.md §2–4). */
export function ProfileForm({
  initialValues,
  submitLabel,
  onSubmit,
  onDirtyChange,
  currentYear,
}: Props) {
  const year = currentYear ?? new Date().getFullYear();
  const schema = useMemo(() => profileFormSchema(year), [year]);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useForm<ProfileFormValues, unknown, ProfileFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
    // Validate on blur too, so a text field left empty shows its error (ACC-05).
    mode: "all",
  });

  // Choice groups have no blur, so name every missing field next to the locked button.
  const missing = missingProfileFields(useWatch({ control }));

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await onSubmit(toProfile(values));
    if (result.ok) reset(values);
    else setFormError(result.failure.message); // typed data stays in the form (ACC-14)
  });

  return (
    <>
      <Controller
        control={control}
        name="weightKg"
        render={({ field }) => (
          <TextField
            label="Cân nặng (kg)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.weightKg?.message}
            keyboardType="decimal-pad"
            testID="profile-weight"
          />
        )}
      />
      <Controller
        control={control}
        name="heightCm"
        render={({ field }) => (
          <TextField
            label="Chiều cao (cm)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.heightCm?.message}
            keyboardType="number-pad"
            testID="profile-height"
          />
        )}
      />
      <Controller
        control={control}
        name="sex"
        render={({ field }) => (
          <ChoiceGroup
            label="Giới tính"
            options={SEX_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            error={errors.sex?.message}
            testID="profile-sex"
          />
        )}
      />
      <Controller
        control={control}
        name="birthYear"
        render={({ field }) => (
          <TextField
            label="Năm sinh"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.birthYear?.message}
            keyboardType="number-pad"
            maxLength={4}
            testID="profile-birth-year"
          />
        )}
      />
      <Controller
        control={control}
        name="activityLevel"
        render={({ field }) => (
          <ChoiceGroup
            label="Mức vận động"
            options={ACTIVITY_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            error={errors.activityLevel?.message}
            layout="list"
            testID="profile-activity"
          />
        )}
      />
      <Controller
        control={control}
        name="goalType"
        render={({ field }) => (
          <ChoiceGroup
            label="Mong muốn"
            options={GOAL_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            error={errors.goalType?.message}
            testID="profile-goal"
          />
        )}
      />
      <FormError message={formError} testID="profile-error" />
      {missing.length > 0 ? (
        <ThemedText
          variant="bodySmall"
          color="onSurfaceVariant"
          accessibilityLiveRegion="polite"
          testID="profile-missing"
        >
          {`Còn thiếu: ${missing.join(", ")}`}
        </ThemedText>
      ) : null}
      <Button
        label={submitLabel}
        onPress={() => void submit()}
        disabled={!isValid}
        // ACC-05: tapping the locked button shows each field's error under that field.
        onPressWhileDisabled={() => void trigger()}
        loading={isSubmitting}
        testID="profile-submit"
      />
    </>
  );
}
