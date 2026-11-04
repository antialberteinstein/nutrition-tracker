import { describe, expect, it, jest } from "@jest/globals";

import {
  draftOverrides,
  type GoalsFormValues,
  goalsFormSchema,
  parseGoalInput,
  toGoalsFormValues,
} from "@/features/goals/goals";

jest.mock("@/lib/supabase", () => ({ supabase: {} }));

const suggestedOnly: GoalsFormValues = {
  calorieAdjustment: null,
  calorieTarget: null,
  proteinTargetG: null,
  sodiumTargetMg: null,
  sugarTargetG: null,
};

const errorFields = (values: GoalsFormValues) => {
  const r = goalsFormSchema.safeParse(values);
  return r.success ? [] : r.error.issues.map((i) => i.path[0]);
};

describe("parseGoalInput", () => {
  it("accepts signed integers, including the typographic minus", () => {
    expect(parseGoalInput("+300")).toBe(300);
    expect(parseGoalInput("-500")).toBe(-500);
    expect(parseGoalInput("−500")).toBe(-500);
    expect(parseGoalInput(" 1 800 ")).toBe(1800);
    expect(parseGoalInput("2.056")).toBe(2056);
    expect(parseGoalInput("-1.500")).toBe(-1500);
    expect(parseGoalInput("12.5")).toBeNull();
    expect(parseGoalInput("abc")).toBeNull();
    expect(parseGoalInput("")).toBeNull();
  });
});

describe("goalsFormSchema (Goals.md §4)", () => {
  it("GOAL-02: every field following its suggestion saves as null", () => {
    expect(goalsFormSchema.parse(suggestedOnly)).toEqual(suggestedOnly);
  });

  it("GOAL-08: 799, 6001, adjustment 1501, blank and text never save", () => {
    expect(errorFields({ ...suggestedOnly, calorieTarget: "799" })).toEqual([
      "calorieTarget",
    ]);
    expect(errorFields({ ...suggestedOnly, calorieTarget: "6001" })).toEqual([
      "calorieTarget",
    ]);
    expect(
      errorFields({ ...suggestedOnly, calorieAdjustment: "1501" }),
    ).toEqual(["calorieAdjustment"]);
    expect(errorFields({ ...suggestedOnly, proteinTargetG: "" })).toEqual([
      "proteinTargetG",
    ]);
    expect(errorFields({ ...suggestedOnly, sodiumTargetMg: "nhiều" })).toEqual([
      "sodiumTargetMg",
    ]);
  });

  it("accepts the range limits", () => {
    expect(
      goalsFormSchema.parse({
        calorieAdjustment: "-1500",
        calorieTarget: "800",
        proteinTargetG: "400",
        sodiumTargetMg: "0",
        sugarTargetG: "300",
      }),
    ).toEqual({
      calorieAdjustment: -1500,
      calorieTarget: 800,
      proteinTargetG: 400,
      sodiumTargetMg: 0,
      sugarTargetG: 300,
    });
  });
});

describe("form values", () => {
  it("maps saved overrides; null stays null (suggested)", () => {
    expect(toGoalsFormValues({})).toEqual(suggestedOnly);
    expect(toGoalsFormValues({ calorieTarget: 1800 })).toEqual({
      ...suggestedOnly,
      calorieTarget: "1800",
    });
    // A saved positive adjustment keeps its sign when the screen is reopened (Goals.md §2).
    expect(toGoalsFormValues({ calorieAdjustment: 1 }).calorieAdjustment).toBe(
      "+1",
    );
    expect(toGoalsFormValues({ calorieAdjustment: -1 }).calorieAdjustment).toBe(
      "-1",
    );
  });

  it("previews valid typing and keeps the saved value while a field is invalid", () => {
    const saved = { calorieTarget: 1800 };
    expect(
      draftOverrides({ ...suggestedOnly, calorieTarget: "2000" }, saved),
    ).toMatchObject({ calorieTarget: 2000 });
    expect(
      draftOverrides({ ...suggestedOnly, calorieTarget: "20" }, saved),
    ).toMatchObject({ calorieTarget: 1800 });
    expect(draftOverrides(suggestedOnly, saved)).toMatchObject({
      calorieTarget: null,
    });
  });
});
