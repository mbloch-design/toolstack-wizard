import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "@/lib/routerLinks";
import { ArrowRight, BookOpen, Bookmark, Boxes, Columns2, LayoutGrid, Lightbulb, Search, X } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useCategories, usePosts, useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { guideSearchKey, useCatalogSearch } from "@/hooks/useCatalogSearch";
import { useStackPins } from "@/hooks/useStackPins";
import ToolLogo from "@/components/ToolLogo";
import { trackEvent } from "@/lib/analytics";
import { displayText } from "@/lib/typography";
import { CATALOG_NEEDS } from "@/data/catalogNeeds";
import { FEATURED_COMPARISONS } from "@/data/comparisons";
import { HOME_COMPARISONS } from "@/data/homeComparisons";
import { GOAL_STACKS, type StackTool } from "@/data/goalStacks";

/**
 * Recherche globale (refonte du 9 oct. 2026). Avant la frappe, elle guide
 * avec les entrées du site d'aujourd'hui : exemples de recherche, besoins,
 * duels, stacks par objectif et la stack de l'utilisateur. Pendant la frappe,
 * les résultats sont rangés par type. L'ancienne version proposait encore
 * « Plateformes », « Fonctionne avec » et « Collections ».
 */

type ResultKind = "tool" | "category" | "guide" | "comparison" | "stack" | "bestof";
type SearchResult = { id: string; label: string; meta: string; to: string; tool?: ToolSummary; kind: ResultKind };
type PageEntry = { k: "comparison" | "stack" | "bestof"; fr: string; en: string; p: { fr: string; en: string }; kw: string[] };
type ResultGroup = { id: string; title: string; items: SearchResult[] };

/** Minuscules sans accents, pour comparer « gestion de projet » et « Gestion de Projet ». */
const fold = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Exemples cliquables : ils montrent ce que la recherche comprend. */
const SEARCH_EXAMPLES = [
  { fr: "CRM gratuit", en: "free CRM" },
  { fr: "prise de rendez-vous", en: "project management" },
  { fr: "ChatGPT vs Claude", en: "ChatGPT vs Claude" },
  { fr: "facturation", en: "invoicing" },
];

/** Trois outils connus par besoin : on reconnaît le besoin à ses logos avant
 * de lire son nom. Choix éditorial, pas un tri automatique (le tri par
 * demande faisait remonter des marques inconnues). */
const NEED_SHOWCASE: Record<string, string[]> = {
  productivite: ["notion", "clickup", "todoist"],
  creation: ["canva", "capcut", "descript"],
  design: ["figma", "framer", "sketch"],
  marketing: ["hubspot", "brevo", "mailchimp"],
  automatisation: ["zapier", "make", "n8n"],
  dev: ["webflow", "github", "vercel"],
  communication: ["slack", "zoom", "loom"],
  donnees: ["google-analytics", "hotjar", "looker-studio"],
  ia: ["chatgpt", "claude", "perplexity"],
  admin: ["stripe", "qonto", "pennylane"],
};

const GROUP_LIMITS = { tool: 6, compare: 4, stack: 3, category: 3, guide: 3 };

export function SearchModal({ onClose: close }: { onClose: () => void }) {
  const { t, prefix, lang } = useLang();
  // Sortie courte (120 ms) avant de démonter : la fenêtre se retire au lieu
  // de disparaître d'un coup. Immédiate si l'utilisateur réduit les animations.
  const [closing, setClosing] = useState(false);
  const onClose = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { close(); return; }
    setClosing(true);
    window.setTimeout(close, 120);
  }, [close]);
  const navigate = useNavigate();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);
  const { state: stackState } = useStackPins();
  const stackCount = stackState.pinnedToolSlugs.length;
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  // Comparatifs, stacks et pages « meilleurs outils » (US-NAV-01 : la recherche
  // doit retrouver toutes les familles de pages). Chargé à l'ouverture
  // seulement, pour ne pas alourdir le bundle principal.
  const [pages, setPages] = useState<PageEntry[]>([]);
  useEffect(() => {
    let alive = true;
    import("@/data/searchPagesIndex.json").then((module) => { if (alive) setPages(module.default as PageEntry[]); }).catch(() => {});
    return () => { alive = false; };
  }, []);
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
      // a[href], pas [href] : les icônes du sprite (<use href>) passaient pour
      // le premier et le dernier élément, et la tabulation sortait du dialogue.
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])')).filter((element) => element.tabIndex >= 0);
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
  const postBySearchKey = useMemo(() => new Map(posts.map((post) => [guideSearchKey(post, lang), post])), [posts, lang]);
  // La couleur vient des vrais logos, pas d'icônes grises.
  const needLogos = useMemo(() => new Map(CATALOG_NEEDS.map((need) => [
    need.id,
    (NEED_SHOWCASE[need.id] || []).map((slug) => toolBySlug.get(slug)).filter(Boolean) as ToolSummary[],
  ])), [toolBySlug]);

  const fallbackResults = useMemo<SearchResult[]>(() => {
    const normalized = query.trim().toLocaleLowerCase(lang);
    if (normalized.length < 2) return [];
    const toolResults = tools.filter((tool) => [tool.name, tool.slug, tool.shortDescription, tool.shortDescriptionEn].some((value) => value?.toLocaleLowerCase(lang).includes(normalized))).slice(0, 8).map((tool) => ({ id: `tool-${tool.id}`, label: tool.name, meta: categoryName(categories, tool.categoryId, lang), to: `${prefix}/tool/${tool.slug || tool.id}`, tool, kind: "tool" as const }));
    const categoryResults = categories.filter((category) => [category.name, category.nameEn].some((value) => value?.toLocaleLowerCase(lang).includes(normalized))).slice(0, 4).map((category) => ({ id: `category-${category.id}`, label: cleanLabel(lang === "en" ? category.nameEn || category.name : category.name), meta: t("Catégorie", "Category"), to: `${prefix}/category/${category.slug}`, kind: "category" as const }));
    const articleResults = posts.filter((post) => [post.title, post.excerpt, ...post.tags].some((value) => value?.toLocaleLowerCase(lang).includes(normalized))).slice(0, 5).map((post) => ({ id: `article-${guideSearchKey(post, lang)}`, label: post.title, meta: post.readTime, to: `${prefix}/guide/${post.slug}`, kind: "guide" as const }));
    return [...toolResults, ...categoryResults, ...articleResults];
  }, [categories, lang, posts, prefix, query, t, tools]);

  const { hits: intelligentHits, status: searchStatus } = useCatalogSearch({
    query,
    tools,
    categories,
    posts,
    lang,
    limit: 24,
  });

  const pageResults = useMemo<SearchResult[]>(() => {
    const tokens = fold(query.trim()).split(/\s+/).filter((token) => token.length >= 2 && token !== "vs");
    if (!tokens.length) return [];
    const metaOf = { comparison: t("Comparatif", "Comparison"), stack: t("Stack", "Stack"), bestof: t("Comparatif par besoin", "Comparison by need") };
    return pages
      .map((page) => {
        const label = lang === "en" ? page.en : page.fr;
        const haystack = fold([label, ...page.kw].join(" "));
        if (!tokens.every((token) => haystack.includes(token))) return null;
        // Un titre qui commence par la recherche passe devant.
        const score = (fold(label).startsWith(tokens[0]) ? 2 : 0) + (page.k === "bestof" ? 1 : 0);
        return { score, result: { id: `page-${page.k}-${page.p.en}`, label, meta: metaOf[page.k], to: `${prefix}${lang === "en" ? page.p.en : page.p.fr}`, kind: page.k } as SearchResult };
      })
      .filter((item): item is { score: number; result: SearchResult } => !!item)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.result);
  }, [lang, pages, prefix, query, t]);

  const baseResults = useMemo<SearchResult[]>(() => {
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
      const post = postBySearchKey.get(hit.entityId);
      if (!post) return [];
      return [{ id: hit.id, label: hit.label, meta: hit.meta, to: `${prefix}/guide/${hit.slug}`, kind: "guide" }];
    });
  }, [categoryById, fallbackResults, intelligentHits, postBySearchKey, prefix, toolById, toolBySlug]);

  // Résultats rangés par type, chacun limité : on lit d'abord « quoi », puis
  // « lequel ». Les flèches traversent les groupes dans cet ordre.
  const groups = useMemo<ResultGroup[]>(() => {
    const of = (kinds: ResultKind[], source: SearchResult[]) => source.filter((result) => kinds.includes(result.kind));
    return [
      { id: "tool", title: t("Outils", "Tools"), items: of(["tool"], baseResults).slice(0, GROUP_LIMITS.tool) },
      // Le titre du groupe dit déjà le type : la ligne ne le répète pas
      // (« Comparatif » sous chaque comparatif). Seul « par besoin » reste.
      { id: "compare", title: t("Comparatifs", "Comparisons"), items: of(["comparison", "bestof"], pageResults).slice(0, GROUP_LIMITS.compare).map((item) => ({ ...item, meta: item.kind === "bestof" ? item.meta : "" })) },
      { id: "stack", title: t("Stacks", "Stacks"), items: of(["stack"], pageResults).slice(0, GROUP_LIMITS.stack).map((item) => ({ ...item, meta: "" })) },
      { id: "category", title: t("Catégories", "Categories"), items: of(["category"], baseResults).slice(0, GROUP_LIMITS.category).map((item) => ({ ...item, meta: "" })) },
      { id: "guide", title: t("Guides", "Guides"), items: of(["guide"], baseResults).slice(0, GROUP_LIMITS.guide).map((item) => ({ ...item, meta: item.meta === "Guide" ? "" : item.meta })) },
    ].filter((group) => group.items.length > 0);
  }, [baseResults, pageResults, t]);
  const results = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  useEffect(() => setActiveIndex(-1), [results]);
  useEffect(() => {
    if (activeIndex >= 0) document.getElementById(`gs-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const isSearching = query.trim().length >= 2;

  const goTo = useCallback((to: string) => {
    if (query.trim().length >= 2) {
      trackEvent("search_tool", { query: query.trim(), result_count: results.length });
    }
    navigate(to);
    onClose();
  }, [navigate, onClose, query, results.length]);
  const viewAllResults = useCallback(() => {
    const value = query.trim();
    if (value.length >= 2) goTo(`${prefix}/search?q=${encodeURIComponent(value)}`);
  }, [goTo, prefix, query]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearching && event.key === "ArrowDown") {
      event.preventDefault();
      dialogRef.current?.querySelector<HTMLElement>(".gs-guide a, .gs-guide button")?.focus();
      return;
    }
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, results.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
    if (event.key === "Enter") {
      event.preventDefault();
      const result = results[activeIndex];
      if (result) goTo(result.to);
      else viewAllResults();
    }
  };

  const tryExample = (value: string) => {
    setQuery(value);
    inputRef.current?.focus();
  };

  const isLoading = searchStatus === "loading" && results.length === 0;
  const statusMessage = !isSearching ? "" : isLoading ? t("Recherche en cours", "Searching")
    : results.length ? (lang === "fr" ? `${results.length} résultat${results.length > 1 ? "s" : ""}` : `${results.length} result${results.length > 1 ? "s" : ""}`)
    : t("Aucun résultat", "No results");

  return (
    <div className={`gs-overlay${closing ? " is-closing" : ""}`} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={dialogRef} className="gs-dialog" role="dialog" aria-modal="true" aria-label={t("Recherche globale", "Global search")}>
        <div className="gs-searchbar">
          <Search aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t("Un outil, un besoin, un duel…", "A tool, a need, a duel…")}
            aria-label={t("Rechercher", "Search")}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isSearching && results.length > 0}
            aria-controls="gs-listbox"
            aria-activedescendant={activeIndex >= 0 ? `gs-option-${activeIndex}` : undefined}
            autoComplete="off"
          />
          {query && <button type="button" className="gs-clear" onClick={() => { setQuery(""); inputRef.current?.focus(); }}>{t("Effacer", "Clear")}</button>}
          <button type="button" className="gs-icon-button" onClick={onClose} aria-label={t("Fermer", "Close")}><X aria-hidden /></button>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{statusMessage}</p>

        <div className="gs-body">
          {isSearching ? (
            results.length > 0 ? (
              <div className="gs-results">
              <div id="gs-listbox" role="listbox" aria-label={t("Résultats", "Results")}>
                {groups.map((group) => {
                  const offset = results.indexOf(group.items[0]);
                  return (
                    <div key={group.id} className="gs-group" role="group" aria-labelledby={`gs-group-${group.id}`}>
                      <div id={`gs-group-${group.id}`} className="gs-label" role="presentation">{group.title}</div>
                      {group.items.map((result, i) => {
                        const index = offset + i;
                        return (
                          <button
                            key={result.id}
                            id={`gs-option-${index}`}
                            type="button"
                            role="option"
                            tabIndex={-1}
                            aria-selected={activeIndex === index}
                            className={activeIndex === index ? "gs-result is-active" : "gs-result"}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => goTo(result.to)}
                          >
                            {result.tool ? <ToolLogo tool={result.tool} size={32} /> : <span className="gs-result-icon" aria-hidden><KindIcon kind={result.kind} /></span>}
                            <span className="gs-result-text">
                              <strong>{displayText(result.label, lang)}</strong>
                              {result.meta && <small>{result.meta}</small>}
                            </span>
                            <ArrowRight className="gs-result-arrow" aria-hidden />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
                <button type="button" className="gs-view-all" onClick={viewAllResults}>
                  {t("Voir tous les résultats pour", "See all results for")} « {query.trim()} » <ArrowRight aria-hidden />
                </button>
              </div>
            ) : (
              <div className="gs-empty" aria-live="polite">
                {isLoading || searchStatus === "loading" ? (
                  <p className="gs-empty-title">{t("Recherche en cours…", "Searching…")}</p>
                ) : (
                  <>
                    <p className="gs-empty-title">{t(`Rien pour « ${query.trim()} »`, `Nothing for “${query.trim()}”`)}</p>
                    <p className="gs-empty-text">{t("Essayez plutôt par besoin :", "Try by need instead:")}</p>
                    <NeedChips prefix={prefix} lang={lang} onPick={onClose} />
                  </>
                )}
              </div>
            )
          ) : (
            <div className="gs-guide">
              {stackCount > 0 && (
                <Link to={`${prefix}/ma-stack`} onClick={onClose} className="gs-mystack gs-card">
                  <span className="gs-result-icon" aria-hidden><Bookmark /></span>
                  <span className="gs-result-text">
                    <strong>{t("Reprendre votre stack", "Back to your stack")}</strong>
                    <small>{lang === "fr" ? `${stackCount} outil${stackCount > 1 ? "s" : ""}` : `${stackCount} tool${stackCount > 1 ? "s" : ""}`}</small>
                  </span>
                  <ArrowRight className="gs-result-arrow" aria-hidden />
                </Link>
              )}

              <section className="gs-section" aria-labelledby="gs-try">
                <h2 id="gs-try" className="gs-label">{t("Essayez", "Try")}</h2>
                <div className="gs-chips">
                  {SEARCH_EXAMPLES.map((example) => {
                    const value = lang === "en" ? example.en : example.fr;
                    return (
                      <button key={value} type="button" className="gs-chip gs-chip--example" onClick={() => tryExample(value)}>
                        <Search aria-hidden />
                        {value}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="gs-section" aria-labelledby="gs-needs">
                <h2 id="gs-needs" className="gs-label">{t("Par besoin", "By need")}</h2>
                <ul className="gs-needs">
                  {CATALOG_NEEDS.map((need) => (
                    <li key={need.id}>
                      <Link to={`${prefix}/tools?need=${need.id}`} onClick={onClose} className="gs-need gs-card">
                        <span className="gs-need-logos" aria-hidden>
                          {(needLogos.get(need.id) || []).map((tool) => (
                            <span key={tool.id} className="gs-need-logo"><ToolLogo tool={tool} size={22} /></span>
                          ))}
                        </span>
                        <span className="gs-need-label">{lang === "en" ? need.en : need.fr}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="gs-section" aria-labelledby="gs-duels">
                <h2 id="gs-duels" className="gs-label">{t("Lequel garder ?", "Which one to keep?")}</h2>
                <ul className="gs-duels">
                  {HOME_COMPARISONS.slice(0, 4).map((slugPair) => {
                    const comparison = FEATURED_COMPARISONS.find((item) => item.slugPair === slugPair);
                    const toolA = comparison && toolBySlug.get(comparison.toolA);
                    const toolB = comparison && toolBySlug.get(comparison.toolB);
                    if (!comparison || !toolA || !toolB) return null;
                    return (
                      <li key={slugPair}>
                        <Link to={`${prefix}/comparatif/${slugPair}`} onClick={onClose} className="gs-duel gs-card">
                          <span className="gs-duel-logos" aria-hidden>
                            <span className="gs-duel-logo gs-duel-logo--a"><ToolLogo tool={toolA} size={40} /></span>
                            <span className="gs-duel-vs">vs</span>
                            <span className="gs-duel-logo gs-duel-logo--b"><ToolLogo tool={toolB} size={40} /></span>
                          </span>
                          <span className="gs-duel-name">{toolA.name} <span>vs</span> {toolB.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="gs-section" aria-labelledby="gs-stacks">
                <h2 id="gs-stacks" className="gs-label">{t("Partir d’une stack", "Start from a stack")}</h2>
                <ul className="gs-stacks">
                  {GOAL_STACKS.map((stack) => (
                    <li key={stack.slug}>
                      <Link to={`${prefix}/stacks/${stack.slug}`} onClick={onClose} className="gs-stack gs-card">
                        {/* Le « dossier » de l'accueil : la stack se lit comme un lot d'apps. */}
                        <span className="gs-stack-folder" aria-hidden>
                          {stack.tools.slice(0, 4).map((tool) => (
                            <span key={tool.slug} className="gs-stack-app"><ToolLogo tool={resolveStackTool(tool, toolBySlug) as ToolSummary} size={18} /></span>
                          ))}
                        </span>
                        <span className="gs-result-text">
                          <strong>{lang === "fr" ? stack.objectiveFr : stack.objectiveEn}</strong>
                          <small>{displayText(lang === "fr" ? stack.titleFr : stack.titleEn, lang)}</small>
                        </span>
                        <ArrowRight className="gs-result-arrow" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NeedChips({ prefix, lang, onPick }: { prefix: string; lang: string; onPick: () => void }) {
  return (
    <div className="gs-chips">
      {CATALOG_NEEDS.map((need) => (
        <Link key={need.id} to={`${prefix}/tools?need=${need.id}`} onClick={onPick} className="gs-chip">
          {lang === "en" ? need.en : need.fr}
        </Link>
      ))}
    </div>
  );
}

function KindIcon({ kind }: { kind: ResultKind }) {
  if (kind === "guide") return <BookOpen />;
  if (kind === "comparison") return <Columns2 />;
  if (kind === "stack") return <Boxes />;
  if (kind === "bestof") return <Lightbulb />;
  return <LayoutGrid />;
}

/** Same resolution as the homepage: live catalogue data, config fills gaps. */
function resolveStackTool(tool: StackTool, bySlug: Map<string, ToolSummary>) {
  const live = bySlug.get(tool.slug);
  return { ...tool, ...live, name: live?.name || tool.name, websiteUrl: live?.websiteUrl || tool.websiteUrl, logo: tool.logo || live?.logo || undefined };
}

function categoryName(categories: any[], categoryId: string, lang: string) {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return "";
  return cleanLabel(lang === "en" ? category.nameEn || category.name : category.name);
}

function cleanLabel(value: string) {
  return value.replace(/\p{Extended_Pictographic}/gu, "").replace(/️/g, "").trim();
}
