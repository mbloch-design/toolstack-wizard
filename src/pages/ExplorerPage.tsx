import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Compass, Plus } from "lucide-react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import ToolLogo from "@/components/ToolLogo";
import ToolCardImage from "@/components/tool/ToolCardImage";
import StackSaveDialog from "@/components/stack/StackSaveDialog";
import { useCategories, useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { classifyToolForStack } from "@/lib/stackAutoClassification";
import { scrollToTop } from "@/lib/scroll";
import { setSeoTags, setNoindex, removeNoindex, cleanupSeo, SEO_BASE } from "@/lib/seo";
import {
  buildExplorationCandidates,
  getExplorerHref,
  getExplorationToolKey,
  getObjectiveExplorationThemeId,
  getObjectiveExplorationThemes,
  parseExplorationSource,
  type ExplorationDirection,
} from "@/lib/toolExploration";

const INITIAL_RESULT_COUNT = 20;
const RESULT_BATCH = 12;
const SKELETON_COUNT = 4;
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
  originLabel?: string;
  previousSourceLabel?: string;
  skipScrollReset?: boolean;
}

interface ExplorerFilterItem {
  id: string;
  label: string;
}

function ExplorerTagFilterNav({
  activeId,
  ariaLabel,
  context,
  items,
  nextLabel,
  onSelect,
  previousLabel,
}: {
  activeId: string;
  ariaLabel: string;
  context?: ReactNode;
  items: ExplorerFilterItem[];
  nextLabel: string;
  onSelect: (id: string) => void;
  previousLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stickySentinelRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const sentinel = stickySentinelRef.current;
    if (!sentinel) return;
    const scrollContainer = document.getElementById("main-content");
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
        <div className="ex-tag-filter-scroll">
          <div ref={trackRef} className="ex-tag-filter-track">
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
              </button>
            ))}
          </div>
          {overflow.left && (
            <button
              type="button"
              className="ex-tag-filter-control ex-tag-filter-control--left"
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
              onClick={() => scrollTags(1)}
              aria-label={nextLabel}
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </nav>
    </>
  );
}

function cleanCategoryLabel(value = "") {
  return value.replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

function asSentenceContinuation(value: string) {
  return value ? `${value.charAt(0).toLocaleLowerCase()}${value.slice(1)}` : value;
}

export default function ExplorerPage() {
  const { lang, prefix, t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug: routeSlug } = useParams<{ slug?: string }>();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { state, createNeed, saveToolSelection } = useStackPins();
  const [resultLimit, setResultLimit] = useState(INITIAL_RESULT_COUNT);
  const [addingSlug, setAddingSlug] = useState<string | null>(null);
  const [pendingTool, setPendingTool] = useState<ToolSummary | null>(null);
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
  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [getExplorationToolKey(tool), tool])), [tools]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const getCategoryLabel = useCallback((tool: ToolSummary) => {
    const category = categoryById.get(tool.categoryId);
    if (category) return cleanCategoryLabel(lang === "en" ? category.nameEn || category.name : category.name);
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
      return state.toolEntries
        .filter((entry) => entry.intent === "stack")
        .map((entry) => toolBySlug.get(entry.toolSlug))
        .filter(Boolean) as ToolSummary[];
    }
    const slugs = objectiveSourceSnapshot.current?.id === source.id
      ? objectiveSourceSnapshot.current.slugs
      : state.toolEntries.filter((entry) => entry.needIds.includes(source.id)).map((entry) => entry.toolSlug);
    return slugs.map((slug) => toolBySlug.get(slug)).filter(Boolean) as ToolSummary[];
  }, [source, state.toolEntries, toolBySlug]);
  const sourceLabel = isStackSource
    ? t("Ma stack", "My stack") as string
    : sourceTool?.name || (sourceNeed ? t(sourceNeed.labelFr, sourceNeed.labelEn) as string : t("Source inconnue", "Unknown source") as string);
  const isObjectiveSource = source?.type === "objectif";
  const angleParam = searchParams.get("angle");
  const angle: ExplorationDirection = angleParam === "alternatives" || angleParam === "extensions" || angleParam === "adjacent" ? angleParam : "all";
  const candidates = useMemo(() => buildExplorationCandidates({
    destinationId: destination?.id,
    getCategoryLabel,
    sourceTools,
    stackEntries: state.toolEntries,
    tools,
  }), [destination?.id, getCategoryLabel, sourceTools, state.toolEntries, tools]);
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
    return [...grouped.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, lang));
  }, [candidates, lang, sourceTool]);
  const requestedCategoryId = searchParams.get("category");
  const activeCategoryId = sourceTool && toolCategoryFilters.some((category) => category.id === requestedCategoryId)
    ? requestedCategoryId
    : null;
  const filteredCandidates = isObjectiveSource
    ? activeThemeId ? candidates.filter((candidate) => getObjectiveExplorationThemeId(source.id, candidate.tool) === activeThemeId) : candidates
    : sourceTool
      ? activeCategoryId ? candidates.filter((candidate) => candidate.tool.categoryId === activeCategoryId) : candidates
    : angle === "all" ? candidates : candidates.filter((candidate) => candidate.direction === angle);
  const visibleCandidates = filteredCandidates.slice(0, resultLimit);
  const hasMoreCandidates = visibleCandidates.length < filteredCandidates.length;
  const sourceKey = source?.type === "objectif" ? `objectif:${source.id}` : source?.type === "outil" ? `outil:${source.slug}` : source?.type === "stack" ? "stack:ma-stack" : "unknown";

  useEffect(() => {
    setResultLimit(INITIAL_RESULT_COUNT);
    loadingMoreRef.current = false;
    setIsLoadingMore(false);
  }, [activeCategoryId, activeThemeId, angle, sourceKey]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMoreCandidates) return;

    const scrollContainer = document.getElementById("main-content");
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
     genuine standalone long-tail value (alternatives to a specific tool) and
     gets its own title/description/canonical below. The "objectif" and
     "stack" sources are derived from a user's own picks and don't carry
     unique enough content to index; they stay noindexed and fall back to the
     generic explorer copy. */
  useEffect(() => {
    if (source?.type === "outil" && sourceTool) {
      setSeoTags({
        title: lang === "en"
          ? `Alternatives to ${sourceLabel}: similar tools | ToolTrim`
          : `Alternatives à ${sourceLabel} : outils similaires | ToolTrim`,
        description: lang === "en"
          ? `Discover tools comparable to ${sourceLabel}, with manually verified pricing and independent verdicts on ToolTrim.`
          : `Découvrez des outils comparables à ${sourceLabel}, avec prix vérifiés à la main et verdicts indépendants sur ToolTrim.`,
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
    if (source?.type === "objectif" || source?.type === "stack") setNoindex();
    else removeNoindex();
    return () => {
      removeNoindex();
      cleanupSeo([]);
    };
  }, [lang, sourceKey, sourceLabel, source, sourceTool]);

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
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("angle");
    if (categoryId) nextParams.set("category", categoryId);
    else nextParams.delete("category");
    setSearchParams(nextParams, { replace: true, state: { ...locationState, skipScrollReset: true } });
    if (shouldScroll) scrollToTop(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  }

  function recenter(tool: ToolSummary) {
    const href = getExplorerHref(prefix, { type: "outil", slug: getExplorationToolKey(tool) }, {
      angle: isObjectiveSource ? "all" : angle,
      destination: destination?.id,
    });
    navigate(href, {
      state: {
        ...locationState,
        explorerCanGoBack: true,
        originLabel,
        previousSourceLabel: sourceLabel,
        skipScrollReset: false,
      } satisfies ExplorerLocationState,
    });
  }

  function addTool(tool: ToolSummary) {
    const slug = getExplorationToolKey(tool);
    if (addingSlug === slug) return;
    setAddingSlug(slug);
    setPendingTool(tool);
  }

  if (!source || sourceTools.length === 0) {
    return (
      <main className="ex-page ex-page--empty">
        <Compass size={28} aria-hidden />
        <h1>{t("Cette source n’est plus disponible", "This source is no longer available")}</h1>
        <p>{t("Revenez au catalogue pour choisir un outil à explorer.", "Return to the catalog and choose a tool to explore.")}</p>
        <Link to={`${prefix}/tools`}>{t("Voir les outils", "View tools")}</Link>
      </main>
    );
  }

  const floatingFilterItems: ExplorerFilterItem[] = isObjectiveSource
    ? [
      { id: "all", label: t("Toutes les idées", "All ideas") as string },
      ...objectiveThemes.map((theme) => ({ id: theme.id, label: t(theme.labelFr, theme.labelEn) as string })),
    ]
    : sourceTool ? [
      { id: "all", label: t("Tout", "All") as string },
      ...toolCategoryFilters.map((category) => ({ id: category.id, label: category.label })),
    ] : [
      { id: "all", label: t("Tout", "All") as string },
      { id: "alternatives", label: t("Alternatives", "Alternatives") as string },
      { id: "extensions", label: t("Extensions", "Extensions") as string },
      { id: "adjacent", label: t("Outils complémentaires", "Complementary tools") as string },
    ];
  const sourceToolSlug = sourceTool ? getExplorationToolKey(sourceTool) : null;
  const sourceStackEntry = sourceToolSlug ? state.toolEntries.find((entry) => entry.toolSlug === sourceToolSlug) : null;
  const sourceAlreadyAdded = destination
    ? Boolean(sourceStackEntry?.needIds.includes(destination.id))
    : Boolean(sourceStackEntry);
  const sourceIsAdding = Boolean(sourceToolSlug && addingSlug === sourceToolSlug);
  const gridCandidates = visibleCandidates;
  const activeFilterId = isObjectiveSource ? activeThemeId || "all" : sourceTool ? activeCategoryId || "all" : angle;
  const activeFilterLabel = floatingFilterItems.find((item) => item.id === activeFilterId)?.label;
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
            onClick={handleBack}
            aria-label={t(`Retour à ${previousLabel}`, `Back to ${previousLabel}`) as string}
          >
            <ArrowLeft size={18} aria-hidden />
          </button>
          <ToolLogo tool={sourceTool} size={34} />
          <span className="ex-filter-context-copy">
            <small>{locationState.explorerCanGoBack
              ? t(`Depuis ${previousLabel}`, `From ${previousLabel}`)
              : t("Explorer autour de", "Explore around")}</small>
            <strong>{sourceLabel}</strong>
          </span>
          <span className="ex-filter-context-divider" aria-hidden />
        </div>
      ) : undefined}
      onSelect={(id) => {
        if (isObjectiveSource) setTheme(id === "all" ? null : id, false);
        else if (sourceTool) setCategory(id === "all" ? null : id, false);
        else setAngle(id as ExplorationDirection, false);
      }}
    />
  );

  const renderCandidateCard = (candidate: (typeof visibleCandidates)[number]) => {
    const slug = getExplorationToolKey(candidate.tool);
    const isAdding = addingSlug === slug;
    const inDestination = candidate.stackState === "in-destination";
    const inStackWithoutDestination = !destination && candidate.stackState === "in-stack";
    const description = t(
      candidate.tool.shortDescription,
      candidate.tool.shortDescriptionEn || candidate.tool.shortDescription,
    ) as string;
    const previewUrl = candidate.tool.ogImageUrl
      || (Array.isArray(candidate.tool.covers) && typeof candidate.tool.covers[0] === "string" ? candidate.tool.covers[0] : "");

    return (
      <article key={slug} data-tool-slug={slug} className={`ex-card${inDestination || inStackWithoutDestination ? " is-present" : ""}${isAdding ? " is-adding" : ""}`}>
        <div className="ex-card-actions" aria-label={t(`Actions pour ${candidate.tool.name}`, `Actions for ${candidate.tool.name}`) as string}>
          <button
            type="button"
            onClick={() => recenter(candidate.tool)}
            aria-label={t(`Explorer autour de ${candidate.tool.name}`, `Explore around ${candidate.tool.name}`) as string}
            title={t("Explorer autour", "Explore around") as string}
          >
            <Compass size={18} aria-hidden />
          </button>
          <button type="button" onClick={() => addTool(candidate.tool)} disabled={inDestination || inStackWithoutDestination || isAdding} aria-label={inDestination
            ? t(`${candidate.tool.name} déjà dans ${destination?.labelFr}`, `${candidate.tool.name} already in ${destination?.labelEn}`) as string
            : inStackWithoutDestination
              ? t(`${candidate.tool.name} déjà dans Ma stack`, `${candidate.tool.name} already in My stack`) as string
              : destination && candidate.stackState === "in-stack"
                ? t(`Ajouter ${candidate.tool.name} à ${destination.labelFr}`, `Add ${candidate.tool.name} to ${destination.labelEn}`) as string
                : t(`Ajouter ${candidate.tool.name} à Ma stack`, `Add ${candidate.tool.name} to My stack`) as string}
            title={inDestination || inStackWithoutDestination
              ? t("Déjà ajouté", "Already added") as string
              : t("Ajouter à Ma stack", "Add to My stack") as string}
          >
            {inDestination || inStackWithoutDestination ? <Check size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
          </button>
        </div>
        <button
          type="button"
          className="ex-card-main"
          onClick={() => recenter(candidate.tool)}
          aria-label={t(`Explorer autour de ${candidate.tool.name}`, `Explore around ${candidate.tool.name}`) as string}
          aria-describedby={`explore-card-${slug}-description`}
        >
          <span className={`ex-card-media${previewUrl ? " has-preview" : ""}`}>
            {previewUrl ? (
              <img src={previewUrl} alt="" loading="lazy" />
            ) : (
              <ToolLogo tool={candidate.tool} size={72} />
            )}
          </span>
        </button>
        <div className="ex-card-content">
          <div className="ex-card-header">
            <ToolLogo tool={candidate.tool} size={24} className="tce-logo ex-card-logo" />
            <button type="button" className="ex-card-identity" onClick={() => recenter(candidate.tool)}>
              <strong>{candidate.tool.name}</strong>
            </button>
          </div>
          <p id={`explore-card-${slug}-description`} className="ex-card-description">{description}</p>
        </div>
      </article>
    );
  };

  const pendingToolSlug = pendingTool ? getExplorationToolKey(pendingTool) : "";
  const pendingEntry = state.toolEntries.find((entry) => entry.toolSlug === pendingToolSlug);
  const pendingClassification = pendingTool ? classifyToolForStack(pendingTool) : null;
  const suggestedNeedId = destination?.id
    || pendingClassification?.needIds.find((needId) => state.needs.some((need) => need.id === needId));
  const initialNeedIds = Array.from(new Set([
    ...(pendingEntry?.needIds || []),
    ...(destination ? [destination.id] : []),
  ]));

  return (
    <>
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
        <section className="ex-tool-stage" aria-label={t(`Explorer autour de ${sourceLabel}`, `Explore around ${sourceLabel}`) as string}>
        <header className="ex-tool-focus">
          <div className="ex-tool-focus-main">
            <ToolCardImage tool={sourceTool} logoSize={112} className="ex-tool-focus-visual" />
            <div className="ex-tool-focus-content">
              <span className="ex-tool-focus-eyebrow">
                {t(`Autour de ${sourceLabel}`, `Around ${sourceLabel}`)}
                {originLabel !== sourceLabel && <> · {t(`depuis ${originLabel}`, `from ${originLabel}`)}</>}
              </span>
              <div className="ex-tool-focus-title">
                <ToolLogo tool={sourceTool} size={54} className="ex-card-logo" />
                <div>
                  <h1 id="explorer-title">{sourceLabel}</h1>
                  <span>{getCategoryLabel(sourceTool)}</span>
                </div>
              </div>
              {sourceDescription && <p>{sourceDescription}</p>}
              <div className="ex-tool-focus-footer">
                <Link className="ex-tool-focus-profile" to={`${prefix}/tool/${getExplorationToolKey(sourceTool)}`}>
                  {t("Voir la fiche complète", "View full profile")}
                  <span aria-hidden>→</span>
                </Link>
                <button
                  type="button"
                  className={`ex-destination ex-tool-focus-add${sourceAlreadyAdded ? " is-added" : ""}`}
                  disabled={sourceAlreadyAdded || sourceIsAdding}
                  onClick={() => addTool(sourceTool)}
                  aria-label={destination
                    ? sourceAlreadyAdded
                      ? t(`${sourceLabel} déjà dans ${destination.labelFr}`, `${sourceLabel} already in ${destination.labelEn}`) as string
                      : t(`Ajouter ${sourceLabel} à ${destination.labelFr}`, `Add ${sourceLabel} to ${destination.labelEn}`) as string
                    : sourceAlreadyAdded
                      ? t(`${sourceLabel} déjà dans Ma stack`, `${sourceLabel} already in My stack`) as string
                      : t(`Ajouter ${sourceLabel} à Ma stack`, `Add ${sourceLabel} to My stack`) as string}
                >
                  {sourceAlreadyAdded ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
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

      {(isObjectiveSource || Boolean(sourceTool)) && tagFilters}

      {visibleCandidates.length > 0 && (
        <header className="ex-results-heading">
          <div>
            <span>{activeFilterLabel}</span>
            <h2>{sourceTool
              ? t(`Outils à découvrir autour de ${sourceLabel}`, `Tools to discover around ${sourceLabel}`)
              : t("Outils recommandés", "Recommended tools")}</h2>
          </div>
          <p>{t(
            `${filteredCandidates.length} outil${filteredCandidates.length > 1 ? "s" : ""} classé${filteredCandidates.length > 1 ? "s" : ""} par pertinence`,
            `${filteredCandidates.length} tool${filteredCandidates.length > 1 ? "s" : ""} ranked by relevance`,
          )}</p>
        </header>
      )}

      {visibleCandidates.length > 0 ? (
        gridCandidates.length > 0 && <section className="ex-grid ex-grid--masonry" aria-label={t("Outils associés", "Related tools") as string}>
          {gridCandidates.map(renderCandidateCard)}
          {hasMoreCandidates && (
            <>
              {isLoadingMore && Array.from({ length: Math.min(SKELETON_COUNT, filteredCandidates.length - visibleCandidates.length) }, (_, index) => (
                <article key={`skeleton-${index}`} className="ex-card ex-card--skeleton" aria-hidden="true">
                  <div className="ex-card-main">
                    <span className="ex-card-header">
                      <span className="ex-skeleton ex-skeleton--logo" />
                      <span className="ex-card-identity">
                        <span className="ex-skeleton ex-skeleton--title" />
                        <span className="ex-skeleton ex-skeleton--meta" />
                      </span>
                    </span>
                    <span className="ex-skeleton ex-skeleton--description" />
                  </div>
                  <div className="ex-card-actions">
                    <span className="ex-skeleton ex-skeleton--button" />
                  </div>
                </article>
              ))}
              <div ref={loadMoreRef} className="ex-load-sentinel" role="status" aria-live="polite">
                <span className="sr-only">{isLoadingMore
                  ? t("Chargement de nouveaux outils", "Loading more tools")
                  : t("Faites défiler pour découvrir plus d’outils", "Scroll to discover more tools")}</span>
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="ex-empty">
          <Compass size={24} aria-hidden />
          <h2>{isObjectiveSource ? t("Aucun outil dans cette thématique", "No tools in this theme") : t("Aucun outil dans cet angle", "No tools in this direction")}</h2>
          <button type="button" onClick={() => isObjectiveSource ? setTheme(null) : setAngle("all")}>{t("Voir l’ensemble", "View overview")}</button>
        </section>
      )}
    </main>
    <StackSaveDialog
      isOpen={Boolean(pendingTool)}
      label={pendingTool?.name || ""}
      lang={lang}
      needs={state.needs}
      initialIntent={pendingEntry?.intent || "stack"}
      initialNeedIds={initialNeedIds}
      suggestedNeedId={suggestedNeedId}
      onClose={() => { setPendingTool(null); setAddingSlug(null); }}
      onCreateNeed={createNeed}
      onSave={(needIds, intent) => {
        if (!pendingTool) return;
        saveToolSelection(pendingToolSlug, needIds, intent);
        const labels = state.needs
          .filter((need) => needIds.includes(need.id))
          .map((need) => t(need.labelFr, need.labelEn));
        toast.success(t(
          `${pendingTool.name} ajouté à ${labels.join(" et ")}.`,
          `${pendingTool.name} added to ${labels.join(" and ")}.`,
        ) as string);
        setPendingTool(null);
        setAddingSlug(null);
      }}
      t={(fr, en) => t(fr, en) as string}
    />
    </>
  );
}
