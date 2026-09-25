import { Link, useNavigate } from "react-router-dom";
import { NEED_UNIVERSES } from "@/data/needUniverses";
import { useEffect, useMemo, useState, useCallback, useRef, type FormEvent, type ReactNode } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Search } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries, useCategories } from "@/hooks/useSupabaseData";
import { setSeoTags, setHreflang, setJsonLd, cleanupSeo, SEO_BASE } from "@/lib/seo";
import { stripLeadingEmoji } from "@/lib/text";
import ToolLogo from "@/components/ToolLogo";
import HeroSectionV2 from "@/components/home/HeroSectionV2";
import StackGoalsSection from "@/components/home/StackGoalsSection";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import ToolCardImage from "@/components/tool/ToolCardImage";
import HOME_POSTS from "@/data/home-posts-index.json";
import { getExplorerHref } from "@/lib/toolExploration";
import { TOOL_IMAGE_BLOCKLIST } from "@/lib/toolImageBlocklist";



/* Editorial universe index — needs-based categories rather than a
   technology list, matching how freelancers actually describe what they're
   trying to do. Each entry reuses the closest existing category route
   (categoryId is real, labels are overridden here rather than on the shared
   category data, which other pages still read under its original name). AI
   is deliberately not a universe here: it's cross-cutting, not a
   destination — it stays a filter/attribute inside the categories it
   already lives in (ai-general page and data are untouched, just not
   linked from this row).
   Sub-usage lines are drawn from each category's real tool taxonomy
   (functional_needs / substitution_cluster_v2 in tools_index.json), not
   invented — e.g. Content Creation's top clusters are content-creation,
   3d-software, creative-assets, and audio-daw, which read as Video / Design
   / Audio / 3D. Generic tokens that just restate the category itself
   (e.g. "analytics" inside Data & Analytics) are skipped in favor of the
   next most frequent real cluster.
   Each universe carries a hand-picked trio of real catalogue tools, always
   in the same internal order: a reference (an immediate landmark), a
   ToolTrim pick (well positioned but less obvious), and a discovery (more
   specialised or emerging). That order is an editorial rule only and is
   never labelled in the UI. The three cover different sub-usages, and each
   take is grounded in the tool's own verdict data but written for this
   homepage only, so global tool descriptions stay untouched. */

const WORKS_WITH_MAX = 12; // cards on the "Works with" shelf; the full list is one link away

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

/* ── Horizontal shelf (App Store style) ──
   Native scroll with snap, the next card peeking past the edge instead of
   pagination dots. Mouse users get prev/next buttons that fade in on hover;
   touch devices hide them and just swipe. resetKey snaps back to the start
   when the content changes (e.g. another host tab). */
function Rail({ children, resetKey, previousLabel, nextLabel }: {
  children: ReactNode;
  resetKey?: string;
  previousLabel: string;
  nextLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setEdges({
      start: track.scrollLeft <= 4,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0 });
    updateEdges();
  }, [resetKey, updateEdges]);

  useEffect(() => {
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <div className="v2-rail">
      <div ref={trackRef} className="v2-rail-track" onScroll={updateEdges}>
        {children}
      </div>
      <button type="button" className="v2-rail-nav v2-rail-nav--prev" onClick={() => scrollByPage(-1)} aria-label={previousLabel} disabled={edges.start}>
        <ChevronLeft aria-hidden />
      </button>
      <button type="button" className="v2-rail-nav v2-rail-nav--next" onClick={() => scrollByPage(1)} aria-label={nextLabel} disabled={edges.end}>
        <ChevronRight aria-hidden />
      </button>
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

export default function HomePageV2() {
  const { lang, t, prefix } = useLang();
  const navigate = useNavigate();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const posts = HOME_POSTS[lang];

  const [discoveryQuery, setDiscoveryQuery] = useState("");
  const [selectedHost, setSelectedHost] = useState("figma");

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

  const bySlug = useMemo(() => new Map(tools.map((t) => [t.slug, t])), [tools]);

  /* ── Guides: one feature + two side stories. Tags are free text ("ChatGPT Pro"),
     so each is matched as a slug, then by its first word, to find the tools
     a guide is about. Covers are deduplicated so two automation guides
     don't both show the same Zapier screenshot. ── */
  const homeGuides = useMemo(() => {
    const usedCovers = new Set<string>();
    return posts.slice(0, 3).map((post) => {
      const tagTools = (post.tags || []).flatMap((tag) => {
        const key = tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const tool = bySlug.get(key) || bySlug.get(key.split("-")[0]);
        return tool ? [tool] : [];
      });
      const candidates = [post.thumbnail, ...tagTools.map((tool) => tool.ogImageUrl)].filter((src): src is string => Boolean(src));
      const coverSrc = candidates.find((src) => !usedCovers.has(src));
      if (coverSrc) usedCovers.add(coverSrc);
      return { post, coverSrc, logoTool: tagTools[0] };
    });
  }, [posts, bySlug]);


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

  // Ranked so the shelf opens on what actually runs inside the host
  // (host_app: plugins, built-in features), then declared integrations,
  // then looser bundle links; within that, ToolTrim's firm picks and tools
  // with a real cover come first rather than whatever sorts alphabetically.
  const allCompatibleTools = useMemo(() => {
    const strength = (tool: (typeof tools)[number]) =>
      tool.host_app === selectedHost ? 2 : (tool.worksWith || []).includes(selectedHost) ? 1 : 0;
    return tools
      .filter((tool) =>
        !TOOL_IMAGE_BLOCKLIST.has(tool.slug)
        && ((tool.worksWith || []).includes(selectedHost)
          || tool.host_app === selectedHost
          || tool.bundle_parent === selectedHost))
      .sort((a, b) =>
        strength(b) - strength(a)
        || Number(b.prescription_quality === "ferme") - Number(a.prescription_quality === "ferme")
        || Number(Boolean(b.ogImageUrl)) - Number(Boolean(a.ogImageUrl))
        || a.name.localeCompare(b.name));
  }, [selectedHost, tools]);
  const compatibleTools = allCompatibleTools.slice(0, WORKS_WITH_MAX);

  const renderGuide = ({ post, coverSrc, logoTool }: (typeof homeGuides)[number], featured: boolean) => {
    const dateLabel = post.date
      ? new Date(post.date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { year: "numeric", month: "short", day: "numeric" })
      : "";
    return (
      <Link
        key={post.slug}
        to={`${prefix}/guide/${post.slug}`}
        className={`v2-today-card${featured ? " v2-today-card--feature" : ""}`}
      >
        <span className="v2-today-media">
          {coverSrc ? (
            <img src={coverSrc} alt="" loading="lazy" decoding="async" width={featured ? 1200 : 760} height={featured ? 675 : 400} />
          ) : logoTool ? (
            <ToolLogo tool={logoTool as any} size={featured ? 96 : 64} className="v2-today-fallback-logo" />
          ) : (
            <span className="v2-today-fallback">{t("Guide", "Guide")}</span>
          )}
        </span>
        <span className="v2-today-copy">
          {featured && <span className="v2-today-eyebrow">{t("Dernier guide", "Latest guide")}</span>}
          <span className="v2-today-title">{post.title}</span>
          {dateLabel && <time className="v2-today-date" dateTime={post.date}>{dateLabel}</time>}
        </span>
      </Link>
    );
  };

  return (
    <div className="home-v2">
      <HeroSectionV2 />
      <StackGoalsSection />

      <div className="v2-catalog">
        <div className="v2-container">

          {/* ══ Discovery — one calm entry point: if you know what you're
               looking for, search. If you only know the need, the universe
               index right below takes over, then a short editorial watchlist.
               (The old category chips here duplicated the universes with an
               older taxonomy, so they're gone.) ══ */}
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

          </section>

          {/* ══ 4. Editorial universe index — needs-based, not a card wall ══ */}
          <section className="v2-catalog-section v2-shelf-section">
            <SectionHead
              label={t("Explorer par univers", "Explore by need")}
              to={`${prefix}/tools`}
              linkLabel={t("Tous les outils", "All tools")}
            />
            <div className="v2-shelf-grid">
              {NEED_UNIVERSES.map((universe) => {
                const category = categories.find((c) => c.id === universe.categoryId);
                const count = toolsByCategory.get(universe.categoryId)?.length ?? 0;
                if (!category || count === 0) return null;
                const picks = universe.picks.flatMap((pick) => {
                  const tool = bySlug.get(pick.slug);
                  return tool ? [{ tool, take: lang === "en" ? pick.takeEn : pick.takeFr }] : [];
                });
                return (
                  <article key={universe.categoryId} className="v2-shelf-cell">
                    <Link to={`${prefix}/category/${category.slug}`} className="v2-shelf-cell-head">
                      <span className="v2-shelf-cell-titlerow">
                        <h3 className="v2-shelf-cell-name">{lang === "en" ? universe.labelEn : universe.labelFr}</h3>
                        <span className="v2-shelf-cell-count">
                          {t(`${count} outils`, `${count} tools`)}
                          <ArrowRight className="v2-shelf-cell-arrow" style={{ width: 13, height: 13 }} aria-hidden />
                        </span>
                      </span>
                      <span className="v2-shelf-cell-subs">{(lang === "en" ? universe.subsEn : universe.subsFr).join(" · ")}</span>
                    </Link>
                    <ul className="v2-shelf-picks">
                      {picks.map(({ tool, take }) => (
                        <li key={tool.slug}>
                          <Link to={`${prefix}/tool/${tool.slug}`} className="v2-shelf-pick">
                            <ToolLogo tool={tool as any} size={52} className="v2-shelf-pick-logo" />
                            <span className="v2-shelf-pick-copy">
                              <span className="v2-shelf-pick-name">{tool.name}</span>
                              <span className="v2-shelf-pick-take">{take}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>

          {/* ══ Tools we're watching — editorial picks, after the universes ══ */}
          {watchlistTools.length > 0 && (
            <section className="v2-catalog-section">
              <div className="v2-section-head">
                <div className="v2-section-heading-copy">
                  <h2 className="v2-section-title">{t("Les outils qu'on surveille", "Tools we're watching")}</h2>
                </div>
              </div>
              <div className="dcv-tools">
                <div className="tc-grid">
                  {watchlistTools.map(({ tool, reasonFr, reasonEn }) => (
                    <ToolCardEditorial
                      key={tool.id}
                      identityLogoSize={40}
                      tool={withHomeAssets(tool) as any}
                      prefix={prefix}
                      t={t}
                      categoryLabel={lang === "fr" ? reasonFr : reasonEn}
                      lang={lang}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ══ Works with — pick the software you already use (visible
               tabs, not a menu hidden in the title), then swipe through what
               plugs into it. ══ */}
          {workWithHosts.length > 0 && compatibleTools.length > 0 && (
            <section className="v2-catalog-section v2-ww-section">
              <SectionHead
                label={t("Travailler avec", "Works with")}
                to={getExplorerHref(prefix, { type: "outil", slug: selectedHost })}
                linkLabel={t("Tous les outils compatibles", "All compatible tools")}
              />
              <div
                className="v2-ww-tabs"
                role="tablist"
                aria-label={t("Choisir un logiciel", "Choose software") as string}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                  const index = workWithHosts.findIndex(({ tool }) => tool.slug === selectedHost);
                  const step = event.key === "ArrowRight" ? 1 : -1;
                  const next = workWithHosts[(index + step + workWithHosts.length) % workWithHosts.length];
                  setSelectedHost(next.tool.slug);
                  const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]");
                  buttons[(index + step + buttons.length) % buttons.length]?.focus();
                  event.preventDefault();
                }}
              >
                {workWithHosts.map(({ tool }) => {
                  const selected = tool.slug === selectedHost;
                  return (
                    <button
                      key={tool.slug}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      tabIndex={selected ? 0 : -1}
                      className={`v2-ww-tab${selected ? " is-active" : ""}`}
                      onClick={() => setSelectedHost(tool.slug)}
                    >
                      <ToolLogo tool={tool as any} size={20} className="v2-ww-tab-logo" />
                      <span>{tool.name}</span>
                    </button>
                  );
                })}
              </div>
              <div role="tabpanel" aria-label={workWithHosts.find(({ tool }) => tool.slug === selectedHost)?.tool.name}>
                <Rail
                  resetKey={selectedHost}
                  previousLabel={t("Outils précédents", "Previous tools") as string}
                  nextLabel={t("Outils suivants", "Next tools") as string}
                >
                  {compatibleTools.map((tool) => {
                    const catName = stripLeadingEmoji(
                      lang === "en"
                        ? (categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.nameEn
                          || categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name)
                        : categories.find((c) => c.id === tool.categoryId || c.slug === tool.categoryId)?.name
                    );
                    return (
                      <div key={tool.id} className="v2-rail-item">
                        <ToolCardEditorial tool={withHomeAssets(tool) as any} prefix={prefix} t={t} categoryLabel={catName} lang={lang} identityLogoSize={40} />
                      </div>
                    );
                  })}
                </Rail>
              </div>
            </section>
          )}

          {/* ══ Guides — "Today" format: one story up front, the next few as
               a compact list, instead of a paginated 3-up carousel. ══ */}
          {homeGuides.length > 0 && (
            <section className="v2-catalog-section">
              <SectionHead
                label={t("Articles du guide", "Guide articles")}
                to={`${prefix}/guides`}
                linkLabel={t("Tous les guides", "All guides")}
              />
              <div className="v2-today">
                {renderGuide(homeGuides[0], true)}
                {homeGuides.length > 1 && (
                  <div className="v2-today-side">
                    {homeGuides.slice(1).map((guide) => renderGuide(guide, false))}
                  </div>
                )}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
