import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Check, X } from "@/lib/icons";
import { toast } from "sonner";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import { AREA_COLORS } from "@/components/stack/StackAreaBoard";
import StackBudgetBreakdown from "@/components/stack/StackBudgetBreakdown";
import StackOverlapPairs, { scoreOverlapPairs } from "@/components/stack/StackOverlapPairs";
import StackFreemiumPlans from "@/components/stack/StackFreemiumPlans";
import StackToolInspector from "@/components/stack/StackToolInspector";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { useCategories, useToolSummaries, useToolBySlug, type ToolSummary } from "@/hooks/useSupabaseData";
import { stackCatalogPrice, toolKey } from "@/lib/stackView";
import { stackDisplayLabel, stackPlacement, stackMapTerritories, stackRelations } from "@/lib/stackUsage";
import { getScrollTop, scrollToY } from "@/lib/scroll";
import toolAccents from "@/data/toolAccents.json";
import { useCurrency } from "@/hooks/useCurrency";
import { useStackPaidPlans } from "@/hooks/useStackPaidPlans";
import { stackMonthlyCost, toolMonthlyCost } from "@/lib/stackCost";
import { convertAmount, formatAmount } from "@/lib/currencyRates";
import { HERO_CLUSTER_SLOTS } from "@/lib/heroCluster";

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
  const contextScroll = useRef<number | null>(null);
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
  const relations = useMemo(() => resolved ? stackRelations(resolved, selectedTools, categories, lang) : [], [resolved, selectedTools, categories, lang]);
  // Potential overlaps per tool, with the same rule as the Focus panel
  // (explicit catalogue alternative or shared catalogue uses), so the cards,
  // the summary and the panel always say the same thing. No score, no advice
  // to remove: the person decides.
  const overlapsById = useMemo(() => new Map(selectedTools.map((tool) => [tool.id,
    stackRelations(tool, selectedTools, categories, lang).filter((relation) => relation.explicit || relation.commonUses.length > 0).map((relation) => relation.tool),
  ])), [selectedTools, categories, lang]);
  // Monthly cost with the same rules as By use: freemium at 0 unless declared
  // paid, total converted at the site's dated rate (Michael, 7 Oct 2026).
  const { currency } = useCurrency();
  const plans = useStackPaidPlans();
  const stackCost = stackMonthlyCost(selectedTools, plans.isPaid, currency, lang);
  // Hero cluster: costliest tools first, so the one that weighs most on the
  // budget sits in the middle.
  const heroOrder = useMemo(() => {
    const monthly = (tool: ToolSummary) => { const cost = toolMonthlyCost(tool, plans.isPaid, lang); return cost.kind === "paid" ? convertAmount(cost.monthly, cost.currency, currency) : 0; };
    return [...selectedTools].sort((a, b) => monthly(b) - monthly(a) || a.name.localeCompare(b.name));
  }, [selectedTools, plans.paid, currency, lang]);
  const heroApps = heroOrder.length > HERO_CLUSTER_SLOTS.length ? heroOrder.slice(0, HERO_CLUSTER_SLOTS.length - 1) : heroOrder;
  const heroOverflow = heroOrder.length - heroApps.length;
  // Area colours of the budget ring, stable across the whole stack. Area colours stay those of the whole stack.
  const colorOf = (id: string) => AREA_COLORS[Math.max(0, mapTerritories.findIndex((territory) => territory.id === id)) % AREA_COLORS.length];
  // Freemium question (Michael, 7 Oct 2026): asked once per tool, at the start
  // of the story, because it sets both the budget and what is paid twice.
  const freemiumTools = selectedTools.filter((tool) => stackCatalogPrice(tool, lang) === "Freemium");
  const unreviewed = freemiumTools.filter((tool) => !plans.isReviewed(toolKey(tool)));
  const [freemiumOpen, setFreemiumOpen] = useState(false);
  function setFreemiumSheet(open: boolean) {
    setFreemiumOpen(open);
    if (!open) plans.markReviewed(freemiumTools.map(toolKey));
  }
  // Hero and Overlaps section share one computation: same pairs, same amount.
  const overlapScore = useMemo(() => scoreOverlapPairs(selectedTools, categories, plans.isPaid, currency, lang), [selectedTools, categories, plans.paid, currency, lang]);
  const overlapPairs = overlapScore.pairs.length;
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
    if (!selected) contextScroll.current = getScrollTop();
    const next = new URLSearchParams(params);
    next.set("outil", slug);
    setParams(next, { state: { skipScrollReset: true }, preventScrollReset: true });
  }
  function closeInspector() {
    const selectedId = selected?.id;
    const next = new URLSearchParams(params);
    next.delete("outil");
    setParams(next, { replace: true, state: { skipScrollReset: true }, preventScrollReset: true });
    const previous = contextScroll.current;
    contextScroll.current = null;
    requestAnimationFrame(() => {
      const button = lastToolButton.current?.isConnected ? lastToolButton.current
        : selectedId ? document.querySelector<HTMLButtonElement>(`[data-tool-id="${CSS.escape(selectedId)}"]`) : null;
      button?.focus({ preventScroll: true });
      if (previous !== null) scrollToY(previous, "instant");
    });
  }
  function removeTool(slug: string, name: string) {
    const index = state.toolEntries.findIndex((entry) => entry.toolSlug === slug);
    const entry = state.toolEntries[index];
    if (!entry) return;
    unpinTool(slug);
    closeInspector();
    requestAnimationFrame(() => addRef.current?.focus({ preventScroll: true }));
    toast(t(`${name} retiré de ma stack.`, `${name} removed from your stack.`), {
      duration: 6000,
      action: { label: t("Annuler", "Undo"), onClick: () => restoreTool(entry, index) },
    });
  }
  function chooseDomain(id: string) {
    setDomainFilter(id);
    const members = mapTerritories.find((territory) => territory.id === id)?.tools;
    if (selected && id !== "all" && !members?.some((tool) => tool.id === selected.id)) {
      const next = new URLSearchParams(params);
      next.delete("outil");
      setParams(next, { replace: true, state: { skipScrollReset: true }, preventScrollReset: true });
      contextScroll.current = null;
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
    return <button
      key={tool.id}
      type="button"
      data-tool-id={tool.id}
      className={`ms-tool ms-tool-card${active ? " ms-tool--selected" : ""}`}
      style={accent ? ({ "--tool-accent": accent } as React.CSSProperties) : undefined}
      aria-expanded={active}
      aria-controls={active ? "ms-tool-context" : undefined}
      onClick={(event) => { lastToolButton.current = event.currentTarget; active ? closeInspector() : selectTool(toolKey(tool)); }}
    >
      <span className="ms-card-top">
        <span className="ms-card-logo"><ToolLogo tool={tool} size={34} /></span>
        <span className="ms-card-id"><strong>{tool.name}</strong>{<span>{stackDisplayLabel(stackPlacement(tool, categories, lang).label, lang)}</span>}</span>
      </span>
      {<span className="ms-card-foot">
        <span className={`ms-card-price${price ? "" : " ms-card-price--none"}`}>{price || t("Tarif non relevé", "Price not checked")}</span>
        {overlaps.length > 0 && <span className="ms-card-overlap" title={t(`Recoupe ${overlaps.map((o) => o.name).join(", ")}`, `Overlaps with ${overlaps.map((o) => o.name).join(", ")}`)}>
          <span className="ms-card-overlap-name">{overlaps[0].name}</span>{overlaps.length > 1 && <span>+{overlaps.length - 1}</span>}
        </span>}
      </span>}
    </button>;
  }

  function renderInspector(members: ToolSummary[]) {
    return selected && members.some((tool) => tool.id === selected.id) && <div id="ms-tool-context" className="ms-context-slot">
      <StackToolInspector key={selected.id} tool={resolved || selected} relations={relations} categories={categories} prefix={prefix} lang={lang} t={t} onClose={closeInspector} onSelect={selectTool} onRemove={() => removeTool(state.pinnedToolSlugs.find((slug) => lookup.get(slug)?.id === selected.id) || toolKey(selected), selected.name)} />
    </div>;
  }

  return <main className="ms-page">
    {/* Topbar breadcrumb like every other page ("Home / My stack"); a personal
        page, so no structured data. */}
    <Breadcrumb items={[{ label: t("Ma stack", "My stack") }]} includeSchema={false} />
    {/* Hero, the whole stack at a glance: title, the four figures (each one
        leads to the tile that explains it), the add action, and my tools as an
        icon cluster with the costliest one in the middle. The dashboard below
        breaks it down. */}
    <header className={`sg-hero sg-hero--cluster ms-hero${empty ? " ms-hero--empty" : ""}`}>
      <div className="sg-hero-copy">
        <span className="sg-hero-pill">{t("Ma stack", "My stack")}</span>
        <h1>{t("Mes outils", "My tools")}</h1>
        <p className="sg-lead">{t("Retrouvez vos outils, les usages qu’ils couvrent et ce qu’ils coûtent.", "See your tools, the uses they cover and what they cost.")}</p>
        {!empty && <>
          <dl className="sg-stats ms-hero-stats">
            <div><dt>{t("Outils", "Tools")}</dt><dd>{selectedTools.length}</dd><span>{t(`${mapTerritories.length} domaine${mapTerritories.length > 1 ? "s" : ""}`, `${mapTerritories.length} area${mapTerritories.length > 1 ? "s" : ""}`)}</span></div>
            <div><dt>{t("Coût mensuel", "Monthly cost")}</dt><dd>{stackCost.paid > 0 ? `≈ ${formatAmount(Math.round(stackCost.total), currency, lang)}` : t("Gratuit", "Free")}</dd><span>{stackCost.paid > 0 ? t(`${stackCost.paid} outil${stackCost.paid > 1 ? "s" : ""} payant${stackCost.paid > 1 ? "s" : ""}`, `${stackCost.paid} paid tool${stackCost.paid > 1 ? "s" : ""}`) : t("rien de payant", "nothing paid")}</span></div>
            {/* The thread of the page: what I pay, and what I pay twice. */}
            <div className={overlapScore.doubleTotal > 0 ? "ms-stat--overlaps" : undefined}><dt>{t("Payé en double", "Paid twice")}</dt><dd>{overlapScore.doubleTotal > 0 ? `≈ ${formatAmount(Math.round(overlapScore.doubleTotal), currency, lang)}` : (overlapPairs > 0 ? formatAmount(0, currency, lang) : t("Rien", "None"))}</dd>{overlapPairs > 0
              ? <a className="ms-stat-link" href="#ms-overlaps" onClick={(event) => { event.preventDefault(); jumpTo("ms-overlaps"); }}>{t(`${overlapPairs} recoupement${overlapPairs > 1 ? "s" : ""}`, `${overlapPairs} overlap${overlapPairs > 1 ? "s" : ""}`)} ↓</a>
              : <span>{t("aucun recoupement connu", "no known overlap")}</span>}</div>
          </dl>
        </>}
        {!empty && <button className="tt-button-primary ms-hero-add" ref={addRef} onClick={() => setSearchOpen((open) => !open)} aria-expanded={searchOpen} aria-controls="ms-search"><Plus size={18} aria-hidden />{t("Ajouter un outil", "Add a tool")}</button>}
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

    {showSearch && <section className="ms-search" id="ms-search" aria-label={t("Ajouter un outil", "Add a tool")}>
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
    </section>}

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
          <button type="button" className="ms-calibrate-skip" onClick={() => plans.markReviewed(freemiumTools.map(toolKey))}>{t("Aucun", "None")}</button>
          <button type="button" className="tt-button-primary ms-calibrate-go" onClick={() => setFreemiumSheet(true)}>{t("Indiquer lesquels", "Pick them")}</button>
        </div>
      </aside>}

      <StackOverlapPairs tools={selectedTools} categories={categories} isPaid={plans.isPaid} currency={currency} prefix={prefix} lang={lang} onSelect={selectTool} />

      <section className="sg-section ms-section ms-budget-section" aria-labelledby="ms-budget-section-title">
        <div className="sg-section-heading"><span className="sg-eyebrow">{t("Budget", "Budget")}</span><h2 id="ms-budget-section-title">{t("Combien coûte ma stack ?", "What does my stack cost?")}</h2></div>
        <StackBudgetBreakdown territories={mapTerritories} colorOf={colorOf} paid={plans} currency={currency} lang={lang} onSelect={selectTool} onFreemium={() => setFreemiumSheet(true)} />
      </section>

      <StackFreemiumPlans open={freemiumOpen} onOpenChange={setFreemiumSheet} freemium={freemiumTools} paid={plans} currency={currency} lang={lang} />

      <section className="sg-section ms-section ms-tools-section" aria-labelledby="ms-list-title">
        <div className="sg-section-heading"><span className="sg-eyebrow">{t("Mes outils", "My tools")}</span><h2 id="ms-list-title">{t("Quel outil pour quoi ?", "Which tool does what?")}</h2></div>
        <div className="ms-domain-filters" role="group" aria-label={t("Filtrer par domaine", "Filter by area")}>
          <button type="button" aria-pressed={activeFilter === "all"} onClick={() => chooseDomain("all")}>{t("Tous", "All")}<span>{selectedTools.length}</span></button>
          {mapTerritories.map((territory) => <button key={territory.id} type="button" aria-pressed={activeFilter === territory.id} onClick={() => chooseDomain(territory.id)}>
            {territory.id === "assist" ? t("IA", "AI") : territory.label}<span>{territory.tools.length}</span>
          </button>)}
        </div>
        <div className={`ms-workspace${selected ? " ms-workspace--focused" : ""}`}>
          <div className="ms-overview"><div className="ms-card-grid">{listTools.map(renderTool)}</div></div>
          {selected && <aside className="ms-focus-rail">{renderInspector(selectedTools)}</aside>}
        </div>
      </section>
      {missing.length > 0 && <section className="ms-unavailable"><h2>{t("Outils indisponibles", "Unavailable tools")}</h2>
        <p>{t("Ces références ne sont plus disponibles dans le catalogue actuel. Votre sélection est conservée.", "These references are unavailable in the current catalogue. Your selection is retained.")}</p>
        {missing.map((slug) => <div key={slug}><span>{slug}</span><button onClick={() => removeTool(slug, slug)}>{t("Retirer de ma stack", "Remove from stack")}</button></div>)}
        {loading && <p role="status">{t("Actualisation du catalogue…", "Refreshing catalogue…")}</p>}
      </section>}
    </>}
  </main>;
}
