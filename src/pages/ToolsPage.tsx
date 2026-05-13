import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, useCategories } from "@/hooks/useSupabaseData";
import { Search, X, TrendingUp, Zap } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import ToolLogo from "@/components/ToolLogo";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import type { Tool } from "@/data/types";

const TOOLS_PER_PAGE = 60;

// Tools with strong editorial prescription = "Trending"
function isTrending(tool: Tool) {
  return tool.prescription_quality === "ferme" || tool.prescription_quality === "oui";
}

const ToolsPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools } = useTools();
  const { categories } = useCategories();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(TOOLS_PER_PAGE);

  // SEO
  useEffect(() => {
    const title = lang === "fr"
      ? `Comparateur SaaS — ${tools.length} outils avec prix réels et alternatives | ToolTrim`
      : `SaaS Comparison — ${tools.length} tools with real pricing & alternatives | ToolTrim`;
    const desc = lang === "fr"
      ? `Abonnements trop chers, outils en doublon, alternatives gratuites ignorées — on a tout vérifié. ${tools.length} outils SaaS analysés indépendamment.`
      : `Overpriced subscriptions, duplicate tools, free alternatives you're missing — we checked everything. ${tools.length} SaaS tools reviewed independently.`;
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

  // Sorted categories (by tool count desc)
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const countA = tools.filter(t => t.categoryId === a.id).length;
      const countB = tools.filter(t => t.categoryId === b.id).length;
      return countB - countA;
    });
  }, [categories, tools]);

  // Filtered tools
  const filtered = useMemo(() => {
    return tools.filter((tool) => {
      const matchSearch = !search ||
        (tool.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (tool.shortDescription ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCat = !selectedCategory || tool.categoryId === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [tools, search, selectedCategory]);

  // Reset pagination on filter change
  useEffect(() => { setVisibleCount(TOOLS_PER_PAGE); }, [search, selectedCategory]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const selectedCatObj = selectedCategory
    ? categories.find(c => c.id === selectedCategory)
    : null;

  const getCatLabel = (cat: typeof categories[0]) =>
    t(stripLeadingEmoji(cat.name, cat.id), stripLeadingEmoji(cat.nameEn, stripLeadingEmoji(cat.name, cat.id)));

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "hsl(var(--card))" }}
      >
        {/* Dot grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            backgroundImage: "radial-gradient(hsl(var(--border) / 0.7) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, black 30%, transparent 80%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 py-14 text-center">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: "hsl(var(--primary) / 0.25)",
              background: "hsl(var(--primary) / 0.06)",
              color: "hsl(var(--primary))",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            <Zap className="h-3 w-3" />
            {t(`${tools.length} outils · ${categories.length} catégories`, `${tools.length} tools · ${categories.length} categories`)}
          </div>

          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1.08,
              color: "hsl(var(--foreground))",
            }}
          >
            {t(
              <>Trouvez les bons outils<br /><span style={{ color: "hsl(var(--primary))" }}>pour votre stack</span></>,
              <>Find the right tools<br /><span style={{ color: "hsl(var(--primary))" }}>for your stack</span></>
            )}
          </h1>

          <p
            className="mx-auto mt-4 max-w-xl text-base leading-7"
            style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Sans', sans-serif" }}
          >
            {t(
              "Prix vérifiés, alternatives visibles, verdicts honnêtes. Aucun outil mis en avant pour une commission.",
              "Verified pricing, visible alternatives, honest verdicts. No tool promoted for a commission."
            )}
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div
              className="relative flex items-center rounded-2xl border shadow-lg"
              style={{
                background: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
                boxShadow: "0 4px 24px hsl(var(--foreground) / 0.06)",
              }}
            >
              <Search
                className="pointer-events-none absolute left-5 h-5 w-5"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Rechercher un outil ou une catégorie…", "Search a tool or category…")}
                className="h-14 w-full rounded-2xl border-0 bg-transparent pl-13 pr-12 text-base font-medium outline-none placeholder:text-muted-foreground"
                style={{
                  paddingLeft: "3.25rem",
                  color: "hsl(var(--foreground))",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-4 flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-secondary"
                  aria-label={t("Effacer", "Clear")}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY TABS ── */}
      <div
        className="sticky top-0 z-20 border-b border-border"
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div
            className="flex items-center gap-1 overflow-x-auto py-3"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* All tab */}
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                background: !selectedCategory ? "hsl(var(--primary))" : "transparent",
                color: !selectedCategory ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
              }}
            >
              {t("Tous", "All")}
              <span
                className="ml-2 text-xs"
                style={{
                  opacity: !selectedCategory ? 0.75 : 0.5,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {tools.length}
              </span>
            </button>

            {sortedCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.id);
              const count = tools.filter(tt => tt.categoryId === cat.id).length;
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(active ? null : cat.id)}
                  className="relative shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                  style={{
                    background: active ? "hsl(var(--primary))" : "transparent",
                    color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "hsl(var(--secondary))";
                    if (!active) (e.currentTarget as HTMLElement).style.color = "hsl(var(--foreground))";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                    if (!active) (e.currentTarget as HTMLElement).style.color = "hsl(var(--muted-foreground))";
                  }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {getCatLabel(cat)}
                  <span
                    className="text-xs"
                    style={{
                      opacity: active ? 0.75 : 0.5,
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <main className="mx-auto max-w-7xl px-4 py-8">

        {/* Results header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            {selectedCatObj ? (
              <h2
                className="font-display font-bold"
                style={{ fontSize: "1.25rem", letterSpacing: "-0.025em", color: "hsl(var(--foreground))" }}
              >
                {getCatLabel(selectedCatObj)}
              </h2>
            ) : search ? (
              <h2
                className="font-display font-bold"
                style={{ fontSize: "1.25rem", letterSpacing: "-0.025em", color: "hsl(var(--foreground))" }}
              >
                {t(`Résultats pour "${search}"`, `Results for "${search}"`)}
              </h2>
            ) : (
              <h2
                className="font-display font-bold"
                style={{ fontSize: "1.25rem", letterSpacing: "-0.025em", color: "hsl(var(--foreground))" }}
              >
                {t("Tous les outils", "All tools")}
              </h2>
            )}
            <p
              className="mt-0.5 text-sm"
              style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'DM Mono', monospace" }}
            >
              {filtered.length} {t("outils", "tools")}
            </p>
          </div>

          {(search || selectedCategory) && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSelectedCategory(null); }}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/30 hover:text-primary"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
            >
              <X className="h-3 w-3" />
              {t("Réinitialiser", "Reset")}
            </button>
          )}
        </div>

        {/* Tool grid */}
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            <Search className="mx-auto h-10 w-10" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }} />
            <p
              className="mt-4 font-semibold"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {t("Aucun outil trouvé", "No tools found")}
            </p>
            <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              {t("Essaie une autre recherche ou catégorie", "Try a different search or category")}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((tool) => (
              <AppCard key={tool.id} tool={tool} prefix={prefix} t={t} />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount(c => c + TOOLS_PER_PAGE)}
              className="rounded-full border px-8 py-3 text-sm font-semibold transition-all hover:border-primary/30 hover:text-primary"
              style={{
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--muted-foreground))",
                background: "hsl(var(--background))",
              }}
            >
              {t(`Afficher plus — ${filtered.length - visibleCount} restants`, `Show more — ${filtered.length - visibleCount} remaining`)}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

// ── App Card (Webflow Apps style) ──────────────────────────────────────────

function AppCard({ tool, prefix, t }: {
  tool: Tool;
  prefix: string;
  t: (fr: string | React.ReactNode, en: string | React.ReactNode) => string | React.ReactNode;
}) {
  const trending = isTrending(tool);

  const priceLabel = tool.defaultMonthlyPrice === 0
    ? (tool.pricing?.paid ? "Freemium" : t("Gratuit", "Free"))
    : `${tool.defaultMonthlyPrice}€/${t("mois", "mo")}`;

  const isFree = tool.defaultMonthlyPrice === 0;

  return (
    <Link
      to={`${prefix}/tool/${tool.slug || tool.id}`}
      className="group relative flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-150 hover:shadow-md"
      style={{
        borderColor: "hsl(var(--border))",
        background: "hsl(var(--card))",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.3)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px hsl(var(--foreground) / 0.07)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Trending badge */}
      {trending && (
        <span
          className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            background: "hsl(var(--primary) / 0.1)",
            color: "hsl(var(--primary))",
          }}
        >
          <TrendingUp className="h-2.5 w-2.5" />
          {t("Recommandé", "Top pick")}
        </span>
      )}

      {/* Logo + name row */}
      <div className="flex items-center gap-3">
        <ToolLogo tool={tool} size={48} className="rounded-xl shrink-0" />
        <div className="min-w-0">
          <h3
            className="truncate font-semibold leading-tight transition-colors group-hover:text-primary"
            style={{
              fontSize: "0.9rem",
              color: "hsl(var(--foreground))",
              letterSpacing: "-0.015em",
            }}
          >
            {tool.name}
          </h3>
          <span
            className="mt-0.5 inline-block text-xs font-semibold"
            style={{
              color: isFree ? "hsl(var(--keep))" : "hsl(var(--muted-foreground))",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {priceLabel as string}
          </span>
        </div>
      </div>

      {/* Description */}
      <p
        className="line-clamp-2 text-xs leading-5"
        style={{
          color: "hsl(var(--muted-foreground))",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {t(tool.shortDescription, (tool as any).shortDescriptionEn || tool.shortDescription) as string}
      </p>
    </Link>
  );
}

// Needed for JSX in t() calls
import React from "react";

export default ToolsPage;
