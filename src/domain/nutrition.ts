/**
 * Pure nutrition math (docs/modules/Goals.md §4, ADR-004). No I/O, no React.
 * Rounding happens only at the last step, with Math.round (half up).
 */

export type Sex = "male" | "female";
export type ActivityLevel =
  "sedentary" | "light" | "moderate" | "active" | "very_active";
export type GoalType = "lose" | "maintain" | "gain";
export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

export type Profile = {
  weightKg: number;
  heightCm: number;
  sex: Sex;
  birthYear: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
};

/** Values the user set; null/undefined means "use the suggestion". */
export type GoalOverrides = {
  calorieAdjustment?: number | null;
  calorieTarget?: number | null;
  proteinTargetG?: number | null;
  sodiumTargetMg?: number | null;
  sugarTargetG?: number | null;
};

export type WarningCode = "W1" | "W2" | "W3" | "W4" | "W5" | "W6";
export type WarningField = keyof GoalOverrides | "goalType";
export type Warning = { code: WarningCode; field: WarningField };

export type NutrientTarget = {
  lower: number;
  suggested: number;
  target: number;
  upper: number;
  isCustom: boolean;
};

export type CalorieTarget = {
  bmr: number;
  safe: number;
  suggested: number;
  target: number;
  upper: number;
  isCustom: boolean;
};

export type Targets = {
  age: number;
  bmi: number;
  bmiCategory: BmiCategory;
  bmr: number;
  tdee: number;
  calorieAdjustment: number;
  isCustomAdjustment: boolean;
  calories: CalorieTarget;
  protein: NutrientTarget;
  sodium: NutrientTarget;
  sugar: NutrientTarget;
  warnings: Warning[];
};

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** ADR / RequirementsOutline: with Workout on, exercise is counted via net calories instead. */
export const WORKOUT_ACTIVITY_FACTOR = 1.2;
export const CALORIE_UPPER = 4000;
export const SAFE_MARGIN = 300;
export const SODIUM = { lower: 500, suggested: 1500, upper: 2000 } as const;

const DEFAULT_ADJUSTMENT: Record<GoalType, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export function defaultCalorieAdjustment(goal: GoalType): number {
  return DEFAULT_ADJUSTMENT[goal];
}

/**
 * BMI rounded half-up to 1 decimal, as displayed.
 * Computed in integers (weight in 0.1 kg, height in cm) so values like 18.75 round to 18.8;
 * the floating-point `kg / (m * m)` form rounds some of them down.
 */
export function bmi(weightKg: number, heightCm: number): number {
  const numerator = Math.round(weightKg * 10) * 10000; // BMI * 10 = w10 * 10000 / cm^2
  const denominator = heightCm * heightCm;
  return Math.floor((2 * numerator + denominator) / (2 * denominator)) / 10;
}

/** Asia-Pacific cut-offs, applied to the displayed (1-decimal) BMI. */
export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return "underweight";
  if (value < 23) return "normal";
  if (value < 25) return "overweight";
  return "obese";
}

/** Mifflin-St Jeor, unrounded. */
export function bmrExact(p: Profile, age: number): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * age;
  return p.sex === "male" ? base + 5 : base - 161;
}

const isSet = (v: number | null | undefined): v is number =>
  v !== null && v !== undefined;

function nutrient(
  lower: number,
  suggested: number,
  upper: number,
  custom?: number | null,
): NutrientTarget {
  return isSet(custom)
    ? { lower, suggested, target: custom, upper, isCustom: true }
    : { lower, suggested, target: suggested, upper, isCustom: false };
}

/**
 * Inputs are expected to be valid (zod schemas + DB constraints, ADR-004); no guards here.
 * W3 and W5 compare against the displayed (rounded) BMR and bounds, so a warning never
 * contradicts the numbers on screen.
 */
export function computeTargets(
  profile: Profile,
  overrides: GoalOverrides,
  options: { currentYear: number; workoutEnabled: boolean },
): Targets {
  const age = options.currentYear - profile.birthYear;
  const bmiValue = bmi(profile.weightKg, profile.heightCm);
  const exactBmr = bmrExact(profile, age);
  const factor = options.workoutEnabled
    ? WORKOUT_ACTIVITY_FACTOR
    : ACTIVITY_FACTOR[profile.activityLevel];
  const tdee = Math.round(exactBmr * factor);
  const bmr = Math.round(exactBmr);

  const isCustomAdjustment = isSet(overrides.calorieAdjustment);
  const adjustment = isSet(overrides.calorieAdjustment)
    ? overrides.calorieAdjustment
    : defaultCalorieAdjustment(profile.goalType);
  const suggestedCalories = tdee + adjustment;
  const calorieTarget = isSet(overrides.calorieTarget)
    ? overrides.calorieTarget
    : suggestedCalories;

  const calories: CalorieTarget = {
    bmr,
    safe: Math.round(exactBmr + SAFE_MARGIN),
    suggested: suggestedCalories,
    target: calorieTarget,
    upper: CALORIE_UPPER,
    isCustom: isSet(overrides.calorieTarget),
  };
  const protein = nutrient(
    Math.round(0.8 * profile.weightKg),
    Math.round(1.6 * profile.weightKg),
    Math.round(2.2 * profile.weightKg),
    overrides.proteinTargetG,
  );
  const sodium = nutrient(
    SODIUM.lower,
    SODIUM.suggested,
    SODIUM.upper,
    overrides.sodiumTargetMg,
  );
  // Sugar bounds follow the calorie target in use (custom if set): 5% / 10% of kcal, 4 kcal per g.
  const sugar = nutrient(
    0,
    Math.round((0.05 * calorieTarget) / 4),
    Math.round((0.1 * calorieTarget) / 4),
    overrides.sugarTargetG,
  );

  const warnings: Warning[] = [];
  if (profile.goalType === "lose" && adjustment >= 1)
    warnings.push({ code: "W1", field: "calorieAdjustment" });
  if (profile.goalType === "gain" && adjustment <= -1)
    warnings.push({ code: "W2", field: "calorieAdjustment" });
  if (calorieTarget < bmr)
    warnings.push({ code: "W3", field: "calorieTarget" });
  if (calorieTarget > CALORIE_UPPER)
    warnings.push({ code: "W4", field: "calorieTarget" });
  const outside = (n: NutrientTarget) =>
    n.target < n.lower || n.target > n.upper;
  if (outside(protein)) warnings.push({ code: "W5", field: "proteinTargetG" });
  if (outside(sodium)) warnings.push({ code: "W5", field: "sodiumTargetMg" });
  if (outside(sugar)) warnings.push({ code: "W5", field: "sugarTargetG" });
  if (
    (bmiValue < 18.5 && profile.goalType === "lose") ||
    (bmiValue >= 25 && profile.goalType === "gain")
  ) {
    warnings.push({ code: "W6", field: "goalType" });
  }

  return {
    age,
    bmi: bmiValue,
    bmiCategory: bmiCategory(bmiValue),
    bmr,
    tdee,
    calorieAdjustment: adjustment,
    isCustomAdjustment,
    calories,
    protein,
    sodium,
    sugar,
    warnings,
  };
}
