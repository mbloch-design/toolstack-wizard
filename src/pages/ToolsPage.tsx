import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { Bookmark, ChevronDown, Search, X } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import { ToolCard } from "@/components/ToolCard";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import { useStackPins } from "@/hooks/useStackPins";
import type { Tool } from "@/data/types";

const TOOLS_PER_PAGE = 40;


type SortKey = "popular" | "name" | "price-asc" | "free-first";
type PriceFilter = "all" | "free" | "paid";

function isTrending(tool: Tool) {
  return tool.prescription_quality === "ferme";
}
function isRecommended(tool: Tool) {
  return tool.prescription_quality === "oui" || tool.prescription_quality === "ferme";
}

const ToolsPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useTools();
  const { categories } = useCategories();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("popular");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [visibleCount, setVisibleCount] = useState(TOOLS_PER_PAGE);
  const { state: stackPinsState } = useStackPins();

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

  const sortedCategories = useMemo(() =>
    [...categories].sort((a, b) =>
      tools.filter(t => t.categoryId === b.id).length - tools.filter(t => t.categoryId === a.id).length
    ), [categories, tools]
  );

  // Noteworthy: top recommended tools (not filtered by category/search)
  const noteworthy = useMemo(() =>
    tools.filter(isRecommended).slice(0, 8),
    [tools]
  );

  // All tools filtered + sorted
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = tools.filter(tool => {
      const matchSearch = !search
        || (tool.name ?? "").toLowerCase().includes(q)
        || (tool.shortDescription ?? "").toLowerCase().includes(q);
      const matchCat = !selectedCategory || tool.categoryId === selectedCategory;
      const matchPrice =
        priceFilter === "free" ? tool.defaultMonthlyPrice === 0 :
        priceFilter === "paid" ? tool.defaultMonthlyPrice > 0 :
        true;
      return matchSearch && matchCat && matchPrice;
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
  }, [tools, search, selectedCategory, priceFilter, sort]);

  useEffect(() => { setVisibleCount(TOOLS_PER_PAGE); }, [search, selectedCategory, priceFilter, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const getCatLabel = (cat: typeof categories[0]) =>
    t(stripLeadingEmoji(cat.name, cat.id), stripLeadingEmoji(cat.nameEn, stripLeadingEmoji(cat.name, cat.id)));

  const isFiltering = !!(search || selectedCategory || priceFilter !== "all");

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>

      {/* ══════════════ HERO — shared tt-page-hero pattern ══════════════ */}
      <section className="tt-page-hero">
        <div className="tt-page-hero-inner">
          <div style={{ marginBottom: 14 }}>
            <Breadcrumb items={[{ label: t("Catalogue", "Catalog") }]} />
          </div>
          <span className="tt-page-hero-eyebrow">{t("Catalogue", "Catalog")}</span>
          <h1 className="tt-page-hero-title">{t("Trouver les bons outils.", "Find the right tools.")}</h1>
          <p className="tt-page-hero-desc">
            {t(
              "Le catalogue ToolTrim : chaque outil noté sur son contexte réel, pas sur sa liste de fonctionnalités.",
              "The ToolTrim catalog: each tool rated on its real context, not on its feature list.",
            )}
          </p>

          <div className="tt-page-hero-search">
            <label htmlFor="tools-search-input" className="tt-page-hero-search-label">
              {t("Rechercher un outil", "Search a tool")}
            </label>
            <div className="tt-page-hero-search-field">
              <input
                id="tools-search-input"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Ex. Notion, Figma, ChatGPT…", "E.g. Notion, Figma, ChatGPT…")}
                className="tt-page-hero-search-input"
                autoComplete="off"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="tt-page-hero-search-clear"
                  aria-label={t("Effacer", "Clear")}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ BODY ══════════════ */}
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* ── Filter bar: quick pills for the primary facets ── */}
        <div className="tt-filter-bar">
          <div className="tt-filter-select-wrap">
            <select
              value={selectedCategory ?? "all"}
              onChange={(e) => setSelectedCategory(e.target.value === "all" ? null : e.target.value)}
              className="tt-filter-select"
              aria-label={t("Catégorie", "Category") as string}
            >
              <option value="all">{t("Toutes les catégories", "All categories")}</option>
              {sortedCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{getCatLabel(cat)}</option>
              ))}
            </select>
            <ChevronDown className="tt-filter-select-chevron" aria-hidden />
          </div>

          <div className="tt-filter-select-wrap">
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
              className="tt-filter-select"
              aria-label={t("Prix", "Price") as string}
            >
              <option value="all">{t("Payant + Gratuit", "Paid + Free")}</option>
              <option value="free">{t("Gratuit seulement", "Free only")}</option>
              <option value="paid">{t("Payant seulement", "Paid only")}</option>
            </select>
            <ChevronDown className="tt-filter-select-chevron" aria-hidden />
          </div>

          <Link to={`${prefix}/panier`} className="tt-filter-stack-link tt-filter-bar-spacer">
            <Bookmark size={15} aria-hidden />
            {t("Ma stack", "My stack")} · {stackPinsState.pinnedToolSlugs.length}
          </Link>
        </div>

        {/* ── Section 1: Noteworthy (only when not filtering) ── */}
        {!isFiltering && noteworthy.length > 0 && (
          <section className="mb-12">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("Sélection éditoriale", "Editor's picks")}
            </p>
            <h2 className="mb-5 font-display" style={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.02em", color: "hsl(var(--foreground))" }}>
              {t("Les outils qu'on recommande vraiment", "Tools we actually recommend")}
            </h2>
            <div className="tc-grid tc-grid--featured-first">
              {noteworthy.map((tool, i) => {
                const catObj = categories.find(c => c.id === tool.categoryId);
                const catLabel = catObj ? (lang === "en" ? stripLeadingEmoji(catObj.nameEn, catObj.id) : stripLeadingEmoji(catObj.name, catObj.id)) : undefined;
                return (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    prefix={prefix}
                    t={t}
                    lang={lang}
                    variant={i === 0 ? "featured" : "default"}
                    categoryLabel={catLabel}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* ── Section 2: All apps ── */}
        <section className={!isFiltering && noteworthy.length > 0 ? "border-t border-border/50 pt-10" : ""}>
          <div className="sk-results-header" style={{ marginBottom: 20 }}>
            <span className="sk-results-count">
              {isFiltering
                ? `${filtered.length} ${t("résultat", "result")}${filtered.length !== 1 ? "s" : ""}`
                : `${filtered.length} ${t("outils", "tools")}`}
            </span>
            <div className="sk-results-sort">
              <span className="gi-sort-label">{t("Trier par", "Sort by")}</span>
              <select className="gi-sort-select" value={sort} onChange={e => setSort(e.target.value as SortKey)} aria-label={t("Trier par", "Sort by") as string}>
                <option value="popular">{t("Populaire", "Popular")}</option>
                <option value="name">{t("A → Z", "A → Z")}</option>
                <option value="price-asc">{t("Prix croissant", "Price: low to high")}</option>
                <option value="free-first">{t("Gratuit d'abord", "Free first")}</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: "hsl(var(--border))" }}>
              <Search className="mx-auto h-8 w-8" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }} />
              <p className="mt-3 font-semibold" style={{ color: "hsl(var(--foreground))" }}>{t("Aucun outil trouvé", "No tools found")}</p>
              <button type="button" onClick={() => { setSearch(""); setSelectedCategory(null); setPriceFilter("all"); }}
                className="mt-4 rounded-full border px-4 py-1.5 text-sm font-semibold hover:text-primary"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                {t("Réinitialiser", "Reset")}
              </button>
            </div>
          ) : (
            <>
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
                    />
                  );
                })}
              </div>
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button type="button" onClick={() => setVisibleCount(c => c + TOOLS_PER_PAGE)}
                    className="rounded-full border px-8 py-3 text-sm font-semibold transition-colors hover:border-primary/30 hover:text-primary"
                    style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))", background: "hsl(var(--background))" }}>
                    {t(`Afficher plus — ${filtered.length - visibleCount} restants`, `Show more — ${filtered.length - visibleCount} remaining`)}
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
