// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { SsrRelatedPostsContext, SsrToolContext, usePosts } from "./useSupabaseData";
import type { Tool } from "@/data/types";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: vi.fn() } }));
afterEach(cleanup);

describe("guides available to search from SSR tool pages", () => {
  it("loads the local guide catalogue despite the retained related-posts SSR payload", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => <SsrToolContext.Provider value={{ id: "notion", slug: "notion" } as Tool}>
      <SsrRelatedPostsContext.Provider value={[]}><MemoryRouter initialEntries={["/fr/tool/notion"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</MemoryRouter></SsrRelatedPostsContext.Provider>
    </SsrToolContext.Provider>;
    const { result } = renderHook(() => usePosts("fr", { refreshRemote: false }), { wrapper });
    await waitFor(() => expect(result.current.posts.some((post) => post.slug === "notion-gratuit-vs-payant-vrai-calcul")).toBe(true));
    expect(result.current.loading).toBe(false);
  });
});
