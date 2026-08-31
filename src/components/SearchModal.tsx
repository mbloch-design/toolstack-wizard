import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Boxes,
  BriefcaseBusiness,
  Camera,
  Code2,
  GraduationCap,
  Headphones,
  LayoutGrid,
  Megaphone,
  Palette,
  PenLine,
  PlayCircle,
  Plug,
  Search,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useCategories, usePosts, useToolSummaries, type Post, type ToolSummary } from "@/hooks/useSupabaseData";
import { useCatalogSearch } from "@/hooks/useCatalogSearch";
import ToolLogo from "@/components/ToolLogo";

type SearchSection = "trending" | "categories" | "platforms" | "works" | "collections" | "articles";
type SearchResult = { id: string; label: string; meta: string; to: string; tool?: ToolSummary; kind: "tool" | "category" | "guide" };

const NAV_ITEMS: Array<{ id: SearchSection; fr: string; en: string }> = [
  { id: "trending", fr: "Tendances", en: "Trending" },
  { id: "categories", fr: "Catégories", en: "Categories" },
  { id: "platforms", fr: "Plateformes", en: "Platforms" },
  { id: "works", fr: "Fonctionne avec", en: "Works with" },
  { id: "collections", fr: "Collections", en: "Collections" },
  { id: "articles", fr: "Articles", en: "Articles" },
];

const FEATURED_SLUGS = ["notion", "figma", "chatgpt", "framer", "webflow", "slack", "zapier", "linear"];
const PLATFORM_SLUGS = ["framer", "figma", "webflow", "notion", "shopify", "wordpress", "visual-studio-code", "chrome"];

const CATEGORY_ICONS = [Plug, Palette, Bot, Boxes, BriefcaseBusiness, Megaphone, PlayCircle, ShoppingCart, Users, Code2, PenLine, Headphones, Camera, TrendingUp, GraduationCap, Sparkles];

export function SearchModal({ onClose }: { onClose: () => void }) {
  const { t, prefix, lang } = useLang();
  const navigate = useNavigate();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<SearchSection>("trending");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 30);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href]'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);
  const toolById = useMemo(() => new Map(tools.map((tool) => [tool.id, tool])), [tools]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const postById = useMemo(() => new Map(posts.map((post) => [post.id, post])), [posts]);
  const featured = useMemo(() => FEATURED_SLUGS.map((slug) => toolBySlug.get(slug)).filter(Boolean) as ToolSummary[], [toolBySlug]);
  const platforms = useMemo(() => PLATFORM_SLUGS.map((slug) => toolBySlug.get(slug)).filter(Boolean) as ToolSummary[], [toolBySlug]);
  const latestPosts = useMemo(() => [...posts].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 6), [posts]);

  const fallbackResults = useMemo<SearchResult[]>(() => {
    const normalized = query.trim().toLocaleLowerCase(lang);
    if (normalized.length < 2) return [];
    const toolResults = tools.filter((tool) => [tool.name, tool.slug, tool.shortDescription, tool.shortDescriptionEn].some((value) => value?.toLocaleLowerCase(lang).includes(normalized))).slice(0, 8).map((tool) => ({ id: `tool-${tool.id}`, label: tool.name, meta: categoryName(categories, tool.categoryId, lang), to: `${prefix}/tool/${tool.slug || tool.id}`, tool, kind: "tool" as const }));
    const categoryResults = categories.filter((category) => [category.name, category.nameEn].some((value) => value?.toLocaleLowerCase(lang).includes(normalized))).slice(0, 4).map((category) => ({ id: `category-${category.id}`, label: cleanLabel(lang === "en" ? category.nameEn || category.name : category.name), meta: t("Catégorie", "Category"), to: `${prefix}/category/${category.slug}`, kind: "category" as const }));
    const articleResults = posts.filter((post) => [post.title, post.excerpt, ...post.tags].some((value) => value?.toLocaleLowerCase(lang).includes(normalized))).slice(0, 5).map((post) => ({ id: `article-${post.id}`, label: post.title, meta: post.readTime, to: `${prefix}/guide/${post.slug}`, kind: "guide" as const }));
    return [...toolResults, ...categoryResults, ...articleResults];
  }, [categories, lang, posts, prefix, query, t, tools]);

  const { hits: intelligentHits, status: searchStatus } = useCatalogSearch({
    query,
    tools,
    categories,
    posts,
    lang,
    limit: 17,
  });

  const results = useMemo<SearchResult[]>(() => {
    if (!intelligentHits) return fallbackResults;
    return intelligentHits.flatMap((hit): SearchResult[] => {
      if (hit.kind === "tool") {
        const tool = toolById.get(hit.entityId) || toolBySlug.get(hit.slug);
        if (!tool) return [];
        return [{ id: hit.id, label: hit.label, meta: hit.meta, to: `${prefix}/tool/${hit.slug}`, tool, kind: "tool" }];
      }
      if (hit.kind === "category") {
        const category = categoryById.get(hit.entityId);
        if (!category) return [];
        return [{ id: hit.id, label: hit.label, meta: hit.meta, to: `${prefix}/category/${hit.slug}`, kind: "category" }];
      }
      const post = postById.get(hit.entityId);
      if (!post) return [];
      return [{ id: hit.id, label: hit.label, meta: hit.meta, to: `${prefix}/guide/${hit.slug}`, kind: "guide" }];
    });
  }, [categoryById, fallbackResults, intelligentHits, postById, prefix, toolById, toolBySlug]);

  useEffect(() => setActiveIndex(-1), [results]);

  const goTo = useCallback((to: string) => { navigate(to); onClose(); }, [navigate, onClose]);
  const viewAllResults = useCallback(() => {
    const value = query.trim();
    if (value.length >= 2) goTo(`${prefix}/search?q=${encodeURIComponent(value)}`);
  }, [goTo, prefix, query]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, results.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
    if (event.key === "Enter") {
      event.preventDefault();
      const result = results[activeIndex];
      result ? goTo(result.to) : viewAllResults();
    }
  };

  const isSearching = query.trim().length >= 2;

  return (
    <div className="gs-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={dialogRef} className="gs-dialog" role="dialog" aria-modal="true" aria-label={t("Recherche globale", "Global search")}>
        <header className="gs-searchbar">
          <Search aria-hidden />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleInputKeyDown} placeholder={t("Rechercher un outil, une catégorie ou un guide", "Search for a tool, category or guide")} aria-label={t("Rechercher", "Search")} autoComplete="off" />
          {query && <button className="gs-icon-button" onClick={() => setQuery("")} aria-label={t("Effacer", "Clear")}><X /></button>}
          <button className="gs-icon-button" onClick={onClose} aria-label={t("Fermer", "Close")}><X /></button>
        </header>

        {isSearching ? (
          <SearchResults results={results} activeIndex={activeIndex} query={query} isLoading={searchStatus === "loading"} onHover={setActiveIndex} onSelect={goTo} onViewAll={viewAllResults} t={t} />
        ) : (
          <div className="gs-explorer">
            <aside className="gs-nav" aria-label={t("Navigation de recherche", "Search navigation")}>
              <span className="gs-nav-label">{t("Navigation", "Navigation")}</span>
              {NAV_ITEMS.map((item) => (
                <button key={item.id} className={section === item.id ? "is-active" : ""} onClick={() => setSection(item.id)}>{lang === "en" ? item.en : item.fr}</button>
              ))}
            </aside>
            <main className="gs-content">
              <ExploreSection section={section} featured={featured} platforms={platforms} categories={categories} posts={latestPosts} tools={tools} prefix={prefix} lang={lang} t={t} onGo={goTo} />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

function ExploreSection({ section, featured, platforms, categories, posts, tools, prefix, lang, t, onGo }: { section: SearchSection; featured: ToolSummary[]; platforms: ToolSummary[]; categories: any[]; posts: Post[]; tools: ToolSummary[]; prefix: string; lang: string; t: (fr: string, en: string) => string; onGo: (to: string) => void }) {
  if (section === "categories") return <CategoryGrid categories={categories.slice(0, 16)} prefix={prefix} lang={lang} onGo={onGo} t={t} />;
  if (section === "platforms" || section === "works") return <ToolGrid title={section === "platforms" ? t("Plateformes", "Platforms") : t("Fonctionne avec", "Works with")} tools={platforms} prefix={prefix} onGo={onGo} />;
  if (section === "articles") return <ArticleGrid posts={posts} prefix={prefix} onGo={onGo} t={t} />;
  if (section === "collections") return <CollectionGrid categories={categories.slice(0, 9)} tools={tools} prefix={prefix} lang={lang} onGo={onGo} t={t} />;
  return (
    <div className="gs-dashboard">
      <ToolGrid title={t("À découvrir", "Featured")} tools={featured} prefix={prefix} onGo={onGo} compact />
      <CollectionGrid categories={categories.slice(0, 3)} tools={tools} prefix={prefix} lang={lang} onGo={onGo} t={t} compact />
      <ArticleGrid posts={posts.slice(0, 3)} prefix={prefix} onGo={onGo} t={t} compact />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) { return <h2 className="gs-section-title">{children}</h2>; }

function ToolGrid({ title, tools, prefix, onGo, compact = false }: { title: string; tools: ToolSummary[]; prefix: string; onGo: (to: string) => void; compact?: boolean }) {
  return <section><SectionTitle>{title}</SectionTitle><div className={compact ? "gs-logo-grid is-compact" : "gs-logo-grid"}>{tools.map((tool) => <button key={tool.id} className="gs-tool-tile" onClick={() => onGo(`${prefix}/tool/${tool.slug || tool.id}`)}><ToolLogo tool={tool} size={compact ? 32 : 40} /><span>{tool.name}</span></button>)}</div></section>;
}

function CategoryGrid({ categories, prefix, lang, onGo, t }: { categories: any[]; prefix: string; lang: string; onGo: (to: string) => void; t: (fr: string, en: string) => string }) {
  return <section><SectionTitle>{t("Catégories", "Categories")}</SectionTitle><div className="gs-category-grid">{categories.map((category, index) => { const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length]; return <button key={category.id} className="gs-category-tile" onClick={() => onGo(`${prefix}/category/${category.slug}`)}><Icon aria-hidden /><span>{cleanLabel(lang === "en" ? category.nameEn || category.name : category.name)}</span></button>; })}</div></section>;
}

function CollectionGrid({ categories, tools, prefix, lang, onGo, t, compact = false }: { categories: any[]; tools: ToolSummary[]; prefix: string; lang: string; onGo: (to: string) => void; t: (fr: string, en: string) => string; compact?: boolean }) {
  return <section><SectionTitle>{t("Collections populaires", "Popular collections")}</SectionTitle><div className={compact ? "gs-collection-grid is-compact" : "gs-collection-grid"}>{categories.map((category) => { const items = tools.filter((tool) => tool.categoryId === category.id).slice(0, 4); return <button key={category.id} className="gs-collection-card" onClick={() => onGo(`${prefix}/category/${category.slug}`)}><div className="gs-logo-stack">{items.map((tool) => <ToolLogo key={tool.id} tool={tool} size={24} />)}</div><strong>{cleanLabel(lang === "en" ? category.nameEn || category.name : category.name)}</strong><span>{t("Voir la sélection", "View selection")} <ArrowRight aria-hidden /></span></button>; })}</div></section>;
}

function ArticleGrid({ posts, prefix, onGo, t, compact = false }: { posts: Post[]; prefix: string; onGo: (to: string) => void; t: (fr: string, en: string) => string; compact?: boolean }) {
  return <section><SectionTitle>{t("Derniers articles", "Latest articles")}</SectionTitle><div className={compact ? "gs-article-grid is-compact" : "gs-article-grid"}>{posts.map((post) => <button key={post.id} className="gs-article-card" onClick={() => onGo(`${prefix}/guide/${post.slug}`)}><span className="gs-article-cover">{post.thumbnail ? <img src={post.thumbnail} alt="" loading="lazy" decoding="async" /> : <BookOpen aria-hidden />}</span><strong>{post.title}</strong><span className="gs-article-meta">{post.category}{post.readTime ? ` · ${post.readTime}` : ""}</span></button>)}</div></section>;
}

function SearchResults({ results, activeIndex, query, isLoading, onHover, onSelect, onViewAll, t }: { results: SearchResult[]; activeIndex: number; query: string; isLoading: boolean; onHover: (index: number) => void; onSelect: (to: string) => void; onViewAll: () => void; t: (fr: string, en: string) => string }) {
  return <div className="gs-results" role="listbox" aria-busy={isLoading}>{results.length ? <>{results.map((result, index) => <button key={result.id} className={activeIndex === index ? "gs-result is-active" : "gs-result"} onMouseEnter={() => onHover(index)} onClick={() => onSelect(result.to)} role="option" aria-selected={activeIndex === index}>{result.tool ? <ToolLogo tool={result.tool} size={42} /> : <span className="gs-result-icon">{result.kind === "guide" ? <BookOpen /> : <LayoutGrid />}</span>}<span><strong>{result.label}</strong><small>{result.meta}</small></span><ArrowRight aria-hidden /></button>)}<button className="gs-view-all" onClick={onViewAll}>{t("Voir tous les résultats pour", "See all results for")} « {query} » <ArrowRight /></button></> : <div className="gs-empty"><Search /><strong>{isLoading ? t("Recherche en cours…", "Searching…") : t("Aucun résultat", "No results")}</strong><span>{isLoading ? t("Analyse du catalogue", "Analysing the catalog") : t("Essayez un autre terme", "Try another term")}</span></div>}</div>;
}

function categoryName(categories: any[], categoryId: string, lang: string) {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return "";
  return cleanLabel(lang === "en" ? category.nameEn || category.name : category.name);
}

function cleanLabel(value: string) {
  return value.replace(/\p{Extended_Pictographic}/gu, "").replace(/\uFE0F/g, "").trim();
}
