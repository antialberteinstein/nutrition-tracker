import { describe, expect, it } from "@jest/globals";

import {
  nutrientColors,
  palettes,
  TEXT_ROLES,
  type Scheme,
} from "@/constants/theme";

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const schemes: Scheme[] = ["light", "dark"];

describe("Vở ô ly palette contrast (WCAG)", () => {
  it.each(schemes)(
    "%s: text roles are ≥ 4.5:1 on background and surfaceContainer",
    (s) => {
      const p = palettes[s];
      for (const role of TEXT_ROLES) {
        expect(contrast(p[role], p.background)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(p[role], p.surfaceContainer)).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    },
  );

  it.each(schemes)("%s: nutrient hues are readable as text (≥ 4.5:1)", (s) => {
    for (const hue of Object.values(nutrientColors[s])) {
      expect(contrast(hue, palettes[s].background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(schemes)(
    "%s: margin rule and outline are visible graphics (≥ 3:1)",
    (s) => {
      const p = palettes[s];
      expect(contrast(p.margin, p.background)).toBeGreaterThanOrEqual(3);
      expect(contrast(p.outline, p.background)).toBeGreaterThanOrEqual(3);
    },
  );

  it("onPrimary is readable on primary", () => {
    for (const s of schemes) {
      expect(
        contrast(palettes[s].onPrimary, palettes[s].primary),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
