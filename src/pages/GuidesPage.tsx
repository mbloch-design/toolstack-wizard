import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { loadLocalPosts, usePosts, useToolSummaries, type Post, type ToolSummary } from "@/hooks/useSupabaseData";
import { useState, useMemo, useEffect, useRef, type CSSProperties } from "react";
import { ArrowUpDown, Search, X } from "@/lib/icons";
import { useArticleTools } from "@/hooks/useArticleTools";
import { setSeoTags, cleanupSeo } from "@/lib/seo";
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
const ENGLISH_PARITY_START_DATE = "2026-05-01";

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
  if (post.category === "Stories") return "STORY";
  if (post.category === "Comparatifs") return "COMPARATIF";
  const text = `${post.title ?? ""} ${(post.tags ?? []).join(" ")} ${post.slug ?? ""}`.toLowerCase();
  if (text.includes("stack")) return "STACK";
  if (text.includes("alternativ")) return "ALTERNATIVE";
  return "GUIDE";
}

function formatPostDate(date: string | undefined, lang: string): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
const GuidesPage = () => {
  const { lang, t, prefix } = useLang();
  const { posts, loading } = usePosts(lang);
  const { tools } = useToolSummaries();
  const [localeFallbackPosts, setLocaleFallbackPosts] = useState<Post[]>([]);

  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toolbarStuck, toolbarSentinelRef } = useCatalogStickyToolbar();

  /* Reset pagination on filter/sort change */
  useEffect(() => { setShowAll(false); }, [activeFilter, sortBy, query]);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    let cancelled = false;
    if (lang !== "en") {
      setLocaleFallbackPosts([]);
      return () => { cancelled = true; };
    }

    loadLocalPosts("fr").then((frenchPosts) => {
      if (!cancelled) setLocaleFallbackPosts(frenchPosts);
    });
    return () => { cancelled = true; };
  }, [lang]);

  const visiblePosts = useMemo(() => {
    if (lang !== "en" || posts.length === 0) return posts;
    const englishSlugs = new Set(posts.map((post) => post.slug));
    const frenchOnly = localeFallbackPosts.filter((post) => (
      (post.date || "") >= ENGLISH_PARITY_START_DATE && !englishSlugs.has(post.slug)
    ));
    return [...posts, ...frenchOnly];
  }, [lang, posts, localeFallbackPosts]);

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
  const storiesPosts = useMemo(
    () => visiblePosts
      .filter((post) => post.category === "Stories")
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
    [visiblePosts],
  );

  /* ── Filtered + sorted posts ── */
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matched = visiblePosts.filter((post) => {
      if (post.category === "Stories") return false;
      if (!matchesFilter(post, activeFilter)) return false;
      if (!normalizedQuery) return true;
      return `${post.title} ${post.excerpt} ${post.category} ${(post.tags || []).join(" ")}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
    return sortPosts(matched, sortBy);
  }, [visiblePosts, activeFilter, sortBy, query]);

  const listPosts   = filteredPosts;
  const visibleList = showAll ? listPosts : listPosts.slice(0, PAGE_SIZE);
  const hasMore     = !showAll && listPosts.length > PAGE_SIZE;

  return (
    <div className="tt-catalog-page min-h-screen" style={{ "--page-accent": "#20E38C" } as CSSProperties}>

      {/* ══ Top — same title + command line as the other catalogues. ══ */}
      <div id="guides">
        <div className="gi-container tt-catalog-container">

          <div className="tt-catalog-compact-header">
            <h1 className="tt-catalog-compact-title">{t("Guides", "Guides")}</h1>
          </div>

          <div ref={toolbarSentinelRef} aria-hidden="true" style={{ height: 1 }} />

          <div className={`tt-catalog-toolbar tt-sticky-toolbar${toolbarStuck ? " tt-sticky-toolbar--stuck" : ""}`}>
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
            <div className={`tt-catalog-inline-search${isSearchOpen || query ? " tt-catalog-inline-search--open" : ""}`}>
              {isSearchOpen || query ? (
                <div className="tt-catalog-inline-search-field">
                  <Search size={17} aria-hidden />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onBlur={() => {
                      if (!query) setIsSearchOpen(false);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setQuery("");
                        setIsSearchOpen(false);
                      }
                    }}
                    placeholder={t("Rechercher un guide", "Search guides") as string}
                    aria-label={t("Rechercher un guide", "Search guides") as string}
                    className="tt-catalog-inline-search-input"
                  />
                  <button
                    type="button"
                    className="tt-catalog-inline-search-clear"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setQuery("");
                      setIsSearchOpen(false);
                    }}
                    aria-label={t("Fermer la recherche", "Close search") as string}
                  >
                    <X size={15} aria-hidden />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="tt-catalog-inline-search-button"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label={t("Rechercher un guide", "Search guides") as string}
                  aria-expanded="false"
                >
                  <Search size={17} aria-hidden />
                  <span>{t("Rechercher", "Search")}</span>
                </button>
              )}
            </div>
            <div className="tt-catalog-toolbar-meta">
              <label className="tt-catalog-sort-control" title={t("Trier les guides", "Sort guides") as string}>
                <ArrowUpDown size={18} aria-hidden />
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
              </label>
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
              <div className="gi-lead-grid">
                <ArticleCard post={visibleList[0]} prefix={prefix} lang={lang} tools={tools} featured />
                {visibleList.length > 1 && (
                  <div className="gi-lead-side">
                    {visibleList.slice(1, 3).map((post) => (
                      <ArticleCard key={post.slug} post={post} prefix={prefix} lang={lang} tools={tools} compact />
                    ))}
                  </div>
                )}
              </div>
              {visibleList.length > 3 && (
                <div className="gi-card-grid">
                  {visibleList.slice(3).map((post) => (
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

          {!loading && storiesPosts.length > 0 && (
            <StoriesRow stories={storiesPosts.slice(0, 3)} prefix={prefix} lang={lang} />
          )}

        </div>
      </div>

    </div>
  );
};

function StoriesRow({
  stories, prefix, lang,
}: {
  stories: Post[]; prefix: string; lang: string;
}) {
  const firstStory = stories[0];
  const storyPath = (story: Post) => `/${story.lang === "fr" ? "fr" : lang}/guide/${story.slug}`;

  return (
    <section className="gi-stories-row" aria-labelledby="guides-stories-title">
      <div className="gi-stories-row-header">
        <h2 id="guides-stories-title">{lang === "fr" ? "Stories" : "Stories"}</h2>
        <Link to={storyPath(firstStory)}>
          {lang === "fr" ? "Tout voir" : "View all"}
        </Link>
      </div>

      <div className="gi-stories-grid">
        {stories.map((story) => (
          <Link key={story.slug} to={storyPath(story)} className="gi-story-tile">
            <div className="gi-story-tile-media">
              <img src={story.thumbnail} alt="" loading="lazy" decoding="async" />
            </div>
            <h3>{story.title}</h3>
            {lang === "en" && story.lang === "fr" && <span className="gi-language-badge">FR</span>}
            <p>{formatPostDate(story.date, lang)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ArticleCard({
  post, prefix, lang, tools, featured = false, compact = false,
}: {
  post: Post; prefix: string; lang: string; tools: ToolSummary[]; featured?: boolean; compact?: boolean;
}) {
  const mentionedTools = useArticleTools(post, tools);
  const type   = getPostType(post);
  const primaryTool = post.toolId
    ? tools.find((tool) => tool.id === post.toolId || tool.slug === post.toolId)
    : undefined;
  const coverTool = (primaryTool?.ogImageUrl ? primaryTool : undefined)
    || mentionedTools.find((tool) => tool.ogImageUrl)
    || primaryTool
    || mentionedTools[0];
  const displayDate = formatPostDate(post.date, lang);
  const postPath = `/${post.lang === "fr" ? "fr" : lang}/guide/${post.slug}`;

  return (
    <Link
      to={postPath}
      className={`gi-card${featured ? " gi-card--featured" : ""}${compact ? " gi-card--compact" : ""}`}
    >
      <div className="gi-card-media">
        {post.thumbnail ? (
          <img
            src={post.thumbnail}
            alt={`${post.title} — illustration`}
            className="gi-card-editorial-cover"
            loading={featured ? "eager" : "lazy"}
            decoding="async"
          />
        ) : coverTool ? (
          <ToolCardImage tool={coverTool} logoSize={featured ? 54 : compact ? 34 : 42} className="gi-card-cover" />
        ) : (
          <div className="gi-card-cover-fallback">{type}</div>
        )}
      </div>
      <div className="gi-card-body">
        <h3 className="gi-card-title">{post.title}</h3>
        {lang === "en" && post.lang === "fr" && (
          <span className="gi-language-badge">Available in French</span>
        )}
        {displayDate && (
          <div className="gi-card-meta">
            <time dateTime={post.date}>{displayDate}</time>
          </div>
        )}
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
