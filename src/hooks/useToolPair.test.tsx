// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { Tool } from "@/data/types";
import { supabase } from "@/integrations/supabase/client";
import { SsrComparePairContext, useToolPair } from "./useSupabaseData";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: vi.fn() } }));

const notion = { id: "notion", slug: "notion", name: "Notion" } as Tool;
const airtable = { id: "airtable", slug: "airtable", name: "Airtable" } as Tool;
const ssrPair = { toolA: notion, toolB: airtable };
const wrapper = ({ children }: { children: ReactNode }) => <SsrComparePairContext.Provider value={ssrPair}>{children}</SsrComparePairContext.Provider>;
const nextPair = [
  { id: "slack", slug: "slack", name: "Slack" },
  { id: "discord", slug: "discord", name: "Discord" },
];

function remoteRequest() {
  let resolve!: (result: { data: typeof nextPair; error: null }) => void;
  const pending = new Promise<{ data: typeof nextPair; error: null }>((done) => { resolve = done; });
  vi.mocked(supabase.from).mockReturnValue({ select: () => ({ in: () => pending }) } as never);
  return async () => { await act(async () => { resolve({ data: nextPair, error: null }); }); };
}

describe("comparison route identity", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("does not expose the previous pair while the next comparison loads", async () => {
    const finishRequest = remoteRequest();
    const { result, rerender } = renderHook(({ a, b }) => useToolPair(a, b), { wrapper, initialProps: { a: "notion", b: "airtable" } });
    rerender({ a: "slack", b: "discord" });
    expect(result.current.toolA).toBeUndefined();
    expect(result.current.toolB).toBeUndefined();
    await finishRequest();
    await waitFor(() => expect(result.current.toolA?.slug).toBe("slack"));
    expect(result.current.toolB?.slug).toBe("discord");
  });

  it("restores the SSR pair after another comparison has loaded", async () => {
    const finishRequest = remoteRequest();
    const { result, rerender } = renderHook(({ a, b }) => useToolPair(a, b), { wrapper, initialProps: { a: "notion", b: "airtable" } });
    expect(result.current.toolA).toBe(notion);
    expect(result.current.toolB).toBe(airtable);
    rerender({ a: "slack", b: "discord" });
    await finishRequest();
    await waitFor(() => expect(result.current.toolA?.slug).toBe("slack"));
    rerender({ a: "notion", b: "airtable" });
    expect(result.current.toolA).toBe(notion);
    expect(result.current.toolB).toBe(airtable);
    expect(result.current.loading).toBe(false);
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it("ignores an outstanding request after returning to the SSR comparison", async () => {
    const finishRequest = remoteRequest();
    const { result, rerender } = renderHook(({ a, b }) => useToolPair(a, b), { wrapper, initialProps: { a: "notion", b: "airtable" } });
    rerender({ a: "slack", b: "discord" });
    rerender({ a: "notion", b: "airtable" });
    await finishRequest();
    expect(result.current.toolA).toBe(notion);
    expect(result.current.toolB).toBe(airtable);
    expect(result.current.loading).toBe(false);
  });
});
