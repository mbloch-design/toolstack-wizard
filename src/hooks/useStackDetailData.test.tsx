// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStackBySlug } from "./useStackDetailData";

beforeEach(() => { vi.stubEnv("DEV", false); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("stack catalogue navigation", () => {
  it("finishes an absent stack instead of leaving the route loading forever", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    const { result } = renderHook(() => useStackBySlug("absent-stack"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stack).toBeNull();
  });

  it("finishes a failed shard and permits a later navigation to retry", async () => {
    const request = vi.fn().mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ slug: "retry-stack", title: "Retry stack" }] });
    vi.stubGlobal("fetch", request);
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result, rerender } = renderHook(({ slug }) => useStackBySlug(slug), { initialProps: { slug: "retry-stack" } });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stack).toBeNull();
    rerender({ slug: "" });
    rerender({ slug: "retry-stack" });
    await waitFor(() => expect(result.current.stack?.slug).toBe("retry-stack"));
    warning.mockRestore();
  });

  it("revalidates a stable shard URL and hides the previous stack while navigating", async () => {
    let finish!: (response: { ok: boolean; json: () => Promise<unknown[]> }) => void;
    const request = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => [{ slug: "first-stack", title: "First" }] })
      .mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    vi.stubGlobal("fetch", request);
    const { result, rerender } = renderHook(({ slug }) => useStackBySlug(slug), { initialProps: { slug: "first-stack" } });
    await waitFor(() => expect(result.current.stack?.slug).toBe("first-stack"));
    expect(request).toHaveBeenCalledWith("/assets/stack-catalog/f.json", { cache: "no-cache" });
    rerender({ slug: "next-stack" });
    expect(result.current.stack).toBeNull();
    expect(result.current.loading).toBe(true);
    await act(async () => { finish({ ok: true, json: async () => [] }); });
    expect(result.current.loading).toBe(false);
    expect(result.current.stack).toBeNull();
  });
});
