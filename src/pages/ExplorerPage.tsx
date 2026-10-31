import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { fitBrandedTitle } from "@/lib/seoTitle";
import { deName, frSentenceCase } from "@/lib/frenchText";
import { displayText } from "@/lib/typography";
import { ArrowLeft, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Compass, X } from "@/lib/icons";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Link } from "@/lib/routerLinks";
import ToolLogo from "@/components/ToolLogo";
import Breadcrumb from "@/components/Breadcrumb";
import ToolCardImage from "@/components/tool/ToolCardImage";
import { useCategories, useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { useAddToStack } from "@/hooks/useAddToStack";
import { scrollToTop, scrollContainerCandidate } from "@/lib/scroll";
import { setSeoTags, setNoindex, removeNoindex, cleanupSeo, hasNonCanonicalSearchParams, SEO_BASE } from "@/lib/seo";
import { trackEvent, whenAnalyticsReady } from "@/lib/analytics";
import LoadingCaption from "@/components/motion/LoadingCaption";
import {
  buildExplorationCandidates,
  usesAuditedExplorationRelations,
  getExplorerHref,
  getExplorationToolKey,
  getObjectiveExplorationThemeId,
  getObjectiveExplorationThemes,
  parseExplorationSource,
  shortRelationReason,
  type ExplorationDirection,
} from "@/lib/toolExploration";

// First screenful only (3 rows on desktop): keeps each of the ~2,500
// prerendered Explorer pages light; the rest streams in on scroll.
const INITIAL_RESULT_COUNT = 12;
const RESULT_BATCH = 12;
const LOAD_MORE_DELAY = 240;
const explorerResultLimits = new Map<string, number>();
const MAX_SAVED_EXPLORER_STEPS = 100;

function rememberExplorerResultLimit(key: string, limit: number) {
  explorerResultLimits.delete(key);
  explorerResultLimits.set(key, limit);
  if (explorerResultLimits.size <= MAX_SAVED_EXPLORER_STEPS) return;
  const oldestKey = explorerResultLimits.keys().next().value;
  if (oldestKey) explorerResultLimits.delete(oldestKey);
}

interface ExplorerLocationState {
  explorerCanGoBack?: boolean;
  explorerReturnTo?: string;
  explorerStackSources?: string[];
  originLabel?: string;
  previousSourceLabel?: string;
  skipScrollReset?: boolean;
}

/** Column count from the grid's own width: Pinterest keeps 2 columns on
 *  phones and adds one per ~260px, up to 4. */
function useMasonryColumns() {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [columns, setColumns] = useState(3);
  useEffect(() => {
    if (!node) return;
    const update = () => setColumns(Math.max(2, Math.min(4, Math.floor((node.clientWidth + 20) / 260))));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return [setNode, columns] as const;
}

interface ExplorerFilterItem {
  id: string;
  label: string;
  count?: number;
}

/** A category needs this many tools to earn its own filter; smaller ones
 *  share "Others" so the bar stays a sorting tool, not a list of singletons. */
const MIN_CATEGORY_FILTER_COUNT = 3;
const OTHER_CATEGORY_ID = "autres";

function ExplorerTagFilterNav({
  activeId,
  ariaLabel,
  context,
  trailing,
  items,
  nextLabel,
  onSelect,
  previousLabel,
}: {
  activeId: string;
  ariaLabel: string;
  context?: ReactNode;
  trailing?: ReactNode;
  items: ExplorerFilterItem[];
  nextLabel: string;
  onSelect: (id: string) => void;
  previousLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stickySentinelRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });
  const [isPinned, setIsPinned] = useState(false);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const sentinel = stickySentinelRef.current;
    if (!sentinel) return;
    const scrollContainer = scrollContainerCandidate();
    const overflowY = scrollContainer ? window.getComputedStyle(scrollContainer).overflowY : "visible";
    const root = scrollContainer && (overflowY === "auto" || overflowY === "scroll") ? scrollContainer : null;
    const observer = new IntersectionObserver(([entry]) => setIsPinned(!entry?.isIntersecting), {
      root,
      threshold: 0,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const updateOverflow = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    setOverflow({
      left: track.scrollLeft > 2,
      right: track.scrollLeft < maxScroll - 2,
    });
  }, []);

  // Segmented-control thumb: one white pill that slides to the active item.
  const updateThumb = useCallback(() => {
    const active = trackRef.current?.querySelector<HTMLElement>(".ex-tag-filter-item.is-active");
    setThumb(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
  }, []);

  useEffect(() => {
    updateThumb();
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(updateThumb);
    observer.observe(track);
    return () => observer.disconnect();
  }, [activeId, items, updateThumb]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(track);
    track.addEventListener("scroll", updateOverflow, { passive: true });
    const frame = window.requestAnimationFrame(updateOverflow);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      track.removeEventListener("scroll", updateOverflow);
    };
  }, [items.length, updateOverflow]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const activeItem = [...track.querySelectorAll<HTMLElement>(".ex-tag-filter-item")]
      .find((item) => item.dataset.filterId === activeId);
    if (!activeItem) return;
    const target = activeItem.offsetLeft - (track.clientWidth - activeItem.offsetWidth) / 2;
    track.scrollTo({
      left: Math.max(0, target),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
    const timer = window.setTimeout(updateOverflow, 220);
    return () => window.clearTimeout(timer);
  }, [activeId, updateOverflow]);

  function scrollTags(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * Math.min(320, track.clientWidth * .72),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextIndex = event.key === "ArrowRight" ? Math.min(index + 1, items.length - 1) : Math.max(index - 1, 0);
    const next = items[nextIndex];
    if (!next) return;
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(".ex-tag-filter-item");
    buttons?.[nextIndex]?.focus();
    onSelect(next.id);
  }

  return (
    <>
    <span ref={stickySentinelRef} className="ex-tag-filter-sentinel" aria-hidden />
    <nav className={`ex-tag-filter${isPinned ? " is-pinned" : ""}`} aria-label={ariaLabel}>
      <div className="ex-tag-filter-surface">
        {context}
        <div className={`ex-tag-filter-scroll${overflow.left ? " has-left" : ""}${overflow.right ? " has-right" : ""}`}>
          <div ref={trackRef} className="ex-tag-filter-track">
            {thumb && (
              <span
                className="ex-tag-filter-thumb"
                aria-hidden
                style={{ transform: `translateX(${thumb.left}px)`, width: thumb.width }}
              />
            )}
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                data-filter-id={item.id}
                className={`ex-tag-filter-item${activeId === item.id ? " is-active" : ""}`}
                aria-pressed={activeId === item.id}
                onClick={() => onSelect(item.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                {item.label}
                {item.count !== undefined && <span className="ex-tag-filter-count">{item.count}</span>}
              </button>
            ))}
          </div>
          {overflow.left && (
            <button
              type="button"
              className="ex-tag-filter-control ex-tag-filter-control--left"
              data-tip={previousLabel}
              onClick={() => scrollTags(-1)}
              aria-label={previousLabel}
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
          )}
          {overflow.right && (
            <button
              type="button"
              className="ex-tag-filter-control ex-tag-filter-control--right"
              data-tip={nextLabel}
              onClick={() => scrollTags(1)}
              aria-label={nextLabel}
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          )}
        </div>
        {trailing}
      </div>
    </nav>
    </>
  );
}

function cleanCategoryLabel(value = "") {
  return value.replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

// Catalogue names kept in English on French pages; display-only, the
// catalogue (Supabase) stays the source of truth.
const FR_CATEGORY_LABELS: Record<string, string> = { Assets: "Ressources graphiques" };

function frenchCategoryLabel(name = "") {
  const clean = cleanCategoryLabel(name);
  return FR_CATEGORY_LABELS[clean] ?? frSentenceCase(clean);
}

function asSentenceContinuation(value: string) {
  return value ? `${value.charAt(0).toLocaleLowerCase()}${value.slice(1)}` : value;
}

export default function ExplorerPage() {
  const { lang, prefix, t } = useLang();
  const [masonryRef, masonryColumnCount] = useMasonryColumns();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug: routeSlug } = useParams<{ slug?: string }>();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { state, requestAddAccess } = useStackPins();
  const [resultLimit, setResultLimit] = useState(INITIAL_RESULT_COUNT);
  const { addToStack, flyingSlug: addingSlug } = useAddToStack();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // /explorer/around/:slug (indexable, one static page per tool) takes
  // priority over the legacy ?type=outil&source=X query form, which is
  // redirected below for anyone still hitting it.
  const source = useMemo(
    () => (routeSlug ? { type: "outil" as const, slug: routeSlug } : parseExplorationSource(searchParams)),
    [routeSlug, searchParams],
  );

  useEffect(() => {
    if (routeSlug || searchParams.get("type") !== "outil") return;
    const legacySlug = searchParams.get("source");
    if (!legacySlug) return;
    const rest = new URLSearchParams(searchParams);
    rest.delete("type");
    rest.delete("source");
    const query = rest.toString();
    navigate(`${prefix}/explorer/around/${encodeURIComponent(legacySlug)}${query ? `?${query}` : ""}`, { replace: true });
  }, [navigate, prefix, routeSlug, searchParams]);

  const explorerHistoryKey = `${location.key}:${location.pathname}${location.search}`;
  const requestedDestinationId = searchParams.get("destination");
  const destination = state.needs.find((need) => need.id === requestedDestinationId) || null;
  const locationState = (location.state || {}) as ExplorerLocationState;
  const toolBySlug = useMemo(() => new Map(tools.flatMap((tool) => [[getExplorationToolKey(tool), tool], [tool.id, tool]] as [string, ToolSummary][])), [tools]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const getCategoryLabel = useCallback((tool: ToolSummary) => {
    const category = categoryById.get(tool.categoryId);
    // French labels are stored in Title Case; the site writes sentence case.
    if (category) return lang === "en" ? cleanCategoryLabel(category.nameEn || category.name) : frenchCategoryLabel(category.name);
    const fallback = cleanCategoryLabel(tool.categoryId).replace(/[-_]+/g, " ");
    return fallback ? `${fallback.charAt(0).toLocaleUpperCase(lang)}${fallback.slice(1)}` : fallback;
  }, [categoryById, lang]);
  const sourceNeed = source?.type === "objectif" ? state.needs.find((need) => need.id === source.id) || null : null;
  const sourceTool = source?.type === "outil" ? toolBySlug.get(source.slug) || null : null;
  const isStackSource = source?.type === "stack";
  const objectiveSourceSnapshot = useRef<{ id: string; slugs: string[] } | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  if (source?.type === "objectif" && objectiveSourceSnapshot.current?.id !== source.id) {
    objectiveSourceSnapshot.current = {
      id: source.id,
      slugs: state.toolEntries.filter((entry) => entry.needIds.includes(source.id)).map((entry) => entry.toolSlug),
    };
  }
  const sourceTools = useMemo(() => {
    if (!source) return [] as ToolSummary[];
    if (source.type === "outil") {
      const tool = toolBySlug.get(source.slug);
      return tool ? [tool] : [];
    }
    if (source.type === "stack") {
      const slugs = Array.isArray(locationState.explorerStackSources)
        ? locationState.explorerStackSources
        : state.toolEntries.filter((entry) => entry.intent === "stack").map((entry) => entry.toolSlug);
      return Array.from(new Map(slugs.flatMap(slug => {
        const tool = toolBySlug.get(slug);
        return tool ? [[tool.id, tool] as const] : [];
      })).values());
    }
    const slugs = objectiveSourceSnapshot.current?.id === source.id
      ? objectiveSourceSnapshot.current.slugs
      : state.toolEntries.filter((entry) => entry.needIds.includes(source.id)).map((entry) => entry.toolSlug);
    return slugs.map((slug) => toolBySlug.get(slug)).filter(Boolean) as ToolSummary[];
  }, [source, state.toolEntries, toolBySlug, locationState.explorerStackSources]);
  // Preserve the session's seed tools in history: saving an idea updates its
  // saved state without turning it into a new seed and reshuffling the feed.
  useEffect(() => {
    if (!isStackSource || Array.isArray(locationState.explorerStackSources) || sourceTools.length === 0) return;
    navigate(`${location.pathname}${location.search}`, { replace: true, preventScrollReset: true,
      state: { ...locationState, skipScrollReset: true, explorerStackSources: sourceTools.map(getExplorationToolKey) } });
  }, [isStackSource, location.pathname, location.search, locationState, navigate, sourceTools]);
  const sourceLabel = isStackSource
    ? t("Ma stack", "My stack") as string
    : sourceTool?.name || (sourceNeed ? t(sourceNeed.labelFr, sourceNeed.labelEn) as string : t("Source inconnue", "Unknown source") as string);
  const isObjectiveSource = source?.type === "objectif";
  const angleParam = searchParams.get("angle");
  const angle: ExplorationDirection = angleParam === "alternatives" || angleParam === "extensions" || angleParam === "adjacent" ? angleParam : "all";
  const auditedRelations = source?.type === "outil" && usesAuditedExplorationRelations(sourceTools);
  const candidates = useMemo(() => buildExplorationCandidates({
    relationPolicy: auditedRelations ? "audited" : "legacy",
    destinationId: destination?.id,
    getCategoryLabel,
    sourceTools,
    stackEntries: state.toolEntries,
    tools,
  }), [auditedRelations, destination?.id, getCategoryLabel, sourceTools, state.toolEntries, tools]);
  const objectiveThemes = useMemo(() => isObjectiveSource
    ? getObjectiveExplorationThemes(source.id, candidates)
    : [], [candidates, isObjectiveSource, source]);
  const requestedThemeId = searchParams.get("theme");
  const activeThemeId = isObjectiveSource && objectiveThemes.some((theme) => theme.id === requestedThemeId) ? requestedThemeId : null;
  const toolCategoryFilters = useMemo(() => {
    if (!sourceTool) return [] as Array<{ id: string; label: string; count: number }>;
    const grouped = new Map<string, { id: string; label: string; count: number }>();
    candidates.forEach((candidate) => {
      const id = candidate.tool.categoryId;
      const label = candidate.categoryLabel;
      if (!id || !label) return;
      const current = grouped.get(id);
      if (current) current.count += 1;
      else grouped.set(id, { id, label, count: 1 });
    });
    const sorted = [...grouped.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, lang));
    const kept = sorted.filter((category) => category.count >= MIN_CATEGORY_FILTER_COUNT);
    const otherCount = sorted.reduce((sum, category) => sum + (category.count < MIN_CATEGORY_FILTER_COUNT ? category.count : 0), 0);
    // The rail always shows (page structure stays the same from one tool to
    // the next), even when a single category holds everything.
    if (!kept.length) return [];
    return otherCount
      ? [...kept, { id: OTHER_CATEGORY_ID, label: t("Autres", "Others") as string, count: otherCount }]
      : kept;
  }, [candidates, lang, sourceTool, t]);
  const keptCategoryIds = useMemo(
    () => new Set(toolCategoryFilters.filter((category) => category.id !== OTHER_CATEGORY_ID).map((category) => category.id)),
    [toolCategoryFilters],
  );
  // Local mirror of ?category so a filter switch can render synchronously
  // inside a view transition; the URL catches up right after.
  const [categoryOverride, setCategoryOverride] = useState<string | null | undefined>(undefined);
  useEffect(() => setCategoryOverride(undefined), [searchParams]);
  const requestedCategoryId = categoryOverride !== undefined ? categoryOverride : searchParams.get("category");
  const activeCategoryId = sourceTool && toolCategoryFilters.some((category) => category.id === requestedCategoryId)
    ? requestedCategoryId
    : null;
  const filteredCandidates = isObjectiveSource
    ? activeThemeId ? candidates.filter((candidate) => getObjectiveExplorationThemeId(source.id, candidate.tool) === activeThemeId) : candidates
    : sourceTool
      ? candidates.filter((candidate) => (
        !activeCategoryId
        || (activeCategoryId === OTHER_CATEGORY_ID ? !keptCategoryIds.has(candidate.tool.categoryId) : candidate.tool.categoryId === activeCategoryId)
      ) && (angle === "all" || candidate.direction === angle))
    : angle === "all" ? candidates : candidates.filter((candidate) => candidate.direction === angle);
  const visibleCandidates = filteredCandidates.slice(0, resultLimit);
  const hasMoreCandidates = visibleCandidates.length < filteredCandidates.length;
  const sourceKey = source?.type === "objectif" ? `objectif:${source.id}` : source?.type === "outil" ? `outil:${source.slug}` : source?.type === "stack" ? "stack:ma-stack" : "unknown";

  const hasSourceTools = sourceTools.length > 0;
  const sourceType = source?.type;
  const lastMeasuredSource = useRef<string | null>(null);
  useEffect(() => {
    if (!sourceType || !hasSourceTools) return;
    return whenAnalyticsReady(() => {
      if (lastMeasuredSource.current === sourceKey) return;
      lastMeasuredSource.current = sourceKey;
      trackEvent("explorer_view", { source_type: sourceType });
    });
  }, [sourceKey, sourceType, hasSourceTools]);

  useEffect(() => {
    setResultLimit(INITIAL_RESULT_COUNT);
    loadingMoreRef.current = false;
    setIsLoadingMore(false);
  }, [activeCategoryId, activeThemeId, angle, sourceKey]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMoreCandidates) return;

    const scrollContainer = scrollContainerCandidate();
    const overflowY = scrollContainer ? window.getComputedStyle(scrollContainer).overflowY : "visible";
    const root = scrollContainer && (overflowY === "auto" || overflowY === "scroll") ? scrollContainer : null;
    let timer = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setIsLoadingMore(true);
      observer.unobserve(sentinel);
      timer = window.setTimeout(() => {
        setResultLimit((current) => Math.min(current + RESULT_BATCH, filteredCandidates.length));
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      }, LOAD_MORE_DELAY);
    }, { root, rootMargin: "0px 0px 420px", threshold: 0.01 });

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [filteredCandidates.length, hasMoreCandidates, resultLimit, sourceKey]);

  useEffect(() => {
    setResultLimit(explorerResultLimits.get(explorerHistoryKey) ?? INITIAL_RESULT_COUNT);
  }, [explorerHistoryKey]);

  useEffect(() => {
    rememberExplorerResultLimit(explorerHistoryKey, resultLimit);
  }, [explorerHistoryKey, resultLimit]);

  /* The explorer is driven by query params (type, source, destination, angle,
     theme), so every filter combination is technically a distinct URL. Only
     two shapes are worth indexing on their own: the bare /explorer landing
     page, and a "type=outil" source ("explore around Notion") — that one has
     genuine standalone long-tail value and gets its own title/description/
     canonical below. The "objectif" and "stack" sources are derived from a
     user's own picks and don't carry unique enough content to index; they
     stay noindexed and fall back to the generic explorer copy.

     This page is deliberately NOT an "alternatives to X" page — that's
     tool/{slug}/alternatives (close substitutes, same job). Explorer surfaces
     the adjacent/satellite ecosystem around a tool (a Pinterest-style "tools
     that pair with X"), a different selection and a different search intent.
     Title/description must stay differentiated from the alternatives page's
     copy so the two don't compete for the same query. */
  useEffect(() => {
    if (source?.type === "outil" && sourceTool) {
      setSeoTags({
        title: lang === "en"
          ? fitBrandedTitle(`Tools that pair with ${sourceLabel}`)
          : fitBrandedTitle(`Outils à associer à ${sourceLabel}`),
        description: lang === "en"
          ? `Explore the tool ecosystem around ${sourceLabel}: complementary and adjacent picks to build a stack, curated by ToolTrim.`
          : `Explorez l'écosystème d'outils autour ${deName(sourceLabel)} : outils complémentaires et satellites pour composer votre stack, sélectionnés par ToolTrim.`,
        url: `${SEO_BASE}/${lang}/explorer/around/${encodeURIComponent(source.slug)}`,
        locale: lang === "en" ? "en_US" : "fr_FR",
      });
    } else {
      setSeoTags({
        title: lang === "en"
          ? "Explore SaaS tools by need | ToolTrim"
          : "Explorer les outils SaaS par besoin | ToolTrim",
        description: lang === "en"
          ? "Browse ToolTrim's SaaS catalogue by objective, category or workflow, and build a stack that fits how you actually work."
          : "Parcourez le catalogue SaaS de ToolTrim par objectif, catégorie ou workflow, et composez une stack adaptée à votre façon de travailler.",
        url: `${SEO_BASE}/${lang}/explorer`,
        locale: lang === "en" ? "en_US" : "fr_FR",
      });
    }
    // « Around a tool » pages are noindex too since 19/10/2026 (thin lists).
    if (hasNonCanonicalSearchParams(searchParams) || source?.type === "objectif" || source?.type === "stack" || source?.type === "outil") setNoindex();
    else removeNoindex();
    return () => {
      removeNoindex();
      cleanupSeo([]);
    };
  }, [lang, sourceKey, sourceLabel, source, sourceTool, searchParams]);

  const fallbackHref = source?.type === "stack"
    ? `${prefix}/ma-stack`
    : source?.type === "objectif"
    ? `${prefix}/ma-stack?objectif=${encodeURIComponent(source.id)}`
    : source?.type === "outil"
      ? `${prefix}/tool/${encodeURIComponent(source.slug)}`
      : `${prefix}/tools`;
  const previousLabel = locationState.previousSourceLabel || sourceLabel;
  const originLabel = locationState.originLabel || locationState.previousSourceLabel || sourceLabel;
  const sourceDescription = sourceTool?.shortDescription
    ? t(sourceTool.shortDescription, sourceTool.shortDescriptionEn || sourceTool.shortDescription) as string
    : null;

  function handleBack() {
    trackEvent("explorer_back", { source_type: source?.type });
    if (locationState.explorerCanGoBack) {
      navigate(-1);
      return;
    }
    navigate(locationState.explorerReturnTo || fallbackHref);
  }

  function setAngle(nextAngle: ExplorationDirection, shouldScroll = true) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextAngle === "all") nextParams.delete("angle");
    else nextParams.set("angle", nextAngle);
    setSearchParams(nextParams, { replace: true, state: { ...locationState, skipScrollReset: true } });
    if (shouldScroll) scrollToTop(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  }

  function setTheme(themeId: string | null, shouldScroll = true) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("angle");
    if (themeId) nextParams.set("theme", themeId);
    else nextParams.delete("theme");
    setSearchParams(nextParams, { replace: true, state: { ...locationState, skipScrollReset: true } });
    if (shouldScroll) scrollToTop(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  }

  function setCategory(categoryId: string | null, shouldScroll = true) {
    // Cards morph to their new places (shared-element view transition)
    // instead of the grid being swapped; plain update where unsupported.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
    if (!shouldScroll && !reduceMotion && doc.startViewTransition) {
      doc.startViewTransition(() => flushSync(() => setCategoryOverride(categoryId)));
    }
    const nextParams = new URLSearchParams(searchParams);
    if (categoryId) nextParams.set("category", categoryId);
    else nextParams.delete("category");
    setSearchParams(nextParams, { replace: true, state: { ...locationState, skipScrollReset: true } });
    if (shouldScroll) scrollToTop(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  }

  function clearToolFilters() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("angle");
    nextParams.delete("category");
    setSearchParams(nextParams, { replace: true, state: { ...locationState, skipScrollReset: true } });
  }

  // Mon Stack V1: one click adds the tool (no collection dialog); the
  // shared story flies it to "Ma stack" and confirms with Undo/View. A
  // destination from the URL is still honoured.
  function addTool(tool: ToolSummary, origin?: Element | null, logoFrom?: Element | null) {
    if (!requestAddAccess()) return;
    const slug = getExplorationToolKey(tool);
    if (addingSlug === slug) return;
    addToStack(slug, tool.name, {
      origin,
      logoFrom,
      needIds: destination ? [destination.id] : [],
      onAdded: () => trackEvent("explorer_save", { source_type: source?.type, intent: "stack" }),
    });
  }

  if (!source || sourceTools.length === 0) {
    return (
      <main className="ex-page ex-page--empty">
        <Compass size={28} aria-hidden />
        <h1>{isStackSource ? t("Ajoutez un outil pour explorer", "Add a tool to start exploring") : t("Cette source n’est plus disponible", "This source is no longer available")}</h1>
        {!isStackSource && <p>{t("Revenez au catalogue pour choisir un outil à explorer.", "Return to the catalog and choose a tool to explore.")}</p>}
        <Link to={`${prefix}/${isStackSource ? "ma-stack" : "tools"}`}>{isStackSource ? t("Ma stack", "My stack") : t("Voir les outils", "View tools")}</Link>
      </main>
    );
  }

  const floatingFilterItems: ExplorerFilterItem[] = isObjectiveSource
    ? [
      { id: "all", label: t("Toutes les idées", "All ideas") as string },
      ...objectiveThemes.map((theme) => ({ id: theme.id, label: t(theme.labelFr, theme.labelEn) as string })),
    ]
    : sourceTool ? [
      { id: "all", label: t("Tout", "All") as string, count: candidates.length },
      ...toolCategoryFilters.map((category) => ({ id: category.id, label: category.label, count: category.count })),
    ] : [
      { id: "all", label: t("Tout", "All") as string },
      { id: "alternatives", label: t("Alternatives", "Alternatives") as string },
      { id: "extensions", label: t("Extensions", "Extensions") as string },
      { id: "adjacent", label: auditedRelations ? t("Outils liés", "Related tools") : t("Outils complémentaires", "Complementary tools") as string },
    ];
  const sourceToolSlug = sourceTool ? getExplorationToolKey(sourceTool) : null;
  const sourceStackEntry = sourceToolSlug ? state.toolEntries.find((entry) => entry.toolSlug === sourceToolSlug) : null;
  const sourceAlreadyAdded = destination
    ? Boolean(sourceStackEntry?.needIds.includes(destination.id))
    : Boolean(sourceStackEntry);
  const sourceIsAdding = Boolean(sourceToolSlug && addingSlug === sourceToolSlug);
  const gridCandidates = [...visibleCandidates];
  const activeFilterId = isObjectiveSource ? activeThemeId || "all" : sourceTool ? activeCategoryId || "all" : angle;
  const tagFilters = (
    <ExplorerTagFilterNav
      activeId={activeFilterId}
      ariaLabel={sourceTool
        ? t("Filtrer les outils par catégorie", "Filter tools by category") as string
        : t("Trier les outils par thème", "Sort tools by theme") as string}
      items={floatingFilterItems}
      nextLabel={t("Voir les tags suivants", "View next tags") as string}
      previousLabel={t("Voir les tags précédents", "View previous tags") as string}
      context={sourceTool ? (
        <div className="ex-filter-context">
          <button
            type="button"
            className="ex-filter-context-back"
            data-tip={t(`Retour à ${previousLabel}`, `Back to ${previousLabel}`) as string}
            onClick={handleBack}
            aria-label={t(`Retour à ${previousLabel}`, `Back to ${previousLabel}`) as string}
          >
            <ArrowLeft size={18} aria-hidden />
          </button>
          <ToolLogo tool={sourceTool} size={28} />
          <strong className="ex-filter-context-name">{sourceLabel}</strong>
          <span className="ex-filter-context-divider" aria-hidden />
        </div>
      ) : undefined}
      trailing={(
        <Link to={`${prefix}/ma-stack`} className="ex-filter-stack" data-tip={t("Voir ma stack", "View my stack") as string} aria-label={`${t("Ma stack", "My stack")} · ${state.pinnedToolSlugs.length}`}>
          <span className="ex-filter-stack-icon">
            <Bookmark size={16} aria-hidden />
            {state.pinnedToolSlugs.length > 0 && (
              <span key={state.pinnedToolSlugs.length} className="ex-filter-stack-count" aria-hidden>{state.pinnedToolSlugs.length}</span>
            )}
          </span>
          <span className="ex-filter-stack-label">{t("Ma stack", "My stack")}</span>
        </Link>
      )}
      onSelect={(id) => {
        if (isObjectiveSource) setTheme(id === "all" ? null : id, false);
        else if (sourceTool) setCategory(id === "all" ? null : id, false);
        else setAngle(id as ExplorationDirection, false);
      }}
    />
  );

  // Pinterest placement: each card goes to the currently shortest column,
  // estimated from its image ratio and text lines, so the relevance order
  // still reads left to right while heights stagger.
  const masonryColumns = Array.from({ length: masonryColumnCount }, () => [] as typeof gridCandidates);
  const columnHeights = Array.from({ length: masonryColumnCount }, () => 0);
  gridCandidates.forEach((candidate) => {
    const hasImage = Boolean(candidate.tool.ogImageUrl || (Array.isArray(candidate.tool.covers) && typeof candidate.tool.covers[0] === "string"));
    const descriptionLines = Math.min(1, Math.ceil(((t(candidate.tool.shortDescription, candidate.tool.shortDescriptionEn || candidate.tool.shortDescription) as string) || "").length / 45));
    const estimate = (hasImage ? 21 / 40 : 1) * 100 + 12 + (candidate.reasonFr ? 6 : 0) + descriptionLines * 6;
    const target = columnHeights.indexOf(Math.min(...columnHeights));
    masonryColumns[target].push(candidate);
    columnHeights[target] += estimate;
  });

  const renderCandidateCard = (candidate: (typeof visibleCandidates)[number]) => {
    const slug = getExplorationToolKey(candidate.tool);
    const isAdding = addingSlug === slug;
    const inDestination = candidate.stackState === "in-destination";
    const inStackWithoutDestination = !destination && candidate.stackState === "in-stack";
    const description = t(
      candidate.tool.shortDescription,
      candidate.tool.shortDescriptionEn || candidate.tool.shortDescription,
    ) as string;
    const fullReason = t(candidate.reasonFr, candidate.reasonEn) as string;
    // On a single-tool page its name is the title: drop it from the label.
    const reason = sourceTool ? shortRelationReason(fullReason, sourceTool.name) : fullReason;
    const previewUrl = candidate.tool.ogImageUrl
      || (Array.isArray(candidate.tool.covers) && typeof candidate.tool.covers[0] === "string" ? candidate.tool.covers[0] : "");

    const candidateHref = getExplorerHref(prefix, { type: "outil", slug: getExplorationToolKey(candidate.tool) }, {
      angle: isObjectiveSource ? "all" : angle,
      destination: destination?.id,
    });
    const candidateLinkState = {
      ...locationState,
      explorerCanGoBack: true,
      originLabel,
      previousSourceLabel: sourceLabel,
      skipScrollReset: false,
    } satisfies ExplorerLocationState;

    return (
      <article key={slug} data-tool-slug={slug} className={`ex-card${inDestination || inStackWithoutDestination ? " is-present" : ""}${isAdding ? " is-adding" : ""}`}>
        <div className="ex-card-actions" aria-label={t(`Actions pour ${candidate.tool.name}`, `Actions for ${candidate.tool.name}`) as string}>
          <button type="button" onClick={(event) => addTool(candidate.tool, event.currentTarget, event.currentTarget.closest(".ex-card"))} disabled={inDestination || inStackWithoutDestination || isAdding} aria-label={inDestination
            ? t(`${candidate.tool.name} déjà dans ${destination?.labelFr}`, `${candidate.tool.name} already in ${destination?.labelEn}`) as string
            : inStackWithoutDestination
              ? t(`${candidate.tool.name} déjà dans Ma stack`, `${candidate.tool.name} already in My stack`) as string
              : destination && candidate.stackState === "in-stack"
                ? t(`Ajouter ${candidate.tool.name} à ${destination.labelFr}`, `Add ${candidate.tool.name} to ${destination.labelEn}`) as string
                : t(`Ajouter ${candidate.tool.name} à Ma stack`, `Add ${candidate.tool.name} to My stack`) as string}
            data-tip={inDestination || inStackWithoutDestination
              ? t("Déjà dans ma stack", "Already in my stack") as string
              : t("Ajouter à ma stack", "Add to my stack") as string}
          >
            {inDestination || inStackWithoutDestination || isAdding ? <BookmarkCheck size={16} aria-hidden /> : <Bookmark size={16} aria-hidden />}
            <span aria-hidden>{inDestination || inStackWithoutDestination || isAdding ? t("Ajouté", "Added") : t("Ajouter", "Add")}</span>
          </button>
        </div>
        <Link
          to={candidateHref}
          state={candidateLinkState}
          className="ex-card-main"
          aria-label={t(`Explorer autour ${deName(candidate.tool.name)}`, `Explore around ${candidate.tool.name}`) as string}
          aria-describedby={reason ? `explore-card-${slug}-relation explore-card-${slug}-description` : `explore-card-${slug}-description`}
          onClick={() => trackEvent("explorer_recenter", { tool_slug: slug })}
        >
          <span className={`ex-card-media${previewUrl ? "" : " is-logo"}`}>
            {previewUrl ? (
              <img src={previewUrl} alt="" loading="lazy" />
            ) : (
              <ToolLogo tool={candidate.tool} size={72} />
            )}
            <span className="ex-card-explore" aria-hidden>
              <Compass size={20} aria-hidden />
            </span>
          </span>
        </Link>
        <div className="ex-card-content">
          <div className="ex-card-header">
            <ToolLogo tool={candidate.tool} size={24} className="tce-logo ex-card-logo" />
            {/* Same target as the media link: kept for mouse users, skipped by Tab. */}
            <Link to={candidateHref} state={candidateLinkState} className="ex-card-identity" tabIndex={-1}>
              <strong>{candidate.tool.name}</strong>
            </Link>
          </div>
          {/* A reason only when it names something precise (decision 2026-10-16):
              audited relations, or a shared use with a curated label. */}
          {reason && <p id={`explore-card-${slug}-relation`} className="ex-card-relation">{reason}</p>}
          <p id={`explore-card-${slug}-description`} className="ex-card-description">{displayText(description, lang)}</p>
        </div>
      </article>
    );
  };

  return (
    <>
    <Breadcrumb
      items={[
        { label: t("Explorer", "Explore") as string },
        ...(sourceTool ? [{ label: sourceLabel }] : []),
      ]}
      includeSchema={false}
    />
    <main className={`ex-page${isObjectiveSource ? "" : " ex-page--tool"}`} aria-labelledby="explorer-title">
      {!isObjectiveSource && !sourceTool && tagFilters}
      {isStackSource ? (
        <header className="ex-source-banner ex-source-banner--objective">
          <button type="button" className="ex-back" onClick={handleBack} aria-label={t("Retour à Ma stack", "Back to My stack") as string}>
            <ArrowLeft size={19} aria-hidden />
          </button>
          <div className="ex-objective-heading">
            <span>{t("Exploration continue", "Continuous exploration")}</span>
            <h1 id="explorer-title">{t("Des pistes à partir de votre stack", "Ideas from your stack")}</h1>
          </div>
        </header>
      ) : isObjectiveSource ? (
        <header className="ex-source-banner ex-source-banner--objective">
          <button type="button" className="ex-back" onClick={handleBack} aria-label={t(`Retour à ${previousLabel}`, `Back to ${previousLabel}`) as string}>
            <ArrowLeft size={19} aria-hidden />
          </button>
          <div className="ex-objective-heading">
            <h1 id="explorer-title">{t(
              `Ajouter des outils pour ${asSentenceContinuation(sourceLabel)}`,
              `Add tools to ${asSentenceContinuation(sourceLabel)}`,
            )}</h1>
          </div>
        </header>
      ) : sourceTool && (
        <section className="ex-tool-stage" aria-label={t(`Explorer autour ${deName(sourceLabel)}`, `Explore around ${sourceLabel}`) as string}>
        <header className="ex-tool-focus">
          <div className="ex-tool-focus-main">
            <div className="ex-tool-focus-media">
              <ToolCardImage tool={sourceTool} logoSize={112} className="ex-tool-focus-visual" />
            </div>
            <div className="ex-tool-focus-content">
              <span className="ex-tool-focus-eyebrow">
                {displayText(t(`Explorer · Ce qui va avec ${sourceLabel}`, `Explore · What goes with ${sourceLabel}`) as string, lang)}
                {originLabel !== sourceLabel && <> · {t(`depuis ${originLabel}`, `from ${originLabel}`)}</>}
              </span>
              <div className="ex-tool-focus-title">
                <ToolLogo tool={sourceTool} size={64} className="ex-card-logo ex-tool-focus-logo" />
                <div>
                  <h1 id="explorer-title" className={sourceLabel.length > 12 ? "is-long" : undefined}>{sourceLabel}</h1>
                  <span>{getCategoryLabel(sourceTool)}</span>
                </div>
              </div>
              {sourceDescription && <p>{displayText(sourceDescription, lang)}</p>}
              <div className="ex-tool-focus-footer">
                <Link
                  className="ex-tool-focus-profile"
                  to={`${prefix}/tool/${getExplorationToolKey(sourceTool)}`}
                  aria-label={t(`Voir la fiche ${sourceLabel}`, `View the ${sourceLabel} profile`) as string}
                >
                  {/* Short label keeps both actions on one line; the name is
                      already the title right above. */}
                  {t("Voir la fiche", "View profile")}
                  <span aria-hidden>→</span>
                </Link>
                <button
                  type="button"
                  className={`ex-destination ex-tool-focus-add${sourceAlreadyAdded ? " is-added" : ""}`}
                  disabled={sourceAlreadyAdded || sourceIsAdding}
                  onClick={(event) => addTool(sourceTool, event.currentTarget, event.currentTarget.closest(".ex-tool-focus"))}
                  aria-label={destination
                    ? sourceAlreadyAdded
                      ? t(`${sourceLabel} déjà dans ${destination.labelFr}`, `${sourceLabel} already in ${destination.labelEn}`) as string
                      : t(`Ajouter ${sourceLabel} à ${destination.labelFr}`, `Add ${sourceLabel} to ${destination.labelEn}`) as string
                    : sourceAlreadyAdded
                      ? t(`${sourceLabel} déjà dans Ma stack`, `${sourceLabel} already in My stack`) as string
                      : t(`Ajouter ${sourceLabel} à Ma stack`, `Add ${sourceLabel} to My stack`) as string}
                >
                  {sourceAlreadyAdded ? <BookmarkCheck size={16} aria-hidden /> : <Bookmark size={16} aria-hidden />}
                  <span>{destination
                    ? sourceAlreadyAdded
                      ? t(`Déjà dans ${destination.labelFr}`, `Already in ${destination.labelEn}`)
                      : t(`Ajouter à ${destination.labelFr}`, `Add to ${destination.labelEn}`)
                    : sourceAlreadyAdded
                      ? t("Dans Ma stack", "In My stack")
                      : t("Ajouter à Ma stack", "Add to My stack")}</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        </section>
      )}

      {visibleCandidates.length > 0 && (
        <header className="ex-results-heading">
          <div>
            <h2>{sourceTool
              ? t(`Outils à découvrir autour ${deName(sourceLabel)}`, `Tools to discover around ${sourceLabel}`)
              : t("Outils recommandés", "Recommended tools")}</h2>
          </div>
          {/* Tool sources show their counts in the filter control below. */}
          {!sourceTool && <p>{t(
            `${filteredCandidates.length} outil${filteredCandidates.length > 1 ? "s" : ""}`,
            `${filteredCandidates.length} tool${filteredCandidates.length > 1 ? "s" : ""}`,
          )}</p>}
        </header>
      )}
      {/* Section title first, then its filter: the control belongs to the
          results it sorts instead of floating between hero and title. */}
      {(isObjectiveSource || Boolean(sourceTool)) && tagFilters}
      {/* Active relation filter (from a "See all" or an old link): one
          removable pill under the filters, centred on the same axis. */}
      {sourceTool && angle !== "all" && (
        <div className="ex-angle-filter">
          <button type="button" className="ex-angle-pill" onClick={() => setAngle("all", false)} aria-label={t("Voir toutes les relations", "Show all relations") as string}>
            <span>{angle === "alternatives" ? t("Alternatives", "Alternatives")
              : angle === "extensions" ? t("Extensions", "Extensions")
              : t("Outils liés", "Related tools")}</span>
            <X size={14} aria-hidden />
          </button>
        </div>
      )}

      {visibleCandidates.length > 0 ? (
        gridCandidates.length > 0 && <section ref={masonryRef} className="ex-grid ex-masonry" style={{ "--ex-cols": masonryColumnCount } as CSSProperties} aria-label={t("Outils associés", "Related tools") as string}>
          <div className="ex-masonry-columns">
            {masonryColumns.map((column, index) => (
              <div key={index} className="ex-masonry-column">{column.map(renderCandidateCard)}</div>
            ))}
          </div>
          {hasMoreCandidates && (
            <>
              {isLoadingMore && <LoadingCaption phrases={[t("On aiguise les ciseaux…", "Sharpening the scissors…"), t("On compare les prix…", "Comparing prices…"), t("On vérifie les doublons…", "Checking for overlaps…")]} />}
              {isLoadingMore && (
                <div className="ex-masonry-columns ex-masonry-skeletons" aria-hidden="true">
                  {Array.from({ length: Math.min(masonryColumnCount, filteredCandidates.length - visibleCandidates.length) }, (_, index) => (
                    <div key={`skeleton-${index}`} className="ex-pin-skeleton">
                      <span className="ex-skeleton ex-pin-skeleton-media" />
                      <span className="ex-skeleton ex-pin-skeleton-title" />
                      <span className="ex-skeleton ex-pin-skeleton-line" />
                    </div>
                  ))}
                </div>
              )}
              <div ref={loadMoreRef} className="ex-load-sentinel" role="status" aria-live="polite">
                <span className="sr-only">{isLoadingMore
                  ? t("Chargement de nouveaux outils", "Loading more tools")
                  : t("Faites défiler pour découvrir plus d’outils", "Scroll to discover more tools")}</span>
              </div>
            </>
          )}
          {!hasMoreCandidates && filteredCandidates.length > INITIAL_RESULT_COUNT && (
            <div className="ex-list-end">
              <span>{t(`${filteredCandidates.length} outils parcourus`, `${filteredCandidates.length} tools browsed`)}</span>
              <button type="button" onClick={() => document.querySelector(".ex-results-heading")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" })}>
                {t("Revenir aux filtres", "Back to filters")}
              </button>
            </div>
          )}
        </section>
      ) : (
        <section className="ex-empty">
          <Compass size={24} aria-hidden />
          <h2>{isObjectiveSource ? t("Aucun outil dans cette thématique", "No tools in this theme") : t("Aucun outil pour ce filtre", "No tools for this filter")}</h2>
          <button type="button" onClick={() => isObjectiveSource ? setTheme(null) : sourceTool ? clearToolFilters() : setAngle("all")}>{t("Voir tous les outils", "See all tools")}</button>
        </section>
      )}
    </main>
    </>
  );
}
