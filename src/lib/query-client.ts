import { QueryClient } from "@tanstack/react-query";

/**
 * ADR-010: mutations never retry automatically (no false success, no duplicate writes);
 * the user retries explicitly and the client-generated id keeps the write idempotent.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
      mutations: { retry: false },
    },
  });
}
