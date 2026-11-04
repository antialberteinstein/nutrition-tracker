import { describe, expect, it } from "@jest/globals";

import {
  bmiCategory,
  computeTargets,
  defaultCalorieAdjustment,
  type GoalOverrides,
  type Profile,
} from "@/domain/nutrition";

const YEAR = 2026;
// Goals.md §4 example 1 and example 2
const MALE: Profile = {
  weightKg: 70,
  heightCm: 175,
  sex: "male",
  birthYear: YEAR - 30,
  activityLevel: "moderate",
  goalType: "lose",
};
const FEMALE: Profile = {
  weightKg: 55,
  heightCm: 160,
  sex: "female",
  birthYear: YEAR - 25,
  activityLevel: "sedentary",
  goalType: "maintain",
};
const opts = { currentYear: YEAR, workoutEnabled: false };
const run = (p: Profile, o: GoalOverrides = {}, workoutEnabled = false) =>
  computeTargets(p, o, { currentYear: YEAR, workoutEnabled });

describe("computeTargets — spec examples (GOAL-01)", () => {
  it("example 1: male 70 kg, 175 cm, 30 y, moderate, lose", () => {
    const t = computeTargets(MALE, {}, opts);
    expect(t.bmr).toBe(1649);
    expect(t.tdee).toBe(2556);
    expect(t.calories).toMatchObject({
      suggested: 2056,
      target: 2056,
      bmr: 1649,
      safe: 1949,
      upper: 4000,
    });
    expect(t.protein).toMatchObject({
      lower: 56,
      suggested: 112,
      target: 112,
      upper: 154,
    });
    expect(t.sodium).toMatchObject({
      lower: 500,
      suggested: 1500,
      target: 1500,
      upper: 2000,
    });
    expect(t.sugar).toMatchObject({
      lower: 0,
      suggested: 26,
      target: 26,
      upper: 51,
    });
    expect(t.bmi).toBe(22.9);
    expect(t.bmiCategory).toBe("normal");
  });

  it("example 2: female 55 kg, 160 cm, 25 y, sedentary, maintain", () => {
    const t = computeTargets(FEMALE, {}, opts);
    expect(t.bmr).toBe(1264);
    expect(t.tdee).toBe(1517);
    expect(t.calories.target).toBe(1517);
    expect(t.protein).toMatchObject({ lower: 44, target: 88, upper: 121 });
    expect(t.sugar).toMatchObject({ target: 19, upper: 38 });
  });

  it("GOAL-02: a new account has no custom targets", () => {
    const t = run(MALE);
    for (const n of [t.calories, t.protein, t.sodium, t.sugar])
      expect(n.isCustom).toBe(false);
    expect(t.warnings).toEqual([]);
  });
});

describe("calorie adjustment and warnings W1/W2 (GOAL-03..05, GOAL-11)", () => {
  it("GOAL-11: default adjustment follows the goal", () => {
    expect(defaultCalorieAdjustment("lose")).toBe(-500);
    expect(defaultCalorieAdjustment("maintain")).toBe(0);
    expect(defaultCalorieAdjustment("gain")).toBe(300);
    expect(run({ ...MALE, goalType: "gain" }).calorieAdjustment).toBe(300);
  });

  it("GOAL-03: lose with +1 → W1 and target = round(TDEE) + 1", () => {
    const t = run(MALE, { calorieAdjustment: 1 });
    expect(t.calories.target).toBe(2557);
    expect(t.warnings).toContainEqual({
      code: "W1",
      field: "calorieAdjustment",
    });
  });

  it("GOAL-04: gain with −1 → W2", () => {
    const t = run({ ...MALE, goalType: "gain" }, { calorieAdjustment: -1 });
    expect(t.warnings).toContainEqual({
      code: "W2",
      field: "calorieAdjustment",
    });
  });

  it("GOAL-05: adjustment 0 never triggers W1/W2", () => {
    for (const goalType of ["lose", "gain"] as const) {
      const codes = run(
        { ...MALE, goalType },
        { calorieAdjustment: 0 },
      ).warnings.map((w) => w.code);
      expect(codes).not.toContain("W1");
      expect(codes).not.toContain("W2");
    }
  });
});

describe("custom targets and W3–W5 (GOAL-06, 07, 09)", () => {
  it("GOAL-06: custom calories below BMR → W3, above 4000 → W4", () => {
    expect(run(MALE, { calorieTarget: 1648 }).warnings).toContainEqual({
      code: "W3",
      field: "calorieTarget",
    });
    expect(
      run(MALE, { calorieTarget: 1649 }).warnings.map((w) => w.code),
    ).not.toContain("W3");
    expect(run(MALE, { calorieTarget: 4001 }).warnings).toContainEqual({
      code: "W4",
      field: "calorieTarget",
    });
  });

  it("GOAL-07: nutrient targets outside [lower, upper] → W5 on that field", () => {
    const t = run(MALE, {
      proteinTargetG: 155,
      sodiumTargetMg: 2001,
      sugarTargetG: 52,
    });
    expect(t.warnings).toEqual(
      expect.arrayContaining([
        { code: "W5", field: "proteinTargetG" },
        { code: "W5", field: "sodiumTargetMg" },
        { code: "W5", field: "sugarTargetG" },
      ]),
    );
    expect(run(MALE, { proteinTargetG: 55 }).warnings).toContainEqual({
      code: "W5",
      field: "proteinTargetG",
    });
    expect(run(MALE, { proteinTargetG: 154 }).warnings).toEqual([]);
  });

  it("GOAL-09: custom calorie target survives a weight change and drives sugar bounds", () => {
    const before = run(MALE, { calorieTarget: 1800 });
    const after = run({ ...MALE, weightKg: 80 }, { calorieTarget: 1800 });
    expect(after.calories).toMatchObject({ target: 1800, isCustom: true });
    expect(after.calories.suggested).not.toBe(before.calories.suggested);
    expect(after.sugar).toMatchObject({ suggested: 23, upper: 45 });
  });
});

describe("BMI category and W6 (GOAL-12, GOAL-16)", () => {
  it("uses Asia-Pacific cut-offs on the 1-decimal BMI", () => {
    expect(bmiCategory(18.4)).toBe("underweight");
    expect(bmiCategory(18.5)).toBe("normal");
    expect(bmiCategory(22.9)).toBe("normal");
    expect(bmiCategory(23.0)).toBe("overweight");
    expect(bmiCategory(24.9)).toBe("overweight");
    expect(bmiCategory(25.0)).toBe("obese");
  });

  it("GOAL-12: BMI 17.0 with lose → W6", () => {
    const t = run({ ...MALE, weightKg: 49.1, heightCm: 170 });
    expect(t.bmi).toBe(17.0);
    expect(t.warnings).toContainEqual({ code: "W6", field: "goalType" });
  });

  it("GOAL-16: gain at BMI 25.0 → W6, at 24.9 → no W6", () => {
    const gain = { ...MALE, goalType: "gain" as const, heightCm: 160 };
    expect(run({ ...gain, weightKg: 64.0 }).warnings).toContainEqual({
      code: "W6",
      field: "goalType",
    });
    expect(
      run({ ...gain, weightKg: 63.7 }).warnings.map((w) => w.code),
    ).not.toContain("W6");
  });
});

describe("Workout on: activity factor 1.2 (GOAL-15)", () => {
  it("example 1 with Workout enabled", () => {
    const on = run(MALE, {}, true);
    expect(on.tdee).toBe(1979);
    expect(on.calories.target).toBe(1479);
    const off = run(MALE, {}, false);
    expect(off.tdee).toBe(2556);
    expect(off.calories.target).toBe(2056);
  });
});
