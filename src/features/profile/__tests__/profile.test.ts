import { describe, expect, it, jest } from "@jest/globals";

import {
  EMPTY_PROFILE_FORM,
  missingProfileFields,
  profileFormSchema,
  type ProfileFormValues,
  saveFailureMessage,
  toFormValues,
  toProfile,
} from "@/features/profile/profile";

jest.mock("@/lib/supabase", () => ({ supabase: {} }));

const YEAR = 2026;
const schema = profileFormSchema(YEAR);
const valid: ProfileFormValues = {
  weightKg: "70",
  heightCm: "175",
  birthYear: "1996",
  sex: "male",
  activityLevel: "moderate",
  goalType: "lose",
};

const errorPaths = (values: ProfileFormValues) => {
  const result = schema.safeParse(values);
  // A field can fail several checks; the form shows the first one, so compare distinct fields.
  return result.success
    ? []
    : [...new Set(result.error.issues.map((i) => i.path[0]))];
};

describe("profileFormSchema (Account.md §4)", () => {
  it("accepts a complete profile and a decimal comma", () => {
    expect(errorPaths(valid)).toEqual([]);
    const parsed = schema.parse({ ...valid, weightKg: " 70,5 " });
    expect(toProfile(parsed).weightKg).toBe(70.5);
  });

  it("ACC-05: weight 19.9 and 300.1 are rejected on the weight field", () => {
    expect(errorPaths({ ...valid, weightKg: "19.9" })).toEqual(["weightKg"]);
    expect(errorPaths({ ...valid, weightKg: "300.1" })).toEqual(["weightKg"]);
    expect(errorPaths({ ...valid, weightKg: "20" })).toEqual([]);
    expect(errorPaths({ ...valid, weightKg: "300" })).toEqual([]);
    expect(errorPaths({ ...valid, weightKg: "70.55" })).toEqual(["weightKg"]);
  });

  it("ACC-05: height 99 is rejected; 100 and 250 are allowed", () => {
    expect(errorPaths({ ...valid, heightCm: "99" })).toEqual(["heightCm"]);
    expect(errorPaths({ ...valid, heightCm: "100" })).toEqual([]);
    expect(errorPaths({ ...valid, heightCm: "250" })).toEqual([]);
    expect(errorPaths({ ...valid, heightCm: "175.5" })).toEqual(["heightCm"]);
  });

  it("ACC-05: age 12 and 101 are rejected; 13 and 100 are allowed", () => {
    expect(errorPaths({ ...valid, birthYear: String(YEAR - 12) })).toEqual([
      "birthYear",
    ]);
    expect(errorPaths({ ...valid, birthYear: String(YEAR - 101) })).toEqual([
      "birthYear",
    ]);
    expect(errorPaths({ ...valid, birthYear: String(YEAR - 13) })).toEqual([]);
    expect(errorPaths({ ...valid, birthYear: String(YEAR - 100) })).toEqual([]);
  });

  it("ACC-05: an empty form reports every field", () => {
    expect(errorPaths(EMPTY_PROFILE_FORM).sort()).toEqual(
      [
        "activityLevel",
        "birthYear",
        "goalType",
        "heightCm",
        "sex",
        "weightKg",
      ].sort(),
    );
  });

  it("round-trips a saved profile through the form values", () => {
    const profile = toProfile(schema.parse(valid));
    expect(profile).toEqual({
      weightKg: 70,
      heightCm: 175,
      birthYear: 1996,
      sex: "male",
      activityLevel: "moderate",
      goalType: "lose",
    });
    expect(toFormValues(profile)).toEqual(valid);
  });
});

describe("missingProfileFields", () => {
  it("ACC-05: names blank fields in form order", () => {
    expect(missingProfileFields(valid)).toEqual([]);
    expect(
      missingProfileFields({ ...valid, heightCm: " ", goalType: undefined }),
    ).toEqual(["Chiều cao", "Mong muốn"]);
    expect(missingProfileFields(EMPTY_PROFILE_FORM)).toHaveLength(6);
  });

  it("shows a saved decimal weight with a comma", () => {
    expect(
      toFormValues({ ...toProfile(schema.parse(valid)), weightKg: 70.5 })
        .weightKg,
    ).toBe("70,5");
  });
});

describe("saveFailureMessage", () => {
  it("ACC-14: network failures get a retry hint, others a generic message", () => {
    expect(saveFailureMessage({ message: "Network request failed" })).toMatch(
      /Kiểm tra mạng/,
    );
    expect(saveFailureMessage({ message: "duplicate key" })).toBe(
      "Không lưu được. Thử lại sau.",
    );
  });
});
