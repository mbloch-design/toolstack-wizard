// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadLocalPosts, type Post } from "./useSupabaseData";
import { useCatalogSearch } from "./useCatalogSearch";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: vi.fn() } }));
afterEach(cleanup);
const emptyTools: [] = [];
const emptyCategories: [] = [];

describe("guide search identities", () => {
  it.each(["fr", "en"])("indexes the actual %s local guides without duplicate or invalid identities", async (lang) => {
    const posts = await loadLocalPosts(lang);
    const { result } = renderHook(() => useCatalogSearch({ query: "notion", posts, tools: emptyTools, categories: emptyCategories, lang }));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.hits).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "guide", slug: "notion-gratuit-vs-payant-vrai-calcul" })]));
  });

  it("keeps locale and slug identities distinct even when remote numeric IDs match", async () => {
    const french: Post = { id: 37, slug: "guide-projets", lang: "fr", title: "Organiser les projets", excerpt: "", tags: [], readTime: "3 min", date: "2026-10-07", category: "Organisation", toolId: null, content: "", thumbnail: null, seo: null };
    const posts: Post[] = [french, { ...french, lang: "en", title: "Planning projects" }];
    const { result } = renderHook(() => useCatalogSearch({ query: "projets", posts, tools: emptyTools, categories: emptyCategories, lang: "fr" }));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.hits?.find((hit) => hit.label === "Organiser les projets")?.entityId).toBe("fr:guide-projets");
  });

  it("gives local posts numeric compatibility IDs without changing the remote contract", async () => {
    const posts = await loadLocalPosts("fr");
    expect(posts.every((post) => Number.isInteger(post.id))).toBe(true);
    expect(new Set(posts.map((post) => post.id)).size).toBe(posts.length);
  });
});
