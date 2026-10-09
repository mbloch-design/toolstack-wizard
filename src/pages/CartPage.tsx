import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Check, X, Minus, Pencil, LayoutGrid, Wallet, Copy, ChevronRight } from "@/lib/icons";
import { toast } from "sonner";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import { AREA_COLORS } from "@/lib/stackAreas";
import StackBudgetBreakdown from "@/components/stack/StackBudgetBreakdown";
import StackOverlapPairs, { scoreOverlapPairs } from "@/components/stack/StackOverlapPairs";
import StackFreemiumPlans from "@/components/stack/StackFreemiumPlans";
import StackToolSheet from "@/components/stack/StackToolSheet";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { useCategories, useToolSummaries, useToolBySlug, type ToolSummary } from "@/hooks/useSupabaseData";
import { stackCatalogPrice, toolKey } from "@/lib/stackView";
import { stackDisplayLabel, stackPlacement, stackMapTerritories, stackRelations } from "@/lib/stackUsage";
import toolAccents from "@/data/toolAccents.json";
import { useCurrency } from "@/hooks/useCurrency";
import { useStackPaidPlans } from "@/hooks/useStackPaidPlans";
import { stackMonthlyCost, toolMonthlyCost } from "@/lib/stackCost";
import { convertAmount, formatAmount } from "@/lib/currencyRates";
import { HERO_CLUSTER_SLOTS } from "@/lib/heroCluster";
import { pairKey, useStackDecisions } from "@/hooks/useStackDecisions";
import { trackEvent } from "@/lib/analytics";
import ValueChange from "@/components/motion/ValueChange";
import { writeStackSnapshot } from "@/lib/stackSnapshot";
import { SEO_BASE, setHreflang, setSeoTags } from "@/lib/seo";
import { getToolLogoSources } from "@/lib/toolLogos";

const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export default function CartPage() {
  const { t, lang, prefix } = useLang();
  const { tools, loading } = useToolSummaries();
  const { categories } = useCategories();
  const { state, persistenceStatus, pinTool, unpinTool, restoreTool } = useStackPins();
  const [params, setParams] = useSearchParams();
  const [domainFilter, setDomainFilter] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const lastToolButton = useRef<HTMLButtonElement | null>(null);
  const [editing, setEditing] = useState(false);
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
  const listTools = selectedTools.filter((tool) => visibleIds.has(tool.id)).sort((a, b) => a.name.localeCompare(b.name, lang));
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
  const { decisions, decide, reopen } = useStackDecisions(t, (amount) => `≈ ${formatAmount(Math.round(amount), currency, lang)}${t("/mois", "/mo")}`, currency);
  const overlapsById = useMemo(() => new Map(selectedTools.map((tool) => [tool.id,
    stackRelations(tool, selectedTools, categories, lang)
      .filter((relation) => (relation.explicit || relation.commonUses.length > 0) && decisions[pairKey(toolKey(tool), toolKey(relation.tool))]?.kind !== "keep-both")
      .map((relation) => relation.tool),
  ])), [selectedTools, categories, lang, decisions]);
  // Monthly cost with the same rules as By use: freemium at 0 unless declared
  // paid, total converted at the site's dated rate (Michael, 7 Oct 2026).
  const plans = useStackPaidPlans();
  const stackCost = stackMonthlyCost(selectedTools, plans.isPaid, currency, lang);
  // Hero cluster: costliest tools first, so the one that weighs most on the
  // budget sits in the middle.
  const heroOrder = useMemo(() => {
    const monthly = (tool: ToolSummary) => { const cost = toolMonthlyCost(tool, plans.isPaid, lang); return cost.kind === "paid" ? convertAmount(cost.monthly, cost.currency, currency) : 0; };
    return [...selectedTools].sort((a, b) => monthly(b) - monthly(a) || a.name.localeCompare(b.name));
  }, [selectedTools, plans.paid, plans.choices, currency, lang]);
  const heroApps = heroOrder.length > HERO_CLUSTER_SLOTS.length ? heroOrder.slice(0, HERO_CLUSTER_SLOTS.length - 1) : heroOrder;
  const heroOverflow = heroOrder.length - heroApps.length;
  // Area colours of the budget ring, stable across the whole stack. Area colours stay those of the whole stack.
  const colorOf = (id: string) => AREA_COLORS[Math.max(0, mapTerritories.findIndex((territory) => territory.id === id)) % AREA_COLORS.length];
  // Hero micro-bars (Screen Time style): tools and cost split by area, in the
  // budget ring's colours, and the share of the cost that is paid twice.
  const areaCosts = useMemo(() => mapTerritories.map((territory) => ({ id: territory.id, label: territory.label, tools: territory.tools.length, cost: stackMonthlyCost(territory.tools, plans.isPaid, currency, lang).total })), [mapTerritories, plans.paid, plans.choices, currency, lang]);
  const amount = (value: number) => <><span className="ms-approx" aria-hidden="true">≈</span><span className="sr-only">≈ </span>{formatAmount(Math.round(value), currency, lang)}</>;
  // Freemium question (Michael, 7 Oct 2026): asked once per tool, at the start
  // of the story, because it sets both the budget and what is paid twice.
  const freemiumTools = selectedTools.filter((tool) => stackCatalogPrice(tool, lang) === "Freemium");
  const unreviewed = freemiumTools.filter((tool) => !plans.isReviewed(toolKey(tool)));
  const [freemiumOpen, setFreemiumOpen] = useState(false);
  function setFreemiumSheet(open: boolean) {
    setFreemiumOpen(open);
    if (open) trackEvent("stack_freemium_open", { count: unreviewed.length });
    if (!open) {
      plans.markReviewed(freemiumTools.map(toolKey));
      trackEvent("stack_freemium_answer", { freemium: freemiumTools.length, paid: freemiumTools.filter((tool) => plans.isPaid(toolKey(tool))).length });
    }
  }
  // Hero and Overlaps section share one computation: same pairs, same amount.
  const overlapScore = useMemo(() => scoreOverlapPairs(selectedTools, categories, plans.isPaid, currency, lang, decisions), [selectedTools, categories, plans.paid, plans.choices, currency, lang, decisions]);
  const overlapPairs = overlapScore.pairs.length;
  const empty = state.pinnedToolSlugs.length === 0;
  // The footer's "your stack" card on every other page reads these figures;
  // its logos are the costliest tools that have a logo stored on the site.
  useEffect(() => {
    if (empty) { writeStackSnapshot(null); return; }
    if (selectedTools.length === 0) return; // catalogue still loading
    writeStackSnapshot({ tools: selectedTools.length, monthly: Math.round(stackCost.total), double: Math.round(overlapScore.doubleTotal), currency, at: new Date().toISOString(), top: heroOrder.filter((tool) => getToolLogoSources(tool, 64).some((src) => src.startsWith("/"))).slice(0, 3).map((tool) => ({ slug: toolKey(tool), name: tool.name, logo: tool.logo || undefined })) });
  }, [empty, selectedTools.length, stackCost.total, overlapScore.doubleTotal, currency, heroOrder]);
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
  }, [lang, t]);
  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);
  useEffect(() => {
    if (selectedSlug && !selected && !missing.includes(selectedSlug)) {
      const next = new URLSearchParams(params);
      next.delete("outil");
      setParams(next, { replace: true });
    }
  }, [selectedSlug, selected, state.pinnedToolSlugs, params, setParams]);

  function selectTool(slug: string) {
    const target = lookup.get(slug);
    if (target && !visibleIds.has(target.id)) setDomainFilter("all");
    const next = new URLSearchParams(params);
    next.set("outil", slug);
    setParams(next, { state: { skipScrollReset: true }, preventScrollReset: true });
    trackEvent("stack_tool_open", { tool_slug: slug });
  }
  function closeInspector() {
    const selectedId = selected?.id;
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
  }, [activeFilter]);

  // Tab ink: one underline that slides and resizes to the active tab.
  const tabsRef = useRef<HTMLDivElement>(null);
  const [ink, setInk] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const place = () => {
      const active = tabsRef.current?.querySelector<HTMLElement>('button[aria-pressed="true"]');
      if (!active) return;
      setInk({ left: active.offsetLeft, width: active.offsetWidth });
      // Keep the active tab in view when the row scrolls (phones).
      const row = tabsRef.current!;
      if (active.offsetLeft < row.scrollLeft || active.offsetLeft + active.offsetWidth > row.scrollLeft + row.clientWidth) {
        row.scrollTo({ left: Math.max(0, active.offsetLeft - 32), behavior: reducedMotion() ? "auto" : "smooth" });
      }
    };
    place();
    // Fade the edges only where tabs are hidden, so the row says it scrolls.
    const row = tabsRef.current;
    const edges = () => {
      if (!row) return;
      row.dataset.fadeStart = row.scrollLeft > 2 ? "true" : "false";
      row.dataset.fadeEnd = row.scrollLeft + row.clientWidth < row.scrollWidth - 2 ? "true" : "false";
    };
    edges();
    row?.addEventListener("scroll", edges, { passive: true });
    const onResize = () => { place(); edges(); };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); row?.removeEventListener("scroll", edges); };
  }, [activeFilter, mapTerritories.length, lang]);

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
  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }
  function renderTool(tool: ToolSummary) {
    const active = selected?.id === tool.id;
    const price = stackCatalogPrice(tool, lang);
    const overlaps = overlapsById.get(tool.id) || [];
    const accent = (toolAccents as Record<string, string>)[toolKey(tool)];
    // Two fixed zones: identity on top, then a footer on a hairline (price
    // left, overlap right) aligned across every card of a row.
    const slug = state.pinnedToolSlugs.find((pinned) => lookup.get(pinned)?.id === tool.id) || toolKey(tool);
    return <div key={tool.id} className="ms-card-wrap" data-flip-id={tool.id}>
    <button
      type="button"
      data-tool-id={tool.id}
      className={`ms-tool ms-tool-card${active ? " ms-tool--selected" : ""}`}
      style={accent ? ({ "--tool-accent": accent } as React.CSSProperties) : undefined}
      aria-haspopup="dialog"
      // Says what opens: the card leads to the tool sheet.
      title={editing ? undefined : t(`Gérer ${tool.name} : abonnement, recoupements, alternatives`, `Manage ${tool.name}: subscription, overlaps, alternatives`)}
      tabIndex={editing ? -1 : undefined}
      onClick={(event) => { if (editing) return; lastToolButton.current = event.currentTarget; if (active) closeInspector(); else selectTool(toolKey(tool)); }}
    >
      {/* Top: identity (icon, full name, area) and what it overlaps.
          Bottom: money and the action, "Manage ›". */}
      <span className="ms-card-top">
        <span className="ms-card-logo"><ToolLogo tool={tool} size={48} /></span>
        <span className="ms-card-id"><strong>{tool.name}</strong><span>{stackDisplayLabel(stackPlacement(tool, categories, lang).label, lang)}</span>
          {overlaps.length > 0 && <span className="ms-card-overlap" title={t(`Recoupe ${overlaps.map((o) => o.name).join(", ")}`, `Overlaps with ${overlaps.map((o) => o.name).join(", ")}`)}>
            <span className="ms-card-overlap-name">{overlaps[0].name}</span>{overlaps.length > 1 && <span>+{overlaps.length - 1}</span>}
          </span>}
        </span>
      </span>
      <span className="ms-card-foot">
        <span className={`ms-card-price${price ? "" : " ms-card-price--none"}`}>{(() => {
          // "From $22.99/mo": the word small, the amount carries the line.
          const match = price?.match(/^(Dès|From) (.+)$/);
          return match ? <><small>{match[1]}</small> <strong>{match[2]}</strong></> : price || t("Saisir le prix", "Enter the price");
        })()}</span>
        {/* Names what the click does: manage this tool (subscription, overlaps, alternatives). */}
        {!editing && <span className="ms-card-action" aria-hidden="true"><span>{t("Gérer", "Manage")}</span><ChevronRight size={16} /></span>}
      </span>
    </button>
    {/* Edit mode (iOS home screen): a minus badge removes the tool, with undo. */}
    {editing && <button type="button" className="ms-card-remove" onClick={() => removeTool(slug, tool.name)} aria-label={t(`Retirer ${tool.name} de ma stack`, `Remove ${tool.name} from my stack`)}><Minus size={14} aria-hidden /></button>}
    </div>;
  }


  // Add search: on top for an empty stack, in My tools otherwise (the add
  // action is a quiet button there, not a hero CTA).
  const searchPanel = showSearch && <section className="ms-search" id="ms-search" aria-label={t("Ajouter un outil", "Add a tool")}>
      <div className="ms-search-input"><Search size={20} aria-hidden /><input
        ref={searchRef}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("Rechercher un outil…", "Search for a tool…")}
        aria-label={t("Rechercher un outil", "Search for a tool")}
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
            onClick={() => { pinTool(toolKey(tool)); toast.success(t(`${tool.name} ajouté à ma stack.`, `${tool.name} added to your stack.`)); }}
          >{present ? <Check size={18} aria-hidden /> : <Plus size={18} aria-hidden />}</button></li>;
        })}</ul>
      </>}
    </section>;

  return <main className="ms-page">
    {/* Topbar breadcrumb like every other page ("Home / My stack"); a personal
        page, so no structured data. */}
    <Breadcrumb items={[{ label: t("Ma stack", "My stack") }]} includeSchema={false} />
    {/* Hero, the whole stack at a glance: title, the figures (each one leads
        to the section that explains it), and my tools as an
        icon cluster with the costliest one in the middle. The dashboard below
        breaks it down. */}
    <header className={`sg-hero sg-hero--cluster ms-hero${empty ? " ms-hero--empty" : ""}`}>
      <div className="sg-hero-copy">
        <span className="sg-hero-pill">{t("Ma stack", "My stack")}</span>
        <h1>{t("Mes outils", "My tools")}</h1>
        <p className="sg-lead">{t("Retrouvez vos outils, les usages qu’ils couvrent et ce qu’ils coûtent.", "See your tools, the uses they cover and what they cost.")}</p>
        {!empty && <>
          <dl className="sg-stats ms-hero-stats">
            <div><dt><LayoutGrid size={15} aria-hidden />{t("Outils", "Tools")}</dt><dd>{selectedTools.length}</dd>
              <span className="ms-stat-bar" aria-hidden="true">{areaCosts.map((area) => <i key={area.id} style={{ flexGrow: area.tools, background: colorOf(area.id) }} data-tip={`${area.label} · ${t(`${area.tools} outil${area.tools > 1 ? "s" : ""}`, `${area.tools} tool${area.tools > 1 ? "s" : ""}`)}`} />)}</span><span>{t(`${mapTerritories.length} domaine${mapTerritories.length > 1 ? "s" : ""}`, `${mapTerritories.length} area${mapTerritories.length > 1 ? "s" : ""}`)}</span></div>
            <div><dt><Wallet size={15} aria-hidden /><span className="ms-stat-full">{stackCost.unknown > 0 && stackCost.paid > 0 ? t("Total partiel", "Partial total") : t("Coût mensuel", "Monthly cost")}</span><span className="ms-stat-short">{stackCost.unknown > 0 && stackCost.paid > 0 ? t("Partiel", "Partial") : t("Par mois", "Monthly")}</span></dt><dd><ValueChange value={Math.round(stackCost.total)}>{stackCost.paid > 0 ? amount(stackCost.total) : stackCost.unknown > 0 ? t("Coût non renseigné", "Cost unknown") : t("Gratuit", "Free")}</ValueChange></dd>
              <span className="ms-stat-bar" aria-hidden="true">{stackCost.total > 0 ? areaCosts.filter((area) => area.cost > 0).map((area) => <i key={area.id} style={{ flexGrow: area.cost, background: colorOf(area.id) }} data-tip={`${area.label} · ≈ ${formatAmount(Math.round(area.cost), currency, lang)}${t("/mois", "/mo")}`} />) : <i style={{ flexGrow: 1 }} />}</span><span>{stackCost.paid > 0 ? t(`${stackCost.paid} outil${stackCost.paid > 1 ? "s" : ""} payant${stackCost.paid > 1 ? "s" : ""}`, `${stackCost.paid} paid tool${stackCost.paid > 1 ? "s" : ""}`) : stackCost.unknown > 0 ? t("Coût non renseigné", "Cost unknown") : t("rien de payant", "nothing paid")}</span></div>
            {/* The thread of the page: what I pay, and what I pay twice. */}
            <div className={overlapScore.doubleTotal > 0 ? "ms-stat--overlaps" : undefined}><dt><Copy size={15} aria-hidden /><span className="ms-stat-full">{t("Payé en double", "Paid twice")}</span><span className="ms-stat-short">{t("En double", "Twice")}</span></dt><dd><ValueChange value={Math.round(overlapScore.doubleTotal)}>{overlapScore.doubleTotal > 0 ? amount(overlapScore.doubleTotal) : (overlapPairs > 0 ? formatAmount(0, currency, lang) : t("Rien", "None"))}</ValueChange></dd>
              {(() => {
                const share = stackCost.total > 0 ? Math.min(1, overlapScore.doubleTotal / stackCost.total) : 0;
                return <span className="ms-stat-bar ms-stat-bar--share" aria-label={t(`${Math.round(share * 100)} % du coût mensuel`, `${Math.round(share * 100)}% of the monthly cost`)}>{share > 0 && <i style={{ flexGrow: share }} data-tip={t(`≈ ${formatAmount(Math.round(overlapScore.doubleTotal), currency, lang)} payés en double`, `≈ ${formatAmount(Math.round(overlapScore.doubleTotal), currency, lang)} paid twice`)} />}<i style={{ flexGrow: 1 - share }} data-tip={t(`≈ ${formatAmount(Math.round(stackCost.total - overlapScore.doubleTotal), currency, lang)} sans doublon`, `≈ ${formatAmount(Math.round(stackCost.total - overlapScore.doubleTotal), currency, lang)} with no overlap`)} /></span>;
              })()}
              {/* Fourth row, like the other columns: share of the cost, then the way to the overlaps. */}
              <span className="ms-stat-note">{stackCost.total > 0 && <><span className="ms-stat-share">{t(`${Math.round(Math.min(1, overlapScore.doubleTotal / stackCost.total) * 100)} % du coût`, `${Math.round(Math.min(1, overlapScore.doubleTotal / stackCost.total) * 100)}% of cost`)}<br /></span></>}{overlapPairs > 0
              ? <a className="ms-stat-link" href="#ms-overlaps" onClick={(event) => { event.preventDefault(); jumpTo("ms-overlaps"); }}><span className="ms-stat-full">{t(`${overlapPairs} recoupement${overlapPairs > 1 ? "s" : ""}`, `${overlapPairs} overlap${overlapPairs > 1 ? "s" : ""}`)}</span><span className="ms-stat-short">{t(`${overlapPairs} paire${overlapPairs > 1 ? "s" : ""}`, `${overlapPairs} pair${overlapPairs > 1 ? "s" : ""}`)}</span> ↓</a>
              : t("aucun recoupement connu", "no known overlap")}</span></div>
          </dl>
        </>}
      </div>
      {!empty && <div className="sg-cluster" aria-label={t("Mes outils", "My tools")}>
        {heroApps.map((tool, i) => {
          const pos = HERO_CLUSTER_SLOTS[i];
          return <button key={tool.id} type="button" className="sg-cluster-app" title={tool.name} onClick={() => selectTool(toolKey(tool))}
            style={{ left: `${(pos.x / 440) * 100}%`, top: `${(pos.y / 380) * 100}%`, width: `${(pos.s / 440) * 100}%`, aspectRatio: "1", ["--r" as string]: `${pos.r}deg`, animationDelay: `${-i * 0.7}s` }}>
            <ToolLogo tool={tool} size={pos.s} className="sg-cluster-icon" /><span className="sr-only">{tool.name}</span>
          </button>;
        })}
        {heroOverflow > 0 && <span className="sg-cluster-more" style={{ left: `${(HERO_CLUSTER_SLOTS[heroApps.length].x / 440) * 100}%`, top: `${(HERO_CLUSTER_SLOTS[heroApps.length].y / 380) * 100}%` }}>+{heroOverflow}</span>}
      </div>}
    </header>

    {empty && <p className="ms-empty-copy">{t("Ajoutez les outils que vous utilisez. ToolTrim organise automatiquement votre environnement.", "Add the tools you use. ToolTrim automatically organizes your environment.")}</p>}
    {persistenceStatus.state === "degraded" && <p className="ms-storage-notice" role="status">{persistenceStatus.issue === "current-corrupt" || persistenceStatus.issue === "backup-corrupt"
      ? t("La sauvegarde locale est illisible. Vous pouvez constituer une nouvelle stack.", "The local snapshot cannot be read. You can build a new stack.")
      : t("Le navigateur ne permet pas l’enregistrement local. Votre stack reste disponible pour cette session.", "Your browser cannot save locally. Your stack remains available for this session.")}</p>}
    {persistenceStatus.state === "recovered" && <p className="ms-storage-notice" role="status">{t("Votre stack a été récupéré depuis la sauvegarde locale.", "Your stack was recovered from the local backup.")}</p>}

    {empty && searchPanel}

    {/* Empty stack: what the page does, in three real steps. No suggested
        tools (suggestions before typing were ruled out in V1). */}
    {empty && <ol className="ms-howto" aria-label={t("Comment ça marche", "How it works")}>
      <li><strong>{t("Ajoutez vos outils", "Add your tools")}</strong><span>{t("Cherchez-les par leur nom : ils se rangent seuls par domaine.", "Search them by name: they sort themselves by area.")}</span></li>
      <li><strong>{t("Repérez les recoupements", "Spot the overlaps")}</strong><span>{t("ToolTrim signale les outils de votre stack qui font le même travail.", "ToolTrim flags the tools in your stack that do the same job.")}</span></li>
      <li><strong>{t("Comparez avant d’ajouter", "Compare before adding")}</strong><span>{t("Sur chaque fiche, voyez ce qu’un nouvel outil recoupe dans votre stack.", "On every tool page, see what a new tool overlaps in your stack.")}</span></li>
    </ol>}

    {!empty && <>
      {/* Order follows the visit (Michael, 7 Oct 2026): after the hero, what I
          can simplify (overlaps), then what it really costs (budget, with the
          freemium plans to declare beside it so the total corrects itself),
          then the inventory. */}
      {/* One question, once: the freemium plans set the true cost, so they are
          asked before the figures that depend on them. Gone once answered. */}
      {unreviewed.length > 0 && <aside className="ms-calibrate" aria-label={t("Freemium à déclarer", "Freemium to declare")}>
        <span className="ms-calibrate-logos" aria-hidden="true">{unreviewed.slice(0, 4).map((tool) => <ToolLogo key={tool.id} tool={tool} size={28} />)}</span>
        <p><strong>{t(`${unreviewed.length} outil${unreviewed.length > 1 ? "s" : ""} freemium compte${unreviewed.length > 1 ? "nt" : ""} 0 €.`, `${unreviewed.length} freemium tool${unreviewed.length > 1 ? "s count" : " counts"} as free.`)}</strong> {t("Vous en payez certains ? Votre coût et vos doublons en dépendent.", "Do you pay for some? Your cost and duplicates depend on it.")}</p>
        <div className="ms-calibrate-actions">
          <button type="button" className="ms-calibrate-skip" onClick={() => { plans.markReviewed(freemiumTools.map(toolKey)); trackEvent("stack_freemium_answer", { freemium: freemiumTools.length, paid: 0, quick: true }); }}>{t("Aucun", "None")}</button>
          <button type="button" className="tt-button-primary ms-calibrate-go" onClick={() => setFreemiumSheet(true)}>{t("Indiquer lesquels", "Pick them")}</button>
        </div>
      </aside>}

      <StackOverlapPairs tools={selectedTools} categories={categories} isPaid={plans.isPaid} currency={currency} prefix={prefix} lang={lang} onSelect={selectTool}
        decisions={decisions} onReopen={(keys) => keys.forEach((key) => { const [a, b] = key.split("|"); reopen(a, b); })}
        onDecide={(kind, kept, removed, saving) => decide(kind, { slug: toolKey(kept), name: kept.name }, { slug: toolKey(removed), name: removed.name }, saving, "stack")} />

      <section className="sg-section ms-section ms-budget-section" aria-labelledby="ms-budget-section-title">
        <div className="sg-section-heading"><span className="sg-eyebrow">{t("Budget", "Budget")}</span><h2 id="ms-budget-section-title">{t("Combien coûte ma stack ?", "What does my stack cost?")}</h2></div>
        <StackBudgetBreakdown territories={mapTerritories} colorOf={colorOf} paid={plans} currency={currency} lang={lang} onSelect={selectTool} onFreemium={() => setFreemiumSheet(true)} />
      </section>

      <StackFreemiumPlans open={freemiumOpen} onOpenChange={setFreemiumSheet} freemium={freemiumTools} paid={plans} currency={currency} lang={lang} />

      <section className="sg-section ms-section ms-tools-section" aria-labelledby="ms-list-title">
        <div className="ms-section-row">
          <div className="sg-section-heading"><span className="sg-eyebrow">{t("Mes outils", "My tools")}</span><h2 id="ms-list-title">{t("Quel outil pour quoi ?", "Which tool does what?")}</h2></div>
          <div className="ms-tools-actions">
            <button type="button" className="ms-quiet-button" ref={addRef} onClick={() => { setEditing(false); setSearchOpen((open) => !open); }} aria-expanded={searchOpen} aria-controls="ms-search"><Plus size={16} aria-hidden />{t("Ajouter", "Add")}</button>
            <button type="button" className="ms-quiet-button" aria-pressed={editing} onClick={() => { setSearchOpen(false); setEditing((value) => !value); }}>{editing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}{editing ? t("Terminé", "Done") : t("Modifier", "Edit")}</button>
          </div>
        </div>
        {searchPanel}
        <div className="ms-domain-filters" role="group" aria-label={t("Filtrer par domaine", "Filter by area")} ref={tabsRef}>
          {ink && <span className="ms-tab-ink" aria-hidden="true" style={{ transform: `translateX(${ink.left}px)`, width: ink.width }} />}
          <button type="button" aria-pressed={activeFilter === "all"} onClick={() => filterTo("all")}>{t("Tous", "All")}<span>{selectedTools.length}</span></button>
          {mapTerritories.map((territory) => <button key={territory.id} type="button" aria-pressed={activeFilter === territory.id} onClick={() => filterTo(territory.id)}>
            {territory.id === "assist" ? t("IA", "AI") : territory.label}<span>{territory.tools.length}</span>
          </button>)}
        </div>
        <div className="ms-card-grid" data-editing={editing || undefined} ref={gridRef}>{listTools.map(renderTool)}</div>
      </section>

      <StackToolSheet tool={selected || null} detail={resolved} pairs={overlapScore.pairs} categories={categories} paid={plans} currency={currency} prefix={prefix} lang={lang}
        catalog={tools} stackIds={existingIds}
        onClose={closeInspector} onSelect={selectTool}
        onRemove={() => selected && removeTool(state.pinnedToolSlugs.find((slug) => lookup.get(slug)?.id === selected.id) || toolKey(selected), selected.name)} />
      {missing.length > 0 && <section className="ms-unavailable"><h2>{t("Outils indisponibles", "Unavailable tools")}</h2>
        <p>{t("Ces références ne sont plus disponibles dans le catalogue actuel. Votre sélection est conservée.", "These references are unavailable in the current catalogue. Your selection is retained.")}</p>
        {missing.map((slug) => <div key={slug}><span>{slug}</span><button onClick={() => removeTool(slug, slug)}>{t("Retirer de ma stack", "Remove from stack")}</button></div>)}
        {loading && <p role="status">{t("Actualisation du catalogue…", "Refreshing catalogue…")}</p>}
      </section>}
    </>}
  </main>;
}
