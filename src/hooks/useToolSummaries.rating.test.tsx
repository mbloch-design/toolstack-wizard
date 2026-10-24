import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { computeToolTrimScore } from "@/lib/toolTrimScore";
import { useToolSummaries } from "./useSupabaseData";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: vi.fn() } }));

describe("editorial scores in catalogue summaries", () => {
  it("keeps the published five-axis score on Drata's alternative card", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
    const { result } = renderHook(() => useToolSummaries({ refreshRemote: false }), { wrapper });
    const drata = result.current.tools.find((tool) => tool.slug === "drata");
    expect(computeToolTrimScore(drata)).toMatchObject({ source: "v2", score: 4.2 });
  });
  it("preserves the editorial axes when a remote summary has no rating column", async () => {
    vi.stubEnv("VITE_CATALOG_READ_SOURCE", "supabase");
    vi.mocked(supabase.from).mockReturnValue({ select: () => ({ limit: async () => ({ data: [{ id: "drata", slug: "drata", name: "Drata" }], error: null }) }) } as any);
    const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
    const { result } = renderHook(() => useToolSummaries(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const drata = result.current.tools.find((tool) => tool.slug === "drata");
    expect(computeToolTrimScore(drata)).toMatchObject({ source: "v2", score: 4.2 });
    expect(supabase.from).toHaveBeenCalledWith("tools");
    vi.unstubAllEnvs();
  });
});
