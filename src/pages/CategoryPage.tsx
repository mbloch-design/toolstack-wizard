import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { Search, Check, X, ChevronDown, ArrowRight } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, setJsonLd, setHreflang, setNoindex, cleanupSeo, SEO_BASE } from "@/lib/seo";

type SortKey = "name" | "price-asc" | "price-desc" | "free-first";
type PriceFilter = "all" | "free" | "freemium" | "paid";
const PER_PAGE = 18;

const CategoryPage = () => {
  const { lang, t, prefix } = useLang();
  const { slug } = useParams();
  const { tools } = useTools();
  const { categories } = useCategories();
  const category = categories.find((c) => c.slug === slug);
  const allCatTools = category ? tools.filter((t) => t.categoryId === category.id) : [];

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PER_PAGE);

  // SEO
  useEffect(() => {
    if (!category) return;
    const catName = category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
    const title = lang === "fr"
      ? `${catName} — ${allCatTools.length} outils comparés | ToolTrim`
      : `${category.nameEn || catName} — ${allCatTools.length} tools compared | ToolTrim`;
    const desc = lang === "fr"
      ? `Comparez ${allCatTools.length} outils ${catName.toLowerCase()} : prix, avantages, alternatives. Trouvez le meilleur pour votre activité.`
      : `Compare ${allCatTools.length} ${(category.nameEn || catName).toLowerCase()} tools: pricing, pros, alternatives. Find the best for your business.`;
    const url = `https://www.tooltrim.io/${lang}/category/${category.slug}`;

    setSeoTags({ title, description: desc, url });
    setHreflang(`/${lang}/category/${category.slug}`);
    setJsonLd("cat-jsonld", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description: desc,
      url,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: allCatTools.length,
        itemListElement: allCatTools.slice(0, 20).map((tool, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: tool.name,
          url: `https://www.tooltrim.io/${lang}/tool/${tool.slug || tool.id}`,
        })),
      },
    });
    return () => cleanupSeo(["cat-jsonld"]);
  }, [category, lang, allCatTools.length]);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = allCatTools.filter((tool) => {
      const matchSearch = !search || tool.name.toLowerCase().includes(search.toLowerCase()) || tool.shortDescription.toLowerCase().includes(search.toLowerCase());
      const matchPrice =
        priceFilter === "all" ? true :
        priceFilter === "free" ? (tool.defaultMonthlyPrice === 0 && !tool.pricing?.paid) :
        priceFilter === "freemium" ? (tool.pricing?.free && tool.pricing?.paid) :
        priceFilter === "paid" ? (tool.defaultMonthlyPrice > 0 && !tool.pricing?.free) : true;
      return matchSearch && matchPrice;
    });
    result.sort((a, b) => {
      switch (sort) {
        case "name": return a.name.localeCompare(b.name);
        case "price-asc": return (a.defaultMonthlyPrice || 0) - (b.defaultMonthlyPrice || 0);
        case "price-desc": return (b.defaultMonthlyPrice || 0) - (a.defaultMonthlyPrice || 0);
        case "free-first": return (a.defaultMonthlyPrice === 0 ? 0 : 1) - (b.defaultMonthlyPrice === 0 ? 0 : 1);
        default: return 0;
      }
    });
    return result;
  }, [allCatTools, search, sort, priceFilter]);

  useEffect(() => { setVisibleCount(PER_PAGE); }, [search, sort, priceFilter]);

  if (!category) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">{t("Catégorie non trouvée.", "Category not found.")}</p>
        <Link to={`${prefix}/tools`} className="mt-4 inline-block text-primary hover:underline">{t("Retour au catalogue", "Back to catalog")}</Link>
      </div>
    );
  }

  const Icon = getCategoryIcon(category.id);
  const catName = category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
  const freeCount = allCatTools.filter(t => t.defaultMonthlyPrice === 0).length;
  const avgPrice = allCatTools.filter(t => t.defaultMonthlyPrice > 0).reduce((s, t) => s + t.defaultMonthlyPrice, 0) / (allCatTools.filter(t => t.defaultMonthlyPrice > 0).length || 1);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Related categories
  const relatedCats = categories.filter(c => c.id !== category.id).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-br from-accent/60 via-background to-accent/30">
        <div className="container mx-auto max-w-6xl px-4 pb-8 pt-10 md:pt-14">
          <div className="mb-5">
            <Breadcrumb items={[
              { label: t("Outils", "Tools"), href: `${prefix}/tools` },
              { label: t(catName, category.nameEn || catName) },
            ]} />
          </div>

          <div className="flex items-start gap-4">
            <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tighter md:text-4xl">
                {t(catName, category.nameEn || catName)}
              </h1>
              {category.description && (
                <p className="mt-2 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  {t(category.description, category.descriptionEn)}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm">
              <span className="font-semibold">{allCatTools.length}</span>
              <span className="text-muted-foreground">{t("outils", "tools")}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm">
              <span className="font-semibold text-primary">{freeCount}</span>
              <span className="text-muted-foreground">{t("gratuits", "free")}</span>
            </div>
            {avgPrice > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm">
                <span className="text-muted-foreground">{t("Prix moyen", "Avg price")}</span>
                <span className="font-semibold">{Math.round(avgPrice)}€/{t("mois", "mo")}</span>
              </div>
            )}
          </div>

          {/* Search + controls */}
          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Rechercher dans cette catégorie...", "Search in this category...")}
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="all">{t("Tous les prix", "All prices")}</option>
                <option value="free">{t("Gratuit", "Free")}</option>
                <option value="freemium">Freemium</option>
                <option value="paid">{t("Payant", "Paid only")}</option>
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="name">{t("A → Z", "A → Z")}</option>
                <option value="price-asc">{t("Prix ↑", "Price ↑")}</option>
                <option value="price-desc">{t("Prix ↓", "Price ↓")}</option>
                <option value="free-first">{t("Gratuit d'abord", "Free first")}</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto max-w-6xl px-4 py-10">
        <p className="mb-4 text-sm text-muted-foreground">
          {filtered.length} {t("résultats", "results")}
          {search && ` ${t("pour", "for")} "${search}"`}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((tool) => {
            const priceBadge = tool.defaultMonthlyPrice === 0
              ? (tool.pricing?.paid ? "Freemium" : t("Gratuit", "Free"))
              : `${tool.defaultMonthlyPrice}€/${t("mois", "mo")}`;
            const badgeClass = tool.defaultMonthlyPrice === 0 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground";

            return (
              <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`}
                className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg flex flex-col">
                <div className="flex items-start gap-3">
                  <ToolLogo tool={tool} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold group-hover:text-primary truncate">{tool.name}</h3>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>{priceBadge}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                      {t(tool.shortDescription, tool.shortDescriptionEn || tool.shortDescription)}
                    </p>
                  </div>
                </div>
                {tool.pros?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                    {tool.pros.slice(0, 2).map((pro: string, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 mt-0.5 shrink-0 text-primary" /><span className="line-clamp-1">{pro}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {hasMore && (
          <div className="mt-8 text-center">
            <button onClick={() => setVisibleCount(c => c + PER_PAGE)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-secondary transition-colors">
              <ChevronDown className="h-4 w-4" />
              {t(`Afficher plus (${filtered.length - visibleCount} restants)`, `Show more (${filtered.length - visibleCount} remaining)`)}
            </button>
          </div>
        )}

        {filtered.length === 0 && (
          <p className="mt-12 text-center text-muted-foreground">{t("Aucun outil trouvé.", "No tools found.")}</p>
        )}

        {/* Related categories */}
        {relatedCats.length > 0 && (
          <div className="mt-14 border-t border-border pt-10">
            <h2 className="text-xl font-bold tracking-tighter">{t("Catégories connexes", "Related categories")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {relatedCats.map(cat => {
                const CIcon = getCategoryIcon(cat.id);
                const count = tools.filter(t => t.categoryId === cat.id).length;
                return (
                  <Link key={cat.id} to={`${prefix}/category/${cat.slug}`}
                    className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                    <div className="mb-2 inline-flex rounded-lg bg-accent p-2 text-accent-foreground"><CIcon className="h-4 w-4" /></div>
                    <p className="font-semibold group-hover:text-primary">
                      {t(cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, ""), cat.nameEn || cat.name)}
                    </p>
                    <p className="mt-1 text-xs text-primary font-medium">{count} {t("outils", "tools")} →</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default CategoryPage;
