/**
 * "Vở ô ly" design tokens (issue #11, .impeccable/surfaces/src-app-index-tsx.md).
 * Material 3 colour roles; Dynamic Color is intentionally off so nutrient hues and the red
 * margin keep a fixed meaning. Contrast of every text role is asserted in __tests__/theme.test.ts.
 */
import type { TextStyle } from "react-native";

export type Scheme = "light" | "dark";

export type ColorRole =
  | "background"
  | "surfaceContainer"
  | "onSurface"
  | "onSurfaceVariant"
  | "primary"
  | "onPrimary"
  | "primaryContainer"
  | "onPrimaryContainer"
  | "outline"
  | "outlineVariant"
  | "error"
  | "margin";

/** Text roles: must stay ≥ 4.5:1 on background and surfaceContainer. */
export const TEXT_ROLES = [
  "onSurface",
  "onSurfaceVariant",
  "primary",
  "error",
] as const;

export const palettes: Record<Scheme, Record<ColorRole, string>> = {
  // Notebook page: white paper, violet ink, lavender ô ly rules, red margin.
  light: {
    background: "#FBFBFE",
    surfaceContainer: "#EEEBFA",
    onSurface: "#1F1A2E",
    onSurfaceVariant: "#5C5670",
    primary: "#4B2E83",
    onPrimary: "#FFFFFF",
    primaryContainer: "#E3DAFB",
    onPrimaryContainer: "#2A1655",
    outline: "#7A7392",
    outlineVariant: "#B9B3E6",
    error: "#B3261E",
    margin: "#D9473F",
  },
  // The same page under a desk lamp: deep ink ground, light violet ink.
  dark: {
    background: "#17141F",
    surfaceContainer: "#262132",
    onSurface: "#ECE8F6",
    onSurfaceVariant: "#BDB6CF",
    primary: "#CDBDFF",
    onPrimary: "#2A1655",
    primaryContainer: "#3B2A66",
    onPrimaryContainer: "#E8DEFF",
    outline: "#8E87A6",
    outlineVariant: "#3A3452",
    error: "#FFB4AB",
    margin: "#FF8A80",
  },
};

export type Nutrient = "calories" | "protein" | "sodium" | "sugar";

/** One fixed hue per nutrient, used identically on Hôm nay, the add-meal sheet and Biểu đồ. */
export const nutrientColors: Record<Scheme, Record<Nutrient, string>> = {
  light: {
    calories: "#4B2E83",
    protein: "#2E6E50",
    sodium: "#8A5A00",
    sugar: "#8E2F6E",
  },
  dark: {
    calories: "#CDBDFF",
    protein: "#86D4AE",
    sodium: "#E9C16B",
    sugar: "#F2A7D6",
  },
};

const tabular: TextStyle["fontVariant"] = ["tabular-nums"];

/** Material 3 type roles (sp). Calories use display, nutrients title, meal rows body. */
export const typeScale = {
  display: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "700",
    fontVariant: tabular,
  },
  headline: { fontSize: 24, lineHeight: 32, fontWeight: "500" },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "500" },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: "500" },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  labelSmall: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof typeScale;

/** 8 dp unit; 32 dp between blocks (one "large ô"). */
export const space = { xs: 4, s: 8, m: 16, l: 24, block: 32 } as const;

export const layout = {
  /** Width of the red-margin column; status marks live only inside it. */
  marginColumn: 40,
  touchTarget: 48,
} as const;
