import { describe, expect, it } from "@jest/globals";

import {
  cleanFoodName,
  isValidFoodName,
  normalizeFoodName,
} from "@/domain/food-name";

describe("food-name (mirrors public.normalize_food_name)", () => {
  it.each([
    ["  Bún  NẠM ", "bun nam"],
    ["Đậu phụ", "dau phu"],
    ["Cà phê sữa đá", "ca phe sua da"],
    ["Bún nạm", "bun nam"],
    ["Bún nạm", "bun nam"], // decomposed input (NFD)
  ])("normalize(%j) = %j", (input, expected) => {
    expect(normalizeFoodName(input)).toBe(expected);
  });

  it("cleanFoodName keeps case and diacritics, collapses spaces (MEAL-06)", () => {
    expect(cleanFoodName("bún  NẠM ")).toBe("bún NẠM");
  });

  it("validates 1–100 characters after cleaning (MEAL-10)", () => {
    expect(isValidFoodName("   ")).toBe(false);
    expect(isValidFoodName("a".repeat(100))).toBe(true);
    expect(isValidFoodName("a".repeat(101))).toBe(false);
  });
});
