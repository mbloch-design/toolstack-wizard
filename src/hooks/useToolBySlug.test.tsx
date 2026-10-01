import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { Tool } from "@/data/types";
import { getToolShardKey, SsrToolContext, useToolBySlug } from "./useSupabaseData";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: vi.fn() } }));

describe("tool route identity", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it("revalidates the production catalogue instead of using an immutable browser copy", async () => {
    vi.stubEnv("DEV", false);
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: "tapstitch", slug: "tapstitch", name: "Tapstitch" }] });
    vi.stubGlobal("fetch", request);
    const { result } = renderHook(() => useToolBySlug("tapstitch"));
    await waitFor(() => expect(result.current.tool?.slug).toBe("tapstitch"));
    expect(request).toHaveBeenCalledWith(`/assets/tool-catalog/${getToolShardKey("tapstitch")}.json`, { cache: "no-cache" });
  });
  it("restores the SSR record when navigating back from another listing", async () => {
    const gamma = { id: "gamma", slug: "gamma", name: "Gamma" } as Tool;
    const wrapper = ({ children }: { children: ReactNode }) => <SsrToolContext.Provider value={gamma}>{children}</SsrToolContext.Provider>;
    const { result, rerender } = renderHook(({ slug }) => useToolBySlug(slug), { wrapper, initialProps: { slug: "gamma" } });
    expect(result.current.tool?.slug).toBe("gamma");
    rerender({ slug: "tapstitch" });
    expect(result.current.tool?.slug).not.toBe("gamma");
    await waitFor(() => expect(result.current.tool?.slug).toBe("tapstitch"), { timeout: 10000 });
    rerender({ slug: "gamma" });
    expect(result.current.tool?.slug).toBe("gamma");
    expect(result.current.loading).toBe(false);
  });
});
