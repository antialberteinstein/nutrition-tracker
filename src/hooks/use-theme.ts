import { nutrientColors, palettes, type Scheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

/** Current "Vở ô ly" palette for the system light/dark setting (Dynamic Color off). */
export function useTheme() {
  const scheme: Scheme = useColorScheme() === "dark" ? "dark" : "light";
  return {
    scheme,
    colors: palettes[scheme],
    nutrients: nutrientColors[scheme],
  };
}
