import type { ExpoConfig } from "expo/config";

// Version has a single source: package.json (ADR-013). Do not hard-code it here.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("./package.json") as { version: string };

const config: ExpoConfig = {
  name: "Nutrition Tracker",
  slug: "nutrition-tracker",
  version,
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "nutritiontracker",
  userInterfaceStyle: "automatic",
  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: "io.github.antialberteinstein.nutritiontracker",
  },
  android: {
    package: "io.github.antialberteinstein.nutritiontracker",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#208AEF",
        image: "./assets/images/splash-icon.png",
        imageWidth: 76,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: { projectId: "4a3ed4c7-458c-405f-9272-a422ebc4893f" },
  },
};

export default config;
