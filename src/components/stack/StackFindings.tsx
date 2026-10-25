import StackUsageReview from "./StackUsageReview";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Rocket, UserRound, BarChart3, Moon, Zap, Check, ChevronDown, CircleDot, ClipboardCheck, Flame, Plus, Scale, Target, TrendingUp, GitCompare, Layers3, ListChecks, RefreshCw, Sparkles, Tag, TrendingDown, Wallet } from "@/lib/icons";
import ToolLogo from "@/components/ToolLogo";
import { Link } from "@/lib/routerLinks";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { AREA_COLORS, AREA_OTHER } from "@/lib/stackAreas";
import { getPersonalStackScope, getPersonalStackScopeEpoch } from "@/lib/personalStackStore";
import toolAccents from "@/data/toolAccents.json";
import { toolKey } from "@/lib/stackView";
import { AppIcon, Button, Donut, Duo, Figure, Odometer, Radar, Segmented, TextLink } from "./StackKit";

export type FindingAction = { label: string; onClick: () => void; primary?: boolean; ariaLabel?: string };
export type Finding = {
  key: string;
  kind: "freemium" | "pair" | "price";
  tools: ToolSummary[];
  title: string;
  detail: string;
  actions: FindingAction[];
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
  savePrice?: (amount: number) => void;
  /** For a plan question: the two answers and what each costs a month. */
  options?: { label: string; amount: number }[];
};
type Resolved = { key: string; a: ToolSummary; b: ToolSummary; kind: "keep-both" | "keep-one"; kept?: string; removed?: string };
interface Props {
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

/** The text block of a card: one large figure, the sentence that says what it means, one quiet line of detail. */
function Lead({ figure, say, sub, tag, extra, color }: { figure: ReactNode; say: ReactNode; sub?: ReactNode; tag?: ReactNode; extra?: ReactNode; color?: string }) {
  return <div className="mf-lead" style={color ? { ["--lead" as string]: color } : undefined}>
    {tag && <p className="mf-lead-tag">{tag}</p>}
    <h3><b className="mf-lead-fig">{figure}</b> <span className="mf-lead-say">{say}</span></h3>
    {sub && <p className="mf-lead-sub">{sub}</p>}
    {extra}
  </div>;
}

type AreaShare = Props["areas"][number];
/**
 * Where the money goes, read like iPhone storage: one bar split by area, a
 * legend under it. Pointing at an area lights its segment; opening it lists
 * its paid tools. Areas with no known cost stay in the legend, at zero.
 */
type SplitView = "bar" | "radar" | "ring";
/** The three readings of the split, switched from the card's header row. */
function SplitViews({ view, onChange, t, radar }: { view: SplitView; onChange: (view: SplitView) => void; t: (a: string, b: string) => string; radar: boolean }) {
  // A radar only says something from four axes: below that it is a triangle, so it is not offered.
  return <Segmented className="mf-bb-views" label={t("Vue de la répartition", "Split view")} value={view} onChange={onChange}
    options={[{ id: "bar" as SplitView, label: <><BarChart3 size={14} aria-hidden />{t("Barre", "Bar")}</> }, ...(radar ? [{ id: "radar" as SplitView, label: <><Target size={14} aria-hidden />{t("Radar", "Radar")}</> }] : []), { id: "ring" as SplitView, label: <><CircleDot size={14} aria-hidden />{t("Anneau", "Ring")}</> }]} />;
}
/** A ring whose sections answer the pointer: the one pointed at thickens, the others fade. */
function SplitRing({ areas, active, onPoint, label }: { areas: AreaShare[]; active: string | null; onPoint: (id: string | null) => void; label: string }) {
  const sum = areas.reduce((acc, area) => acc + area.amount, 0);
  const r = 40, c = 2 * Math.PI * r, gap = areas.length > 1 ? 2.5 : 0;
  let offset = 0;
  return <svg className="mf-ring" viewBox="0 0 100 100" role="img" aria-label={label} data-active={active ? "" : undefined}>
    <circle className="mf-ring-track" cx="50" cy="50" r={r} />
    {sum > 0 && areas.map((area, index) => {
      const length = Math.max(0.5, (area.amount / sum) * c - gap);
      const arc = <circle key={area.id} cx="50" cy="50" r={r} stroke={area.color} strokeDasharray={`${length} ${c - length}`} strokeDashoffset={-offset}
        transform="rotate(-90 50 50)" data-on={active === area.id ? "" : undefined} style={{ ["--i" as string]: index }}
        onPointerEnter={() => onPoint(area.id)} onPointerLeave={() => onPoint(null)} />;
      offset += (area.amount / sum) * c;
      return arc;
    })}
  </svg>;
}

/** The profile of the stack: one axis per area, a dot per area that answers the pointer. */
function SplitRadar({ areas, active, onPoint, label }: { areas: AreaShare[]; active: string | null; onPoint: (id: string | null) => void; label: string }) {
  const n = areas.length, max = Math.max(1, ...areas.map((area) => area.amount));
  const at = (i: number, k: number) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [50 + Math.cos(a) * 42 * k, 50 + Math.sin(a) * 42 * k] as const; };
  const k = (amount: number) => (amount > 0 ? 0.12 + 0.88 * Math.sqrt(amount / max) : 0.04);
  const ring = (level: number) => areas.map((_, i) => at(i, level).join(",")).join(" ");
  return <svg className="mf-radar" viewBox="-26 -12 152 124" role="img" aria-label={label} data-active={active ? "" : undefined}>
    {[0.25, 0.5, 0.75, 1].map((level) => <polygon key={level} className="mf-radar-ring" points={ring(level)} />)}
    {/* Each axis says its area; an area with no cost is greyed, the one pointed at is bold. */}
    {areas.map((area, i) => { const [x, y] = at(i, 1.16); return <text key={`l${area.id}`} className="mf-radar-label" x={x} y={y + 2}
      textAnchor={Math.abs(x - 50) < 4 ? "middle" : x > 50 ? "start" : "end"} data-on={active === area.id ? "" : undefined} data-empty={area.amount > 0 ? undefined : ""}
      onPointerEnter={() => onPoint(area.id)} onPointerLeave={() => onPoint(null)}>{area.label}</text>; })}
    {areas.map((area, i) => { const [x, y] = at(i, 1); return <line key={area.id} className="mf-radar-axis" x1="50" y1="50" x2={x} y2={y} />; })}
    <polygon className="mf-radar-shape" points={areas.map((area, i) => at(i, k(area.amount)).join(",")).join(" ")} />
    {areas.map((area, i) => { const [x, y] = at(i, k(area.amount)); return <g key={area.id} onPointerEnter={() => onPoint(area.id)} onPointerLeave={() => onPoint(null)}>
      <circle className="mf-radar-hit" cx={x} cy={y} r="8" />
      <circle className="mf-radar-dot" cx={x} cy={y} r={active === area.id ? 3.6 : 2.4} fill={area.color} data-on={active === area.id ? "" : undefined} />
    </g>; })}
  </svg>;
}

function BudgetBar({ areas, total, format, t, view }: { areas: AreaShare[]; total: number; format: (n: number) => string; t: (a: string, b: string) => string; view: SplitView }) {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  // Three readings of the same split: the bar for shares, the radar for the
  // profile of the stack (where it is strong, where it is empty), the ring
  // for the whole at a glance. The legend under them is the same.
  const ranked = [...areas].sort((x, y) => y.amount - x.amount);
  const paid = ranked.filter((area) => area.amount > 0);
  const pct = (amount: number) => (total > 0 ? Math.round((amount / total) * 100) : 0);
  const keep = view === "bar" ? 3 : 4;
  const label = paid.map((area) => `${area.label} ${pct(area.amount)} %`).join(", ");
  const focus = areas.find((area) => area.id === active);
  return <div className="mf-bb" data-active={active ? "" : undefined} data-view={view}>
    {/* The chart has its title, like any chart: what it shows, and the whole it splits. */}
    <p className="mf-bb-title"><span>{t("Répartition des montants renseignés", "Recorded costs by area")}</span><b>{format(total)}<small>{t("/mois", "/mo")}</small></b></p>
    {view === "bar" && <div key="bar" className="mf-bb-bar mf-bb-stage" role="img" aria-label={label}>
      {paid.map((area) => <i key={area.id} style={{ flexGrow: area.amount, background: area.color }} data-on={active === area.id ? "" : undefined}
        onPointerEnter={() => setActive(area.id)} onPointerLeave={() => setActive(open)}>{pct(area.amount) >= 12 && <span>{pct(area.amount)} %</span>}</i>)}
    </div>}
    {/* Bare: the legend beside it names the axes. */}
    {view === "radar" && <div key="radar" className="mf-bb-radar mf-bb-stage"><SplitRadar areas={areas} active={active} onPoint={(id) => setActive(id ?? open)} label={label} /></div>}
    {view === "ring" && <div key="ring" className="mf-bb-ring mf-bb-stage">
      <SplitRing areas={paid} active={active} onPoint={(id) => setActive(id ?? open)} label={label} />
      {/* The centre answers the pointer: the total, or the area pointed at. */}
      <span className="mf-bb-ring-c" aria-hidden="true"><b>{focus ? `${pct(focus.amount)} %` : format(total)}</b><small>{focus ? focus.label : t("par mois", "a month")}</small></span>
    </div>}
    {/* The legend is a row of chips: the chart keeps the space. Pointing at a chip
        lights its area; the caption under the chart names it, in a slot of fixed height. */}
    {/* A fixed number of entries, the rest in one: the box keeps its size.
        Three pills under the bar, four rows beside the radar and the ring. */}
    <ul key={`chips-${view}`} className="mf-bb-chips">{(paid.length > keep + 1 ? paid.slice(0, keep) : paid).map((area, index) => <li key={area.id} style={{ ["--i" as string]: index }}>
      <button type="button" aria-pressed={open === area.id} data-on={active === area.id ? "" : undefined}
        onPointerEnter={() => setActive(area.id)} onPointerLeave={() => setActive(open)} onFocus={() => setActive(area.id)} onBlur={() => setActive(open)}
        onClick={() => { const next = open === area.id ? null : area.id; setOpen(next); setActive(next); }}>
        <i style={{ background: area.color }} aria-hidden="true" /><span>{area.label}</span><b className="mf-bb-chip-amount">{format(area.amount)}</b><small>{pct(area.amount)} %</small>
        {/* The area's tools, always there: nothing appears or moves on hover. */}
        {area.tools?.length ? <span className="mf-bb-chip-tools" aria-hidden="true">{area.tools.slice(0, 3).map((row) => <span key={row.tool.id}><ToolLogo tool={row.tool} size={16} /></span>)}{area.tools.length > 3 && <em>+{area.tools.length - 3}</em>}</span> : null}
      </button>
    </li>)}
    {paid.length > keep + 1 && (() => {
      const rest = paid.slice(keep);
      const pointed = rest.find((area) => area.id === active);
      // The last pill stands for the small areas; pointing at one of their segments names it here.
      return <li className="mf-bb-rest" style={{ ["--i" as string]: keep }}>
        <span className="mf-bb-rest-pill" data-on={pointed ? "" : undefined}>
          <span className="mf-bb-rest-dots" aria-hidden="true">{rest.map((area) => <i key={area.id} style={{ background: area.color }} data-on={pointed?.id === area.id ? "" : undefined} />)}</span>
          {pointed ? <><span>{pointed.label}</span><b className="mf-bb-chip-amount">{format(pointed.amount)}</b></>
            : <><span>{t(`${rest.length} autres`, `${rest.length} more`)}</span><b className="mf-bb-chip-amount">{format(rest.reduce((sum, area) => sum + area.amount, 0))}</b></>}
        </span>
      </li>;
    })()}</ul>
  </div>;
}

/** One alternative: mine → theirs, the monthly gap, and the way to compare. */
function TextLinkRow({ to, row, format, t }: { to: string; row: { tool: ToolSummary; alt: ToolSummary; mine: number; theirs: number }; format: (n: number) => string; t: (a: string, b: string) => string }) {
  return <Link className="mf-cheaper-row" to={to}>
    <span className="mf-cheaper-text"><span>{t(`Passez à ${row.alt.name}`, `Switch to ${row.alt.name}`)}</span><small>{t(`À la place de ${row.tool.name}, `, `Instead of ${row.tool.name}, `)}<em>{t(`${format(row.mine - row.theirs)} de moins`, `${format(row.mine - row.theirs)} less`)}</em>{t(" par mois.", " a month.")}</small></span>
  </Link>;
}

/** The answer to "what does it cost?", in the card: an amount, per month, saved on Enter. */
function PriceField({ onSave, onPreview, t }: { onSave: (amount: number) => void; onPreview?: (amount: number | null) => void; t: (a: string, b: string) => string }) {
  const [value, setValue] = useState("");
  const amount = Number(value.replace(",", "."));
  const ok = value.trim() !== "" && Number.isFinite(amount) && amount >= 0;
  return <form className="mf-price-field" onSubmit={(event) => { event.preventDefault(); if (ok) onSave(amount); }}>
    <label><span className="sr-only">{t("Montant mensuel", "Monthly amount")}</span>
      <input inputMode="decimal" autoComplete="off" placeholder="0" value={value} onChange={(event) => { setValue(event.target.value); const next = Number(event.target.value.replace(",", ".")); onPreview?.(event.target.value.trim() !== "" && Number.isFinite(next) && next >= 0 ? next : null); }} aria-label={t("Montant mensuel en euros", "Monthly amount")} />
      <span aria-hidden="true">{t("€ / mois", "€ / mo")}</span>
    </label>
    <Button variant="primary" type="submit" disabled={!ok}>{t("Enregistrer", "Save")}</Button>
  </form>;
}

/** A tool's brand colour from the catalogue, or the ToolTrim neutral. */
const accentOf = (tool?: ToolSummary) => (tool && (toolAccents as Record<string, string | null>)[toolKey(tool)]) || "var(--color-stack-accent-fallback)";

const icon = (Icon: typeof Wallet, color?: string) => <Icon size={14} strokeWidth={1.8} aria-hidden style={color ? { color } : undefined} />;

// Ma stack in one screen, read in order (22/10/2026): first what the stack
// costs, then the one thing to decide now, then, quietly, what comes next.
// Settling the current finding brings the next one in; once nothing is left,
// the space becomes the summary of what was decided and what it saved.
export default function StackFindings({ lang, total, format, spend, areas, toolCount, freeTools = [], fit, items, reviewFindingKey, saved, toReview, resolved, history, onAddTool, onReviewTools, exploreHref, guide, hourly }: Props) {
  const fr = lang === "fr";
  const t = (a: string, b: string) => (fr ? a : b);
  const s = (n: number) => (n > 1 ? "s" : "");
  const [later, setLater] = useState<string[]>([]);
  const [priceAll, setPriceAll] = useState(false);
  const [splitView, setSplitView] = useState<SplitView>("bar");
  // On a phone each card is a summary line; one opens at a time.
  const [openCard, setOpenCard] = useState<string | null>(null);
  const expander = (id: string, name: string) => <button type="button" className="mf-expand" aria-expanded={openCard === id}
    aria-label={openCard === id ? t(`Replier ${name}`, `Collapse ${name}`) : t(`Ouvrir ${name}`, `Open ${name}`)} onClick={() => setOpenCard(openCard === id ? null : id)}><ChevronDown size={18} aria-hidden /></button>;
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
    if (picked !== null || !run) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) { run(); return; }
    setPicked(index);
    scheduleAnswer(run, 720);
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

  // Price card: the three tools that weigh most, the rest as one line.
  // Each tool keeps the colour of its area, as in the budget split: one colour code for the whole bento.
  const areaColorOf = new Map(areas.flatMap((area) => (area.tools || []).map((row) => [row.tool.id, area.color] as const)));
  // A summary first: the three tools that weigh most; the rest on demand.
  // The price card is taller when there is nothing to decide: it lists more tools then.
  const room = order.length === 0 ? 8 : 3;
  const shown = priceAll ? spend : spend.slice(0, spend.length <= room ? spend.length : room);
  const otherAmount = spend.slice(shown.length).reduce((sum, line) => sum + line.amount, 0);
  const otherCount = spend.length - shown.length;
  const segments: { id: string; label: string; amount: number; color: string; tool?: ToolSummary }[] = [...shown.map((line, index) => ({ id: line.tool.id, label: line.tool.name, amount: line.amount, color: AREA_COLORS[index], tool: line.tool })),
    ...(otherCount > 0 ? [{ id: "others", label: t(`${otherCount} autre${s(otherCount)}`, `${otherCount} other${s(otherCount)}`), amount: otherAmount, color: AREA_OTHER }] : [])];
  return <section className="mf" aria-label={t("Ma stack en bref", "My stack at a glance")}>
    <div className="mf-grid" data-starter={toolCount === 1 ? "" : undefined} data-sparse={total === 0 && fit.length === 0 ? "" : undefined} data-next={groups.length} data-done={top ? undefined : ""}>
      {/* 1. Read first: what the stack costs, and the verdict under it. */}
      <article className="mf-card mf-price" data-open={openCard === "price" ? "" : undefined} data-all={priceAll ? "" : undefined}>
        <p className="mf-k tt-kicker">{icon(Wallet)}{spend.length === 0 && items.some(item => item.kind === "price" || item.kind === "freemium") ? t("Votre budget", "Your budget") : items.some(item => item.kind === "price" || item.kind === "freemium") ? t("Budget partiel renseigné", "Known budget so far") : t("Budget mensuel renseigné", "Recorded monthly budget")}{expander("price", t("le coût", "the cost"))}</p>
        {/* An unknown price is never shown as free: no figure without a known price, and a partial total says so. */}
        {(() => { const missing = items.filter((item) => item.kind === "price" || item.kind === "freemium").length;
          return spend.length === 0 && missing > 0
            ? <div className="mf-budget-onboarding">
                <p className="mf-budget-step">{t("Premier petit pas", "One small first step")}</p>
                <h3>{t("On fait les comptes ?", "Let's talk budget.")}</h3>
                <p className="mf-budget-reassurance">{t("Promis, pas de tableur.", "No spreadsheet required. Promise.")}</p>
                <p>{t("Dites-nous quelle formule vous utilisez. Gratuite ou payante, chaque réponse aide à y voir plus clair.", "Tell us which plan you use. Free or paid, every answer makes the picture clearer.")}</p>
                <button type="button" className="mk-link" onClick={() => { const next = items.find(item => item.kind === "price" || item.kind === "freemium"); if(next){setFirst(next.key);setLater(keys=>keys.filter(key=>key!==next.key));setOpenCard("now");requestAnimationFrame(()=>document.getElementById("mf-now-title")?.scrollIntoView({block:"center",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}));} }}>{t("Préciser ma première formule", "Choose my first plan")}</button>
              </div>
            : <><Figure value={format(total)} unit={t("/mois", "/mo")} />{(() => {
              // Can the total be trusted? A tool counts once its cost is certain.
              const unsure = items.filter((item) => item.kind === "price" || item.kind === "freemium");
              const pct = toolCount > 0 ? Math.round(((toolCount - unsure.length) / toolCount) * 100) : 100;
              const prices = unsure.filter((item) => item.kind === "price").length, plans = unsure.length - prices;
              const left = [prices > 0 && t(`${prices} prix`, `${prices} price${s(prices)}`), plans > 0 && t(`${plans} formule${s(plans)}`, `${plans} plan${s(plans)}`)].filter(Boolean).join(t(" et ", " and "));
              const ring = <svg className="mf-trust-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" /><circle cx="18" cy="18" r="15" style={{ strokeDasharray: `${(pct / 100) * 94.2} 94.2` }} /></svg>;
              const dots = <span className="mf-trust-dots" aria-hidden="true">{Array.from({ length: toolCount }, (_, index) => <i key={index} data-sure={index < toolCount - unsure.length ? "" : undefined} />)}</span>;
              // One tap brings the next open question to the decision card, which lights up.
              return unsure.length > 0
                ? <button type="button" className="mf-trust" onClick={() => { setFirst(unsure[0].key); setLater((keys) => keys.filter((key) => key !== unsure[0].key)); setFlash(Date.now()); }}>
                    {ring}<span className="mf-trust-text"><b>{t(`${toolCount - unsure.length} outil${s(toolCount - unsure.length)} sur ${toolCount} renseigné${s(toolCount - unsure.length)}`, `${toolCount - unsure.length} of ${toolCount} tools priced`)}</b><small>{t(`Estimation partielle : ${left} à confirmer`, `Partial estimate: ${left} to confirm`)}</small>{dots}</span>
                  </button>
                : toolCount > 0 && <p className="mf-trust" data-exact="">{ring}<span className="mf-trust-text"><b>{t("Budget renseigné", "Budget recorded")}</b><small>{t("Estimation selon les prix et formules renseignés.", "Estimate based on the prices and plans recorded.")}</small>{dots}</span></p>;
            })()}</>; })()}
        {spend.length > 0 ? <>
          {/* Your stack, by what it costs: the tools that weigh most, each with a thin
              bar for its share; the others as a strip of their logos. */}
          <ul className="mf-shares">{shown.map((line, index) => <li key={line.tool.id} style={{ ["--c" as string]: areaColorOf.get(line.tool.id) || AREA_OTHER, ["--w" as string]: `${total > 0 ? (line.amount / total) * 100 : 0}%`, ["--i" as string]: index }}>
            <span className="mf-shares-logo" aria-hidden="true"><ToolLogo tool={line.tool} size={22} /></span>
            <span className="mf-shares-name">{line.tool.name}</span>
            <b>{format(line.amount)}</b>
            <span className="mf-shares-bar" aria-hidden="true"><i /></span>
            <small>{total > 0 ? Math.round((line.amount / total) * 100) : 0} %</small>
          </li>)}</ul>
          {spend.length > shown.length && <button type="button" className="mf-others" onClick={() => setPriceAll(true)} aria-expanded={false}>
            <span className="mf-others-logos" aria-hidden="true">{spend.slice(shown.length, shown.length + 3).map((line) => <span key={line.tool.id}><ToolLogo tool={line.tool} size={18} /></span>)}</span>
            <span>{t(`+ ${spend.length - shown.length} autre${s(spend.length - shown.length)}`, `+ ${spend.length - shown.length} more`)}</span>
            <b>{format(otherAmount)}</b>
          </button>}
          {priceAll && spend.length > 4 && <TextLink className="mf-less" onClick={() => setPriceAll(false)}>{t("Réduire", "Show less")}</TextLink>}
        </> : !items.some(item => item.kind === "price" || item.kind === "freemium") && <p className="mf-empty">{t("Aucun abonnement payant renseigné.", "No paid plans recorded.")}</p>}
        {freeTools.length > 0 && <div className="mf-cost-complement">
          <p>{t(`${freeTools.length} outil${s(freeTools.length)} gratuit${s(freeTools.length)} · sans coût ajouté`, `${freeTools.length} free tool${s(freeTools.length)} · no added cost`)}</p>
          <ul className="mf-cost-zero">{freeTools.map(tool => <li key={tool.id}><ToolLogo tool={tool} size={22} /><span>{tool.name}</span><b>{t("Gratuit", "Free")}</b></li>)}</ul>
        </div>}
        {spend.length > 0 && items.some(item => item.kind === "price" || item.kind === "freemium") && <p className="mf-cost-scope">{t("Les outils à renseigner ne sont pas inclus dans ce montant.", "Tools awaiting a price or plan are not included in this amount.")}</p>}
        {saved > 0 && <p className="mf-verdict">{icon(Check, "var(--color-pro)")}<span>{t("Budget estimé allégé de ", "Estimated budget reduced by ")}<b>{format(saved)}</b>{t(" par mois.", " a month.")}</span></p>}
        {/* Once nothing is left to decide the decision card goes; what can be reopened lives here. */}

      </article>

      {/* 2. The one thing to do now, or the summary once everything is settled. */}
      {top ? <section key={`${top.key}-${flash}`} data-step={seatPlan ? "seats" : undefined} className="mf-card mf-now" data-flash={flash ? "" : undefined} data-open={openCard === "now" ? "" : undefined} aria-labelledby="mf-now-title" data-kind={top.kind}
        style={{ ["--a1" as string]: accentOf(top.tools[0]), ["--a2" as string]: accentOf(top.tools[1] || top.tools[0]) }}>
        {/* The image of the decision: its tools, large, on a halo of their brand colours. */}
        {top.kind !== "pair" && <div className="mf-stage" aria-hidden="true">{top.tools.length > 1 ? <Duo a={top.tools[0]} b={top.tools[1]} large /> : <AppIcon tool={top.tools[0]} large />}</div>}
        <h2 id="mf-now-title" tabIndex={-1} className="sr-only">{t("Prochaine décision", "Next decision")}</h2>
        <p className="mf-k tt-kicker"><span className="mf-k-pill">{guide && (top.kind === "price" || top.kind === "freemium") ? t("Étape suivante", "Next step") : t("Votre décision", "Your decision")}</span>{expander("now", t("la décision", "the decision"))}
          {peak > 1 && <span className="mf-step" aria-label={t(`Étape ${step} sur ${peak}`, `Step ${step} of ${peak}`)}><span className="mf-step-track" aria-hidden="true"><i style={{ width: `${(step / peak) * 100}%` }} /></span>{t(`${step} sur ${peak}`, `${step} of ${peak}`)}</span>}</p>
        {/* The tool in question, on stage: its logo bounces in beside the question. */}
        <div className="mf-now-q">{top.kind !== "pair" && <span className="mf-now-logo" aria-hidden="true"><ToolLogo tool={top.tools[0]} size={36} /></span>}<h3>{top.kind === "price" && !(top.plans && top.plans.length) ? t(`Combien vous coûte ${top.tools[0].name} par mois\u00a0?`, `How much does ${top.tools[0].name} cost you a month?`) : top.title}</h3></div>
        <p className="mf-t">{guide && (top.kind === "price" || top.kind === "freemium") ? t("Pour un budget juste, dites-nous laquelle vous payez. Gratuite, ça compte aussi.", "For an honest budget, tell us which one you pay. Free counts too.") : top.detail}</p>
        {/* A duplicate is a face-off: one tap on a face keeps it, and each face says what it saves. */}
        {top.kind === "pair" && <div className="mf-duel" data-picked={picked !== null ? picked : undefined}>{top.tools.slice(0, 2).map((tool, index) => {
          const keep = top.actions.find((action) => action.label.endsWith(tool.name));
          const own = top.costs?.[index] ?? 0, other = top.costs?.[1 - index] ?? 0; // the cheaper face gets the tag
          return <Fragment key={tool.id}>
            {index === 1 && <span className="mf-duel-or" aria-hidden="true">{t("ou", "or")}</span>}
            <button type="button" className="mf-face" onClick={() => pick(index, keep?.onClick)} aria-label={keep?.ariaLabel || keep?.label}
              onPointerEnter={() => setPreview(total - other)} onPointerLeave={() => setPreview(null)} onFocus={() => setPreview(total - other)} onBlur={() => setPreview(null)}
              data-state={picked === null ? undefined : picked === index ? "kept" : "gone"}>
              {own < other && <span className="mf-face-tag">{t("Le moins cher", "Cheaper")}</span>}
              <span className="mf-face-logo"><ToolLogo tool={tool} size={64} />{picked === index && <span className="mf-face-check" aria-hidden="true"><Check size={16} strokeWidth={3} /></span>}</span>
              {picked === index && other > 0 && <span className="mf-face-gain" aria-hidden="true">−{format(other)}{t("/mois", "/mo")}</span>}
              <span className="mf-face-name">{tool.name}</span>
              <span className="mf-face-cost">{own > 0 ? `${format(own)}${t("/mois", "/mo")}` : t("Gratuit", "Free")}</span>
              <span className="mf-face-cta" aria-hidden="true">{t("Garder", "Keep")}</span>
            </button>
          </Fragment>;
        })}</div>}
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
                <div className="mf-stepper" role="group" aria-label={t("Nombre de personnes", "Number of people")}>
                  <button type="button" onClick={() => set(seats - 1)} disabled={seats <= 1} aria-label={t("Une personne de moins", "One fewer")}>−</button>
                  <output aria-live="polite">{seats}</output>
                  <button type="button" onClick={() => set(seats + 1)} aria-label={t("Une personne de plus", "One more")}>+</button>
                </div>
                <Button variant="primary" className="mf-seats-ok" onClick={() => chosen.pick(seats)}>{t("Valider", "Confirm")}</Button>
              </div>
              {/* The team, drawn: one figure per person, each new one pops in. */}
              <div className="mf-seats-crew" aria-hidden="true">
                <span className="mf-seats-people">{Array.from({ length: shown }, (_, index) => <i key={index}><UserRound size={18} /></i>)}{seats > 12 && <em>+{seats - 12}</em>}</span>
                {/* The result only: a rounded unit price times seats would not add up. */}
                <span className="mf-seats-sum">{t(`${seats} personne${s(seats)}`, `${seats} ${seats > 1 ? "people" : "person"}`)} · <b>{format(chosen.monthly * seats)}</b>{t("/mois", "/mo")}</span>
              </div>
            </div>;
          }
          return <div className="mf-plans" role="radiogroup" aria-label={t("Votre formule", "Your plan")}>
            {tiles.map((plan, index) => <button key={plan.key} type="button" role="radio" aria-checked={pickedTile === plan.key} className="mf-plan"
              style={{ ["--i" as string]: index }} data-state={pickedTile === null ? undefined : pickedTile === plan.key ? "kept" : "gone"}
              onPointerEnter={() => setPreview(total + plan.monthly)} onPointerLeave={() => setPreview(null)} onFocus={() => setPreview(total + plan.monthly)} onBlur={() => setPreview(null)}
              onClick={() => { if (plan.perSeat) { setSeatPlan(plan.key); setSeats(1); setPreview(total + plan.monthly); } else pickTile(plan.key, () => plan.pick()); }}>
              {/* "Professional (Dev seat)": the plan's name, then its qualifier on a quieter line. */}
              {(() => { const [, main, qualifier] = /^(.*?)\s*\((.+)\)\s*$/.exec(plan.label) ?? [null, plan.label, null];
                const max = Math.max(1, ...tiles.map((x) => x.monthly)); const Icon = plan.monthly === 0 ? Moon : plan.monthly >= max ? Rocket : Zap;
                return <span className="mf-plan-name" title={plan.label}><Icon size={14} aria-hidden /><span>{main}{qualifier && <em>{qualifier}</em>}</span></span>; })()}
              <b>{plan.monthly > 0 ? format(plan.monthly) : t("0 €", "Free")}<small>{plan.monthly > 0 ? t("/mois", "/mo") : ""}</small></b>
              {/* Same lines in every tile, so prices sit on one level. */}
              <small className="mf-plan-note">{plan.monthly === 0 ? t("Rien à payer", "Nothing to pay") : plan.note || t("par mois", "a month")}</small>
              {/* With a day rate, a price also reads as working time. */}
              {hourly ? <small className="mf-plan-time">{plan.monthly === 0 ? t("0 min de votre travail", "0 min of your work") : (() => { const minutes = Math.max(1, Math.round((plan.monthly / hourly) * 60)); return minutes < 60 ? t(`≈ ${minutes} min de votre travail`, `≈ ${minutes} min of your work`) : t(`≈ ${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} de votre travail`, `≈ ${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} of your work`); })()}</small> : null}
              {/* The radio mark: the usual sign of a single choice. */}
              <span className="mf-plan-radio" aria-hidden="true">{pickedTile === plan.key && <Check size={12} strokeWidth={3} />}</span>
            </button>)}
          </div>;
        })()}
        {/* No plan in the catalogue: the only case with an amount to type. */}
        {top.savePrice && (!top.plans || top.plans.length === 0) && <PriceField key={top.key} onSave={top.savePrice} onPreview={(amount) => setPreview(amount === null ? null : total + amount)} t={t} />}
        {/* One bar, always at the bottom: ways to look or defer on the left, the answers on the right. */}
        <div className="mf-bar-actions">
          <div className="mf-links">
            {top.link && <TextLink to={top.link.to} onClick={top.link.onClick}>{top.link.label}</TextLink>}
            {top.bulk && <TextLink onClick={top.bulk.onClick}>{top.bulk.label}</TextLink>}
            {/* A pair's third answer, keep both, is the quiet one: a link. */}
            {top.kind === "pair" && top.actions.filter((action) => !top.tools.some((tool) => action.label.endsWith(tool.name))).map((action) => <TextLink key={action.label} onClick={action.onClick}>{action.label}</TextLink>)}
            {order.length > 1 && <TextLink className="mk-link--quiet" onClick={() => { setFirst(null); setLater((keys) => [...keys.filter((key) => key !== top.key), top.key]); }}>{t("Plus tard", "Later")}</TextLink>}
          </div>
          {(top.savePrice || (top.plans && top.plans.length > 0)) && top.kind === "price" && top.actions.map((action) => <TextLink key={action.label} onClick={action.onClick}>{t("Saisie détaillée (sièges, annuel)", "Detailed entry (seats, yearly)")}</TextLink>)}
          {/* The effect on the total, on the bar's right: today's figure, then where an answer takes it. */}
          {(top.plans?.length || top.kind === "pair" || top.savePrice || (top.kind === "freemium" && top.options)) && <p className="mf-preview" aria-live="polite">
            <span className="mf-preview-k">{items.some(item => item.kind === "price" || item.kind === "freemium") ? t("Budget partiel", "Partial budget") : t("Budget estimé", "Estimated budget")}</span>
            <b className="mf-preview-next" data-on={preview !== null ? "" : undefined}>{preview === null && total === 0 && items.some(item => item.kind === "price" || item.kind === "freemium") ? t("À renseigner", "Not set yet") : <>{format(preview ?? total)}<small className="mf-preview-unit">{t("/mois", "/mo")}</small></>}
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
        {history && <div className="mf-history">{history}</div>}
      </section> : null}

      {/* 3. How the budget is balanced across verticals: its own block. */}
      {toolCount === 1 && !top && <article className="mf-card mf-starter-next" data-open="">
        <span className="mf-starter-icon" aria-hidden="true"><Layers3 size={24} /></span>
        <h2>{t("Votre stack prend forme.", "Your stack is taking shape.")}</h2>
        <p>{t("Votre premier outil est en place. Ajoutez ceux que vous utilisez aussi pour mieux comprendre votre budget et les usages qui se recoupent.", "Your first tool is in place. Add the others you use to understand your budget and where their uses overlap.")}</p>
        <Button variant="primary" icon={<Plus size={18} aria-hidden />} onClick={onAddTool}>{t("Ajouter un autre outil", "Add another tool")}</Button>
      </article>}
      {toolCount > 1 && total > 0 && <article className="mf-card mf-balance" data-open={openCard === "bal" ? "" : undefined}>
        <div className="mf-k tt-kicker">{icon(Layers3)}<span className="mf-k-label">{t("Répartition du budget", "Budget split")}</span>{spend.length > 0 && areas.length > 0 && <SplitViews view={splitView} onChange={setSplitView} t={t} radar={areas.length >= 4} />}{expander("bal", t("la répartition", "the split"))}</div>
        {spend.length > 0 && areas.length > 0 ? (() => {
          const lead = [...areas].sort((x, y) => y.amount - x.amount)[0];
          const share = total > 0 ? Math.round((lead.amount / total) * 100) : 0;
          // The verdict first: is the money spread, or does one area take most of it?
          const heavy = share >= 50;
          const spread = areas.filter((area) => area.amount > 0).length;
          // A touch of play on the left: the share rolls in the lead area's colour,
          // a short honest line, and that area's tools stacked like cards.
          const deck = (lead.tools || []).slice(0, 4);
          const extraTools = Math.max(0, (lead.tools || []).length - deck.length);
          const logos = deck.length > 0 ? <span className="mf-lead-deck" aria-hidden="true">{deck.map((row, index) => <span key={row.tool.id} style={{ ["--i" as string]: index }}><ToolLogo tool={row.tool} size={26} /></span>)}{extraTools > 0 && <em>+{extraTools}</em>}</span> : null;
          const tag = share >= 75 ? <><Flame size={14} aria-hidden />{t("Premier poste renseigné", "Largest recorded cost")}</> : share >= 50 ? <><TrendingUp size={14} aria-hidden />{t("Premier poste renseigné", "Largest recorded cost")}</> : <><Scale size={14} aria-hidden />{t("Montants par domaine", "Costs by area")}</>;
          return <>{heavy
            ? <Lead tag={tag} color={lead.color === AREA_OTHER ? undefined : lead.color} extra={logos} figure={<Odometer text={`${share}\u00a0%`} />} say={t(`du budget renseigné pour ${lead.label.replace(/ /g, "\u00a0")}.`, `of recorded costs for ${lead.label}.`)}
                sub={t(`${format(lead.amount)} sur ${format(total)} chaque mois.`, `${format(lead.amount)} of ${format(total)} every month.`)} />
            : <Lead tag={tag} color={lead.color === AREA_OTHER ? undefined : lead.color} extra={logos} figure={t(`${spread} domaines`, `${spread} areas`)} say={t("se partagent les montants renseignés.", "share the recorded costs.")}
                sub={t(`Le plus gros, ${lead.label}, en prend ${share} %.`, `The largest, ${lead.label}, takes ${share}%.`)} />}
          <BudgetBar areas={areas} total={total} format={format} t={t} view={splitView === "radar" && areas.length < 4 ? "bar" : splitView} /></>;
        })() : <p className="mf-t">{areas.length < 3 ? t("La répartition apparaît dès trois domaines dans votre stack.", "The split appears from three areas in your stack.") : t("Aucun coût connu à répartir pour l’instant.", "No known cost to spread yet.")}</p>}
      </article>}

      {toolCount > 1 && (fit.length > 0 || !top || history) && <StackUsageReview key={`${scope}:${scopeEpoch}`} rows={fit} lang={lang} format={format}
        complete={!top && fit.every(row => !!row.usage)} history={history} onReviewTools={onReviewTools} />}


    </div>
  </section>;
}
