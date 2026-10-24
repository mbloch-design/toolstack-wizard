import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); });
it("does not initialize or refresh a stored auth session on module import", async () => {
  const { supabase } = await import("./client");
  expect(supabase).toBeDefined();
  expect(mocks.createClient).not.toHaveBeenCalled();
});
it("creates one client on demand with browser session refresh intact and binds SDK methods", async () => {
  const auth = { getSession: vi.fn() };
  const sdk = { auth, from(this: unknown) { return this; } };
  mocks.createClient.mockReturnValue(sdk);
  const { supabase } = await import("./client");
  expect(supabase.auth).toBe(auth);
  expect(supabase.auth).toBe(auth);
  const from = supabase.from;
  expect(from("tools")).toBe(sdk);
  expect(mocks.createClient).toHaveBeenCalledOnce();
  expect(mocks.createClient.mock.calls[0][2].auth).toMatchObject({ persistSession: true, autoRefreshToken: true });
});
