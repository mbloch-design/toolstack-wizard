import { Input, Select } from "@/components/ui/primitives";
import { getPersonalStackScope, getPersonalStackScopeEpoch } from "@/lib/personalStackStore";
import StackArrival from "@/components/stack/StackArrival";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "@/lib/routerLinks";
import { Plus, Search, Check, X, Minus, Pencil, Compass, LayoutGrid, List, ChevronDown, Layers3, Wallet, Copy } from "@/lib/icons";
import { toast } from "sonner";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import { AREA_COLORS, AREA_OTHER } from "@/lib/stackAreas";
import { scoreOverlapPairs } from "@/components/stack/StackOverlapPairs";
import StackToolSheet from "@/components/stack/StackToolSheet";
import StackFindings, { type Finding } from "@/components/stack/StackFindings";
import { ActionRow, AppIcon, Button, Segmented } from "@/components/stack/StackKit";
import { comparisonPath } from "@/lib/comparisonLinks";
import { decisionSavingInCurrency, latestRemovedStackDecisions } from "@/lib/stackDecisions";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import StackPersonalWelcome, { isFreshFromOnboarding, markOnboarded } from "@/components/stack/StackPersonalWelcome";
import StackWelcomeToast from "@/components/stack/StackWelcomeToast";
import StackWelcome from "@/components/stack/StackWelcome";
import StackOnboarding from "@/components/stack/StackOnboarding";
import { writeStarterDraft } from "@/components/stack/StackStarter";
import { useStackUsage } from "@/hooks/useStackUsage";
import { useStackTrade } from "@/hooks/useStackTrade";
import { isUsageLevel } from "@/lib/personalStack";
import StackAccountPanel from "@/components/stack/StackAccountPanel";
import { useAddToStack } from "@/hooks/useAddToStack";
import { useCategories, useToolSummaries, useToolBySlug, type ToolSummary } from "@/hooks/useSupabaseData";
import { stackCatalogPrice, toolKey } from "@/lib/stackView";
import { stackDisplayLabel, stackPlacement, stackMapTerritories, stackRelations } from "@/lib/stackUsage";
import toolAccents from "@/data/toolAccents.json";
import { useCurrency } from "@/hooks/useCurrency";
import { getPlanChoice, useStackPaidPlans, type PlanChoice } from "@/hooks/useStackPaidPlans";
import { usablePlans } from "@/components/stack/StackCostEditor";
import { stackMonthlyCost, toolMonthlyCost } from "@/lib/stackCost";
import { convertAmount, formatAmount } from "@/lib/currencyRates";
import { pairKey, useStackDecisions } from "@/hooks/useStackDecisions";
import { trackEvent } from "@/lib/analytics";
import { buildExplorationCandidates, getExplorerHref } from "@/lib/toolExploration";
import { SEO_BASE, setHreflang, setNoindex, setSeoTags } from "@/lib/seo";

const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** What the page knows about one tool's cost. */
type MapToolInfo = { cost: string; share: number; kind: "paid" | "free" | "unknown"; pending: boolean };

export default function CartPage() {
  const { t, lang, prefix } = useLang();
  const account = useStackAccount();
  const accountProfile = useAccountExperience();
  const arrival = useRef({ owner: account.user?.id, settled: false });
  if (arrival.current.owner !== account.user?.id) arrival.current = { owner: account.user?.id, settled: false };
  if (account.user && ["synced", "syncing", "unsaved"].includes(account.syncStatus)) arrival.current.settled = true;
  const { tools, loading } = useToolSummaries();
  const { categories } = useCategories();
  const { state, persistenceStatus, pinTool, unpinTool, restoreTool, requiresAccount } = useStackPins();
  const { dailyRate } = useStackTrade();
  const inventoryHeadingRef = useRef<HTMLHeadingElement>(null);
  const { addToStack: sharedAddToStack } = useAddToStack();
  const addToStack = (slug: string, name: string, options: Parameters<typeof sharedAddToStack>[2] = {}) => {
    const wasEmpty = state.pinnedToolSlugs.length === 0;
    return sharedAddToStack(slug, name, { ...options, onAdded: () => {
      options.onAdded?.();
      if (wasEmpty) requestAnimationFrame(() => inventoryHeadingRef.current?.focus({ preventScroll: true }));
    } });
  };
  const [params, setParams] = useSearchParams();
  const [domainFilter, setDomainFilter] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const lastToolButton = useRef<HTMLButtonElement | null>(null);
  const [editing, setEditing] = useState(false);
  const [costEditorRequest, setCostEditorRequest] = useState<{slug:string;sequence:number;scope:string;epoch:number}|null>(null);
  const selectedSlug = params.get("outil");
  const lookup = useMemo(() => new Map(tools.flatMap((tool) => [[tool.id, tool], [toolKey(tool), tool]] as [string, ToolSummary][])), [tools]);
  const selectedTools = useMemo(() => Array.from(new Map(state.pinnedToolSlugs.flatMap((slug) => {
    const tool = lookup.get(slug);
    return tool ? [[tool.id, tool] as const] : [];
  })).values()), [state.pinnedToolSlugs, lookup]);
  const missing = state.pinnedToolSlugs.filter((slug) => !lookup.has(slug));
  const mapTerritories = useMemo(() => stackMapTerritories(selectedTools, categories, lang), [selectedTools, categories, lang]);
  const activeFilter = mapTerritories.some((territory) => territory.id === domainFilter) ? domainFilter : "all";
  const visibleMap = activeFilter === "all" ? mapTerritories : mapTerritories.filter((territory) => territory.id === activeFilter);
  const visibleIds = new Set(visibleMap.flatMap((territory) => territory.tools.map((tool) => tool.id)));
  const selected = selectedTools.find((tool) => toolKey(tool) === selectedSlug || tool.id === selectedSlug);
  const { tool: detail } = useToolBySlug(selected ? toolKey(selected) : undefined);
  // The hook can retain the preceding detail while a new selection loads.
  const resolved = selected && detail?.id === selected.id ? detail : selected;
  // Potential overlaps per tool, with the same rule as the Focus panel
  // (explicit catalogue alternative or shared catalogue uses), so the cards,
  // the summary and the panel always say the same thing. No score, no advice
  // to remove: the person decides.
  // Pairs kept on purpose (a decision) are no longer flagged anywhere.
  const { currency } = useCurrency();
  const hourly = dailyRate ? convertAmount(dailyRate.amount, dailyRate.currency, currency) / 7 : null;
  const { decisions, decide } = useStackDecisions(t, (amount) => `${formatAmount(amount, currency, lang)}${t("/mois", "/mo")}`, currency);
  const reviewScope = getPersonalStackScope();
  const reviewEpoch = getPersonalStackScopeEpoch(reviewScope);
  const [pairReview, setPairReview] = useState<{scope:string;epoch:number;key:string}|null>(null);
  const pairReviewTrigger = useRef<HTMLButtonElement | null>(null);
  const requestedReviewKey = pairReview?.scope === reviewScope && pairReview.epoch === reviewEpoch ? pairReview.key : null;
  const reviewKey = requestedReviewKey && decisions[requestedReviewKey]?.kind === "keep-both" && requestedReviewKey.split("|").every(slug => selectedTools.some(tool => toolKey(tool) === slug)) ? requestedReviewKey : null;
  const closePairReview = () => { setPairReview(null); requestAnimationFrame(() => { const target = pairReviewTrigger.current?.isConnected ? pairReviewTrigger.current : document.getElementById("ms-all-title"); target?.focus({ preventScroll: true }); }); };
  const overlapsById = useMemo(() => new Map(selectedTools.map((tool) => [tool.id,
    stackRelations(tool, selectedTools, categories, lang)
      .filter((relation) => (relation.explicit || relation.commonUses.length > 0) && decisions[pairKey(toolKey(tool), toolKey(relation.tool))]?.kind !== "keep-both")
      .map((relation) => relation.tool),
  ])), [selectedTools, categories, lang, decisions]);
  // Monthly cost with the same rules as By use: freemium at 0 unless declared
  // paid, total converted at the site's dated rate (Michael, 7 Oct 2026).
  const plans = useStackPaidPlans();
  const monthlyOf = (tool: ToolSummary) => { const cost = toolMonthlyCost(tool, plans.isPaid, lang); return cost.kind === "paid" ? convertAmount(cost.monthly, cost.currency, currency) : 0; };
  const stackCost = stackMonthlyCost(selectedTools, plans.isPaid, currency, lang);
  // Area colours of the budget ring, stable across the whole stack. Area colours stay those of the whole stack.
  const colorOf = (id: string) => AREA_COLORS[Math.max(0, mapTerritories.findIndex((territory) => territory.id === id))] || AREA_OTHER;
  // Hero micro-bars (Screen Time style): tools and cost split by area, in the
  // budget ring's colours, and the share of the estimated cost to review.
  const areaCosts = useMemo(() => mapTerritories.map((territory) => ({ id: territory.id, label: territory.label, tools: territory.tools.length, cost: stackMonthlyCost(territory.tools, plans.isPaid, currency, lang).total })), [mapTerritories, plans.paid, plans.choices, currency, lang]);
  // Freemium question (Michael, 7 Oct 2026): asked once per tool, at the start
  // of the story, because it sets both the budget and the estimated cost to review.
  const freemiumTools = selectedTools.filter((tool) => stackCatalogPrice(tool, lang) === "Freemium");
  const unreviewed = freemiumTools.filter((tool) => !plans.isReviewed(toolKey(tool)));
  // Hero and Overlaps section share one computation: same pairs, same amount.
  const overlapScore = useMemo(() => scoreOverlapPairs(selectedTools, categories, plans.isPaid, currency, lang, decisions), [selectedTools, categories, plans.paid, plans.choices, currency, lang, decisions]);
  const reviewingPair = reviewKey ? (() => {
    const { [reviewKey]: _previous, ...otherChoices } = decisions;
    const scored = scoreOverlapPairs(selectedTools, categories, plans.isPaid, currency, lang, otherChoices).pairs.find(({a,b}) => pairKey(toolKey(a),toolKey(b)) === reviewKey);
    if (scored) return scored;
    const [a,b] = reviewKey.split("|").map(slug => lookup.get(slug));
    return a && b ? { a, b, shared: [], explicit: false, double: Math.min(monthlyOf(a),monthlyOf(b)) } : undefined;
  })() : undefined;
  const decisionPairs = reviewingPair && !overlapScore.pairs.some(({a,b}) => pairKey(toolKey(a),toolKey(b)) === reviewKey) ? [...overlapScore.pairs, reviewingPair] : overlapScore.pairs;
  const overlapPairs = overlapScore.pairs.length;
  // The map marks only tools still in an unsettled pair (pairs kept on purpose
  // and decided pairs no longer come out of scoreOverlapPairs).
  const pairedById = useMemo(() => {
    const map = new Map<string, ToolSummary[]>();
    for (const { a, b } of overlapScore.pairs) { map.set(a.id, [...(map.get(a.id) || []), b]); map.set(b.id, [...(map.get(b.id) || []), a]); }
    return map;
  }, [overlapScore]);
  // Recommendations: catalogue relations only (extension, host app, suite,
  // ecosystem). Same-use relations are left out: they would be duplicates.
  const recos = useMemo(() => {
    if (selectedTools.length === 0) return [];
    const base = { getCategoryLabel: (tool: ToolSummary) => stackDisplayLabel(stackPlacement(tool, categories, lang).label, lang), sourceTools: selectedTools, stackEntries: state.toolEntries, tools };
    // Audited relations first; the legacy rules widen the pool but call any
    // same-suite tool an "extension", so only a real plugin keeps that word.
    const audited = buildExplorationCandidates({ ...base, relationPolicy: "audited" });
    const legacy = buildExplorationCandidates({ ...base, relationPolicy: "legacy" }).map((candidate) => candidate.direction === "extensions" && candidate.tool.tool_type !== "plugin"
      ? { ...candidate, reasonFr: `Même suite que ${candidate.relatedSource.name}`, reasonEn: `Same suite as ${candidate.relatedSource.name}` } : candidate);
    const seen = new Set<string>();
    const perSource = new Map<string, number>();
    return [...audited, ...legacy].filter((candidate) => {
      if (seen.has(candidate.tool.id) || candidate.stackState !== "new" || candidate.direction === "alternatives" || candidate.comparisonNeedsReview) return false;
      // A product's own modules ("attached to") are already part of it: not a recommendation.
      if (!/^(Extension|Outil hôte|Même suite|Même écosystème)/.test(candidate.reasonFr)) return false;
      // At most two per tool of the stack, so the picks cover the whole stack.
      const n = perSource.get(candidate.relatedSource.id) || 0;
      if (n >= 2) return false;
      perSource.set(candidate.relatedSource.id, n + 1);
      seen.add(candidate.tool.id);
      return true;
    }).slice(0, 6).map((candidate) => ({ tool: candidate.tool, reason: lang === "fr" ? candidate.reasonFr : candidate.reasonEn }));
  }, [selectedTools, categories, lang, state.toolEntries, tools]);
  const unknownTools = selectedTools.filter((tool) => toolMonthlyCost(tool, plans.isPaid, lang).kind === "unknown");
  // One page logic (Oct 2026): the stack is shown once, at the centre, and
  // read through lenses; every open question is a card in one deck; a tool is
  // "checked" once nothing about it waits for an answer, and the ring says
  // how much of the stack is checked.
  const money = (value: number) => `${formatAmount(value, currency, lang)}${t("/mois", "/mo")}`;
  // All my tools: one grid of cards, sorted by the tab the person picks.
  // How much the person uses each paid tool: the one thing the catalogue cannot know.
  // Five levels (1 asleep to 5 flat out), kept in the personal stack: they follow the account.
  const { usage, setUsage: saveUsage } = useStackUsage();
  const setUsage = (slug: string, value: number | null) => saveUsage(slug, value !== null && isUsageLevel(value) ? value : null);
  // Grouping by area is a way to sort: one menu, four orders.
  const [sortBy, setSortBy] = useState<"area" | "cost" | "name" | "recent">("area");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const groupBy = sortBy === "area" ? "area" : "none";
  const [statusFilter, setStatusFilter] = useState<"all" | "review" | "overlap">("all");
  const addedAt = new Map(state.toolEntries.map((entry) => [entry.toolSlug, entry.addedAt || ""]));
  const areaIndex = new Map(mapTerritories.flatMap((territory, index) => territory.tools.map((tool) => [tool.id, index] as const)));
  const listTools = selectedTools.filter((tool) => visibleIds.has(tool.id)).sort((a, b) => {
    const byName = a.name.localeCompare(b.name, lang);
    if (sortBy === "cost" || sortBy === "area") return monthlyOf(b) - monthlyOf(a) || byName;
    if (sortBy === "recent") return String(addedAt.get(toolKey(b)) || "").localeCompare(String(addedAt.get(toolKey(a)) || "")) || byName;
    return byName;
  });
  const pendingIds = new Set([...unreviewed, ...unknownTools].map((tool) => tool.id).concat([...pairedById.keys()]));
  const checked = selectedTools.filter((tool) => !pendingIds.has(tool.id)).length;
  const maxMonthly = Math.max(0, ...selectedTools.map(monthlyOf));
  const infoOf = (tool: ToolSummary): MapToolInfo => {
    const cost = toolMonthlyCost(tool, plans.isPaid, lang);
    const pending = pendingIds.has(tool.id);
    if (cost.kind === "paid") { const monthly = convertAmount(cost.monthly, cost.currency, currency); return { cost: `${formatAmount(monthly, currency, lang)}`, share: maxMonthly > 0 ? monthly / maxMonthly : 0, kind: "paid", pending }; }
    if (cost.kind === "unknown") return { cost: t("Prix ?", "Price?"), share: 0, kind: "unknown", pending };
    return { cost: cost.kind === "freemium-free" && !plans.isReviewed(toolKey(tool)) ? "Freemium" : t("Gratuit", "Free"), share: 0, kind: "free", pending };
  };
  const plural = (n: number, fr: string, en: string) => t(`${n} ${fr}${n > 1 ? "s" : ""}`, `${n} ${en}${n > 1 ? "s" : ""}`);
  const costFigure = stackCost.paid > 0 ? money(stackCost.total) : stackCost.unknown > 0 ? t("Non renseigné", "Unknown") : t("Rien de payant", "Nothing paid");
  // The deck: freemium plans first (they set the cost and the overlaps), then
  // the pairs, then the prices nobody has entered.
  const why = (shared: string[], explicit: boolean) => shared.length > 0
    ? t(`Usage commun : ${stackDisplayLabel(shared[0], lang).toLowerCase()}.`, `Shared use: ${shared[0].toLowerCase()}.`)
    : explicit ? t("Ces outils peuvent se remplacer selon vos besoins.", "These tools can replace each other depending on your needs.") : t("Ils font peut-être le même travail.", "They may do the same job.");
  const deckItems: Finding[] = [
    ...unreviewed.map((tool): Finding => ({
      key: `freemium:${tool.id}`, kind: "freemium", tools: [tool],
      title: t(`Quelle formule de ${tool.name} avez-vous\u00a0?`, `Which ${tool.name} plan do you have?`),
      detail: t("Précisez votre formule pour inclure cet outil dans votre budget.", "Choose your plan to include this tool in your budget."),
      options: (() => { const paid = toolMonthlyCost(tool, () => true, lang); return paid.kind === "paid" ? [{ label: t("Version gratuite", "Free plan"), amount: 0 }, { label: t("Plan payant", "Paid plan"), amount: convertAmount(paid.monthly, paid.currency, currency) }] : undefined; })(),
      actions: [
        { label: t("Non, version gratuite", "No, free version"), onClick: () => { plans.choosePlan(toolKey(tool), null); trackEvent("stack_freemium_answer", { freemium: 1, paid: 0 }); } },
        { label: t("Oui, payant", "Yes, paid"), primary: true, onClick: () => { plans.setPaid(toolKey(tool), true); plans.markReviewed([toolKey(tool)]); trackEvent("stack_freemium_answer", { freemium: 1, paid: 1 }); } },
      ],
      bulk: unreviewed.length > 1 ? { label: t(`Aucun n’est payant (${unreviewed.length})`, `None is paid (${unreviewed.length})`), onClick: () => { unreviewed.forEach(tool => plans.choosePlan(toolKey(tool), null)); trackEvent("stack_freemium_answer", { freemium: unreviewed.length, paid: 0, quick: true }); } } : undefined,
    })),
    ...decisionPairs.map(({ a, b, shared, explicit, double }): Finding => ({
      key: `pair:${pairKey(toolKey(a), toolKey(b))}`, kind: "pair", tools: [a, b],
      title: t("L’un, l’autre ou les deux\u00a0?", "One, the other, or both?"),
      detail: why(shared, explicit), costs: [monthlyOf(a), monthlyOf(b)], stake: double,
      actions: [
        ...[[a, b], [b, a]].map(([keep, drop]) => ({ label: t(`Garder ${keep.name}`, `Keep ${keep.name}`), ariaLabel: t(`Garder ${keep.name}, retirer ${drop.name}`, `Keep ${keep.name}, remove ${drop.name}`),
          onClick: () => decide("keep-one", { slug: toolKey(keep), name: keep.name }, { slug: toolKey(drop), name: drop.name }, monthlyOf(drop), "stack") })),
        { label: t("Garder les deux", "Keep both"), onClick: () => decide("keep-both", { slug: toolKey(a), name: a.name }, { slug: toolKey(b), name: b.name }, 0, "stack") },
      ],
      link: { label: t("Comparer en détail", "Compare in detail"), to: comparisonPath(prefix, toolKey(a), toolKey(b)), onClick: () => trackEvent("stack_compare_click", { source: "deck", a: toolKey(a), b: toolKey(b) }) },
    })),
    ...unknownTools.map((tool): Finding => ({
      key: `price:${tool.id}`, kind: "price", tools: [tool],
      title: t(`Quelle formule de ${tool.name} avez-vous\u00a0?`, `Which ${tool.name} plan do you have?`),
      detail: t("Ce prix manque : l’outil reste exclu du budget renseigné.", "This price is missing: the tool is excluded from the recorded budget."),
      savePrice: (amount, invoiceCurrency) => { plans.setChoice(toolKey(tool), { source: "custom", amount, currency: invoiceCurrency, period: "monthly" }); trackEvent("stack_price_saved", { tool_slug: toolKey(tool), source: "card" }); },
      actions: [{ label: t("Ajouter le prix", "Add the price"), primary: true, ariaLabel: t(`Ajouter le prix de ${tool.name}`, `Add the price of ${tool.name}`), onClick: () => { lastToolButton.current = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null; selectTool(toolKey(tool), true); } }],
    })),
  ];
  const reviewingFinding = reviewKey ? deckItems.find(item => item.key === `pair:${reviewKey}`) : null;
  if (reviewingFinding) {
    reviewingFinding.detail = t("Votre choix actuel : garder les deux. Il reste conservé tant que vous ne confirmez pas une autre réponse.", "Your current choice is to keep both. It stays saved until you confirm another answer.");
    reviewingFinding.actions = reviewingFinding.actions.map(action => ({ ...action, onClick: () => { action.onClick(); closePairReview(); } }));
    reviewingFinding.cancelReview = { label: t("Annuler la révision", "Cancel review"), onClick: closePairReview };
  }
  // The first plan or price question gets the tool's catalogue plans, one tap
  // each: most of the time the price is known, the plan is what is missing.
  const usagePending = selectedTools.length > 1 ? selectedTools.filter(tool => monthlyOf(tool) > 0 && !usage[toolKey(tool)]).length : 0;
  const planItem = deckItems.find((item) => item.kind === "freemium" || item.kind === "price");
  const planTool = planItem?.tools[0];
  const { tool: planDetail } = useToolBySlug(planTool ? toolKey(planTool) : undefined);
  if (planItem && planTool && planDetail && planDetail.id === planTool.id) {
    const slug = toolKey(planTool);
    const SEATS = /seat|utilisateur|membre|collaborateur|per user/i;
    const answer = (choice: PlanChoice | null, label: string, monthly: number) => {
      const undo = plans.choosePlan(slug, choice, planItem.kind === "freemium");
      trackEvent("stack_plan_pick", { tool_slug: slug, plan: label, source: "card" });
      toast(t(`Noté : ${planTool.name} ${label}${monthly > 0 ? `, ${money(monthly)}` : ""}.`, `Noted: ${planTool.name} ${label}${monthly > 0 ? `, ${money(monthly)}` : ""}.`), {
        duration: 5000, action: { label: t("Annuler", "Undo"), onClick: undo },
      });
    };
    const options = usablePlans(planDetail, lang).map((plan) => {
      const monthly = convertAmount(plan.billingPeriod === "annual" ? plan.nativeAmount! / 12 : plan.nativeAmount!, plan.nativeCurrency as never, currency);
      const perSeat = !!plan.pricingUnit && SEATS.test(plan.pricingUnit);
      return { key: plan.planKey, label: plan.displayName, monthly, perSeat, note: perSeat ? t("par utilisateur", "per user") : plan.billingPeriod === "annual" ? t("facturé à l’année", "billed yearly") : undefined,
        pick: (seats = 1) => answer({ source: "plan", label: plan.displayName, amount: plan.nativeAmount!, currency: plan.nativeCurrency as never, period: plan.billingPeriod as "monthly" | "annual", perSeat, seats: perSeat ? seats : undefined }, perSeat && seats > 1 ? `${plan.displayName} × ${seats}` : plan.displayName, monthly * (perSeat ? seats : 1)) };
    });
    options.sort((x, y) => x.monthly - y.monthly).splice(planItem.kind === "freemium" ? 3 : 4);
    if (options.length) planItem.plans = [...(planItem.kind === "freemium" ? [{ key: "free", label: t("Version gratuite", "Free plan"), monthly: 0, pick: () => answer(null, t("gratuit", "free"), 0) }] : []), ...options];
  }
  // What was already decided: estimated savings and pairs kept on purpose.
  const pinnedKeys = new Set(selectedTools.map(toolKey));
  const keptBoth = Object.entries(decisions).filter(([key, d]) => d.kind === "keep-both" && key.split("|").every((slug) => pinnedKeys.has(slug))).map(([key]) => key);
  const pastSavings = latestRemovedStackDecisions(decisions, pinnedKeys);
  const saved = pastSavings.reduce((sum, d) => sum + (decisionSavingInCurrency(d, currency) ?? 0), 0);
  const unknownSavings = pastSavings.some((d) => d.saving > 0 && decisionSavingInCurrency(d, currency) === null);
  // Reviewing a saved decision never deletes it; replacement happens only on confirmation.
  const history = (keptBoth.length > 0 || unknownSavings) && <div className="ms-decided">
    {unknownSavings && <span>{t("Baisse estimée : devise inconnue.", "Estimated reduction: currency unknown.")}</span>}
    {keptBoth.map(key => {
      const [a,b] = key.split("|").map(slug => lookup.get(slug));
      if (!a || !b) return null;
      return <div key={key} className="mu-pair"><p>{t(`${a.name} et ${b.name} : vous gardez les deux.`, `${a.name} and ${b.name}: you keep both.`)}</p>
        <Button variant="secondary" onClick={event => { pairReviewTrigger.current = event.currentTarget; setPairReview({scope:reviewScope,epoch:reviewEpoch,key}); requestAnimationFrame(() => {document.querySelector(".mf-now")?.scrollIntoView({block:"center"});document.getElementById("mf-now-title")?.focus({preventScroll:true});}); }}>{t("Revoir ce choix", "Review this choice")}</Button>
      </div>;
    })}
  </div>;
  const empty = state.pinnedToolSlugs.length === 0;
  const showSearch = empty || searchOpen;
  const existingIds = new Set(selectedTools.map((tool) => tool.id));
  const searchResults = useMemo(() => {
    const term = normalizeSearch(query);
    if (!term) return [];
    return tools.filter((tool) => normalizeSearch(`${tool.name} ${toolKey(tool)}`).includes(term))
      .sort((a, b) => {
        const rank = (tool: ToolSummary) => normalizeSearch(tool.name) === term ? 0 : normalizeSearch(tool.name).startsWith(term) ? 1 : 2;
        return rank(a) - rank(b) || a.name.localeCompare(b.name, lang);
      }).slice(0, 12);
  }, [query, tools, lang]);

  // Same title and description as the prerendered page, also after a
  // client-side navigation (the tab kept the previous page's title).
  useEffect(() => {
    setSeoTags({
      title: t("Ma stack — ToolTrim", "My stack — ToolTrim"),
      description: t("Composez et suivez votre stack d'outils SaaS avec ToolTrim.", "Build and track your SaaS tool stack with ToolTrim."),
      url: `${SEO_BASE}/${lang}/ma-stack`,
      locale: lang === "fr" ? "fr_FR" : "en_US",
    });
    setHreflang(`/${lang}/ma-stack`);
    // setSeoTags removes any noindex: the personal stack stays out of the index.
    setNoindex();
  }, [lang, t]);
  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);
  useEffect(() => {
    if (selectedSlug && !selected && !missing.includes(selectedSlug)) {
      const next = new URLSearchParams(params);
      next.delete("outil");
      setParams(next, { replace: true });
    }
  }, [selectedSlug, selected, state.pinnedToolSlugs, params, setParams]);

  function selectTool(slug: string, editCost = false) {
    setCostEditorRequest(previous => editCost ? {slug, sequence:(previous?.sequence ?? 0) + 1, scope:reviewScope, epoch:reviewEpoch} : null);
    const target = lookup.get(slug);
    if (target && !visibleIds.has(target.id)) setDomainFilter("all");
    const next = new URLSearchParams(params);
    next.set("outil", slug);
    setParams(next, { state: { skipScrollReset: true }, preventScrollReset: true });
    trackEvent("stack_tool_open", { tool_slug: slug });
  }
  function closeInspector() {
    setCostEditorRequest(null);
    const selectedId = selected?.id;
    if (!lastToolButton.current?.isConnected && selectedId) {
      lastToolButton.current = document.querySelector<HTMLButtonElement>(`[data-tool-id="${CSS.escape(selectedId)}"]`);
    }
    const next = new URLSearchParams(params);
    next.delete("outil");
    setParams(next, { replace: true, state: { skipScrollReset: true }, preventScrollReset: true });
    requestAnimationFrame(() => {
      const button = lastToolButton.current?.isConnected ? lastToolButton.current
        : selectedId ? document.querySelector<HTMLButtonElement>(`[data-tool-id="${CSS.escape(selectedId)}"]`) : null;
      button?.focus({ preventScroll: true });
    });
  }
  function removeTool(slug: string, name: string) {
    const index = state.toolEntries.findIndex((entry) => entry.toolSlug === slug);
    const entry = state.toolEntries[index];
    if (!entry) return;
    unpinTool(slug);
    trackEvent("stack_remove", { tool_slug: slug, source: editing ? "edit" : "sheet" });
    closeInspector();
    requestAnimationFrame(() => addRef.current?.focus({ preventScroll: true }));
    toast(t(`${name} retiré de ma stack.`, `${name} removed from your stack.`), {
      duration: 6000,
      action: { label: t("Annuler", "Undo"), onClick: () => restoreTool(entry, index) },
    });
  }
  // Filter motion (FLIP): cards leaving the filter fade out first, the ones
  // that stay glide to their new place, the ones arriving fade in, staggered.
  // Motion explains the change instead of a jump. Off for reduced motion.
  const gridRef = useRef<HTMLDivElement>(null);
  const flipFrom = useRef<Map<string, DOMRect> | null>(null);
  const filterToken = useRef(0);
  const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function cardsById() {
    return new Map([...(gridRef.current?.querySelectorAll<HTMLElement>("[data-flip-id]") || [])].map((el) => [el.dataset.flipId as string, el]));
  }
  function filterTo(id: string) {
    // Clicking the active area again goes back to all tools.
    const target = id !== "all" && id === activeFilter ? "all" : id;
    if (target === activeFilter) return;
    const token = ++filterToken.current;
    const nextIds = new Set((target === "all" ? selectedTools : mapTerritories.find((territory) => territory.id === target)?.tools || []).map((tool) => tool.id));
    if (reducedMotion()) { chooseDomain(target); return; }
    const cards = cardsById();
    const leaving = [...cards].filter(([cardId]) => !nextIds.has(cardId)).map(([, el]) => el);
    const exits = leaving.map((el) => el.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.96)" }], { duration: 140, easing: "ease-in", fill: "forwards" }));
    Promise.all(exits.map((animation) => animation.finished.catch(() => undefined))).then(() => {
      if (token !== filterToken.current) return;
      flipFrom.current = new Map([...cardsById()].map(([cardId, el]) => [cardId, el.getBoundingClientRect()]));
      exits.forEach((animation) => animation.cancel());
      chooseDomain(target);
    });
  }
  function sortTo(next: "area" | "cost" | "name" | "recent") {
    if (next === sortBy) return;
    if (!reducedMotion()) flipFrom.current = new Map([...cardsById()].map(([cardId, el]) => [cardId, el.getBoundingClientRect()]));
    setSortBy(next);
    trackEvent("stack_sort", { sort: next });
  }
  useLayoutEffect(() => {
    const from = flipFrom.current;
    flipFrom.current = null;
    if (!from || reducedMotion()) return;
    let arriving = 0;
    cardsById().forEach((el, cardId) => {
      const before = from.get(cardId);
      const now = el.getBoundingClientRect();
      if (before) {
        const dx = before.left - now.left, dy = before.top - now.top;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.2, .8, .2, 1)" });
      } else {
        el.animate([{ opacity: 0, transform: "translateY(10px) scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 320, delay: Math.min(arriving++ * 35, 280), easing: "cubic-bezier(.2, .8, .2, 1)", fill: "backwards" });
      }
    });
  }, [activeFilter, sortBy, groupBy, layout, statusFilter]);

  function chooseDomain(id: string) {
    setDomainFilter(id);
    const members = mapTerritories.find((territory) => territory.id === id)?.tools;
    if (selected && id !== "all" && !members?.some((tool) => tool.id === selected.id)) {
      const next = new URLSearchParams(params);
      next.delete("outil");
      setParams(next, { replace: true, state: { skipScrollReset: true }, preventScrollReset: true });
      lastToolButton.current = null;
    }
  }
  // One card per tool, the same in every view: logo, name, area, what the
  // person pays and one status. The views only change the arrangement.
  const statusOf = (tool: ToolSummary): "ok" | "review" | "overlap" => pairedById.has(tool.id) ? "overlap"
    : unreviewed.some((item) => item.id === tool.id) || unknownTools.some((item) => item.id === tool.id) ? "review" : "ok";
  const statusLabel = { ok: t("Prix renseigné", "Price recorded"), review: t("À vérifier", "To check"), overlap: t("Doublon", "Overlap") };
  function renderTool(tool: ToolSummary) {
    const active = selected?.id === tool.id;
    const area = mapTerritories.find((territory) => territory.tools.some((member) => member.id === tool.id));
    const slug = state.pinnedToolSlugs.find((pinned) => lookup.get(pinned)?.id === tool.id) || toolKey(tool);
    const info = infoOf(tool);
    const status = statusOf(tool);
    const cost = info.kind === "paid" ? `${info.cost}${t("/mois", "/mo")}` : info.kind === "unknown" ? t("Prix ?", "Price?") : info.cost;
    const areaLabel = area ? (area.id === "assist" ? t("IA", "AI") : area.label) : "";
    return <div key={tool.id} className="ms-card-wrap" data-flip-id={tool.id}>
      <button type="button" data-tool-id={tool.id} data-status={status} className={`ms-tool ms-inv-card${active ? " ms-tool--selected" : ""}`} aria-haspopup="dialog"
        aria-label={`${tool.name}, ${cost}, ${statusLabel[status]}`} tabIndex={editing ? -1 : undefined}
        onClick={(event) => { if (editing) return; lastToolButton.current = event.currentTarget; if (active) closeInspector(); else selectTool(toolKey(tool)); }}>
        <span className="ms-inv-logo" aria-hidden="true"><AppIcon tool={tool} /></span>
        <span className="ms-inv-name" aria-hidden="true">{tool.name}</span>
        <span className="ms-inv-area" aria-hidden="true"><i style={area ? { background: colorOf(area.id) } : undefined} />{areaLabel}</span>
        <span className="ms-inv-cost" data-tone={info.kind} aria-hidden="true">{cost}</span>
        <span className="ms-inv-status" data-status={status} aria-hidden="true">{statusLabel[status]}</span>
      </button>
      {/* Edit mode (iOS home screen): a minus badge removes the tool, with undo. */}
      {editing && <button type="button" className="ms-card-remove" onClick={() => removeTool(slug, tool.name)} aria-label={t(`Retirer ${tool.name} de ma stack`, `Remove ${tool.name} from my stack`)}><Minus size={14} aria-hidden /></button>}
    </div>;
  }


  // Add search: on top for an empty stack, in My tools otherwise (the add
  // action is a quiet button there, not a hero CTA).
  const searchPanel = showSearch && <section className="ms-search" id="ms-search" aria-label={t("Ajouter un outil", "Add a tool")}>
      <div className="ms-search-input"><Search size={20} aria-hidden /><Input appearance="stack-search"
        ref={searchRef}
        id={empty ? "ms-first-tool" : undefined}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("Rechercher par nom…", "Search by name…")}
        aria-label={t("Ajouter un outil à ma stack", "Add a tool to my stack")}
        onKeyDown={(event) => { if (event.key === "Escape" && !empty) { setSearchOpen(false); addRef.current?.focus(); } }}
      />{!empty && <button className="ms-icon-action" onClick={() => { setSearchOpen(false); addRef.current?.focus(); }} aria-label={t("Fermer la recherche", "Close search")}><X size={18} aria-hidden /></button>}</div>
      {query.trim() && <>
        <p className="ms-search-status" role="status">{searchResults.length === 0 ? t("Aucun outil trouvé.", "No tools found.") : t("Résultats du catalogue", "Catalogue results")}</p>
        <ul className="ms-results">{searchResults.map((tool) => {
          const present = existingIds.has(tool.id);
          return <li key={tool.id}><ToolLogo tool={tool} size={28} /><Link to={`${prefix}/tool/${toolKey(tool)}`}>{tool.name}</Link><button
            type="button"
            disabled={present}
            aria-label={present ? t(`${tool.name} est dans votre stack`, `${tool.name} is in your stack`) : t(`Ajouter ${tool.name}`, `Add ${tool.name}`)}
            onClick={(event) => addToStack(toolKey(tool), tool.name, { origin: event.currentTarget.closest("li") })}
          >{present ? <Check size={18} aria-hidden /> : <Plus size={18} aria-hidden />}</button></li>;
        })}</ul>
      </>}
    </section>;

  const awaitingInitialStack = account.enabled && (!account.authInitialized ||
    (!!account.user && loading && !empty && selectedTools.length === 0) ||
    (!!account.user && empty && (account.syncStatus === "connecting" || accountProfile.status === "loading")));
  if (awaitingInitialStack) return <StackArrival />;
  if (account.enabled && account.user && empty && !arrival.current.settled &&
      (account.pendingDraftChoice || account.conflict || account.syncStatus === "error")) {
    return <StackArrival pending={false}><StackAccountPanel empty /></StackArrival>;
  }
  if (requiresAccount) return <StackWelcome />;

  // First tool: one question, a search and four one-click suggestions (accounts branch, 23/10).
  // Signed in with an empty stack: a short setup in the person's own space; the picks become the stack at the end.
  if (empty) return <div className="ms-page ms-page--start">
    <Breadcrumb items={[{ label: t("Ma stack", "My stack") }]} includeSchema={false} />
    <StackOnboarding onOpen={(slugs, welcome) => {
      const added = slugs.filter((slug) => pinTool(slug));
      if (added.length) {
        writeStarterDraft([]); markOnboarded();
        requestAnimationFrame(() => inventoryHeadingRef.current?.focus({ preventScroll: true }));
        const placed = added.map((slug) => lookup.get(slug)).filter((tool): tool is ToolSummary => !!tool).slice(0, 3);
        toast.custom(() => <StackWelcomeToast title={welcome} tools={placed}
          detail={t(`${added.length} outil${added.length > 1 ? "s" : ""} bien rangé${added.length > 1 ? "s" : ""}. La suite se passe juste en dessous.`, `${added.length} tool${added.length > 1 ? "s" : ""} neatly in place. What’s next is right below.`)} />, { duration: 6000 });
      }
    }} />
    <StackAccountPanel empty />
    {persistenceStatus.state === "degraded" && <p className="ms-storage-notice" role="status">{persistenceStatus.issue === "current-corrupt" || persistenceStatus.issue === "backup-corrupt" ? t("La sauvegarde locale est illisible. Vous pouvez constituer une nouvelle stack.", "The local snapshot cannot be read. You can build a new stack.") : t("Le navigateur ne permet pas l’enregistrement local. Votre stack reste disponible pour cette session.", "Your browser cannot save locally. Your stack remains available for this session.")}</p>}
    {persistenceStatus.state === "recovered" && <p className="ms-storage-notice" role="status">{t("Votre stack a été récupérée depuis la sauvegarde locale.", "Your stack was recovered from the local backup.")}</p>}
  </div>;

  return <div className="ms-page">
    {/* Topbar breadcrumb like every other page ("Home / My stack"); a personal
        page, so no structured data. */}
    <Breadcrumb items={[{ label: t("Ma stack", "My stack") }]} includeSchema={false} />
    {/* Ma Stack (Oct 2026): a title with the verdict and how much of the stack
        is checked, then the stack itself at the centre, read through lenses,
        and the next decision beside it. On a phone the deck comes first. */}
    {/* Hero (22/10/2026): a status line, the title, one sentence. */}
    <header className="ms-top ms-personal-hero">
      <StackPersonalWelcome empty={false} pending={deckItems.length + usagePending}>
        <div className="ms-personal-title-row">
          <h1 ref={inventoryHeadingRef} tabIndex={-1}>{t("Mes outils", "My tools")}</h1>
          <p className="ms-top-status">{t(`${selectedTools.length} outil${selectedTools.length > 1 ? "s" : ""} dans votre stack`, `${selectedTools.length} tool${selectedTools.length > 1 ? "s" : ""} in your stack`)}</p>
        </div>
      </StackPersonalWelcome>
      {state.toolEntries.some(entry => entry.intent === "stack" && lookup.has(entry.toolSlug)) && <Link
          className="ms-explore-stack" to={getExplorerHref(prefix, { type: "stack" })}
          state={{ explorerCanGoBack: true, explorerReturnTo: `${prefix}/ma-stack`,
            explorerStackSources: state.toolEntries.filter(entry => entry.intent === "stack").flatMap(entry => { const tool = lookup.get(entry.toolSlug); return tool ? [toolKey(tool)] : []; }) }}
          onClick={() => trackEvent("stack_explorer_click", { source: "whole_stack" })}>
          <Compass size={16} aria-hidden />{t("Explorer autour de ma stack", "Explore around my stack")}
        </Link>}
    </header>
    {persistenceStatus.state === "degraded" && <p className="ms-storage-notice" role="status">{persistenceStatus.issue === "current-corrupt" || persistenceStatus.issue === "backup-corrupt"
      ? t("La sauvegarde locale est illisible. Vous pouvez constituer une nouvelle stack.", "The local snapshot cannot be read. You can build a new stack.")
      : t("Le navigateur ne permet pas l’enregistrement local. Votre stack reste disponible pour cette session.", "Your browser cannot save locally. Your stack remains available for this session.")}</p>}
    {persistenceStatus.state === "recovered" && <p className="ms-storage-notice" role="status">{t("Votre stack a été récupéré depuis la sauvegarde locale.", "Your stack was recovered from the local backup.")}</p>}



    {!empty && <>
      {/* The findings module: the price first, then one decision at a time,
          then the summary once everything is settled. */}
      {(() => {
        const fmt = (amount: number) => formatAmount(amount, currency, lang);
        const resolved = Object.entries(decisions).flatMap(([key, decision]) => {
          const [x, y] = key.split("|").map((slug) => lookup.get(slug));
          if (!x || !y) return [];
          if (decision.kind === "keep-both" && !(pinnedKeys.has(toolKey(x)) && pinnedKeys.has(toolKey(y)))) return [];
          return [{ key, a: x, b: y, kind: decision.kind === "keep-both" ? "keep-both" as const : "keep-one" as const, kept: lookup.get(decision.kept)?.name, removed: decision.removed ? lookup.get(decision.removed)?.name : undefined, at: decision.at }];
        }).sort((x, y) => String(y.at).localeCompare(String(x.at)));
        return <StackFindings currency={currency} converted={selectedTools.some(tool => { const cost = toolMonthlyCost(tool, plans.isPaid, lang); return cost.kind === "paid" && cost.currency !== currency; })} guide={isFreshFromOnboarding()} hourly={hourly} freeTools={selectedTools.filter(tool => monthlyOf(tool) === 0 && !unreviewed.some(item => item.id === tool.id) && !unknownTools.some(item => item.id === tool.id))} lang={lang} total={stackCost.total} format={fmt} toolCount={selectedTools.length}
          fit={selectedTools.filter((tool) => monthlyOf(tool) > 0).sort((x, y) => monthlyOf(y) - monthlyOf(x)).map((tool) => ({
            tool, cost: monthlyOf(tool), usage: usage[toolKey(tool)], setUsage: (value: number | null) => setUsage(toolKey(tool), value), detailHref: `${prefix}/tool/${toolKey(tool)}`,
          }))}
          onReviewTools={() => { document.getElementById("ms-all-title")?.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" }); document.getElementById("ms-all-title")?.focus({ preventScroll: true }); }}
          areas={areaCosts.map((area) => ({ id: area.id, label: area.id === "assist" ? t("IA", "AI") : area.label, amount: area.cost, color: colorOf(area.id), tools: (mapTerritories.find((territory) => territory.id === area.id)?.tools || []).map((tool) => ({ tool, amount: monthlyOf(tool) })).filter((row) => row.amount > 0).sort((x, y) => y.amount - x.amount) }))}
          spend={selectedTools.filter((tool) => monthlyOf(tool) > 0).map((tool) => ({ tool, amount: monthlyOf(tool) })).sort((x, y) => y.amount - x.amount)}
          items={deckItems} reviewFindingKey={reviewingFinding?.key} saved={saved} toReview={overlapScore.doubleTotal} resolved={resolved} history={history}
          onAddTool={() => { setEditing(false); setSearchOpen(true); requestAnimationFrame(() => document.getElementById("ms-search")?.scrollIntoView({ block: "center" })); }}
          exploreHref={state.toolEntries.some((entry) => entry.intent === "stack" && lookup.has(entry.toolSlug)) ? getExplorerHref(prefix, { type: "stack" }) : undefined} />;
      })()}
      {/* Where the stack is saved: this browser, or the account. */}
      <StackAccountPanel empty={false} placement="notice" />
      <div className="ms-board">
        {/* 1. The stack itself, one box to see it: by area, as cards or as a list, sorted from a menu. Add and edit live here. */}
        <section className="ms-mod ms-mod--inventory ms-all" aria-labelledby="ms-all-title">
          <div className="ms-stage-bar">
            <div>
              <div className="ms-inventory-heading"><h2 id="ms-all-title" tabIndex={-1} className="ms-stage-title">{t("Ma stack", "My stack")}</h2><StackAccountPanel placement="inline" /></div>
              <p className="ms-all-sum">{t(`${selectedTools.length} outil${selectedTools.length > 1 ? "s" : ""}`, `${selectedTools.length} tool${selectedTools.length > 1 ? "s" : ""}`)}{stackCost.paid > 0 && <> · {money(stackCost.total)}{(unreviewed.length > 0 || unknownTools.length > 0) && t(" · partiel", " · partial")}</>}</p>
            </div>
            <div className="ms-tools-actions">
              {/* The one primary action of the section. */}
              <Button ref={addRef} variant="primary" icon={<Plus size={16} aria-hidden />} onClick={() => { setEditing(false); setSearchOpen((open) => !open); }} aria-expanded={searchOpen} aria-controls="ms-search">{t("Ajouter un outil", "Add a tool")}</Button>
            </div>
          </div>
          {searchPanel}
          {(() => {
            const counts = { all: listTools.length, review: listTools.filter((tool) => statusOf(tool) === "review").length, overlap: listTools.filter((tool) => statusOf(tool) === "overlap").length };
            const shown = statusFilter === "all" ? listTools : listTools.filter((tool) => statusOf(tool) === statusFilter);
            const groups = groupBy === "area"
              ? mapTerritories.map((territory) => ({ id: territory.id, label: territory.id === "assist" ? t("IA", "AI") : territory.label, tools: shown.filter((tool) => territory.tools.some((member) => member.id === tool.id)) }))
                .filter((group) => group.tools.length > 0)
                .map((group) => ({ ...group, subtotal: group.tools.reduce((sum, tool) => sum + monthlyOf(tool), 0) }))
                .sort((x, y) => y.subtotal - x.subtotal)
              : [{ id: "all", label: "", tools: shown, subtotal: 0 }];
            return <>
              {/* Three controls, three affordances: filter chips for what needs me, menus to group and sort, icons for the layout. */}
              <div className="ms-inv-bar">
                <Segmented mode="toggle" className="ms-inv-filters" label={t("Filtrer par statut", "Filter by status")} value={statusFilter} onChange={(id) => setStatusFilter(id)}
                  options={[{ id: "all", label: t("Tous", "All"), count: counts.all }, ...(counts.review ? [{ id: "review" as const, label: t("À vérifier", "To check"), count: counts.review, countTone: "watch" as const }] : []), ...(counts.overlap ? [{ id: "overlap" as const, label: t("Doublons", "Overlaps"), count: counts.overlap, countTone: "overlap" as const }] : [])]} />
                <div className="ms-inv-tools">

                  <label className="ms-sort"><span>{t("Trier :", "Sort:")}</span>
                    <Select appearance="stack-sort" size="compact" value={sortBy} onChange={(event) => sortTo(event.target.value as typeof sortBy)} aria-label={t("Trier mes outils", "Sort my tools")}>
                      <option value="area">{t("Domaine", "Area")}</option>
                      <option value="cost">{t("Coût", "Cost")}</option>
                      <option value="name">{t("Nom", "Name")}</option>
                      <option value="recent">{t("Ajout récent", "Recently added")}</option>
                    </Select><ChevronDown size={14} aria-hidden /></label>
                  <div className="ms-layout" role="group" aria-label={t("Affichage", "Layout")}>
                    <button type="button" aria-pressed={layout === "grid"} aria-label={t("Grille", "Grid")} title={t("Grille", "Grid")} onClick={() => setLayout("grid")}><LayoutGrid size={16} aria-hidden /></button>
                    <button type="button" aria-pressed={layout === "list"} aria-label={t("Liste", "List")} title={t("Liste", "List")} onClick={() => setLayout("list")}><List size={16} aria-hidden /></button>
                  </div>
                  {/* Edit acts on the grid right below, so it lives with the other view controls. */}
                  <span className="ms-inv-edit"><Button aria-pressed={editing} icon={editing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />} onClick={() => { setSearchOpen(false); setEditing((value) => !value); }}>{editing ? t("Terminé", "Done") : t("Modifier", "Edit")}</Button></span>
                </div>
              </div>
              <div id="ms-all-grid" className="ms-inv" data-layout={layout} data-grouped={groupBy === "area" ? "" : undefined} data-editing={editing || undefined} ref={gridRef} role="group" aria-label={t("Mes outils", "My tools")}>
                {groups.map((group) => <section key={group.id} className="ms-inv-group" aria-label={group.label || undefined}>
                  {group.label && <header className="ms-inv-head"><i aria-hidden="true" style={{ background: colorOf(group.id) }} /><h3>{group.label}</h3>
                    <span>{t(`${group.tools.length} outil${group.tools.length > 1 ? "s" : ""}`, `${group.tools.length} tool${group.tools.length > 1 ? "s" : ""}`)}{group.subtotal > 0 && <> · {money(group.subtotal)}{group.tools.some(tool => unreviewed.some(item => item.id === tool.id) || unknownTools.some(item => item.id === tool.id)) && t(" · partiel", " · partial")}</>}</span></header>}
                  <div className="ms-inv-items">{group.tools.map(renderTool)}</div>
                </section>)}
                {shown.length === 0 && <p className="ms-inv-empty">{t("Rien ici. Tout est à jour.", "Nothing here. All up to date.")}</p>}
              </div>
            </>;
          })()}
        </section>

        {/* 2. What would extend the stack, from the catalogue relations only. */}
        {recos.length > 0 && <section className="ms-mod ms-recos" aria-labelledby="ms-recos-title">
          <div className="ms-stage-bar">
            <div>
              <h2 id="ms-recos-title" className="ms-stage-title">{t("Pour aller plus loin", "Go further")}</h2>
              <p className="ms-recos-sub">{t("Des outils liés à ceux que vous avez déjà : extensions, suites, écosystèmes. Aucun ne fait doublon.", "Tools linked to the ones you already have: extensions, suites, ecosystems. None overlaps.")}</p>
            </div>
            <Link className="ms-recos-more" to={getExplorerHref(prefix, { type: "stack" })} onClick={() => trackEvent("stack_explorer_click", { source: "recos" })}><Compass size={16} aria-hidden />{t("Tout explorer", "Explore all")}</Link>
          </div>
          <ul className="ms-recos-grid">{recos.map((reco) => <li key={reco.tool.id} className="ms-reco">
            <Link className="ms-reco-main" to={`${prefix}/tool/${toolKey(reco.tool)}`} onClick={() => trackEvent("stack_reco_click", { tool: toolKey(reco.tool) })}>
              <ToolLogo tool={reco.tool} size={40} />
              <span className="ms-reco-name">{reco.tool.name}</span>
              <span className="ms-reco-why">{reco.reason}</span>
              <span className="ms-reco-price">{stackCatalogPrice(reco.tool, lang) || t("Prix non public", "Price not public")}</span>
            </Link>
            <button type="button" className="ms-reco-add" aria-label={t(`Ajouter ${reco.tool.name} à ma stack`, `Add ${reco.tool.name} to my stack`)}
              onClick={(event) => { addToStack(toolKey(reco.tool), reco.tool.name, { origin: event.currentTarget.closest("li"), onAdded: () => trackEvent("stack_reco_add", { tool: toolKey(reco.tool) }) }); }}><Plus size={18} aria-hidden /></button>
          </li>)}</ul>
        </section>}
      </div>

      <StackToolSheet key={`${reviewScope}:${reviewEpoch}`} editCostRequest={costEditorRequest?.scope === reviewScope && costEditorRequest.epoch === reviewEpoch ? costEditorRequest : null} tool={selected || null} detail={resolved} pairs={overlapScore.pairs} categories={categories} paid={plans} currency={currency} prefix={prefix} lang={lang}
        catalog={tools} stackIds={existingIds}
        onClose={closeInspector} onReturnFocus={() => { if (lastToolButton.current?.isConnected) lastToolButton.current.focus({ preventScroll: true }); }} onSelect={selectTool}
        onRemove={() => selected && removeTool(state.pinnedToolSlugs.find((slug) => lookup.get(slug)?.id === selected.id) || toolKey(selected), selected.name)} />
      {missing.length > 0 && <section className="ms-unavailable"><h2>{t("Outils indisponibles", "Unavailable tools")}</h2>
        <p>{t("Ces références ne sont plus disponibles dans le catalogue actuel. Votre sélection est conservée.", "These references are unavailable in the current catalogue. Your selection is retained.")}</p>
        {missing.map((slug) => <div key={slug}><span>{slug}</span><button onClick={() => removeTool(slug, slug)}>{t("Retirer de ma stack", "Remove from stack")}</button></div>)}
        {loading && <p role="status">{t("Actualisation du catalogue…", "Refreshing catalogue…")}</p>}
      </section>}
    </>}
  </div>;
}
