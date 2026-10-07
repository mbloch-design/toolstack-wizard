import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Check, X, CircleDot, LayoutGrid } from "@/lib/icons";
import { toast } from "sonner";
import ToolLogo from "@/components/ToolLogo";
import StackUsageExplorer from "@/components/stack/StackUsageExplorer";
import StackToolInspector from "@/components/stack/StackToolInspector";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { useCategories, useToolSummaries, useToolBySlug, type ToolSummary } from "@/hooks/useSupabaseData";
import { readStackView, STACK_VIEW_KEY, stackCatalogPrice, toolKey, type StackViewMode } from "@/lib/stackView";
import { stackDisplayLabel, stackPlacement, stackMapTerritories, stackRelations } from "@/lib/stackUsage";
import { getScrollTop, scrollToY } from "@/lib/scroll";

const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export default function CartPage() {
  const { t, lang, prefix } = useLang();
  const { tools, loading } = useToolSummaries();
  const { categories } = useCategories();
  const { state, persistenceStatus, pinTool, unpinTool, restoreTool } = useStackPins();
  const [params, setParams] = useSearchParams();
  const [mode, setMode] = useState<StackViewMode>(readStackView);
  const [domainFilter, setDomainFilter] = useState("all");
  const [telescopeRequest, setTelescopeRequest] = useState<{ id: string; revision: number } | null>(null);
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
  const overlapPairs = useMemo(() => {
    const pairs = new Set<string>();
    overlapsById.forEach((others, id) => others.forEach((other) => pairs.add([id, other.id].sort().join("|"))));
    return pairs.size;
  }, [overlapsById]);
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
    if (mode === "stack" && target && !visibleIds.has(target.id)) setDomainFilter("all");
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
    if (mode === "map") {
      setTelescopeRequest((previous) => ({ id, revision: (previous?.revision ?? 0) + 1 }));
      return;
    }
    const members = mapTerritories.find((territory) => territory.id === id)?.tools;
    if (selected && id !== "all" && !members?.some((tool) => tool.id === selected.id)) {
      const next = new URLSearchParams(params);
      next.delete("outil");
      setParams(next, { replace: true, state: { skipScrollReset: true }, preventScrollReset: true });
      contextScroll.current = null;
      lastToolButton.current = null;
    }
  }
  function chooseMode(next: StackViewMode) {
    if (selected) contextScroll.current = getScrollTop();
    if (next === "map" && mode !== "map" && selected) setTelescopeRequest(null);
    if (next === "map" && mode !== "map" && !selected) {
      setTelescopeRequest((previous) => ({ id: activeFilter, revision: (previous?.revision ?? 0) + 1 }));
    }
    setMode(next);
    try { window.localStorage.setItem(STACK_VIEW_KEY, next); } catch { /* Keep the session functional. */ }
  }
  function renderTool(tool: ToolSummary) {
    const active = selected?.id === tool.id;
    const price = mode === "stack" ? stackCatalogPrice(tool, lang) : null;
    const overlaps = overlapsById.get(tool.id) || [];
    return <button
      key={tool.id}
      type="button"
      data-tool-id={tool.id}
      className={`ms-tool ms-tool-card${active ? " ms-tool--selected" : ""}`}
      aria-expanded={active}
      aria-controls={active ? "ms-tool-context" : undefined}
      onClick={(event) => { lastToolButton.current = event.currentTarget; active ? closeInspector() : selectTool(toolKey(tool)); }}
    >
      <ToolLogo tool={tool} size={40} />
      <span className="ms-tool-copy"><strong>{tool.name}</strong>{mode === "stack" && <span>{stackDisplayLabel(stackPlacement(tool, categories, lang).label, lang)}</span>}</span>{price && <span className="ms-list-price">{price}</span>}
      {mode === "stack" && overlaps.length > 0 && <span className="ms-card-overlap">
        {t(`Recoupe ${overlaps[0].name}`, `Overlaps with ${overlaps[0].name}`)}{overlaps.length > 1 ? ` +${overlaps.length - 1}` : ""}
      </span>}
    </button>;
  }

  function renderInspector(members: ToolSummary[]) {
    return selected && members.some((tool) => tool.id === selected.id) && <div id="ms-tool-context" className="ms-context-slot">
      <StackToolInspector key={selected.id} tool={resolved || selected} relations={relations} categories={categories} prefix={prefix} lang={lang} t={t} onClose={closeInspector} onSelect={selectTool} onRemove={() => removeTool(state.pinnedToolSlugs.find((slug) => lookup.get(slug)?.id === selected.id) || toolKey(selected), selected.name)} />
    </div>;
  }

  return <main className="ms-page">
    <header className="ms-header">
      <div><h1>{t("Mes outils", "My tools")}</h1><p>{t("Retrouvez vos outils et les usages qu’ils couvrent.", "See your tools and the uses they cover.")}</p></div>
      {!empty && <button className="tt-button-primary" ref={addRef} onClick={() => setSearchOpen((open) => !open)} aria-expanded={searchOpen} aria-controls="ms-search"><Plus size={18} aria-hidden />{t("Ajouter un outil", "Add a tool")}</button>}
    </header>

    {/* One factual line to read the whole stack at a glance, with the view
        switch on the same row: it stays in place in both views. */}
    {!empty && <div className="ms-overview-bar">
      <p className="ms-summary">
        <span>{t(`${selectedTools.length} outil${selectedTools.length > 1 ? "s" : ""}`, `${selectedTools.length} tool${selectedTools.length > 1 ? "s" : ""}`)}</span>
      <span>{t(`${mapTerritories.length} domaine${mapTerritories.length > 1 ? "s" : ""}`, `${mapTerritories.length} area${mapTerritories.length > 1 ? "s" : ""}`)}</span>
      <span className={overlapPairs > 0 ? "ms-summary-overlaps" : undefined}>{overlapPairs > 0
        ? t(`${overlapPairs} recoupement${overlapPairs > 1 ? "s" : ""} possible${overlapPairs > 1 ? "s" : ""}`, `${overlapPairs} potential overlap${overlapPairs > 1 ? "s" : ""}`)
        : t("Aucun recoupement connu", "No known overlap")}</span>
    </p>
      <div className="ms-view-switch" role="group" aria-label={t("Affichage de la stack", "Stack view")}>
        <button type="button" aria-label={t("Cartes", "Cards")} title={t("Cartes", "Cards")} aria-pressed={mode === "stack"} onClick={() => chooseMode("stack")}><LayoutGrid size={21} aria-hidden /><span>{t("Cartes", "Cards")}</span></button>
        <button type="button" aria-label={t("Par usage", "By use")} title={t("Par usage", "By use")} aria-pressed={mode === "map"} onClick={() => chooseMode("map")}><CircleDot size={21} aria-hidden /><span>{t("Par usage", "By use")}</span></button>
      </div>
    </div>}
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
      {/* Area tabs in Cards only: By use has its own area navigation. */}
      {mode !== "map" && <div className="ms-toolbar">
        <div className="ms-domain-filters" role="group" aria-label={t("Filtrer par domaine", "Filter by area")}>
          <button type="button" aria-pressed={activeFilter === "all"} onClick={() => chooseDomain("all")}>{t("Tous les outils", "All tools")}<span>{selectedTools.length}</span></button>
          {mapTerritories.map((territory) => <button key={territory.id} type="button" aria-pressed={activeFilter === territory.id} onClick={() => chooseDomain(territory.id)}>
            {territory.id === "assist" ? t("IA", "AI") : territory.label}<span>{territory.tools.length}</span>
          </button>)}
        </div>
      </div>}
      <div className={`ms-workspace${selected ? " ms-workspace--focused" : ""}`}>
        <div className="ms-overview">
          {mode === "map" ? <StackUsageExplorer territories={mapTerritories} navigationRequest={telescopeRequest} onDomainChange={setDomainFilter} lang={lang} selectedId={selected?.id} onNavigate={() => { if (selected) closeInspector(); }} onSelect={(slug) => selected && toolKey(selected) === slug ? closeInspector() : selectTool(slug)} /> : <section aria-labelledby="ms-list-title">
            <h2 className="tt-section-title ms-list-title" id="ms-list-title">{activeFilter === "all" ? t("Tous les outils", "All tools") : visibleMap[0]?.label}</h2>
            <div className="ms-card-grid">{listTools.map(renderTool)}</div>
          </section>}
        </div>
      {selected && <aside className="ms-focus-rail">{renderInspector(selectedTools)}</aside>}
      </div>
      {missing.length > 0 && <section className="ms-unavailable"><h2>{t("Outils indisponibles", "Unavailable tools")}</h2>
        <p>{t("Ces références ne sont plus disponibles dans le catalogue actuel. Votre sélection est conservée.", "These references are unavailable in the current catalogue. Your selection is retained.")}</p>
        {missing.map((slug) => <div key={slug}><span>{slug}</span><button onClick={() => removeTool(slug, slug)}>{t("Retirer de ma stack", "Remove from stack")}</button></div>)}
        {loading && <p role="status">{t("Actualisation du catalogue…", "Refreshing catalogue…")}</p>}
      </section>}
    </>}
  </main>;
}
