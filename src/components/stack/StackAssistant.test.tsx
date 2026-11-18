import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import StackFindings from "./StackFindings";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { recipesFor, reportRows, reportVerdict } from "@/lib/agentReport";

vi.mock("@/components/ToolLogo", () => ({ default: () => <span aria-hidden="true" /> }));
const tool = (id: string, name: string) => ({ id, slug: id, name }) as ToolSummary;
// Nine tools, every status for Claude: one click, to set up, not documented, no official server, not checked.
const PAID = [tool("notion", "Notion"), tool("stripe", "Stripe"), tool("figma", "Figma"), tool("slack", "Slack")];
const FREE = [tool("google-analytics", "Google Analytics"), tool("canva", "Canva"), tool("hotjar", "Hotjar"), tool("milanote", "Milanote"), tool("trello", "Trello")];
const SLUGS = [...PAID, ...FREE].map((t) => t.slug!);
const tile = () => document.querySelector<HTMLElement>('[data-card="assistant"]')!;
const nameOf = (slug: string) => [...PAID, ...FREE].find((t) => t.slug === slug)?.name ?? slug;

function view() {
  return render(<MemoryRouter><StackFindings lang="fr" total={80} format={(n) => `${n} €`} spend={PAID.map((t) => ({ tool: t, amount: 20 }))} areas={[]}
    toolCount={PAID.length + FREE.length} fit={[]} freeTools={FREE} items={[]} saved={0} toReview={0} resolved={[]}
    onAddTool={() => {}} onReviewTools={() => {}} agentsHref="/fr/agents" /></MemoryRouter>);
}
// The test environment has no working storage: a small one per test.
beforeEach(() => {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", { configurable: true, value: {
    getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); }, clear: () => store.clear(), key: () => null, length: 0,
  } });
});

// Contract (step 3, 18/11/2026): Ma stack's assistant finding says the hub's verdict for the same stack, word for word.
it("says the hub's verdict for the same stack once an assistant is known", () => {
  window.localStorage.setItem("tooltrim.agents.client", "claude");
  view();
  expect(tile().textContent).toContain(reportVerdict(reportRows(SLUGS, "claude"), "claude", "fr", nameOf));
  expect(tile().textContent).toContain("nous n'avons pas encore regardé Trello");
  expect(tile().textContent).not.toContain("vérifié");
});

it("asks which assistant until answered, then the question leaves and the verdict follows the answer", () => {
  view();
  expect(screen.getByText("Quel assistant utilisez-vous ?")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "ChatGPT" }));
  expect(screen.queryByText("Quel assistant utilisez-vous ?")).not.toBeInTheDocument();
  expect(tile().textContent).toContain(reportVerdict(reportRows(SLUGS, "chatgpt"), "chatgpt", "fr", nameOf));
  expect(window.localStorage.getItem("tooltrim.agents.client")).toBe("chatgpt");
});

// Recipes (step 6): the same ones as the hub for the same stack and assistant, three at most, none once the question is open.
it("shows the hub's recipes for this stack and assistant, three at most", () => {
  window.localStorage.setItem("tooltrim.agents.client", "claude");
  view();
  const shown = [...tile().querySelectorAll<HTMLElement>("[data-recipe]")].map((card) => card.dataset.recipe);
  expect(shown).toEqual(recipesFor(SLUGS, "claude").map((recipe) => recipe.id));
  expect(shown.length).toBeLessThanOrEqual(3);
  expect(screen.getAllByRole("button", { name: "Copier la demande" }).length).toBe(shown.length);
});

// A tile with nothing to say leaves (step 8d): no tool of the stack looked at yet, no assistant tile at all.
it("shows no assistant tile when none of the stack's tools has been looked at", () => {
  window.localStorage.setItem("tooltrim.agents.client", "claude");
  const unknown = [tool("google-sheets", "Google Sheets"), tool("asana", "Asana")];
  render(<MemoryRouter><StackFindings lang="fr" total={0} format={(n) => `${n} €`} spend={[]} areas={[]}
    toolCount={2} fit={[]} freeTools={unknown} items={[]} saved={0} toReview={0} resolved={[]}
    onAddTool={() => {}} onReviewTools={() => {}} agentsHref="/fr/agents" /></MemoryRouter>);
  expect(document.querySelector('[data-card="assistant"]')).toBeNull();
});

// The choice lives in the tile (18/11): its compact menu changes the verdict in place, the tile stays, the key is shared.
it("changes the assistant from the tile's menu, the tile staying in place", async () => {
  window.localStorage.setItem("tooltrim.agents.client", "claude");
  view();
  const before = tile();
  fireEvent.click(screen.getByRole("button", { name: /Votre assistant : Claude/ }));
  fireEvent.click(await screen.findByRole("menuitemradio", { name: "ChatGPT" }));
  expect(tile()).toBe(before);
  expect(tile().textContent).toContain(reportVerdict(reportRows(SLUGS, "chatgpt"), "chatgpt", "fr", nameOf));
  expect(screen.queryByText("Quel assistant utilisez-vous ?")).toBeNull();
  expect(screen.queryByRole("button", { name: "Changer d'assistant" })).toBeNull();
  expect(window.localStorage.getItem("tooltrim.agents.client")).toBe("chatgpt");
});
