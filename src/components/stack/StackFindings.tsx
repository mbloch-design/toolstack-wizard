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
import Bento, { Answer, Answers, BentoRow, MiniRing, Question, Tile } from "@/ds/Bento/Bento";
import Amount from "@/ds/Amount/Amount";
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
  /** The hero's words (greeting, verdict, humour) and its actions; the findings add the cost. */
  welcome?: StackWelcome & { titleRef?: Ref<HTMLHeadingElement>; action?: ReactNode; secondary?: ReactNode };
}

export type FitRow = { tool: ToolSummary; cost: number; usage?: number; setUsage: (value: number | null) => void; detailHref: string };



// Ma stack in one screen, read in order (22/10/2026): first what the stack
// costs, then the one thing to decide now, then, quietly, what comes next.
// Settling the current finding brings the next one in; once nothing is left,
// the space becomes the summary of what was decided and what it saved.
export default function StackFindings({ lang, currency = "EUR", converted = false, total, format, spend, areas, toolCount, freeTools = [], fit, items, reviewFindingKey, saved, toReview, resolved, history, onAddTool, onReviewTools, exploreHref, guide, hourly, welcome }: Props) {
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
      })() : null;
  const toggle = (id: string, row: string[]) => ({ open: openTile === id, condensed: !!openTile && openTile !== id && row.includes(openTile),
    onToggle: () => setOpenTile((value) => (value === id ? null : id)), moreLabel: t("Voir le détail", "See the detail"), lessLabel: t("Réduire", "Collapse") });
  const facts = ["price", "split"], questions = ["decision", "usage"];
  const showSplit = toolCount > 1 && total > 0 && shares.length > 0;
  // A question tile leaves once nothing is left to ask, unless the game revealed something: then it stays as a fact.
  const dust = fit.filter((row) => row.usage !== undefined && row.usage !== null && row.usage < 2);
  const dustTotal = dust.reduce((sum, row) => sum + row.cost, 0);
  const showUsage = toolCount > 1 && fit.length > 0 && (!!next || dustTotal > 0);

  // The story of the page (11/11/2026): the premise without a box, then the bento, read as chapters in the
  // order of the story: where the money goes, what overlaps (or is left to confirm), what really serves,
  // the result. A question tile leaves once answered; the result comes with the first saving.
  const tiles: { id: string; node: (row: string[]) => ReactNode }[] = [];
  const condensed = (id: string, row: string[]) => !!openTile && openTile !== id && row.includes(openTile);
  if (showSplit) tiles.push({ id: "split", node: (row) => <Tile key="split" span={5} card="split" label={t("Où va l’argent", "Where the money goes")} art={<MiniRing parts={shares.map((area) => ({ color: area.color, share: area.amount / total }))} />}
    statement={<Key>{`${leadShare}\u00a0%`}</Key>}
    status={{ text: t(`dans « ${lead.label} ».${spend[0] ? ` ${spend[0].tool.name} pèse le plus lourd.` : ""}`, `in « ${lead.label} ».${spend[0] ? ` ${spend[0].tool.name} weighs the most.` : ""}`) }}
    detail={<Split lang={fr ? "fr" : "en"} format={format} dense unpriced={pending.filter((tool) => !spend.some((line) => line.tool.id === tool.id)).map((tool) => tool.name)} rateDate={converted ? rateDate : null}
      areas={areas.map((area) => ({ id: area.id, label: area.label, color: area.color, amount: area.amount, tools: (area.tools || []).map((row) => ({ ...row.tool, amount: row.amount })) }))} />}
    {...toggle("split", row)} /> });
  if (decision && top) tiles.push({ id: "decision", node: (row) => <Tile key="decision" span={7} tone="question"
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
  if (saved > 0 || (!top && history)) tiles.push({ id: "result", node: () => <Tile key="result" span={7} label={t("Résultat", "Result")}
    statement={saved > 0 ? <Ending figure={<Amount size="figure" value={`−${format(Math.round(saved))}`} unit={t("/mois", "/mo")} />} /> : undefined}
    status={saved > 0 ? { text: <>{t("Vous économisez déjà ", "You're already saving ")}{format(Math.round(saved))}{t(" par mois.", " a month.")}</>, done: true } : undefined}
    footer={history || undefined} /> });
  const rows = [tiles.slice(0, 2), tiles.slice(2, 4)].filter((row) => row.length > 0);

  // What the stack is made of, in one sentence: « Dont 2 payants et 2 à préciser. »
  const paidCount = budgetTools.filter((tool) => tool.paid === true).length, freeCount = budgetTools.filter((tool) => tool.paid === false).length, unknownCount = budgetTools.length - paidCount - freeCount;
  const parts = [
    paidCount > 0 && t(`${paidCount} payant${paidCount > 1 ? "s" : ""}`, `${paidCount} paid`),
    freeCount > 0 && t(`${freeCount} gratuit${freeCount > 1 ? "s" : ""}`, `${freeCount} free`),
    unknownCount > 0 && t(`${unknownCount} à préciser`, `${unknownCount} to check`),
  ].filter(Boolean) as string[];
  const composition = parts.length > 1 ? t(`Dont ${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}.`, `Of which ${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}.`) : "";

  return <>
    {toolCount > 0 && <div data-card="price">
      <StoryHero greeting={welcome?.greeting} eyebrow={welcome?.eyebrow ?? t("Ma stack", "My stack")} titleRef={welcome?.titleRef}
        title={monthly
          ? <>{t(`${toolCount} outil${toolCount > 1 ? "s" : ""}, `, `${toolCount} tool${toolCount > 1 ? "s" : ""}, `)}<Key>{monthly}</Key>{t(" par mois.", " a month.")}</>
          : t("On fait les comptes ?", "Let's talk budget.")}
        lead={monthly
          ? <>{composition && <>{composition} </>}{t("Soit ", "That's ")}{yearly}{t(" par an", " a year")}{unsure.length > 0 ? t(`, d’après ${known} prix sur ${budgetTools.length}. On affine en chemin.`, `, from ${known} of ${budgetTools.length} prices. We refine as we go.`) : t(". Tous les prix sont renseignés.", ". Every price is known.")}</>
          : t("Dites-nous quelle formule vous utilisez. Promis, pas de tableur.", "Tell us which plan you use. No spreadsheet required, promise.")}
        aside={<>
          {(welcome?.facts ?? []).map((fact) => <Tag key={fact.label} title={fact.title}>{fact.label}</Tag>)}
          {budgetTools.length > 0 && monthly && unsure.length > 0 && <BudgetTrust lang={fr ? "fr" : "en"} known={known} total={budgetTools.length} left={left} onConfirmNext={confirmNext} />}
          {welcome?.secondary}
        </>} />
    </div>}
    {toolCount === 1 && !decision && <Bento label={t("Pour commencer", "To start")}><BentoRow><Starter lang={fr ? "fr" : "en"} tool={spend[0]?.tool || freeTools[0]} onAddTool={onAddTool} /></BentoRow></Bento>}
    {rows.length > 0 && <Bento label={t("Ma stack en bref", "My stack at a glance")}>
      {rows.map((row) => <BentoRow key={row.map((tile) => tile.id).join("-")}>{row.map((tile) => tile.node(row.map((x) => x.id)))}</BentoRow>)}
    </Bento>}
  </>;
}
