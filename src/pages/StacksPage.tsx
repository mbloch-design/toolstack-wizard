import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { X, SlidersHorizontal } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import {
  STACK_PERSONAS,
  STACK_SUB_PROFILES,
  STACKS,
  getStackDerivedFields,
  type StackBudgetRange,
  type StackComplexity,
  type StackLevel,
  type StackPersona,
  type StackSubProfile,
  type StackType,
} from "@/data/stacks";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type StackListItem = (typeof STACKS)[number];
type StackFacetProfile = "all" | StackPersona;
type StackFacetSubProfile = "all" | StackSubProfile;
type StackFacetObjective = "all" | "content" | "sell" | "clients" | "automate" | "produce" | "organize";
type StackFacetBudget = "all" | StackBudgetRange;
type StackFacetLevel = "all" | StackLevel;
type StackFacetComplexity = "all" | StackComplexity;
type StackFacetType = "all" | StackType;
type StackSortId = "recommended" | "budget" | "tools";

interface Option<T extends string> {
  id: T;
  label: string;
  labelEn: string;
}

interface EnrichedStack {
  stack: StackListItem;
  derived: ReturnType<typeof getStackDerivedFields>;
}

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const FEATURED_STACK_SLUGS = [
  "developpeur-freelance-shipper",
  "designer-freelance-solo",
  "consultant-b2b-propre",
  "createur-contenu-operateur",
  "ops-manager-fractional-coo",
  "freelance-solo-zero-bloat",
  "architecte-interieur",
  "motion-video-studio-solo",
  "consultant-revops-pipeline",
  "freelance",
  "agence-marketing",
  "solopreneur",
  "ecommerce",
  "startup-saas",
];

const PROFILE_RECOMMENDED_STACKS = [
  { persona: "content" as StackPersona, slug: "createur-contenu-operateur" },
  { persona: "designer" as StackPersona, slug: "designer-freelance-solo" },
  { persona: "dev" as StackPersona, slug: "developpeur-freelance-shipper" },
  { persona: "consultant" as StackPersona, slug: "consultant-b2b-propre" },
  { persona: "ops" as StackPersona, slug: "ops-manager-fractional-coo" },
  { persona: "solo" as StackPersona, slug: "freelance-solo-zero-bloat" },
] as const;

const PROFILE_OPTIONS: Option<StackFacetProfile>[] = [
  { id: "all", label: "Tous", labelEn: "All" },
  ...STACK_PERSONAS.filter((item): item is { value: StackPersona; label: string; labelEn: string } => item.value !== "all")
    .map((item) => ({ id: item.value, label: item.label, labelEn: item.labelEn })),
];

const OBJECTIVE_OPTIONS: Option<StackFacetObjective>[] = [
  { id: "all", label: "Tous", labelEn: "All" },
  { id: "content", label: "Créer du contenu", labelEn: "Create content" },
  { id: "sell", label: "Vendre", labelEn: "Sell" },
  { id: "clients", label: "Gérer ses clients", labelEn: "Manage clients" },
  { id: "automate", label: "Automatiser", labelEn: "Automate" },
  { id: "produce", label: "Produire", labelEn: "Produce" },
  { id: "organize", label: "Organiser", labelEn: "Organize" },
];

const BUDGET_OPTIONS: Option<StackFacetBudget>[] = [
  { id: "all", label: "Tous", labelEn: "All" },
  { id: "0-30", label: "0–30 €", labelEn: "€0–30" },
  { id: "30-80", label: "30–80 €", labelEn: "€30–80" },
  { id: "80-150", label: "80–150 €", labelEn: "€80–150" },
  { id: "150+", label: "150 €+", labelEn: "€150+" },
];

const LEVEL_OPTIONS: Option<StackFacetLevel>[] = [
  { id: "all", label: "Tous", labelEn: "All" },
  { id: "debutant", label: "Débutant", labelEn: "Beginner" },
  { id: "installe", label: "Installé", labelEn: "Established" },
  { id: "avance", label: "Avancé", labelEn: "Advanced" },
];

const COMPLEXITY_OPTIONS: Option<StackFacetComplexity>[] = [
  { id: "all", label: "Toutes", labelEn: "All" },
  { id: "minimal", label: "Minimal", labelEn: "Minimal" },
  { id: "equilibre", label: "Équilibré", labelEn: "Balanced" },
  { id: "premium", label: "Premium", labelEn: "Premium" },
];

const TYPE_OPTIONS: Option<StackFacetType>[] = [
  { id: "all", label: "Tous", labelEn: "All" },
  { id: "socle", label: "Socle métier", labelEn: "Role baseline" },
  { id: "specialiste", label: "Spécialisée", labelEn: "Specialized" },
  { id: "workflow", label: "Workflow / ops", labelEn: "Workflow / ops" },
  { id: "avancee", label: "Avancée", labelEn: "Advanced" },
];

const QUERY_KEYS = ["profile", "subProfile", "objective", "budget", "level", "complexity", "type", "sort", "q"] as const;

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function optionLabel<T extends string>(options: Option<T>[], id: T, lang: "fr" | "en") {
  const item = options.find((option) => option.id === id);
  return lang === "fr" ? item?.label || id : item?.labelEn || id;
}

function personaLabel(persona: StackPersona, locale: "fr" | "en") {
  const item = STACK_PERSONAS.find((p) => p.value === persona);
  return locale === "fr" ? item?.label || persona : item?.labelEn || persona;
}

function subProfileLabel(subProfile: StackSubProfile, locale: "fr" | "en") {
  const item = STACK_SUB_PROFILES.find((p) => p.value === subProfile);
  return locale === "fr" ? item?.label || subProfile : item?.labelEn || subProfile;
}

function validParam<T extends string>(value: string | null, options: Option<T>[], fallback: T): T {
  if (value && options.some((option) => option.id === value)) return value as T;
  return fallback;
}

function validSubProfileParam(value: string | null): StackFacetSubProfile {
  if (value && STACK_SUB_PROFILES.some((option) => option.value === value)) return value as StackFacetSubProfile;
  return "all";
}

function matchesStack(enriched: EnrichedStack, filters: {
  profile: StackFacetProfile;
  subProfile: StackFacetSubProfile;
  objective: StackFacetObjective;
  budget: StackFacetBudget;
  level: StackFacetLevel;
  complexity: StackFacetComplexity;
  type: StackFacetType;
  query: string;
}, toolNames: string[]): boolean {
  const { stack, derived } = enriched;
  if (filters.profile !== "all" && derived.profile !== filters.profile) return false;
  if (filters.subProfile !== "all" && !stack.subProfiles.includes(filters.subProfile)) return false;
  if (filters.objective !== "all" && !derived.objectives.includes(filters.objective)) return false;
  if (filters.budget !== "all" && derived.budgetRange !== filters.budget) return false;
  if (filters.level !== "all" && derived.level !== filters.level) return false;
  if (filters.complexity !== "all" && derived.complexity !== filters.complexity) return false;
  if (filters.type !== "all" && derived.stackType !== filters.type) return false;

  const q = filters.query.trim().toLowerCase();
  if (!q) return true;
  const text = [
    stack.title,
    stack.titleEn,
    stack.subtitle,
    stack.subtitleEn,
    stack.bestFor,
    stack.bestForEn,
    stack.avoidIf,
    stack.avoidIfEn,
    stack.risk,
    stack.riskEn,
    personaLabel(stack.persona, "fr"),
    personaLabel(stack.persona, "en"),
    ...stack.subProfiles.map((sub) => `${sub} ${subProfileLabel(sub, "fr")} ${subProfileLabel(sub, "en")}`),
    ...derived.objectives,
    ...stack.tools.map((slot, index) => `${slot.slug} ${slot.role} ${slot.roleEn} ${toolNames[index] || ""}`),
  ].join(" ").toLowerCase();
  return text.includes(q);
}

function truncate(text: string, max = 150) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

/* ─── Components ─────────────────────────────────────────────────────────────── */
interface FacetGroupProps<T extends string> {
  label: string;
  options: Option<T>[];
  active: T;
  onChange: (id: T) => void;
  lang: "fr" | "en";
}

function FacetGroup<T extends string>({ label, options, active, onChange, lang }: FacetGroupProps<T>) {
  return (
    <div className="sk-facet-group">
      <p className="sk-facet-group-label">{label}</p>
      <div className="sk-facet-options">
        {options.map((opt) => {
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
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SidebarContentProps {
  lang: "fr" | "en";
  facetProfile: StackFacetProfile;
  facetSubProfile: StackFacetSubProfile;
  facetObjective: StackFacetObjective;
  facetBudget: StackFacetBudget;
  facetLevel: StackFacetLevel;
  facetComplexity: StackFacetComplexity;
  facetType: StackFacetType;
  subProfileOptions: Option<StackFacetSubProfile>[];
  setFacetProfile: (v: StackFacetProfile) => void;
  setFacetSubProfile: (v: StackFacetSubProfile) => void;
  setFacetObjective: (v: StackFacetObjective) => void;
  setFacetBudget: (v: StackFacetBudget) => void;
  setFacetLevel: (v: StackFacetLevel) => void;
  setFacetComplexity: (v: StackFacetComplexity) => void;
  setFacetType: (v: StackFacetType) => void;
  onReset: () => void;
  isFiltered: boolean;
}

function SidebarContent({
  lang,
  facetProfile,
  facetSubProfile,
  facetObjective,
  facetBudget,
  facetLevel,
  facetComplexity,
  facetType,
  subProfileOptions,
  setFacetProfile,
  setFacetSubProfile,
  setFacetObjective,
  setFacetBudget,
  setFacetLevel,
  setFacetComplexity,
  setFacetType,
  onReset,
  isFiltered,
}: SidebarContentProps) {
  return (
    <>
      <div className="sk-sidebar-header">
        <span className="sk-sidebar-eyebrow">{lang === "fr" ? "AFFINER" : "FILTER"}</span>
        <p className="sk-sidebar-title">{lang === "fr" ? "Trouver la bonne stack" : "Find the right stack"}</p>
        <p className="sk-sidebar-desc">
          {lang === "fr"
            ? "Commence par ton profil, puis précise le contexte."
            : "Start with your profile, then refine the context."}
        </p>
      </div>

      <FacetGroup label={lang === "fr" ? "PROFIL" : "PROFILE"} options={PROFILE_OPTIONS} active={facetProfile} onChange={setFacetProfile} lang={lang} />

      {facetProfile !== "all" && subProfileOptions.length > 1 && (
        <FacetGroup label={lang === "fr" ? "SOUS-PROFIL" : "SUB-PROFILE"} options={subProfileOptions} active={facetSubProfile} onChange={setFacetSubProfile} lang={lang} />
      )}

      <FacetGroup label={lang === "fr" ? "OBJECTIF" : "OBJECTIVE"} options={OBJECTIVE_OPTIONS} active={facetObjective} onChange={setFacetObjective} lang={lang} />
      <FacetGroup label={lang === "fr" ? "BUDGET" : "BUDGET"} options={BUDGET_OPTIONS} active={facetBudget} onChange={setFacetBudget} lang={lang} />
      <FacetGroup label={lang === "fr" ? "NIVEAU" : "LEVEL"} options={LEVEL_OPTIONS} active={facetLevel} onChange={setFacetLevel} lang={lang} />
      <FacetGroup label={lang === "fr" ? "COMPLEXITÉ" : "COMPLEXITY"} options={COMPLEXITY_OPTIONS} active={facetComplexity} onChange={setFacetComplexity} lang={lang} />
      <FacetGroup label={lang === "fr" ? "TYPE DE STACK" : "STACK TYPE"} options={TYPE_OPTIONS} active={facetType} onChange={setFacetType} lang={lang} />

      <div className="sk-sidebar-reset-row">
        <button type="button" onClick={onReset} disabled={!isFiltered} className="sk-sidebar-reset">
          {lang === "fr" ? "Réinitialiser" : "Reset filters"}
        </button>
      </div>
    </>
  );
}

interface StackSelectionCardProps {
  enriched: EnrichedStack;
  prefix: string;
  lang: "fr" | "en";
  t: (fr: string | React.ReactNode, en: string | React.ReactNode) => string | React.ReactNode;
  tools: NonNullable<ReturnType<typeof useToolSummaries>["tools"]>[number][];
  isRecommended: boolean;
}

function StackSelectionCard({ enriched, prefix, lang, t, tools, isRecommended }: StackSelectionCardProps) {
  const { stack, derived } = enriched;
  const title = lang === "fr" ? stack.title : stack.titleEn;
  const verdict = lang === "fr" ? derived.verdict : derived.verdictEn;
  const bestFor = lang === "fr" ? derived.bestFor : derived.bestForEn;
  const avoidIf = lang === "fr" ? derived.avoidIf : derived.avoidIfEn;
  const primarySubProfile = stack.subProfiles[0];
  const budgetText = stack.monthlyBudget > 0 ? `${stack.monthlyBudget}€/mois` : t("Gratuit", "Free");

  return (
    <Link to={`${prefix}/stacks/${stack.slug}`} className="sk-card">
      <div className="sk-card-header">
        <div className="sk-card-kicker">
          <span>STACK</span>
          <span aria-hidden>·</span>
          <span>{personaLabel(stack.persona, lang)}</span>
          {primarySubProfile && (
            <>
              <span aria-hidden>·</span>
              <span>{subProfileLabel(primarySubProfile, lang)}</span>
            </>
          )}
        </div>
        {isRecommended && <span className="sk-card-badge-recommended">{t("Recommandée", "Recommended")}</span>}
      </div>

      <h2 className="sk-card-title">{title}</h2>
      <p className="sk-card-verdict">{truncate(verdict, 135)}</p>

      <div className="sk-card-meta-grid">
        <div>
          <span className="sk-card-meta-label">{t("Budget cible", "Target budget")}</span>
          <strong>{budgetText}</strong>
        </div>
        <div>
          <span className="sk-card-meta-label">{t("Outils", "Tools")}</span>
          <strong>{derived.toolCount}</strong>
        </div>
        <div>
          <span className="sk-card-meta-label">{t("Niveau", "Level")}</span>
          <strong>{optionLabel(LEVEL_OPTIONS, derived.level, lang)}</strong>
        </div>
        <div>
          <span className="sk-card-meta-label">{t("Complexité", "Complexity")}</span>
          <strong>{optionLabel(COMPLEXITY_OPTIONS, derived.complexity, lang)}</strong>
        </div>
      </div>

      <div className="sk-card-decision">
        <p><span>{t("Idéal si", "Best if")}</span>{truncate(bestFor, 120)}</p>
        <p><span>{t("À éviter si", "Avoid if")}</span>{truncate(avoidIf, 120)}</p>
      </div>

      <div className="sk-card-footer">
        <div className="sk-card-logos" aria-label={t("Outils de la stack", "Stack tools") as string}>
          {tools.slice(0, 5).map((tool, i) => (
            <span key={tool.id} title={tool.name} className="sk-card-logo" style={{ zIndex: tools.length - i }}>
              <ToolLogo tool={tool} size={18} />
            </span>
          ))}
          {stack.tools.length > 5 && <span className="sk-card-logo sk-card-logo-more">+{stack.tools.length - 5}</span>}
        </div>
        <span className="sk-card-cta">{t("Voir la stack", "See stack")} <span aria-hidden>→</span></span>
      </div>
    </Link>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
const StacksPage = () => {
  const { t, lang, prefix } = useLang();
  const { tools } = useToolSummaries();
  const [searchParams, setSearchParams] = useSearchParams();

  const [facetProfile, setFacetProfile] = useState<StackFacetProfile>(() => validParam(searchParams.get("profile"), PROFILE_OPTIONS, "all"));
  const [facetSubProfile, setFacetSubProfile] = useState<StackFacetSubProfile>(() => validSubProfileParam(searchParams.get("subProfile")));
  const [facetObjective, setFacetObjective] = useState<StackFacetObjective>(() => validParam(searchParams.get("objective"), OBJECTIVE_OPTIONS, "all"));
  const [facetBudget, setFacetBudget] = useState<StackFacetBudget>(() => validParam(searchParams.get("budget"), BUDGET_OPTIONS, "all"));
  const [facetLevel, setFacetLevel] = useState<StackFacetLevel>(() => validParam(searchParams.get("level"), LEVEL_OPTIONS, "all"));
  const [facetComplexity, setFacetComplexity] = useState<StackFacetComplexity>(() => validParam(searchParams.get("complexity"), COMPLEXITY_OPTIONS, "all"));
  const [facetType, setFacetType] = useState<StackFacetType>(() => validParam(searchParams.get("type"), TYPE_OPTIONS, "all"));
  const [sortBy, setSortBy] = useState<StackSortId>(() => validParam(searchParams.get("sort"), [
    { id: "recommended", label: "", labelEn: "" },
    { id: "budget", label: "", labelEn: "" },
    { id: "tools", label: "", labelEn: "" },
  ], "recommended"));
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [mobileOpen, setMobileOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);
  const enrichedStacks = useMemo<EnrichedStack[]>(() => STACKS.map((stack) => ({ stack, derived: getStackDerivedFields(stack) })), []);

  const subProfileOptions = useMemo<Option<StackFacetSubProfile>[]>(() => {
    if (facetProfile === "all") return [{ id: "all", label: "Tous", labelEn: "All" }];
    const available = new Set(
      STACKS.filter((stack) => stack.persona === facetProfile).flatMap((stack) => stack.subProfiles),
    );
    return [
      { id: "all", label: "Tous", labelEn: "All" },
      ...STACK_SUB_PROFILES
        .filter((option): option is { value: StackSubProfile; label: string; labelEn: string; personas?: StackPersona[] } => option.value !== "all" && available.has(option.value))
        .map((option) => ({ id: option.value, label: option.label, labelEn: option.labelEn })),
    ];
  }, [facetProfile]);

  useEffect(() => {
    if (facetProfile === "all" && facetSubProfile !== "all") {
      setFacetSubProfile("all");
      return;
    }
    if (facetSubProfile !== "all" && !subProfileOptions.some((option) => option.id === facetSubProfile)) {
      setFacetSubProfile("all");
    }
  }, [facetProfile, facetSubProfile, subProfileOptions]);

  const isFiltered = facetProfile !== "all" || facetSubProfile !== "all" || facetObjective !== "all" || facetBudget !== "all"
    || facetLevel !== "all" || facetComplexity !== "all" || facetType !== "all" || query.trim() !== "";

  const activeFilterCount = [facetProfile, facetSubProfile, facetObjective, facetBudget, facetLevel, facetComplexity, facetType]
    .filter((f) => f !== "all").length + (query.trim() ? 1 : 0);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    QUERY_KEYS.forEach((key) => next.delete(key));
    if (facetProfile !== "all") next.set("profile", facetProfile);
    if (facetSubProfile !== "all") next.set("subProfile", facetSubProfile);
    if (facetObjective !== "all") next.set("objective", facetObjective);
    if (facetBudget !== "all") next.set("budget", facetBudget);
    if (facetLevel !== "all") next.set("level", facetLevel);
    if (facetComplexity !== "all") next.set("complexity", facetComplexity);
    if (facetType !== "all") next.set("type", facetType);
    if (sortBy !== "recommended") next.set("sort", sortBy);
    if (query.trim()) next.set("q", query.trim());

    const current = searchParams.toString();
    const updated = next.toString();
    if (current !== updated) setSearchParams(next, { replace: true });
  }, [facetProfile, facetSubProfile, facetObjective, facetBudget, facetLevel, facetComplexity, facetType, sortBy, query, searchParams, setSearchParams]);

  function resetFacets() {
    setFacetProfile("all");
    setFacetSubProfile("all");
    setFacetObjective("all");
    setFacetBudget("all");
    setFacetLevel("all");
    setFacetComplexity("all");
    setFacetType("all");
    setQuery("");
    setSortBy("recommended");
  }

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

  const filteredStacks = useMemo(() => {
    const filtered = enrichedStacks.filter((enriched) => {
      const toolNames = enriched.stack.tools.map((slot) => toolBySlug.get(slot.slug)?.name || slot.slug);
      return matchesStack(enriched, {
        profile: facetProfile,
        subProfile: facetSubProfile,
        objective: facetObjective,
        budget: facetBudget,
        level: facetLevel,
        complexity: facetComplexity,
        type: facetType,
        query,
      }, toolNames);
    });

    if (sortBy === "budget") return [...filtered].sort((a, b) => a.stack.monthlyBudget - b.stack.monthlyBudget);
    if (sortBy === "tools") return [...filtered].sort((a, b) => b.derived.toolCount - a.derived.toolCount);
    return [...filtered].sort((a, b) => {
      const ai = FEATURED_STACK_SLUGS.indexOf(a.stack.slug);
      const bi = FEATURED_STACK_SLUGS.indexOf(b.stack.slug);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return a.stack.title.localeCompare(b.stack.title);
    });
  }, [enrichedStacks, toolBySlug, facetProfile, facetSubProfile, facetObjective, facetBudget, facetLevel, facetComplexity, facetType, query, sortBy]);

  const activeChips = [
    facetProfile !== "all" ? { id: "profile", label: optionLabel(PROFILE_OPTIONS, facetProfile, lang), clear: () => setFacetProfile("all") } : null,
    facetSubProfile !== "all" ? { id: "subProfile", label: subProfileLabel(facetSubProfile, lang), clear: () => setFacetSubProfile("all") } : null,
    facetObjective !== "all" ? { id: "objective", label: optionLabel(OBJECTIVE_OPTIONS, facetObjective, lang), clear: () => setFacetObjective("all") } : null,
    facetBudget !== "all" ? { id: "budget", label: optionLabel(BUDGET_OPTIONS, facetBudget, lang), clear: () => setFacetBudget("all") } : null,
    facetLevel !== "all" ? { id: "level", label: optionLabel(LEVEL_OPTIONS, facetLevel, lang), clear: () => setFacetLevel("all") } : null,
    facetComplexity !== "all" ? { id: "complexity", label: optionLabel(COMPLEXITY_OPTIONS, facetComplexity, lang), clear: () => setFacetComplexity("all") } : null,
    facetType !== "all" ? { id: "type", label: optionLabel(TYPE_OPTIONS, facetType, lang), clear: () => setFacetType("all") } : null,
    query.trim() ? { id: "q", label: query.trim(), clear: () => setQuery("") } : null,
  ].filter((chip): chip is { id: string; label: string; clear: () => void } => Boolean(chip));

  const profileRecommendedStacks = PROFILE_RECOMMENDED_STACKS
    .map(({ persona, slug }) => ({ persona, stack: STACKS.find((s) => s.slug === slug) }))
    .filter((item): item is { persona: StackPersona; stack: StackListItem } => Boolean(item.stack));

  useEffect(() => {
    const title = lang === "fr"
      ? "Stacks SaaS freelance calibrées par profil, budget et niveau | ToolTrim"
      : "Freelance SaaS stacks calibrated by profile, budget and level | ToolTrim";
    const description = lang === "fr"
      ? "Explore des stacks SaaS recommandées selon ton profil, ton budget, ton niveau et tes usages pour savoir quels outils garder, couper ou challenger."
      : "Explore SaaS stacks recommended by profile, budget, level and real usage to know which tools to keep, cut or challenge.";
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
      <section className="eh-root sk-hero">
        <div className="eh-container">
          <span className="eh-eyebrow">{t("Stacks types", "Stack templates")}</span>
          <h1 className="sk-hero-title">{t("Trouve la stack adaptée à ton contexte.", "Find the stack that fits your context.")}</h1>
          <p className="sk-hero-subtitle">
            {t(
              "Profil, niveau, budget, TJM, usages réels : ToolTrim classe les stacks selon ta situation, pas selon une liste générique d’outils.",
              "Profile, level, budget, day rate, real usage: ToolTrim ranks stacks by your situation, not by a generic list of tools.",
            )}
          </p>
          <div className="eh-cta-group">
            <Link to={`${prefix}/selector`} className="eh-cta-primary">{t("Auditer ma stack", "Audit my stack")} <span aria-hidden>→</span></Link>
            <a href="#profils" className="eh-cta-secondary">{t("Explorer les profils", "Explore profiles")}</a>
          </div>
        </div>
      </section>

      <section id="profils" className="sk-section sk-profiles-section scroll-mt-20">
        <div className="sk-container">
          <span className="sk-section-eyebrow">{t("RECOMMANDÉES PAR PROFIL", "RECOMMENDED BY PROFILE")}</span>
          <p className="sk-section-title">{t("Commence par le métier, affine par le contexte.", "Start with the role, refine by context.")}</p>
          <div className="sk-profiles-grid">
            {profileRecommendedStacks.map(({ persona, stack }) => {
              const title = lang === "fr" ? stack.title : stack.titleEn;
              const bestFor = lang === "fr" ? stack.bestFor : stack.bestForEn;
              return (
                <Link key={persona} to={`${prefix}/stacks/${stack.slug}`} className="sk-profile-card">
                  <p className="sk-profile-name">{personaLabel(persona, lang)}</p>
                  <p className="sk-profile-desc">{bestFor}</p>
                  <p className="sk-profile-meta"><span>{title}</span><span aria-hidden>→</span></p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="stacks" className="sk-section sk-listing-section scroll-mt-20">
        <div className="sk-container">
          <div className="sk-mobile-trigger-row">
            <button type="button" onClick={() => setMobileOpen(true)} className="sk-mobile-trigger" aria-label={t("Ouvrir les filtres", "Open filters") as string}>
              <SlidersHorizontal size={15} aria-hidden />
              {activeFilterCount > 0 ? t(`Filtres (${activeFilterCount})`, `Filters (${activeFilterCount})`) : t("Filtres", "Filters")}
            </button>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Rechercher…", "Search…") as string} className="sk-search-input" />
          </div>

          <div className="sk-listing-layout">
            <aside className="sk-sidebar" aria-label={t("Filtres", "Filters") as string}>
              <SidebarContent
                lang={lang}
                facetProfile={facetProfile}
                facetSubProfile={facetSubProfile}
                facetObjective={facetObjective}
                facetBudget={facetBudget}
                facetLevel={facetLevel}
                facetComplexity={facetComplexity}
                facetType={facetType}
                subProfileOptions={subProfileOptions}
                setFacetProfile={setFacetProfile}
                setFacetSubProfile={setFacetSubProfile}
                setFacetObjective={setFacetObjective}
                setFacetBudget={setFacetBudget}
                setFacetLevel={setFacetLevel}
                setFacetComplexity={setFacetComplexity}
                setFacetType={setFacetType}
                onReset={resetFacets}
                isFiltered={isFiltered}
              />
            </aside>

            <div className="sk-results">
              <div className="sk-results-header">
                <div>
                  <span className="sk-results-count">
                    {filteredStacks.length}&nbsp;
                    {t(`stack${filteredStacks.length !== 1 ? "s" : ""} trouvée${filteredStacks.length !== 1 ? "s" : ""}`, `stack${filteredStacks.length !== 1 ? "s" : ""} found`)}
                  </span>
                  {isFiltered && <p className="sk-results-context">{t("Sélection calibrée selon les critères actifs.", "Selection calibrated by active criteria.")}</p>}
                </div>
                <div className="sk-results-sort">
                  <span className="gi-sort-label">{t("Trier par", "Sort by")}</span>
                  <select className="gi-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as StackSortId)} aria-label={t("Trier par", "Sort by") as string}>
                    <option value="recommended">{t("Recommandé", "Recommended")}</option>
                    <option value="budget">{t("Budget", "Budget")}</option>
                    <option value="tools">{t("Nombre d’outils", "Tool count")}</option>
                  </select>
                </div>
              </div>

              <div className="sk-results-search">
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Rechercher une stack, un outil, un usage…", "Search a stack, tool, or use case…") as string} className="sk-search-input" />
              </div>

              {activeChips.length > 0 && (
                <div className="sk-active-filters" aria-label={t("Filtres actifs", "Active filters") as string}>
                  {activeChips.map((chip) => (
                    <button key={chip.id} type="button" className="sk-active-chip" onClick={chip.clear}>
                      {chip.label}<X size={13} aria-hidden />
                    </button>
                  ))}
                  <button type="button" className="sk-active-reset" onClick={resetFacets}>{t("Réinitialiser", "Reset")}</button>
                </div>
              )}

              {filteredStacks.length > 0 ? (
                <div className="sk-results-grid">
                  {filteredStacks.map((enriched) => {
                    const stackTools = enriched.stack.tools
                      .slice(0, 5)
                      .map((slot) => toolBySlug.get(slot.slug))
                      .filter(Boolean) as NonNullable<ReturnType<typeof toolBySlug.get>>[];
                    const isRecommended = PROFILE_RECOMMENDED_STACKS.some((p) => p.slug === enriched.stack.slug);
                    return (
                      <StackSelectionCard
                        key={enriched.stack.id}
                        enriched={enriched}
                        prefix={prefix}
                        lang={lang}
                        t={t}
                        tools={stackTools}
                        isRecommended={isRecommended}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="sk-empty-state">
                  <p className="sk-empty-title">{t("Aucune stack ne correspond à ces filtres.", "No stack matches these filters.")}</p>
                  <p className="sk-empty-desc">
                    {t("Essaie d’élargir ton budget, de retirer un critère ou de partir d’un profil plus large.", "Try widening your budget, removing one criterion, or starting from a broader profile.")}
                  </p>
                  <button type="button" onClick={resetFacets} className="sk-empty-reset">{t("Réinitialiser les filtres", "Reset filters")}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {mobileOpen && (
        <div className="sk-mobile-panel" role="dialog" aria-modal="true" aria-label={t("Filtres", "Filters") as string} ref={panelRef}>
          <div className="sk-mobile-panel-header">
            <span className="sk-mobile-panel-title">
              {activeFilterCount > 0 ? t(`Filtres (${activeFilterCount})`, `Filters (${activeFilterCount})`) : t("Filtres", "Filters")}
            </span>
            <button type="button" className="sk-mobile-panel-close" onClick={() => setMobileOpen(false)} aria-label={t("Fermer", "Close") as string}>
              <X size={20} aria-hidden />
            </button>
          </div>
          <div className="sk-mobile-panel-body">
            <SidebarContent
              lang={lang}
              facetProfile={facetProfile}
              facetSubProfile={facetSubProfile}
              facetObjective={facetObjective}
              facetBudget={facetBudget}
              facetLevel={facetLevel}
              facetComplexity={facetComplexity}
              facetType={facetType}
              subProfileOptions={subProfileOptions}
              setFacetProfile={setFacetProfile}
              setFacetSubProfile={setFacetSubProfile}
              setFacetObjective={setFacetObjective}
              setFacetBudget={setFacetBudget}
              setFacetLevel={setFacetLevel}
              setFacetComplexity={setFacetComplexity}
              setFacetType={setFacetType}
              onReset={resetFacets}
              isFiltered={isFiltered}
            />
          </div>
          <div className="sk-mobile-panel-footer">
            <button type="button" className="sk-mobile-panel-apply" onClick={() => setMobileOpen(false)}>
              {t(`Voir les ${filteredStacks.length} stack${filteredStacks.length !== 1 ? "s" : ""}`, `See ${filteredStacks.length} stack${filteredStacks.length !== 1 ? "s" : ""}`)}
            </button>
            {isFiltered && <button type="button" className="sk-mobile-panel-reset" onClick={resetFacets}>{t("Réinitialiser", "Reset")}</button>}
          </div>
        </div>
      )}
    </div>
  );
};

export default StacksPage;
