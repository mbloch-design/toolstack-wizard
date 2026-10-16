import { afterEach, expect, it, vi } from "vitest";
import { catalogRemoteReadsEnabled } from "./catalogReadSource";
afterEach(() => vi.unstubAllEnvs());
it.each([undefined, "", "local", "unknown"])("defaults to local for %s", source => {
  vi.stubEnv("VITE_CATALOG_READ_SOURCE", source);
  expect(catalogRemoteReadsEnabled()).toBe(false);
});
it("permits explicit remote opt-in while preserving per-call opt-out", () => {
  vi.stubEnv("VITE_CATALOG_READ_SOURCE", "supabase");
  expect(catalogRemoteReadsEnabled()).toBe(true);
  expect(catalogRemoteReadsEnabled(false)).toBe(false);
});
