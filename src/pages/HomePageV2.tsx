import { Link } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode, type TouchEvent } from "react";
import { ArrowRight, ChevronDown, Code2, Layers3, MessagesSquare, WandSparkles } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories } from "@/hooks/useSupabaseData";
import { setSeoTags, setHreflang, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import ToolLogo from "@/components/ToolLogo";
import HeroSectionV2 from "@/components/home/HeroSectionV2";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import ToolCardImage from "@/components/tool/ToolCardImage";
import { CarouselControls, CarouselPagination } from "@/components/CarouselControls";
// Light index (first 12 stacks, ~3KB gzip) instead of the full 1.7MB stacks.ts:
// HomePageV2 is an eager import, so pulling stacks.ts here modulepreloaded the
// data-stacks chunk on every page. Regenerate with scripts/gen-stacks-index.ts.
import STACKS from "@/data/stacks-index.json";
import HOME_POSTS from "@/data/home-posts-index.json";


const PAGE_SIZE = 8;      // 2 rows × 4 cols — featured carousel
const NEW_PAGE_SIZE = 12; // 3 rows × 4 cols — new tools carousel
const NEW_MAX_PAGES = 2;  // plafond du carrousel Nouveautés (24 fiches max)
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
];

/* Curated "new additions" — update this list as new tools are added to the catalogue */
const NEW_SLUGS = [
  "cursor","arc-browser","claude","deepseek","notion","airtable","figma-tokens","beehiiv",
  "intercom","lemlist","waalaxy","qonto","toggl","honeybook","wrike","salesforce",
  "amplitude","activecampaign","apollo-io","looka","pika-labs","frame-io","phantombuster","brand24",
];

/* Curated AI tools — single-row carousel (4 per page) */
const AI_SLUGS = [
  "claude","cursor","deepseek","descript","elevenlabs","gemini","github-copilot",
  "heygen","jasper","lovable","notion-ai","replit","stable-diffusion","suno","grok","windsurf",
];
const AI_PAGE_SIZE = 4; // 1 row × 4 cols — AI tools carousel
const LARGE_SHELF_PAGE_SIZE = 8; // 2 rows × 4 cols — major thematic shelves
const LARGE_SHELF_MAX_PAGES = 3;
const FREE_TOOL_SLUGS = [
  "figma", "notion", "canva", "chatgpt", "claude", "perplexity", "trello", "slack",
  "blender", "audacity", "obs-studio", "davinci-resolve", "n8n", "airtable", "miro", "loom",
  "calendly", "tally", "brevo", "mailchimp", "github", "visual-studio-code", "gimp", "inkscape",
];

const HOME_TOOL_ASSETS: Record<string, { cover: string | null; logo?: string }> = {
  "affinity-photo": { cover: "/home-cards/affinity-photo.webp", logo: "/home-logos/affinity-photo.webp" },
  box: { cover: "/home-cards/box.webp", logo: "/home-logos/box.webp" },
  chatgpt: { cover: "/og-screenshots/chatgpt.png", logo: "/home-logos/chatgpt.webp" },
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
function SectionHead({ label, description, to, linkLabel }: { label: string; description?: string; to: string; linkLabel: string }) {
  return (
    <div className="v2-section-head">
      <div className="v2-section-heading-copy">
        <h2 className="v2-section-title">{label}</h2>
        {description && <p className="v2-section-description">{description}</p>}
      </div>
      <Link to={to} className="tt-section-action v2-section-link">
        {linkLabel} <ArrowRight aria-hidden />
      </Link>
    </div>
  );
}

/* ── Featured carousel header with arrows ── */
function FeaturedHead({
  label, description, to, linkLabel, page, total, onPrev, onNext, previousLabel, nextLabel,
}: {
  label: string; description?: string; to: string; linkLabel: string;
  page: number; total: number; onPrev: () => void; onNext: () => void;
  previousLabel: string; nextLabel: string;
}) {
  return (
    <div className="v2-section-head">
      <div className="v2-section-heading-copy">
        <h2 className="v2-section-title">{label}</h2>
        {description && <p className="v2-section-description">{description}</p>}
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

function FeaturedSkeletonGrid() {
  return (
    <div className="tc-grid v2-featured-skeleton-grid" aria-hidden="true">
      {Array.from({ length: PAGE_SIZE }, (_, index) => (
        <div className="v2-featured-skeleton" key={index}>
          <span className="v2-featured-skeleton-media" />
          <span className="v2-featured-skeleton-identity">
            <span className="v2-featured-skeleton-logo" />
            <span className="v2-featured-skeleton-copy">
              <span />
              <span />
            </span>
          </span>
        </div>
      ))}
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
      : <MessagesSquare aria-hidden />;

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
            <span className="v2-shelf-item-logo"><ToolLogo tool={withHomeAssets(tool)} size={42} /></span>
            <span className="v2-shelf-item-copy">
              <strong>{tool.name}</strong>
              <small>{shortTagline(tool.shortDescription, 52)}</small>
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
  const { tools, loading: toolsLoading } = useToolSummaries();
  const { categories } = useCategories();
  const posts = HOME_POSTS[lang];

  const [featuredPage, setFeaturedPage] = useState(0);
  const [newPage, setNewPage] = useState(0);
  const [stackPage, setStackPage] = useState(0);
  const [aiPage, setAiPage] = useState(0);
  const [postPage, setPostPage] = useState(0);
  const [selectedHost, setSelectedHost] = useState("adobe-creative-cloud");
  const [workWithPage, setWorkWithPage] = useState(0);
  const [freeToolsPage, setFreeToolsPage] = useState(0);
  const [automationPage, setAutomationPage] = useState(0);

  useEffect(() => {
    const title = lang === "fr"
      ? "ToolTrim — Auditer sa stack SaaS freelance"
      : "ToolTrim — Audit your freelance SaaS stack";
    const desc = lang === "fr"
      ? "ToolTrim analyse ta stack SaaS selon ton profil, ton budget, ton TJM et tes usages réels pour repérer les doublons, challenger les abonnements inutiles et recommander les outils vraiment adaptés."
      : "ToolTrim analyzes your SaaS stack based on your profile, budget, day rate and real usage to spot duplicates, challenge unnecessary subscriptions and recommend tools that actually fit.";
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
      description: "Stack audit tool for freelancers and solopreneurs. Independent, honest, no affiliate bias.",
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

  /* ── Featured tools — sourced from prescription_quality === "ferme",
     ToolTrim's own firm-recommendation signal (the same one that drives
     the "ToolTrim Pick" badge on tool cards elsewhere), not a hand-picked
     slug list that drifts out of sync with the catalog. ── */
  const featured = useMemo(
    () => tools.filter((t) => t.prescription_quality === "ferme"),
    [tools],
  );

  const totalPages = Math.ceil(featured.length / PAGE_SIZE);
  const visibleFeatured = featured.slice(featuredPage * PAGE_SIZE, (featuredPage + 1) * PAGE_SIZE);

  const prevPage = useCallback(() => setFeaturedPage((p) => Math.max(0, p - 1)), []);
  const nextPage = useCallback(() => setFeaturedPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  /* ── Nouveautés : les plus récemment publiés, d'après published_at ──
     Alimenté par la base, plus par une liste figée : la section se met à jour
     seule à chaque mise en ligne. Les fiches sans date (bundle statique servi
     avant hydratation) passent en fin de tri au lieu de remonter au hasard. */
  const latestTools = useMemo(() => {
    const dated = tools.filter((t) => t.publishedAt);
    const source = dated.length > 0 ? dated : NEW_SLUGS.flatMap((slug) => {
      const t = tools.find((x) => x.slug === slug);
      return t ? [t] : [];
    });
    return [...source]
      .sort((a, b) => String(b.publishedAt ?? "").localeCompare(String(a.publishedAt ?? "")))
      .slice(0, NEW_PAGE_SIZE * NEW_MAX_PAGES);
  }, [tools]);

  const newTotalPages = Math.ceil(latestTools.length / NEW_PAGE_SIZE);
  const visibleNew = latestTools.slice(newPage * NEW_PAGE_SIZE, (newPage + 1) * NEW_PAGE_SIZE);
  const prevNewPage = useCallback(() => setNewPage((p) => Math.max(0, p - 1)), []);
  const nextNewPage = useCallback(() => setNewPage((p) => Math.min(newTotalPages - 1, p + 1)), [newTotalPages]);

  /* ── AI tools — single row of 4 ── */
  const aiTools = useMemo(() => {
    const bySlug = new Map(tools.map((t) => [t.slug, t]));
    return AI_SLUGS.flatMap((slug) => { const t = bySlug.get(slug); return t ? [t] : []; });
  }, [tools]);

  const aiTotalPages = Math.ceil(aiTools.length / AI_PAGE_SIZE);
  const visibleAi = aiTools.slice(aiPage * AI_PAGE_SIZE, (aiPage + 1) * AI_PAGE_SIZE);
  const prevAiPage = useCallback(() => setAiPage((p) => Math.max(0, p - 1)), []);
  const nextAiPage = useCallback(() => setAiPage((p) => Math.min(aiTotalPages - 1, p + 1)), [aiTotalPages]);

  /* ── Large thematic shelves ── */
  const rankShelfTools = useCallback((items: typeof tools) => [...items].sort((a, b) => {
    const recommendationDelta = Number(b.prescription_quality === "ferme") - Number(a.prescription_quality === "ferme");
    if (recommendationDelta) return recommendationDelta;
    const mediaDelta = Number(Boolean(b.ogImageUrl)) - Number(Boolean(a.ogImageUrl));
    if (mediaDelta) return mediaDelta;
    return a.name.localeCompare(b.name);
  }), []);

  const freeTools = useMemo(() => {
    const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
    return FREE_TOOL_SLUGS.flatMap((slug) => {
      const tool = bySlug.get(slug);
      return tool ? [tool] : [];
    }).slice(0, LARGE_SHELF_PAGE_SIZE * LARGE_SHELF_MAX_PAGES);
  }, [tools]);
  const freeToolsTotalPages = Math.max(1, Math.ceil(freeTools.length / LARGE_SHELF_PAGE_SIZE));
  const visibleFreeTools = freeTools.slice(freeToolsPage * LARGE_SHELF_PAGE_SIZE, (freeToolsPage + 1) * LARGE_SHELF_PAGE_SIZE);
  const prevFreeToolsPage = useCallback(() => setFreeToolsPage((page) => Math.max(0, page - 1)), []);
  const nextFreeToolsPage = useCallback(() => setFreeToolsPage((page) => Math.min(freeToolsTotalPages - 1, page + 1)), [freeToolsTotalPages]);

  const automationTools = useMemo(() => rankShelfTools(tools.filter((tool) => tool.categoryId === "automation"))
    .slice(0, LARGE_SHELF_PAGE_SIZE * LARGE_SHELF_MAX_PAGES), [rankShelfTools, tools]);
  const automationTotalPages = Math.max(1, Math.ceil(automationTools.length / LARGE_SHELF_PAGE_SIZE));
  const visibleAutomationTools = automationTools.slice(automationPage * LARGE_SHELF_PAGE_SIZE, (automationPage + 1) * LARGE_SHELF_PAGE_SIZE);
  const prevAutomationPage = useCallback(() => setAutomationPage((page) => Math.max(0, page - 1)), []);
  const nextAutomationPage = useCallback(() => setAutomationPage((page) => Math.min(automationTotalPages - 1, page + 1)), [automationTotalPages]);

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
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tool);
    }
    return map;
  }, [tools]);

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
      (tool.worksWith || []).includes(selectedHost)
      || tool.host_app === selectedHost
      || tool.bundle_parent === selectedHost
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

      <div className="v2-catalog">
        <div className="v2-container">

          {/* ══ 1. Outils en vedette — carousel 2×4 ══
               The local summary snapshot does not carry prescription_quality,
               so the remote catalogue can add this entire section after first
               paint. Keep its final geometry reserved while that request is in
               flight to prevent the catalogue below from shifting. */}
          {(toolsLoading || featured.length > 0) && (
            <section className="v2-catalog-section">
              <FeaturedHead
                label={t("Outils en vedette", "Featured tools")}
                description={t("Une sélection courte d'outils solides pour commencer.", "A short selection of strong tools to start with.") as string}
                to={`${prefix}/tools`}
                linkLabel={t("Voir tout", "See all")}
                page={featuredPage}
                total={Math.max(totalPages, 1)}
                onPrev={prevPage}
                onNext={nextPage}
                previousLabel={t("Page précédente", "Previous page") as string}
                nextLabel={t("Page suivante", "Next page") as string}
              />
              {toolsLoading && featured.length === 0 ? (
                <FeaturedSkeletonGrid />
              ) : (
                <>
                  <SwipePager className="tc-grid" onPrevious={prevPage} onNext={nextPage}>
                    {visibleFeatured.map((tool) => {
                      const catName = stripLeadingEmoji(
                        lang === "en"
                          ? (categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.nameEn
                            || categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name)
                          : categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name
                      );
                      return (
                        <ToolCardEditorial key={tool.id} tool={withHomeAssets(tool) as any} prefix={prefix} t={t} categoryLabel={catName} lang={lang} />
                      );
                    })}
                  </SwipePager>

                  <CarouselPagination
                    current={featuredPage}
                    total={totalPages}
                    onChange={setFeaturedPage}
                    label={t("Choisir une page d'outils", "Choose a tools page") as string}
                    pageLabel={(index) => t(`Page ${index + 1}`, `Page ${index + 1}`) as string}
                  />
                </>
              )}
            </section>
          )}

          {/* ══ 2. Outils IA — single row of 4 ══ */}
          {aiTools.length > 0 && (
            <section className="v2-catalog-section">
              <FeaturedHead
                label={t("Outils IA", "AI Design Tools")}
                description={t("Les assistants et modèles à comparer selon ton usage réel.", "Assistants and models to compare for your actual use.") as string}
                to={`${prefix}/category/ai-general`}
                linkLabel={t("Voir tout", "See all")}
                page={aiPage}
                total={aiTotalPages}
                onPrev={prevAiPage}
                onNext={nextAiPage}
                previousLabel={t("Page précédente", "Previous page") as string}
                nextLabel={t("Page suivante", "Next page") as string}
              />
              <SwipePager className="tc-grid" onPrevious={prevAiPage} onNext={nextAiPage}>
                {visibleAi.map((tool) => {
                  const catName = stripLeadingEmoji(
                    lang === "en"
                      ? (categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.nameEn
                        || categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name)
                      : categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name
                  );
                  return (
                    <ToolCardEditorial key={tool.id} tool={withHomeAssets(tool) as any} prefix={prefix} t={t} categoryLabel={catName} lang={lang} />
                  );
                })}
              </SwipePager>
              <CarouselPagination current={aiPage} total={aiTotalPages} onChange={setAiPage}
                label={t("Choisir une page d'outils IA", "Choose an AI tools page") as string}
                pageLabel={(index) => t(`Page ${index + 1}`, `Page ${index + 1}`) as string} />
            </section>
          )}

          {/* ══ Outils gratuits — major 2×4 shelf ══ */}
          {freeTools.length > 0 && (
            <section className="v2-catalog-section">
              <FeaturedHead
                label={t("Outils gratuits", "Free tools")}
                description={t("Des logiciels réellement utilisables sans abonnement pour lancer ou alléger votre stack.", "Software you can genuinely use without a subscription to start or lighten your stack.") as string}
                to={`${prefix}/tools?pricing=free`}
                linkLabel={t("Tous les outils gratuits", "All free tools")}
                page={freeToolsPage}
                total={freeToolsTotalPages}
                onPrev={prevFreeToolsPage}
                onNext={nextFreeToolsPage}
                previousLabel={t("Page précédente", "Previous page") as string}
                nextLabel={t("Page suivante", "Next page") as string}
              />
              <SwipePager className="tc-grid" onPrevious={prevFreeToolsPage} onNext={nextFreeToolsPage}>
                {visibleFreeTools.map((tool) => {
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
                current={freeToolsPage}
                total={freeToolsTotalPages}
                onChange={setFreeToolsPage}
                label={t("Choisir une page d’outils gratuits", "Choose a free tools page") as string}
                pageLabel={(index) => t(`Page ${index + 1}`, `Page ${index + 1}`) as string}
              />
            </section>
          )}

          {/* ══ 3. Nouveautés — logo list 3×4 ══ */}
          {latestTools.length > 0 && (
            <section className="v2-catalog-section">
              <FeaturedHead
                label={t("Nouveautés", "New Additions")}
                description={t("Les ajouts récents au catalogue ToolTrim.", "Recent additions to the ToolTrim catalogue.") as string}
                to={`${prefix}/tools`}
                linkLabel={t("Voir tout", "See all")}
                page={newPage}
                total={newTotalPages}
                onPrev={prevNewPage}
                onNext={nextNewPage}
                previousLabel={t("Page précédente", "Previous page") as string}
                nextLabel={t("Page suivante", "Next page") as string}
              />
              <SwipePager className="v2-new-grid" onPrevious={prevNewPage} onNext={nextNewPage}>
                {visibleNew.map((tool) => {
                  const catName = stripLeadingEmoji(
                    lang === "en"
                      ? (categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.nameEn
                        || categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name)
                      : categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name
                  );
                  return (
                    <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} className="v2-new-card">
                      <div className="v2-new-logo">
                        <ToolLogo tool={withHomeAssets(tool) as any} size={36} />
                      </div>
                      <div className="v2-new-info">
                        <span className="v2-new-name">{tool.name}</span>
                        {catName && <span className="v2-new-cat">{catName}</span>}
                      </div>
                    </Link>
                  );
                })}
              </SwipePager>
              <CarouselPagination current={newPage} total={newTotalPages} onChange={setNewPage}
                label={t("Choisir une page de nouveautés", "Choose a new additions page") as string}
                pageLabel={(index) => t(`Page ${index + 1}`, `Page ${index + 1}`) as string} />
            </section>
          )}

          {/* ══ 4. Editorial shelf — three categories, one visual lead each ══ */}
          <section className="v2-catalog-section v2-shelf-section">
            <SectionHead
              label={t("Explorer par univers", "Explore by category")}
              description={t("Trois portes d’entrée pour trouver rapidement les bons outils.", "Three starting points to quickly find the right tools.") as string}
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
                    tools={categoryTools}
                    prefix={prefix}
                    categoryHref={`${prefix}/category/${cat.categoryId}`}
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
                  <p className="v2-section-description">
                    {t("Les extensions et services qui s’intègrent à votre outil de travail.", "Extensions and services that integrate with your work tool.")}
                  </p>
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
                  <Link to={`${prefix}/explorer?type=outil&source=${selectedHost}`} className="tt-section-action v2-section-link">
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

          {/* ══ Automatiser son travail — major 2×4 shelf ══ */}
          {automationTools.length > 0 && (
            <section className="v2-catalog-section">
              <FeaturedHead
                label={t("Automatiser son travail", "Automate your work")}
                description={t("Connectez vos outils, éliminez les tâches répétitives et construisez des workflows plus fluides.", "Connect your tools, remove repetitive tasks and build smoother workflows.") as string}
                to={`${prefix}/category/automation`}
                linkLabel={t("Tous les outils d’automatisation", "All automation tools")}
                page={automationPage}
                total={automationTotalPages}
                onPrev={prevAutomationPage}
                onNext={nextAutomationPage}
                previousLabel={t("Page précédente", "Previous page") as string}
                nextLabel={t("Page suivante", "Next page") as string}
              />
              <SwipePager className="tc-grid" onPrevious={prevAutomationPage} onNext={nextAutomationPage}>
                {visibleAutomationTools.map((tool) => {
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
                current={automationPage}
                total={automationTotalPages}
                onChange={setAutomationPage}
                label={t("Choisir une page d’outils d’automatisation", "Choose an automation tools page") as string}
                pageLabel={(index) => t(`Page ${index + 1}`, `Page ${index + 1}`) as string}
              />
            </section>
          )}

          {/* ══ 5. Curated stack collections — visual rail 1×5 ══ */}
          <section className="v2-catalog-section">
            <FeaturedHead
              label={t("Collections de stacks", "Curated stack collections")}
              description={t("Des combinaisons éditoriales prêtes à explorer selon ton métier.", "Editorial combinations ready to explore for your role.") as string}
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
                description={t("Des analyses pour décider sans empiler les outils.", "Analysis to help you decide without stacking tools.") as string}
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
