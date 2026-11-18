import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import StackFindings from "./StackFindings";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { reportRows, reportVerdict } from "@/lib/agentReport";

vi.mock("@/components/ToolLogo", () => ({ default: () => <span aria-hidden="true" /> }));
const tool = (id: string, name: string) => ({ id, slug: id, name }) as ToolSummary;
// Nine tools, every status for Claude: one click, to set up, not documented, no official server, not checked.
const PAID = [tool("notion", "Notion"), tool("stripe", "Stripe"), tool("figma", "Figma"), tool("slack", "Slack")];
const FREE = [tool("google-analytics", "Google Analytics"), tool("canva", "Canva"), tool("hotjar", "Hotjar"), tool("milanote", "Milanote"), tool("trello", "Trello")];
const SLUGS = [...PAID, ...FREE].map((t) => t.slug!);
const tile = () => document.querySelector<HTMLElement>('[data-card="assistant"]')!;

function view() {
  return render(<MemoryRouter><StackFindings lang="fr" total={80} format={(n) => `${n} €`} spend={PAID.map((t) => ({ tool: t, amount: 20 }))} areas={[]}
    toolCount={PAID.length + FREE.length} fit={[]} freeTools={FREE} items={[]} saved={0} toReview={0} resolved={[]}
    onAddTool={() => {}} onReviewTools={() => {}} agentsHref="/fr/agents#bilan" /></MemoryRouter>);
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
  expect(tile().textContent).toContain(reportVerdict(reportRows(SLUGS, "claude"), "claude", "fr"));
  expect(tile().textContent).toContain("1 outil pas encore vérifié");
});

it("asks which assistant until answered, then the question leaves and the verdict follows the answer", () => {
  view();
  expect(screen.getByText("Quel assistant utilisez-vous ?")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "ChatGPT" }));
  expect(screen.queryByText("Quel assistant utilisez-vous ?")).not.toBeInTheDocument();
  expect(tile().textContent).toContain(reportVerdict(reportRows(SLUGS, "chatgpt"), "chatgpt", "fr"));
  expect(window.localStorage.getItem("tooltrim.agents.client")).toBe("chatgpt");
});
