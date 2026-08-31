import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, type ToolSummary } from "@/hooks/useSupabaseData";
import { ArrowDown, ChevronDown, MoreHorizontal } from "@/lib/icons";
import ToolLogo from "@/components/ToolLogo";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Breadcrumb from "@/components/Breadcrumb";
import { getExplorerHref } from "@/lib/toolExploration";
import { useCatalogStickyToolbar } from "@/hooks/useCatalogStickyToolbar";

const TOOLS_PER_PAGE = 40;
const EDITORIAL_SELECTION = ["framer", "notion", "figma"];


type SortKey = "popular" | "name" | "price-asc" | "free-first";
type PriceFilter = "all" | "free" | "paid";

function isTrending(tool: ToolSummary) {
  return tool.prescription_quality === "ferme";
}
function isRecommended(tool: ToolSummary) {
  return tool.prescription_quality === "oui" || tool.prescription_quality === "ferme";
}

function normalizeToolText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getToolSearchText(tool: ToolSummary, categoryLabel = "") {
  return normalizeToolText([
    tool.name,
    tool.categoryId,
    categoryLabel,
    tool.shortDescription,
    tool.shortDescriptionEn,
    ...(tool.verticals || []),
    ...(tool.covers || []),
    ...(tool.functional_needs || []),
  ].join(" "));
}

const FACET_LABELS_FR: Record<string, string> = {
  "ai-assistant": "Assistant IA",
  "ai-generation": "Génération IA",
  animation: "Animation",
  analytics: "Analytics",
  automation: "Automatisation",
  booking: "Prise de rendez-vous",
  branding: "Identité visuelle",
  calendar: "Calendrier",
  collaboration: "Collaboration",
  communication: "Communication",
  crm: "CRM",
  "design-collaboration": "Collaboration design",
  "email-marketing": "Email marketing",
  hosting: "Hébergement",
  invoicing: "Facturation",
  "landing-page": "Landing pages",
  "project-management": "Gestion de projet",
  prototyping: "Prototypage",
  seo: "SEO",
  "social-media": "Réseaux sociaux",
  "task-management": "Gestion des tâches",
  "ui-components": "Composants UI",
  "ui-design": "Design UI",
  video: "Vidéo",
  "website-builder": "Création de sites",
  wireframing: "Wireframes",
};

/**
 * Les facettes sont stockées en français dans le catalogue. Sans traduction,
 * la version anglaise affichait « Redaction », « Facturation » ou
 * « Tests Utilisateurs » au milieu de libellés anglais.
 */
const FACET_LABELS_EN: Record<string, string> = {
  analyse: "Analysis",
  "analytics-produit": "Product analytics",
  "animation-2d-3d": "2D & 3D animation",
  "assistant-generaliste": "General assistant",
  automatisation: "Automation",
  "base-de-donnees": "Database",
  "catalogue-photo": "Photo catalogue",
  "chat-equipe": "Team chat",
  communaute: "Community",
  comptabilite: "Accounting",
  "compte-pro": "Business account",
  "cours-en-ligne": "Online courses",
  "creation-cours": "Course creation",
  deploiement: "Deployment",
  "design-visuel": "Visual design",
  detourage: "Cutout",
  "editeur-email": "Email editor",
  "effets-visuels": "Visual effects",
  "enregistrement-multipistes": "Multitrack recording",
  "evenements-live": "Live events",
  facturation: "Invoicing",
  "feedback-utilisateurs": "User feedback",
  formation: "Training",
  formulaires: "Forms",
  "generation-code": "Code generation",
  "generation-image": "Image generation",
  "generation-video": "Video generation",
  "gestion-incidents": "Incident management",
  "hebergement-audio": "Audio hosting",
  "illustration-vectorielle": "Vector illustration",
  "inspection-code": "Code review",
  "mise-en-page": "Layout",
  "modelisation-3d": "3D modelling",
  "montage-audio": "Audio editing",
  "mots-de-passe": "Passwords",
  paie: "Payroll",
  paiements: "Payments",
  partage: "Sharing",
  planification: "Scheduling",
  "plugin-sketchup": "SketchUp plugin",
  "presentation-client": "Client presentation",
  "prise-rendez-vous": "Appointment booking",
  prospection: "Prospecting",
  publication: "Publishing",
  "publication-web": "Web publishing",
  redaction: "Writing",
  "rendu-3d": "3D rendering",
  "retouche-photo": "Photo retouching",
  "roadmap-produit": "Product roadmap",
  securite: "Security",
  "stockage-fichiers": "File storage",
  "tests-utilisateurs": "User testing",
  // Devenues visibles en supprimant la troncature à douze facettes.
  "analyse-documents": "Document analysis",
  "analytics-contenu": "Content analytics",
  "analytics-reseaux": "Social analytics",
  "creation-musicale": "Music creation",
  "creation-sites": "Site building",
  "direction-visuelle": "Art direction",
  "facturation-temps": "Time billing",
  "gestion-assets": "Asset management",
  "gestion-conges": "Leave management",
  "gestion-documentaire": "Document management",
  "gestion-inbox": "Inbox management",
  "gestion-notes-frais": "Expense management",
  "gestion-pipeline-rh": "HR pipeline",
  "gestion-produit": "Product management",
  "gestion-raw": "Raw management",
  "idees-contenus": "Content ideas",
  "identite-visuelle": "Visual identity",
  "liens-entre-notes": "Linked notes",
  "logo-creation": "Logo design",
  monetisation: "Monetisation",
  "monetisation-newsletter": "Newsletter monetisation",
  "monetisation-podcast": "Podcast monetisation",
  "monetisation-video": "Video monetisation",
  "montage-video": "Video editing",
  "montage-video-court": "Short-form editing",
  notes: "Notes",
  "notes-frais": "Expense reports",
  "notes-reunion": "Meeting notes",
  "planification-posts": "Post scheduling",
  "retouche-photo-mobile": "Mobile retouching",
  "storytelling-visuel": "Visual storytelling",
  "suivi-emails": "Email tracking",
  "suivi-issues": "Issue tracking",
  "suivi-temps": "Time tracking",
  taches: "Tasks",
  "temps-reel": "Real time",
};

/** Jetons que la capitalisation mot à mot écrirait « Seo », « Bim » ou « 3d ». */
const FACET_TOKEN_LABELS: Record<string, string> = {
  "2d": "2D",
  "3d": "3D",
  ai: "AI",
  bim: "BIM",
  crm: "CRM",
  devops: "DevOps",
  lms: "LMS",
  pdf: "PDF",
  seo: "SEO",
  ui: "UI",
  ux: "UX",
};

function formatFacetLabel(value: string, lang: string) {
  const mapped = lang === "fr" ? FACET_LABELS_FR[value] : FACET_LABELS_EN[value];
  if (mapped) return mapped;
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => FACET_TOKEN_LABELS[part] ?? part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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
  const selectedTags = useMemo(
    () => (searchParams.get("tags") || "").split(",").filter(Boolean),
    [searchParams],
  );
  const [sort, setSort] = useState<SortKey>("popular");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>(urlPrice === "free" || urlPrice === "paid" ? urlPrice : "all");
  const [visibleCount, setVisibleCount] = useState(TOOLS_PER_PAGE);
  const [panelOpen, setPanelOpen] = useState(false);
  const { toolbarStuck, toolbarSentinelRef } = useCatalogStickyToolbar();

  useEffect(() => {
    const title = lang === "fr"
      ? `Comparateur SaaS — ${tools.length} outils avec prix réels et alternatives | ToolTrim`
      : `SaaS Comparison — ${tools.length} tools with real pricing & alternatives | ToolTrim`;
    const desc = lang === "fr"
      ? `${tools.length} outils SaaS analysés indépendamment — prix vérifiés, alternatives visibles, verdicts honnêtes.`
      : `${tools.length} SaaS tools reviewed independently — verified pricing, visible alternatives, honest verdicts.`;
    const url = `https://tooltrim.com/${lang}/tools`;
    setSeoTags({ title, description: desc, url });
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
  }, [lang, tools]);

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
  const toolFacets = (tool: ToolSummary) =>
    new Set([...(tool.functional_needs || []), ...(tool.covers || [])]
      .map((tag) => normalizeToolText(tag).trim())
      .filter(Boolean));

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
      if (priceFilter === "free" && tool.defaultMonthlyPrice !== 0) return false;
      if (priceFilter === "paid" && !(tool.defaultMonthlyPrice > 0)) return false;
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
    return browsedCategoryId ? classees : classees.slice(0, 30);
  }, [browsedCategoryId, categoryById, lang, priceFilter, search, selectedTags, tools]);

  // A short editorial opening, deliberately distinct from the exhaustive grid.
  // Three entries are enough to create hierarchy without duplicating a full row
  // of the catalogue above the catalogue itself.
  const noteworthy = useMemo(() => {
    const selected = EDITORIAL_SELECTION
      .map((slug) => tools.find((tool) => (tool.slug || tool.id) === slug))
      .filter((tool): tool is ToolSummary => Boolean(tool));
    const selectedIds = new Set(selected.map((tool) => tool.id));
    const fallback = tools.filter((tool) => isRecommended(tool) && !selectedIds.has(tool.id));
    return [...selected, ...fallback].slice(0, 3);
  }, [tools]);

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
      const matchCat = !browsedCategoryId || tool.categoryId === browsedCategoryId;
      const toolTags = [
        ...(tool.functional_needs || []),
        ...(tool.covers || []),
      ].map((tag) => normalizeToolText(tag).trim());
      const matchTags = selectedTags.every((tag) => toolTags.includes(tag));
      const matchPrice =
        priceFilter === "free" ? tool.defaultMonthlyPrice === 0 :
        priceFilter === "paid" ? tool.defaultMonthlyPrice > 0 :
        true;
      return matchSearch && matchCat && matchTags && matchPrice;
    });

    result.sort((a, b) => {
      if (sort === "popular") {
        const scoreA = (isRecommended(a) ? 2 : 0) + (isTrending(a) ? 1 : 0);
        const scoreB = (isRecommended(b) ? 2 : 0) + (isTrending(b) ? 1 : 0);
        return scoreB - scoreA || (a.name ?? "").localeCompare(b.name ?? "");
      }
      if (sort === "name") return (a.name ?? "").localeCompare(b.name ?? "");
      if (sort === "price-asc") return (a.defaultMonthlyPrice || 0) - (b.defaultMonthlyPrice || 0);
      if (sort === "free-first") return (a.defaultMonthlyPrice === 0 ? 0 : 1) - (b.defaultMonthlyPrice === 0 ? 0 : 1);
      return 0;
    });
    return result;
  }, [categoryById, tools, search, browsedCategoryId, selectedTags, priceFilter, sort]);

  useEffect(() => { setVisibleCount(TOOLS_PER_PAGE); }, [search, browsedCategoryId, selectedTags, priceFilter, sort]);

  useEffect(() => { setSearch(urlSearch); }, [urlSearch]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const getCatLabel = (cat: typeof categories[0]) =>
    t(stripLeadingEmoji(cat.name, cat.id), stripLeadingEmoji(cat.nameEn, stripLeadingEmoji(cat.name, cat.id)));

  const isFiltering = !!(search || browsedCategoryId || selectedTags.length > 0 || priceFilter !== "all");
  const activeFilterCount = selectedTags.length + (priceFilter !== "all" ? 1 : 0);

  function applyPrice(next: PriceFilter) {
    setPriceFilter(next);
    updateParams((params) => {
      if (next === "all") params.delete("pricing");
      else params.set("pricing", next);
    }, true);
  }

  function resetFilters() {
    setPriceFilter("all");
    updateParams((params) => {
      params.delete("pricing");
      params.delete("tags");
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
    updateParams((params) => {
      params.set("category", categoryId);
      params.delete("tags");
    });
  }

  function closeCategoryBranch() {
    updateParams((params) => {
      params.delete("category");
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

  return (
    <div className="tt-catalog-page min-h-screen" style={{ "--page-accent": "#10DDD6" } as React.CSSProperties}>

      {/* ══════════════ BODY ══════════════ */}
      <div className="tt-catalog-container">
        {/* ── Compact header: one title, then the catalogue controls. ── */}
        <div className="tt-catalog-compact-header">
          {/* La catégorie ouverte est un état de la page, pas une URL distincte :
              elle ferme le fil sans lien, le niveau « Outils » ramène à la racine. */}
          <Breadcrumb
            items={browsedCategory
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
        <div className={`tt-catalog-toolbar tt-sticky-toolbar${toolbarStuck ? " tt-sticky-toolbar--stuck" : ""}`}>
          <nav className="tt-pillrow" aria-label={t("Filtrer par catégorie", "Filter by category") as string}>
            <button
              type="button"
              className={`tt-pill${!browsedCategoryId ? " tt-pill--active" : ""}`}
              onClick={closeCategoryBranch}
              aria-pressed={!browsedCategoryId}
            >
              {t("Tout", "All")}
            </button>
            <button
              type="button"
              className={`tt-pill${priceFilter === "free" ? " tt-pill--active" : ""}`}
              onClick={() => applyPrice(priceFilter === "free" ? "all" : "free")}
              aria-pressed={priceFilter === "free"}
            >
              {t("Gratuit", "Free")}
            </button>
            <span className="tt-pillrow-divider" aria-hidden />
            {sortedCategories.map((cat) => {
              const actif = browsedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`tt-pill${actif ? " tt-pill--active" : ""}`}
                  onClick={() => (actif ? closeCategoryBranch() : openCategoryBranch(cat.id))}
                  aria-pressed={actif}
                >
                  {getCatLabel(cat)}
                </button>
              );
            })}
          </nav>

          <div className="tt-catalog-toolbar-tail">
            <Popover open={panelOpen} onOpenChange={setPanelOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`tt-pill tt-pill--more${activeFilterCount > 0 ? " tt-pill--active" : ""}`}
                >
                  <MoreHorizontal size={16} aria-hidden />
                  <span>{t("Plus de filtres", "More filters")}</span>
                  {activeFilterCount > 0 && <span className="tt-pill-count">{activeFilterCount}</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent className="tt-filter-panel" align="end" sideOffset={8}>
                <div className="tt-filter-panel-head">
                  <strong>{t("Filtres", "Filters")}</strong>
                  {activeFilterCount > 0 && (
                    <button type="button" className="tt-filter-panel-reset" onClick={resetFilters}>
                      {t("Tout effacer", "Clear all")}
                    </button>
                  )}
                </div>
                <div className="tt-filter-panel-body">

                {/* L'ellipse annonce « la suite de la rangée » : la rangée porte
                    les catégories, elles doivent donc se retrouver ici en entier,
                    y compris celles que la largeur d'écran laisse hors champ. */}
                <section className="tt-filter-group">
                  <h3>{t("Catégorie", "Category")}</h3>
                  <div className="tt-catgrid">
                    <button
                      type="button"
                      className={`tt-catrow${!browsedCategoryId ? " is-selected" : ""}`}
                      onClick={closeCategoryBranch}
                      aria-pressed={!browsedCategoryId}
                    >
                      <span>{t("Toutes", "All")}</span>
                      <em>{tools.length}</em>
                    </button>
                    {sortedCategories.map((cat) => {
                      const actif = browsedCategoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`tt-catrow${actif ? " is-selected" : ""}`}
                          onClick={() => (actif ? closeCategoryBranch() : openCategoryBranch(cat.id))}
                          aria-pressed={actif}
                        >
                          <span>{getCatLabel(cat)}</span>
                          <em>{categoryCounts.get(cat.id) || 0}</em>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="tt-filter-group">
                  <h3>{t("Prix", "Price")}</h3>
                  <div className="tt-filter-segmented" role="radiogroup" aria-label={t("Prix", "Price") as string}>
                    {([
                      { id: "all", label: t("Tous", "All") },
                      { id: "free", label: t("Gratuit", "Free") },
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
                    {browsedCategory
                      ? t(`Affiner « ${getCatLabel(browsedCategory)} »`, `Refine "${getCatLabel(browsedCategory)}"`)
                      : t("Affiner", "Refine")}
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
                      {t("Aucun critère ne s'applique à cette sélection.", "No criteria apply to this selection.")}
                    </p>
                  )}
                </section>
                </div>
              </PopoverContent>
            </Popover>

            <label className="tt-catalog-sort-control" title={t("Trier les outils", "Sort tools") as string}>
              <select
                className="tt-catalog-sort-select"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                aria-label={t("Trier par", "Sort by") as string}
              >
                <option value="popular">{t("Populaire", "Featured")}</option>
                <option value="name">{t("A → Z", "A → Z")}</option>
                <option value="price-asc">{t("Prix croissant", "Price: low to high")}</option>
                <option value="free-first">{t("Gratuit d'abord", "Free first")}</option>
              </select>
              <ChevronDown size={15} aria-hidden />
            </label>
          </div>
        </div>

        {/* ── Section 1: editorial opening (only when not filtering) ── */}
        {!isFiltering && noteworthy.length > 0 && (
          <section className="tt-editorial-opening" aria-labelledby="editorial-selection-title">
            <header className="tt-editorial-opening-header">
              <div className="tt-editorial-opening-heading">
                <h2 id="editorial-selection-title" className="tt-editorial-opening-title">
                  {t("Trois outils à découvrir", "Three tools to discover")}
                </h2>
                <p className="tt-editorial-opening-intro">
                  {t(
                    "Une sélection courte pour commencer par les options les plus solides.",
                    "A short selection of strong options to start with.",
                  )}
                </p>
              </div>
              <a className="tt-section-action tt-editorial-opening-link" href="#catalogue-complet">
                {t("Voir tout le catalogue", "View full catalogue")}
                <ArrowDown aria-hidden />
              </a>
            </header>

            <div className="tt-editorial-opening-grid">
              {noteworthy.map((tool) => {
                const catObj = categories.find(c => c.id === tool.categoryId);
                const catLabel = catObj ? (lang === "en" ? stripLeadingEmoji(catObj.nameEn, catObj.id) : stripLeadingEmoji(catObj.name, catObj.id)) : undefined;
                return (
                  <div
                    key={tool.id}
                    className="tt-editorial-opening-item"
                  >
                    <ToolCardEditorial
                      tool={tool}
                      prefix={prefix}
                      t={t}
                      lang={lang}
                      categoryLabel={catLabel}
                      exploreHref={getExplorerHref(prefix, { type: "outil", slug: tool.slug || tool.id })}
                      exploreState={{ explorerCanGoBack: true, explorerReturnTo: `${location.pathname}${location.search}`, previousSourceLabel: t("Catalogue", "Catalog") }}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Section 2: All apps ── */}
        <section
          id="catalogue-complet"
          className={!isFiltering && noteworthy.length > 0 ? "tt-catalog-results tt-catalog-results--after-editorial" : "tt-catalog-results"}
          aria-labelledby={filtered.length > 0 ? "catalogue-results-title" : undefined}
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: "hsl(var(--border))" }}>
              <Search className="mx-auto h-8 w-8" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }} />
              <p className="mt-3 font-semibold" style={{ color: "hsl(var(--foreground))" }}>{t("Aucun outil trouvé", "No tools found")}</p>
              <button type="button" onClick={() => { setSearch(""); setPriceFilter("all"); setSearchParams(new URLSearchParams(), { replace: true }); }}
                className="mt-4 rounded-full border px-4 py-1.5 text-sm font-semibold hover:text-primary"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                {t("Réinitialiser", "Reset")}
              </button>
            </div>
          ) : (
            <>
              <header className="tt-catalog-results-header">
                <p className="tt-catalog-results-kicker">{t("Catalogue complet", "Full catalogue")}</p>
                <h2 id="catalogue-results-title" className="tt-catalog-results-title">
                  {t("Tous les outils", "All tools")}
                </h2>
              </header>
              <div className="tc-grid">
                {visible.map(tool => {
                  const catObj = categories.find(c => c.id === tool.categoryId);
                  const catLabel = catObj ? (lang === "en" ? stripLeadingEmoji(catObj.nameEn, catObj.id) : stripLeadingEmoji(catObj.name, catObj.id)) : undefined;
                  return (
                    <ToolCardEditorial
                      key={tool.id}
                      tool={tool}
                      prefix={prefix}
                      t={t}
                      lang={lang}
                      categoryLabel={catLabel}
                      exploreHref={getExplorerHref(prefix, { type: "outil", slug: tool.slug || tool.id })}
                      exploreState={{ explorerCanGoBack: true, explorerReturnTo: `${location.pathname}${location.search}`, previousSourceLabel: t("Catalogue", "Catalog") }}
                    />
                  );
                })}
              </div>
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button type="button" onClick={() => setVisibleCount(c => c + TOOLS_PER_PAGE)}
                    className="rounded-full border px-8 py-3 text-sm font-semibold transition-colors hover:border-primary/30 hover:text-primary"
                    style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))", background: "hsl(var(--background))" }}>
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
