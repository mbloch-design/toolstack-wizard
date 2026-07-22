import React, { useEffect, useRef, useState, useMemo, useCallback, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, ArrowRight, Hash, BookOpen } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, usePosts } from "@/hooks/useSupabaseData";
import ToolLogo from "@/components/ToolLogo";

/* ────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────── */
type ResultType = "tool" | "category" | "guide";

interface SearchResult {
  id: string;
  type: ResultType;
  label: string;
  meta?: string;
  to: string;
  tool?: any;
}

/* ────────────────────────────────────────────────────────────
   Constants
──────────────────────────────────────────────────────────── */
const SUGGESTIONS = ["Notion", "Figma", "Slack", "Zapier", "HubSpot", "Linear"];

/* ────────────────────────────────────────────────────────────
   SearchModal
──────────────────────────────────────────────────────────── */
export function SearchModal({ onClose }: { onClose: () => void }) {
  const { t, prefix, lang } = useLang();
  const navigate = useNavigate();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /* Auto-focus */
  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const id = setTimeout(() => inputRef.current?.focus(), 30);
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      clearTimeout(id);
      document.removeEventListener("keydown", handleDialogKeys);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  /* Lock scroll */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* Scroll active item into view */
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  /* Build results */
  const results = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const toolResults: SearchResult[] = tools
      .filter(tool =>
        (tool.name ?? "").toLowerCase().includes(q) ||
        (tool.slug || tool.id || "").toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(tool => ({
        id: `tool:${tool.id}`,
        type: "tool",
        label: tool.name || tool.id,
        to: `${prefix}/tool/${tool.slug || tool.id}`,
        tool,
      }));

    const catResults: SearchResult[] = categories
      .filter(c =>
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.nameEn ?? "").toLowerCase().includes(q)
      )
      .slice(0, 3)
      .map(c => ({
        id: `cat:${c.id}`,
        type: "category",
        label: lang === "en" ? (c.nameEn || c.name) : c.name,
        to: `${prefix}/category/${c.slug}`,
      }));

    const guideResults: SearchResult[] = posts
      .filter(p =>
        (p.title ?? "").toLowerCase().includes(q) ||
        (p.excerpt ?? "").toLowerCase().includes(q)
      )
      .slice(0, 3)
      .map(p => ({
        id: `guide:${p.id}`,
        type: "guide",
        label: p.title,
        meta: p.readTime || undefined,
        to: `${prefix}/guide/${p.slug}`,
      }));

    return [...toolResults, ...catResults, ...guideResults];
  }, [query, tools, categories, posts, prefix, lang]);

  /* Reset active index when results change */
  useEffect(() => setActiveIndex(-1), [results]);

  const handleSelect = useCallback((to: string) => {
    navigate(to);
    onClose();
  }, [navigate, onClose]);

  const handleViewAll = useCallback(() => {
    if (query.trim().length >= 2) {
      navigate(`${prefix}/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  }, [navigate, prefix, query, onClose]);

  /* Keyboard navigation */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const maxIndex = results.length; // results.length = "view all" row index

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, maxIndex));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex].to);
      } else if (query.trim().length >= 2) {
        handleViewAll();
      }
    }
  };

  const toolResults   = results.filter(r => r.type === "tool");
  const catResults    = results.filter(r => r.type === "category");
  const guideResults  = results.filter(r => r.type === "guide");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="search-modal-dialog fixed inset-x-0 top-[8vh] z-[201] mx-auto w-full max-w-[600px] px-4"
        role="dialog"
        aria-modal="true"
        aria-label={t("Recherche", "Search")}
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-black/20">

          {/* Input row */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-autocomplete="list"
              aria-controls="global-search-results"
              aria-activedescendant={activeIndex >= 0 ? `global-search-option-${activeIndex}` : undefined}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(
                "Rechercher un outil, guide, catégorie…",
                "Search for a tool, guide, category…"
              )}
              className="min-w-0 flex-1 bg-transparent text-base font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground/50 outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <div className="flex shrink-0 items-center gap-1.5">
              {query && (
                <button
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  className="rounded-md p-1 transition-colors hover:bg-secondary"
                  aria-label={t("Effacer", "Clear")}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                aria-label={t("Fermer la recherche", "Close search")}
              >
                <X className="h-4 w-4 text-muted-foreground" aria-hidden />
              </button>
              <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[11px] font-medium leading-none text-muted-foreground">
                Esc
              </kbd>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Results body */}
          {query.length >= 2 ? (
            <div id="global-search-results" className="max-h-[440px] overflow-y-auto" role="listbox">
              {results.length > 0 ? (
                <div className="py-1.5">

                  {toolResults.length > 0 && (
                    <ResultGroup label={t("Outils", "Tools")}>
                      {toolResults.map(r => {
                        const idx = results.indexOf(r);
                        return (
                          <ResultRow
                            key={r.id}
                            id={`global-search-option-${idx}`}
                            ref={activeIndex === idx ? activeItemRef : undefined}
                            active={activeIndex === idx}
                            onHover={() => setActiveIndex(idx)}
                            onClick={() => handleSelect(r.to)}
                          >
                            <ToolLogo tool={r.tool} size={26} />
                            <span className="flex-1 truncate text-[14px] font-medium text-foreground">
                              {r.label}
                            </span>
                            {activeIndex === idx && <EnterKbd />}
                          </ResultRow>
                        );
                      })}
                    </ResultGroup>
                  )}

                  {catResults.length > 0 && (
                    <ResultGroup label={t("Catégories", "Categories")} separator={toolResults.length > 0}>
                      {catResults.map(r => {
                        const idx = results.indexOf(r);
                        return (
                          <ResultRow
                            key={r.id}
                            id={`global-search-option-${idx}`}
                            ref={activeIndex === idx ? activeItemRef : undefined}
                            active={activeIndex === idx}
                            onHover={() => setActiveIndex(idx)}
                            onClick={() => handleSelect(r.to)}
                          >
                            <IconBox>
                              <Hash className="h-3 w-3" />
                            </IconBox>
                            <span className="flex-1 truncate text-[14px] font-medium text-foreground">
                              {r.label}
                            </span>
                            {activeIndex === idx && <EnterKbd />}
                          </ResultRow>
                        );
                      })}
                    </ResultGroup>
                  )}

                  {guideResults.length > 0 && (
                    <ResultGroup
                      label={t("Guides", "Guides")}
                      separator={toolResults.length > 0 || catResults.length > 0}
                    >
                      {guideResults.map(r => {
                        const idx = results.indexOf(r);
                        return (
                          <ResultRow
                            key={r.id}
                            id={`global-search-option-${idx}`}
                            ref={activeIndex === idx ? activeItemRef : undefined}
                            active={activeIndex === idx}
                            onHover={() => setActiveIndex(idx)}
                            onClick={() => handleSelect(r.to)}
                          >
                            <IconBox>
                              <BookOpen className="h-3 w-3" />
                            </IconBox>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-medium text-foreground">{r.label}</p>
                              {r.meta && (
                                <p className="text-[11px] text-muted-foreground">{r.meta}</p>
                              )}
                            </div>
                            {activeIndex === idx && <EnterKbd />}
                          </ResultRow>
                        );
                      })}
                    </ResultGroup>
                  )}

                  {/* View all */}
                  <div className="mt-0.5 border-t border-border/60 pt-0.5">
                    <ResultRow
                      ref={activeIndex === results.length ? activeItemRef : undefined}
                      id={`global-search-option-${results.length}`}
                      active={activeIndex === results.length}
                      onHover={() => setActiveIndex(results.length)}
                      onClick={handleViewAll}
                    >
                      <IconBox muted>
                        <Search className="h-3 w-3" />
                      </IconBox>
                      <span className="flex-1 text-[14px] text-muted-foreground">
                        {t("Voir tous les résultats pour", "See all results for")}{" "}
                        <span className="font-medium text-foreground">"{query}"</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </ResultRow>
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div className="px-6 py-10 text-center">
                  <p className="text-[15px] font-medium text-foreground">
                    {t(`Aucun résultat pour "${query}"`, `No results for "${query}"`)}
                  </p>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    {t("Essayez un terme différent", "Try a different term")}
                    {" — "}
                    <button
                      onClick={handleViewAll}
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      {t("voir tous les outils →", "browse all tools →")}
                    </button>
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Suggestions */
            <div className="py-2">
              <p className="px-4 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t("Outils populaires", "Popular tools")}
              </p>
              <div className="grid grid-cols-3 gap-0.5 px-2 pb-2">
                {SUGGESTIONS.map(name => (
                  <button
                    key={name}
                    onClick={() => { setQuery(name); inputRef.current?.focus(); }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {query.trim().length >= 2
              ? t(`${results.length} résultats disponibles`, `${results.length} results available`)
              : ""}
          </p>

          {/* Footer — keyboard hints */}
          <div className="flex items-center gap-4 border-t border-border bg-secondary/30 px-4 py-2">
            <ShortcutHint keys={["↑", "↓"]} label={t("naviguer", "navigate")} />
            <ShortcutHint keys={["↵"]}      label={t("sélectionner", "select")} />
            <ShortcutHint keys={["Esc"]}    label={t("fermer", "close")} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   Sub-components
──────────────────────────────────────────────────────────── */

function ResultGroup({
  label,
  children,
  separator = false,
}: {
  label: string;
  children: React.ReactNode;
  separator?: boolean;
}) {
  return (
    <div className={separator ? "mt-0.5 border-t border-border/60 pt-0.5" : ""}>
      <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/55">
        {label}
      </p>
      {children}
    </div>
  );
}

const ResultRow = forwardRef<
  HTMLButtonElement,
  {
    id?: string;
    active: boolean;
    onHover: () => void;
    onClick: () => void;
    children: React.ReactNode;
  }
>(({ id, active, onHover, onClick, children }, ref) => (
  <button
    id={id}
    ref={ref}
    role="option"
    aria-selected={active}
    onClick={onClick}
    onMouseEnter={onHover}
    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
      active ? "bg-primary/6" : "hover:bg-secondary/60"
    }`}
  >
    {children}
  </button>
));
ResultRow.displayName = "ResultRow";

function IconBox({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <div
      className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg ${
        muted ? "bg-secondary text-muted-foreground" : "bg-primary/8 text-primary"
      }`}
    >
      {children}
    </div>
  );
}

function EnterKbd() {
  return (
    <kbd className="shrink-0 rounded border border-border bg-secondary px-1 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
      ↵
    </kbd>
  );
}

function ShortcutHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      {keys.map(k => (
        <kbd key={k} className="rounded border border-border bg-background px-1 py-0.5 text-[10px] leading-none">
          {k}
        </kbd>
      ))}
      <span>{label}</span>
    </span>
  );
}
