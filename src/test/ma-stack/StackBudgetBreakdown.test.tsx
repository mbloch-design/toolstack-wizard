// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import StackBudgetBreakdown from "@/components/stack/StackBudgetBreakdown";
import type { ToolSummary } from "@/hooks/useSupabaseData";

const tool = (id: string, extra: Partial<ToolSummary> = {}) => ({
  id, slug: id, name: id, categoryId: "design", pricing: { free: "", paid: "" }, ...extra,
} as ToolSummary);
const paidTool = (id: string, amount = 10) => tool(id, { nativePrices: [{ amount, currency: "USD", period: "monthly" }] });
function budget(tools: ToolSummary[], lang: "fr" | "en" = "en") {
  const onSelect = vi.fn();
  const result = render(<StackBudgetBreakdown territories={[{ id: "design", label: "Design", tools, groups: [] }]}
    colorOf={() => "#222222"} paid={{ isPaid: () => false, setPaid: vi.fn() }} currency="USD"
    lang={lang} onSelect={onSelect} onFreemium={vi.fn()} />);
  return { ...result, onSelect };
}
afterEach(cleanup);

describe("stack budget tool visibility", () => {
  it("shows all eight tools while only adding the two known paid costs to the chart", () => {
    const tools = [paidTool("Substance", 60), paidTool("Red Giant", 53),
      ...["Gemini", "Phind", "Other freemium"].map((id) => tool(id, { pricing: { free: "Free", paid: "Paid" }, nativePrices: [{ amount: 20, currency: "USD", period: "monthly" }] })),
      ...["Claude", "Creative Cloud", "Perplexity"].map((id) => tool(id))];
    const { container, onSelect } = budget(tools);
    expect(container.querySelectorAll("svg circle")).toHaveLength(2);
    expect(screen.getByRole("img", { name: "Monthly cost breakdown: about $113" })).toBeTruthy();
    for (const item of tools) expect(screen.getByRole("button", { name: item.name })).toBeTruthy();
    const unknownRow = screen.getByRole("button", { name: "Claude" }).closest("li")!;
    expect(within(unknownRow).getByText("No checked monthly price")).toBeTruthy();
    expect(unknownRow.textContent).not.toContain("$0");
    expect(screen.getAllByText("Free plan")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Claude" }));
    expect(onSelect).toHaveBeenCalledWith("Claude");
  });

  it("keeps free and unknown tools accessible when there is no paid cost", () => {
    const { container } = budget([tool("Libre", { pricing: { free: "Gratuit", paid: "" } }), tool("Inconnu")], "fr");
    expect(container.querySelectorAll("svg circle")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Libre" })).toBeTruthy();
    expect(screen.getByText("Gratuit")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Inconnu" })).toBeTruthy();
    expect(within(screen.getByRole("button", { name: "Inconnu" }).closest("li")!).getByText("Pas de prix mensuel vérifié")).toBeTruthy();
    // Nothing paid, nothing converted: the note must not claim a conversion.
    expect(container.textContent).not.toContain("Converti");
    expect(screen.getByText("Gratuits ou freemium · 1")).toBeTruthy();
    expect(screen.getByText("Prix à vérifier · 1")).toBeTruthy();
  });

  it("shows a one-time licence in its own currency instead of an unknown cost", () => {
    budget([tool("DxO", { nativePrices: [{ amount: 159.99, currency: "USD", period: "once" }] })], "fr");
    expect(screen.getByText(/Licence unique · 159,99\s\$/)).toBeTruthy();
  });

  it("keeps the seventh paid tool accessible instead of hiding it in an aggregate", () => {
    budget(Array.from({ length: 7 }, (_, i) => paidTool(`Paid ${i + 1}`, 70 - i)));
    expect(screen.getByRole("button", { name: "Paid 7" })).toBeTruthy();
  });
});
