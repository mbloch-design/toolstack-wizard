import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Search, Hash, BookOpen, Wrench, ArrowRight, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, usePosts } from "@/hooks/useSupabaseData";
import ToolCardCompact from "@/components/tool/ToolCardCompact";
import { getExplorerHref } from "@/lib/toolExploration";

/* ────────────────────────────────────────────────────────────
   Types & constants
──────────────────────────────────────────────────────────── */
type Tab = "all" | "tools" | "categories" | "guides";

/* ────────────────────────────────────────────────────────────
   SearchPage
──────────────────────────────────────────────────────────── */
const SearchPage = () => {
  const { t, prefix, lang } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [inputValue, setInputValue] = useState(initialQ);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);

  /* Sync input → URL (debounced) */
  useEffect(() => {
    const id = setTimeout(() => {
      const q = inputValue.trim();
      const current = searchParams.get("q") ?? "";
      if (q !== current) {
        navigate(`?q=${encodeURIComponent(q)}`, { replace: true });
      }
    }, 300);
    return () => clearTimeout(id);
  }, [inputValue, navigate, searchParams]);

  /* Sync URL → input (on back/forward) */
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    if (q !== inputValue) setInputValue(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* Reset tab when query changes */
  useEffect(() => setActiveTab("all"), [inputValue]);

  /* Focus input on mount */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const query = inputValue.trim().toLowerCase();

  /* Results */
  const toolResults = useMemo(() => {
    if (query.length < 2) return [];
    return tools.filter(tool =>
      (tool.name ?? "").toLowerCase().includes(query) ||
      (tool.slug || tool.id || "").toLowerCase().includes(query) ||
      (tool.shortDescription ?? "").toLowerCase().includes(query) ||
      (tool.shortDescriptionEn ?? "").toLowerCase().includes(query)
    );
  }, [query, tools]);

  const catResults = useMemo(() => {
    if (query.length < 2) return [];
    return categories.filter(c =>
      (c.name ?? "").toLowerCase().includes(query) ||
      (c.nameEn ?? "").toLowerCase().includes(query) ||
      (c.description ?? "").toLowerCase().includes(query) ||
      (c.descriptionEn ?? "").toLowerCase().includes(query)
    );
  }, [query, categories]);

  const guideResults = useMemo(() => {
    if (query.length < 2) return [];
    return posts.filter(p =>
      (p.title ?? "").toLowerCase().includes(query) ||
      (p.excerpt ?? "").toLowerCase().includes(query) ||
      (p.tags ?? []).some((tag: string) => tag.toLowerCase().includes(query))
    );
  }, [query, posts]);

  const totalCount = toolResults.length + catResults.length + guideResults.length;

  const tabs: { id: Tab; label: string; count: number }[] = ([
    { id: "all",        label: t("Tous", "All"),              count: totalCount },
    { id: "tools",      label: t("Outils", "Tools"),          count: toolResults.length },
    { id: "categories", label: t("Catégories", "Categories"), count: catResults.length },
    { id: "guides",     label: t("Guides", "Guides"),         count: guideResults.length },
  ] as { id: Tab; label: string; count: number }[])
    .filter(tab => tab.id === "all" || tab.count > 0);

  const showTools      = activeTab === "all" || activeTab === "tools";
  const showCategories = activeTab === "all" || activeTab === "categories";
  const showGuides     = activeTab === "all" || activeTab === "guides";

  return (
    <div className="sp-page">

      {/* Search input */}
      <div className="sp-search-field">
        <Search
          className="sp-search-icon"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={t(
            "Rechercher un outil, une catégorie, un guide…",
            "Search for a tool, category, guide…"
          )}
          className="sp-search-input"
          autoComplete="off"
          spellCheck={false}
        />
        {inputValue && (
          <button
            onClick={() => { setInputValue(""); inputRef.current?.focus(); }}
            className="sp-search-clear"
            aria-label={t("Effacer", "Clear")}
          >
            <X size={16} aria-hidden />
          </button>
        )}
      </div>

      {/* Query too short */}
      {inputValue.trim().length > 0 && inputValue.trim().length < 2 && (
        <p className="sp-query-hint">
          {t("Tapez au moins 2 caractères…", "Type at least 2 characters…")}
        </p>
      )}

      {/* Empty query — suggestions */}
      {inputValue.trim().length === 0 && (
        <div className="sp-empty-query">
          <p>
            {t("Que cherchez-vous ?", "What are you looking for?")}
          </p>
          <div className="sp-suggestions">
            {["Notion", "Figma", "Slack", "Zapier", "HubSpot", "Linear", "CRM", "Design"].map(s => (
              <button
                key={s}
                onClick={() => setInputValue(s)}
                className="sp-suggestion"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {query.length >= 2 && (
        <>
          {/* Header */}
          <div className="sp-results-header">
            <p>
              {totalCount > 0 ? (
                <>
                  <strong>{totalCount}</strong>{" "}
                  {t(`résultat${totalCount > 1 ? "s" : ""} pour`, `result${totalCount > 1 ? "s" : ""} for`)}{" "}
                  <strong>"{inputValue.trim()}"</strong>
                </>
              ) : (
                <>
                  {t(`Aucun résultat pour`, `No results for`)}{" "}
                  <strong>"{inputValue.trim()}"</strong>
                </>
              )}
            </p>
          </div>

          {/* Tabs */}
          {totalCount > 0 && tabs.length > 2 && (
            <div className="sp-tabs" role="tablist" aria-label={t("Types de résultats", "Result types")}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`sp-tab${activeTab === tab.id ? " is-active" : ""}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                >
                  {tab.label}
                  <span
                    className="sp-tab-count"
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {totalCount === 0 ? (
            /* No results */
            <div className="sp-no-results">
              <Search size={32} aria-hidden />
              <p className="sp-no-results-title">
                {t("Aucun résultat", "No results")}
              </p>
              <p className="sp-no-results-copy">
                {t(
                  "Essayez un autre terme ou explorez le catalogue complet.",
                  "Try a different term or browse the full catalog."
                )}
              </p>
              <Link
                to={`${prefix}/tools`}
                className="sp-no-results-link"
              >
                {t("Voir tous les outils", "Browse all tools")}
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          ) : (
            <div className="sp-result-groups">

              {/* Tools */}
              {showTools && toolResults.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<Wrench className="h-4 w-4" />}
                    label={t("Outils", "Tools")}
                    count={toolResults.length}
                    showAll={activeTab === "all" && toolResults.length > 5}
                    onShowAll={() => setActiveTab("tools")}
                    t={t}
                  />
                  <div className="sp-tool-results">
                    {(activeTab === "all" ? toolResults.slice(0, 5) : toolResults).map(tool => (
                      <ToolCardCompact
                        key={tool.id}
                        tool={tool}
                        prefix={prefix}
                        lang={lang}
                        t={t}
                        exploreHref={getExplorerHref(prefix, { type: "outil", slug: tool.slug || tool.id })}
                        exploreState={{ explorerCanGoBack: true, previousSourceLabel: t("Recherche", "Search") }}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Categories */}
              {showCategories && catResults.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<Hash className="h-4 w-4" />}
                    label={t("Catégories", "Categories")}
                    count={catResults.length}
                    showAll={activeTab === "all" && catResults.length > 4}
                    onShowAll={() => setActiveTab("categories")}
                    t={t}
                  />
                  <div className="sp-category-results">
                    {(activeTab === "all" ? catResults.slice(0, 4) : catResults).map(cat => (
                      <CategoryCard key={cat.id} cat={cat} prefix={prefix} lang={lang} />
                    ))}
                  </div>
                </section>
              )}

              {/* Guides */}
              {showGuides && guideResults.length > 0 && (
                <section>
                  <SectionHeader
                    icon={<BookOpen className="h-4 w-4" />}
                    label={t("Guides", "Guides")}
                    count={guideResults.length}
                    showAll={activeTab === "all" && guideResults.length > 3}
                    onShowAll={() => setActiveTab("guides")}
                    t={t}
                  />
                  <div className="sp-guide-results">
                    {(activeTab === "all" ? guideResults.slice(0, 3) : guideResults).map(post => (
                      <GuideCard key={post.id} post={post} prefix={prefix} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Cards
──────────────────────────────────────────────────────────── */

function SectionHeader({
  icon, label, count, showAll, onShowAll, t,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  showAll: boolean;
  onShowAll: () => void;
  t: (fr: string, en: string) => string;
}) {
  return (
    <div className="sp-section-header">
      <div className="sp-section-title">
        <span>{icon}</span>
        {label}
        <span className="sp-section-count">
          {count}
        </span>
      </div>
      {showAll && (
        <button
          onClick={onShowAll}
          className="sp-section-more"
        >
          {t("Voir tout →", "See all →")}
        </button>
      )}
    </div>
  );
}

function CategoryCard({ cat, prefix, lang }: { cat: any; prefix: string; lang: string }) {
  const name = lang === "en" ? (cat.nameEn || cat.name) : cat.name;
  const desc = lang === "en" ? (cat.descriptionEn || cat.description) : cat.description;

  return (
    <Link
      to={`${prefix}/category/${cat.slug}`}
      className="sp-category-card"
    >
      <div className="sp-result-icon">
        <Hash size={16} aria-hidden />
      </div>
      <div className="sp-result-copy">
        <p className="sp-result-name">{name}</p>
        {desc && (
          <p className="sp-result-description">{desc}</p>
        )}
      </div>
      <ArrowRight className="sp-result-arrow" size={14} aria-hidden />
    </Link>
  );
}

function GuideCard({ post, prefix }: { post: any; prefix: string }) {
  return (
    <Link
      to={`${prefix}/guide/${post.slug}`}
      className="sp-guide-card"
    >
      <div className="sp-result-icon">
        <BookOpen size={16} aria-hidden />
      </div>
      <div className="sp-result-copy">
        <p className="sp-result-name">{post.title}</p>
        {post.excerpt && (
          <p className="sp-guide-excerpt">
            {post.excerpt}
          </p>
        )}
        {post.readTime && (
          <p className="sp-guide-meta">{post.readTime}</p>
        )}
      </div>
      <ArrowRight className="sp-result-arrow" size={14} aria-hidden />
    </Link>
  );
}

export default SearchPage;
