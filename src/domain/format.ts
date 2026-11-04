/**
 * Vietnamese number display (CLAUDE.md: dot as thousands separator, "2.350"); pure, no Intl so
 * Hermes builds without full ICU format the same way.
 */
const MINUS = "−";

/** Integer with dot thousands separators: 2056 → "2.056", -500 → "−500". */
export function formatInt(n: number): string {
  const rounded = Math.round(n);
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return rounded < 0 ? `${MINUS}${digits}` : digits;
}

/** Integer with an explicit sign: 300 → "+300", -500 → "−500", 0 → "0". */
export function formatSigned(n: number): string {
  return Math.round(n) > 0 ? `+${formatInt(n)}` : formatInt(n);
}

/** One decimal with a decimal comma: 22.857 → "22,9". */
export function formatDecimal1(n: number): string {
  return n.toFixed(1).replace(".", ",");
}
