import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

// The Vitest jsdom environment used here does not install window.localStorage,
// so ./client would always take its no-storage branch. Install an in-memory
// Storage before importing it: the assertions stay exactly as strict, but the
// browser branch is now actually reachable.
function installBrowserStorage() {
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, String(value)),
      removeItem: (key: string) => void values.delete(key),
      clear: () => values.clear(),
      key: (index: number) => Array.from(values.keys())[index] ?? null,
      get length() {
        return values.size;
      },
    } as Storage,
  });
}

function removeBrowserStorage() {
  Object.defineProperty(window, "localStorage", { configurable: true, value: undefined });
}

it("does not initialize or refresh a stored auth session on module import", async () => {
  const { supabase } = await import("./client");
  expect(supabase).toBeDefined();
  expect(mocks.createClient).not.toHaveBeenCalled();
});

it("creates one client on demand with browser session refresh intact and binds SDK methods", async () => {
  installBrowserStorage();
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

it("disables session persistence where browser storage is unavailable", async () => {
  removeBrowserStorage();
  const auth = { getSession: vi.fn() };
  mocks.createClient.mockReturnValue({ auth, from(this: unknown) { return this; } });
  const { supabase } = await import("./client");
  expect(supabase.auth).toBe(auth);
  expect(mocks.createClient.mock.calls[0][2].auth).toMatchObject({ persistSession: false, autoRefreshToken: false });
});
