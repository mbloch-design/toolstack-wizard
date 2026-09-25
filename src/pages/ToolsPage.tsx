import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, type ToolSummary } from "@/hooks/useSupabaseData";
import { ChevronRight, Filter, Search, X } from "@/lib/icons";
import { compareByDemand, formatFacetLabel, getToolSearchText, hasFreePlan, isPaid, knownPrice, normalizeToolText, toolFacets } from "@/lib/catalogFilters";
import { toolTagline } from "@/data/toolTaglines";
import { CATALOG_NEEDS } from "@/data/catalogNeeds";
import { activePlacements, type CatalogPlacement } from "@/data/catalogPlacements";
import ToolCardImage from "@/components/tool/ToolCardImage";
import ToolLogo from "@/components/ToolLogo";
import PinToolButton from "@/components/PinToolButton";
import { setSeoTags, setJsonLd, setHreflang, setNoindex, cleanupSeo, hasNonCanonicalSearchParams } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Breadcrumb from "@/components/Breadcrumb";
import { getExplorerHref } from "@/lib/toolExploration";
import { useCatalogStickyToolbar } from "@/hooks/useCatalogStickyToolbar";
import { trackEvent } from "@/lib/analytics";

const TOOLS_PER_PAGE = 40;


type SortKey = "popular" | "name" | "price-asc";
type PriceFilter = "all" | "free" | "paid";


const ToolsPage = () => {
  const location = useLocation();
  const { lang, t, prefix } = useLang();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get("q") || "";
  const urlPrice = searchParams.get("pricing");
  const [search, setSearch] = useState(urlSearch);
  // La catégorie ouverte et ses tags vivent dans l'URL, au même titre que `q`,
  // `pricing` et `vertical`. En état React seul, un filtre ne se partageait pas,
  // ne se mettait pas en favori et ignorait le bouton retour.
  const browsedCategoryId = searchParams.get("category") || "";
  // Primary filter: a need (src/data/catalogNeeds.ts). `category` still works
  // for links elsewhere on the site, shown as a removable chip.
  const needId = searchParams.get("need") || "";
  const activeNeed = CATALOG_NEEDS.find((need) => need.id === needId);
  const needCategoryIds = useMemo(() => new Set(activeNeed?.categoryIds || []), [activeNeed]);
  const inNeed = useCallback((tool: ToolSummary) => !activeNeed || needCategoryIds.has(tool.categoryId), [activeNeed, needCategoryIds]);
  const selectedTags = useMemo(
    () => (searchParams.get("tags") || "").split(",").filter(Boolean),
    [searchParams],
  );
  const [sort, setSort] = useState<SortKey>("popular");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(urlPrice === "free" || urlPrice === "paid" ? urlPrice : "all");
  const [visibleCount, setVisibleCount] = useState(TOOLS_PER_PAGE);
  const [panelOpen, setPanelOpen] = useState(false);
  const { toolbarStuck, toolbarSentinelRef } = useCatalogStickyToolbar();
  const pillRowRef = useRef<HTMLElement | null>(null);

  // A deep link or a reload on ?need=… must show its pill: on a phone the
  // active need is often past the visible end of the row.
  useEffect(() => {
    const row = pillRowRef.current;
    const pill = row?.querySelector<HTMLElement>(".tt-pill--active");
    if (!row || !pill) return;
    const target = pill.offsetLeft - (row.clientWidth - pill.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [needId, browsedCategoryId]);

  useEffect(() => {
    // Same title as the prerendered page (vite.config.ts); the client one
    // used to replace it on hydration with a different, em-dash variant.
    const title = lang === "fr"
      ? "Tous les outils SaaS pour freelances | ToolTrim"
      : "All SaaS tools for freelancers | ToolTrim";
    const desc = lang === "fr"
      ? `${tools.length} outils SaaS analysés indépendamment : prix vérifiés, alternatives visibles, verdicts honnêtes.`
      : `${tools.length} SaaS tools reviewed independently: verified pricing, visible alternatives, honest verdicts.`;
    const url = `https://tooltrim.com/${lang}/tools`;
    setSeoTags({ title, description: desc, url });
    if (hasNonCanonicalSearchParams(searchParams)) setNoindex();
    setHreflang(`/${lang}/tools`);
    setJsonLd("tools-jsonld", {
      "@context": "https://schema.org", "@type": "CollectionPage",
      name: title, description: desc, url,
      mainEntity: {
        "@type": "ItemList", numberOfItems: tools.length,
        itemListElement: tools.slice(0, 30).map((tool, i) => ({
          "@type": "ListItem", position: i + 1,
          name: tool.name, url: `https://tooltrim.com/${lang}/tool/${tool.slug || tool.id}`,
        })),
      },
    });
    return () => cleanupSeo(["tools-jsonld"]);
  }, [lang, tools, searchParams]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tool of tools) counts.set(tool.categoryId, (counts.get(tool.categoryId) || 0) + 1);
    return counts;
  }, [tools]);

  const sortedCategories = useMemo(() =>
    [...categories].sort((a, b) => (categoryCounts.get(b.id) || 0) - (categoryCounts.get(a.id) || 0)),
    [categories, categoryCounts]
  );
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const browsedCategory = browsedCategoryId ? categoryById.get(browsedCategoryId) : undefined;
  /**
   * Facettes de la catégorie ouverte, liste entière. La troncature précédente
   * à douze en cachait 121 sur la pire catégorie, sans aucun moyen d'y accéder.
   *
   * Le compteur est celui qu'aurait la facette si on la cochait en plus des
   * filtres courants. En logique ET, une facette à zéro conduit à une liste
   * vide : on la désactive plutôt que d'y laisser tomber.
   */
  const facetOptions = useMemo(() => {
    const q = normalizeToolText(search);
    const pool = tools.filter((tool) => {
      if (browsedCategoryId && tool.categoryId !== browsedCategoryId) return false;
      if (!inNeed(tool)) return false;
      if (priceFilter === "free" && !hasFreePlan(tool)) return false;
      if (priceFilter === "paid" && !isPaid(tool)) return false;
      if (!search) return true;
      const category = categoryById.get(tool.categoryId);
      const categoryLabel = category
        ? `${stripLeadingEmoji(category.name, category.id)} ${stripLeadingEmoji(category.nameEn || category.name, category.id)}`
        : "";
      return getToolSearchText(tool, categoryLabel).includes(q);
    });

    const univers = new Set<string>();
    const atteignables = new Map<string, number>();
    for (const tool of pool) {
      const facets = toolFacets(tool);
      const retenu = selectedTags.every((tag) => facets.has(tag));
      for (const facet of facets) {
        univers.add(facet);
        if (retenu) atteignables.set(facet, (atteignables.get(facet) || 0) + 1);
      }
    }

    const classees = [...univers]
      .map((id) => ({ id, count: atteignables.get(id) || 0, label: formatFacetLabel(id, lang) }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

    // Une catégorie plafonne à 133 facettes : on les montre toutes. Sans
    // catégorie, l'univers en compte 562 — on s'en tient aux plus fréquentes,
    // la catégorie restant la porte d'entrée normale.
    // Usages only make sense inside a need: without one, the pool mixes 586
    // labels, 315 of them used by a single tool. Keep the ones that narrow a
    // real set (3+ tools), or that are already selected.
    if (!activeNeed && !browsedCategoryId) return [];
    return classees.filter((facet) => facet.count >= 3 || selectedTags.includes(facet.id)).slice(0, 16);
  }, [activeNeed, browsedCategoryId, categoryById, inNeed, lang, priceFilter, search, selectedTags, tools]);

  // Placements (editorial or sponsored), from src/data/catalogPlacements.ts.
  const placements = useMemo(() => activePlacements(new Date().toISOString().slice(0, 10)), []);
  const bySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);
  const spotlight = useMemo(() => placements
    .filter((entry) => entry.placement === "spotlight")
    .map((entry) => ({ entry, tool: bySlug.get(entry.slug) }))
    .filter((item): item is { entry: CatalogPlacement; tool: ToolSummary } => Boolean(item.tool))
    .slice(0, 3), [bySlug, placements]);

  // Category shelves: the six largest categories, nine tools each, ranked on
  // real search demand (never on how complete a fiche is). A placement for
  // the category takes the first slot.
  const shelves = useMemo(() => {
    const spotlightIds = new Set(spotlight.map((item) => item.tool.id));
    return sortedCategories.slice(0, 6).map((category) => {
      const pinned = placements
        .filter((entry) => entry.placement === category.id)
        .map((entry) => ({ entry, tool: bySlug.get(entry.slug) }))
        .filter((item): item is { entry: CatalogPlacement; tool: ToolSummary } => Boolean(item.tool));
      const pinnedIds = new Set(pinned.map((item) => item.tool.id));
      const ranked = tools
        .filter((tool) => tool.categoryId === category.id && !pinnedIds.has(tool.id) && !spotlightIds.has(tool.id))
        .sort(compareByDemand)
        .map((tool) => ({ entry: undefined as CatalogPlacement | undefined, tool }));
      return {
        category,
        count: categoryCounts.get(category.id) || 0,
        items: [...pinned, ...ranked].slice(0, 9),
      };
    }).filter((shelf) => shelf.items.length >= 3);
  }, [bySlug, categoryCounts, placements, sortedCategories, spotlight, tools]);

  // All tools filtered + sorted
  const filtered = useMemo(() => {
    const q = normalizeToolText(search);
    const result = tools.filter(tool => {
      const category = categoryById.get(tool.categoryId);
      const categoryLabel = category
        ? `${stripLeadingEmoji(category.name, category.id)} ${stripLeadingEmoji(category.nameEn || category.name, category.id)}`
        : "";
      const searchText = getToolSearchText(tool, categoryLabel);
      const matchSearch = !search || searchText.includes(q);
      const matchCat = (!browsedCategoryId || tool.categoryId === browsedCategoryId) && inNeed(tool);
      const toolTags = [
        ...(tool.functional_needs || []),
        ...(tool.covers || []),
      ].map((tag) => normalizeToolText(tag).trim());
      const matchTags = selectedTags.every((tag) => toolTags.includes(tag));
      const matchPrice =
        priceFilter === "free" ? hasFreePlan(tool) :
        priceFilter === "paid" ? isPaid(tool) :
        true;
      return matchSearch && matchCat && matchTags && matchPrice;
    });

    result.sort((a, b) => {
      if (sort === "popular") {
        // Real search demand, not fiche maturity.
        return compareByDemand(a, b);
      }
      if (sort === "name") return (a.name ?? "").localeCompare(b.name ?? "");
      if (sort === "price-asc") {
        // Unknown prices (not published) go last, never first as "0".
        const pa = knownPrice(a), pb = knownPrice(b);
        if (pa === null || pb === null) return (pa === null ? 1 : 0) - (pb === null ? 1 : 0);
        return pa - pb;
      }
      return 0;
    });
    return result;
  }, [categoryById, tools, search, browsedCategoryId, inNeed, selectedTags, priceFilter, sort]);

  useEffect(() => { setVisibleCount(TOOLS_PER_PAGE); }, [search, browsedCategoryId, needId, selectedTags, priceFilter, sort]);

  useEffect(() => { setSearch(urlSearch); }, [urlSearch]);

  // A need opened on its own (no price, use, search or other sort on top) gets
  // a small landing: its sponsored placement first, if any, then its most
  // searched tools. They leave the grid below so no tool shows twice.
  const needTop = useMemo(() => {
    if (!activeNeed || search || browsedCategoryId || selectedTags.length > 0 || priceFilter !== "all" || sort !== "popular") return [];
    const sponsored = placements
      .filter((entry) => entry.placement === `need:${activeNeed.id}`)
      .map((entry) => ({ entry: entry as CatalogPlacement | undefined, tool: bySlug.get(entry.slug) }))
      .filter((item): item is { entry: CatalogPlacement | undefined; tool: ToolSummary } => Boolean(item.tool) && inNeed(item.tool as ToolSummary));
    const taken = new Set(sponsored.map((item) => item.tool.id));
    const ranked = filtered
      .filter((tool) => !taken.has(tool.id))
      .map((tool) => ({ entry: undefined as CatalogPlacement | undefined, tool }));
    return [...sponsored, ...ranked].slice(0, 3);
  }, [activeNeed, browsedCategoryId, bySlug, filtered, inNeed, placements, priceFilter, search, selectedTags.length, sort]);
  const gridTools = useMemo(() => {
    if (needTop.length === 0) return filtered;
    const topIds = new Set(needTop.map((item) => item.tool.id));
    return filtered.filter((tool) => !topIds.has(tool.id));
  }, [filtered, needTop]);

  const visible = gridTools.slice(0, visibleCount);
  const hasMore = visibleCount < gridTools.length;
  const getCatLabel = (cat: typeof categories[0]) =>
    t(stripLeadingEmoji(cat.name, cat.id), stripLeadingEmoji(cat.nameEn, stripLeadingEmoji(cat.name, cat.id)));

  const isFiltering = !!(search || browsedCategoryId || needId || selectedTags.length > 0 || priceFilter !== "all");
  const activeFilterCount = selectedTags.length + (priceFilter !== "all" ? 1 : 0) + (sort !== "popular" ? 1 : 0);

  function applyPrice(next: PriceFilter) {
    setPriceFilter(next);
    updateParams((params) => {
      if (next === "all") params.delete("pricing");
      else params.set("pricing", next);
    }, true);
  }

  function resetFilters() {
    setPriceFilter("all");
    setSort("popular");
    updateParams((params) => {
      params.delete("pricing");
      params.delete("tags");
    }, true);
  }

  function removeTag(tagId: string) {
    const next = selectedTags.filter((id) => id !== tagId);
    updateParams((params) => {
      if (next.length) params.set("tags", next.join(","));
      else params.delete("tags");
    }, true);
  }

  function clearUrlParam(paramName: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(paramName);
    setSearchParams(nextParams, { replace: true });
  }

  /**
   * Ouvrir ou fermer une catégorie est une étape de navigation : on empile,
   * pour que le retour arrière ramène au niveau précédent. Cocher un tag reste
   * un ajustement au sein de cette étape et remplace l'entrée courante, sinon
   * quatre tags cochés imposeraient quatre retours pour quitter la catégorie.
   */
  function updateParams(mutate: (params: URLSearchParams) => void, replace = false) {
    const next = new URLSearchParams(searchParams);
    mutate(next);
    setSearchParams(next, { replace });
  }

  function openCategoryBranch(categoryId: string) {
    trackEvent("filter_category", { category_id: categoryId, source: "tools_catalog" });
    updateParams((params) => {
      params.set("category", categoryId);
      params.delete("tags");
    });
  }

  function openNeed(id: string) {
    trackEvent("filter_category", { category_id: id, source: "tools_catalog_need" });
    updateParams((params) => {
      params.set("need", id);
      params.delete("category");
      params.delete("tags");
    });
  }

  function closeCategoryBranch() {
    updateParams((params) => {
      params.delete("category");
      params.delete("need");
      params.delete("tags");
    });
  }

  function clearBranchTags() {
    updateParams((params) => params.delete("tags"), true);
  }

  function toggleBranchTag(tagId: string) {
    const next = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];
    updateParams((params) => {
      if (next.length) params.set("tags", next.join(","));
      else params.delete("tags");
    }, true);
  }

  // Large editorial card, shared by "Featured" and a need's top picks. A
  // placement can override the eyebrow and the line under the name.
  function renderPepite({ entry, tool }: { entry?: CatalogPlacement; tool: ToolSummary }) {
    const catObj = categoryById.get(tool.categoryId);
    const catLabel = catObj ? (lang === "en" ? stripLeadingEmoji(catObj.nameEn, catObj.id) : stripLeadingEmoji(catObj.name, catObj.id)) : "";
    const eyebrow = (lang === "en" ? entry?.eyebrowEn : entry?.eyebrowFr) || catLabel;
    // Two or three words on what the tool does.
    const pitch = (lang === "en" ? entry?.pitchEn : entry?.pitchFr) || toolTagline(tool.slug || tool.id, lang);
    return (
      <Link key={tool.id} to={`${prefix}/tool/${tool.slug || tool.id}`} className="tt-pepite">
        <ToolCardImage tool={tool} logoSize={56} className="tt-pepite-media" />
        <span className="tt-pepite-eyebrow">
          {eyebrow}
          {entry?.sponsored ? <span className="tt-sponsored">{t("Sponsorisé", "Sponsored")}</span> : null}
        </span>
        <span className="tt-pepite-title">{tool.name}</span>
        {pitch ? <span className="tt-pepite-sub">{pitch}</span> : null}
      </Link>
    );
  }

  return (
    <div className="tt-catalog-page min-h-screen" style={{ "--page-accent": "#10DDD6" } as React.CSSProperties}>

      {/* ══════════════ BODY ══════════════ */}
      <div className="tt-catalog-container">
        {/* ── Compact header: one title, then the catalogue controls. ── */}
        <div className="tt-catalog-compact-header">
          {/* La catégorie ouverte est un état de la page, pas une URL distincte :
              elle ferme le fil sans lien, le niveau « Outils » ramène à la racine. */}
          <Breadcrumb
            items={activeNeed
              ? [{ label: t("Outils", "Tools") as string, href: `${prefix}/tools` }, { label: (lang === "en" ? activeNeed.en : activeNeed.fr) as string }]
              : browsedCategory
                ? [{ label: t("Outils", "Tools") as string, href: `${prefix}/tools` }, { label: getCatLabel(browsedCategory) as string }]
                : [{ label: t("Outils", "Tools") as string }]}
          />
          <h1 className="tt-catalog-compact-title">{t("Outils", "Tools")}</h1>
        </div>

        <div ref={toolbarSentinelRef} aria-hidden="true" style={{ height: 1 }} />

        {/* ── Barre de filtres ──
            Une seule rangée de pilules pour les catégories, puis les contrôles.
            Ce qui ne tient pas se rejoint par « Plus de filtres » : il n'y a
            plus de flèches posées sur les libellés ni de facettes injoignables. */}
        <div data-toolbar="catalog" className={`tt-catalog-toolbar tt-sticky-toolbar${toolbarStuck ? " tt-sticky-toolbar--stuck" : ""}`}>
          <nav
            ref={pillRowRef}
            className="tt-pillrow"
            aria-label={t("Filtrer par besoin", "Filter by need") as string}
            // Straight to the DOM: a fade toggle is not worth a re-render per scroll frame.
            onScroll={(event) => { event.currentTarget.dataset.scrolled = String(event.currentTarget.scrollLeft > 4); }}
          >
            <button
              type="button"
              className={`tt-pill${!needId && !browsedCategoryId ? " tt-pill--active" : ""}`}
              onClick={closeCategoryBranch}
              aria-pressed={!needId && !browsedCategoryId}
            >
              {t("Tout", "All")}
            </button>
            {CATALOG_NEEDS.map((need) => {
              const actif = needId === need.id;
              return (
                <button
                  key={need.id}
                  type="button"
                  className={`tt-pill${actif ? " tt-pill--active" : ""}`}
                  onClick={() => (actif ? closeCategoryBranch() : openNeed(need.id))}
                  aria-pressed={actif}
                >
                  {lang === "en" ? need.en : need.fr}
                </button>
              );
            })}
            {browsedCategory ? (
              <button type="button" className="tt-pill tt-pill--active tt-pill--chip" onClick={closeCategoryBranch} aria-label={t(`Retirer le filtre ${getCatLabel(browsedCategory)}`, `Remove filter ${getCatLabel(browsedCategory)}`) as string}>
                {getCatLabel(browsedCategory)} <X size={14} aria-hidden />
              </button>
            ) : null}
          </nav>

          <div className="tt-catalog-toolbar-tail">
            <Popover open={panelOpen} onOpenChange={setPanelOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`tt-pill tt-pill--more${activeFilterCount > 0 ? " tt-pill--active" : ""}`}
                  aria-label={t("Filtres et tri", "Filters and sort") as string}
                >
                  <Filter size={16} aria-hidden />
                  <span className="tt-pill-label">{t("Filtres", "Filters")}</span>
                  {activeFilterCount > 0 && <span className="tt-pill-count">{activeFilterCount}</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent className="tt-filter-panel" align="end" sideOffset={8}>
                <div className="tt-filter-panel-head">
                  <strong>{t("Filtres", "Filters")}</strong>
                  <div className="tt-filter-panel-head-actions">
                    {activeFilterCount > 0 && (
                      <button type="button" className="tt-filter-panel-reset" onClick={resetFilters}>
                        {t("Tout effacer", "Clear all")}
                      </button>
                    )}
                    <button
                      type="button"
                      className="tt-filter-panel-close"
                      onClick={() => setPanelOpen(false)}
                      aria-label={t("Fermer", "Close") as string}
                    >
                      <X size={18} aria-hidden />
                    </button>
                  </div>
                </div>
                <div className="tt-filter-panel-body">

                {/* L'ellipse annonce « la suite de la rangée » : la rangée porte
                    les catégories, elles doivent donc se retrouver ici en entier,
                    y compris celles que la largeur d'écran laisse hors champ. */}

                <section className="tt-filter-group">
                  <h3>{t("Trier par", "Sort by")}</h3>
                  <div className="tt-filter-segmented" role="radiogroup" aria-label={t("Trier par", "Sort by") as string}>
                    {([
                      { id: "popular", label: t("Populaire", "Popular") },
                      { id: "name", label: "A → Z" },
                      { id: "price-asc", label: t("Prix croissant", "Price: low to high") },
                    ] as Array<{ id: SortKey; label: string }>).map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={sort === option.id}
                        className={`tt-pill${sort === option.id ? " tt-pill--active" : ""}`}
                        onClick={() => setSort(option.id)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="tt-filter-group">
                  <h3>{t("Prix", "Price")}</h3>
                  <div className="tt-filter-segmented" role="radiogroup" aria-label={t("Prix", "Price") as string}>
                    {([
                      { id: "all", label: t("Tous", "All") },
                      { id: "free", label: t("Plan gratuit", "Free plan") },
                      { id: "paid", label: t("Payant", "Paid") },
                    ] as Array<{ id: PriceFilter; label: string }>).map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={priceFilter === option.id}
                        className={`tt-pill${priceFilter === option.id ? " tt-pill--active" : ""}`}
                        onClick={() => applyPrice(option.id)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="tt-filter-group">
                  <h3>
                    {activeNeed
                      ? t(`Usages : ${activeNeed.fr}`, `Uses: ${activeNeed.en}`)
                      : browsedCategory
                        ? t(`Usages : ${getCatLabel(browsedCategory)}`, `Uses: ${getCatLabel(browsedCategory)}`)
                        : t("Usages", "Uses")}
                  </h3>
                  {facetOptions.length > 0 ? (
                    <div className="tt-filter-facets">
                      {facetOptions.map((facet) => {
                        const coche = selectedTags.includes(facet.id);
                        // En ET, une facette sans résultat n'a rien à proposer.
                        const inerte = !coche && facet.count === 0;
                        return (
                          <button
                            key={facet.id}
                            type="button"
                            className={`tt-pill${coche ? " tt-pill--active" : ""}`}
                            onClick={() => toggleBranchTag(facet.id)}
                            aria-pressed={coche}
                            disabled={inerte}
                          >
                            {facet.label}
                            <span className="tt-pill-count">{facet.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="tt-filter-hint">
                      {activeNeed || browsedCategory
                        ? t("Aucun usage assez fréquent pour affiner ce besoin.", "No usage frequent enough to narrow this need.")
                        : t("Choisissez d'abord un besoin pour voir ses usages.", "Pick a need first to see its uses.")}
                    </p>
                  )}
                </section>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {/* Outside the bar: its stuck-state animation leaves a transform that
            would trap this fixed scrim inside the bar's own box. */}
        {panelOpen && <div className="tt-filter-panel-backdrop" aria-hidden />}

        {/* ── Featured: large editorial cards, the premium placement ── */}
        {!isFiltering && sort === "popular" && spotlight.length > 0 && (
          <section className="tt-spotlight" aria-labelledby="tt-spotlight-title">
            <h2 id="tt-spotlight-title" className="tt-section-title">{t("À la une", "Featured")}</h2>
            <div className="tt-pepites">
              {spotlight.map(renderPepite)}
            </div>
          </section>
        )}

        {/* ── Category shelves, ranked on search demand ── */}
        {!isFiltering && sort === "popular" && shelves.map(({ category, count, items }) => (
          <section key={category.id} className="tt-shelf" aria-labelledby={`tt-shelf-${category.id}`}>
            <header className="tt-shelf-head">
              <h2 id={`tt-shelf-${category.id}`}>{getCatLabel(category)}<span>{count}</span></h2>
              <Link className="tt-shelf-all" to={`${prefix}/category/${category.slug || category.id}`}>
                {t("Tout voir", "See all")} <ChevronRight aria-hidden />
              </Link>
            </header>
            <ul className="tt-shelf-list">
              {items.map(({ entry, tool }) => {
                const pitch = toolTagline(tool.slug || tool.id, lang);
                return (
                  <li key={tool.id}>
                    <Link to={`${prefix}/tool/${tool.slug || tool.id}`} className="tt-shelf-row">
                      <ToolLogo tool={tool} size={64} className="tt-shelf-icon" />
                      <span className="tt-shelf-copy">
                        <span className="tt-shelf-name">{tool.name}</span>
                        {entry?.sponsored ? <span className="tt-sponsored">{t("Sponsorisé", "Sponsored")}</span> : null}
                        {pitch ? <span className="tt-shelf-meta">{pitch}</span> : null}
                      </span>
                    </Link>
                    {/* Sibling of the link, never inside it: a button nested
                        in a link is invalid and steals the row's click. */}
                    <span className="tt-save">
                      <PinToolButton slug={tool.slug || tool.id} label={tool.name} t={t} compact inline labelMode="icon" />
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {/* ── Section 2: All apps ── */}
        <section
          id="catalogue-complet"
          className={!isFiltering && sort === "popular" ? "tt-catalog-results tt-catalog-results--after-editorial" : "tt-catalog-results"}
          aria-labelledby={filtered.length > 0 ? "catalogue-results-title" : undefined}
        >
          {filtered.length === 0 ? (
            <div className="tt-catalog-empty">
              <Search size={28} aria-hidden />
              <p>{t("Aucun outil ne correspond", "No tool matches")}</p>
              {activeFilterCount > 0 ? (
                <button type="button" className="tt-pill" onClick={resetFilters}>
                  {t("Retirer les filtres", "Remove filters")}
                </button>
              ) : (
                <button type="button" className="tt-pill" onClick={() => { setSearch(""); setPriceFilter("all"); setSearchParams(new URLSearchParams(), { replace: true }); }}>
                  {t("Voir tout le catalogue", "See the whole catalogue")}
                </button>
              )}
            </div>
          ) : (
            <>
              <header className="tt-catalog-results-header">
                {/* Filtered: the header names what is shown and how many, and
                    every refinement from the panel is visible and removable
                    here, not only behind the Filters button. */}
                <p className="tt-catalog-results-kicker">
                  {isFiltering || sort !== "popular"
                    ? t(`${filtered.length} outil${filtered.length > 1 ? "s" : ""}`, `${filtered.length} tool${filtered.length > 1 ? "s" : ""}`)
                    : t("Catalogue complet", "Full catalogue")}
                </p>
                <h2 id="catalogue-results-title" className="tt-catalog-results-title">
                  {search
                    ? t(`Résultats pour «\u00a0${search}\u00a0»`, `Results for “${search}”`)
                    : activeNeed
                      ? (lang === "en" ? activeNeed.en : activeNeed.fr)
                      : browsedCategory
                        ? getCatLabel(browsedCategory)
                        : t("Tous les outils", "All tools")}
                </h2>
                {activeFilterCount > 0 && (
                  <div className="tt-active-filters" aria-label={t("Filtres actifs", "Active filters") as string}>
                    {priceFilter !== "all" && (
                      <button type="button" className="tt-active-chip" onClick={() => applyPrice("all")}>
                        {priceFilter === "free" ? t("Plan gratuit", "Free plan") : t("Payant", "Paid")}
                        <X size={14} aria-hidden />
                      </button>
                    )}
                    {selectedTags.map((tagId) => (
                      <button key={tagId} type="button" className="tt-active-chip" onClick={() => removeTag(tagId)}>
                        {facetOptions.find((facet) => facet.id === tagId)?.label || formatFacetLabel(tagId, lang)}
                        <X size={14} aria-hidden />
                      </button>
                    ))}
                    {sort !== "popular" && (
                      <button type="button" className="tt-active-chip" onClick={() => setSort("popular")}>
                        {sort === "name" ? "A → Z" : t("Prix croissant", "Price: low to high")}
                        <X size={14} aria-hidden />
                      </button>
                    )}
                    {activeFilterCount > 1 && (
                      <button type="button" className="tt-active-clear" onClick={resetFilters}>
                        {t("Tout effacer", "Clear all")}
                      </button>
                    )}
                  </div>
                )}
              </header>
              {needTop.length > 0 && activeNeed && (
                <>
                  <section className="tt-need-top" aria-labelledby="tt-need-top-title">
                    <h3 id="tt-need-top-title" className="tt-section-title">
                      {/* "Most searched" would misdescribe a paid slot. */}
                      {needTop.some((item) => item.entry?.sponsored)
                        ? t("À la une", "Featured")
                        : t("Les plus recherchés", "Most searched")}
                    </h3>
                    <div className="tt-pepites">{needTop.map(renderPepite)}</div>
                  </section>
                  {gridTools.length > 0 && (
                    <h3 className="tt-section-title">
                      {t(`Plus d'outils ${activeNeed.fr}`, `More ${activeNeed.en} tools`)}
                    </h3>
                  )}
                </>
              )}
              <div className="tc-grid">
                {visible.map(tool => {
                  const catObj = categoryById.get(tool.categoryId);
                  const catLabel = catObj ? (lang === "en" ? stripLeadingEmoji(catObj.nameEn, catObj.id) : stripLeadingEmoji(catObj.name, catObj.id)) : undefined;
                  // What the tool does beats its category, which a need or
                  // category filter already states for every card.
                  const subtitle = toolTagline(tool.slug || tool.id, lang) || catLabel;
                  return (
                    <ToolCardEditorial
                      key={tool.id}
                      tool={tool}
                      prefix={prefix}
                      t={t}
                      lang={lang}
                      categoryLabel={subtitle}
                      showPrice={false}
                      identityLogoSize={56}
                      exploreHref={getExplorerHref(prefix, { type: "outil", slug: tool.slug || tool.id })}
                      exploreState={{ explorerCanGoBack: true, explorerReturnTo: `${location.pathname}${location.search}`, previousSourceLabel: t("Catalogue", "Catalog") }}
                    />
                  );
                })}
              </div>
              {hasMore && (
                <div className="tt-catalog-more">
                  <button type="button" className="tt-pill" onClick={() => setVisibleCount(c => c + TOOLS_PER_PAGE)}>
                    {t("Afficher plus", "Show more")}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ToolsPage;
