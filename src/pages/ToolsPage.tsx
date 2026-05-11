import { useState, useEffect, useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { Search, LayoutGrid, List, ChevronDown, SlidersHorizontal, Check, X, TrendingUp } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import ToolLogo from "@/components/ToolLogo";
import PageHero from "@/components/PageHero";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";
import { asText, stripLeadingEmoji } from "@/lib/text";
import type { Tool } from "@/data/types";

type SortKey = "name" | "price-asc" | "price-desc" | "free-first";
type ViewMode = "grid" | "list";
type PriceFilter = "all" | "free" | "freemium" | "paid";
type ProfileFilter = "all" | "freelance" | "startup";

const TOOLS_PER_PAGE = 24;
const FEATURED_CATEGORY_FILTERS = [
  { id: "organization", label: "Organisation", labelEn: "Organization" },
  { id: "ai-general", label: "IA Généraliste", labelEn: "General AI" },
  { id: "nocode-web", label: "No-Code & Web", labelEn: "No-Code & Web" },
  { id: "design-tools", label: "Design", labelEn: "Design" },
  { id: "finance", label: "Finance", labelEn: "Finance" },
] as const;
const PROFILE_FILTERS: { value: ProfileFilter; label: string; labelEn: string }[] = [
  { value: "freelance", label: "Freelance", labelEn: "Freelance" },
  { value: "startup", label: "Startup", labelEn: "Startup" },
];
const BUDGET_FILTERS: { value: PriceFilter; label: string; labelEn: string }[] = [
  { value: "freemium", label: "Freemium", labelEn: "Freemium" },
  { value: "paid", label: "Payant", labelEn: "Paid" },
];

const ToolsPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useTools();
  const { categories } = useCategories();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("name");
  const [view, setView] = useState<ViewMode>("grid");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [profileFilter, setProfileFilter] = useState<ProfileFilter>("all");
  const [visibleCount, setVisibleCount] = useState(TOOLS_PER_PAGE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [openFilterGroups, setOpenFilterGroups] = useState<string[]>(["organization", "profile", "budget"]);

  // SEO
  useEffect(() => {
    const title = lang === "fr"
      ? `Comparateur SaaS — ${tools.length} outils avec prix réels et alternatives | ToolTrim`
      : `SaaS Comparison — ${tools.length} tools with real pricing & alternatives | ToolTrim`;
    const desc = lang === "fr"
      ? `Abonnements trop chers, outils en doublon, alternatives gratuites ignorées — on a tout vérifié pour toi. ${tools.length} outils SaaS analysés indépendamment, sans affiliation.`
      : `Overpriced subscriptions, duplicate tools, free alternatives you're missing — we checked everything. ${tools.length} SaaS tools reviewed independently, no affiliate bias.`;
    const url = `https://tooltrim.com/${lang}/tools`;

    setSeoTags({ title, description: desc, url });
    setHreflang(`/${lang}/tools`);

    setJsonLd("tools-jsonld", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description: desc,
      url,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: tools.length,
        itemListElement: tools.slice(0, 30).map((tool, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: tool.name,
          url: `https://tooltrim.com/${lang}/tool/${tool.slug || tool.id}`,
        })),
      },
    });

    return () => cleanupSeo(["tools-jsonld"]);
  }, [lang, tools]);

  // Stats
  const stats = useMemo(() => {
    const free = tools.filter(t => t.defaultMonthlyPrice === 0).length;
    const withFreeTier = tools.filter(t => t.pricing?.free).length;
    return { total: tools.length, free, withFreeTier, categories: categories.length };
  }, [tools, categories]);

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  // Filtered & sorted
  const filtered = useMemo(() => {
    const result = tools.filter((tool) => {
      const matchSearch = !search ||
        (tool.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (tool.shortDescription ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (categoryById.get(tool.categoryId)?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (categoryById.get(tool.categoryId)?.nameEn ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCat = !selectedCategory || tool.categoryId === selectedCategory;
      const matchProfile = profileFilter === "all" || toolMatchesProfile(tool, profileFilter);
      const matchPrice =
        priceFilter === "all" ? true :
        priceFilter === "free" ? (tool.defaultMonthlyPrice === 0 && !tool.pricing?.paid) :
        priceFilter === "freemium" ? (tool.pricing?.free && tool.pricing?.paid) :
        priceFilter === "paid" ? (tool.defaultMonthlyPrice > 0 && !tool.pricing?.free) :
        true;
      return matchSearch && matchCat && matchProfile && matchPrice;
    });

    result.sort((a, b) => {
      switch (sort) {
        case "name": return (a.name ?? "").localeCompare(b.name ?? "");
        case "price-asc": return (a.defaultMonthlyPrice || 0) - (b.defaultMonthlyPrice || 0);
        case "price-desc": return (b.defaultMonthlyPrice || 0) - (a.defaultMonthlyPrice || 0);
        case "free-first": return (a.defaultMonthlyPrice === 0 ? 0 : 1) - (b.defaultMonthlyPrice === 0 ? 0 : 1);
        default: return 0;
      }
    });

    return result;
  }, [tools, search, selectedCategory, sort, priceFilter, profileFilter, categoryById]);

  // Reset pagination on filter change
  useEffect(() => { setVisibleCount(TOOLS_PER_PAGE); }, [search, selectedCategory, sort, priceFilter, profileFilter]);

  useEffect(() => {
    if (!search) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = window.setTimeout(() => setIsSearching(false), 420);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const selectedCatObj = selectedCategory ? categories.find((c) => c.id === selectedCategory) : null;
  const hasActiveFilters = Boolean(search || selectedCategory || priceFilter !== "all" || profileFilter !== "all");
  const activeFilterChips = [
    ...(selectedCatObj ? [{ type: "category" as const, label: t(stripLeadingEmoji(selectedCatObj.name, selectedCatObj.id), stripLeadingEmoji(selectedCatObj.nameEn, stripLeadingEmoji(selectedCatObj.name, selectedCatObj.id))) }] : []),
    ...(profileFilter !== "all" ? [{ type: "profile" as const, label: t(profileLabel(profileFilter, "fr"), profileLabel(profileFilter, "en")) }] : []),
    ...(priceFilter !== "all" ? [{ type: "budget" as const, label: t(priceLabel(priceFilter, "fr"), priceLabel(priceFilter, "en")) }] : []),
    ...(search ? [{ type: "search" as const, label: search }] : []),
  ];

  // Group by category for "all" view
  const groupedByCategory = useMemo(() => {
    if (selectedCategory || search) return null;
    const groups: { category: typeof categories[0]; tools: typeof filtered }[] = [];
    for (const cat of categories) {
      const catTools = filtered.filter(t => t.categoryId === cat.id);
      if (catTools.length > 0) groups.push({ category: cat, tools: catTools });
    }
    return groups;
  }, [selectedCategory, search, filtered, categories]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory(null);
    setPriceFilter("all");
    setProfileFilter("all");
    setSort("name");
  };

  const clearActiveFilter = (type: (typeof activeFilterChips)[number]["type"]) => {
    if (type === "category") setSelectedCategory(null);
    if (type === "profile") setProfileFilter("all");
    if (type === "budget") setPriceFilter("all");
    if (type === "search") setSearch("");
  };

  const toggleAccordion = (id: string) => {
    setOpenFilterGroups((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  };

  const renderAccordionGroup = (
    id: string,
    title: string,
    titleEn: string,
    children: ReactNode,
  ) => {
    const open = openFilterGroups.includes(id);
    return (
      <div key={id} className="border-b border-border pb-3 last:border-0 last:pb-0">
        <button
          type="button"
          onClick={() => toggleAccordion(id)}
          aria-expanded={open}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-1 text-left text-sm font-semibold text-foreground"
        >
          <span>{t(title, titleEn)}</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && <div className="mt-2 space-y-1.5">{children}</div>}
      </div>
    );
  };

  const renderFilterOption = (
    active: boolean,
    label: string,
    count: number,
    onClick: () => void,
    icon?: React.ReactNode,
  ) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
          {active && <Check className="h-3 w-3" />}
        </span>
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${active ? "bg-primary/10 text-primary" : "bg-background text-muted-foreground"}`}>{count}</span>
    </button>
  );

  const renderFiltersPanel = (idPrefix: string) => (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t("Filtres", "Filters")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} {t("outils vérifiés", "verified tools")}</p>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-semibold text-primary hover:text-primary/80"
          >
            {t("Réinitialiser", "Reset")}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {FEATURED_CATEGORY_FILTERS.map((filter) => {
          const category = categories.find((item) => item.id === filter.id);
          const Icon = getCategoryIcon(filter.id);
          const count = tools.filter((tool) => tool.categoryId === filter.id).length;
          const active = selectedCategory === filter.id;
          return renderAccordionGroup(
            filter.id,
            filter.label,
            filter.labelEn,
            renderFilterOption(
              active,
              category ? t(stripLeadingEmoji(category.name, category.id), stripLeadingEmoji(category.nameEn, stripLeadingEmoji(category.name, category.id))) : t(filter.label, filter.labelEn),
              count,
              () => setSelectedCategory(active ? null : filter.id),
              <Icon className="h-4 w-4 shrink-0" />,
            ),
          );
        })}
        {renderAccordionGroup(
          "profile",
          "Profil utilisateur",
          "User profile",
          PROFILE_FILTERS.map((option) => renderFilterOption(
            profileFilter === option.value,
            t(option.label, option.labelEn),
            tools.filter((tool) => toolMatchesProfile(tool, option.value)).length,
            () => setProfileFilter(profileFilter === option.value ? "all" : option.value),
          )),
        )}
        {renderAccordionGroup(
          "budget",
          "Budget",
          "Budget",
          BUDGET_FILTERS.map((option) => renderFilterOption(
            priceFilter === option.value,
            t(option.label, option.labelEn),
            tools.filter((tool) => priceMatchesFilter(tool, option.value)).length,
            () => setPriceFilter(priceFilter === option.value ? "all" : option.value),
          )),
        )}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-tools-price-filter`} className="mb-3 block text-sm font-semibold text-foreground">
          {t("Prix", "Price")}
        </label>
        <select
          id={`${idPrefix}-tools-price-filter`}
          name="tools-price-filter"
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">{t("Tous les prix", "All prices")}</option>
          <option value="free">{t("Gratuit", "Free")}</option>
          <option value="freemium">Freemium</option>
          <option value="paid">{t("Payant uniquement", "Paid only")}</option>
        </select>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-tools-sort`} className="mb-3 block text-sm font-semibold text-foreground">
          {t("Tri", "Sort")}
        </label>
        <select
          id={`${idPrefix}-tools-sort`}
          name="tools-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="name">{t("A → Z", "A → Z")}</option>
          <option value="price-asc">{t("Prix ↑", "Price ↑")}</option>
          <option value="price-desc">{t("Prix ↓", "Price ↓")}</option>
          <option value="free-first">{t("Gratuit d'abord", "Free first")}</option>
        </select>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-foreground">{t("Affichage", "View")}</p>
        <div className="grid grid-cols-2 rounded-lg border border-input bg-background p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutGrid className="h-4 w-4" />
            {t("Grille", "Grid")}
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="h-4 w-4" />
            {t("Liste", "List")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <PageHero
        breadcrumb={[{ label: t("Outils", "Tools") }]}
        eyebrow={t("Catalogue", "Catalog")}
        icon={<LayoutGrid className="h-3.5 w-3.5" />}
        title={t(`${stats.total} outils SaaS passés au crible`, `${stats.total} SaaS tools reviewed`)}
        description={t(
          `${stats.total} outils analysés, comparés et classés en ${stats.categories} catégories. Prix vérifiés, alternatives visibles, verdicts indépendants.`,
          `${stats.total} tools analyzed, compared and categorized in ${stats.categories} categories. Verified pricing, visible alternatives, independent verdicts.`
        )}
        stats={[
          { icon: <TrendingUp className="h-4 w-4 text-primary" />, value: stats.total, label: t("outils", "tools") },
          { value: stats.withFreeTier, label: t("avec offre gratuite", "with free tier"), tone: "positive" },
          { value: stats.categories, label: t("catégories", "categories") },
        ]}
      />

      <button
        type="button"
        onClick={() => setMobileFiltersOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 lg:hidden"
        aria-haspopup="dialog"
        aria-expanded={mobileFiltersOpen}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {t("Filtres", "Filters")}
      </button>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("Filtres des outils", "Tool filters")}>
          <button
            type="button"
            aria-label={t("Fermer les filtres", "Close filters")}
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 bg-foreground/35"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-3xl border border-border bg-background p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">{t("Filtres", "Filters")}</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground"
                aria-label={t("Fermer", "Close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderFiltersPanel("mobile")}
          </div>
        </div>
      )}

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[minmax(15rem,25%)_minmax(0,75%)] lg:px-6 lg:py-12">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border bg-card p-5">
            {renderFiltersPanel("desktop")}
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-6 rounded-3xl border border-border bg-card p-3 shadow-sm">
            <label htmlFor="tools-search" className="sr-only">
              {t("Rechercher un outil ou une catégorie", "Search a tool or category")}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
              <input
                id="tools-search"
                name="tools-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Rechercher un outil, une catégorie...", "Search a tool, a category...")}
                className="h-16 w-full rounded-2xl border border-transparent bg-background pl-14 pr-28 text-base font-semibold outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background focus:ring-4 focus:ring-primary/10 md:text-lg"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                  aria-label={t("Effacer la recherche", "Clear search")}
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("Effacer", "Clear")}</span>
                </button>
              )}
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {t("Filtres actifs", "Active filters")}
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground" aria-live="polite">
                  {filtered.length} {t("outils vérifiés", "verified tools")}
                </h2>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {t("Réinitialiser tout", "Reset all")}
                </button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {activeFilterChips.length > 0 ? activeFilterChips.map((chip) => (
                <button
                  key={`${chip.type}-${chip.label}`}
                  type="button"
                  onClick={() => clearActiveFilter(chip.type)}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/12"
                  aria-label={t(`Retirer ${chip.label}`, `Remove ${chip.label}`)}
                >
                  {chip.label}
                  <X className="h-4 w-4" />
                </button>
              )) : (
                <p className="text-sm text-muted-foreground">{t("Aucun filtre sélectionné.", "No filter selected.")}</p>
              )}
            </div>
          </div>

          {isSearching ? (
            <ToolGridSkeleton view={view} />
          ) : groupedByCategory && !search ? (
            <div className="space-y-10">
              {groupedByCategory.map(({ category: cat, tools: catTools }) => {
                const Icon = getCategoryIcon(cat.id);
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold tracking-tighter">
                          {t(stripLeadingEmoji(cat.name, cat.id), stripLeadingEmoji(cat.nameEn, stripLeadingEmoji(cat.name, cat.id)))}
                        </h2>
                        <span className="text-xs text-muted-foreground rounded-full bg-secondary px-2 py-0.5">{catTools.length}</span>
                      </div>
                      <Link to={`${prefix}/category/${cat.slug}`} className="text-sm text-primary hover:underline">
                        {t("Voir tout →", "See all →")}
                      </Link>
                    </div>
                    {view === "grid" ? (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {catTools.slice(0, 6).map((tool) => (
                          <ToolCard key={tool.id} tool={tool} prefix={prefix} t={t} />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {catTools.slice(0, 6).map((tool) => (
                          <ToolCardList key={tool.id} tool={tool} prefix={prefix} t={t} />
                        ))}
                      </div>
                    )}
                    {catTools.length > 6 && (
                      <button
                        onClick={() => setSelectedCategory(cat.id)}
                        className="mt-3 text-sm text-primary hover:underline"
                      >
                        {t(`+ ${catTools.length - 6} autres outils`, `+ ${catTools.length - 6} more tools`)}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <>
            {view === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} prefix={prefix} t={t} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {visible.map((tool) => (
                  <ToolCardList key={tool.id} tool={tool} prefix={prefix} t={t} />
                ))}
              </div>
            )}

            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setVisibleCount(c => c + TOOLS_PER_PAGE)}
                  className="surface-control inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
                >
                  <ChevronDown className="h-4 w-4" />
                  {t(`Afficher plus (${filtered.length - visibleCount} restants)`, `Show more (${filtered.length - visibleCount} remaining)`)}
                </button>
              </div>
            )}
            </>
          )}

          {!isSearching && filtered.length === 0 && (
            <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight text-foreground">
                {t("Aucun outil ne correspond à ces filtres", "No tools match these filters")}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {t("Essaie une catégorie plus large, retire un filtre actif ou repars de zéro.", "Try a broader category, remove an active filter, or start over.")}
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
              >
                {t("Réinitialiser tous les filtres", "Reset all filters")}
              </button>
            </div>
          )}
        </main>
      </section>
    </div>
  );
};

// ---------- Card Components ----------

function ToolCard({ tool, prefix, t }: { tool: Tool; prefix: string; t: (fr: string, en: string) => string }) {
  const priceLabel = tool.defaultMonthlyPrice === 0
    ? (tool.pricing?.paid ? "Freemium" : t("Gratuit", "Free"))
    : t(`À partir de ${formatPrice(tool.defaultMonthlyPrice)}/mois`, `From ${formatPrice(tool.defaultMonthlyPrice)}/mo`);
  const keepIf = t(tool.verdict?.keepIf?.[0] || idealForFallback(tool), tool.verdictEn?.keepIf?.[0] || idealForFallback(tool));
  const avoidIf = t(tool.verdict?.avoidIf?.[0] || avoidIfFallback(tool), tool.verdictEn?.avoidIf?.[0] || avoidIfFallback(tool));
  const alternatives = getToolAlternatives(tool);

  return (
    <Link
      to={`${prefix}/tool/${tool.slug}`}
      className="group flex h-full cursor-pointer flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-foreground/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <ToolLogo tool={tool} size={44} />
          <h3 className="min-w-0 truncate text-base font-semibold tracking-tight text-foreground group-hover:text-primary">
            {tool.name}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
          {priceLabel}
        </span>
      </div>

      <p className="mt-3 line-clamp-1 text-sm leading-6 text-muted-foreground">
        {t(tool.shortDescription, tool.shortDescriptionEn || tool.shortDescription)}
      </p>

      <div className="mt-4 space-y-2 rounded-2xl border border-border/70 bg-secondary/35 p-3">
        <div className="flex items-start gap-2 text-sm leading-5">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-keep/10 text-keep">
            <Check className="h-3.5 w-3.5" />
          </span>
          <p className="min-w-0 text-muted-foreground">
            <span className="font-semibold text-keep">{t("Idéal pour :", "Best for:")}</span>{" "}
            <span className="line-clamp-1">{keepIf}</span>
          </p>
        </div>
        <div className="flex items-start gap-2 text-sm leading-5">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cancel/10 text-cancel">
            <X className="h-3.5 w-3.5" />
          </span>
          <p className="min-w-0 text-muted-foreground">
            <span className="font-semibold text-cancel">{t("À éviter si :", "Avoid if:")}</span>{" "}
            <span className="line-clamp-1">{avoidIf}</span>
          </p>
        </div>
      </div>

      {alternatives.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">{t("Alternatives :", "Alternatives:")}</span>
          {alternatives.slice(0, 3).map((alternative) => (
            <span key={alternative} className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {alternative}
            </span>
          ))}
        </div>
      )}

      <span className="mt-auto inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">
        {t("Lire l'avis", "Read review")}
      </span>
    </Link>
  );
}

function ToolCardList({ tool, prefix, t }: { tool: Tool; prefix: string; t: (fr: string, en: string) => string }) {
  const priceBadge = tool.defaultMonthlyPrice === 0
    ? (tool.pricing?.paid ? "Freemium" : t("Gratuit", "Free"))
    : `${tool.defaultMonthlyPrice}€/${t("mois", "mo")}`;

  const badgeClass = tool.defaultMonthlyPrice === 0
    ? "bg-keep/10 text-keep"
    : "bg-secondary text-muted-foreground";

  return (
    <Link
      to={`${prefix}/tool/${tool.slug}`}
      className="surface-card-hover group flex items-center gap-4 p-4"
    >
      <ToolLogo tool={tool} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold group-hover:text-primary truncate">{tool.name}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
            {priceBadge}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
          {t(tool.shortDescription, tool.shortDescriptionEn || tool.shortDescription)}
        </p>
      </div>
      <div className="hidden md:flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
        {tool.pros?.length > 0 && (
          <span className="flex items-center gap-1 text-keep"><Check className="h-3 w-3" />{tool.pros.length}</span>
        )}
        {tool.cons?.length > 0 && (
          <span className="flex items-center gap-1 text-cancel"><X className="h-3 w-3" />{tool.cons.length}</span>
        )}
      </div>
    </Link>
  );
}

function ToolGridSkeleton({ view }: { view: ViewMode }) {
  if (view === "list") {
    return (
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="surface-card flex animate-pulse items-center gap-4 p-4">
            <div className="h-10 w-10 rounded-xl bg-secondary" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-40 rounded-full bg-secondary" />
              <div className="h-3 w-3/4 rounded-full bg-secondary" />
            </div>
            <div className="hidden h-7 w-20 rounded-full bg-secondary md:block" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="surface-card animate-pulse p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="h-4 w-28 rounded-full bg-secondary" />
                <div className="h-6 w-16 rounded-full bg-secondary" />
              </div>
              <div className="h-3 w-full rounded-full bg-secondary" />
              <div className="h-3 w-2/3 rounded-full bg-secondary" />
            </div>
          </div>
          <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
            <div className="h-3 w-4/5 rounded-full bg-secondary" />
            <div className="h-3 w-2/3 rounded-full bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function priceMatchesFilter(tool: Tool, filter: PriceFilter) {
  if (filter === "all") return true;
  if (filter === "free") return tool.defaultMonthlyPrice === 0 && !tool.pricing?.paid;
  if (filter === "freemium") return Boolean(tool.pricing?.free && tool.pricing?.paid);
  if (filter === "paid") return tool.defaultMonthlyPrice > 0 && !tool.pricing?.free;
  return true;
}

function toolMatchesProfile(tool: Tool, profile: ProfileFilter) {
  if (profile === "all") return true;
  const haystack = [
    tool.name,
    tool.slug,
    tool.shortDescription,
    tool.shortDescriptionEn,
    tool.categoryId,
  ].filter(Boolean).join(" ").toLowerCase();

  if (profile === "freelance") {
    return /freelance|solo|indépendant|independant|micro|client|factur|devis|portfolio|productivity|organisation|finance/.test(haystack);
  }

  return /startup|saas|team|équipe|equipe|crm|sales|product|analytics|data|support|customer|growth|ops/.test(haystack);
}

function profileLabel(profile: ProfileFilter, lang: "fr" | "en") {
  if (profile === "freelance") return "Freelance";
  if (profile === "startup") return "Startup";
  return lang === "fr" ? "Tous les profils" : "All profiles";
}

function priceLabel(price: PriceFilter, lang: "fr" | "en") {
  if (price === "free") return lang === "fr" ? "Gratuit" : "Free";
  if (price === "freemium") return "Freemium";
  if (price === "paid") return lang === "fr" ? "Payant" : "Paid";
  return lang === "fr" ? "Tous les prix" : "All prices";
}

function formatPrice(price: number) {
  return `${Number.isInteger(price) ? price : price.toFixed(2)}€`;
}

function idealForFallback(tool: Tool) {
  const profile = [...(tool.relevantFor || []), ...(tool.personas || []), ...(tool.verticals || [])]
    .find(Boolean);
  return profile ? humanizeToken(profile) : "les équipes qui ont ce besoin chaque semaine";
}

function avoidIfFallback(tool: Tool) {
  if (tool.defaultMonthlyPrice > 0) return "un outil gratuit couvre déjà le besoin";
  if (tool.teamRelevance === "low") return "tu dois gérer une équipe ou des droits avancés";
  return "le besoin est ponctuel ou déjà couvert ailleurs";
}

function getToolAlternatives(tool: Tool) {
  const alternatives = [
    ...(tool.alternatives || []),
    tool.freeAlternative || "",
    tool.betterAlternative?.tool || "",
  ].filter(Boolean);

  return Array.from(new Set(alternatives.map((alternative) => humanizeToken(alternative))))
    .filter((item) => item && item !== tool.name);
}

function humanizeToken(value: unknown) {
  return asText(value)
    .replace(/^tool:/, "")
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (["ai", "ia", "seo", "crm", "api", "ux", "ui"].includes(word.toLowerCase())) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export default ToolsPage;
