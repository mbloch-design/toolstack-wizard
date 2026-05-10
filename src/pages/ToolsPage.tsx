import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { Search, LayoutGrid, List, ArrowUpDown, ChevronDown, SlidersHorizontal, Check, X, TrendingUp } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import ToolLogo from "@/components/ToolLogo";
import PageHero from "@/components/PageHero";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";
import type { Tool } from "@/data/types";

type SortKey = "name" | "price-asc" | "price-desc" | "free-first";
type ViewMode = "grid" | "list";
type PriceFilter = "all" | "free" | "freemium" | "paid";

const TOOLS_PER_PAGE = 24;

const ToolsPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useTools();
  const { categories } = useCategories();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("name");
  const [view, setView] = useState<ViewMode>("grid");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [visibleCount, setVisibleCount] = useState(TOOLS_PER_PAGE);

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

  // Filtered & sorted
  const filtered = useMemo(() => {
    const result = tools.filter((tool) => {
      const matchSearch = !search ||
        (tool.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (tool.shortDescription ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCat = !selectedCategory || tool.categoryId === selectedCategory;
      const matchPrice =
        priceFilter === "all" ? true :
        priceFilter === "free" ? (tool.defaultMonthlyPrice === 0 && !tool.pricing?.paid) :
        priceFilter === "freemium" ? (tool.pricing?.free && tool.pricing?.paid) :
        priceFilter === "paid" ? (tool.defaultMonthlyPrice > 0 && !tool.pricing?.free) :
        true;
      return matchSearch && matchCat && matchPrice;
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
  }, [tools, search, selectedCategory, sort, priceFilter]);

  // Reset pagination on filter change
  useEffect(() => { setVisibleCount(TOOLS_PER_PAGE); }, [search, selectedCategory, sort, priceFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const selectedCatObj = selectedCategory ? categories.find((c) => c.id === selectedCategory) : null;

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
      >
          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="tools-search"
                name="tools-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Rechercher un outil...", "Search for a tool...")}
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Price filter */}
              <select
                id="tools-price-filter"
                name="tools-price-filter"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">{t("Tous les prix", "All prices")}</option>
                <option value="free">{t("Gratuit", "Free")}</option>
                <option value="freemium">Freemium</option>
                <option value="paid">{t("Payant uniquement", "Paid only")}</option>
              </select>

              {/* Sort */}
              <select
                id="tools-sort"
                name="tools-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="name">{t("A → Z", "A → Z")}</option>
                <option value="price-asc">{t("Prix ↑", "Price ↑")}</option>
                <option value="price-desc">{t("Prix ↓", "Price ↓")}</option>
                <option value="free-first">{t("Gratuit d'abord", "Free first")}</option>
              </select>

              {/* View toggle */}
              <div className="hidden md:flex items-center rounded-lg border border-input bg-background">
                <button
                  onClick={() => setView("grid")}
                  className={`p-2.5 rounded-l-lg transition-colors ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-2.5 rounded-r-lg transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                !selectedCategory ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {t("Tous", "All")} ({tools.length})
            </button>
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.id);
              const count = tools.filter((t) => t.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    selectedCategory === cat.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {t(cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""), cat.nameEn || cat.name)} ({count})
                </button>
              );
            })}
          </div>
      </PageHero>

      {/* Results */}
      <section className="container mx-auto max-w-7xl px-4 py-10">
        {selectedCatObj && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tighter">
              {t(selectedCatObj.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""), selectedCatObj.nameEn || selectedCatObj.name)}
            </h2>
            {selectedCatObj.description && (
              <p className="mt-1 text-sm text-muted-foreground">{t(selectedCatObj.description, selectedCatObj.descriptionEn)}</p>
            )}
          </div>
        )}

        <p className="mb-4 text-sm text-muted-foreground">
          {filtered.length} {t("résultats", "results")}
          {search && ` ${t("pour", "for")} "${search}"`}
        </p>

        {/* Grouped view (no filter, no search) */}
        {groupedByCategory && !search ? (
          <div className="space-y-10">
            {groupedByCategory.map(({ category: cat, tools: catTools }) => {
              const Icon = getCategoryIcon(cat.id);
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold tracking-tighter">
                        {t(cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""), cat.nameEn || cat.name)}
                      </h2>
                      <span className="text-xs text-muted-foreground rounded-full bg-secondary px-2 py-0.5">{catTools.length}</span>
                    </div>
                    <Link to={`${prefix}/category/${cat.slug}`} className="text-sm text-primary hover:underline">
                      {t("Voir tout →", "See all →")}
                    </Link>
                  </div>
                  {view === "grid" ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {catTools.slice(0, 6).map((tool) => (
                        <ToolCardGrid key={tool.id} tool={tool} prefix={prefix} t={t} />
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((tool) => (
                  <ToolCardGrid key={tool.id} tool={tool} prefix={prefix} t={t} />
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

        {filtered.length === 0 && (
          <p className="mt-12 text-center text-muted-foreground">{t("Aucun outil trouvé.", "No tools found.")}</p>
        )}
      </section>
    </div>
  );
};

// ---------- Card Components ----------

function ToolCardGrid({ tool, prefix, t }: { tool: Tool; prefix: string; t: (fr: string, en: string) => string }) {
  const priceBadge = tool.defaultMonthlyPrice === 0
    ? (tool.pricing?.paid ? "Freemium" : t("Gratuit", "Free"))
    : `${tool.defaultMonthlyPrice}€/${t("mois", "mo")}`;

  const badgeClass = tool.defaultMonthlyPrice === 0
    ? "bg-keep/10 text-keep"
    : "bg-secondary text-muted-foreground";

  return (
    <Link
      to={`${prefix}/tool/${tool.slug}`}
      className="surface-card-hover group flex flex-col p-5"
    >
      <div className="flex items-start gap-3">
        <ToolLogo tool={tool} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold group-hover:text-primary truncate">{tool.name}</h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
              {priceBadge}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {t(tool.shortDescription, tool.shortDescriptionEn || tool.shortDescription)}
          </p>
        </div>
      </div>

      {/* Pros preview */}
      {tool.pros?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
          {tool.pros.slice(0, 2).map((pro: string, i: number) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3 w-3 mt-0.5 shrink-0 text-keep" />
              <span className="line-clamp-1">{pro}</span>
            </div>
          ))}
        </div>
      )}
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

export default ToolsPage;
