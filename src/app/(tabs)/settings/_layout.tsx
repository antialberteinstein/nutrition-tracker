import { Stack } from "expo-router";

/** Cài đặt is a stack inside its tab: index → Hồ sơ (later Mục tiêu, Nhắc nhở, Món đã lưu). */
export default function SettingsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
