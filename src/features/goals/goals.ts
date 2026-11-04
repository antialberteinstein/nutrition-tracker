import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import {
  type BmiCategory,
  computeTargets,
  type GoalOverrides,
  type Profile,
  type Targets,
  type WarningCode,
} from "@/domain/nutrition";
import type { Result } from "@/features/auth/auth";
import { useAuth } from "@/features/auth/auth-provider";
import { saveFailureMessage, useProfile } from "@/features/profile/profile";
import { supabase } from "@/lib/supabase";

// --------------------------------------------------------------------- copy (Goals.md §4)
export const WARNING_MESSAGES: Record<WarningCode, string> = {
  W1: "Bạn muốn giảm cân nhưng đang đặt mục tiêu cao hơn mức tiêu hao.",
  W2: "Bạn muốn tăng cân nhưng đang đặt mục tiêu thấp hơn mức tiêu hao.",
  W3: "Mục tiêu thấp hơn BMR, không khuyến nghị nếu không có hướng dẫn chuyên môn.",
  W4: "Mục tiêu vượt giới hạn trên 4000 kcal.",
  W5: "Mục tiêu nằm ngoài khoảng khuyến nghị.",
  W6: "Mong muốn hiện tại có thể không phù hợp với BMI.",
};

export const BMI_CATEGORY_LABELS: Record<BmiCategory, string> = {
  underweight: "Thiếu cân",
  normal: "Bình thường",
  overweight: "Thừa cân",
  obese: "Béo phì",
};

// ------------------------------------------------------------------------ fields
export type GoalField = keyof Required<GoalOverrides>;

export const GOAL_FIELDS: Record<
  GoalField,
  { label: string; unit: string; min: number; max: number; signed?: boolean }
> = {
  calorieAdjustment: {
    label: "Mức điều chỉnh",
    unit: "kcal",
    min: -1500,
    max: 1500,
    signed: true,
  },
  calorieTarget: { label: "Mục tiêu calo", unit: "kcal", min: 800, max: 6000 },
  proteinTargetG: { label: "Đạm", unit: "g", min: 10, max: 400 },
  sodiumTargetMg: { label: "Natri", unit: "mg", min: 0, max: 6000 },
  sugarTargetG: { label: "Đường", unit: "g", min: 0, max: 300 },
};

export const GOAL_FIELD_NAMES = Object.keys(GOAL_FIELDS) as GoalField[];

/** Form values: typed text for a custom value, null while the field follows the suggestion. */
export type GoalsFormValues = Record<GoalField, string | null>;
export type GoalsFormOutput = Record<GoalField, number | null>;

/** Accepts "+300", "-500" and the typographic minus "−500"; integers only. */
export function parseGoalInput(text: string): number | null {
  const t = text.replace(/\s/g, "").replace("−", "-");
  return /^[+-]?\d{1,5}$/.test(t) ? Number(t) : null;
}

const goalInput = (field: GoalField) => {
  const { min, max, unit } = GOAL_FIELDS[field];
  return z
    .string()
    .nullable()
    .superRefine((v, ctx) => {
      if (v === null) return;
      if (v.trim() === "") {
        ctx.addIssue({ code: "custom", message: "Nhập một số" });
        return;
      }
      const n = parseGoalInput(v);
      if (n === null)
        ctx.addIssue({ code: "custom", message: "Nhập số nguyên" });
      else if (n < min || n > max)
        ctx.addIssue({
          code: "custom",
          message: `Từ ${min} đến ${max} ${unit}`,
        });
    })
    .transform((v) => (v === null ? null : parseGoalInput(v)));
};

/** Same ranges as the goals table constraints (Goals.md §4–5); out of range never saves (GOAL-08). */
export const goalsFormSchema = z.object({
  calorieAdjustment: goalInput("calorieAdjustment"),
  calorieTarget: goalInput("calorieTarget"),
  proteinTargetG: goalInput("proteinTargetG"),
  sodiumTargetMg: goalInput("sodiumTargetMg"),
  sugarTargetG: goalInput("sugarTargetG"),
});

export function toGoalsFormValues(o: GoalOverrides): GoalsFormValues {
  const text = (n: number | null | undefined) =>
    n === null || n === undefined ? null : String(n);
  return {
    calorieAdjustment: text(o.calorieAdjustment),
    calorieTarget: text(o.calorieTarget),
    proteinTargetG: text(o.proteinTargetG),
    sodiumTargetMg: text(o.sodiumTargetMg),
    sugarTargetG: text(o.sugarTargetG),
  };
}

/**
 * Overrides to preview while typing: valid custom values apply at once; a field that is still
 * invalid keeps its saved value so suggestions and warnings never jump around mid-typing.
 */
export function draftOverrides(
  values: GoalsFormValues,
  saved: GoalOverrides,
): GoalOverrides {
  const out: GoalOverrides = {};
  for (const f of GOAL_FIELD_NAMES) {
    const v = values[f];
    if (v === null) {
      out[f] = null;
      continue;
    }
    const n = parseGoalInput(v);
    const { min, max } = GOAL_FIELDS[f];
    out[f] = n !== null && n >= min && n <= max ? n : (saved[f] ?? null);
  }
  return out;
}

// ------------------------------------------------------------------------ data
type GoalsRow = {
  calorie_adjustment: number | null;
  calorie_target: number | null;
  protein_target_g: number | null;
  sodium_target_mg: number | null;
  sugar_target_g: number | null;
};

const fromRow = (r: GoalsRow): GoalOverrides => ({
  calorieAdjustment: r.calorie_adjustment,
  calorieTarget: r.calorie_target,
  proteinTargetG: r.protein_target_g,
  sodiumTargetMg: r.sodium_target_mg,
  sugarTargetG: r.sugar_target_g,
});

export const goalsKey = (userId: string | undefined) =>
  ["goals", userId] as const;
export const workoutEnabledKey = (userId: string | undefined) =>
  ["workout-enabled", userId] as const;

/** The user's overrides; no row yet means every goal follows its suggestion (GOAL-02). */
export function useGoals() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: goalsKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<GoalOverrides> => {
      const { data, error } = await supabase
        .from("goals")
        .select(
          "calorie_adjustment, calorie_target, protein_target_g, sodium_target_mg, sugar_target_g",
        )
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data ? fromRow(data as GoalsRow) : {};
    },
  });
}

/** Workout switches TDEE to factor 1.2 (Goals.md §4); off when no settings row exists. */
export function useWorkoutEnabled() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: workoutEnabledKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("workout_enabled")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (
        (data as { workout_enabled: boolean } | null)?.workout_enabled ?? false
      );
    },
  });
}

/** Current targets from profile + overrides + settings, or undefined while any is loading. */
export function useTargets(): {
  profile?: Profile;
  goals?: GoalOverrides;
  workoutEnabled: boolean;
  targets?: Targets;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const profile = useProfile();
  const goals = useGoals();
  const workout = useWorkoutEnabled();
  const workoutEnabled = workout.data ?? false;
  const ready = profile.data && goals.data;
  return {
    profile: profile.data ?? undefined,
    goals: goals.data,
    workoutEnabled,
    targets: ready
      ? computeTargets(profile.data!, goals.data!, {
          currentYear: new Date().getFullYear(),
          workoutEnabled,
        })
      : undefined,
    isPending: profile.isPending || goals.isPending || workout.isPending,
    isError: profile.isError || goals.isError || workout.isError,
    refetch: () => {
      void profile.refetch();
      void goals.refetch();
      void workout.refetch();
    },
  };
}

/** Saves every override in one upsert; null clears a custom value ("Dùng gợi ý"). */
export async function saveGoals(o: GoalsFormOutput): Promise<Result> {
  const { error } = await supabase.from("goals").upsert(
    {
      calorie_adjustment: o.calorieAdjustment,
      calorie_target: o.calorieTarget,
      protein_target_g: o.proteinTargetG,
      sodium_target_mg: o.sodiumTargetMg,
      sugar_target_g: o.sugarTargetG,
    },
    { onConflict: "user_id" },
  );
  return error
    ? {
        ok: false,
        failure: { field: "form", message: saveFailureMessage(error) },
      }
    : { ok: true };
}

export function useSaveGoals() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id;
  return useMutation({
    mutationFn: saveGoals,
    onSuccess: async (result) => {
      if (result.ok)
        await queryClient.invalidateQueries({ queryKey: goalsKey(userId) });
    },
  });
}
