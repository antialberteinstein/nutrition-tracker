import { describe, expect, it } from "@jest/globals";

import { parseSupabaseEnv } from "@/lib/env";
import { createQueryClient } from "@/lib/query-client";

describe("parseSupabaseEnv", () => {
  it("accepts a URL and anon key", () => {
    expect(parseSupabaseEnv("http://127.0.0.1:54321", "anon")).toEqual({
      url: "http://127.0.0.1:54321",
      anonKey: "anon",
    });
  });

  it("fails with a Vietnamese hint when a variable is missing", () => {
    expect(() => parseSupabaseEnv(undefined, "anon")).toThrow(
      /EXPO_PUBLIC_SUPABASE_URL/,
    );
    expect(() => parseSupabaseEnv("http://127.0.0.1:54321", "")).toThrow(
      /\.env\.example/,
    );
  });

  it("rejects a malformed URL", () => {
    expect(() => parseSupabaseEnv("not a url", "anon")).toThrow(
      /không phải URL hợp lệ/,
    );
  });
});

describe("createQueryClient (ADR-010)", () => {
  it("never retries mutations automatically", () => {
    const client = createQueryClient();
    expect(client.getDefaultOptions().mutations?.retry).toBe(false);
  });
});
