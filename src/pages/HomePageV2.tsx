import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories } from "@/hooks/useSupabaseData";
import { setSeoTags, setNoindex, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { stripLeadingEmoji } from "@/lib/text";
import ToolLogo from "@/components/ToolLogo";
import HeroSection from "@/components/home/HeroSection";
import { supabase } from "@/integrations/supabase/client";

const MAX_CATEGORIES = 12;

const FEATURED_SLUGS = [
  "invision","framer","chakra-ui","echarts","shadcn-ui","recharts","ant-design",
  "material-ui","storybook","17hats","adcreative","adobe","adobe-after-effects",
  "adobe-cc","adobe-illustrator","indesign","adobe-lightroom","adobe-photoshop",
  "adobe-premiere-pro","adobe-xd","affinity-photo","airslate","figma-anima",
  "ae-animation-composer","asana","audacity","autocad","ae-bao-boa",
  "basecamp","better-proposals","blender","bloom-crm",
];

/* Fetches og_image_url for a set of slugs from Supabase (one query). */
function useOgImages(slugs: string[]): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({});
  const key = slugs.join(",");
  useEffect(() => {
    if (!slugs.length) return;
    supabase
      .from("tools")
      .select("slug, og_image_url")
      .in("slug", slugs)
      .then(({ data }) => {
        if (!data) return;
        const m: Record<string, string> = {};
        for (const row of data) {
          if (row.og_image_url) m[row.slug as string] = row.og_image_url as string;
        }
        setMap(m);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return map;
}

export default function HomePageV2() {
  const { lang, t, prefix } = useLang();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();

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

  /* ── Category cards sorted by tool count ── */
  const catCards = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const tool of tools) {
      const key = tool.categoryId;
      if (key) countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }
    return categories
      .map((cat) => ({
        ...cat,
        count: countMap.get(cat.id) ?? countMap.get(cat.slug) ?? 0,
        displayName: stripLeadingEmoji(lang === "en" ? (cat.nameEn || cat.name) : cat.name),
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_CATEGORIES);
  }, [tools, categories, lang]);

  /* ── Featured tools: curated list ── */
  const featured = useMemo(() => {
    const bySlug = new Map(tools.map((t) => [t.slug, t]));
    return FEATURED_SLUGS.flatMap((slug) => {
      const t = bySlug.get(slug);
      return t ? [t] : [];
    });
  }, [tools]);

  const ogImages = useOgImages(featured.map((t) => t.slug));

  return (
    <div>
      <HeroSection />

      {/* ── Catalogue ── */}
      <section className="v2-catalog">
        <div className="v2-container">

          {/* Search shortcut */}
          <Link to={`${prefix}/tools`} className="v2-search">
            <Search className="v2-search-icon" />
            <span className="v2-search-placeholder">
              {t("Rechercher un outil…", "Search for a tool…")}
            </span>
            <span className="v2-search-cta">
              {t(`${tools.length.toLocaleString("fr")} outils`, `${tools.length.toLocaleString("en")} tools`)}
              <ArrowRight style={{ width: 14, height: 14 }} />
            </span>
          </Link>

          {/* Category grid */}
          <div className="v2-section-head" style={{ marginTop: 40 }}>
            <h2 className="v2-section-title">
              {t("Parcourir par catégorie", "Browse by category")}
            </h2>
            <Link to={`${prefix}/category`} className="v2-section-link">
              {t("Toutes les catégories", "All categories")}
              <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          <div className="v2-cat-grid">
            {catCards.map((cat) => {
              const Icon = getCategoryIcon(cat.id);
              return (
                <Link
                  key={cat.id}
                  to={`${prefix}/category/${cat.slug}`}
                  className="v2-cat-card"
                >
                  <span className="v2-cat-icon">
                    <Icon style={{ width: 16, height: 16 }} />
                  </span>
                  <span className="v2-cat-name">{cat.displayName}</span>
                  <span className="v2-cat-count">{cat.count}</span>
                </Link>
              );
            })}
          </div>

          {/* Tool grid */}
          <div className="v2-section-head" style={{ marginTop: 52 }}>
            <h2 className="v2-section-title">
              {t("Outils en vedette", "Featured tools")}
            </h2>
            <Link to={`${prefix}/tools`} className="v2-section-link">
              {t("Voir tout", "See all")}
              <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          <div className="v2-tool-grid">
            {featured.map((tool) => (
              <Link
                key={tool.id}
                to={`${prefix}/tool/${tool.slug}`}
                className="v2-tool-card"
              >
                <div className="v2-tool-panel">
                  {ogImages[tool.slug]
                    ? <img src={ogImages[tool.slug]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    : <ToolLogo tool={tool as any} size={52} />
                  }
                </div>
                <div className="v2-tool-body">
                  <div className="v2-tool-row">
                    <span className="v2-tool-name">{tool.name}</span>
                    {tool.defaultMonthlyPrice > 0 && (
                      <span className="v2-tool-price">
                        {tool.defaultMonthlyPrice}€
                      </span>
                    )}
                  </div>
                  {tool.categoryId && (
                    <span className="v2-tool-cat">
                      {stripLeadingEmoji(
                        lang === "en"
                          ? (categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.nameEn
                              || categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name)
                          : categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name
                      )}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}
