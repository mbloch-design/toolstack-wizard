import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories, usePosts } from "@/hooks/useSupabaseData";
import { setSeoTags, setNoindex, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { stripLeadingEmoji } from "@/lib/text";
import ToolLogo from "@/components/ToolLogo";
import HeroSection from "@/components/home/HeroSection";
import { STACKS } from "@/data/stacks";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

/* ── Curated featured tools ── */
const FEATURED_SLUGS = [
  "invision","framer","chakra-ui","echarts","shadcn-ui","recharts","ant-design",
  "material-ui","storybook","17hats","adcreative","adobe","adobe-after-effects",
  "adobe-cc","adobe-illustrator","indesign","adobe-lightroom","adobe-photoshop",
  "adobe-premiere-pro","adobe-xd","affinity-photo","airslate","figma-anima",
  "ae-animation-composer","asana","audacity","autocad","ae-bao-boa",
  "basecamp","better-proposals","blender","bloom-crm",
];

const MAX_CATEGORIES = 12;
const FEATURED_STACKS = 4;
const FEATURED_POSTS = 4;

/* Fetch og_image_url for featured slugs — single Supabase query */
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

/* ── Section header ── */
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

export default function HomePageV2() {
  const { lang, t, prefix } = useLang();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { posts } = usePosts(lang);
  const ogImages = useOgImages(FEATURED_SLUGS);

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

  /* ── Stacks ── */
  const bySlug = useMemo(() => new Map(tools.map((t) => [t.slug, t])), [tools]);
  const featuredStacks = STACKS.slice(0, FEATURED_STACKS);

  /* ── Posts ── */
  const featuredPosts = posts.slice(0, FEATURED_POSTS);

  return (
    <div>
      <HeroSection />

      <div className="v2-catalog">
        <div className="v2-container">

          {/* ══ 1. Outils en vedette ══ */}
          <SectionHead
            label={t("Outils en vedette", "Featured tools")}
            to={`${prefix}/tools`}
            linkLabel={t("Voir tout", "See all")}
          />
          <div className="v2-tool-grid">
            {featured.map((tool) => (
              <Link key={tool.id} to={`${prefix}/tool/${tool.slug}`} className="v2-tool-card">
                <div className="v2-tool-panel">
                  {ogImages[tool.slug]
                    ? <img src={ogImages[tool.slug]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    : <ToolLogo tool={tool as any} size={44} />
                  }
                </div>
                <div className="v2-tool-body">
                  <div className="v2-tool-row">
                    <span className="v2-tool-name">{tool.name}</span>
                    {tool.defaultMonthlyPrice > 0 && <span className="v2-tool-price">{tool.defaultMonthlyPrice}€</span>}
                  </div>
                  <span className="v2-tool-cat">
                    {stripLeadingEmoji(lang === "en"
                      ? (categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.nameEn || categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name)
                      : categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* ══ 2. Catégories ══ */}
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

          {/* ══ 3. Stacks ══ */}
          <div style={{ marginTop: 56 }}>
            <SectionHead
              label={t("Stacks recommandées", "Recommended stacks")}
              to={`${prefix}/stacks`}
              linkLabel={t("Toutes les stacks", "All stacks")}
            />
            <div className="v2-stack-grid">
              {featuredStacks.map((stack) => {
                const stackTools = stack.tools.slice(0, 5).map((s) => bySlug.get(s.slug)).filter(Boolean);
                return (
                  <Link key={stack.slug} to={`${prefix}/stacks/${stack.slug}`} className="v2-stack-card">
                    {/* Logo cluster */}
                    <div className="v2-stack-logos">
                      {stackTools.map((st) => (
                        <div key={st!.id} className="v2-stack-logo">
                          <ToolLogo tool={st as any} size={20} />
                        </div>
                      ))}
                    </div>
                    <p className="v2-stack-title">{lang === "en" ? stack.titleEn : stack.title}</p>
                    <p className="v2-stack-sub">{lang === "en" ? stack.subtitleEn : stack.subtitle}</p>
                    <div className="v2-stack-meta">
                      <span>{stack.tools.length} {t("outils", "tools")}</span>
                      <span>{stack.monthlyBudget}€/{t("mois", "mo")}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ══ 4. Guides ══ */}
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
