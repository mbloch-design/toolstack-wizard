// @vitest-environment jsdom
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("heading", { name: "Vos usages" })).toBeVisible();
    const low = screen.getByRole("radio", { name: "Peu — Usage faible" });
    fireEvent.click(low);
    expect(low).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("heading", { name: "Motion Array" })).toBeVisible();
    expect(screen.getByLabelText("Recorded values")).toHaveTextContent("[1,null]");
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(screen.getByRole("heading", { name: "Grammarly" })).toBeVisible();
    fireEvent.click(screen.getByRole("radio", { name: "À fond — Usage intensif" }));
    fireEvent.click(screen.getByRole("button", { name: "Terminer" }));
    expect(screen.getByRole("heading", { name: "Casting au complet." })).toHaveFocus();
  });

  it("previews humour without saving and supports radio arrow keys", () => {
    render(<Harness initial={[undefined]} />);
    const low = screen.getByRole("radio", { name: "Peu — Usage faible" });
    fireEvent.pointerEnter(low);
    expect(screen.getByText(/Il fait surtout de la figuration/ )).toBeVisible();
    expect(screen.getByLabelText("Recorded values")).toHaveTextContent("[null]");
    fireEvent.keyDown(low, { key: "End" });
    expect(screen.getByRole("radio", { name: "À fond — Usage intensif" })).toHaveAttribute("aria-checked", "true");
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
    expect(screen.getByRole("radio", { name: "Peu — Usage faible" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("radio", { name: "Souvent — Usage soutenu" }));
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
    fireEvent.click(screen.getByRole("radio", { name: "Régulier — Usage régulier" }));
    expect(screen.getByLabelText("Recorded values")).toHaveTextContent("[null,3]");
  });

  it("starts the first question when paid tools finish loading", () => {
    const props = { lang: "fr" as const, format: (n: number) => `${n} €`, complete: false, onReviewTools: vi.fn() };
    const view = render(<StackUsageReview {...props} rows={[]} />);
    view.rerender(<StackUsageReview {...props} rows={[{
      tool: { id: "loaded", slug: "motion-array", name: "Motion Array" } as FitRow["tool"], cost: 25, detailHref: "/", setUsage: vi.fn(),
    } as FitRow]} />);
    expect(screen.getByRole("radio", { name: "Peu — Usage faible" })).toBeVisible();
  });
});

const reviewProps = { lang: 'fr' as const, format: (n: number) => `${n} €`, complete: false, onReviewTools: vi.fn() };
const row = (id: string, usage?: number): FitRow => ({ tool: { id, slug: id, name: id } as FitRow['tool'], cost: 20, usage, setUsage: vi.fn(), detailHref: '/' });

it('clears an old preview and retains keyboard context when the active tool disappears', () => {
  const a = row('Tool A'), b = row('Tool B');
  const view = render(<StackUsageReview {...reviewProps} rows={[a, b]} />);
  act(() => screen.getByRole('radio', { name: 'À fond — Usage intensif' }).focus());
  expect(screen.getByText(/Il connaît vos raccourcis/)).toBeVisible();
  view.rerender(<StackUsageReview {...reviewProps} rows={[b]} />);
  expect(screen.queryByText(/Il connaît vos raccourcis/)).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Tool B' })).toHaveFocus();
  expect(a.setUsage).not.toHaveBeenCalled();
});

it.each(['fr', 'en'] as const)('keeps every visible choice label in its spoken accessible name (%s)', lang => {
  render(<StackUsageReview {...reviewProps} lang={lang} rows={[row('Tool A')]} />);
  for (const radio of screen.getAllByRole('radio')) {
    expect(radio.getAttribute('aria-label')!.toLocaleLowerCase()).toContain(radio.textContent!.trim().toLocaleLowerCase());
  }
});

it('skips several tools, pauses, resumes the first missing answer and preserves previous answers', () => {
  render(<Harness initial={[undefined, undefined, undefined]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Passer cet outil' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Régulier — Usage régulier' }));
  fireEvent.click(screen.getByRole('button', { name: 'Plus tard' }));
  expect(screen.getByText('1 sur 3 usages renseignés. La suite quand vous voulez.')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Reprendre' }));
  expect(screen.getByRole('heading', { name: 'Motion Array' })).toHaveFocus();
  fireEvent.click(screen.getByRole('radio', { name: 'Peu — Usage faible' }));
  fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
  fireEvent.click(screen.getByRole('button', { name: 'Outil précédent' }));
  expect(screen.getByRole('radio', { name: 'Régulier — Usage régulier' })).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByLabelText('Recorded values')).toHaveTextContent('[1,3,null]');
});

it('keeps the current identity when prices reorder, and exposes a newly added pending tool from summary', () => {
  const a = row('Tool A'), b = row('Tool B', 4);
  const view = render(<StackUsageReview {...reviewProps} rows={[a, b]} />);
  view.rerender(<StackUsageReview {...reviewProps} rows={[b, a]} />);
  expect(screen.getByRole('heading', { name: 'Tool A' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Passer cet outil' }));
  view.rerender(<StackUsageReview {...reviewProps} rows={[b, row('New tool')]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Reprendre' }));
  expect(screen.getByRole('heading', { name: 'New tool' })).toHaveFocus();
});

it.each([
  ['ArrowLeft',0,4],['ArrowRight',4,0],['ArrowUp',0,4],['ArrowDown',4,0],['Home',3,0],['End',0,4],
] as const)('supports %s with exactly one tabstop and keeps the selected radio focused', (key, from, to) => {
  render(<Harness initial={[1]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Revoir mes usages' }));
  const radios=screen.getAllByRole('radio');
  fireEvent.click(radios[from]);fireEvent.keyDown(radios[from], { key });
  expect(radios[to]).toHaveAttribute('aria-checked','true');expect(radios[to]).toHaveFocus();
  expect(radios.filter(r=>r.tabIndex===0)).toEqual([radios[to]]);
  expect(screen.getByLabelText('Recorded values')).toHaveTextContent(`[${to+1}]`);
});

it('finishes a sequence honestly when an earlier tool was skipped', () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Passer cet outil' }));
  fireEvent.click(screen.getByRole('radio', { name: 'À fond — Usage intensif' }));
  fireEvent.click(screen.getByRole('button', { name: 'Terminer' }));
  expect(screen.getByRole('heading', { name: 'On garde votre place.' })).toHaveFocus();
  expect(screen.getByLabelText('Recorded values')).toHaveTextContent('[null,5]');
  fireEvent.click(screen.getByRole('button', { name: 'Reprendre' }));
  expect(screen.getByRole('heading', { name: 'Motion Array' })).toHaveFocus();
});

it('does not steal focus from another surface when a tool disappears', () => {
  const a=row('Tool A'),b=row('Tool B');
  const props=reviewProps;
  const content=(rows:FitRow[]) => <><button>Outside action</button><StackUsageReview {...props} rows={rows}/></>;
  const view=render(content([a,b]));
  act(()=>screen.getAllByRole('radio')[0].focus());
  act(()=>screen.getByRole('button',{name:'Outside action'}).focus());
  view.rerender(content([b]));
  expect(screen.getByRole('button',{name:'Outside action'})).toHaveFocus();
});

it('handles the last paid row becoming free while the keyboard is inside the question', () => {
  const view=render(<StackUsageReview {...reviewProps} rows={[row('Paid tool')]} />);
  act(()=>screen.getAllByRole('radio')[0].focus());
  view.rerender(<StackUsageReview {...reviewProps} rows={[]} freeOnly complete />);
  expect(screen.getByRole('heading',{name:'Votre stack, sans abonnement payant.'})).toHaveFocus();
  fireEvent.click(screen.getByRole('button',{name:'Voir mes outils'}));
  expect(reviewProps.onReviewTools).toHaveBeenCalled();
});

it.each([1,2,3,4,5])('records level %i without advancing or overwriting another tool', value => {
  render(<Harness initial={[undefined,4]} />);
  fireEvent.click(screen.getAllByRole('radio')[value-1]);
  expect(screen.getByLabelText('Recorded values')).toHaveTextContent(`[${value},4]`);
  expect(screen.getByRole('heading',{name:'Motion Array'})).toBeVisible();
});

it('labels the current tool position independently of recorded answers while reviewing', () => {
  render(<Harness initial={[1,5]} />);
  fireEvent.click(screen.getByRole('button',{name:'Revoir mes usages'}));
  expect(screen.getByLabelText('Outil 1 sur 2')).toHaveTextContent('1 sur 2');
  expect(screen.getByRole('button',{name:'Outil précédent'})).toBeDisabled();
  fireEvent.click(screen.getByRole('button',{name:'Suivant'}));
  expect(screen.getByLabelText('Outil 2 sur 2')).toHaveTextContent('2 sur 2');
  expect(screen.getByRole('button',{name:'Terminer'})).toBeEnabled();
});

it('allows pausing before an answer and retains a stable previous navigation slot', () => {
  render(<Harness />);
  expect(screen.getByRole('button',{name:'Outil précédent'})).toBeDisabled();
  fireEvent.click(screen.getByRole('button',{name:'Plus tard'}));
  expect(screen.getByText('0 sur 2 usages renseignés. La suite quand vous voulez.')).toBeVisible();
  expect(screen.getByLabelText('Recorded values')).toHaveTextContent('[null,null]');
  fireEvent.click(screen.getByRole('button',{name:'Reprendre'}));
  expect(screen.getByRole('heading',{name:'Motion Array'})).toBeVisible();
});

it('does not label a replacement tool saved answer as a preview from the removed tool', () => {
  const a=row('Tool A'), b=row('Tool B',1);
  const view=render(<StackUsageReview {...reviewProps} rows={[a,b]} />);
  fireEvent.pointerEnter(screen.getByRole('radio',{name:'À fond — Usage intensif'}));
  view.rerender(<StackUsageReview {...reviewProps} rows={[b]} />);
  expect(screen.getByText(/Il fait surtout de la figuration/)).toBeVisible();
  expect(screen.queryByText(/Et là/)).not.toBeInTheDocument();
});

it('offers a real per-tool summary with direct correction and missing answers', () => {
  render(<Harness initial={[1,undefined]} />);
  fireEvent.click(screen.getByRole('button',{name:'Plus tard'}));
  expect(screen.getByRole('button',{name:'Modifier l’usage de Motion Array : Peu'})).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'Renseigner l’usage de Grammarly'}));
  expect(screen.getByRole('heading',{name:'Grammarly'})).toHaveFocus();
  fireEvent.click(screen.getByRole('radio',{name:'Souvent — Usage soutenu'}));
  fireEvent.click(screen.getByRole('button',{name:'Résumé'}));
  expect(screen.getByRole('button',{name:'Modifier l’usage de Grammarly : Souvent'})).toBeVisible();
  expect(screen.getByLabelText('Recorded values')).toHaveTextContent('[1,4]');
});

it('advances on its own after a pointer answer, but not after a keyboard choice', () => {
  vi.useFakeTimers();
  render(<Harness />);
  fireEvent.click(screen.getByRole('radio', { name: 'Peu — Usage faible' }), { detail: 1 });
  expect(screen.getByRole('heading', { name: 'Motion Array' })).toBeVisible();
  act(() => { vi.advanceTimersByTime(700); });
  expect(screen.getByRole('heading', { name: 'Grammarly' })).toBeVisible();
  fireEvent.click(screen.getByRole('radio', { name: 'Souvent — Usage soutenu' }));
  act(() => { vi.advanceTimersByTime(1000); });
  expect(screen.getByRole('heading', { name: 'Grammarly' })).toBeVisible();
  expect(screen.getByLabelText('Recorded values')).toHaveTextContent('[1,4]');
  vi.useRealTimers();
});
