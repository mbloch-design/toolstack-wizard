import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { Search, ExternalLink, ChevronDown, ArrowRight } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { setSeoTags, setJsonLd, setHreflang, setNoindex, cleanupSeo, SEO_BASE } from "@/lib/seo";

type SortKey = "name" | "price-asc" | "price-desc" | "free-first";
type PriceFilter = "all" | "free" | "freemium" | "paid";
const PER_PAGE = 20;

function getToolDomain(tool: any): string {
  const url = tool.websiteUrl || tool.affiliateLink;
  if (!url) return "";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

const CategoryPage = () => {
  const { lang, t, prefix } = useLang();
  const { slug } = useParams();
  const { tools } = useTools();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);
  const category = categories.find((c) => c.slug === slug);
  const allCatTools = category ? tools.filter((tool) => tool.categoryId === category.id) : [];

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PER_PAGE);

  const year = new Date().getFullYear();

  // SEO
  useEffect(() => {
    if (!category) return;
    const catName = category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
    const catNameEn = category.nameEn?.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "") || catName;
    const title = lang === "fr"
      ? `Outils ${catName} — comparatif prix et alternatives ${year} | ToolTrim`
      : `${catNameEn} tools — pricing comparison & alternatives ${year} | ToolTrim`;
    const desc = lang === "fr"
      ? `On a analysé et classé les meilleurs outils ${catName} : prix vérifiés manuellement, alternatives gratuites identifiées, sans affiliation.`
      : `We ranked the best ${catNameEn} tools with manually verified pricing, free alternatives, and zero affiliate bias.`;
    const url = `${SEO_BASE}/${lang}/category/${category.slug}`;

    if (allCatTools.length === 0) setNoindex();

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
          url: `${SEO_BASE}/${lang}/tool/${tool.slug || tool.id}`,
        })),
      },
    });
    return () => cleanupSeo(["cat-jsonld"]);
  }, [category, lang, allCatTools.length]);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = allCatTools.filter((tool) => {
      const matchSearch =
        !search ||
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.shortDescription.toLowerCase().includes(search.toLowerCase());
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
        <Link to={`${prefix}/tools`} className="mt-4 inline-block text-primary hover:underline">
          {t("Retour au catalogue", "Back to catalog")}
        </Link>
      </div>
    );
  }

  const Icon = getCategoryIcon(category.id);
  const catName = category.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
  const catNameEn = category.nameEn?.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "") || catName;
  const freeCount = allCatTools.filter((t) => t.defaultMonthlyPrice === 0).length;
  const paidTools = allCatTools.filter((t) => t.defaultMonthlyPrice > 0);
  const avgPrice = paidTools.reduce((s, t) => s + t.defaultMonthlyPrice, 0) / (paidTools.length || 1);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const relatedCats = categories.filter((c) => c.id !== category.id).slice(0, 4);

  const PRICE_LABELS: Record<PriceFilter, string> = {
    all: t("Tous", "All"),
    free: t("Gratuit", "Free"),
    freemium: "Freemium",
    paid: t("Payant", "Paid"),
  };

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "name", label: t("A → Z", "A → Z") },
    { key: "price-asc", label: t("Prix croissant", "Price ↑") },
    { key: "price-desc", label: t("Prix décroissant", "Price ↓") },
    { key: "free-first", label: t("Gratuit d'abord", "Free first") },
  ];

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden border-b border-border text-center"
        style={{ background: "hsl(var(--card))" }}
      >
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            backgroundImage: "radial-gradient(hsl(var(--border) / 0.8) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 100% 100% at 50% 0%, black 30%, transparent 90%)",
            WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 50% 0%, black 30%, transparent 90%)",
          }}
        />
        {/* Subtle glow */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background: "radial-gradient(ellipse 70% 60% at 50% -10%, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-6 py-16">
          {/* Eyebrow pill */}
          <div className="mb-6 inline-flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs"
              style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em", color: "hsl(var(--muted-foreground))" }}
            >
              <Icon className="h-3 w-3" />
              {t(catName, catNameEn)}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.6rem)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.032em",
              color: "hsl(var(--foreground))",
            }}
          >
            {t(`Meilleurs outils`, `Best`)}
            {" "}
            <span style={{ color: "hsl(var(--primary))" }}>{t(catName, catNameEn)}</span>
            <br />
            <span style={{ color: "hsl(var(--foreground) / 0.35)", fontSize: "0.65em", fontWeight: 600, letterSpacing: "-0.01em" }}>
              {t(`prix réels · alternatives testées · ${year}`, `real pricing · tested alternatives · ${year}`)}
            </span>
          </h1>

          {/* Description */}
          {category.description && (
            <p
              className="mx-auto mt-4 max-w-xl"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.95rem",
                lineHeight: 1.65,
                color: "hsl(var(--muted-foreground))",
              }}
            >
              {t(category.description, category.descriptionEn || category.description)}
            </p>
          )}

          {/* Stats pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs">
              <span className="font-semibold text-foreground">{allCatTools.length}</span>
              <span className="text-muted-foreground">{t("outils analysés", "tools analyzed")}</span>
            </span>
            {freeCount > 0 && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium"
                style={{ borderColor: "hsl(var(--primary) / 0.3)", background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}
              >
                <span className="font-semibold">{freeCount}</span>
                <span>{t("gratuits", "free")}</span>
              </span>
            )}
            {avgPrice > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs">
                <span className="text-muted-foreground">{t("Prix moyen", "Avg price")}</span>
                <span className="font-semibold text-foreground">{Math.round(avgPrice)}€/{t("mois", "mo")}</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Body: sidebar + list ── */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-start gap-8">

          {/* ── Sidebar ── */}
          <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-6 sticky top-6">

            {/* Search */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: "hsl(var(--muted-foreground) / 0.45)" }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Rechercher un outil…", "Search a tool…")}
                className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all duration-150"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--border))";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Price filter */}
            <div>
              <p className="label-section mb-3">{t("Tarification", "Pricing")}</p>
              <div className="flex flex-wrap gap-1.5">
                {(["all", "free", "freemium", "paid"] as PriceFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setPriceFilter(f)}
                    className="rounded-md border px-3 py-1.5 text-xs font-medium transition-all duration-150"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      borderColor: priceFilter === f ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border))",
                      background: priceFilter === f ? "hsl(var(--primary) / 0.1)" : "hsl(var(--card))",
                      color: priceFilter === f ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {PRICE_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="label-section mb-3">{t("Trier par", "Sort by")}</p>
              <div className="flex flex-col gap-1.5">
                {SORT_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSort(key)}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-all duration-150"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      borderColor: sort === key ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border))",
                      background: sort === key ? "hsl(var(--primary) / 0.08)" : "transparent",
                      color: sort === key ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {sort === key && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    )}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "hsl(var(--primary) / 0.2)", background: "hsl(var(--primary) / 0.05)" }}
            >
              <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {t("Vous utilisez ces outils ?", "Using these tools?")}
              </p>
              <p
                className="mt-1 text-xs"
                style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.55 }}
              >
                {t("Détectez les doublons et économisez en 3 min.", "Detect duplicates and save money in 3 min.")}
              </p>
              <Link
                to={`${prefix}/selector`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {t("Lancer l'audit", "Start audit")}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </aside>

          {/* ── Tool list ── */}
          <div className="flex-1 min-w-0">

            {/* Top bar */}
            <div className="mb-5 flex items-center justify-between gap-3">
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.68rem",
                  letterSpacing: "0.06em",
                  color: "hsl(var(--muted-foreground) / 0.5)",
                }}
              >
                {filtered.length} {t("résultats", "results")}
                {search && ` · "${search}"`}
              </p>

              {/* Mobile controls */}
              <div className="flex gap-2 lg:hidden">
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
                  className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground"
                >
                  {(["all", "free", "freemium", "paid"] as PriceFilter[]).map((f) => (
                    <option key={f} value={f}>{PRICE_LABELS[f]}</option>
                  ))}
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground"
                >
                  {SORT_OPTIONS.map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {visible.map((tool) => {
                const domain = getToolDomain(tool);
                const isFree = tool.defaultMonthlyPrice === 0 && !tool.pricing?.paid;
                const isFreemium = tool.pricing?.free && tool.pricing?.paid;
                const price = isFree
                  ? t("Gratuit", "Free")
                  : isFreemium
                  ? "Freemium"
                  : `${tool.defaultMonthlyPrice}€`;

                return (
                  <div
                    key={tool.id}
                    className="group rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
                    style={{ boxShadow: "0 1px 3px hsl(0 0% 0% / 0.06)" }}
                  >
                    <div className="flex items-start gap-4 p-5">
                      {/* Logo */}
                      <div className="shrink-0 mt-0.5">
                        <ToolLogo tool={tool} size={48} className="rounded-xl" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          {/* Name + desc */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3
                                className="font-semibold text-foreground group-hover:text-primary transition-colors"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                {tool.name}
                              </h3>
                              {(isFree || isFreemium) && (
                                <span
                                  className="inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                                  style={{
                                    fontFamily: "'DM Mono', monospace",
                                    borderColor: "hsl(var(--primary) / 0.3)",
                                    background: "hsl(var(--primary) / 0.08)",
                                    color: "hsl(var(--primary))",
                                  }}
                                >
                                  {price}
                                </span>
                              )}
                            </div>
                            <p
                              className="mt-1 text-sm line-clamp-2"
                              style={{
                                fontFamily: "'DM Sans', sans-serif",
                                lineHeight: 1.6,
                                color: "hsl(var(--muted-foreground))",
                              }}
                            >
                              {t(tool.shortDescription, tool.shortDescriptionEn || tool.shortDescription)}
                            </p>
                          </div>

                          {/* Price (paid only) */}
                          {!isFree && !isFreemium && (
                            <div className="shrink-0 text-right">
                              <span
                                className="text-lg font-bold text-foreground"
                                style={{ fontFamily: "'DM Mono', monospace" }}
                              >
                                {tool.defaultMonthlyPrice}€
                              </span>
                              <span
                                className="text-xs"
                                style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Mono', monospace" }}
                              >
                                /{t("mois", "mo")}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Bottom row: tags + CTAs */}
                        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                          {/* Pros as tags */}
                          {tool.pros?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {tool.pros.slice(0, 3).map((pro: string, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs"
                                  style={{
                                    color: "hsl(var(--muted-foreground))",
                                    fontFamily: "'DM Sans', sans-serif",
                                  }}
                                >
                                  {pro.length > 30 ? pro.slice(0, 30) + "…" : pro}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* CTAs */}
                          <div className="flex items-center gap-2 shrink-0 ml-auto">
                            <Link
                              to={`${prefix}/tool/${tool.slug || tool.id}`}
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-all duration-150 hover:border-primary/40 hover:text-primary"
                              style={{ fontFamily: "'DM Sans', sans-serif" }}
                            >
                              {t("Voir l'outil", "Learn more")}
                            </Link>
                            {domain && (
                              <a
                                href={`https://${domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150"
                                style={{
                                  background: "hsl(var(--foreground))",
                                  color: "hsl(var(--background))",
                                  fontFamily: "'DM Sans', sans-serif",
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = "hsl(var(--foreground) / 0.85)";
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = "hsl(var(--foreground))";
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {t("Visiter", "Visit")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setVisibleCount((c) => c + PER_PAGE)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <ChevronDown className="h-4 w-4" />
                  {t(
                    `Afficher plus (${filtered.length - visibleCount} restants)`,
                    `Show more (${filtered.length - visibleCount} remaining)`
                  )}
                </button>
              </div>
            )}

            {filtered.length === 0 && (
              <p
                className="mt-16 text-center text-sm"
                style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}
              >
                {t("Aucun outil trouvé.", "No tools found.")}
              </p>
            )}

            {/* Related categories */}
            {relatedCats.length > 0 && (
              <div className="mt-14 border-t border-border pt-10">
                <h2
                  className="font-display"
                  style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.025em" }}
                >
                  {t("Catégories connexes", "Related categories")}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {relatedCats.map((cat) => {
                    const CIcon = getCategoryIcon(cat.id);
                    const count = tools.filter((tool) => tool.categoryId === cat.id).length;
                    const cName = cat.name.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "");
                    return (
                      <Link
                        key={cat.id}
                        to={`${prefix}/category/${cat.slug}`}
                        className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                      >
                        <div
                          className="mb-2.5 inline-flex rounded-lg p-2"
                          style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}
                        >
                          <CIcon className="h-4 w-4" />
                        </div>
                        <p
                          className="font-semibold group-hover:text-primary transition-colors"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {t(cName, cat.nameEn || cName)}
                        </p>
                        <p
                          className="mt-1 text-xs font-medium"
                          style={{ color: "hsl(var(--primary))", fontFamily: "'DM Mono', monospace" }}
                        >
                          {count} {t("outils", "tools")} →
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
