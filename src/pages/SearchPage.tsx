import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Search, Hash, BookOpen, Wrench, ArrowRight, Compass, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, usePosts } from "@/hooks/useSupabaseData";
import ToolLogo from "@/components/ToolLogo";
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
    <div className="mx-auto max-w-3xl px-4 py-12">

      {/* Search input */}
      <div className="relative mb-8">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
          style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}
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
          className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-12 text-base font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground/50 outline-none transition-all duration-150 focus:ring-2 focus:ring-primary/20"
          style={{ borderColor: "hsl(var(--border))" }}
          onFocus={e => {
            e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.5)";
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = "hsl(var(--border))";
          }}
          autoComplete="off"
          spellCheck={false}
        />
        {inputValue && (
          <button
            onClick={() => { setInputValue(""); inputRef.current?.focus(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors hover:bg-secondary"
            aria-label={t("Effacer", "Clear")}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Query too short */}
      {inputValue.trim().length > 0 && inputValue.trim().length < 2 && (
        <p className="text-center text-sm text-muted-foreground">
          {t("Tapez au moins 2 caractères…", "Type at least 2 characters…")}
        </p>
      )}

      {/* Empty query — suggestions */}
      {inputValue.trim().length === 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            {t("Que cherchez-vous ?", "What are you looking for?")}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Notion", "Figma", "Slack", "Zapier", "HubSpot", "Linear", "CRM", "Design"].map(s => (
              <button
                key={s}
                onClick={() => setInputValue(s)}
                className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
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
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalCount > 0 ? (
                <>
                  <span className="font-semibold text-foreground">{totalCount}</span>{" "}
                  {t(`résultat${totalCount > 1 ? "s" : ""} pour`, `result${totalCount > 1 ? "s" : ""} for`)}{" "}
                  <span className="font-semibold text-foreground">"{inputValue.trim()}"</span>
                </>
              ) : (
                <>
                  {t(`Aucun résultat pour`, `No results for`)}{" "}
                  <span className="font-semibold text-foreground">"{inputValue.trim()}"</span>
                </>
              )}
            </p>
          </div>

          {/* Tabs */}
          {totalCount > 0 && tabs.length > 2 && (
            <div className="mb-6 flex gap-1 overflow-x-auto pb-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                      activeTab === tab.id ? "bg-background/20 text-background" : "bg-border text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {totalCount === 0 ? (
            /* No results */
            <div className="rounded-card border border-border bg-card px-6 py-12 text-center">
              <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="font-medium text-foreground">
                {t("Aucun résultat", "No results")}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t(
                  "Essayez un autre terme ou explorez le catalogue complet.",
                  "Try a different term or browse the full catalog."
                )}
              </p>
              <Link
                to={`${prefix}/tools`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t("Voir tous les outils", "Browse all tools")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-8">

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
                  <div className="grid gap-2">
                    {(activeTab === "all" ? toolResults.slice(0, 5) : toolResults).map(tool => (
                      <ToolCard key={tool.id} tool={tool} prefix={prefix} query={inputValue.trim()} lang={lang} t={t} />
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
                  <div className="grid gap-2 sm:grid-cols-2">
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
                  <div className="grid gap-2">
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
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {count}
        </span>
      </div>
      {showAll && (
        <button
          onClick={onShowAll}
          className="text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {t("Voir tout →", "See all →")}
        </button>
      )}
    </div>
  );
}

function ToolCard({
  tool, prefix, query, lang, t,
}: {
  tool: any;
  prefix: string;
  query: string;
  lang: string;
  t: (fr: string, en: string) => string;
}) {
  const desc = lang === "en"
    ? (tool.shortDescriptionEn || tool.shortDescription || "")
    : (tool.shortDescription || "");

  return (
    <div className="search-tool-result group relative flex items-center rounded-card border border-border bg-card transition-all hover:border-primary/30 hover:bg-primary/3">
    <Link
      to={`${prefix}/tool/${tool.slug || tool.id}`}
      className="flex min-w-0 flex-1 items-center gap-3.5 px-4 py-3.5"
    >
      <ToolLogo tool={tool} size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-foreground">{tool.name || tool.id}</p>
        {desc && (
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{desc}</p>
        )}
      </div>
      {tool.defaultMonthlyPrice > 0 && (
        <span className="shrink-0 text-[12px] font-medium text-muted-foreground">
          {tool.defaultMonthlyPrice}€/mo
        </span>
      )}
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
    <Link
      to={getExplorerHref(prefix, { type: "outil", slug: tool.slug || tool.id })}
      state={{ explorerCanGoBack: true, previousSourceLabel: t("Recherche", "Search") }}
      className="search-tool-explore mr-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground"
      aria-label={t(`Explorer autour de ${tool.name}`, `Explore around ${tool.name}`)}
    >
      <Compass className="h-4 w-4" aria-hidden />
    </Link>
    </div>
  );
}

function CategoryCard({ cat, prefix, lang }: { cat: any; prefix: string; lang: string }) {
  const name = lang === "en" ? (cat.nameEn || cat.name) : cat.name;
  const desc = lang === "en" ? (cat.descriptionEn || cat.description) : cat.description;

  return (
    <Link
      to={`${prefix}/category/${cat.slug}`}
      className="group flex items-center gap-3 rounded-card border border-border bg-card px-4 py-3.5 transition-all hover:border-primary/30 hover:bg-primary/3"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
        <Hash className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-foreground">{name}</p>
        {desc && (
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{desc}</p>
        )}
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

function GuideCard({ post, prefix }: { post: any; prefix: string }) {
  return (
    <Link
      to={`${prefix}/guide/${post.slug}`}
      className="group flex items-start gap-3.5 rounded-card border border-border bg-card px-4 py-3.5 transition-all hover:border-primary/30 hover:bg-primary/3"
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
        <BookOpen className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-foreground leading-snug">{post.title}</p>
        {post.excerpt && (
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}
        {post.readTime && (
          <p className="mt-1.5 text-[11px] text-muted-foreground/60">{post.readTime}</p>
        )}
      </div>
      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

export default SearchPage;
