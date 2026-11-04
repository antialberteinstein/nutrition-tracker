import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import type { ActivityLevel, GoalType, Profile, Sex } from "@/domain/nutrition";
import type { Result } from "@/features/auth/auth";
import { profileExistsKey, useAuth } from "@/features/auth/auth-provider";
import { supabase } from "@/lib/supabase";

// ------------------------------------------------------------ options (Account.md §2, §4)
export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
];

export const ACTIVITY_OPTIONS: {
  value: ActivityLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "sedentary",
    label: "Ít vận động",
    description: "Ngồi nhiều, hầu như không tập",
  },
  { value: "light", label: "Nhẹ", description: "Tập 1–3 buổi mỗi tuần" },
  { value: "moderate", label: "Vừa", description: "Tập 3–5 buổi mỗi tuần" },
  { value: "active", label: "Nhiều", description: "Tập 6–7 buổi mỗi tuần" },
  {
    value: "very_active",
    label: "Rất nhiều",
    description: "Lao động nặng hoặc tập 2 lần mỗi ngày",
  },
];

export const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: "lose", label: "Giảm cân" },
  { value: "maintain", label: "Giữ cân" },
  { value: "gain", label: "Tăng cân" },
];

// ----------------------------------------------------------------- form schema
/** Numbers are typed as text; Vietnamese users may type a decimal comma ("70,5"). */
export type ProfileFormValues = {
  weightKg: string;
  heightCm: string;
  birthYear: string;
  sex: Sex | undefined;
  activityLevel: ActivityLevel | undefined;
  goalType: GoalType | undefined;
};

export const EMPTY_PROFILE_FORM: ProfileFormValues = {
  weightKg: "",
  heightCm: "",
  birthYear: "",
  sex: undefined,
  activityLevel: undefined,
  goalType: undefined,
};

/** Unselected (undefined) on input, one of `values` on output. */
const choice = <const T extends readonly [string, ...string[]]>(
  values: T,
  message: string,
) => z.custom<T[number] | undefined>().pipe(z.enum(values, { error: message }));

/** Same rules as the profiles table constraints (Account.md §4). */
export function profileFormSchema(currentYear: number) {
  return z.object({
    weightKg: z
      .string()
      .trim()
      .transform((v) => v.replace(",", "."))
      .refine(
        (v) => /^\d{1,3}(\.\d)?$/.test(v),
        "Nhập cân nặng, tối đa 1 chữ số thập phân",
      )
      .refine(
        (v) => Number(v) >= 20 && Number(v) <= 300,
        "Cân nặng từ 20 đến 300 kg",
      ),
    heightCm: z
      .string()
      .trim()
      .refine((v) => /^\d{2,3}$/.test(v), "Nhập chiều cao bằng số nguyên (cm)")
      .refine(
        (v) => Number(v) >= 100 && Number(v) <= 250,
        "Chiều cao từ 100 đến 250 cm",
      ),
    birthYear: z
      .string()
      .trim()
      .refine((v) => /^\d{4}$/.test(v), "Nhập năm sinh 4 chữ số")
      .refine((v) => {
        const age = currentYear - Number(v);
        return age >= 13 && age <= 100;
      }, "Tuổi phải từ 13 đến 100"),
    sex: choice(["male", "female"], "Chọn giới tính"),
    activityLevel: choice(
      ["sedentary", "light", "moderate", "active", "very_active"],
      "Chọn mức vận động",
    ),
    goalType: choice(["lose", "maintain", "gain"], "Chọn mong muốn"),
  });
}

export type ProfileFormOutput = z.output<ReturnType<typeof profileFormSchema>>;

export function toProfile(v: ProfileFormOutput): Profile {
  return {
    weightKg: Number(v.weightKg),
    heightCm: Number(v.heightCm),
    birthYear: Number(v.birthYear),
    sex: v.sex,
    activityLevel: v.activityLevel,
    goalType: v.goalType,
  };
}

export function toFormValues(p: Profile): ProfileFormValues {
  return {
    weightKg: String(p.weightKg),
    heightCm: String(p.heightCm),
    birthYear: String(p.birthYear),
    sex: p.sex,
    activityLevel: p.activityLevel,
    goalType: p.goalType,
  };
}

// ------------------------------------------------------------------------ data
type ProfileRow = {
  weight_kg: number | string;
  height_cm: number;
  sex: Sex;
  birth_year: number;
  activity_level: ActivityLevel;
  goal_type: GoalType;
};

const fromRow = (r: ProfileRow): Profile => ({
  weightKg: Number(r.weight_kg),
  heightCm: r.height_cm,
  sex: r.sex,
  birthYear: r.birth_year,
  activityLevel: r.activity_level,
  goalType: r.goal_type,
});

export const profileKey = (userId: string | undefined) =>
  ["profile", userId] as const;

export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: profileKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "weight_kg, height_cm, sex, birth_year, activity_level, goal_type",
        )
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data ? fromRow(data as ProfileRow) : null;
    },
  });
}

/** Save failures: network problems get a retry hint; anything else a generic message (no payloads). */
export function saveFailureMessage(error: { message: string }): string {
  return /network|fetch/i.test(error.message)
    ? "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại."
    : "Không lưu được. Thử lại sau.";
}

/** Creates or updates the signed-in user's profile (one row per user, RLS-owned). */
export async function saveProfile(p: Profile): Promise<Result> {
  const { error } = await supabase.from("profiles").upsert(
    {
      weight_kg: p.weightKg,
      height_cm: p.heightCm,
      sex: p.sex,
      birth_year: p.birthYear,
      activity_level: p.activityLevel,
      goal_type: p.goalType,
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

/** Saves and refreshes the profile queries (which also moves onboarding → tabs). */
export function useSaveProfile() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id;
  return useMutation({
    mutationFn: saveProfile,
    onSuccess: async (result) => {
      if (!result.ok) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
        queryClient.invalidateQueries({ queryKey: profileExistsKey(userId) }),
      ]);
    },
  });
}
