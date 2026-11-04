/**
 * Food-name helpers (MealLog.md §4). The server function public.normalize_food_name is the
 * source of truth for matching and uniqueness; this mirrors it for client-side checks.
 * Parity is guaranteed for Vietnamese text and ASCII whitespace; outside that (e.g. ł, ø, ß, which
 * unaccent maps but NFD does not), always trust the server value.
 */

export const FOOD_NAME_MAX = 100;

/** Display form: trim and collapse whitespace; case and diacritics are kept. */
export function cleanFoodName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** Matching form: no Vietnamese diacritics (đ→d), lower case, trimmed, single spaces. */
export function normalizeFoodName(name: string): string {
  return cleanFoodName(name)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/** Valid when the display form has 1–100 characters. */
export function isValidFoodName(name: string): boolean {
  const cleaned = cleanFoodName(name);
  return cleaned.length >= 1 && cleaned.length <= FOOD_NAME_MAX;
}
