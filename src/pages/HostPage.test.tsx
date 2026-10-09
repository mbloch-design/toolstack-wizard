// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Tool } from "@/data/types";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from } }));
beforeEach(() => vi.resetModules());
afterEach(() => { cleanup(); vi.clearAllMocks(); });

async function renderHost() {
  const { SsrToolContext } = await import("@/hooks/useSupabaseData");
  const { default: HostPage } = await import("./HostPage");
  const { HelmetProvider } = await import("react-helmet-async");
  await act(async () => { render(<HelmetProvider><SsrToolContext.Provider value={{ id: "figma", slug: "figma" } as Tool}>
    <MemoryRouter initialEntries={["/fr/plugins/figma"]}>
      <Routes>
        <Route path="/fr/plugins/:slug" element={<HostPage famille="plugins" />} />
        <Route path="/fr/tool/figma" element={<h1>Fiche Figma</h1>} />
      </Routes>
    </MemoryRouter>
  </SsrToolContext.Provider></HelmetProvider>); });
}

describe("host navigation after an SSR tool entry", () => {
  it("loads the attachment model on the new route instead of preserving the SSR exemption", async () => {
    const rows = [
      { id: "figma", slug: "figma", name: "Figma", form_factor: "app", works_with: [] },
      ...["Alpha", "Beta", "Gamma"].map((name) => ({ id: `plugin-${name.toLowerCase()}`, slug: `plugin-${name.toLowerCase()}`, name, form_factor: "plugin", works_with: ["figma"] })),
    ];
    from.mockReturnValue({ select: () => ({ limit: async () => ({ data: rows, error: null }) }) } as never);
    await renderHost();
    expect(await screen.findByRole("heading", { name: "Plugins pour Figma" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Alpha/ })).toHaveAttribute("href", "/fr/tool/plugin-alpha");
  });

  it("returns to the host fiche when the attachment model is unavailable", async () => {
    from.mockReturnValue({ select: () => ({ limit: async () => ({ data: null, error: { message: "Offline" } }) }) } as never);
    await renderHost();
    expect(await screen.findByRole("heading", { name: "Fiche Figma" })).toBeInTheDocument();
  });
});
