import { NativeTabs } from "expo-router/native-tabs";

import { useTheme } from "@/hooks/use-theme";

/** Material bottom navigation: Hôm nay · Biểu đồ · Cài đặt (Workout tab arrives in 0.2.0). */
export default function AppTabs() {
  const { colors } = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.surfaceContainer}
      indicatorColor={colors.primaryContainer}
      labelStyle={{
        default: { color: colors.onSurfaceVariant },
        selected: { color: colors.onSurface },
      }}
      iconColor={{
        default: colors.onSurfaceVariant,
        selected: colors.onPrimaryContainer,
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Hôm nay</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "book.closed", selected: "book.closed.fill" }}
          md="menu_book"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chart">
        <NativeTabs.Trigger.Label>Biểu đồ</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "chart.bar", selected: "chart.bar.fill" }}
          md="bar_chart"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Cài đặt</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
