import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { usePosts, useToolSummaries, type Post, type ToolSummary } from "@/hooks/useSupabaseData";
import { useState, useMemo, useEffect, type CSSProperties } from "react";
import { Clock, Search, X } from "lucide-react";
import { useArticleTools } from "@/hooks/useArticleTools";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, cleanupSeo } from "@/lib/seo";
import ToolLogoPile from "@/components/ToolLogoPile";
import ToolCardImage from "@/components/tool/ToolCardImage";
import { useCatalogStickyToolbar } from "@/hooks/useCatalogStickyToolbar";

/* ─────────────────────────────────────────────────────────────────────────────
   GuidesPage — editorial redesign v2
   Filtres, tri, logos outils, section "Commencer ici", load more.
───────────────────────────────────────────────────────────────────────────── */

/* ── Filter definitions ───────────────────────────────────────────────────── */
const FILTERS_FR = [
  { id: "all",       label: "Tous" },
  { id: "comparer",  label: "Comparer" },
  { id: "remplacer", label: "Remplacer" },
  { id: "couts",     label: "Réduire les coûts" },
  { id: "stack",     label: "Construire une stack" },
  { id: "ia",        label: "IA" },
  { id: "freelance", label: "Freelance" },
];
const FILTERS_EN = [
  { id: "all",       label: "All" },
  { id: "comparer",  label: "Compare" },
  { id: "remplacer", label: "Replace" },
  { id: "couts",     label: "Cut costs" },
  { id: "stack",     label: "Build a stack" },
  { id: "ia",        label: "AI" },
  { id: "freelance", label: "Freelance" },
];

const SORT_OPTIONS_FR = [
  { id: "recent",    label: "Récents" },
  { id: "selection", label: "Sélection ToolTrim" },
  { id: "short",     label: "Lecture courte" },
];
const SORT_OPTIONS_EN = [
  { id: "recent",    label: "Recent" },
  { id: "selection", label: "ToolTrim picks" },
  { id: "short",     label: "Quick read" },
];

const PAGE_SIZE = 9;

/* ── Matching helpers ─────────────────────────────────────────────────────── */
function matchesFilter(post: Post, filterId: string): boolean {
  if (filterId === "all") return true;
  const text = `${post.title ?? ""} ${post.excerpt ?? ""} ${(post.tags ?? []).join(" ")} ${post.category ?? ""}`.toLowerCase();
  switch (filterId) {
    case "comparer":
      return post.category === "Comparatifs" || text.includes("comparatif") || text.includes("vs ") || text.includes(" vs");
    case "remplacer":
      return text.includes("alternativ") || text.includes("remplacer") || text.includes("remplace") || (post.slug ?? "").includes("alternativ");
    case "couts":
      return text.includes("économie") || text.includes("gratuit") || text.includes("coût") || text.includes("tarif") || text.includes("prix") || text.includes("rentabl") || text.includes("réduire") || text.includes("payant") || text.includes("moins cher");
    case "stack":
      return text.includes("stack") || text.includes("minimaliste") || (post.slug ?? "").includes("stack");
    case "ia":
      return text.includes("ia,") || text.includes("ia ") || text.includes(" ia") || text.includes("chatgpt") || text.includes("claude") || text.includes("intelligence artificielle") || text.includes("agent ia") || text.includes("perplexity") || text.includes("gemini") || text.includes("deepseek") || (post.category ?? "").toLowerCase().includes("ia");
    case "freelance":
      return text.includes("freelance") || (post.slug ?? "").includes("freelance");
    default:
      return true;
  }
}

function parseReadTime(rt: string | undefined): number {
  if (!rt) return 99;
  const m = rt.match(/\d+/);
  return m ? parseInt(m[0], 10) : 99;
}

function sortPosts(posts: Post[], sortBy: string): Post[] {
  if (sortBy === "recent") {
    return [...posts].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }
  if (sortBy === "short") {
    return [...posts].sort((a, b) => parseReadTime(a.readTime) - parseReadTime(b.readTime));
  }
  /* "selection" = original data order (ToolTrim curation) */
  return posts;
}

function getPostType(post: Post): string {
  if (post.category === "Comparatifs") return "COMPARATIF";
  const text = `${post.title ?? ""} ${(post.tags ?? []).join(" ")} ${post.slug ?? ""}`.toLowerCase();
  if (text.includes("stack")) return "STACK";
  if (text.includes("alternativ")) return "ALTERNATIVE";
  return "GUIDE";
}

function getPostIntent(post: Post): string | null {
  if (post.category === "Comparatifs") return "COMPARER";
  const text = `${post.title ?? ""} ${post.excerpt ?? ""} ${(post.tags ?? []).join(" ")}`.toLowerCase();
  if (text.includes("vs ") || text.includes("comparatif")) return "COMPARER";
  if (text.includes("alternativ") || text.includes("remplacer")) return "REMPLACER";
  if (text.includes("gratuit") || text.includes("économie") || text.includes("tarif") || text.includes("coût") || text.includes("réduire") || text.includes("payant") || text.includes("rentabl")) return "RÉDUIRE LES COÛTS";
  // Was "STACK" — identical to getPostType's own "STACK" case, so any
  // stack guide with no other angle showed a nonsensical "STACK · STACK"
  // tag. "CONSTRUIRE" actually adds information (the reader's angle),
  // distinct from the type badge.
  if (text.includes("stack")) return "CONSTRUIRE";
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
const GuidesPage = () => {
  const { lang, t, prefix } = useLang();
  const { posts, loading } = usePosts(lang);
  const { tools } = useToolSummaries();

  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const { toolbarStuck, toolbarSentinelRef } = useCatalogStickyToolbar();

  /* Reset pagination on filter/sort change */
  useEffect(() => { setShowAll(false); }, [activeFilter, sortBy, query]);

  useEffect(() => {
    const title = lang === "fr"
      ? "Guides & Comparatifs d'outils SaaS — ToolTrim"
      : "SaaS Tool Guides & Comparisons — ToolTrim";
    const desc = lang === "fr"
      ? "Méthodes, comparatifs et stacks commentées pour construire une stack plus claire, plus utile et plus légère."
      : "Methods, comparisons and annotated stacks to build a clearer, more useful and leaner tool stack.";
    setSeoTags({
      title, description: desc,
      url: `https://tooltrim.com/${lang}/guides`,
      locale: lang === "fr" ? "fr_FR" : "en_US",
    });
    return () => cleanupSeo([]);
  }, [lang]);

  const filters = lang === "fr" ? FILTERS_FR : FILTERS_EN;
  const sortOptions = lang === "fr" ? SORT_OPTIONS_FR : SORT_OPTIONS_EN;

  /* ── Filtered + sorted posts ── */
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matched = posts.filter((post) => {
      if (!matchesFilter(post, activeFilter)) return false;
      if (!normalizedQuery) return true;
      return `${post.title} ${post.excerpt} ${post.category} ${(post.tags || []).join(" ")}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
    return sortPosts(matched, sortBy);
  }, [posts, activeFilter, sortBy, query]);

  const listPosts   = filteredPosts;
  const visibleList = showAll ? listPosts : listPosts.slice(0, PAGE_SIZE);
  const hasMore     = !showAll && listPosts.length > PAGE_SIZE;

  return (
    <div className="tt-catalog-page min-h-screen" style={{ "--page-accent": "#20E38C" } as CSSProperties}>

      {/* ══ Top — same compact header + grid as the Outils catalog page
          (breadcrumb + slim title, then the filter bar), so Guides shares
          the exact neutral spacing/rhythm of the other catalog pages. ══ */}
      <div id="guides">
        <div className="gi-container tt-catalog-container">

          <div className="tt-catalog-compact-header">
            <Breadcrumb items={[{ label: t("Guides", "Guides") }]} />
            <h1 className="tt-catalog-compact-title">
              {t("Mieux choisir ses outils.", "Choose tools with less noise.")}
            </h1>
            <p className="gi-catalog-intro">
              {t(
                "Guides pratiques, comparatifs honnêtes et méthodes concrètes pour construire une stack plus légère.",
                "Practical guides, honest comparisons and concrete methods for a leaner tool stack.",
              )}
            </p>
          </div>

          <div ref={toolbarSentinelRef} aria-hidden="true" style={{ height: 1 }} />

          <div className="gi-topic-nav" aria-label={t("Filtrer les guides par thème", "Filter guides by topic") as string}>
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`gi-topic-tag${activeFilter === filter.id ? " gi-topic-tag--active" : ""}`}
                aria-pressed={activeFilter === filter.id}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className={`tt-catalog-toolbar tt-sticky-toolbar${toolbarStuck ? " tt-sticky-toolbar--stuck" : ""}`}>
            <div className="gi-search-field">
              <Search size={17} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Rechercher un guide", "Search guides") as string}
                aria-label={t("Rechercher un guide", "Search guides") as string}
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label={t("Effacer la recherche", "Clear search") as string}>
                  <X size={15} aria-hidden />
                </button>
              )}
            </div>
            <div className="tt-catalog-toolbar-meta">
              <span>{filteredPosts.length} {t("guides", "guides")}</span>
              <select
                className="tt-catalog-sort-select"
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setShowAll(false); }}
                aria-label={t("Trier par", "Sort by") as string}
              >
                {sortOptions.map(o => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Guides list */}
          {loading && <LoadingSkeleton />}

          {!loading && filteredPosts.length === 0 && (
            <div style={{ paddingTop: 48, textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 16, color: "var(--color-muted-light)" }}>
                {t("Aucun guide pour ce filtre.", "No guides for this filter.")}
              </p>
              <button
                onClick={() => setActiveFilter("all")}
                style={{ marginTop: 16, fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500, color: "var(--color-text)", cursor: "pointer", background: "none", border: "none", textDecoration: "underline" }}
              >
                {t("Voir tous les guides", "See all guides")}
              </button>
            </div>
          )}

          {!loading && visibleList.length > 0 && (
            <>
              <ArticleCard post={visibleList[0]} prefix={prefix} lang={lang} tools={tools} featured />
              {visibleList.length > 1 && (
                <div className="gi-card-grid">
                  {visibleList.slice(1).map((post) => (
                    <ArticleCard key={post.slug} post={post} prefix={prefix} lang={lang} tools={tools} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Load more */}
          {!loading && hasMore && (
            <div style={{ paddingTop: 40, display: "flex", justifyContent: "center" }}>
              <button
                className="gi-load-more"
                onClick={() => setShowAll(true)}
              >
                {t(
                  `Afficher plus de guides (${listPosts.length - PAGE_SIZE} restants)`,
                  `Show more guides (${listPosts.length - PAGE_SIZE} remaining)`,
                )}
              </button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

function ArticleCard({
  post, prefix, lang, tools, featured = false,
}: {
  post: Post; prefix: string; lang: string; tools: ToolSummary[]; featured?: boolean;
}) {
  const mentionedTools = useArticleTools(post, tools);
  const type   = getPostType(post);
  const intent = getPostIntent(post);
  const coverTool = mentionedTools.find((tool) => tool.ogImageUrl) || mentionedTools[0];

  return (
    <Link to={`${prefix}/guide/${post.slug}`} className={`gi-card${featured ? " gi-card--featured" : ""}`}>
      <div className="gi-card-media">
        {coverTool ? (
          <ToolCardImage tool={coverTool} logoSize={featured ? 54 : 42} className="gi-card-cover" />
        ) : (
          <div className="gi-card-cover-fallback">{type}</div>
        )}
      </div>
      <div className="gi-card-body">
        <span className="gi-card-kicker">{intent && intent !== type ? `${type} · ${intent}` : type}</span>
        <h3 className="gi-card-title">{post.title}</h3>
        {post.excerpt && <p className="gi-card-excerpt">{post.excerpt}</p>}
        <div className="gi-card-meta">
          {mentionedTools.length > 0 && (
            <ToolLogoPile
              tools={mentionedTools}
              max={4}
              ariaLabel={lang === "fr" ? "Outils cités" : "Tools cited"}
              moreLabel={(count) => lang === "fr" ? `${count} outils supplémentaires` : `${count} more tools`}
            />
          )}
          {post.readTime && (
            <span>
              <Clock size={13} aria-hidden />
              {post.readTime}
            </span>
          )}
          <span className="gi-card-read">
            {lang === "fr" ? "Lire le guide" : "Read guide"} <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Loading skeleton ─────────────────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 24 }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "150px 1fr auto",
          gap: 32, padding: "32px 0", borderTop: i > 1 ? "1px solid var(--color-border)" : "none",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ height: 12, background: "var(--color-surface-soft)", borderRadius: "var(--radius-xs)", width: 64 }} />
            <div style={{ height: 12, background: "var(--color-surface-soft)", borderRadius: "var(--radius-xs)", width: 88 }} />
          </div>
          <div>
            <div style={{ height: 28, background: "var(--color-surface-soft)", borderRadius: "var(--radius-xs)", marginBottom: 10, maxWidth: 480 }} />
            <div style={{ height: 14, background: "var(--color-surface-soft)", borderRadius: "var(--radius-xs)", maxWidth: 600 }} />
          </div>
          <div style={{ height: 14, background: "var(--color-surface-soft)", borderRadius: "var(--radius-xs)", width: 40 }} />
        </div>
      ))}
    </div>
  );
}

export default GuidesPage;
