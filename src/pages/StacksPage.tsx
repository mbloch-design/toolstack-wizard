import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, SlidersHorizontal } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import {
  STACK_PERSONAS,
  STACKS,
  type StackPersona,
  type StackStage,
} from "@/data/stacks";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type StackListItem = (typeof STACKS)[number];
type StackFacetProfile    = "all" | StackPersona;
type StackFacetObjective  = "all" | "content" | "sell" | "clients" | "automate" | "produce" | "organize";
type StackFacetBudget     = "all" | "light" | "standard" | "premium";
type StackFacetComplexity = "all" | StackStage;
type StackSortId          = "recommended" | "budget" | "tools";

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const FEATURED_STACK_SLUGS = [
  "developpeur-freelance-shipper",
  "designer-freelance-solo",
  "consultant-b2b-propre",
  "createur-contenu-operateur",
  "ops-manager-fractional-coo",
  "freelance-solo-zero-bloat",
  "freelance",
  "agence-marketing",
  "solopreneur",
  "ecommerce",
  "startup-saas",
];

const PROFILE_RECOMMENDED_STACKS = [
  { persona: "content"    as StackPersona, slug: "createur-contenu-operateur" },
  { persona: "designer"   as StackPersona, slug: "designer-freelance-solo" },
  { persona: "dev"        as StackPersona, slug: "developpeur-freelance-shipper" },
  { persona: "consultant" as StackPersona, slug: "consultant-b2b-propre" },
  { persona: "ops"        as StackPersona, slug: "ops-manager-fractional-coo" },
  { persona: "solo"       as StackPersona, slug: "freelance-solo-zero-bloat" },
] as const;

/* Facet definitions */
const PROFILE_OPTIONS: { id: StackFacetProfile; label: string; labelEn: string }[] = [
  { id: "all",        label: "Tous",        labelEn: "All" },
  { id: "content",    label: "Créateur",    labelEn: "Creator" },
  { id: "consultant", label: "Consultant",  labelEn: "Consultant" },
  { id: "designer",   label: "Designer",    labelEn: "Designer" },
  { id: "dev",        label: "Développeur", labelEn: "Developer" },
  { id: "ops",        label: "Ops",         labelEn: "Ops" },
  { id: "solo",       label: "Solo",        labelEn: "Solo" },
];

const OBJECTIVE_OPTIONS: { id: StackFacetObjective; label: string; labelEn: string }[] = [
  { id: "all",      label: "Tous",              labelEn: "All" },
  { id: "content",  label: "Créer du contenu",  labelEn: "Create content" },
  { id: "sell",     label: "Vendre",            labelEn: "Sell" },
  { id: "clients",  label: "Gérer ses clients", labelEn: "Manage clients" },
  { id: "automate", label: "Automatiser",       labelEn: "Automate" },
  { id: "produce",  label: "Produire",          labelEn: "Produce" },
  { id: "organize", label: "Organiser",         labelEn: "Organize" },
];

const BUDGET_OPTIONS: { id: StackFacetBudget; label: string; labelEn: string }[] = [
  { id: "all",      label: "Tous",          labelEn: "All" },
  { id: "light",    label: "Budget léger",  labelEn: "Lean budget" },
  { id: "standard", label: "Standard",      labelEn: "Standard" },
  { id: "premium",  label: "Premium",       labelEn: "Premium" },
];

const COMPLEXITY_OPTIONS: { id: StackFacetComplexity; label: string; labelEn: string }[] = [
  { id: "all",     label: "Tous",          labelEn: "All" },
  { id: "starter", label: "Débutant",      labelEn: "Beginner" },
  { id: "lean",    label: "Intermédiaire", labelEn: "Intermediate" },
  { id: "scale",   label: "Avancé",        labelEn: "Advanced" },
];

/* Sub-profile → objective mapping */
const OBJECTIVE_SUBPROFILES: Record<Exclude<StackFacetObjective, "all">, string[]> = {
  content:  ["copywriting", "newsletter", "social-content", "podcast", "video", "photo",
             "research", "seo", "short-video", "youtube-long", "audio-creator", "linkedin-content",
             "creator-newsletter", "instagram-creator", "ugc-creator", "influencer",
             "educational-content", "seo-blogging", "ai-content", "brand-content", "repurposing",
             "community-creator", "training"],
  sell:     ["crm-sales", "ecommerce", "sales-bd", "cro-conversion", "infoproducts",
             "digital-products", "affiliate-content", "ecommerce-content"],
  clients:  ["client-delivery", "coaching", "admin", "strategy-consulting",
             "management-consulting", "hr-consulting", "recruiting"],
  automate: ["automation", "no-code", "ai-coding", "api-integration", "automation-ops",
             "ai-automation-consulting", "ai-ops"],
  produce:  ["web", "product", "brand", "ui-ux", "illustration", "motion", "art-direction",
             "photo", "video", "full-stack", "front-end", "back-end", "mvp-startup",
             "web-redesign", "mobile-dev", "interior-design"],
  organize: ["operations", "analytics", "admin", "reporting-ops", "finance-cfo",
             "bizops", "revops", "marketing-ops", "product-ops", "fractional-coo",
             "ops-manager", "people-ops", "finance-ops", "delivery-ops", "customer-ops",
             "agency-ops", "it-systems", "legal-ops"],
};

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function personaLabel(persona: StackPersona, locale: "fr" | "en") {
  const item = STACK_PERSONAS.find((p) => p.value === persona);
  return locale === "fr" ? item?.label || persona : item?.labelEn || persona;
}

function getStackObjectives(stack: StackListItem): StackFacetObjective[] {
  const subs = new Set(stack.subProfiles as string[]);
  const matched = (Object.entries(OBJECTIVE_SUBPROFILES) as [StackFacetObjective, string[]][])
    .filter(([, profiles]) => profiles.some((p) => subs.has(p)))
    .map(([id]) => id);
  return matched.length > 0 ? matched : ["produce"];
}

function stackMatchesFacets(
  stack: StackListItem,
  profile: StackFacetProfile,
  objective: StackFacetObjective,
  budget: StackFacetBudget,
  complexity: StackFacetComplexity,
  query: string,
): boolean {
  if (profile !== "all" && stack.persona !== profile) return false;
  if (complexity !== "all" && stack.stage !== complexity) return false;
  if (budget === "light"    && stack.monthlyBudget > 50)                               return false;
  if (budget === "standard" && (stack.monthlyBudget <= 50 || stack.monthlyBudget > 150)) return false;
  if (budget === "premium"  && stack.monthlyBudget <= 150)                             return false;
  if (objective !== "all" && !getStackObjectives(stack).includes(objective))           return false;
  if (query) {
    const text = [
      stack.title, stack.titleEn, stack.subtitle, stack.subtitleEn,
      stack.bestFor, stack.bestForEn, stack.risk, stack.riskEn,
      ...stack.tools.map((slot) => `${slot.role} ${slot.roleEn} ${slot.slug}`),
    ].join(" ").toLowerCase();
    if (!text.includes(query)) return false;
  }
  return true;
}

/* Count stacks for a given option (excluding that facet) */
function countForProfile(id: StackFacetProfile, all: StackListItem[]) {
  return id === "all" ? all.length : all.filter((s) => s.persona === id).length;
}
function countForObjective(id: StackFacetObjective, all: StackListItem[]) {
  return id === "all" ? all.length : all.filter((s) => getStackObjectives(s).includes(id)).length;
}
function countForBudget(id: StackFacetBudget, all: StackListItem[]) {
  if (id === "all")      return all.length;
  if (id === "light")    return all.filter((s) => s.monthlyBudget <= 50).length;
  if (id === "standard") return all.filter((s) => s.monthlyBudget > 50 && s.monthlyBudget <= 150).length;
  return all.filter((s) => s.monthlyBudget > 150).length;
}
function countForComplexity(id: StackFacetComplexity, all: StackListItem[]) {
  return id === "all" ? all.length : all.filter((s) => s.stage === id).length;
}

/* Stage → label */
const STAGE_LABELS: Record<StackStage, { fr: string; en: string }> = {
  starter: { fr: "Débutant",      en: "Beginner" },
  lean:    { fr: "Intermédiaire", en: "Intermediate" },
  scale:   { fr: "Avancé",        en: "Advanced" },
};

/* Budget → display label */
function budgetDisplayLabel(monthly: number, lang: "fr" | "en") {
  if (monthly === 0)    return lang === "fr" ? "Gratuit" : "Free";
  if (monthly <= 50)    return lang === "fr" ? "Budget léger" : "Lean budget";
  if (monthly <= 150)   return lang === "fr" ? "Standard" : "Standard";
  return lang === "fr" ? "Premium" : "Premium";
}

/* ─── Facet group sub-component ─────────────────────────────────────────────── */
interface FacetGroupProps<T extends string> {
  label: string;
  options: { id: T; label: string; labelEn: string }[];
  active: T;
  onChange: (id: T) => void;
  counts: Map<T, number>;
  lang: "fr" | "en";
}

function FacetGroup<T extends string>({
  label, options, active, onChange, counts, lang,
}: FacetGroupProps<T>) {
  return (
    <div className="sk-facet-group">
      <p className="sk-facet-group-label">{label}</p>
      {options.map((opt) => {
        const count = counts.get(opt.id) ?? 0;
        const isActive = opt.id === active;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(opt.id)}
            className={`sk-facet-option${isActive ? " sk-facet-option--active" : ""}`}
          >
            <span>{lang === "fr" ? opt.label : opt.labelEn}</span>
            {opt.id !== "all" && <span className="sk-facet-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Sidebar content ────────────────────────────────────────────────────────── */
interface SidebarContentProps {
  lang: "fr" | "en";
  facetProfile: StackFacetProfile;
  facetObjective: StackFacetObjective;
  facetBudget: StackFacetBudget;
  facetComplexity: StackFacetComplexity;
  setFacetProfile: (v: StackFacetProfile) => void;
  setFacetObjective: (v: StackFacetObjective) => void;
  setFacetBudget: (v: StackFacetBudget) => void;
  setFacetComplexity: (v: StackFacetComplexity) => void;
  onReset: () => void;
  isFiltered: boolean;
  allStacks: StackListItem[];
}

function SidebarContent({
  lang, facetProfile, facetObjective, facetBudget, facetComplexity,
  setFacetProfile, setFacetObjective, setFacetBudget, setFacetComplexity,
  onReset, isFiltered, allStacks,
}: SidebarContentProps) {
  const profileCounts = useMemo(() => {
    const map = new Map<StackFacetProfile, number>();
    for (const opt of PROFILE_OPTIONS) map.set(opt.id, countForProfile(opt.id, allStacks));
    return map;
  }, [allStacks]);

  const objectiveCounts = useMemo(() => {
    const map = new Map<StackFacetObjective, number>();
    for (const opt of OBJECTIVE_OPTIONS) map.set(opt.id, countForObjective(opt.id, allStacks));
    return map;
  }, [allStacks]);

  const budgetCounts = useMemo(() => {
    const map = new Map<StackFacetBudget, number>();
    for (const opt of BUDGET_OPTIONS) map.set(opt.id, countForBudget(opt.id, allStacks));
    return map;
  }, [allStacks]);

  const complexityCounts = useMemo(() => {
    const map = new Map<StackFacetComplexity, number>();
    for (const opt of COMPLEXITY_OPTIONS) map.set(opt.id, countForComplexity(opt.id, allStacks));
    return map;
  }, [allStacks]);

  return (
    <>
      {/* Header */}
      <div className="sk-sidebar-header">
        <span className="sk-sidebar-eyebrow">
          {lang === "fr" ? "AFFINER" : "FILTER"}
        </span>
        <p className="sk-sidebar-title">
          {lang === "fr" ? "Trouver la bonne stack" : "Find the right stack"}
        </p>
        <p className="sk-sidebar-desc">
          {lang === "fr"
            ? "Filtre par profil, budget et niveau d'usage."
            : "Filter by profile, budget, and skill level."}
        </p>
      </div>

      {/* Facet groups */}
      <FacetGroup<StackFacetProfile>
        label={lang === "fr" ? "PROFIL" : "PROFILE"}
        options={PROFILE_OPTIONS}
        active={facetProfile}
        onChange={setFacetProfile}
        counts={profileCounts}
        lang={lang}
      />
      <FacetGroup<StackFacetObjective>
        label={lang === "fr" ? "OBJECTIF" : "OBJECTIVE"}
        options={OBJECTIVE_OPTIONS}
        active={facetObjective}
        onChange={setFacetObjective}
        counts={objectiveCounts}
        lang={lang}
      />
      <FacetGroup<StackFacetBudget>
        label={lang === "fr" ? "BUDGET" : "BUDGET"}
        options={BUDGET_OPTIONS}
        active={facetBudget}
        onChange={setFacetBudget}
        counts={budgetCounts}
        lang={lang}
      />
      <FacetGroup<StackFacetComplexity>
        label={lang === "fr" ? "COMPLEXITÉ" : "COMPLEXITY"}
        options={COMPLEXITY_OPTIONS}
        active={facetComplexity}
        onChange={setFacetComplexity}
        counts={complexityCounts}
        lang={lang}
      />

      {/* Reset */}
      <div className="sk-sidebar-reset-row">
        <button
          type="button"
          onClick={onReset}
          disabled={!isFiltered}
          className="sk-sidebar-reset"
        >
          {lang === "fr" ? "Réinitialiser" : "Reset filters"}
        </button>
      </div>
    </>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
const StacksPage = () => {
  const { t, lang, prefix } = useLang();
  const { tools } = useToolSummaries();

  /* Facet state */
  const [facetProfile,    setFacetProfile]    = useState<StackFacetProfile>("all");
  const [facetObjective,  setFacetObjective]  = useState<StackFacetObjective>("all");
  const [facetBudget,     setFacetBudget]     = useState<StackFacetBudget>("all");
  const [facetComplexity, setFacetComplexity] = useState<StackFacetComplexity>("all");
  const [sortBy,          setSortBy]          = useState<StackSortId>("recommended");
  const [query,           setQuery]           = useState("");
  const [mobileOpen,      setMobileOpen]      = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  const isFiltered = facetProfile !== "all" || facetObjective !== "all"
    || facetBudget !== "all" || facetComplexity !== "all" || query !== "";

  const activeFilterCount = [facetProfile, facetObjective, facetBudget, facetComplexity]
    .filter((f) => f !== "all").length + (query ? 1 : 0);

  function resetFacets() {
    setFacetProfile("all");
    setFacetObjective("all");
    setFacetBudget("all");
    setFacetComplexity("all");
    setQuery("");
    setSortBy("recommended");
  }

  /* Close mobile panel on Escape */
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toolBySlug = useMemo(
    () => new Map(tools.map((tool) => [tool.slug || tool.id, tool])),
    [tools],
  );

  const profileRecommendedStacks = PROFILE_RECOMMENDED_STACKS
    .map(({ persona, slug }) => ({
      persona,
      stack: STACKS.find((s) => s.slug === slug),
    }))
    .filter((item): item is { persona: StackPersona; stack: StackListItem } => Boolean(item.stack));

  const filteredStacks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = STACKS.filter((stack) =>
      stackMatchesFacets(stack, facetProfile, facetObjective, facetBudget, facetComplexity, q),
    );
    if (sortBy === "budget") {
      return [...filtered].sort((a, b) => a.monthlyBudget - b.monthlyBudget);
    }
    if (sortBy === "tools") {
      return [...filtered].sort((a, b) => b.tools.length - a.tools.length);
    }
    // "recommended" — FEATURED_STACK_SLUGS priority order
    return [...filtered].sort((a, b) => {
      const ai = FEATURED_STACK_SLUGS.indexOf(a.slug);
      const bi = FEATURED_STACK_SLUGS.indexOf(b.slug);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return 0;
    });
  }, [facetProfile, facetObjective, facetBudget, facetComplexity, query, sortBy]);

  useEffect(() => {
    const title = lang === "fr"
      ? "Stacks SaaS types pour freelances | ToolTrim"
      : "SaaS stack templates for freelancers | ToolTrim";
    const description = lang === "fr"
      ? "Explorez des stacks SaaS sobres par profil freelance, budget et niveau de maturité. Des combinaisons d'outils pensées pour vendre, livrer et payer moins."
      : "Explore lean SaaS stack templates by freelance profile, budget, and maturity. Tool combinations designed to sell, deliver, and pay less.";
    setSeoTags({ title, description, url: `${SEO_BASE}/${lang}/stacks`, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/stacks`);
    setJsonLd("stacks-jsonld", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: `${SEO_BASE}/${lang}/stacks`,
      numberOfItems: STACKS.length,
      hasPart: STACKS.map((stack) => ({
        "@type": "ItemList",
        name: lang === "fr" ? stack.title : stack.titleEn,
        itemListElement: stack.tools.map((slot, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: toolBySlug.get(slot.slug)?.name || slot.slug,
        })),
      })),
    });
    return () => cleanupSeo(["stacks-jsonld"]);
  }, [lang, toolBySlug]);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="eh-root">
        <div className="eh-container">
          <span className="eh-eyebrow">{t("Stacks types", "Stack templates")}</span>
          <h1 style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(3.5rem, 6vw, 6rem)",
            fontWeight: 600,
            letterSpacing: "-0.055em",
            lineHeight: 0.98,
            color: "#222222",
            maxWidth: 980,
            margin: "14px 0 24px",
          }}>
            {t("Comparer des stacks types.", "Compare stack templates.")}
            <br />
            {t("Pas collectionner des outils.", "Not collect tools.")}
          </h1>
          <p style={{
            fontFamily: "var(--font-ui)",
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: "-0.025em",
            lineHeight: 1.35,
            color: "#6F6F68",
            maxWidth: 640,
            margin: "0 0 32px",
          }}>
            {t(
              "Chaque stack part d'un contexte concret : profil, budget, usages, doublons probables et outils à challenger.",
              "Each stack starts from a concrete context: profile, budget, use cases, likely overlaps, and tools to challenge.",
            )}
          </p>
          <div className="eh-cta-group">
            <Link to={`${prefix}/selector`} className="eh-cta-primary">
              {t("Analyser ma stack", "Analyze my stack")}
            </Link>
            <a href="#profils" className="eh-cta-secondary">
              {t("Voir les profils", "View profiles")}
            </a>
          </div>
        </div>
      </section>

      {/* ── Commencer par ton profil ───────────────────────────────────────── */}
      <section id="profils" className="sk-section scroll-mt-20" style={{ background: "#F8F8F4" }}>
        <div className="sk-container">
          <span style={{
            fontFamily: "var(--font-ui)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: "#6F6F68",
            display: "block",
            marginBottom: 10,
          }}>
            {t("Recommandées par profil", "Recommended by profile")}
          </span>
          <p style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(1.75rem, 3vw, 2.625rem)",
            fontWeight: 600,
            letterSpacing: "-0.055em",
            lineHeight: 0.98,
            color: "#222222",
            marginBottom: 32,
          }}>
            {t("Commence par la stack de ton métier", "Start with the stack for your role")}
          </p>
          <div className="sk-profiles-grid">
            {profileRecommendedStacks.map(({ persona, stack }) => {
              const title = lang === "fr" ? stack.title : stack.titleEn;
              const bestFor = lang === "fr" ? stack.bestFor : stack.bestForEn;
              return (
                <Link
                  key={persona}
                  to={`${prefix}/stacks/${stack.slug}`}
                  className="sk-profile-card"
                >
                  <p className="sk-profile-name">{personaLabel(persona, lang)}</p>
                  <p style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase" as const,
                    color: "#9A9A92",
                    margin: "4px 0 8px",
                  }}>
                    {title}
                  </p>
                  <p className="sk-profile-desc">{bestFor}</p>
                  <p style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#222222",
                    marginTop: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}>
                    {t("Voir la stack", "See stack")}
                    <span aria-hidden>→</span>
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Listing : sidebar + résultats ─────────────────────────────────── */}
      <section id="stacks" className="sk-section scroll-mt-20">
        <div className="sk-container">

          {/* Mobile trigger */}
          <div className="sk-mobile-trigger-row">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="sk-mobile-trigger"
              aria-label={t("Ouvrir les filtres", "Open filters")}
            >
              <SlidersHorizontal size={15} aria-hidden />
              {activeFilterCount > 0
                ? t(`Filtres (${activeFilterCount})`, `Filters (${activeFilterCount})`)
                : t("Filtres", "Filters")}
            </button>

            {/* Inline search (mobile) */}
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Rechercher…", "Search…")}
              className="sk-search-input"
            />
          </div>

          {/* 2-column layout */}
          <div className="sk-listing-layout">

            {/* ── Sidebar (desktop) ────────────────────────────────────── */}
            <aside className="sk-sidebar" aria-label={t("Filtres", "Filters")}>
              <SidebarContent
                lang={lang}
                facetProfile={facetProfile}
                facetObjective={facetObjective}
                facetBudget={facetBudget}
                facetComplexity={facetComplexity}
                setFacetProfile={setFacetProfile}
                setFacetObjective={setFacetObjective}
                setFacetBudget={setFacetBudget}
                setFacetComplexity={setFacetComplexity}
                onReset={resetFacets}
                isFiltered={isFiltered}
                allStacks={STACKS}
              />
            </aside>

            {/* ── Results ──────────────────────────────────────────────── */}
            <div className="sk-results">

              {/* Results header */}
              <div className="sk-results-header">
                <span className="sk-results-count">
                  {filteredStacks.length}&nbsp;
                  {t(
                    `stack${filteredStacks.length !== 1 ? "s" : ""} trouvée${filteredStacks.length !== 1 ? "s" : ""}`,
                    `stack${filteredStacks.length !== 1 ? "s" : ""} found`,
                  )}
                </span>
                <div className="sk-results-sort">
                  <span className="gi-sort-label">{t("Trier par", "Sort by")}</span>
                  <select
                    className="gi-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as StackSortId)}
                    aria-label={t("Trier par", "Sort by")}
                  >
                    <option value="recommended">{t("Recommandé", "Recommended")}</option>
                    <option value="budget">{t("Budget", "Budget")}</option>
                    <option value="tools">{t("Nombre d'outils", "Tool count")}</option>
                  </select>
                </div>
              </div>

              {/* Search (desktop, inside results col) */}
              <div className="sk-results-search">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("Rechercher une stack…", "Search stacks…")}
                  className="sk-search-input"
                />
              </div>

              {/* Stack list */}
              {filteredStacks.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 0 }}>
                  {filteredStacks.map((stack) => {
                    const stackTools = stack.tools
                      .slice(0, 5)
                      .map((slot) => toolBySlug.get(slot.slug))
                      .filter(Boolean) as NonNullable<ReturnType<typeof toolBySlug.get>>[];
                    const titleText    = lang === "fr" ? stack.title    : stack.titleEn;
                    const subtitleText = lang === "fr" ? stack.subtitle : stack.subtitleEn;
                    const personaText  = personaLabel(stack.persona, lang);
                    const stageLabel   = STAGE_LABELS[stack.stage][lang];
                    const budgetLabel  = stack.monthlyBudget > 0
                      ? `≈ ${stack.monthlyBudget}€/mois`
                      : t("Gratuit", "Free");
                    const budgetTag    = budgetDisplayLabel(stack.monthlyBudget, lang);
                    const isRecommended = PROFILE_RECOMMENDED_STACKS.some((p) => p.slug === stack.slug);

                    return (
                      <Link
                        key={stack.id}
                        to={`${prefix}/stacks/${stack.slug}`}
                        className="sk-card"
                      >
                        {/* Meta row */}
                        <div className="sk-card-header">
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                            <span className="sk-card-meta-label">STACK</span>
                            <span style={{ color: "#DADAD4", fontSize: 12 }}>·</span>
                            <span className="sk-card-meta-persona">{personaText}</span>
                            {isRecommended && (
                              <>
                                <span style={{ color: "#DADAD4", fontSize: 12 }}>·</span>
                                <span className="sk-card-badge-recommended">
                                  {t("Recommandée", "Recommended")}
                                </span>
                              </>
                            )}
                          </div>
                          <span className="sk-card-budget">{budgetLabel}</span>
                        </div>

                        {/* Title */}
                        <p className="sk-card-title">{titleText}</p>

                        {/* Subtitle */}
                        <p className="sk-card-desc">{subtitleText}</p>

                        {/* Tags: budget tier + complexity + tool count */}
                        <div className="sk-card-tags-row">
                          <span className="sk-card-tag">{budgetTag}</span>
                          <span className="sk-card-tag">{stageLabel}</span>
                          <span className="sk-card-tag">
                            {stack.tools.length}&nbsp;{t("outils", "tools")}
                          </span>
                        </div>

                        {/* Footer: logos + CTA */}
                        <div className="sk-card-footer">
                          {stackTools.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                              {stackTools.map((tool, i) => (
                                <div
                                  key={tool.id}
                                  title={tool.name}
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    background: "#FFFFFF",
                                    border: "1px solid #E7E7E0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginLeft: i === 0 ? 0 : -6,
                                    overflow: "hidden",
                                    position: "relative" as const,
                                    zIndex: stackTools.length - i,
                                  }}
                                >
                                  <ToolLogo tool={tool} size={18} />
                                </div>
                              ))}
                              {stack.tools.length > 5 && (
                                <div style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "50%",
                                  background: "#F8F8F4",
                                  border: "1px solid #E7E7E0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginLeft: -6,
                                  fontFamily: "var(--font-ui)",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "#6F6F68",
                                }}>
                                  +{stack.tools.length - 5}
                                </div>
                              )}
                            </div>
                          )}
                          <span className="sk-card-cta">
                            {t("Voir la stack", "See stack")}
                            <span aria-hidden className="sk-card-cta-arrow"> →</span>
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                /* Empty state */
                <div className="sk-empty-state">
                  <p className="sk-empty-title">
                    {t("Aucune stack ne correspond à ces filtres.", "No stack matches these filters.")}
                  </p>
                  <p className="sk-empty-desc">
                    {t(
                      "Essaie d'élargir tes critères ou réinitialise les filtres.",
                      "Try broadening your criteria or reset the filters.",
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={resetFacets}
                    className="sk-empty-reset"
                  >
                    {t("Réinitialiser les filtres", "Reset filters")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Mobile filter panel ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="sk-mobile-panel"
          role="dialog"
          aria-modal="true"
          aria-label={t("Filtres", "Filters")}
          ref={panelRef}
        >
          {/* Panel header */}
          <div className="sk-mobile-panel-header">
            <span className="sk-mobile-panel-title">
              {t("Filtres", "Filters")}
            </span>
            <button
              type="button"
              className="sk-mobile-panel-close"
              onClick={() => setMobileOpen(false)}
              aria-label={t("Fermer", "Close")}
            >
              <X size={20} aria-hidden />
            </button>
          </div>

          {/* Panel body — scrollable */}
          <div className="sk-mobile-panel-body">
            <SidebarContent
              lang={lang}
              facetProfile={facetProfile}
              facetObjective={facetObjective}
              facetBudget={facetBudget}
              facetComplexity={facetComplexity}
              setFacetProfile={setFacetProfile}
              setFacetObjective={setFacetObjective}
              setFacetBudget={setFacetBudget}
              setFacetComplexity={setFacetComplexity}
              onReset={resetFacets}
              isFiltered={isFiltered}
              allStacks={STACKS}
            />
          </div>

          {/* Panel footer */}
          <div className="sk-mobile-panel-footer">
            <button
              type="button"
              className="sk-mobile-panel-apply"
              onClick={() => setMobileOpen(false)}
            >
              {t(
                `Voir les ${filteredStacks.length} stack${filteredStacks.length !== 1 ? "s" : ""}`,
                `See ${filteredStacks.length} stack${filteredStacks.length !== 1 ? "s" : ""}`,
              )}
            </button>
            {isFiltered && (
              <button
                type="button"
                className="sk-mobile-panel-reset"
                onClick={resetFacets}
              >
                {t("Réinitialiser", "Reset")}
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default StacksPage;
