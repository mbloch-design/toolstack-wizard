import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Check, X } from "@/lib/icons";
import { toast } from "sonner";
import ToolLogo from "@/components/ToolLogo";
import StackToolInspector from "@/components/stack/StackToolInspector";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { useCategories, useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { readStackView, STACK_VIEW_KEY, stackCatalogPrice, stackTerritories, toolKey, type StackViewMode } from "@/lib/stackView";

const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export default function CartPage() {
  const { t, lang, prefix } = useLang();
  const { tools, loading } = useToolSummaries();
  const { categories } = useCategories();
  const { state, persistenceStatus, pinTool, unpinTool, restoreTool } = useStackPins();
  const [params, setParams] = useSearchParams();
  const [mode, setMode] = useState<StackViewMode>(readStackView);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const lastToolButton = useRef<HTMLButtonElement | null>(null);
  const selectedSlug = params.get("outil");
  const lookup = useMemo(() => new Map(tools.flatMap((tool) => [[tool.id, tool], [toolKey(tool), tool]] as [string, ToolSummary][])), [tools]);
  const selectedTools = useMemo(() => Array.from(new Map(state.pinnedToolSlugs.flatMap((slug) => {
    const tool = lookup.get(slug);
    return tool ? [[tool.id, tool] as const] : [];
  })).values()), [state.pinnedToolSlugs, lookup]);
  const missing = state.pinnedToolSlugs.filter((slug) => !lookup.has(slug));
  const territories = useMemo(() => stackTerritories(selectedTools, categories, lang), [selectedTools, categories, lang]);
  const selected = selectedTools.find((tool) => toolKey(tool) === selectedSlug || tool.id === selectedSlug);
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
    const next = new URLSearchParams(params);
    next.set("outil", slug);
    setParams(next);
  }
  function closeInspector() {
    const next = new URLSearchParams(params);
    next.delete("outil");
    setParams(next, { replace: true });
    lastToolButton.current?.focus({ preventScroll: true });
  }
  function removeTool(slug: string, name: string) {
    const index = state.toolEntries.findIndex((entry) => entry.toolSlug === slug);
    const entry = state.toolEntries[index];
    if (!entry) return;
    unpinTool(slug);
    closeInspector();
    requestAnimationFrame(() => addRef.current?.focus({ preventScroll: true }));
    toast(t(`${name} retiré du stack.`, `${name} removed from your stack.`), {
      duration: 6000,
      action: { label: t("Annuler", "Undo"), onClick: () => restoreTool(entry, index) },
    });
  }
  function chooseMode(next: StackViewMode) {
    setMode(next);
    try { window.localStorage.setItem(STACK_VIEW_KEY, next); } catch { /* Keep the session functional. */ }
  }
  function renderTool(tool: ToolSummary) {
    const active = selected?.id === tool.id;
    const price = stackCatalogPrice(tool, lang);
    return <button
      key={tool.id}
      type="button"
      className={`ms-tool${active ? " ms-tool--selected" : ""}`}
      aria-expanded={active}
      aria-controls={active ? "ms-tool-context" : undefined}
      onClick={(event) => { lastToolButton.current = event.currentTarget; active ? closeInspector() : selectTool(toolKey(tool)); }}
    >
      <ToolLogo tool={tool} size={40} />
      <span className="ms-tool-copy"><strong>{tool.name}</strong>{price && <span>{price}</span>}</span>
    </button>;
  }

  return <main className="ms-page">
    <header className="ms-header">
      <div><h1>{t("Mon Stack", "My Stack")}</h1><p>{t("Votre environnement logiciel, en un regard.", "Your software environment at a glance.")}</p></div>
      {!empty && <button className="ms-add" ref={addRef} onClick={() => setSearchOpen((open) => !open)} aria-expanded={searchOpen} aria-controls="ms-search"><Plus size={18} aria-hidden />{t("Ajouter un outil", "Add a tool")}</button>}
    </header>

    {empty && <p className="ms-empty-copy">{t("Ajoutez les outils que vous utilisez. ToolTrim organise automatiquement votre environnement.", "Add the tools you use. ToolTrim automatically organizes your environment.")}</p>}
    {persistenceStatus.state === "degraded" && <p className="ms-storage-notice" role="status">{persistenceStatus.issue === "current-corrupt" || persistenceStatus.issue === "backup-corrupt"
      ? t("La sauvegarde locale est illisible. Vous pouvez constituer un nouveau stack.", "The local snapshot cannot be read. You can build a new stack.")
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
            onClick={() => { pinTool(toolKey(tool)); toast.success(t(`${tool.name} ajouté au stack.`, `${tool.name} added to your stack.`)); }}
          >{present ? <Check size={18} aria-hidden /> : <Plus size={18} aria-hidden />}</button></li>;
        })}</ul>
      </>}
    </section>}

    {!empty && <>
      <div className="ms-view-switch" role="group" aria-label={t("Affichage du stack", "Stack view")}>
        <button aria-pressed={mode === "stack"} onClick={() => chooseMode("stack")}>Stack</button>
        <button aria-pressed={mode === "map"} onClick={() => chooseMode("map")}>Map</button>
      </div>
      <div className={mode === "map" ? "ms-territories ms-territories--map" : "ms-territories ms-territories--stack"}>
        {territories.map((territory) => <section key={territory.id} className={`ms-territory${territory.tools.length >= 5 ? " ms-territory--wide" : ""}`} aria-labelledby={`ms-territory-${territory.id}`}>
          <h2 id={`ms-territory-${territory.id}`}>{territory.label}</h2>
          <div className="ms-tools">{territory.tools.map(renderTool)}</div>
          {selected && territory.tools.some((tool) => tool.id === selected.id) && <div id="ms-tool-context">
            <StackToolInspector key={selected.id} tool={selected} selectedTools={selectedTools} categoryLabel={territory.label} prefix={prefix} lang={lang} t={t} onClose={closeInspector} onSelect={selectTool} onRemove={() => removeTool(state.pinnedToolSlugs.find((slug) => lookup.get(slug)?.id === selected.id) || toolKey(selected), selected.name)} />
          </div>}
        </section>)}
      </div>
      {missing.length > 0 && <section className="ms-unavailable"><h2>{t("Outils indisponibles", "Unavailable tools")}</h2>
        <p>{t("Ces références ne sont plus disponibles dans le catalogue actuel. Votre sélection est conservée.", "These references are unavailable in the current catalogue. Your selection is retained.")}</p>
        {missing.map((slug) => <div key={slug}><span>{slug}</span><button onClick={() => removeTool(slug, slug)}>{t("Retirer du stack", "Remove from stack")}</button></div>)}
        {loading && <p role="status">{t("Actualisation du catalogue…", "Refreshing catalogue…")}</p>}
      </section>}
    </>}
  </main>;
}
