// @vitest-environment jsdom
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StackUsagePlay from "./StackUsagePlay";
import type { FitRow } from "./StackFindings";

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const TOOLS = [["Grammarly", 12], ["Motion Array", 25], ["Notion", 36]] as const;

function Harness({ initial = [undefined, undefined, undefined], onReviewTools = vi.fn() }: { initial?: (number | undefined)[]; onReviewTools?: () => void }) {
  const [values, setValues] = useState(initial);
  const rows = values.map((usage, index) => ({
    tool: { id: String(index), slug: String(index), name: TOOLS[index][0] },
    cost: TOOLS[index][1], usage, detailHref: "/",
    setUsage: (next: number | null) => setValues((current) => current.map((old, i) => i === index ? next ?? undefined : old)),
  } as FitRow));
  return <>
    <StackUsagePlay rows={rows} lang="fr" format={(n) => `${n} €`} onReviewTools={onReviewTools} />
    <output aria-label="Recorded values">{JSON.stringify(values)}</output>
  </>;
}
const recorded = () => JSON.parse(screen.getByLabelText("Recorded values").textContent || "[]");
const topCard = () => document.querySelector('.tt-play-card[data-depth="0"]')!.textContent;
const pick = (name: string) => { fireEvent.click(screen.getByRole("button", { name: new RegExp(name) })); act(() => { vi.advanceTimersByTime(400); }); };

describe("usage card game", () => {
  it("asks one question at a time, the most expensive tool first", () => {
    render(<Harness />);
    expect(topCard()).toContain("Notion, vous vous en servez…");
    expect(screen.getByText("Il reste 3 cartes")).toBeTruthy();
  });

  it("records every-day, sometimes and dust as levels 5, 3 and 1, and moves on", () => {
    render(<Harness />);
    pick("Tous les jours");
    expect(topCard()).toContain("Motion Array");
    pick("Parfois");
    pick("Prend la poussière");
    expect(recorded()).toEqual([1, 3, 5]);
  });

  it("answers from the keyboard with the arrows", () => {
    render(<Harness />);
    fireEvent.keyDown(screen.getByRole("article"), { key: "ArrowRight" });
    act(() => { vi.advanceTimersByTime(400); });
    expect(recorded()[2]).toBe(1);
  });

  it("puts an answered card in its pile, and a pile logo replays the card", () => {
    render(<Harness />);
    pick("Prend la poussière");
    const dust = document.querySelector('[data-pile="cut"]') as HTMLElement;
    expect(within(dust).getByText("1")).toBeTruthy();
    fireEvent.click(within(dust).getByRole("button", { name: "Rejouer la carte Notion" }));
    expect(recorded()[2]).toBeNull();
    expect(topCard()).toContain("Notion");
  });

  it("reads earlier answers on the five-step scale (4-5, 2-3, 1)", () => {
    render(<Harness initial={[4, 2, undefined]} />);
    expect(within(document.querySelector('[data-pile="daily"]') as HTMLElement).getByRole("button", { name: "Rejouer la carte Grammarly" })).toBeTruthy();
    expect(within(document.querySelector('[data-pile="sometimes"]') as HTMLElement).getByRole("button", { name: "Rejouer la carte Motion Array" })).toBeTruthy();
    expect(screen.getByText("Il reste 1 carte")).toBeTruthy();
  });

  it("keeps the answers when paused", () => {
    render(<Harness />);
    pick("Tous les jours");
    fireEvent.click(screen.getByRole("button", { name: "Plus tard" }));
    expect(screen.getByRole("button", { name: /Parfois/ })).toBeDisabled();
    expect(recorded()[2]).toBe(5);
    fireEvent.click(screen.getByRole("button", { name: "Reprendre" }));
    expect(screen.getByRole("button", { name: /Parfois/ })).not.toBeDisabled();
  });

  it("ends on the score: what gathers dust, a month and a year", () => {
    const onReviewTools = vi.fn();
    render(<Harness initial={[1, 5, 1]} onReviewTools={onReviewTools} />);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText("Partie terminée")).toBeTruthy();
    expect(screen.getByText(/soit 576 € par an/)).toBeTruthy();
    expect(screen.getByText("Deux figurants payés à ne rien faire.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Voir ce que ça change" }));
    expect(onReviewTools).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Rejouer" }));
    expect(recorded()).toEqual([null, null, null]);
  });

  it("says so when the stack has no paid plan", () => {
    render(<StackUsagePlay rows={[]} lang="fr" format={(n) => `${n} €`} freeOnly onReviewTools={vi.fn()} />);
    expect(screen.getByText("Votre stack, sans abonnement payant.")).toBeTruthy();
  });
});
