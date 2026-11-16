import StackInvoiceEntry from "@/ds/InvoiceEntry/InvoiceEntry";
import { CURRENCY_RATE_DATE, type Currency } from "@/lib/currencyRates";
import StackUsagePlay from "@/ds/UsagePlay/UsagePlay";
import { useCallback, useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { Ending, Key, StoryHero } from "@/ds/Narrative/Narrative";
import Tag from "@/ds/Tag/Tag";
import type { StackWelcome } from "@/components/stack/StackPersonalWelcome";
import { Rocket, Moon, Zap } from "@/lib/icons";
import { BudgetTrust } from "@/ds/Budget/Budget";

type BudgetTool = { id: string; name: string; slug?: string; logo?: string; paid: boolean | null };
import Split from "@/ds/Split/Split";
import Decision, { type DecisionLink } from "@/ds/Decision/Decision";
import Choice, { Choices, IconTile } from "@/ds/Choice/Choice";
import Seats from "@/ds/Seats/Seats";
import Logo from "@/ds/Logo/Logo";
import { Meet, Stamp, Trim } from "@/ds/Gesture/Gesture";
import { toolKey } from "@/lib/stackView";
import Bento, { Answer, Answers, BentoRow, GlassIcon, MiniRing, Question, Tile } from "@/ds/Bento/Bento";
import Amount from "@/ds/Amount/Amount";
import Starter from "@/ds/Starter/Starter";

/** The five everyday jobs of a freelancer, as stack territories: the dashboard's coverage ring (M01). */
const CORE_TRADES = ["create", "organize", "communicate", "build", "manage"] as const;
const TRADE_ICONS: Record<(typeof CORE_TRADES)[number], ReactNode> = { create: <Palette />, organize: <FolderKanban />, communicate: <MessagesSquare />, build: <Globe />, manage: <Receipt /> };
/** What the first missing job says, with a smile at the situation, never at the person (M01). */
const TRADE_JOKES: Record<(typeof CORE_TRADES)[number], [string, string]> = {
  create: ["Rien pour créer. Tout à la main, comme au temps des Lumières.", "Nothing to create with. All by hand, like in the Enlightenment."],
  organize: ["Rien pour s'organiser. Vos projets vivent dans votre tête ?", "Nothing to get organised. Do your projects live in your head?"],
  communicate: ["Rien pour échanger. Les pigeons voyageurs, c'est charmant mais lent.", "Nothing to talk with. Carrier pigeons are charming, but slow."],
  build: ["Pas de site. Votre portfolio vit sur Instagram, c'est ça ?", "No website. Your portfolio lives on Instagram, right?"],
  manage: ["Rien pour facturer. Vos clients adorent, votre banquier moins.", "Nothing to invoice. Your clients love it, your banker less so."],
};
const TRADE_NAMES: Record<(typeof CORE_TRADES)[number], [string, string]> = {
  create: ["Créer", "Create"], organize: ["Organiser", "Organise"], communicate: ["Échanger", "Talk"], build: ["Sites", "Sites"], manage: ["Gérer", "Manage"],
};
import { Section, SectionHead } from "@/ds/Toolbar/Toolbar";
import Button, { TextButton } from "@/ds/Button/Button";
import { trackEvent } from "@/lib/analytics";
import { Clock, Copy, Euro, LayoutGrid, FolderKanban, Globe, MessagesSquare, Palette, PiggyBank, Plus, Receipt, Wallet } from "@/lib/icons";
import { Checkpoints, SpendBar, TradeMap } from "@/ds/StackBoard/StackBoard";
import StackProfile from "@/components/stack/StackProfile";
import { FigureCard, FigureCards } from "@/ds/Catalog/Catalog";
import { useNavigate } from "react-router-dom";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { getPersonalStackScope, getPersonalStackScopeEpoch } from "@/lib/personalStackStore";

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
  /** How many trades (areas) the stack covers: the dashboard's first figure (M01, 14/11/2026). */
  trades?: number;
  /** The territories the stack covers (create, organize…): the dashboard's coverage ring. */
  covered?: string[];
  /** The stack's tools by territory: the trade map shows each job with the logos of its tools. */
  territories?: { id: string; tools: ToolSummary[] }[];
  /** Everyday jobs no tool of the stack covers (invoicing…), with where to look: the « worth a look » list. */
  gaps?: { id: string; label: string; href: string }[];
  /** The hero's words (greeting, verdict, humour) and its actions; the findings add the cost. */
  welcome?: StackWelcome & { titleRef?: Ref<HTMLHeadingElement>; action?: ReactNode; secondary?: ReactNode };
}

export type FitRow = { tool: ToolSummary; cost: number; usage?: number; setUsage: (value: number | null) => void; detailHref: string };



// Ma stack in one screen, read in order (22/10/2026): first what the stack
// costs, then the one thing to decide now, then, quietly, what comes next.
// Settling the current finding brings the next one in; once nothing is left,
// the space becomes the summary of what was decided and what it saved.
export default function StackFindings({ lang, currency = "EUR", converted = false, total, format, spend, areas, toolCount, freeTools = [], fit, items, reviewFindingKey, saved, toReview, resolved, history, onAddTool, onReviewTools, exploreHref, guide, hourly, welcome, trades, gaps = [], covered = [], territories = [] }: Props) {
  const fr = lang === "fr";
  const t = (a: string, b: string) => (fr ? a : b);
  const navigate = useNavigate();
  const rateDate = new Date(`${CURRENCY_RATE_DATE}T00:00:00Z`).toLocaleDateString(fr ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).replace(/ /g, "\u00a0");
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
  // A tapped plan lights up, the others step back, then the answer goes through.
  const [pickedTile, setPickedTile] = useState<string | null>(null);
  // The bento tile opened in its row, if any.
  const [openTile, setOpenTile] = useState<string | null>(null);
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
  const step = Math.max(1, peak - items.length + 1);


  // The Budget card: every tool once, the most expensive first, then those whose price is not known yet, then the free ones.
  const unsure = items.filter((item) => item.kind === "price" || item.kind === "freemium");
  const pending = [...new Map(unsure.flatMap((item) => item.tools).map((tool) => [tool.id, tool])).values()];
  const budgetTools: BudgetTool[] = [
    ...spend.map((line) => ({ ...line.tool, paid: true })),
    ...pending.filter((tool) => !spend.some((line) => line.tool.id === tool.id)).map((tool) => ({ ...tool, paid: null })),
    ...freeTools.map((tool) => ({ ...tool, paid: false })),
  ];
  // The living bento (src/ds/Bento): two facts that always stay (the stack, its split) and the questions
  // while there is something to refine. A tile opens in its row (it widens, the others narrow); the bento
  // keeps its height. The decision tile holds the decision itself, answers side by side.
  const unsureTools = budgetTools.filter((tool) => tool.paid === null).length;
  const known = Math.max(0, budgetTools.length - unsure.length);
  const left = [
    unsure.filter((item) => item.kind === "price").length > 0 && (fr ? `${unsure.filter((item) => item.kind === "price").length} prix` : `${unsure.filter((item) => item.kind === "price").length} price${unsure.filter((item) => item.kind === "price").length > 1 ? "s" : ""}`),
    unsure.filter((item) => item.kind === "freemium").length > 0 && (fr ? `${unsure.filter((item) => item.kind === "freemium").length} formule${unsure.filter((item) => item.kind === "freemium").length > 1 ? "s" : ""}` : `${unsure.filter((item) => item.kind === "freemium").length} plan${unsure.filter((item) => item.kind === "freemium").length > 1 ? "s" : ""}`),
  ].filter(Boolean).join(t(" et ", " and "));
  const confirmNext = () => { if (!unsure[0]) return; setFirst(unsure[0].key); setLater((keys) => keys.filter((key) => key !== unsure[0].key)); setFlash(Date.now()); };
  const monthly = total > 0 ? format(converted ? Math.round(total) : total) : null;
  const yearly = total > 0 ? format(converted ? Math.round(total * 12) : total * 12) : null;
  const shares = [...areas].filter((area) => area.amount > 0).sort((x, y) => y.amount - x.amount);
  const lead = shares[0];
  const leadShare = lead && total > 0 ? Math.round((lead.amount / total) * 100) : 0;
  const next = fit.find((row) => !row.usage);
  const decision = top ? (() => {
        const partial = items.some((item) => item.kind === "price" || item.kind === "freemium");
        const showPreview = !!(top.plans?.length || top.kind === "pair" || top.savePrice || (top.kind === "freemium" && top.options));
        const links: DecisionLink[] = [
          ...(top.link ? [{ label: top.link.label, href: top.link.to, onClick: () => { top.link?.onClick?.(); navigate(top.link!.to); } }] : []),
          ...(top.cancelReview ? [{ label: top.cancelReview.label, onClick: top.cancelReview.onClick }] : []),
          ...(top.bulk ? [{ label: top.bulk.label, onClick: top.bulk.onClick }] : []),
          ...(order.length > 1 ? [{ label: t("Plus tard", "Later"), quiet: true, onClick: () => { setFirst(null); setLater((keys) => [...keys.filter((key) => key !== top.key), top.key]); } }] : []),
          ...((top.savePrice || (top.plans && top.plans.length > 0)) && top.kind === "price" ? top.actions.map((action) => ({ label: t("Devise, utilisateurs ou facture annuelle", "Currency, users or yearly billing"), onClick: action.onClick })) : []),
        ];
        // Every plan question reads the same way: rows to tap. With no plan in the catalogue, the two answers (free, paid) become two rows.
        const tiles = top.plans && top.plans.length > 0 ? top.plans
          : top.kind === "freemium" && top.options ? top.options.map((option) => {
            const action = top.actions.find((candidate) => (option.amount > 0) === !!candidate.primary);
            return { key: option.label, label: option.amount > 0 ? t("Payant", "Paid") : option.label, monthly: option.amount, note: option.amount > 0 ? t("prix de départ", "starting price") : undefined, perSeat: false, pick: () => action?.onClick() };
          }) : null;
        const chosen = tiles?.find((plan) => plan.key === seatPlan);
        const max = Math.max(1, ...(tiles ?? []).map((x) => x.monthly));
        const workTime = (monthly: number) => { if (!hourly) return null; if (monthly === 0) return t("0 min de votre travail", "0 min of your work"); const minutes = Math.max(1, Math.round((monthly / hourly) * 60)); return minutes < 60 ? t(`≈ ${minutes} min de votre travail`, `≈ ${minutes} min of your work`) : t(`≈ ${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} de votre travail`, `≈ ${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} of your work`); };
        const per = t("/mois", "/mo");
        return <Decision dense key={`${top.key}-${flash}`} lang={fr ? "fr" : "en"} kind={top.kind} label={t("Prochaine décision", "Next decision")} flash={!!flash}
          eyebrow={guide && (top.kind === "price" || top.kind === "freemium") ? t("Étape suivante", "Next step") : t("Votre décision", "Your decision")}
          step={peak > 1 ? { current: step, total: peak } : undefined}
          media={top.kind !== "pair" ? <Logo tool={top.tools[0]} size={40} />
            : top.tools.length > 1 ? <Meet play={picked === 0 || picked === 1} kept={picked === 1 ? "right" : "left"} badge={t("Doublon", "Duplicate")} left={<Logo tool={top.tools[0]} size={32} />} right={<Logo tool={top.tools[1]} size={32} />} /> : undefined}
          title={top.kind === "price" && !(top.plans && top.plans.length) ? t(`Combien vous coûte ${top.tools[0].name} par mois\u00a0?`, `How much does ${top.tools[0].name} cost you a month?`) : top.title}
          detail={guide && (top.kind === "price" || top.kind === "freemium") ? t("Pour un budget juste, dites-nous laquelle vous payez. Gratuite, ça compte aussi.", "For an honest budget, tell us which one you pay. Free counts too.") : top.detail}
          links={links}
          preview={showPreview ? {
            label: partial ? t("Budget partiel", "Partial budget") : t("Budget estimé", "Estimated budget"),
            ...(preview === null && total === 0 && partial ? { value: t("À renseigner", "Not set yet") } : { value: format(preview ?? total), unit: per }),
            delta: preview !== null && preview !== total ? { text: `${preview > total ? "+" : "−"}${format(Math.abs(preview - total))}`, down: preview < total } : null,
          } : undefined}>
          {/* A duplicate: keep one, keep the other, or keep both; each says what it does to the budget. */}
          {top.kind === "pair" && (() => {
            const both = top.actions.find((action) => !top.tools.some((candidate) => action.label.endsWith(candidate.name)));
            const sum = (top.costs?.[0] ?? 0) + (top.costs?.[1] ?? 0);
            const state = (index: number) => picked === null ? undefined : picked === index ? "kept" as const : "gone" as const;
            return <Choices>
              {top.tools.slice(0, 2).map((tool, index) => {
                const keep = top.actions.find((action) => action.label.endsWith(tool.name));
                const own = top.costs?.[index] ?? 0, other = top.costs?.[1 - index] ?? 0;
                const gone = top.tools[1 - index];
                return <Choice key={tool.id} data-choice="keep" media={<Stamp play={picked === index} label={t("Gardé", "Kept")}><Logo tool={tool} /></Stamp>} name={<>{t("Garder", "Keep")} {tool.name}</>} tag={own < other ? t("Le moins cher", "Cheaper") : undefined}
                  note={`${gone ? t(`${gone.name} quitte la stack`, `${gone.name} leaves the stack`) : ""} · ${own > 0 ? t(`seul, ${format(own)}/mois`, `alone, ${format(own)}/mo`) : t("seul, gratuit", "alone, free")}`}
                  amount={other > 0 ? `−${format(other)}` : t("Aucune économie", "No saving")} unit={other > 0 ? per : undefined} saving={other > 0}
                  state={state(index)} checked={picked === index} disabled={picked !== null} ariaLabel={keep?.ariaLabel || keep?.label}
                  onClick={() => pick(index, keep?.onClick)} onPreview={(on) => setPreview(on ? total - other : null)} />;
              })}
              {both && <Choice data-choice="both" pair media={<>{top.tools.slice(0, 2).map((item) => <Logo key={item.id} tool={item} size={32} />)}</>} name={both.label}
                note={t(`Les deux restent · ${format(sum)}/mois`, `Both stay · ${format(sum)}/mo`)} amount={t("Inchangé", "Unchanged")}
                state={state(2)} checked={picked === 2} disabled={picked !== null} ariaLabel={both.label}
                onClick={() => pick(2, both.onClick)} onPreview={(on) => setPreview(on ? total : null)} />}
            </Choices>;
          })()}
          {/* Step 2 of a per-user plan: how many people. */}
          {chosen && <Seats lang={fr ? "fr" : "en"} plan={chosen.label} seats={seats} total={format(chosen.monthly * seats)}
            onChange={(n) => { setSeats(n); setPreview(total + chosen.monthly * n); }} onConfirm={() => chosen.pick(seats)} onChangePlan={() => { setSeatPlan(null); setPreview(null); }} />}
          {/* A plan question: one row per plan, the price on the right. */}
          {tiles && !chosen && <Choices radio label={t("Votre formule", "Your plan")}>
            {tiles.map((plan) => {
              const [, main, qualifier] = /^(.*?)\s*\((.+)\)\s*$/.exec(plan.label) ?? [null, plan.label, null];
              const PlanIcon = plan.monthly === 0 ? Moon : plan.monthly >= max ? Rocket : Zap;
              const detail = [qualifier, plan.monthly === 0 ? t("Rien à payer", "Nothing to pay") : plan.note || t("par mois", "a month"), workTime(plan.monthly)].filter(Boolean).join(" · ");
              return <Choice key={plan.key} role="radio" data-plan={plan.key} media={<IconTile><PlanIcon /></IconTile>} name={main} note={detail}
                amount={plan.monthly > 0 ? format(plan.monthly) : t("Gratuit", "Free")} unit={plan.monthly > 0 ? per : undefined}
                state={pickedTile === null ? undefined : pickedTile === plan.key ? "kept" : "gone"} checked={pickedTile === plan.key}
                onPreview={(on) => setPreview(on ? total + plan.monthly : null)}
                onClick={() => { if (plan.perSeat) { setSeatPlan(plan.key); setSeats(1); setPreview(total + plan.monthly); } else pickTile(plan.key, () => plan.pick()); }} />;
            })}
          </Choices>}
          {/* No plan in the catalogue: the only case with an amount to type. */}
          {top.savePrice && (!top.plans || top.plans.length === 0) && <StackInvoiceEntry key={`${scope}:${scopeEpoch}:${top.key}`} currency={currency} lang={lang} onSave={top.savePrice} onPreview={previewInvoice} />}
          {/* Any other question answers with its own buttons. */}
          {!top.savePrice && !(top.plans && top.plans.length) && !(top.kind === "freemium" && top.options) && top.kind !== "pair" && top.actions.length > 0 && <Choices>
            {top.actions.map((action) => <Choice key={action.label} media={<Logo tool={top.tools[0]} />} name={action.label} amount="" ariaLabel={action.ariaLabel} onClick={action.onClick} />)}
          </Choices>}
          {toolCount <= 1 && history}
        </Decision>;
      })() : null;
  const toggle = (id: string, row: string[]) => ({ open: openTile === id, condensed: !!openTile && openTile !== id && row.includes(openTile),
    onToggle: () => setOpenTile((value) => (value === id ? null : id)), moreLabel: t("Voir le détail", "See the detail"), lessLabel: t("Réduire", "Collapse") });
  const facts = ["price", "split"], questions = ["decision", "usage"];
  const showSplit = toolCount > 1 && total > 0 && shares.length > 0;
  // A question tile leaves once nothing is left to ask, unless the game revealed something: then it stays as a fact.
  const dust = fit.filter((row) => row.usage !== undefined && row.usage !== null && row.usage < 2);
  const dustTotal = dust.reduce((sum, row) => sum + row.cost, 0);
  // The three steps of the dashboard (M01): overlaps settled, prices known, the essentials covered.
  const allSettled = !items.some((item) => item.kind === "pair") && unsure.length === 0 && gaps.length === 0;
  // « Ce qui sert vraiment » is the bonus step: offered once the stack is on point (M01 design v2).
  const settledSteps = [!items.some((item) => item.kind === "pair"), unsure.length === 0, gaps.length === 0].filter(Boolean).length;
  // The level the person reaches (0 « En vrac » to 3 « Stack au top »): sent when it changes, not on every visit.
  const lastLevel = useRef<number | null>(null);
  useEffect(() => {
    if (toolCount < 2) return;
    if (lastLevel.current !== null && lastLevel.current !== settledSteps) trackEvent("stack_level", { level: settledSteps, from: lastLevel.current });
    lastLevel.current = settledSteps;
  }, [settledSteps, toolCount]);
  const showUsage = allSettled && toolCount > 1 && fit.length > 0 && (!!next || dustTotal > 0);

  // The story of the page (11/11/2026): the premise without a box, then the bento, read as chapters in the
  // order of the story: where the money goes, what overlaps (or is left to confirm), what really serves,
  // the result. A question tile leaves once answered; the result comes with the first saving.
  // The trim, the signature gesture (planche; placed 11/11/2026): when a « keep one » decision has just saved
  // something, the Result tile plays it once with the stack's paid tools and the ones just let go, then rests.
  const [trim, setTrim] = useState<{ tools: { id: string; node: ReactNode; cut?: "fall" | "cling" }[]; before: number; delta: number; sentence: string; cut: boolean } | null>(null);
  const lastSaved = useRef(saved);
  const trimTimers = useRef<number[]>([]);
  const lastGone = useRef(new Set(resolved.filter((r) => r.kind === "keep-one" && r.removed).map((r) => r.removed!)));
  useEffect(() => {
    const goneNow = resolved.filter((r) => r.kind === "keep-one" && r.removed && !lastGone.current.has(r.removed));
    const delta = saved - lastSaved.current;
    lastSaved.current = saved;
    goneNow.forEach((r) => lastGone.current.add(r.removed!));
    if (delta <= 0 || goneNow.length === 0) return;
    const leaving = goneNow.flatMap((r) => [r.a, r.b].filter((tool) => toolKey(tool) === r.removed));
    const keptBy = goneNow.flatMap((r) => [r.a, r.b].filter((tool) => toolKey(tool) !== r.removed));
    const staying = spend.map((row) => row.tool).filter((tool) => !leaving.some((gone) => gone.id === tool.id)).slice(0, Math.max(1, 5 - leaving.length));
    const tools: { id: string; node: ReactNode; cut?: "fall" | "cling" }[] = staying.map((tool) => ({ id: tool.id, node: <Logo tool={tool} size={40} /> }));
    leaving.forEach((tool, index) => tools.splice(Math.min(tools.length, 1 + index * 2), 0, { id: tool.id, node: <Logo tool={tool} size={40} />, cut: index === leaving.length - 1 && leaving.length > 1 ? "cling" as const : "fall" as const }));
    const names = (list: ToolSummary[]) => list.map((tool) => tool.name).join(t(" et ", " and "));
    const sentence = leaving.length > 1
      ? t(`${names(leaving)} faisaient le travail de ${names(keptBy)}.`, `${names(leaving)} were doing ${names(keptBy)}'s job.`)
      : t(`${names(leaving)} faisait le travail de ${names(keptBy)}.`, `${names(leaving)} was doing ${names(keptBy)}'s job.`);
    setTrim({ tools, before: total + delta, delta, sentence, cut: false });
    // The page re-renders while it plays: the timers live in a ref, cleared only when the page leaves.
    trimTimers.current.forEach((timer) => window.clearTimeout(timer));
    trimTimers.current = [window.setTimeout(() => setTrim((value) => value && { ...value, cut: true }), 300), window.setTimeout(() => setTrim(null), 5200)];
  }, [saved, resolved]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => trimTimers.current.forEach((timer) => window.clearTimeout(timer)), []);
  const tiles: { id: string; node: (row: string[]) => ReactNode }[] = [];
  const condensed = (id: string, row: string[]) => !!openTile && openTile !== id && row.includes(openTile);
  // The split left the bento for its own section, « Où va votre budget » (M01, 14/11/2026).
  if (decision && top) tiles.push({ id: "decision", node: (row) => <Tile key="decision" span={12} tone="question"
    label={`${top.kind === "pair" ? t("Ce qui se recoupe", "What overlaps") : t("Ce qui reste à préciser", "What is left to confirm")}${peak > 1 ? ` · ${t(`${step} sur ${peak}`, `${step} of ${peak}`)}` : ""}`}
    condensed={condensed("decision", row)}>{decision}</Tile> });
  if (showUsage) tiles.push({ id: "usage", node: (row) => <Tile key="usage" span={5} tone={next ? "question" : "tile"} card="usage-tile"
    label={next ? t(`Ce qui sert vraiment · ${fit.filter((r) => !r.usage).length} carte${fit.filter((r) => !r.usage).length > 1 ? "s" : ""}`, `What really serves · ${fit.filter((r) => !r.usage).length} card${fit.filter((r) => !r.usage).length > 1 ? "s" : ""}`) : t("Ce qui sert vraiment", "What really serves")}
    statement={next ? undefined : <Amount size="figure" tone="overlap" value={format(Math.round(dustTotal))} unit={t("/mois", "/mo")} />}
    status={next ? undefined : { text: t(`prennent la poussière chez ${dust.map((r) => r.tool.name).join(", ")}.`, `gathering dust with ${dust.map((r) => r.tool.name).join(", ")}.`) }}
    detail={<StackUsagePlay key={`${scope}:${scopeEpoch}`} rows={fit} lang={lang} format={format} dense
      freeOnly={total === 0 && freeTools.length === toolCount} history={top ? history : undefined} onReviewTools={onReviewTools} />}
    {...toggle("usage", row)}>
    {next && <Question media={<Logo tool={next.tool} size={40} />}>{t(`${next.tool.name}, vous vous en servez vraiment ?`, `${next.tool.name}, do you really use it?`)}</Question>}
    {next && <Answers label={t("Votre réponse", "Your answer")}>
      {([[5, "Tous les jours", "Every day"], [3, "Parfois", "Sometimes"], [1, "Prend la poussière", "Gathers dust"]] as const).map(([level, a, b]) => <Answer key={level} name={t(a, b)} tone={level === 1 ? "cut" : "ink"} onClick={() => next.setUsage(level)} />)}
    </Answers>}
  </Tile> });
  // The result left its tile (M01): the saving is said in the hero, the history stays with the decision.
  const rows = [tiles.slice(0, 2), tiles.slice(2, 4)].filter((row) => row.length > 0);

  // What the stack is made of, in one sentence: « Dont 2 payants et 2 à préciser. »
  const paidCount = budgetTools.filter((tool) => tool.paid === true).length, freeCount = budgetTools.filter((tool) => tool.paid === false).length, unknownCount = budgetTools.length - paidCount - freeCount;
  const parts = [
    paidCount > 0 && t(`${paidCount} payant${paidCount > 1 ? "s" : ""}`, `${paidCount} paid`),
    freeCount > 0 && t(`${freeCount} gratuit${freeCount > 1 ? "s" : ""}`, `${freeCount} free`),
    unknownCount > 0 && t(`${unknownCount} à préciser`, `${unknownCount} to check`),
  ].filter(Boolean) as string[];
  const composition = parts.length > 1 ? t(`Dont ${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}.`, `Of which ${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}.`) : "";

  // The person's profile (M01): the trade in the eyebrow, the day rate under the working time.
  const profileTrade = welcome?.facts?.find((fact) => !fact.title)?.label;
  const profileRate = welcome?.facts?.find((fact) => !!fact.title)?.label;
  // The day rate turns the budget into working time (M01): said once, in the hero.
  const heroWork = total > 0 && hourly ? (() => { const minutes = Math.round((total / hourly) * 60); const h = Math.floor(minutes / 60), m = minutes % 60;
    return h > 0 ? `${h}\u00a0h${m ? `\u00a0${String(m).padStart(2, "0")}` : ""}` : `${m}\u00a0min`; })() : null;
  return <>
    {toolCount > 0 && <div data-card="price">
      {/* The hero of a dashboard (M01, 14/11/2026): the page's name and who it is for, its two actions, then the
          key figures, each said once and only here. The bento below explains them; it never repeats them. */}
      <StoryHero greeting={welcome?.greeting} titleRef={welcome?.titleRef}
        eyebrow={welcome?.eyebrow ?? t("Ma stack", "My stack")} eyebrowAside={<StackProfile lang={fr ? "fr" : "en"} />}
        title={t("Ma stack", "My stack")}
        lead={toolCount === 1 ? t("Il en faut au moins deux pour parler de stack.", "It takes at least two to call it a stack.") : undefined}
        aside={<><Button variant="primary" icon={<Plus aria-hidden />} onClick={onAddTool}>{t("Ajouter un outil", "Add a tool")}</Button>{welcome?.secondary}</>} />
      {toolCount > 1 && (() => {
        const pairs = items.filter((item) => item.kind === "pair");
        const stackLogos = [...spend.map((row) => row.tool), ...freeTools, ...pending].filter((tool, index, list) => list.findIndex((x) => x.id === tool.id) === index);
        const go = (selector: string) => (className: string, content: ReactNode) => <a className={className} href={selector}
          onClick={(event) => { const target = document.querySelector<HTMLElement>(selector); if (!target) return; event.preventDefault(); target.scrollIntoView({ block: "center", behavior: "smooth" }); }}>{content}</a>;
        const spendDetail = monthly
          ? [t(`${yearly}/an`, `${yearly}/yr`), heroWork && t(`${heroWork} de travail`, `${heroWork} of work`)].filter(Boolean).join(" · ")
          : t(`${unsure.length} prix à préciser`, `${unsure.length} price${unsure.length > 1 ? "s" : ""} to confirm`);
        return <div style={{ marginTop: "calc(var(--tt-gap-head) + var(--tt-gap-item) * 2)", marginBottom: "calc(var(--tt-board-gap) - var(--tt-page-gap))" }}><FigureCards label={t("Ma stack en chiffres", "My stack in figures")}>
          <FigureCard centered icon={<GlassIcon color="var(--tt-brand)"><Wallet /></GlassIcon>} figure={monthly ? format(Math.round(total)) : "?"} unit={monthly ? t("/mois", "/mo") : undefined} name={t("Dépense", "Spend")} detail={spendDetail} renderLink={go('[data-card="split"]')} />
          <FigureCard centered icon={<LayoutGrid />} visual={<span style={{ display: "flex" }}>{stackLogos.slice(0, 4).map((tool, index) => <span key={tool.id} style={{ marginLeft: index ? "var(--tt-logo-overlap)" : 0 }}><Logo tool={tool} size={32} /></span>)}</span>}
            figure={String(toolCount)} name={t("Outils", "Tools")} detail={composition ? composition.replace(/^(Dont|Of which) /, "").replace(/\.$/, "") : undefined} renderLink={go("#ms-all-title")} />
          <FigureCard centered icon={<GlassIcon color="var(--tt-overlap)"><Copy /></GlassIcon>} tone={pairs.length ? "overlap" : "gain"} visual={pairs[0] ? <span style={{ display: "flex", gap: "var(--tt-space-1)" }}>{pairs[0].tools.slice(0, 2).map((tool) => <Logo key={tool.id} tool={tool} size={32} />)}</span> : undefined}
            figure={String(pairs.length)} name={t(pairs.length > 1 ? "Doublons" : "Doublon", pairs.length > 1 ? "Overlaps" : "Overlap")}
            detail={pairs[0] ? t(`${pairs[0].tools[0].name} et ${pairs[0].tools[1]?.name ?? ""} se marchent dessus`, `${pairs[0].tools[0].name} and ${pairs[0].tools[1]?.name ?? ""} step on each other`) : t("Chacun son rôle", "Each to its role")} renderLink={go('[data-card="decision"]')} />
          <FigureCard centered icon={<GlassIcon color="var(--tt-live)"><PiggyBank /></GlassIcon>} tone={saved > 0 ? "gain" : "ink"} figure={saved > 0 ? `−${format(Math.round(saved))}` : format(0)} unit={t("/mois", "/mo")} name={t("Économisé", "Saved")}
            detail={saved > 0 ? t("par vos décisions", "by your decisions") : t("La tirelire attend son premier choix", "The piggy bank awaits your first call")} renderLink={go('[data-card="decision"]')} />
        </FigureCards>
</div>;
      })()}
    </div>}
    {/* The dashboard (M01, 14/11/2026): four tiles, each a finding with its picture and the action that settles it.
        They carry what the « worth a look » list said, so the list is gone. */}
    {toolCount > 1 && (() => {
      const scrollTo = (selector: string) => { const target = document.querySelector<HTMLElement>(selector); target?.scrollIntoView({ block: "center", behavior: "smooth" }); target?.querySelector<HTMLElement>("h3, button")?.focus({ preventScroll: true }); };
      const pair = items.find((item) => item.kind === "pair");
      const coveredCount = CORE_TRADES.filter((id) => covered.includes(id)).length;
      const gap = gaps[0];
      const logos = <span style={{ display: "flex", gap: 4 }}>{[...spend.map((row) => row.tool), ...freeTools, ...pending].filter((tool, index, list) => list.findIndex((x) => x.id === tool.id) === index).slice(0, 6).map((tool) => <Logo key={tool.id} tool={tool} size={32} />)}</span>;
      // The stack's state (M01, 14/11/2026, Michael: « de la stack en bordel à la stack au top »): three checks, each
      // open one carries its action, each settled one shrinks to a ticked line. Good news takes one line, not a tile.
      const checks = [
        { id: "overlap", name: t("Doublons", "Overlaps"), icon: <Copy />, done: !pair,
          note: pair ? t(`${pair.tools[0].name} ou ${pair.tools[1]?.name ?? ""} ?`, `${pair.tools[0].name} or ${pair.tools[1]?.name ?? ""}?`) : t("Aucun", "None"),
          action: <TextButton onClick={() => { trackEvent("stack_step_click", { step: "overlap" }); scrollTo('[data-card="decision"]'); }}>{t("Départager", "Settle it")}</TextButton> },
        { id: "prices", name: t("Prix", "Prices"), icon: <Euro />, done: unsure.length === 0,
          note: unsure.length ? t(`${unsure.length} à préciser`, `${unsure.length} to confirm`) : t("Tous connus", "All known"),
          action: <TextButton onClick={() => { trackEvent("stack_step_click", { step: "prices" }); scrollTo('[data-card="decision"]'); }}>{t("Renseigner", "Add")}</TextButton> },
        { id: "gap", name: t("Facturer", "Invoicing"), icon: <Receipt />, done: !gap,
          note: gap ? t("Aucun outil", "No tool") : t("Couvert", "Covered"),
          action: <TextButton onClick={() => { trackEvent("stack_step_click", { step: "gap" }); scrollTo("#ms-recos-title"); }}>{t("Voir des outils", "See tools")}</TextButton> },
      ];
      const done = checks.filter((check) => check.done).length;
      const level = [
        [t("En vrac", "All over the place"), t("Un peu le tiroir à câbles. On range ensemble, en trois étapes.", "A bit like the cable drawer. Let's tidy up, in three steps.")],
        [t("Ça prend forme", "Taking shape"), t("Encore deux étapes et c'est rangé.", "Two more steps and it's tidy.")],
        [t("Presque au top", "Nearly there"), t("Une dernière étape.", "One last step.")],
        [t("Stack au top", "Stack on point"), t("Rangée, chiffrée, complète. Allez prendre un café.", "Tidy, priced, complete. Go grab a coffee.")],
      ][done];
      return <Bento compact label={t("Ma stack en bref", "My stack at a glance")}>
        <BentoRow>
          <Tile span={7} label={t("Vos métiers", "Your trades")} bloom={[(() => { const i = CORE_TRADES.findIndex((id) => covered.includes(id)); return `var(--tt-area-${(i < 0 ? 0 : i) + 1})`; })(), "var(--tt-area-3)"]}
            statement={<><Key>{coveredCount}</Key>{t(` sur ${CORE_TRADES.length}`, ` of ${CORE_TRADES.length}`)}</>}
            status={{ text: (() => { const missing = CORE_TRADES.find((id) => !covered.includes(id)); return missing ? t(...TRADE_JOKES[missing]) : t("Tout le métier est couvert. Rien ne dépasse.", "The whole job is covered. Nothing sticks out."); })(), done: coveredCount === CORE_TRADES.length }}
            footer={<div style={{ display: "grid", gap: "var(--tt-space-8)" }}><TradeMap label={t("Vos métiers", "Your trades")} addLabel={(name) => t(`Ajouter un outil pour ${name}`, `Add a tool for ${name}`)} onAdd={() => onAddTool()}
              trades={CORE_TRADES.map((id) => ({ id, name: t(...TRADE_NAMES[id]), icon: TRADE_ICONS[id], tools: territories.find((territory) => territory.id === id)?.tools ?? [], color: `var(--tt-area-${CORE_TRADES.indexOf(id) + 1})` }))} />
              {coveredCount < CORE_TRADES.length && <span><TextButton arrow onClick={onAddTool}>{t(`Compléter ma stack · ${CORE_TRADES.length - coveredCount} métier${CORE_TRADES.length - coveredCount > 1 ? "s" : ""} à couvrir`, `Complete my stack · ${CORE_TRADES.length - coveredCount} trade${CORE_TRADES.length - coveredCount > 1 ? "s" : ""} to cover`)}</TextButton></span>}
            </div>} />
          <Tile span={5} label={`${t("À faire", "To do")} · ${level[0]}`} tone={done < checks.length ? "smoke" : "tile"}
            wash={[done === checks.length ? "var(--tt-live)" : done === 0 ? "var(--tt-overlap)" : "var(--tt-brand)"]}
            statement={done === checks.length ? <Key tone="gain">{t("Rien", "Nothing")}</Key> : <><Key tone={done === 0 ? "overlap" : "brand"}>{checks.length - done}</Key>{t(` étape${checks.length - done > 1 ? "s" : ""}`, ` step${checks.length - done > 1 ? "s" : ""}`)}</>}
            footer={<Checkpoints layout="list" progressLabel={t(`${done} étape${done > 1 ? "s" : ""} sur ${checks.length} réglée${done > 1 ? "s" : ""}`, `${done} of ${checks.length} steps settled`)} label={t("Étapes", "Steps")} steps={checks.map((check) => ({ id: check.id, name: check.name, icon: check.icon, done: check.done, note: check.note, action: check.action }))} />} />
        </BentoRow>
        {spend.length >= 2 && (() => {
          const areaOf = (id: string) => areas.find((area) => (area.tools || []).some((row) => row.tool.id === id))?.label;
          const overlapOf = (id: string) => { const pair = items.find((item) => item.kind === "pair" && item.tools.some((tool) => tool.id === id)); return pair?.tools.find((tool) => tool.id !== id)?.name; };
          const top = spend[0], topShare = Math.round((top.amount / (total || 1)) * 100);
          // What deciding the overlaps can save: the cheaper priced tool of each pair, counted once.
          const amountOf = (id: string) => spend.find((row) => row.tool.id === id)?.amount;
          const saveable = items.filter((item) => item.kind === "pair").reduce((sum, item) => {
            const costs = item.tools.slice(0, 2).map((tool) => amountOf(tool.id)).filter((amount): amount is number => amount !== undefined);
            return costs.length === 2 ? sum + Math.min(...costs) : sum;
          }, 0);
          return <BentoRow>
            <Tile span={12} card="split" label={t("Où va l'argent", "Where the money goes")} bloom={saveable > 0 ? ["var(--tt-overlap)", "var(--tt-area-5)"] : ["var(--tt-brand)", "var(--tt-area-3)"]}
              statement={saveable > 0
                ? <><Key tone="overlap">{format(Math.round(saveable))}</Key>{t(" par mois à trancher", " a month to settle")}</>
                : <><Key>{topShare}{"\u00a0"}%</Key>{t(` pour ${top.tool.name}`, ` for ${top.tool.name}`)}</>}
              status={{ text: saveable > 0
                ? t("C'est ce que coûte le moins cher de chaque doublon. À vous de choisir lequel garder.", "That's what the cheaper tool of each overlap costs. You choose which one to keep.")
                : topShare >= 50 ? t("Il a le sens des priorités. Ou de l'addition.", "It knows its priorities. Or the bill.") : t("L'argent est bien réparti. Rien ne fait de l'ombre au reste.", "The money is well spread. Nothing overshadows the rest.") }}
              footer={<SpendBar label={t("Répartition par outil", "Split by tool")} format={format}
                items={spend.map((row) => ({ id: row.tool.id, tool: row.tool, amount: row.amount, area: areaOf(row.tool.id), overlapWith: overlapOf(row.tool.id) }))}
                otherLabel={(count) => t(`${count} autres outils`, `${count} other tools`)} overlapLabel={(other) => t(`Doublon avec ${other}`, `Overlaps with ${other}`)}
                unpriced={pending.filter((tool) => !spend.some((line) => line.tool.id === tool.id))} unpricedLabel={t("Sans prix, pas comptés", "No price, not counted")}
                priceAction={<TextButton onClick={() => { const target = document.querySelector<HTMLElement>('[data-card="decision"]'); target?.scrollIntoView({ block: "center", behavior: "smooth" }); }}>{t("Renseigner", "Add prices")}</TextButton>}
                note={converted ? t(`Montants convertis au taux de référence du ${rateDate}.`, `Amounts converted at the reference rate of ${rateDate}.`) : undefined} />} />
          </BentoRow>;
        })()}
      </Bento>;
    })()}
    {toolCount === 1 && !decision && <Bento label={t("Pour commencer", "To start")}><BentoRow><Starter lang={fr ? "fr" : "en"} tool={spend[0]?.tool || freeTools[0]} onAddTool={onAddTool} /></BentoRow></Bento>}
    {rows.length > 0 && <Bento label={t("Étape en cours", "Current step")}>
      {rows.map((row) => <BentoRow key={row.map((tile) => tile.id).join("-")}>{row.map((tile) => tile.node(row.map((x) => x.id)))}</BentoRow>)}
    </Bento>}
  </>;
}
