// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import SearchPage from "@/pages/SearchPage";
import { SearchModal } from "./SearchModal";

const fixture = vi.hoisted(() => ({ tools: [], categories: [], posts: [{ id: 23, slug: "guide-projets-distant", lang: "fr", title: "Organiser les projets ensemble", excerpt: "", tags: [], readTime: "3 min", date: "2026-10-07", category: "Organisation", content: "", thumbnail: null }] }));
vi.mock("@/hooks/useSupabaseData", () => ({
  useToolSummaries: () => ({ tools: fixture.tools }),
  useCategories: () => ({ categories: fixture.categories }),
  usePosts: () => ({ posts: fixture.posts }),
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
afterEach(cleanup);
function CurrentLocation() { return <output aria-label="Destination">{useLocation().pathname}</output>; }

describe("guide navigation from the real enriched search", () => {
  it("resolves a numeric remote guide hit to the correct search page link", async () => {
    render(<MemoryRouter initialEntries={["/fr/search?q=projetsx"]}><SearchPage /></MemoryRouter>);
    const link = await screen.findByRole("link", { name: /Organiser les projets ensemble/ });
    expect(link).toHaveAttribute("href", "/fr/guide/guide-projets-distant");
  });

  it("opens the numeric remote guide from a fuzzy modal search", async () => {
    render(<MemoryRouter initialEntries={["/fr"]}><SearchModal onClose={() => {}} /><CurrentLocation /></MemoryRouter>);
    fireEvent.change(screen.getByRole("textbox", { name: "Rechercher" }), { target: { value: "projetsx" } });
    fireEvent.click(await screen.findByRole("option", { name: /Organiser les projets ensemble/ }));
    expect(screen.getByLabelText("Destination")).toHaveTextContent("/fr/guide/guide-projets-distant");
  });
});
