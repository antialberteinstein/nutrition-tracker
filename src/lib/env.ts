export type SupabaseEnv = { url: string; anonKey: string };

/**
 * Validates the public Supabase variables. Callers must read them as
 * `process.env.EXPO_PUBLIC_*` literals so Expo can inline them at build time.
 */
export function parseSupabaseEnv(
  url: string | undefined,
  anonKey: string | undefined,
): SupabaseEnv {
  if (!url || !anonKey) {
    throw new Error(
      "Thiếu EXPO_PUBLIC_SUPABASE_URL hoặc EXPO_PUBLIC_SUPABASE_ANON_KEY. Chép .env.example thành .env và điền giá trị (xem README).",
    );
  }
  try {
    new URL(url);
  } catch {
    throw new Error(`EXPO_PUBLIC_SUPABASE_URL không phải URL hợp lệ: ${url}`);
  }
  return { url, anonKey };
}
