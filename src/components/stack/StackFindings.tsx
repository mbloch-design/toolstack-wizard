import StackInvoiceEntry from "@/ds/InvoiceEntry/InvoiceEntry";
import { CURRENCY_RATE_DATE, type Currency } from "@/lib/currencyRates";
import StackUsagePlay from "@/ds/UsagePlay/UsagePlay";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Rocket, Moon, Zap } from "@/lib/icons";
import Budget, { type BudgetTool } from "@/ds/Budget/Budget";
import Split from "@/ds/Split/Split";
import Decision, { DecisionRest, type DecisionLink } from "@/ds/Decision/Decision";
import Choice, { Choices, IconTile } from "@/ds/Choice/Choice";
import Seats from "@/ds/Seats/Seats";
import Logo from "@/ds/Logo/Logo";
import Board from "@/ds/Board/Board";
import Starter from "@/ds/Starter/Starter";
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
}

export type FitRow = { tool: ToolSummary; cost: number; usage?: number; setUsage: (value: number | null) => void; detailHref: string };



// Ma stack in one screen, read in order (22/10/2026): first what the stack
// costs, then the one thing to decide now, then, quietly, what comes next.
// Settling the current finding brings the next one in; once nothing is left,
// the space becomes the summary of what was decided and what it saved.
export default function StackFindings({ lang, currency = "EUR", converted = false, total, format, spend, areas, toolCount, freeTools = [], fit, items, reviewFindingKey, saved, toReview, resolved, history, onAddTool, onReviewTools, exploreHref, guide, hourly }: Props) {
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
  // The board (src/ds/Board) places the cards; each one is a design system component. The data-card wrappers carry no style.
  return <Board label={t("Ma stack en bref", "My stack at a glance")}
    budget={<div data-card="price">
        <Budget lang={fr ? "fr" : "en"} tools={budgetTools} monthly={total > 0 ? format(converted ? Math.round(total) : total) : null} yearly={total > 0 ? format(converted ? Math.round(total * 12) : total * 12) : null}
          saved={saved > 0 ? format(Math.round(saved)) : null}
          lead={spend.length > 0 && total > 0 ? { name: spend[0].tool.name, share: Math.round((spend[0].amount / total) * 100) } : null}
          unsure={{ prices: unsure.filter((item) => item.kind === "price").length, plans: unsure.filter((item) => item.kind === "freemium").length }}
          rateDate={converted ? rateDate : null}
          onConfirmNext={() => { if (!unsure[0]) return; setFirst(unsure[0].key); setLater((keys) => keys.filter((key) => key !== unsure[0].key)); setFlash(Date.now()); }}
          onStart={() => { const next = unsure[0]; if (!next) return; setFirst(next.key); setLater((keys) => keys.filter((key) => key !== next.key)); requestAnimationFrame(() => document.querySelector('[data-card="decision"]')?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })); }} />
      </div>}
    action={top ? (() => {
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
        return <Decision key={`${top.key}-${flash}`} lang={fr ? "fr" : "en"} kind={top.kind} label={t("Prochaine décision", "Next decision")} flash={!!flash}
          eyebrow={guide && (top.kind === "price" || top.kind === "freemium") ? t("Étape suivante", "Next step") : t("Votre décision", "Your decision")}
          step={peak > 1 ? { current: step, total: peak } : undefined}
          media={top.kind !== "pair" ? <Logo tool={top.tools[0]} size={40} /> : undefined}
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
                return <Choice key={tool.id} data-choice="keep" media={<Logo tool={tool} />} name={<>{t("Garder", "Keep")} {tool.name}</>} tag={own < other ? t("Le moins cher", "Cheaper") : undefined}
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
      })() : toolCount > 1 ? <DecisionRest lang={fr ? "fr" : "en"} history={history} onAddTool={onAddTool} /> : toolCount === 1 ? <Starter lang={fr ? "fr" : "en"} tool={spend[0]?.tool || freeTools[0]} onAddTool={onAddTool} /> : undefined}
    usage={(toolCount > 1 && (fit.length > 0 || !top || history) && <StackUsagePlay key={`${scope}:${scopeEpoch}`} rows={fit} lang={lang} format={format}
        freeOnly={total === 0 && freeTools.length === toolCount} history={top ? history : undefined} onReviewTools={onReviewTools} />) || undefined}
    split={(toolCount > 1 && total > 0 && <div data-card="split">
        <Split lang={fr ? "fr" : "en"} format={format} unpriced={pending.filter((tool) => !spend.some((line) => line.tool.id === tool.id)).map((tool) => tool.name)} rateDate={converted ? rateDate : null}
          areas={areas.map((area) => ({ id: area.id, label: area.label, color: area.color, amount: area.amount, tools: (area.tools || []).map((row) => ({ ...row.tool, amount: row.amount })) }))}
          />
      </div>) || undefined} />;
}
