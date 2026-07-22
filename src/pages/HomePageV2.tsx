import { Link } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode, type TouchEvent } from "react";
import { ArrowRight, Bookmark } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { setSeoTags, setHreflang, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import ToolLogo from "@/components/ToolLogo";
import ToolLogoPile from "@/components/ToolLogoPile";
import HeroSectionV2 from "@/components/home/HeroSectionV2";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import { CarouselControls, CarouselPagination } from "@/components/CarouselControls";
// Light index (first 12 stacks, ~3KB gzip) instead of the full 1.7MB stacks.ts:
// HomePageV2 is an eager import, so pulling stacks.ts here modulepreloaded the
// data-stacks chunk on every page. Regenerate with scripts/gen-stacks-index.ts.
import STACKS from "@/data/stacks-index.json";


const PAGE_SIZE = 8;      // 2 rows × 4 cols — featured carousel
const NEW_PAGE_SIZE = 12; // 3 rows × 4 cols — new tools carousel
const STACK_PAGE_SIZE = 3; // 1 row × 3 cols — stacks carousel
const STACK_MAX_PAGES = 4; // cap carousel depth to 4 screens
const POST_PAGE_SIZE = 3; // 1 row × 3 cols — guides carousel
const POST_MAX_PAGES = 4; // cap carousel depth to 4 screens

/* ── Category "duo rows" — two side-by-side compact-list carousels
   sharing one row, picked for the biggest catalog sections not already
   surfaced elsewhere on the homepage (Featured/AI/New are curated
   cross-category picks, not per-category browsing). */
const DUO_ROWS: { categoryId: string; label: string; labelEn: string }[][] = [
  [
    { categoryId: "creation", label: "Création de contenu", labelEn: "Content Creation" },
    { categoryId: "nocode-web", label: "No-Code & Web", labelEn: "No-Code & Web" },
  ],
  [
    { categoryId: "analytics", label: "Analytics", labelEn: "Analytics" },
    { categoryId: "communication", label: "Communication", labelEn: "Communication" },
  ],
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

const DUO_PAGE_SIZE = 6; // 2 cols × 3 rows per panel

/* ── One side of a two-up category row: compact icon+name+tagline list,
   its own mini pagination (arrows either side of a "see all" link). ── */
function CategoryDuoPanel({
  title, tools, prefix, categoryHref, seeAllLabel, previousLabel, nextLabel,
}: {
  title: string;
  tools: any[];
  prefix: string;
  categoryHref: string;
  seeAllLabel: string;
  previousLabel: string;
  nextLabel: string;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(tools.length / DUO_PAGE_SIZE));
  const visible = tools.slice(page * DUO_PAGE_SIZE, (page + 1) * DUO_PAGE_SIZE);

  return (
    <div className="v2-duo-panel">
      <div className="v2-duo-panel-head">
        <h3 className="v2-duo-panel-title">{title}</h3>
        <div className="v2-duo-panel-nav">
          <CarouselControls
            onPrevious={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            previousDisabled={page === 0}
            nextDisabled={page >= totalPages - 1}
            previousLabel={previousLabel}
            nextLabel={nextLabel}
          />
          <Link to={categoryHref} className="tt-section-action v2-duo-panel-link">
            {seeAllLabel}
            <ArrowRight aria-hidden />
          </Link>
        </div>
      </div>
      <div className="v2-duo-list">
        {visible.map((tool) => (
          <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} className="v2-duo-item">
            <div className="v2-duo-item-logo"><ToolLogo tool={tool} size={26} /></div>
            <div className="v2-duo-item-text">
              <span className="v2-duo-item-name">{tool.name}</span>
              <span className="v2-duo-item-sub">{shortTagline(tool.shortDescription)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function HomePageV2() {
  const { lang, t, prefix } = useLang();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);

  const [featuredPage, setFeaturedPage] = useState(0);
  const [newPage, setNewPage] = useState(0);
  const [stackPage, setStackPage] = useState(0);
  const [aiPage, setAiPage] = useState(0);
  const [postPage, setPostPage] = useState(0);

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

  /* ── New tools (static curated list, no date column in DB) ── */
  const latestTools = useMemo(() => {
    const bySlug = new Map(tools.map((t) => [t.slug, t]));
    return NEW_SLUGS.flatMap((slug) => { const t = bySlug.get(slug); return t ? [t] : []; });
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

  return (
    <div>
      <HeroSectionV2 />

      <div className="v2-catalog">
        <div className="v2-container">

          {/* ══ 1. Outils en vedette — carousel 2×4 ══
               Gated on featured.length, same pattern as every other
               conditional section below (Outils IA, Nouveautés...):
               prescription_quality (what "featured" filters on) only
               exists once the Supabase fetch resolves — the static/
               offline fallback data doesn't carry it — so featured is
               legitimately [] during that window. Showing the heading
               + arrows with zero cards under it looked broken; hide the
               whole section instead of rendering it empty. */}
          {featured.length > 0 && (
          <>
          <FeaturedHead
            label={t("Outils en vedette", "Featured tools")}
            description={t("Une sélection courte d'outils solides pour commencer.", "A short selection of strong tools to start with.") as string}
            to={`${prefix}/tools`}
            linkLabel={t("Voir tout", "See all")}
            page={featuredPage}
            total={totalPages}
            onPrev={prevPage}
            onNext={nextPage}
            previousLabel={t("Page précédente", "Previous page") as string}
            nextLabel={t("Page suivante", "Next page") as string}
          />
          <SwipePager className="tc-grid" onPrevious={prevPage} onNext={nextPage}>
            {visibleFeatured.map((tool) => {
              const catName = stripLeadingEmoji(
                lang === "en"
                  ? (categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.nameEn
                    || categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name)
                  : categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name
              );
              return (
                <ToolCardEditorial key={tool.id} tool={tool as any} prefix={prefix} t={t} categoryLabel={catName} lang={lang} />
              );
            })}
          </SwipePager>

          {/* Page dots */}
          <CarouselPagination
            current={featuredPage}
            total={totalPages}
            onChange={setFeaturedPage}
            label={t("Choisir une page d'outils", "Choose a tools page") as string}
            pageLabel={(index) => t(`Page ${index + 1}`, `Page ${index + 1}`) as string}
          />
          </>
          )}

          {/* ══ 2. Outils IA — single row of 4 ══ */}
          {aiTools.length > 0 && (
            <div style={{ marginTop: 56 }}>
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
                    <ToolCardEditorial key={tool.id} tool={tool as any} prefix={prefix} t={t} categoryLabel={catName} lang={lang} />
                  );
                })}
              </SwipePager>
              <CarouselPagination current={aiPage} total={aiTotalPages} onChange={setAiPage}
                label={t("Choisir une page d'outils IA", "Choose an AI tools page") as string}
                pageLabel={(index) => t(`Page ${index + 1}`, `Page ${index + 1}`) as string} />
            </div>
          )}

          {/* ══ 3. Nouveautés — logo list 3×4 ══ */}
          {latestTools.length > 0 && (
            <div style={{ marginTop: 56 }}>
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
                        <ToolLogo tool={tool as any} size={36} />
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
            </div>
          )}

          {/* ══ 4b. Category duo rows — two compact-list carousels sharing a row ══ */}
          {DUO_ROWS.map((row, rowIndex) => {
            const panels = row
              .map((cat) => ({
                cat,
                categoryTools: toolsByCategory.get(cat.categoryId) || [],
              }))
              .filter((p) => p.categoryTools.length > 0);
            if (panels.length === 0) return null;
            return (
              <div key={rowIndex} className="v2-duo-row" style={{ marginTop: 56 }}>
                {panels.map(({ cat, categoryTools }) => (
                  <CategoryDuoPanel
                    key={cat.categoryId}
                    title={lang === "en" ? cat.labelEn : cat.label}
                    tools={categoryTools}
                    prefix={prefix}
                    categoryHref={`${prefix}/category/${cat.categoryId}`}
                    seeAllLabel={t("Voir tout", "See all") as string}
                    previousLabel={t("Page précédente", "Previous page") as string}
                    nextLabel={t("Page suivante", "Next page") as string}
                  />
                ))}
              </div>
            );
          })}

          {/* ══ 5. Stacks — carousel 1×3 ══ */}
          <div style={{ marginTop: 56 }}>
            <FeaturedHead
              label={t("Stacks recommandées", "Recommended stacks")}
              description={t("Des combinaisons cohérentes selon le métier, le budget et le niveau.", "Coherent combinations by role, budget and experience.") as string}
              to={`${prefix}/stacks`}
              linkLabel={t("Toutes les stacks", "All stacks")}
              page={stackPage}
              total={stackTotalPages}
              onPrev={prevStackPage}
              onNext={nextStackPage}
              previousLabel={t("Page précédente", "Previous page") as string}
              nextLabel={t("Page suivante", "Next page") as string}
            />
            <SwipePager className="v2-stack-grid" onPrevious={prevStackPage} onNext={nextStackPage}>
              {visibleStacks.map((stack) => {
                const stackTools = stack.tools.slice(0, 5).map((s) => bySlug.get(s.slug)).filter(Boolean);
                return (
                  <Link key={stack.slug} to={`${prefix}/stacks/${stack.slug}`} className="v2-stack-card">
                    <div className="v2-stack-top">
                      <ToolLogoPile
                        tools={stackTools as any[]}
                        totalCount={stack.tools.length}
                        max={5}
                        size="sm"
                        ariaLabel={t("Outils de la stack", "Stack tools") as string}
                        moreLabel={(count) => t(`${count} outils supplémentaires`, `${count} more tools`) as string}
                        className="v2-stack-logos"
                      />
                      <Bookmark className="v2-stack-bookmark" style={{ width: 16, height: 16 }} />
                    </div>
                    <p className="v2-stack-title">{lang === "en" ? stack.titleEn : stack.title}</p>
                    <p className="v2-stack-sub">{lang === "en" ? stack.subtitleEn : stack.subtitle}</p>
                    <div className="v2-stack-meta">
                      <span>{stack.tools.length} {t("outils", "tools")}</span>
                    </div>
                  </Link>
                );
              })}
            </SwipePager>
            <CarouselPagination current={stackPage} total={stackTotalPages} onChange={setStackPage}
              label={t("Choisir une page de stacks", "Choose a stacks page") as string}
              pageLabel={(index) => t(`Page ${index + 1}`, `Page ${index + 1}`) as string} />
          </div>

          {/* ══ 6. Guides — carousel 1×3, same shape as Stacks ══ */}
          {cappedPosts.length > 0 && (
            <div style={{ marginTop: 56, paddingBottom: "clamp(64px,8vw,112px)" }}>
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
              <SwipePager className="v2-stack-grid" onPrevious={prevPostPage} onNext={nextPostPage}>
                {visiblePosts.map((post) => {
                  const dateLabel = post.date
                    ? new Date(post.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { year: "numeric", month: "short", day: "numeric" })
                    : "";
                  const postTools = (post.tags || [])
                    .map((tag) => bySlug.get(tag))
                    .filter(Boolean)
                    .slice(0, 5);
                  return (
                    <Link key={post.slug} to={`${prefix}/guide/${post.slug}`} className="v2-stack-card">
                      {postTools.length > 0 && (
                        <div className="v2-stack-top">
                          <ToolLogoPile
                            tools={postTools as any[]}
                            max={5}
                            size="sm"
                            ariaLabel={t("Outils cités", "Mentioned tools") as string}
                            moreLabel={(count) => t(`${count} outils supplémentaires`, `${count} more tools`) as string}
                            className="v2-stack-logos"
                          />
                        </div>
                      )}
                      <p className="v2-stack-title">{post.title}</p>
                      {post.excerpt && <p className="v2-stack-sub">{post.excerpt}</p>}
                      <div className="v2-stack-meta v2-post-meta">
                        <span>{dateLabel}</span>
                        {post.readTime && <span>{post.readTime}</span>}
                      </div>
                    </Link>
                  );
                })}
              </SwipePager>
              <CarouselPagination current={postPage} total={postTotalPages} onChange={setPostPage}
                label={t("Choisir une page de guides", "Choose a guides page") as string}
                pageLabel={(index) => t(`Page ${index + 1}`, `Page ${index + 1}`) as string} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
