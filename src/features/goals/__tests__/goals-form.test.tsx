import { describe, expect, it, jest } from "@jest/globals";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import {
  computeTargets,
  type GoalOverrides,
  type Profile,
} from "@/domain/nutrition";
import { formatInt } from "@/domain/format";
import type { Result } from "@/features/auth/auth";
import type { GoalsFormOutput } from "@/features/goals/goals";
import { GoalsForm } from "@/features/goals/goals-form";
import { TargetsSummary } from "@/features/goals/targets-summary";

jest.mock("@/lib/supabase", () => ({ supabase: {} }));
jest.mock("expo-symbols", () => ({ SymbolView: () => null }));

const YEAR = 2026;
// Goals.md §4 example 1: male, 70 kg, 175 cm, 30 years, moderate, lose.
const example1: Profile = {
  weightKg: 70,
  heightCm: 175,
  sex: "male",
  birthYear: YEAR - 30,
  activityLevel: "moderate",
  goalType: "lose",
};
// Example 2: female, 55 kg, 160 cm, 25 years, sedentary, maintain.
const example2: Profile = {
  weightKg: 55,
  heightCm: 160,
  sex: "female",
  birthYear: YEAR - 25,
  activityLevel: "sedentary",
  goalType: "maintain",
};

type Submit = (g: GoalsFormOutput) => Promise<Result>;

const setup = async (
  profile: Profile,
  saved: GoalOverrides = {},
  onSubmit: Submit = jest.fn<Submit>().mockResolvedValue({ ok: true }),
) =>
  render(
    <GoalsForm
      profile={profile}
      saved={saved}
      workoutEnabled={false}
      onSubmit={onSubmit}
      currentYear={YEAR}
    />,
  );

const text = (id: string) => screen.getByTestId(id).props.children;
const input = (id: string) => screen.getByTestId(id).props.value;

describe("TargetsSummary (onboarding)", () => {
  it("GOAL-01: example 1 shows BMR 1649, TDEE 2556, target 2056, protein 56/112/154, sugar 0/26/51", async () => {
    const targets = computeTargets(
      example1,
      {},
      { currentYear: YEAR, workoutEnabled: false },
    );
    await render(<TargetsSummary targets={targets} workoutEnabled={false} />);
    expect(text("summary-bmr")).toBe("1.649 kcal");
    expect(text("summary-tdee")).toBe("2.556 kcal");
    expect(text("summary-calories")).toBe("2.056 kcal");
    expect(text("summary-protein")).toBe("56 · 112 · 154 g");
    expect(text("summary-sugar")).toBe("0 · 26 · 51 g");
    expect(screen.queryByText(/Tự đặt/)).toBeNull(); // GOAL-02
  });

  it("GOAL-01: example 2 shows BMR 1264, TDEE 1517, target 1517, protein 44/88/121, sugar 0/19/38", async () => {
    const targets = computeTargets(
      example2,
      {},
      { currentYear: YEAR, workoutEnabled: false },
    );
    await render(<TargetsSummary targets={targets} workoutEnabled={false} />);
    expect(text("summary-bmr")).toBe("1.264 kcal");
    expect(text("summary-tdee")).toBe("1.517 kcal");
    expect(text("summary-calories")).toBe("1.517 kcal");
    expect(text("summary-protein")).toBe("44 · 88 · 121 g");
    expect(text("summary-sugar")).toBe("0 · 19 · 38 g");
  });
});

describe("GoalsForm (Cài đặt › Mục tiêu)", () => {
  it("GOAL-02: a new account follows every suggestion, with no 'Tự đặt' label", async () => {
    await setup(example1);
    expect(input("goal-calorieAdjustment")).toBe("-500");
    expect(input("goal-calorieTarget")).toBe("2056");
    expect(input("goal-proteinTargetG")).toBe("112");
    expect(screen.queryByText(/Tự đặt/)).toBeNull();
    expect(
      screen.getByTestId("goals-submit").props.accessibilityState?.disabled,
    ).toBe(true);
  });

  it("GOAL-03: lose with adjustment +1 warns W1, still saves, target = TDEE + 1", async () => {
    const onSubmit = jest.fn<Submit>().mockResolvedValue({ ok: true });
    await setup(example1, {}, onSubmit);
    await fireEvent.changeText(
      screen.getByTestId("goal-calorieAdjustment"),
      "+1",
    );
    expect(
      await screen.findByTestId("warning-W1-calorieAdjustment"),
    ).toBeTruthy();
    expect(input("goal-calorieTarget")).toBe("2557");
    await waitFor(() =>
      expect(
        screen.getByTestId("goals-submit").props.accessibilityState?.disabled,
      ).toBe(false),
    );
    await fireEvent.press(screen.getByTestId("goals-submit"));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ calorieAdjustment: 1, calorieTarget: null }),
      ),
    );
    expect(await screen.findByTestId("goals-saved")).toBeTruthy();
    expect(screen.getByTestId("warning-W1-calorieAdjustment")).toBeTruthy(); // stays after saving
  });

  it("GOAL-05: lose with adjustment 0 has no W1", async () => {
    await setup(example1, { calorieAdjustment: 0 });
    expect(screen.queryByTestId("warning-W1-calorieAdjustment")).toBeNull();
  });

  it("GOAL-06 / GOAL-07: W3 below BMR, W4 above 4000, W5 per nutrient", async () => {
    await setup(example1, { calorieTarget: 1500, sodiumTargetMg: 2500 });
    expect(screen.getByTestId("warning-W3-calorieTarget")).toBeTruthy();
    expect(screen.getByTestId("warning-W5-sodiumTargetMg")).toBeTruthy();
    expect(screen.queryByTestId("warning-W5-proteinTargetG")).toBeNull();
    await fireEvent.changeText(
      screen.getByTestId("goal-calorieTarget"),
      "4100",
    );
    expect(await screen.findByTestId("warning-W4-calorieTarget")).toBeTruthy();
  });

  it("GOAL-08: an out-of-range value shows an error under the field and cannot be saved", async () => {
    await setup(example1);
    await fireEvent.changeText(screen.getByTestId("goal-calorieTarget"), "799");
    expect(await screen.findByTestId("goal-calorieTarget-error")).toBeTruthy();
    expect(
      screen.getByTestId("goals-submit").props.accessibilityState?.disabled,
    ).toBe(true);
  });

  it("GOAL-09: a custom 1800 survives a weight change; the suggestion label and sugar follow", async () => {
    const onSubmit = jest.fn<Submit>();
    const view = await setup(example1, { calorieTarget: 1800 }, onSubmit);
    expect(text("goal-calorieTarget-custom")).toBe(
      "Tự đặt · gợi ý: 2.056 kcal",
    );
    const sugar = String(Math.round((0.05 * 1800) / 4));
    expect(input("goal-sugarTargetG")).toBe(sugar);

    const heavier = { ...example1, weightKg: 80 };
    const tdee = computeTargets(
      heavier,
      {},
      { currentYear: YEAR, workoutEnabled: false },
    ).tdee;
    await view.rerender(
      <GoalsForm
        profile={heavier}
        saved={{ calorieTarget: 1800 }}
        workoutEnabled={false}
        onSubmit={onSubmit}
        currentYear={YEAR}
      />,
    );
    expect(input("goal-calorieTarget")).toBe("1800");
    expect(text("goal-calorieTarget-custom")).toBe(
      `Tự đặt · gợi ý: ${formatInt(tdee - 500)} kcal`,
    );
    expect(input("goal-sugarTargetG")).toBe(sugar);
  });

  it("GOAL-10: 'Dùng gợi ý' clears the custom value and saves null", async () => {
    const onSubmit = jest.fn<Submit>().mockResolvedValue({ ok: true });
    await setup(example1, { calorieTarget: 1500 }, onSubmit);
    await fireEvent.press(screen.getByTestId("goal-calorieTarget-reset"));
    expect(input("goal-calorieTarget")).toBe("2056");
    expect(screen.queryByTestId("goal-calorieTarget-custom")).toBeNull();
    await waitFor(() =>
      expect(
        screen.getByTestId("goals-submit").props.accessibilityState?.disabled,
      ).toBe(false),
    );
    await fireEvent.press(screen.getByTestId("goals-submit"));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ calorieTarget: null }),
      ),
    );
  });

  it("GOAL-11: with the default adjustment, 'gain' suggests +300", async () => {
    await setup({ ...example1, goalType: "gain" });
    expect(input("goal-calorieAdjustment")).toBe("+300");
  });

  it("GOAL-12: BMI 17.0 with 'lose' warns W6", async () => {
    // 52 kg at 175 cm → BMI 17.0
    await setup({ ...example1, weightKg: 52 });
    expect(screen.getByTestId("warning-W6-goalType")).toBeTruthy();
  });

  it("GOAL-14: a failed save shows the error, never 'đã lưu', and keeps the input", async () => {
    const onSubmit = jest.fn<Submit>().mockResolvedValue({
      ok: false,
      failure: {
        field: "form",
        message: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
      },
    });
    await setup(example1, {}, onSubmit);
    await fireEvent.changeText(
      screen.getByTestId("goal-calorieTarget"),
      "1900",
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("goals-submit").props.accessibilityState?.disabled,
      ).toBe(false),
    );
    await fireEvent.press(screen.getByTestId("goals-submit"));
    expect(await screen.findByTestId("goals-error")).toBeTruthy();
    expect(screen.queryByTestId("goals-saved")).toBeNull();
    expect(input("goal-calorieTarget")).toBe("1900");
  });
});
