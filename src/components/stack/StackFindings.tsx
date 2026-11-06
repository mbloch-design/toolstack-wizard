import StackInvoiceEntry from "./StackInvoiceEntry";
import { CURRENCY_RATE_DATE, type Currency } from "@/lib/currencyRates";
import StackUsagePlay from "./StackUsagePlay";
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Rocket, UserRound, Moon, Zap, Check, ClipboardCheck, Flame, Plus, Scale, TrendingUp, GitCompare, Layers3, ListChecks, RefreshCw, Sparkles, Tag, TrendingDown, Wallet } from "@/lib/icons";
import ToolLogo from "@/components/ToolLogo";
import Budget, { type BudgetTool } from "@/ds/Budget/Budget";
import Split from "@/ds/Split/Split";
import { Link } from "@/lib/routerLinks";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { getPersonalStackScope, getPersonalStackScopeEpoch } from "@/lib/personalStackStore";
import toolAccents from "@/data/toolAccents.json";
import { toolKey } from "@/lib/stackView";
import { AppIcon, Button, Duo, Figure, TextLink } from "./StackKit";

export type FindingAction = { label: string; onClick: () => void; primary?: boolean; ariaLabel?: string };
export type Finding = {
  key: string;
  kind: "freemium" | "pair" | "price";
  tools: ToolSummary[];
  title: string;
  detail: string;
  actions: FindingAction[];
  /** Leave a historical review without making a new decision. */
  cancelReview?: FindingAction;
  /** A way to look before answering (compare two tools). */
  link?: { label: string; to: string; onClick?: () => void };
  /** Answers every finding of the same kind at once. */
  bulk?: FindingAction;
  /** Monthly cost of each tool of a pair, for the comparison bars. */
  costs?: [number, number];
  /** What is at stake each month (the cheaper paid tool of a pair). */
  stake?: number;
  /** For a plan or price question: the plans to pick from, one tap each. */
  plans?: { key: string; label: string; monthly: number; note?: string; perSeat?: boolean; pick: (seats?: number) => void }[];
  /** For a missing price: saves what the person pays a month, right from the card. */
  savePrice?: (amount: number, invoiceCurrency: Currency) => void;
  /** For a plan question: the two answers and what each costs a month. */
  options?: { label: string; amount: number }[];
};
type Resolved = { key: string; a: ToolSummary; b: ToolSummary; kind: "keep-both" | "keep-one"; kept?: string; removed?: string };
interface Props {
  currency?: Currency;
  converted?: boolean;
  lang: "fr" | "en";
  /** Known monthly total, and how to write an amount ("446 €"). */
  total: number;
  format: (amount: number) => string;
  /** Paid tools with their monthly cost, costliest first. */
  spend: { tool: ToolSummary; amount: number }[];
  /** Known monthly cost by vertical (area), every area of the stack. */
  areas: { id: string; label: string; amount: number; color: string; tools?: { tool: ToolSummary; amount: number }[] }[];
  toolCount: number;
  freeTools?: ToolSummary[];
  /** What is left to decide, in order. */
  items: Finding[];
  reviewFindingKey?: string;
  /** Estimated monthly amount taken out by past decisions. */
  saved: number;
  /** Amount still at stake across the pairs. */
  toReview: number;
  resolved: Resolved[];
  /** Paid tools and their declared use; no suitability inference from catalogue scores. */
  fit: FitRow[];
  /** Pairs kept on purpose, with a way to review them again. */
  history?: ReactNode;
  onAddTool: () => void;
  onReviewTools: () => void;
  exploreHref?: string;
  /** The first visit after the onboarding: the decision card keeps guiding. */
  guide?: boolean;
  /** The person's hour, from their day rate, in the display currency: prices become time. */
  hourly?: number | null;
}

export type FitRow = { tool: ToolSummary; cost: number; usage?: number; setUsage: (value: number | null) => void; detailHref: string };

type AreaShare = Props["areas"][number];
/** One alternative: mine → theirs, the monthly gap, and the way to compare. */
function TextLinkRow({ to, row, format, t }: { to: string; row: { tool: ToolSummary; alt: ToolSummary; mine: number; theirs: number }; format: (n: number) => string; t: (a: string, b: string) => string }) {
  return <Link className="mf-cheaper-row" to={to}>
    <span className="mf-cheaper-text"><span>{t(`Passez à ${row.alt.name}`, `Switch to ${row.alt.name}`)}</span><small>{t(`À la place de ${row.tool.name}, `, `Instead of ${row.tool.name}, `)}<em>{t(`${format(row.mine - row.theirs)} de moins`, `${format(row.mine - row.theirs)} less`)}</em>{t(" par mois.", " a month.")}</small></span>
  </Link>;
}

/** A tool's brand colour from the catalogue, or the ToolTrim neutral. */
const accentOf = (tool?: ToolSummary) => (tool && (toolAccents as Record<string, string | null>)[toolKey(tool)]) || "var(--color-stack-accent-fallback)";

const icon = (Icon: typeof Wallet, color?: string) => <Icon size={14} strokeWidth={1.8} aria-hidden style={color ? { color } : undefined} />;

// Ma stack in one screen, read in order (22/10/2026): first what the stack
// costs, then the one thing to decide now, then, quietly, what comes next.
// Settling the current finding brings the next one in; once nothing is left,
// the space becomes the summary of what was decided and what it saved.
export default function StackFindings({ lang, currency = "EUR", converted = false, total, format, spend, areas, toolCount, freeTools = [], fit, items, reviewFindingKey, saved, toReview, resolved, history, onAddTool, onReviewTools, exploreHref, guide, hourly }: Props) {
  const fr = lang === "fr";
  const t = (a: string, b: string) => (fr ? a : b);
  const rateDate = new Date(`${CURRENCY_RATE_DATE}T00:00:00Z`).toLocaleDateString(fr ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).replace(/ /g, "\u00a0");
  const s = (n: number) => (n > 1 ? "s" : "");
  const [later, setLater] = useState<string[]>([]);
  // On a phone each card is a summary line; one opens at a time.
  // No accordion: in one column every card stays open, in reading order (the decision is the page’s action).
  // The face just picked: it lights up, the other swipes away, the saving
  // rises, then the answer goes through. Instant with reduced motion.
  const [picked, setPicked] = useState<number | null>(null);
  // The decision card lights up when another card sends a question to it.
  const [flash, setFlash] = useState(0);
  // What the answer does to the total, shown before the person commits.
  const [preview, setPreview] = useState<number | null>(null);
  // A per-user plan asks how many people, with a stepper: never a free field.
  const [seatPlan, setSeatPlan] = useState<string | null>(null);
  const [seats, setSeats] = useState(1);
  // At the floor the stepper answers with a smile instead of going dead (système ToolTrim).
  const [seatNudge, setSeatNudge] = useState(false);
  // A tapped plan lights up, the others step back, then the answer goes through.
  const [pickedTile, setPickedTile] = useState<string | null>(null);
  const answerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scope = getPersonalStackScope();
  const scopeEpoch = getPersonalStackScopeEpoch(scope);
  useEffect(() => () => { if (answerTimer.current !== null) clearTimeout(answerTimer.current); }, []);
  const scheduleAnswer = (run: () => void, delay: number) => {
    if (answerTimer.current !== null) clearTimeout(answerTimer.current);
    const owner = getPersonalStackScope(), epoch = getPersonalStackScopeEpoch(owner);
    answerTimer.current = setTimeout(() => {
      answerTimer.current = null;
      setPickedTile(null); setPicked(null);
      if (getPersonalStackScope() === owner && getPersonalStackScopeEpoch(owner) === epoch) run();
    }, delay);
  };
  const pickTile = (key: string, run: () => void) => {
    if (pickedTile) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) { run(); return; }
    setPickedTile(key);
    scheduleAnswer(run, 620);
  };
  const pick = (index: number, run?: () => void) => {
    if (picked !== null || answerTimer.current !== null || !run) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) { run(); return; }
    setPicked(index);
    scheduleAnswer(run, 180);
  };
  // Progress across the session: the most findings seen at once is the whole run.
  const [peak, setPeak] = useState(items.length);
  useEffect(() => { if (items.length > peak) setPeak(items.length); }, [items.length, peak]);
  // A question picked from the reliability card comes to the top of the deck.
  const [first, setFirst] = useState<string | null>(reviewFindingKey ?? null);
  const [appliedReview, setAppliedReview] = useState(reviewFindingKey);
  const effectiveFirst = reviewFindingKey && reviewFindingKey !== appliedReview ? reviewFindingKey : first;
  useEffect(() => {
    if (reviewFindingKey === appliedReview) return;
    setAppliedReview(reviewFindingKey); setFirst(reviewFindingKey ?? null);
    if (reviewFindingKey) setLater(keys => keys.filter(key => key !== reviewFindingKey));
  }, [reviewFindingKey, appliedReview]);
  const queued = [...items.filter((item) => !later.includes(item.key)), ...later.flatMap((key) => items.filter((item) => item.key === key))];
  const order = [...queued.filter((item) => item.key === effectiveFirst), ...queued.filter((item) => item.key !== effectiveFirst)];
  const previewInvoice = useCallback((amount: number | null) => setPreview(amount === null ? null : total + amount), [total]);
  const top = order[0];
  useEffect(() => {
    if (answerTimer.current !== null) { clearTimeout(answerTimer.current); answerTimer.current = null; }
    setPickedTile(null); setPicked(null); setPreview(null); setSeatPlan(null); setSeats(1);
  }, [top?.key, scope, scopeEpoch]);
  const rest = order.slice(1);
  const step = Math.max(1, peak - items.length + 1);

  // What comes next, grouped by kind; two groups at most.
  const groups = (["pair", "freemium", "price"] as const).flatMap((kind) => {
    const list = rest.filter((item) => item.kind === kind);
    if (!list.length) return [];
    const n = list.length, stake = list.reduce((sum, item) => sum + (item.stake || 0), 0);
    const tools = [...new Map(list.flatMap((item) => item.tools).map((tool) => [tool.id, tool])).values()].slice(0, 2);
    return [kind === "pair" ? { kind, tools, title: t(`${n} autre${s(n)} doublon${s(n)}`, `${n} more duplicate${s(n)}`), text: stake > 0 ? t(`${format(stake)} par mois en jeu.`, `${format(stake)} a month at stake.`) : t("À trancher ensuite.", "To settle next.") }
      : kind === "freemium" ? { kind, tools, title: t(`${n} abonnement${s(n)} à confirmer`, `${n} plan${s(n)} to confirm`), text: t("Payant ou gratuit ? Une question chacun.", "Paid or free? One question each.") }
      : { kind, tools, title: t(`${n} prix à compléter`, `${n} price${s(n)} to add`), text: n > 1 ? t("Pour un budget au centime près.", "For a budget down to the cent.") : t("Le dernier, courage.", "The last one, hang in there.") }];
  }).slice(0, 2);

  // The Budget card: every tool once, the most expensive first, then those whose price is not known yet, then the free ones.
  const unsure = items.filter((item) => item.kind === "price" || item.kind === "freemium");
  const pending = [...new Map(unsure.flatMap((item) => item.tools).map((tool) => [tool.id, tool])).values()];
  const budgetTools: BudgetTool[] = [
    ...spend.map((line) => ({ ...line.tool, paid: true })),
    ...pending.filter((tool) => !spend.some((line) => line.tool.id === tool.id)).map((tool) => ({ ...tool, paid: null })),
    ...freeTools.map((tool) => ({ ...tool, paid: false })),
  ];
  return <section className="mf" aria-label={t("Ma stack en bref", "My stack at a glance")}>
    <div className="tt-board" data-starter={toolCount === 1 ? "" : undefined} data-sparse={top && total === 0 && fit.length === 0 ? "" : undefined} data-compact={!top && toolCount > 1 && total === 0 && fit.length === 0 ? "" : undefined} data-next={groups.length} data-done={top ? undefined : ""}>
      {/* Organisme « tableau » du système (planche, gabarit Ma stack), un bento lu constat, action, détail : budget et décision, puis vos usages et la répartition. L'ordre du DOM est l'ordre de lecture, sur mobile aussi. */}
      {/* 1. Read first: what the stack costs, and the verdict under it. */}
      {/* Organisme « budget » du système (planche, chapitre 06 et gabarit Ma stack). */}
      {/* The macro view, a design system component (src/ds/Budget, validated 06/11/2026). The slot only places it in the board.
          Invoice cents stay visible; only a converted total is rounded (no false precision after a rate). */}
      <div className="tt-slot" data-card="price">
        <Budget lang={fr ? "fr" : "en"} tools={budgetTools} monthly={total > 0 ? format(converted ? Math.round(total) : total) : null} yearly={total > 0 ? format(converted ? Math.round(total * 12) : total * 12) : null}
          saved={saved > 0 ? format(Math.round(saved)) : null}
          lead={spend.length > 0 && total > 0 ? { name: spend[0].tool.name, share: Math.round((spend[0].amount / total) * 100) } : null}
          unsure={{ prices: unsure.filter((item) => item.kind === "price").length, plans: unsure.filter((item) => item.kind === "freemium").length }}
          rateDate={converted ? rateDate : null}
          onConfirmNext={() => { if (!unsure[0]) return; setFirst(unsure[0].key); setLater((keys) => keys.filter((key) => key !== unsure[0].key)); setFlash(Date.now()); }}
          onStart={() => { const next = unsure[0]; if (!next) return; setFirst(next.key); setLater((keys) => keys.filter((key) => key !== next.key)); requestAnimationFrame(() => document.getElementById("mf-now-title")?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })); }} />
      </div>
      {/* 2. The one thing to do now, or the summary once everything is settled. */}
      {top ? <section key={`${top.key}-${flash}`} data-step={seatPlan ? "seats" : undefined} className="mf-card mf-now tt-decision" data-flash={flash ? "" : undefined} data-open="" aria-labelledby="mf-now-title" data-kind={top.kind}
        style={{ ["--a1" as string]: accentOf(top.tools[0]), ["--a2" as string]: accentOf(top.tools[1] || top.tools[0]) }}>
        {/* The image of the decision: its tools, large, on a halo of their brand colours. */}
        {top.kind !== "pair" && <div className="mf-stage" aria-hidden="true">{top.tools.length > 1 ? <Duo a={top.tools[0]} b={top.tools[1]} large /> : <AppIcon tool={top.tools[0]} large />}</div>}
        <h2 id="mf-now-title" tabIndex={-1} className="sr-only">{t("Prochaine décision", "Next decision")}</h2>
        {/* Organisme « carte de décision » du système : surtitre, étapes en traits fins. */}
        <p className="mf-k tt-decision-head"><span className="tt-eyebrow">{guide && (top.kind === "price" || top.kind === "freemium") ? t("Étape suivante", "Next step") : t("Votre décision", "Your decision")}</span>
          {peak > 1 && <span className="mf-step tt-steps" aria-label={t(`Étape ${step} sur ${peak}`, `Step ${step} of ${peak}`)}>{peak <= 8 && <span className="tt-steps-track" aria-hidden="true">{Array.from({ length: peak }, (_, index) => <i key={index} data-on={index < step ? "" : undefined} />)}</span>}{t(`${step} sur ${peak}`, `${step} of ${peak}`)}</span>}</p>
        {/* The tool in question, on stage: its logo bounces in beside the question. */}
        <div className="mf-now-q">{top.kind !== "pair" && <span className="mf-now-logo" aria-hidden="true"><ToolLogo tool={top.tools[0]} size={36} /></span>}<h3 className="tt-decision-title">{top.kind === "price" && !(top.plans && top.plans.length) ? t(`Combien vous coûte ${top.tools[0].name} par mois\u00a0?`, `How much does ${top.tools[0].name} cost you a month?`) : top.title}</h3></div>
        <p className="mf-t tt-decision-detail">{guide && (top.kind === "price" || top.kind === "freemium") ? t("Pour un budget juste, dites-nous laquelle vous payez. Gratuite, ça compte aussi.", "For an honest budget, tell us which one you pay. Free counts too.") : top.detail}</p>
        {/* A duplicate: three verdict cards (système ToolTrim, molécule « carte de
            verdict »). Keep one, keep the other, or keep both; each says what
            it does to the budget. The chosen card rings blue, the others fade. */}
        {top.kind === "pair" && (() => {
          const both = top.actions.find((action) => !top.tools.some((candidate) => action.label.endsWith(candidate.name)));
          const sum = (top.costs?.[0] ?? 0) + (top.costs?.[1] ?? 0);
          const state = (index: number) => picked === null ? undefined : picked === index ? "kept" : "gone";
          const check = <span className="tt-choice-check tt-check" aria-hidden="true"><Check strokeWidth={3} /></span>;
          return <div className="mf-duel mf-choice-group tt-choices" data-picked={picked !== null ? picked : undefined}>
            {top.tools.slice(0, 2).map((tool, index) => {
              const keep = top.actions.find((action) => action.label.endsWith(tool.name));
              const own = top.costs?.[index] ?? 0, other = top.costs?.[1 - index] ?? 0;
              const gone = top.tools[1 - index];
              return <button key={tool.id} type="button" className="mf-choice--keep tt-choice" disabled={picked !== null} onClick={() => pick(index, keep?.onClick)} aria-label={keep?.ariaLabel || keep?.label}
                onPointerEnter={() => setPreview(total - other)} onPointerLeave={() => setPreview(null)} onFocus={() => setPreview(total - other)} onBlur={() => setPreview(null)}
                data-state={state(index)} data-best={own < other ? "" : undefined}>
                <span className="tt-choice-logo"><ToolLogo tool={tool} size={40} />{picked === index && check}</span>
                <span className="tt-choice-text">
                  <span className="tt-choice-name"><span>{t("Garder", "Keep")} <span className="mf-face-name">{tool.name}</span></span>{own < other && <span className="tt-choice-tag">{t("Le moins cher", "Cheaper")}</span>}</span>
                  <span className="tt-choice-note">{gone ? t(`${gone.name} quitte la stack`, `${gone.name} leaves the stack`) : ""} · {own > 0 ? t(`seul, ${format(own)}/mois`, `alone, ${format(own)}/mo`) : t("seul, gratuit", "alone, free")}</span>
                </span>
                <span className="tt-choice-amount" data-gain={other > 0 ? "" : undefined}>{other > 0 ? <>−{format(other)}<small>{t("/mois", "/mo")}</small></> : t("Aucune économie", "No saving")}</span>
              </button>;
            })}
            {both && <button type="button" className="mf-choice--both tt-choice" onClick={() => pick(2, both.onClick)} disabled={picked !== null} data-state={state(2)} aria-label={both.label}
              onPointerEnter={() => setPreview(total)} onPointerLeave={() => setPreview(null)} onFocus={() => setPreview(total)} onBlur={() => setPreview(null)}>
              <span className="tt-choice-logos" aria-hidden="true">{top.tools.slice(0, 2).map((item) => <ToolLogo key={item.id} tool={item} size={28} />)}{picked === 2 && check}</span>
              <span className="tt-choice-text">
                <span className="tt-choice-name">{both.label}</span>
                <span className="tt-choice-note">{t(`Les deux restent · ${format(sum)}/mois`, `Both stay · ${format(sum)}/mo`)}</span>
              </span>
              <span className="tt-choice-amount">{t("Inchangé", "Unchanged")}</span>
            </button>}
          </div>;
        })()}
        {/* Pick your plan: one tap answers; another amount is the fallback. */}
        {(() => {
          // Every plan question reads the same way: tiles to tap. With no plan in
          // the catalogue, the two answers (free, paid) become the two tiles.
          const tiles = top.plans && top.plans.length > 0 ? top.plans
            : top.kind === "freemium" && top.options ? top.options.map((option) => {
              const action = top.actions.find((candidate) => (option.amount > 0) === !!candidate.primary);
              return { key: option.label, label: option.amount > 0 ? t("Payant", "Paid") : option.label, monthly: option.amount, note: option.amount > 0 ? t("prix de départ", "starting price") : undefined, perSeat: false, pick: () => action?.onClick() };
            }) : null;
          if (!tiles) return null;
          const chosen = tiles.find((plan) => plan.key === seatPlan);
          // Step 2 of a per-user plan: how many people. A stepper, then confirm.
          if (chosen) {
            const set = (n: number) => { const next = Math.min(500, Math.max(1, n)); setSeats(next); setPreview(total + chosen.monthly * next); };
            const shown = Math.min(seats, 12);
            return <div className="mf-seats">
              {/* The plan picked, kept in view: changing it is one tap. */}
              <p className="mf-seats-plan"><span><b>{chosen.label}</b> · {t("facturé par personne", "billed per person")}</span>
                <TextLink className="mk-link--quiet" onClick={() => { setSeatPlan(null); setPreview(null); }}>{t("Changer", "Change")}</TextLink></p>
              <p className="mf-seats-q">{t("Vous êtes combien à l’utiliser ?", "How many of you use it?")}</p>
              <div className="mf-seats-row">
                {/* The usual team sizes, one tap; the stepper fine-tunes. */}
                <div className="mf-seats-presets" role="group" aria-label={t("Tailles d’équipe", "Team sizes")}>
                  {[1, 2, 5, 10, 25].map((n) => <button key={n} type="button" aria-pressed={seats === n} onClick={() => set(n)}>{n}</button>)}
                </div>
                <div className={`mf-stepper${seatNudge ? " mf-stepper--nope" : ""}`} role="group" aria-label={t("Nombre de personnes", "Number of people")} onAnimationEnd={() => setSeatNudge(false)}>
                  <button type="button" onClick={() => { if (seats <= 1) { setSeatNudge(false); requestAnimationFrame(() => setSeatNudge(true)); return; } setSeatNudge(false); set(seats - 1); }} aria-disabled={seats <= 1} aria-label={t("Une personne de moins", "One fewer")}>−</button>
                  <output aria-live="polite">{seats}</output>
                  <button type="button" onClick={() => set(seats + 1)} aria-label={t("Une personne de plus", "One more")}>+</button>
                </div>
                <Button variant="primary" className="mf-seats-ok" onClick={() => chosen.pick(seats)}>{t("Valider", "Confirm")}</Button>
              </div>
              <p className="mf-seats-nudge" aria-live="polite">{seatNudge ? t("Il faut bien quelqu’un pour payer.", "Someone has to pay.") : ""}</p>
              {/* The team, drawn: one figure per person, each new one pops in. */}
              <div className="mf-seats-crew" aria-hidden="true">
                <span className="mf-seats-people">{Array.from({ length: shown }, (_, index) => <i key={index}><UserRound size={18} /></i>)}{seats > 12 && <em>+{seats - 12}</em>}</span>
                {/* The result only: a rounded unit price times seats would not add up. */}
                <span className="mf-seats-sum">{t(`${seats} personne${s(seats)}`, `${seats} ${seats > 1 ? "people" : "person"}`)} · <b>{format(chosen.monthly * seats)}</b>{t("/mois", "/mo")}</span>
              </div>
            </div>;
          }
          // One plan per row, as the duel's choices (validated molecule .tt-choice): icon, name and detail, price on the right.
          const max = Math.max(1, ...tiles.map((x) => x.monthly));
          const workTime = (monthly: number) => { if (!hourly) return null; if (monthly === 0) return t("0 min de votre travail", "0 min of your work"); const minutes = Math.max(1, Math.round((monthly / hourly) * 60)); return minutes < 60 ? t(`≈ ${minutes} min de votre travail`, `≈ ${minutes} min of your work`) : t(`≈ ${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} de votre travail`, `≈ ${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} of your work`); };
          return <div className="tt-choices" role="radiogroup" aria-label={t("Votre formule", "Your plan")}>
            {tiles.map((plan) => { const [, main, qualifier] = /^(.*?)\s*\((.+)\)\s*$/.exec(plan.label) ?? [null, plan.label, null];
              const Icon = plan.monthly === 0 ? Moon : plan.monthly >= max ? Rocket : Zap;
              const detail = [qualifier, plan.monthly === 0 ? t("Rien à payer", "Nothing to pay") : plan.note || t("par mois", "a month"), workTime(plan.monthly)].filter(Boolean).join(" · ");
              return <button key={plan.key} type="button" role="radio" aria-checked={pickedTile === plan.key} className="tt-choice" data-plan={plan.key}
                data-state={pickedTile === null ? undefined : pickedTile === plan.key ? "kept" : "gone"}
                onPointerEnter={() => setPreview(total + plan.monthly)} onPointerLeave={() => setPreview(null)} onFocus={() => setPreview(total + plan.monthly)} onBlur={() => setPreview(null)}
                onClick={() => { if (plan.perSeat) { setSeatPlan(plan.key); setSeats(1); setPreview(total + plan.monthly); } else pickTile(plan.key, () => plan.pick()); }}>
                <span className="tt-choice-logo"><span className="tt-logo-tile"><Icon size={18} aria-hidden /></span>{pickedTile === plan.key && <span className="tt-choice-check tt-check" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>}</span>
                <span className="tt-choice-text"><span className="tt-choice-name">{main}</span><span className="tt-choice-note">{detail}</span></span>
                <span className="tt-choice-amount">{plan.monthly > 0 ? <>{format(plan.monthly)}<small>{t("/mois", "/mo")}</small></> : t("Gratuit", "Free")}</span>
              </button>; })}
          </div>;
        })()}
        {/* No plan in the catalogue: the only case with an amount to type. */}
        {top.savePrice && (!top.plans || top.plans.length === 0) && <StackInvoiceEntry key={`${scope}:${scopeEpoch}:${top.key}`} currency={currency} lang={lang} onSave={top.savePrice} onPreview={previewInvoice} />}
        {/* One bar, always at the bottom: ways to look or defer on the left, the answers on the right. */}
        <div className="mf-bar-actions tt-decision-foot">
          <div className="mf-links">
            {top.link && <TextLink to={top.link.to} onClick={top.link.onClick}>{top.link.label}</TextLink>}
            {top.cancelReview && <TextLink className="mf-review-cancel" onClick={top.cancelReview.onClick}>{top.cancelReview.label}</TextLink>}
            {top.bulk && <TextLink onClick={top.bulk.onClick}>{top.bulk.label}</TextLink>}
            {order.length > 1 && <TextLink className="mk-link--quiet" onClick={() => { setFirst(null); setLater((keys) => [...keys.filter((key) => key !== top.key), top.key]); }}>{t("Plus tard", "Later")}</TextLink>}
          </div>
          {(top.savePrice || (top.plans && top.plans.length > 0)) && top.kind === "price" && top.actions.map((action) => <TextLink className="mf-invoice-details" key={action.label} onClick={action.onClick}>{t("Devise, utilisateurs ou facture annuelle", "Currency, users or yearly billing")}</TextLink>)}
          {/* The effect on the total, on the bar's right: today's figure, then where an answer takes it. */}
          {(top.plans?.length || top.kind === "pair" || top.savePrice || (top.kind === "freemium" && top.options)) && <p className="mf-preview tt-decision-preview" aria-live="polite">
            <span className="mf-preview-k tt-note">{items.some(item => item.kind === "price" || item.kind === "freemium") ? t("Budget partiel", "Partial budget") : t("Budget estimé", "Estimated budget")}</span>
            <b className="mf-preview-next tt-amount" data-on={preview !== null ? "" : undefined}>{preview === null && total === 0 && items.some(item => item.kind === "price" || item.kind === "freemium") ? t("À renseigner", "Not set yet") : <>{format(preview ?? total)}<small className="mf-preview-unit">{t("/mois", "/mo")}</small></>}
              {/* The difference pops over the amount like a notification bubble: overlaid, it moves nothing. */}
              {preview !== null && preview !== total && <span key={preview} className="mf-preview-delta" data-dir={preview < total ? "down" : "up"}>
                {preview < total ? <TrendingDown size={12} aria-hidden /> : <TrendingUp size={12} aria-hidden />}{preview > total ? "+" : "−"}{format(Math.abs(preview - total))}</span>}</b>
          </p>}
          <div className="mf-answers">{top.actions.filter(() => !top.savePrice && !(top.plans && top.plans.length) && !(top.kind === "freemium" && top.options)).filter(() => top.kind !== "pair").map((action) => {
            const logo = top.kind === "pair" ? top.tools.find((tool) => action.label.endsWith(tool.name)) : undefined;
            return <Button key={action.label} variant={action.primary ? "primary" : "secondary"} aria-label={action.ariaLabel} onClick={action.onClick}
              icon={logo ? <ToolLogo tool={logo} size={18} /> : undefined}>{action.label}</Button>;
          })}</div>
        </div>
        {toolCount <= 1 && history && <div className="mf-history">{history}</div>}
      </section> : toolCount > 1 ? <section className="tt-decision" data-done="" aria-labelledby="tt-decision-done">
        {/* Nothing left to decide: the card rests instead of vanishing. Proposal of 04/11, made of validated pieces. */}
        <p className="tt-decision-head"><span className="tt-eyebrow">{t("Votre décision", "Your decision")}</span></p>
        <p className="tt-decision-title" id="tt-decision-done"><span className="tt-check tt-check--live" aria-hidden="true">{icon(Check)}</span> {t("Rien à trancher.", "Nothing to decide.")}</p>
        <p className="tt-decision-detail">{t("Chaque outil a trouvé sa place. Profitez-en, ça ne dure jamais très longtemps.", "Every tool has found its place. Enjoy it, it never lasts long.")}</p>
        {history && <div className="tt-decision-history">{history}</div>}
        <div className="tt-decision-foot"><button type="button" className="tt-link" onClick={onAddTool}>{t("Ajouter un outil", "Add a tool")}</button></div>
      </section> : null}
      {toolCount === 1 && !top && <article className="tt-starter">
        {/* The one tool, and two free seats waiting next to it. */}
        <span className="tt-seats" aria-hidden="true">{(spend[0]?.tool || freeTools[0]) ? <span className="tt-seat" data-on=""><ToolLogo tool={(spend[0]?.tool || freeTools[0])!} size={30} /></span> : null}<span className="tt-seat"><Plus /></span><span className="tt-seat"><Plus /></span></span>
        <h2 className="tt-title-m">{t("Votre stack prend forme.", "Your stack is taking shape.")}</h2>
        <p className="tt-text">{t("Un outil, c’est un début. Ajoutez les autres : dès deux, on repère ce qui se recoupe et ce que ça coûte.", "One tool is a start. Add the others: from two on, we spot what overlaps and what it costs.")}</p>
        <button type="button" className="tt-btn" onClick={onAddTool}><Plus aria-hidden />{t("Ajouter un autre outil", "Add another tool")}</button>
      </article>}
      {toolCount > 1 && (fit.length > 0 || !top || history) && <StackUsagePlay key={`${scope}:${scopeEpoch}`} rows={fit} lang={lang} format={format}
        freeOnly={total === 0 && freeTools.length === toolCount} history={top ? history : undefined} onReviewTools={onReviewTools} />}
      {/* Where the money goes, a design system component (src/ds/Split). The slot only places it in the board. */}
      {toolCount > 1 && total > 0 && <div className="tt-slot" data-card="split">
        <Split lang={fr ? "fr" : "en"} format={format} unpriced={pending.filter((tool) => !spend.some((line) => line.tool.id === tool.id)).map((tool) => tool.name)} rateDate={converted ? rateDate : null}
          areas={areas.map((area) => ({ id: area.id, label: area.label, color: area.color, amount: area.amount, tools: (area.tools || []).map((row) => ({ ...row.tool, amount: row.amount })) }))}
          />
      </div>}
    </div>
  </section>;
}
