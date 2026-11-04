import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { LargeSecureStore } from "@/lib/large-secure-store";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("react-native-get-random-values", () => ({}));
jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    setItemAsync: async (k: string, v: string) => void store.set(k, v),
    getItemAsync: async (k: string) => store.get(k) ?? null,
    deleteItemAsync: async (k: string) => void store.delete(k),
  };
});

const KEY = "sb-local-auth-token";
const SESSION = JSON.stringify({
  access_token: "fake.jwt.token",
  user: { id: "u-1" },
});

describe("LargeSecureStore", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await SecureStore.deleteItemAsync(KEY);
  });

  it("round-trips a session and never stores it in plain text", async () => {
    const store = new LargeSecureStore();
    await store.setItem(KEY, SESSION);

    const raw = await AsyncStorage.getItem(KEY);
    expect(raw).not.toBeNull();
    expect(raw).not.toContain("access_token");
    expect(await SecureStore.getItemAsync(KEY)).toMatch(/^[0-9a-f]{64}$/);
    expect(await store.getItem(KEY)).toBe(SESSION);
  });

  it("returns null when nothing is stored or the key is missing", async () => {
    const store = new LargeSecureStore();
    expect(await store.getItem(KEY)).toBeNull();

    await store.setItem(KEY, SESSION);
    await SecureStore.deleteItemAsync(KEY);
    expect(await store.getItem(KEY)).toBeNull();
  });

  it("removeItem clears both the ciphertext and the key", async () => {
    const store = new LargeSecureStore();
    await store.setItem(KEY, SESSION);
    await store.removeItem(KEY);

    expect(await AsyncStorage.getItem(KEY)).toBeNull();
    expect(await SecureStore.getItemAsync(KEY)).toBeNull();
  });
});
