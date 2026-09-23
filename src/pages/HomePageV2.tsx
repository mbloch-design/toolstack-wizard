import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback, useRef, type FormEvent, type ReactNode, type TouchEvent } from "react";
import { ArrowRight, Bot, ChevronDown, Code2, Layers3, MessagesSquare, Search, WandSparkles } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories } from "@/hooks/useSupabaseData";
import { setSeoTags, setHreflang, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import ToolLogo from "@/components/ToolLogo";
import HeroSectionV2 from "@/components/home/HeroSectionV2";
import StackGoalsSection from "@/components/home/StackGoalsSection";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import ToolCardImage from "@/components/tool/ToolCardImage";
import { CarouselControls, CarouselPagination } from "@/components/CarouselControls";
// Light index (first 12 stacks, ~3KB gzip) instead of the full 1.7MB stacks.ts:
// HomePageV2 is an eager import, so pulling stacks.ts here modulepreloaded the
// data-stacks chunk on every page. Regenerate with scripts/gen-stacks-index.ts.
import STACKS from "@/data/stacks-index.json";
import HOME_POSTS from "@/data/home-posts-index.json";
import { getExplorerHref } from "@/lib/toolExploration";
import { TOOL_IMAGE_BLOCKLIST } from "@/lib/toolImageBlocklist";


const STACK_PAGE_SIZE = 5; // 1 row × 5 cols — curated collections carousel
const STACK_MAX_PAGES = 4; // cap carousel depth to 4 screens
const POST_PAGE_SIZE = 3; // 1 row × 3 cols — guides carousel
const POST_MAX_PAGES = 4; // cap carousel depth to 4 screens

/* Three high-signal catalogue entries displayed as one editorial shelf.
   The composition deliberately breaks the succession of homogeneous rails:
   one visual lead and three compact tools per category. */
const EDITORIAL_SHELF = [
  { categoryId: "creation", label: "Création de contenu", labelEn: "Content Creation" },
  { categoryId: "nocode-web", label: "No-Code & Web", labelEn: "No-Code & Web" },
  { categoryId: "communication", label: "Communication", labelEn: "Communication" },
  { categoryId: "ai-general", label: "IA Généraliste", labelEn: "AI & Generative Tools" },
];

const AI_PAGE_SIZE = 4; // 1 row × 4 cols — "Works with" carousel

/* Discovery section — a handful of category entry points, ordered by how
   broadly they matter to the freelancer / small-team audience rather than
   raw catalogue size. Counts are computed live from toolsByCategory so this
   never drifts out of sync with the catalogue. */
const DISCOVERY_CATEGORY_IDS = [
  "creation", "design-tools", "nocode-web", "ai-general",
  "communication", "organization", "automation", "analytics",
];

/* Tools we're watching — a hand-picked, opinionated shortlist rather than
   a "featured" flag nobody outside the team can decode. Every entry carries
   a one-line editorial reason (the actual point of view, not a category
   label) so even a grid of logos reads as ToolTrim's take, not a random
   sample of the catalogue. */
const WATCHLIST = [
  { slug: "runway", reasonFr: "Une stack IA vidéo vraiment solide.", reasonEn: "Strong, focused AI video stack." },
  { slug: "n8n", reasonFr: "Puissant, mais facile à sur-équiper.", reasonEn: "Powerful, but easy to overbuild." },
  { slug: "airtable", reasonFr: "Idéal, jusqu'à ce que ça redevienne simple.", reasonEn: "Great until your workflow gets simple." },
  { slug: "notion", reasonFr: "Flexible au point d'éviter de trancher.", reasonEn: "Flexible enough to avoid deciding anything." },
  { slug: "canva", reasonFr: "Rapide, mais pas taillé pour grandir.", reasonEn: "Fast, but not built to grow with you." },
  { slug: "figma", reasonFr: "La référence en design d'interface.", reasonEn: "Still the default for interface design." },
];

const HOME_TOOL_ASSETS: Record<string, { cover: string | null; logo?: string }> = {
  "affinity-photo": { cover: "/home-cards/affinity-photo.webp", logo: "/home-logos/affinity-photo.webp" },
  box: { cover: "/home-cards/box.webp", logo: "/home-logos/box.webp" },
  chatgpt: { cover: "/og-screenshots/chatgpt.jpg", logo: "/home-logos/chatgpt.webp" },
  circle: { cover: "/home-cards/circle.webp", logo: "/home-logos/circle.webp" },
  claude: { cover: "/home-cards/claude.webp" },
  cursor: { cover: "/home-cards/cursor.webp", logo: "/home-logos/cursor.webp" },
  deepseek: { cover: "/home-cards/deepseek.webp", logo: "/home-logos/deepseek.webp" },
  descript: { cover: "/home-cards/descript.webp", logo: "/home-logos/descript.webp" },
  dropbox: { cover: "/home-cards/dropbox.webp", logo: "/home-logos/dropbox.webp" },
  gemini: { cover: "/home-cards/gemini.webp", logo: "/home-logos/gemini.webp" },
  "github-copilot": { cover: "/home-cards/github-copilot.webp" },
  grammarly: { cover: "/home-cards/grammarly.webp", logo: "/home-logos/grammarly.webp" },
};

function withHomeAssets<T extends { id: string; name: string; slug?: string; ogImageUrl?: string; logo?: string }>(tool: T): T {
  const nameSlug = tool.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const asset = [tool.slug, tool.id, nameSlug]
    .map((key) => key && HOME_TOOL_ASSETS[key])
    .find(Boolean);
  if (!asset) return tool;

  return {
    ...tool,
    ogImageUrl: asset.cover || undefined,
    logo: asset.logo || tool.logo,
  };
}

function SwipePager({
  className,
  onPrevious,
  onNext,
  children,
}: {
  className: string;
  onPrevious: () => void;
  onNext: () => void;
  children: ReactNode;
}) {
  const startX = useRef<number | null>(null);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    startX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    const delta = event.changedTouches[0]?.clientX - startX.current;
    startX.current = null;
    if (Math.abs(delta) < 48) return;
    if (delta < 0) onNext();
    else onPrevious();
  };

  return (
    <div className={className} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {children}
    </div>
  );
}

const STACK_VISUAL_LABELS = [
  { fr: "Développer", en: "Build" },
  { fr: "Créer", en: "Create" },
  { fr: "Concevoir", en: "Design" },
  { fr: "Mettre en scène", en: "Stage" },
  { fr: "Déployer", en: "Deploy" },
];

function StackGlyph({ variant }: { variant: number }) {
  const glyph = variant % 5;

  if (glyph === 0) {
    return (
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <rect x="25" y="25" width="78" height="78" />
        <rect x="57" y="57" width="78" height="78" />
        <circle cx="80" cy="80" r="30" />
      </svg>
    );
  }
  if (glyph === 1) {
    return (
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="58" cy="58" r="36" />
        <path d="M58 58a36 36 0 0 1 36 36H58Z" />
        <path d="M58 94a36 36 0 0 0 36 36V94Z" />
      </svg>
    );
  }
  if (glyph === 2) {
    return (
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <path d="M24 42h112v76H24z" />
        <path d="M24 80h76v54H24z" />
        <path d="M62 42v76M100 80v54" />
      </svg>
    );
  }
  if (glyph === 3) {
    return (
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <path d="M80 18 137 51v66L80 142 23 117V51Z" />
        <path d="m80 32 42 76H38Z" />
        <path d="m38 52 84 56M122 52l-84 56" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true">
      <path d="M24 80a56 56 0 0 1 56-56v56Z" />
      <circle cx="54" cy="110" r="30" />
      <path d="M80 80h56v56H80z" />
      <path d="m80 80 28-28 28 28Z" />
    </svg>
  );
}

function StackCollectionVisual({
  title,
  variant,
  lang,
}: {
  title: string;
  variant: number;
  lang: string;
}) {
  const label = STACK_VISUAL_LABELS[variant % STACK_VISUAL_LABELS.length];
  const displayTitle = title.replace(/^Stack\s+/i, "");

  return (
    <div className="v2-stack-visual" data-variant={variant % 9}>
      <div className="v2-stack-visual-topline">
        <span>{lang === "en" ? label.en : label.fr}</span>
        <Layers3 size={17} strokeWidth={1.7} aria-hidden="true" />
      </div>
      <div className="v2-stack-glyph">
        <StackGlyph variant={variant} />
      </div>
      <h3>{displayTitle}</h3>
    </div>
  );
}

/* ── Generic section header ── */
function SectionHead({ label, to, linkLabel }: { label: string; to: string; linkLabel: string }) {
  return (
    <div className="v2-section-head">
      <div className="v2-section-heading-copy">
        <h2 className="v2-section-title">{label}</h2>
      </div>
      <Link to={to} className="tt-section-action v2-section-link">
        {linkLabel} <ArrowRight aria-hidden />
      </Link>
    </div>
  );
}

/* ── Featured carousel header with arrows ── */
function FeaturedHead({
  label, to, linkLabel, page, total, onPrev, onNext, previousLabel, nextLabel,
}: {
  label: string; to: string; linkLabel: string;
  page: number; total: number; onPrev: () => void; onNext: () => void;
  previousLabel: string; nextLabel: string;
}) {
  return (
    <div className="v2-section-head">
      <div className="v2-section-heading-copy">
        <h2 className="v2-section-title">{label}</h2>
      </div>
      <div className="v2-featured-nav">
        <CarouselControls
          onPrevious={onPrev}
          onNext={onNext}
          previousDisabled={page === 0}
          nextDisabled={page >= total - 1}
          previousLabel={previousLabel}
          nextLabel={nextLabel}
        />
        <Link to={to} className="tt-section-action v2-section-link">
          {linkLabel} <ArrowRight aria-hidden />
        </Link>
      </div>
    </div>
  );
}

/* ── Compact tool tagline: trims a full shortDescription sentence down
   to a short row label, cutting at a word boundary. ── */
function shortTagline(desc: string | undefined, max = 40): string {
  const clean = (desc || "").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > 20 ? cut.slice(0, lastSpace) : cut}…`;
}

/* ── Editorial category shelf: visual lead + compact product rows. ── */
function EditorialShelfPanel({
  title, eyebrow, visualVariant, tools, prefix, categoryHref, seeAllLabel, toolsLabel,
}: {
  title: string;
  eyebrow: string;
  visualVariant: number;
  tools: any[];
  prefix: string;
  categoryHref: string;
  seeAllLabel: string;
  toolsLabel: string;
}) {
  const visibleTools = tools.slice(0, 3);
  const universeIcon = visualVariant === 0
    ? <WandSparkles aria-hidden />
    : visualVariant === 1
      ? <Code2 aria-hidden />
      : visualVariant === 2
        ? <MessagesSquare aria-hidden />
        : <Bot aria-hidden />;

  return (
    <article className="v2-shelf-panel">
      <Link to={categoryHref} className="v2-shelf-lead">
        <div className="v2-shelf-lead-media">
          <div className="v2-universe-visual" data-variant={visualVariant}>
            <div className="v2-universe-topline">
              <span>{eyebrow}</span>
              {universeIcon}
            </div>
            <div className="v2-universe-glyph" aria-hidden>
              <StackGlyph variant={visualVariant + 2} />
            </div>
            <h3>{title}</h3>
          </div>
        </div>
        <div className="v2-shelf-lead-copy">
          <p><strong>{tools.length}</strong> {toolsLabel}</p>
        </div>
      </Link>

      <div className="v2-shelf-list">
        {visibleTools.map((tool) => (
          <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} className="v2-shelf-item">
            <span className="v2-shelf-item-logo"><ToolLogo tool={withHomeAssets(tool)} size={40} /></span>
            <span className="v2-shelf-item-copy">
              <strong>{tool.name}</strong>
              <small>{shortTagline(tool.shortDescription, 40)}</small>
            </span>
          </Link>
        ))}
      </div>

      <Link to={categoryHref} className="v2-shelf-more">
        {seeAllLabel}
        <ArrowRight aria-hidden />
      </Link>
    </article>
  );
}

export default function HomePageV2() {
  const { lang, t, prefix } = useLang();
  const navigate = useNavigate();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const posts = HOME_POSTS[lang];

  const [discoveryQuery, setDiscoveryQuery] = useState("");
  const [stackPage, setStackPage] = useState(0);
  const [postPage, setPostPage] = useState(0);
  const [selectedHost, setSelectedHost] = useState("adobe-creative-cloud");
  const [workWithPage, setWorkWithPage] = useState(0);

  useEffect(() => {
    const title = lang === "fr"
      ? "ToolTrim | Décidez quels logiciels garder ou remplacer"
      : "ToolTrim | Decide which software to keep, replace, or add";
    const desc = lang === "fr"
      ? "ToolTrim vous aide à décider quels logiciels garder, remplacer ou ajouter selon votre stack, votre budget et votre façon de travailler."
      : "ToolTrim helps freelancers and small teams decide which software to keep, replace, or add based on their stack, budget, and real workflow.";
    const url = `${SEO_BASE}/${lang}`;
    setSeoTags({ title, description: desc, url, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}`);
    setJsonLd("home-jsonld", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ToolTrim",
      url: SEO_BASE,
      description: desc,
    });
    setJsonLd("home-org-jsonld", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ToolTrim",
      url: SEO_BASE,
      logo: {
        "@type": "ImageObject",
        url: `${SEO_BASE}/picto-logo.svg`,
        width: 512,
        height: 512,
      },
      description: "Software stack decision platform for freelancers and small teams. Independent, transparent, and focused on real workflows.",
      foundingDate: "2024",
      email: "contact@tooltrim.com",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "contact@tooltrim.com",
        url: `${SEO_BASE}/fr/contact`,
        availableLanguage: ["French", "English"],
      },
    });
    return () => cleanupSeo(["home-jsonld", "home-org-jsonld"]);
  }, [lang]);

  /* ── Watchlist — resolve each hand-picked slug against the live catalogue
     so name/logo/pricing stay accurate; the editorial reason is authored,
     not derived. ── */
  const watchlistTools = useMemo(() => {
    const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
    return WATCHLIST.flatMap(({ slug, reasonFr, reasonEn }) => {
      const tool = bySlug.get(slug);
      return tool ? [{ tool, reasonFr, reasonEn }] : [];
    });
  }, [tools]);

  /* ── Large thematic shelves ── */
  const rankShelfTools = useCallback((items: typeof tools) => [...items].sort((a, b) => {
    const recommendationDelta = Number(b.prescription_quality === "ferme") - Number(a.prescription_quality === "ferme");
    if (recommendationDelta) return recommendationDelta;
    const mediaDelta = Number(Boolean(b.ogImageUrl)) - Number(Boolean(a.ogImageUrl));
    if (mediaDelta) return mediaDelta;
    return a.name.localeCompare(b.name);
  }), []);

  /* ── Stacks pagination (capped to STACK_MAX_PAGES screens) ── */
  const bySlug = useMemo(() => new Map(tools.map((t) => [t.slug, t])), [tools]);
  const stackTotalPages = Math.min(STACK_MAX_PAGES, Math.ceil(STACKS.length / STACK_PAGE_SIZE));
  const cappedStacks = STACKS.slice(0, stackTotalPages * STACK_PAGE_SIZE);
  const visibleStacks = cappedStacks.slice(stackPage * STACK_PAGE_SIZE, (stackPage + 1) * STACK_PAGE_SIZE);
  const prevStackPage = useCallback(() => setStackPage((p) => Math.max(0, p - 1)), []);
  const nextStackPage = useCallback(() => setStackPage((p) => Math.min(stackTotalPages - 1, p + 1)), [stackTotalPages]);

  /* ── Posts — carousel, 1 row × 3 cols, capped to POST_MAX_PAGES screens ── */
  const postTotalPages = Math.min(POST_MAX_PAGES, Math.ceil(posts.length / POST_PAGE_SIZE)) || 1;
  const cappedPosts = posts.slice(0, postTotalPages * POST_PAGE_SIZE);
  const visiblePosts = cappedPosts.slice(postPage * POST_PAGE_SIZE, (postPage + 1) * POST_PAGE_SIZE);
  const prevPostPage = useCallback(() => setPostPage((p) => Math.max(0, p - 1)), []);
  const nextPostPage = useCallback(() => setPostPage((p) => Math.min(postTotalPages - 1, p + 1)), [postTotalPages]);

  /* ── Tools grouped by category, for the duo rows ── */
  const toolsByCategory = useMemo(() => {
    const map = new Map<string, typeof tools>();
    for (const tool of tools) {
      const key = tool.categoryId;
      if (!key || TOOL_IMAGE_BLOCKLIST.has(tool.slug)) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tool);
    }
    return map;
  }, [tools]);

  const discoveryCategories = useMemo(
    () => DISCOVERY_CATEGORY_IDS
      .map((id) => categories.find((category) => category.id === id))
      .filter((category): category is NonNullable<typeof category> => Boolean(category))
      .map((category) => ({ category, count: toolsByCategory.get(category.id)?.length ?? 0 }))
      .filter(({ count }) => count > 0),
    [categories, toolsByCategory],
  );

  const handleDiscoverySubmit = useCallback((event: FormEvent) => {
    event.preventDefault();
    const q = discoveryQuery.trim();
    // /search runs the fuzzy catalogue-search engine (tools + categories +
    // guides); /tools?q= only does a literal substring match, which reads
    // as broken for a phrase like "AI video" that no tool spells out.
    navigate(q ? `${prefix}/search?q=${encodeURIComponent(q)}` : `${prefix}/tools`);
  }, [discoveryQuery, navigate, prefix]);

  /* “Travailler avec” is driven by the catalogue relationship model rather
     than a hand-authored list of recommendations. A host is only presented
     when it has at least one visible compatible tool. */
  const workWithHosts = useMemo(() => {
    const preferred = ["figma", "adobe-after-effects", "adobe-creative-cloud", "google-workspace", "blender"];
    const counts = new Map<string, number>();
    for (const tool of tools) {
      for (const host of tool.worksWith || []) counts.set(host, (counts.get(host) || 0) + 1);
      for (const host of [tool.host_app, tool.bundle_parent]) {
        if (host) counts.set(host, (counts.get(host) || 0) + 1);
      }
    }
    return preferred
      .filter((slug) => counts.has(slug) && tools.some((tool) => tool.slug === slug))
      .map((slug) => ({ tool: tools.find((tool) => tool.slug === slug)!, count: counts.get(slug)! }))
      .slice(0, 5);
  }, [tools]);

  useEffect(() => {
    if (workWithHosts.length > 0 && !workWithHosts.some(({ tool }) => tool.slug === selectedHost)) {
      setSelectedHost(workWithHosts[0].tool.slug);
    }
  }, [selectedHost, workWithHosts]);

  const allCompatibleTools = useMemo(
    () => tools.filter((tool) =>
      !TOOL_IMAGE_BLOCKLIST.has(tool.slug)
      && ((tool.worksWith || []).includes(selectedHost)
        || tool.host_app === selectedHost
        || tool.bundle_parent === selectedHost)
    ),
    [selectedHost, tools],
  );
  const workWithTotalPages = Math.max(1, Math.ceil(allCompatibleTools.length / AI_PAGE_SIZE));
  const compatibleTools = allCompatibleTools.slice(workWithPage * AI_PAGE_SIZE, (workWithPage + 1) * AI_PAGE_SIZE);
  const prevWorkWithPage = useCallback(() => setWorkWithPage((page) => Math.max(0, page - 1)), []);
  const nextWorkWithPage = useCallback(
    () => setWorkWithPage((page) => Math.min(workWithTotalPages - 1, page + 1)),
    [workWithTotalPages],
  );
  const selectedHostTool = workWithHosts.find(({ tool }) => tool.slug === selectedHost)?.tool;

  useEffect(() => setWorkWithPage(0), [selectedHost]);

  return (
    <div className="home-v2">
      <HeroSectionV2 />
      <StackGoalsSection />

      <div className="v2-catalog">
        <div className="v2-container">

          {/* ══ Discovery — one calm entry point instead of a wall of tagged
               rails. The catalogue's size doesn't need re-proving (170+
               Content Creation, 129+ No-Code & Web tools already exist);
               what's missing is a fast way in: search, then a few
               categories, then a small, honest sample of tools. ══ */}
          <section className="v2-catalog-section dcv-section">
            <h2 className="dcv-title">
              {t("Trouvez le bon outil pour la tâche", "Find the right tool for the job")}
            </h2>

            <form className="dcv-search" role="search" onSubmit={handleDiscoverySubmit}>
              <Search className="dcv-search-icon" aria-hidden />
              <input
                type="search"
                className="dcv-search-input"
                value={discoveryQuery}
                onChange={(event) => setDiscoveryQuery(event.target.value)}
                placeholder={t("Gestion de projet, IA vidéo, CRM…", "Project management, AI video, CRM…")}
                aria-label={t("Que recherchez-vous ?", "What are you looking for?")}
              />
              <button type="submit" className="dcv-search-submit">
                {t("Rechercher", "Search")}
              </button>
            </form>

            {discoveryCategories.length > 0 && (
              <div className="dcv-categories">
                {discoveryCategories.map(({ category, count }) => (
                  <Link key={category.id} to={`${prefix}/category/${category.slug}`} className="dcv-category-chip">
                    <span className="dcv-category-name">{lang === "en" ? (category.nameEn || category.name) : category.name}</span>
                    <span className="dcv-category-count">{count}</span>
                  </Link>
                ))}
              </div>
            )}

            {watchlistTools.length > 0 && (
              <div className="dcv-tools">
                <div className="dcv-tools-head">
                  <h3 className="dcv-tools-title">{t("Les outils qu'on surveille", "Tools we're watching")}</h3>
                  <Link to={`${prefix}/tools`} className="tt-section-action v2-section-link">
                    {t("Tout le catalogue", "Full catalogue")} <ArrowRight aria-hidden />
                  </Link>
                </div>
                <div className="tc-grid">
                  {watchlistTools.map(({ tool, reasonFr, reasonEn }) => (
                    <ToolCardEditorial
                      key={tool.id}
                      tool={withHomeAssets(tool) as any}
                      prefix={prefix}
                      t={t}
                      categoryLabel={lang === "fr" ? reasonFr : reasonEn}
                      lang={lang}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ══ 4. Editorial shelf — three categories, one visual lead each ══ */}
          <section className="v2-catalog-section v2-shelf-section">
            <SectionHead
              label={t("Explorer par univers", "Explore by category")}
              to={`${prefix}/tools`}
              linkLabel={t("Tout le catalogue", "Full catalogue")}
            />
            <div className="v2-shelf-grid">
              {EDITORIAL_SHELF.map((cat, categoryIndex) => {
                const categoryTools = toolsByCategory.get(cat.categoryId) || [];
                if (categoryTools.length === 0) return null;
                return (
                  <EditorialShelfPanel
                    key={cat.categoryId}
                    title={lang === "en" ? cat.labelEn : cat.label}
                    eyebrow={t("Univers", "Universe") as string}
                    visualVariant={categoryIndex}
                    tools={rankShelfTools(categoryTools)}
                    prefix={prefix}
                    categoryHref={`${prefix}/category/${categories.find((category) => category.id === cat.categoryId)?.slug || cat.categoryId}`}
                    seeAllLabel={t("Voir plus", "See more") as string}
                    toolsLabel={t("outils à explorer", "tools to explore") as string}
                  />
                );
              })}
            </div>
          </section>

          {/* ══ Travailler avec — same catalogue rhythm as the AI shelf ══ */}
          {workWithHosts.length > 0 && compatibleTools.length > 0 && (
            <section className="v2-catalog-section v2-workwith-section">
              <div className="v2-section-head v2-workwith-head">
                <div className="v2-section-heading-copy">
                  <h2 className="v2-section-title v2-workwith-title">
                    <span>{t("Travailler avec", "Works with")}</span>
                    <details
                      className="v2-workwith-select-wrap"
                      onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.removeAttribute("open");
                      }}
                    >
                      <summary aria-label={t("Choisir un logiciel", "Choose software") as string}>
                        <span className="v2-workwith-selected">{selectedHostTool?.name}</span>
                        <ChevronDown aria-hidden="true" />
                      </summary>
                      <div className="v2-workwith-menu" role="menu">
                        {workWithHosts.map(({ tool }) => (
                          <button
                            key={tool.slug}
                            type="button"
                            role="menuitemradio"
                            aria-checked={selectedHost === tool.slug}
                            className={selectedHost === tool.slug ? "is-active" : ""}
                            onClick={(event) => {
                              setSelectedHost(tool.slug);
                              event.currentTarget.closest("details")?.removeAttribute("open");
                            }}
                          >
                            <ToolLogo tool={tool as any} size={24} />
                            <span>{tool.name}</span>
                          </button>
                        ))}
                      </div>
                    </details>
                  </h2>
                </div>
                <div className="v2-featured-nav">
                  <CarouselControls
                    onPrevious={prevWorkWithPage}
                    onNext={nextWorkWithPage}
                    previousDisabled={workWithPage === 0}
                    nextDisabled={workWithPage >= workWithTotalPages - 1}
                    previousLabel={t("Page précédente", "Previous page") as string}
                    nextLabel={t("Page suivante", "Next page") as string}
                  />
                  <Link to={getExplorerHref(prefix, { type: "outil", slug: selectedHost })} className="tt-section-action v2-section-link">
                    {t("Voir tous les outils", "View all tools")} <ArrowRight aria-hidden />
                  </Link>
                </div>
              </div>
              <SwipePager className="tc-grid v2-workwith-grid" onPrevious={prevWorkWithPage} onNext={nextWorkWithPage}>
                {compatibleTools.map((tool) => {
                  const catName = stripLeadingEmoji(
                    lang === "en"
                      ? (categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.nameEn
                        || categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name)
                      : categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name
                  );
                  return <ToolCardEditorial key={tool.id} tool={withHomeAssets(tool) as any} prefix={prefix} t={t} categoryLabel={catName} lang={lang} />;
                })}
              </SwipePager>
              <CarouselPagination
                current={workWithPage}
                total={workWithTotalPages}
                onChange={setWorkWithPage}
                label={t("Choisir une page d’outils compatibles", "Choose a compatible tools page") as string}
                pageLabel={(index) => t(`Page ${index + 1}`, `Page ${index + 1}`) as string}
              />
            </section>
          )}

          {/* ══ 5. Curated stack collections — visual rail 1×5 ══ */}
          <section className="v2-catalog-section">
            <FeaturedHead
              label={t("Collections de stacks", "Curated stack collections")}
              to={`${prefix}/stacks`}
              linkLabel={t("Toutes les stacks", "All stacks")}
              page={stackPage}
              total={stackTotalPages}
              onPrev={prevStackPage}
              onNext={nextStackPage}
              previousLabel={t("Page précédente", "Previous page") as string}
              nextLabel={t("Page suivante", "Next page") as string}
            />
            <SwipePager className="v2-collection-grid" onPrevious={prevStackPage} onNext={nextStackPage}>
              {visibleStacks.map((stack, stackIndex) => {
                const visualIndex = stackPage * STACK_PAGE_SIZE + stackIndex;
                const stackTitle = lang === "en" ? stack.titleEn : stack.title;
                return (
                  <Link key={stack.slug} to={`${prefix}/stacks/${stack.slug}`} className="v2-collection-card">
                    <div className="v2-collection-media">
                      <StackCollectionVisual title={stackTitle} variant={visualIndex} lang={lang} />
                    </div>
                    <div className="v2-collection-copy">
                      <p>ToolTrim · {stack.tools.length} {t("outils", "tools")}</p>
                    </div>
                  </Link>
                );
              })}
            </SwipePager>
            <CarouselPagination current={stackPage} total={stackTotalPages} onChange={setStackPage}
              label={t("Choisir une page de stacks", "Choose a stacks page") as string}
              pageLabel={(index) => t(`Page ${index + 1}`, `Page ${index + 1}`) as string} />
          </section>

          {/* ══ 6. Guides — carousel 1×3, same shape as Stacks ══ */}
          {cappedPosts.length > 0 && (
            <section className="v2-catalog-section">
              <FeaturedHead
                label={t("Articles du guide", "Guide articles")}
                to={`${prefix}/guides`}
                linkLabel={t("Tous les guides", "All guides")}
                page={postPage}
                total={postTotalPages}
                onPrev={prevPostPage}
                onNext={nextPostPage}
                previousLabel={t("Page précédente", "Previous page") as string}
                nextLabel={t("Page suivante", "Next page") as string}
              />
              <SwipePager className="v2-article-grid" onPrevious={prevPostPage} onNext={nextPostPage}>
                {visiblePosts.map((post) => {
                  const dateLabel = post.date
                    ? new Date(post.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { year: "numeric", month: "short", day: "numeric" })
                    : "";
                  const postTools = (post.tags || [])
                    .map((tag) => bySlug.get(tag))
                    .filter(Boolean)
                    .slice(0, 5);
                  const coverTool = postTools.find((tool) => tool?.ogImageUrl);
                  const coverSrc = post.thumbnail || coverTool?.ogImageUrl;
                  return (
                    <Link key={post.slug} to={`${prefix}/guide/${post.slug}`} className="v2-article-card">
                      <div className="v2-article-media">
                        {coverSrc ? (
                          <img
                            src={coverSrc}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            width={480}
                            height={300}
                            className="v2-article-image"
                          />
                        ) : (
                          <span className="v2-article-fallback">
                            {t("Guide ToolTrim", "ToolTrim guide")}
                          </span>
                        )}
                      </div>
                      <div className="v2-article-body">
                        <h3 className="v2-article-title">{post.title}</h3>
                        <div className="v2-article-meta">
                          {dateLabel && <time dateTime={post.date}>{dateLabel}</time>}
                          {post.readTime && <span>{post.readTime}</span>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </SwipePager>
              <CarouselPagination current={postPage} total={postTotalPages} onChange={setPostPage}
                label={t("Choisir une page de guides", "Choose a guides page") as string}
                pageLabel={(index) => t(`Page ${index + 1}`, `Page ${index + 1}`) as string} />
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
