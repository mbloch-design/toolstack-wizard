import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Link } from "@/lib/routerLinks";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, type ToolSummary } from "@/hooks/useSupabaseData";
import { Search } from "@/lib/icons";
import Page from "@/ds/Page/Page";
import Chip, { Chips } from "@/ds/Chip/Chip";
import Drawer, { DrawerTitle } from "@/ds/Drawer/Drawer";
import Segmented from "@/ds/Segmented/Segmented";
import Button, { LinkArrow, TextButton, linkClass } from "@/ds/Button/Button";
import { MediaCards } from "@/ds/MediaCard/MediaCard";
import ToolMediaCard from "@/components/tool/ToolMediaCard";
import Tag from "@/ds/Tag/Tag";
import { SheetNote, SheetSection, ToolRow, ToolRows } from "@/ds/ToolSheet/ToolSheet";
import { ActiveFilter, ActiveFilters, CatalogSection, CatalogTitle, EmptyState, FilterBar, FiltersButton, FiltersFoot, FiltersPanel } from "@/ds/Catalog/Catalog";
import { compareByDemand, formatFacetLabel, getToolSearchText, hasFreePlan, isPaidOnly, knownPrice, normalizeToolText, toolFacets } from "@/lib/catalogFilters";
import { toolTagline } from "@/data/toolTaglines";
import { CATALOG_NEEDS } from "@/data/catalogNeeds";
import { activePlacements, type CatalogPlacement } from "@/data/catalogPlacements";
import ToolLogo from "@/components/ToolLogo";
import PinToolButton from "@/components/PinToolButton";
import { setSeoTags, setJsonLd, setHreflang, setNoindex, cleanupSeo, hasNonCanonicalSearchParams } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import Breadcrumb from "@/components/Breadcrumb";
import { CATALOG_BAR_NAV, runCatalogFilter, useCatalogStickyToolbar } from "@/hooks/useCatalogStickyToolbar";
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
  // The filters sheet hands the focus back to the button that opened it.
  const filtersButtonRef = useRef<HTMLButtonElement>(null);

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
      if (priceFilter === "paid" && !isPaidOnly(tool)) return false;
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
        priceFilter === "paid" ? isPaidOnly(tool) :
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
    void runCatalogFilter(() => setSearchParams(next, { replace, ...CATALOG_BAR_NAV }));
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
    const pitch = (lang === "en" ? entry?.pitchEn : entry?.pitchFr) || toolTagline(tool.slug || tool.id, lang)
      || (lang === "en" ? tool.shortDescriptionEn || tool.shortDescription : tool.shortDescription);
    return (
      <ToolMediaCard key={tool.id} priority lang={lang === "en" ? "en" : "fr"} tool={tool} dataTool={tool.slug || tool.id}
        category={eyebrow || undefined} badge={entry?.sponsored ? t("Sponsorisé", "Sponsored") as string : undefined} reason={pitch || undefined}
        renderLink={(className, content) => <Link to={`${prefix}/tool/${tool.slug || tool.id}`} className={className}>{content}</Link>} />
    );
  }

  // Besoin ou catégorie ouverts : ils deviennent le titre de la page.
  const contextTitle = activeNeed
    ? ((lang === "en" ? activeNeed.en : activeNeed.fr) as string)
    : browsedCategory
      ? (getCatLabel(browsedCategory) as string)
      : null;
  const titleInHeader = !!contextTitle && !search;

  const priceOptions: Array<{ value: PriceFilter; label: string }> = [
    { value: "all", label: t("Tous", "All") },
    { value: "free", label: t("Plan gratuit", "Free plan") },
    { value: "paid", label: t("Payant uniquement", "Paid only") },
  ];
  const sortOptions: Array<{ value: SortKey; label: string }> = [
    { value: "popular", label: t("Populaire", "Popular") },
    { value: "name", label: "A → Z" },
    { value: "price-asc", label: t("Prix croissant", "Price: low to high") },
  ];
  const resultsTitle = search
    ? t(`Résultats pour «\u00a0${search}\u00a0»`, `Results for “${search}”`)
    : activeNeed ? (lang === "en" ? activeNeed.en : activeNeed.fr) : browsedCategory ? getCatLabel(browsedCategory) : t("Tous les outils", "All tools");

  // The catalogue on the system (11/11/2026, « mise à plat »): the page title, the needs as chips on a bar that turns
  // to glass once stuck, the filters in the side sheet, featured tools as media cards, shelves of tool rows.
  // Every tool of the current view; under a need it gets its own title after « Les plus recherchés ».
  const allTools = (
              <MediaCards label={t("Tous les outils", "All tools") as string}>
                {visible.map(tool => {
                  const catObj = categoryById.get(tool.categoryId);
                  const catLabel = catObj ? (lang === "en" ? stripLeadingEmoji(catObj.nameEn, catObj.id) : stripLeadingEmoji(catObj.name, catObj.id)) : undefined;
                  // Only 92 of 1 360 tools have a hand-written card line; the others fell back to nothing (13/11/2026).
                  // Their short description stands in, held to one line by the card.
                  const short = (lang === "en" ? tool.shortDescriptionEn || tool.shortDescription : tool.shortDescription) || "";
                  const subtitle = toolTagline(tool.slug || tool.id, lang) || short || catLabel;
                  return <ToolMediaCard key={tool.id} lang={lang === "en" ? "en" : "fr"} tool={tool} dataTool={tool.slug || tool.id}
                    category={catLabel} reason={subtitle !== catLabel ? subtitle : undefined}
                    renderLink={(className, content) => <Link to={`${prefix}/tool/${tool.slug || tool.id}`} className={className}>{content}</Link>} />;
                })}
              </MediaCards>
  );

  return (
    <div className="tt-catalog-page" data-catalog="">
      <Page>
        {/* La catégorie ouverte est un état de la page, pas une URL distincte : elle ferme le fil sans lien. */}
        <Breadcrumb
          items={activeNeed
            ? [{ label: t("Outils", "Tools") as string, href: `${prefix}/tools` }, { label: (lang === "en" ? activeNeed.en : activeNeed.fr) as string }]
            : browsedCategory
              ? [{ label: t("Outils", "Tools") as string, href: `${prefix}/tools` }, { label: getCatLabel(browsedCategory) as string }]
              : [{ label: t("Outils", "Tools") as string }]}
        />
        <CatalogTitle sentinelRef={toolbarSentinelRef} title={(contextTitle || t("Outils", "Tools")) as string}
          count={contextTitle && !search ? filtered.length : undefined}
          countLabel={t(`, ${filtered.length} outil${filtered.length > 1 ? "s" : ""}`, `, ${filtered.length} tool${filtered.length > 1 ? "s" : ""}`) as string} />

        <FilterBar stuck={toolbarStuck} railRef={pillRowRef} railLabel={t("Filtrer par besoin", "Filter by need") as string}
          prevLabel={t("Besoins précédents", "Previous needs") as string} nextLabel={t("Besoins suivants", "Next needs") as string}
          rail={<>
            <Chip pressed={!needId && !browsedCategoryId} onClick={closeCategoryBranch}>{t("Tout", "All")}</Chip>
            {CATALOG_NEEDS.map((need) => {
              const on = needId === need.id;
              return <Chip key={need.id} pressed={on} onClick={() => (on ? closeCategoryBranch() : openNeed(need.id))}>{lang === "en" ? need.en : need.fr}</Chip>;
            })}
            {browsedCategory && <ActiveFilter onRemove={closeCategoryBranch} removeLabel={t(`Retirer le filtre ${getCatLabel(browsedCategory)}`, `Remove filter ${getCatLabel(browsedCategory)}`) as string}>{getCatLabel(browsedCategory)}</ActiveFilter>}
          </>}
          tail={<FiltersButton ref={filtersButtonRef} label={t("Filtres", "Filters") as string} count={activeFilterCount} open={panelOpen} onClick={() => setPanelOpen(true)} ariaLabel={t("Filtres et tri", "Filters and sort") as string} />} />

        {/* The filters in the system's side sheet: sort and price as segmented choices, the uses as chips, the count live. */}
        <Drawer open={panelOpen} onClose={() => setPanelOpen(false)} closeLabel={t("Fermer", "Close") as string}
          onCloseAutoFocus={(event) => { event.preventDefault(); filtersButtonRef.current?.focus(); }}>
          <DrawerTitle>{t("Filtres", "Filters")}</DrawerTitle>
          <FiltersPanel>
            <SheetSection title={t("Trier par", "Sort by") as string}>
              <Segmented label={t("Trier par", "Sort by") as string} value={sort} options={sortOptions} onChange={setSort} />
            </SheetSection>
            <SheetSection title={t("Prix", "Price") as string}>
              <Segmented label={t("Prix", "Price") as string} value={priceFilter} options={priceOptions} onChange={applyPrice} />
            </SheetSection>
            <SheetSection title={(activeNeed ? t(`Usages : ${activeNeed.fr}`, `Uses: ${activeNeed.en}`) : browsedCategory ? t(`Usages : ${getCatLabel(browsedCategory)}`, `Uses: ${getCatLabel(browsedCategory)}`) : t("Usages", "Uses")) as string}>
              {facetOptions.length > 0
                ? <Chips label={t("Usages", "Uses") as string}>
                    {facetOptions.map((facet) => {
                      const on = selectedTags.includes(facet.id);
                      return <Chip key={facet.id} pressed={on} check count={facet.count} disabled={!on && facet.count === 0} onClick={() => toggleBranchTag(facet.id)}>{facet.label}</Chip>;
                    })}
                  </Chips>
                : <SheetNote>{activeNeed || browsedCategory
                    ? t("Aucun usage assez fréquent pour affiner ce besoin.", "No usage frequent enough to narrow this need.")
                    : t("Choisissez d'abord un besoin pour voir ses usages.", "Pick a need first to see its uses.")}</SheetNote>}
            </SheetSection>
            <FiltersFoot>
              <Button variant="primary" onClick={() => setPanelOpen(false)}>
                {filtered.length === 0 ? t("Aucun outil", "No tools") : t(`Voir ${filtered.length} outil${filtered.length > 1 ? "s" : ""}`, `Show ${filtered.length} tool${filtered.length > 1 ? "s" : ""}`)}
              </Button>
              {activeFilterCount > 0 && <TextButton tone="quiet" onClick={resetFilters}>{t("Tout effacer", "Clear all")}</TextButton>}
            </FiltersFoot>
          </FiltersPanel>
        </Drawer>

        {!isFiltering && sort === "popular" && spotlight.length > 0 && (
          <CatalogSection id="tt-spotlight-title" title={t("À la une", "Featured")}>
            <MediaCards label={t("À la une", "Featured") as string}>{spotlight.map(renderPepite)}</MediaCards>
          </CatalogSection>
        )}

        {!isFiltering && sort === "popular" && shelves.map(({ category, count, items }) => (
          <CatalogSection key={category.id} id={`tt-shelf-${category.id}`} title={getCatLabel(category)} count={count}
            action={<Link className={linkClass()} to={`${prefix}/category/${category.slug || category.id}`}>{t("Tout voir", "See all")}<LinkArrow /></Link>}>
            <ToolRows>
              {items.map(({ entry, tool }) => (
                <ToolRow key={tool.id} logo={<ToolLogo tool={tool} size={40} />} name={tool.name}
                  note={<>{entry?.sponsored ? <Tag>{t("Sponsorisé", "Sponsored")}</Tag> : null}{toolTagline(tool.slug || tool.id, lang) || null}</>}
                  renderMain={(className, content) => <Link to={`${prefix}/tool/${tool.slug || tool.id}`} className={className}>{content}</Link>}
                  action={<PinToolButton slug={tool.slug || tool.id} label={tool.name} t={t} compact inline labelMode="icon" />} />
              ))}
            </ToolRows>
          </CatalogSection>
        ))}

        <section id="catalogue-complet" aria-labelledby={filtered.length > 0 ? "catalogue-results-title" : undefined} data-catalog-results="">
          {filtered.length === 0 ? (
            <EmptyState icon={<Search />} title={t("Aucun outil ne correspond", "No tool matches") as string}
              action={activeFilterCount > 0
                ? <Button onClick={resetFilters}>{t("Retirer les filtres", "Remove filters")}</Button>
                : <Button onClick={() => { setSearch(""); setPriceFilter("all"); setSearchParams(new URLSearchParams(), { replace: true }); }}>{t("Voir tout le catalogue", "See the whole catalogue")}</Button>} />
          ) : (
            <CatalogSection id="catalogue-results-title" title={titleInHeader ? <span className="sr-only">{resultsTitle}</span> : resultsTitle}
              count={!titleInHeader && (isFiltering || sort !== "popular") ? filtered.length : undefined}>
              {activeFilterCount > 0 && (
                <ActiveFilters label={t("Filtres actifs", "Active filters") as string}>
                  {priceFilter !== "all" && <ActiveFilter onRemove={() => applyPrice("all")} removeLabel={t("Retirer ce filtre", "Remove this filter") as string}>{priceFilter === "free" ? t("Plan gratuit", "Free plan") : t("Payant uniquement", "Paid only")}</ActiveFilter>}
                  {selectedTags.map((tagId) => <ActiveFilter key={tagId} onRemove={() => removeTag(tagId)} removeLabel={t("Retirer ce filtre", "Remove this filter") as string}>{facetOptions.find((facet) => facet.id === tagId)?.label || formatFacetLabel(tagId, lang)}</ActiveFilter>)}
                  {sort !== "popular" && <ActiveFilter onRemove={() => setSort("popular")} removeLabel={t("Retirer ce tri", "Remove this sort") as string}>{sort === "name" ? "A → Z" : t("Prix croissant", "Price: low to high")}</ActiveFilter>}
                  {activeFilterCount > 1 && <TextButton tone="quiet" onClick={resetFilters}>{t("Tout effacer", "Clear all")}</TextButton>}
                </ActiveFilters>
              )}
              {needTop.length > 0 && activeNeed && (
                <CatalogSection as="h3" id="tt-need-top-title" title={needTop.some((item) => item.entry?.sponsored) ? t("À la une", "Featured") : t("Les plus recherchés", "Most searched")}>
                  <MediaCards label={t("Les plus recherchés", "Most searched") as string}>{needTop.map(renderPepite)}</MediaCards>
                </CatalogSection>
              )}
              {needTop.length > 0 && activeNeed ? (
                <CatalogSection as="h3" id="tt-need-all-title" title={t("Tous les outils", "All tools")} count={filtered.length}>
                  {allTools}
                </CatalogSection>
              ) : allTools}
              {hasMore && <div><Button onClick={() => setVisibleCount(c => c + TOOLS_PER_PAGE)}>{t("Afficher plus", "Show more")}</Button></div>}
            </CatalogSection>
          )}
        </section>
      </Page>
    </div>
  );
};

export default ToolsPage;
