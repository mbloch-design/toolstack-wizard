// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StackUsageReview from "./StackUsageReview";
import type { FitRow } from "./StackFindings";

afterEach(cleanup);

function Harness({ initial = [undefined, undefined], history = false }: { initial?: (number | undefined)[]; history?: boolean }) {
  const [values, setValues] = useState(initial);
  const [removed, remove] = useState(false);
  const rows = values.map((usage, index) => ({
    tool: { id: String(index), slug: String(index), name: index === 0 ? "Motion Array" : "Grammarly" },
    cost: index === 0 ? 25 : 12, usage, detailHref: "/",
    setUsage: (next: number | null) => setValues(current => current.map((old, i) => i === index ? next ?? undefined : old)),
  } as FitRow)).filter(row => !removed || row.tool.id !== "0");
  return <>
    <button onClick={() => remove(true)}>Remove first tool</button>
    <StackUsageReview rows={rows} lang="fr" format={n => `${n} €`} complete={rows.every(row => !!row.usage)}
      history={history ? <button>Revoir cette paire</button> : undefined} onReviewTools={vi.fn()} />
    <output aria-label="Recorded values">{JSON.stringify(values)}</output>
  </>;
}

describe("compact usage review", () => {
  it("saves an answer in place and advances only on Next", () => {
    render(<Harness />);
    expect(screen.getByRole("heading", { name: "Son rythme chez vous ?" })).toBeVisible();
    const low = screen.getByRole("radio", { name: "Usage faible" });
    fireEvent.click(low);
    expect(low).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("heading", { name: "Motion Array" })).toBeVisible();
    expect(screen.getByLabelText("Recorded values")).toHaveTextContent("[1,null]");
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(screen.getByRole("heading", { name: "Grammarly" })).toBeVisible();
    fireEvent.click(screen.getByRole("radio", { name: "Usage intensif" }));
    fireEvent.click(screen.getByRole("button", { name: "Terminer" }));
    expect(screen.getByRole("heading", { name: "Casting au complet." })).toHaveFocus();
  });

  it("previews humour without saving and supports radio arrow keys", () => {
    render(<Harness initial={[undefined]} />);
    const low = screen.getByRole("radio", { name: "Usage faible" });
    fireEvent.pointerEnter(low);
    expect(screen.getByText(/Il fait surtout de la figuration/ )).toBeVisible();
    expect(screen.getByLabelText("Recorded values")).toHaveTextContent("[null]");
    fireEvent.keyDown(low, { key: "End" });
    expect(screen.getByRole("radio", { name: "Usage intensif" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Recorded values")).toHaveTextContent("[5]");
  });

  it("skips without inventing usage and resumes the pending tool", () => {
    render(<Harness initial={[undefined]} />);
    fireEvent.click(screen.getByRole("button", { name: "Passer cet outil" }));
    expect(screen.getByText("On garde votre place.")).toBeVisible();
    expect(screen.getByLabelText("Recorded values")).toHaveTextContent("[null]");
    fireEvent.click(screen.getByRole("button", { name: "Reprendre" }));
    expect(screen.getByRole("heading", { name: "Motion Array" })).toBeVisible();
  });

  it("reviews one tool at a time and preserves other answers", () => {
    render(<Harness initial={[1, 5]} />);
    fireEvent.click(screen.getByRole("button", { name: "Revoir mes usages" }));
    expect(screen.getByRole("radio", { name: "Usage faible" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("radio", { name: "Usage soutenu" }));
    expect(screen.getByLabelText("Recorded values")).toHaveTextContent("[4,5]");
    fireEvent.click(screen.getByRole("button", { name: "Résumé" }));
    expect(screen.getByText("Casting au complet.")).toBeVisible();
  });

  it("keeps history in its own scene and handles no paid tools", () => {
    render(<Harness initial={[]} history />);
    expect(screen.getByText("Personne à faire auditionner.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Revoir mes choix" }));
    expect(screen.getByRole("region", { name: "Historique des choix" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Revoir cette paire" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Résumé" }));
    expect(screen.queryByRole("button", { name: "Revoir cette paire" })).toBeNull();
  });

  it("does not keep answering a tool removed during the question", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Remove first tool" }));
    expect(screen.getByRole("heading", { name: "Grammarly" })).toBeVisible();
    fireEvent.click(screen.getByRole("radio", { name: "Usage régulier" }));
    expect(screen.getByLabelText("Recorded values")).toHaveTextContent("[null,3]");
  });

  it("starts the first question when paid tools finish loading", () => {
    const props = { lang: "fr" as const, format: (n: number) => `${n} €`, complete: false, onReviewTools: vi.fn() };
    const view = render(<StackUsageReview {...props} rows={[]} />);
    view.rerender(<StackUsageReview {...props} rows={[{
      tool: { id: "loaded", slug: "motion-array", name: "Motion Array" } as FitRow["tool"], cost: 25, detailHref: "/", setUsage: vi.fn(),
    } as FitRow]} />);
    expect(screen.getByRole("radio", { name: "Usage faible" })).toBeVisible();
  });
});
