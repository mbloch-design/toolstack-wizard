import { Link } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { setSeoTags, setNoindex, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { stripLeadingEmoji } from "@/lib/text";
import ToolLogo from "@/components/ToolLogo";
import HeroSectionV2 from "@/components/home/HeroSectionV2";
import { STACKS } from "@/data/stacks";
import { supabase } from "@/integrations/supabase/client";

/* ── Curated featured tools ── */
const FEATURED_SLUGS = [
  "invision","framer","chakra-ui","echarts","shadcn-ui","recharts","ant-design",
  "material-ui","storybook","17hats","adcreative","adobe","adobe-after-effects",
  "adobe-cc","adobe-illustrator","indesign","adobe-lightroom","adobe-photoshop",
  "adobe-premiere-pro","adobe-xd","affinity-photo","airslate","figma-anima",
  "ae-animation-composer","asana","audacity","autocad","ae-bao-boa",
  "basecamp","better-proposals","blender","bloom-crm",
];

const PAGE_SIZE = 8;      // 2 rows × 4 cols — featured carousel
const NEW_PAGE_SIZE = 12; // 3 rows × 4 cols — new tools carousel
const STACK_PAGE_SIZE = 3; // 1 row × 3 cols — stacks carousel
const STACK_MAX_PAGES = 4; // cap carousel depth to 4 screens
const MAX_CATEGORIES = 12;
const FEATURED_POSTS = 4;

/* Fetch og_image_url for featured slugs */
function useOgImages(slugs: string[]): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({});
  const key = slugs.join(",");
  useEffect(() => {
    if (!slugs.length) return;
    supabase.from("tools").select("slug, og_image_url").in("slug", slugs)
      .then(({ data }) => {
        if (!data) return;
        const m: Record<string, string> = {};
        for (const row of data) if (row.og_image_url) m[row.slug as string] = row.og_image_url as string;
        setMap(m);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return map;
}

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

/* ── Generic section header ── */
function SectionHead({ label, to, linkLabel }: { label: string; to: string; linkLabel: string }) {
  return (
    <div className="v2-section-head">
      <h2 className="v2-section-title">{label}</h2>
      <Link to={to} className="v2-section-link">
        {linkLabel} <ArrowRight style={{ width: 13, height: 13 }} />
      </Link>
    </div>
  );
}

/* ── Featured carousel header with arrows ── */
function FeaturedHead({
  label, to, linkLabel, page, total, onPrev, onNext,
}: {
  label: string; to: string; linkLabel: string;
  page: number; total: number; onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className="v2-section-head">
      <h2 className="v2-section-title">{label}</h2>
      <div className="v2-featured-nav">
        <button
          className="v2-feat-arrow"
          onClick={onPrev}
          disabled={page === 0}
          aria-label="Page précédente"
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </button>
        <button
          className="v2-feat-arrow"
          onClick={onNext}
          disabled={page >= total - 1}
          aria-label="Page suivante"
        >
          <ChevronRight style={{ width: 16, height: 16 }} />
        </button>
        <Link to={to} className="v2-section-link" style={{ marginLeft: 8 }}>
          {linkLabel} <ArrowRight style={{ width: 13, height: 13 }} />
        </Link>
      </div>
    </div>
  );
}

export default function HomePageV2() {
  const { lang, t, prefix } = useLang();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);
  const ogImages = useOgImages(useMemo(() => [...FEATURED_SLUGS, ...AI_SLUGS], []));

  const [featuredPage, setFeaturedPage] = useState(0);
  const [newPage, setNewPage] = useState(0);
  const [stackPage, setStackPage] = useState(0);
  const [aiPage, setAiPage] = useState(0);

  useEffect(() => {
    setSeoTags({
      title: "ToolTrim V2 (test)",
      description: "Page de test — non indexée.",
      url: `${SEO_BASE}/${lang}/v2`,
      locale: lang === "fr" ? "fr_FR" : "en_US",
    });
    setNoindex();
    return () => cleanupSeo([]);
  }, [lang]);

  /* ── Featured tools ── */
  const featured = useMemo(() => {
    const bySlug = new Map(tools.map((t) => [t.slug, t]));
    return FEATURED_SLUGS.flatMap((slug) => { const t = bySlug.get(slug); return t ? [t] : []; });
  }, [tools]);

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

  /* ── Category cards ── */
  const catCards = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const tool of tools) { const key = tool.categoryId; if (key) countMap.set(key, (countMap.get(key) ?? 0) + 1); }
    return categories
      .map((cat) => ({ ...cat, count: countMap.get(cat.id) ?? countMap.get(cat.slug) ?? 0, displayName: stripLeadingEmoji(lang === "en" ? (cat.nameEn || cat.name) : cat.name) }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_CATEGORIES);
  }, [tools, categories, lang]);

  /* ── Stacks pagination (capped to STACK_MAX_PAGES screens) ── */
  const bySlug = useMemo(() => new Map(tools.map((t) => [t.slug, t])), [tools]);
  const stackTotalPages = Math.min(STACK_MAX_PAGES, Math.ceil(STACKS.length / STACK_PAGE_SIZE));
  const cappedStacks = STACKS.slice(0, stackTotalPages * STACK_PAGE_SIZE);
  const visibleStacks = cappedStacks.slice(stackPage * STACK_PAGE_SIZE, (stackPage + 1) * STACK_PAGE_SIZE);
  const prevStackPage = useCallback(() => setStackPage((p) => Math.max(0, p - 1)), []);
  const nextStackPage = useCallback(() => setStackPage((p) => Math.min(stackTotalPages - 1, p + 1)), [stackTotalPages]);

  /* ── Posts ── */
  const featuredPosts = posts.slice(0, FEATURED_POSTS);

  return (
    <div>
      <HeroSectionV2 />

      <div className="v2-catalog">
        <div className="v2-container">

          {/* ══ 1. Outils en vedette — carousel 2×4 ══ */}
          <FeaturedHead
            label={t("Outils en vedette", "Featured tools")}
            to={`${prefix}/tools`}
            linkLabel={t("Voir tout", "See all")}
            page={featuredPage}
            total={totalPages}
            onPrev={prevPage}
            onNext={nextPage}
          />
          <div className="v2-feat-grid">
            {visibleFeatured.map((tool) => {
              const catName = stripLeadingEmoji(
                lang === "en"
                  ? (categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.nameEn
                    || categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name)
                  : categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name
              );
              return (
                <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} className="v2-feat-card">
                  <div className="v2-feat-img">
                    {ogImages[tool.slug]
                      ? <img src={ogImages[tool.slug]} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      : <div className="v2-feat-logo"><ToolLogo tool={tool as any} size={40} /></div>
                    }
                  </div>
                  <div className="v2-feat-body">
                    <span className="v2-feat-name">{tool.name}</span>
                    {catName && <span className="v2-feat-cat">{catName}</span>}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Page dots */}
          {totalPages > 1 && (
            <div className="v2-feat-dots">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`v2-feat-dot${i === featuredPage ? " v2-feat-dot--active" : ""}`}
                  onClick={() => setFeaturedPage(i)}
                  aria-label={`Page ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* ══ 2. Outils IA — single row of 4 ══ */}
          {aiTools.length > 0 && (
            <div style={{ marginTop: 56 }}>
              <FeaturedHead
                label={t("Outils IA", "AI Design Tools")}
                to={`${prefix}/category/ai-general`}
                linkLabel={t("Voir tout", "See all")}
                page={aiPage}
                total={aiTotalPages}
                onPrev={prevAiPage}
                onNext={nextAiPage}
              />
              <div className="v2-ai-grid">
                {visibleAi.map((tool) => {
                  const catName = stripLeadingEmoji(
                    lang === "en"
                      ? (categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.nameEn
                        || categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name)
                      : categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name
                  );
                  return (
                    <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} className="v2-ai-card">
                      <div className="v2-ai-img">
                        {ogImages[tool.slug]
                          ? <img src={ogImages[tool.slug]} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                          : <div className="v2-feat-logo"><ToolLogo tool={tool as any} size={44} /></div>
                        }
                      </div>
                      <div className="v2-feat-body">
                        <span className="v2-feat-name">{tool.name}</span>
                        {catName && <span className="v2-feat-cat">{catName}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
              {aiTotalPages > 1 && (
                <div className="v2-feat-dots">
                  {Array.from({ length: aiTotalPages }).map((_, i) => (
                    <button key={i} className={`v2-feat-dot${i === aiPage ? " v2-feat-dot--active" : ""}`}
                      onClick={() => setAiPage(i)} aria-label={`Page ${i + 1}`} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ 3. Nouveautés — logo list 3×4 ══ */}
          {latestTools.length > 0 && (
            <div style={{ marginTop: 56 }}>
              <FeaturedHead
                label={t("Nouveautés", "New Additions")}
                to={`${prefix}/tools`}
                linkLabel={t("Voir tout", "See all")}
                page={newPage}
                total={newTotalPages}
                onPrev={prevNewPage}
                onNext={nextNewPage}
              />
              <div className="v2-new-grid">
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
              </div>
              {newTotalPages > 1 && (
                <div className="v2-feat-dots">
                  {Array.from({ length: newTotalPages }).map((_, i) => (
                    <button key={i} className={`v2-feat-dot${i === newPage ? " v2-feat-dot--active" : ""}`}
                      onClick={() => setNewPage(i)} aria-label={`Page ${i + 1}`} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ 4. Catégories ══ */}
          <div style={{ marginTop: 56 }}>
            <SectionHead
              label={t("Catégories", "Categories")}
              to={`${prefix}/category`}
              linkLabel={t("Toutes", "All")}
            />
            <div className="v2-cat-grid">
              {catCards.map((cat) => {
                const Icon = getCategoryIcon(cat.id);
                return (
                  <Link key={cat.id} to={`${prefix}/category/${cat.slug}`} className="v2-cat-card">
                    <span className="v2-cat-icon"><Icon style={{ width: 15, height: 15 }} /></span>
                    <span className="v2-cat-name">{cat.displayName}</span>
                    <span className="v2-cat-count">{cat.count}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ══ 5. Stacks — carousel 1×3 ══ */}
          <div style={{ marginTop: 56 }}>
            <FeaturedHead
              label={t("Stacks recommandées", "Recommended stacks")}
              to={`${prefix}/stacks`}
              linkLabel={t("Toutes les stacks", "All stacks")}
              page={stackPage}
              total={stackTotalPages}
              onPrev={prevStackPage}
              onNext={nextStackPage}
            />
            <div className="v2-stack-grid">
              {visibleStacks.map((stack) => {
                const stackTools = stack.tools.slice(0, 5).map((s) => bySlug.get(s.slug)).filter(Boolean);
                return (
                  <Link key={stack.slug} to={`${prefix}/stacks/${stack.slug}`} className="v2-stack-card">
                    <div className="v2-stack-top">
                      <div className="v2-stack-logos">
                        {stackTools.map((st) => (
                          <div key={st!.id} className="v2-stack-logo">
                            <ToolLogo tool={st as any} size={22} />
                          </div>
                        ))}
                      </div>
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
            </div>
            {stackTotalPages > 1 && (
              <div className="v2-feat-dots">
                {Array.from({ length: stackTotalPages }).map((_, i) => (
                  <button key={i} className={`v2-feat-dot${i === stackPage ? " v2-feat-dot--active" : ""}`}
                    onClick={() => setStackPage(i)} aria-label={`Page ${i + 1}`} />
                ))}
              </div>
            )}
          </div>

          {/* ══ 6. Guides ══ */}
          {featuredPosts.length > 0 && (
            <div style={{ marginTop: 56, paddingBottom: "clamp(64px,8vw,112px)" }}>
              <SectionHead
                label={t("Articles du guide", "Guide articles")}
                to={`${prefix}/guides`}
                linkLabel={t("Tous les guides", "All guides")}
              />
              <div className="v2-post-grid">
                {featuredPosts.map((post) => (
                  <Link key={post.slug} to={`${prefix}/guide/${post.slug}`} className="v2-post-card">
                    <p className="v2-post-date">
                      {post.date ? new Date(post.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { year: "numeric", month: "short", day: "numeric" }) : ""}
                      {post.readTime ? ` · ${post.readTime}` : ""}
                    </p>
                    <p className="v2-post-title">{post.title}</p>
                    <p className="v2-post-excerpt">{post.excerpt}</p>
                    <span className="v2-post-cta">
                      {t("Lire", "Read")} <ArrowRight style={{ width: 12, height: 12 }} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
