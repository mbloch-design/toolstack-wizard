// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AgentsIndexPage from "./AgentsIndexPage";
import { SERVERS, featuredServers } from "@/lib/agentReport";

vi.mock("@/components/ToolLogo", () => ({ default: () => <span aria-hidden="true" /> }));
vi.mock("@/ds/Logo/Logo", () => ({ default: () => <span aria-hidden="true" /> }));
vi.mock("@/components/tool/ToolMediaCard", () => ({ default: ({ dataTool }: { dataTool?: string }) => <li data-discovery-tool={dataTool} /> }));

beforeEach(() => {
  const store = new Map<string, string>([["tooltrim.agents.client", "claude"]]);
  Object.defineProperty(window, "localStorage", { configurable: true, value: {
    getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); }, clear: () => store.clear(), key: () => null, length: 0,
  } });
  window.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } root = null; rootMargin = ""; thresholds = []; } as unknown as typeof IntersectionObserver;
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;
});
afterEach(cleanup);

const view = (path: string, page: "all" | "mcp") => render(<MemoryRouter initialEntries={[path]}><Routes>
  <Route path="/fr/agents" element={<AgentsIndexPage view={page} />} /><Route path="/fr/mcp" element={<AgentsIndexPage view={page} />} />
</Routes></MemoryRouter>);

// Contract (step 8, 18/11/2026): /agents and /mcp are hubs like Outils, Stacks and Comparatifs — the catalogue's bar,
// the assistant at its right, the catalogue's shelf rows; no report, no questions, no logo grid on the hub.
it("/agents uses the catalogue bar, « À la une » and the catalogue's shelf rows", () => {
  view("/fr/agents", "all");
  expect(document.querySelector('[data-toolbar="catalog"]')).not.toBeNull();
  expect(screen.getByRole("button", { name: "Avec Claude" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tout" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("heading", { name: "À la une" })).toBeInTheDocument();
  expect([...document.querySelectorAll("[data-discovery-tool]")].map((card) => card.getAttribute("data-discovery-tool"))).toEqual(featuredServers("claude").map((card) => card.host_tool));
  // Every server is a row of the shelves, each with one status at its right.
  expect(document.querySelectorAll("[data-status]").length).toBeGreaterThan(0);
  expect(screen.queryByText("Vos outils")).toBeNull();
  expect(screen.queryByText("Cochez ceux que vous utilisez.")).toBeNull();
});

it("/mcp compares the official servers, one row each, each leading to its sheet (step 9)", () => {
  view("/fr/mcp", "mcp");
  expect(screen.getByRole("heading", { level: 1, name: "Serveurs MCP officiels" })).toBeInTheDocument();
  const rows = document.querySelectorAll('[data-table="compare"] tbody tr');
  expect(rows.length).toBe(SERVERS.length);
  for (const card of SERVERS) expect(document.querySelector(`[data-table="compare"] a[href="/fr/mcp/${card.slug}"]`)).not.toBeNull();
  expect(document.querySelector('a[href="/fr/agents"]')).not.toBeNull();
  expect(document.querySelector('a[href="/fr/skills"]')).not.toBeNull();
  expect(screen.queryByRole("heading", { name: "À la une" })).toBeNull();
});
