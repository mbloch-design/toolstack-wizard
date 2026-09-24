import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback, useRef, type FormEvent, type ReactNode, type TouchEvent } from "react";
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
import { CarouselControls, CarouselPagination } from "@/components/CarouselControls";
import HOME_POSTS from "@/data/home-posts-index.json";
import { getExplorerHref } from "@/lib/toolExploration";
import { TOOL_IMAGE_BLOCKLIST } from "@/lib/toolImageBlocklist";


const POST_PAGE_SIZE = 3; // 1 row × 3 cols — guides carousel
const POST_MAX_PAGES = 4; // cap carousel depth to 4 screens

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
type UniversePick = { slug: string; takeFr: string; takeEn: string };

const EDITORIAL_UNIVERSES: Array<{
  categoryId: string; labelFr: string; labelEn: string;
  subsFr: string[]; subsEn: string[]; picks: UniversePick[];
}> = [
  {
    categoryId: "organization", labelFr: "Productivité & Travail", labelEn: "Productivity & Work",
    subsFr: ["Notes", "Gestion de projet", "Gestion de tâches", "Base de connaissances"],
    subsEn: ["Notes", "Project Management", "Task Management", "Knowledge Base"],
    picks: [
      { slug: "notion", takeFr: "Assez flexible pour devenir presque n'importe quoi.", takeEn: "Flexible enough to become almost anything." },
      { slug: "todoist", takeFr: "Capturer vite, sans outil projet à administrer.", takeEn: "Fast capture, without a project tool to run." },
      { slug: "scribe", takeFr: "Transforme votre écran en guide pas à pas.", takeEn: "Turns your screen into a step-by-step guide." },
    ],
  },
  {
    categoryId: "creation", labelFr: "Création de contenu", labelEn: "Content Creation",
    subsFr: ["Vidéo", "Design", "Audio", "3D"],
    subsEn: ["Video", "Design", "Audio", "3D"],
    picks: [
      { slug: "canva", takeFr: "La vitesse et les modèles avant le contrôle fin.", takeEn: "Speed and templates over fine control." },
      { slug: "auphonic", takeFr: "Le mastering audio de podcast, en automatique.", takeEn: "Podcast audio, mastered automatically." },
      { slug: "screen-studio", takeFr: "Des démos Mac soignées, sans passer par le montage.", takeEn: "Polished Mac demos, no editing pass." },
    ],
  },
  {
    categoryId: "design-tools", labelFr: "Design", labelEn: "Design",
    subsFr: ["Design systems", "Motion design", "Modélisation 3D", "Prototypage"],
    subsEn: ["Design Systems", "Motion Design", "3D Modeling", "Prototyping"],
    picks: [
      { slug: "figma", takeFr: "Design, prototype et handoff dans un seul fichier.", takeEn: "Design, prototype and handoff in one file." },
      { slug: "affinity-photo", takeFr: "Une alternative à Photoshop, désormais gratuite.", takeEn: "A Photoshop alternative, now free." },
      { slug: "spline", takeFr: "De la 3D interactive sans suite 3D complète.", takeEn: "Interactive 3D without a full 3D suite." },
    ],
  },
  {
    categoryId: "email-productivity", labelFr: "Marketing & Ventes", labelEn: "Marketing & Sales",
    subsFr: ["Email outreach", "Newsletter", "Prospection", "Réseaux sociaux"],
    subsEn: ["Email Outreach", "Newsletter", "Prospecting", "Social Media"],
    picks: [
      { slug: "mailchimp", takeFr: "Le point de départ classique pour une petite liste.", takeEn: "The familiar start for a small email list." },
      { slug: "lemlist", takeFr: "Pensé pour la prospection à froid, pas la newsletter.", takeEn: "Built for cold outreach, not newsletters." },
      { slug: "clay", takeFr: "Croise de nombreuses sources en une liste de leads.", takeEn: "Stacks many data sources into one lead list." },
    ],
  },
  {
    categoryId: "automation", labelFr: "Automatisation", labelEn: "Automation",
    subsFr: ["Workflows", "No-code", "Agents IA", "Web scraping"],
    subsEn: ["Workflows", "No-Code", "AI Agents", "Web Scraping"],
    picks: [
      { slug: "make", takeFr: "Le juste milieu visuel.", takeEn: "The visual middle ground." },
      { slug: "n8n", takeFr: "Puissant quand vous voulez tout contrôler.", takeEn: "Powerful when you want full control." },
      { slug: "lindy", takeFr: "L'automatisation sans tout construire vous-même.", takeEn: "Automation without building everything yourself." },
    ],
  },
  {
    categoryId: "nocode-web", labelFr: "Développement & No-Code", labelEn: "Development & No-Code",
    subsFr: ["DevOps", "Créateurs de sites", "E-commerce", "Créateurs d'apps"],
    subsEn: ["DevOps", "Website Builders", "E-commerce", "App Builders"],
    picks: [
      { slug: "webflow", takeFr: "De vrais sites en production, construits visuellement.", takeEn: "Production sites, built visually." },
      { slug: "supabase", takeFr: "Postgres, auth et stockage sans gérer de serveur.", takeEn: "Postgres, auth and storage without a server to run." },
      { slug: "carrd", takeFr: "Souvent tout ce qu'il faut pour un site d'une page.", takeEn: "Often all a one-page site needs." },
    ],
  },
  {
    categoryId: "communication", labelFr: "Communication", labelEn: "Communication",
    subsFr: ["Chat d'équipe", "Téléphonie pro", "Planification", "Support client"],
    subsEn: ["Team Chat", "Business Phone", "Scheduling", "Customer Support"],
    picks: [
      { slug: "calendly", takeFr: "Un lien de réservation qui met fin aux allers-retours.", takeEn: "A booking link that ends the back-and-forth." },
      { slug: "loom", takeFr: "Quand une vidéo de deux minutes remplace une réunion.", takeEn: "When a two-minute video beats a meeting." },
      { slug: "crisp", takeFr: "Un chat support facturé par espace, pas par siège.", takeEn: "Support chat priced per workspace, not per seat." },
    ],
  },
  {
    categoryId: "analytics", labelFr: "Données & Analytics", labelEn: "Data & Analytics",
    subsFr: ["SEO", "Visualisation de données", "Dashboards", "Recherche utilisateur"],
    subsEn: ["SEO", "Data Visualization", "Dashboards", "User Research"],
    picks: [
      { slug: "google-analytics", takeFr: "La référence gratuite pour mesurer l'audience.", takeEn: "The free default for measuring traffic." },
      { slug: "microsoft-clarity", takeFr: "Heatmaps et replays gratuits, sans plafond de trafic.", takeEn: "Free heatmaps and replays, no traffic cap." },
      { slug: "datawrapper", takeFr: "Des graphiques propres pour articles et rapports.", takeEn: "Clean charts for articles and reports." },
    ],
  },
];

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

export default function HomePageV2() {
  const { lang, t, prefix } = useLang();
  const navigate = useNavigate();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const posts = HOME_POSTS[lang];

  const [discoveryQuery, setDiscoveryQuery] = useState("");
  const [postPage, setPostPage] = useState(0);
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
              {EDITORIAL_UNIVERSES.map((universe) => {
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
                        <ToolCardEditorial tool={withHomeAssets(tool) as any} prefix={prefix} t={t} categoryLabel={catName} lang={lang} />
                      </div>
                    );
                  })}
                </Rail>
              </div>
            </section>
          )}

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
