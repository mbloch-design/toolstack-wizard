import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { X } from "@/lib/icons";
import ToolLogoPile from "@/components/ToolLogoPile";
import ToolCardImage from "@/components/tool/ToolCardImage";
import Breadcrumb from "@/components/Breadcrumb";
import CatalogToolbar, { type ToolbarPill } from "@/components/catalog/CatalogToolbar";
import { useLang } from "@/hooks/useLang";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import { useCatalogStickyToolbar } from "@/hooks/useCatalogStickyToolbar";
import stackCatalog from "@/data/stacks-catalog-index.json";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type StackPersona = "dev" | "designer" | "consultant" | "content" | "ops" | "solo";
type StackSubProfile = Exclude<(typeof stackCatalog.subProfiles)[number]["value"], "all">;
type StackBudgetRange = "0-30" | "30-80" | "80-150" | "150+";
type StackLevel = "debutant" | "installe" | "avance";
type StackComplexity = "minimal" | "equilibre" | "premium";
type StackType = "socle" | "specialiste" | "workflow" | "avancee";
type StackCatalogTool = (typeof stackCatalog.tools)[number];
type StackListItem = Omit<(typeof stackCatalog.stacks)[number], "persona" | "subProfiles" | "derived"> & {
  persona: StackPersona;
  subProfiles: StackSubProfile[];
  derived: {
    profile: StackPersona;
    objectives: string[];
    budgetRange: StackBudgetRange;
    level: StackLevel;
    complexity: StackComplexity;
    stackType: StackType;
    toolCount: number;
  };
};
type StackFacetProfile = "all" | StackPersona;
type StackFacetObjective = "all" | "content" | "sell" | "clients" | "automate" | "produce" | "organize";
type StackFacetObjectiveValue = Exclude<StackFacetObjective, "all">;
type StackFacetBudget = "all" | StackBudgetRange;
type StackFacetLevel = "all" | StackLevel;
type StackFacetComplexity = "all" | StackComplexity;
type StackFacetType = "all" | StackType;
type StackFacetTypeValue = Exclude<StackFacetType, "all">;
type StackFacetToolCount = "all" | "1-5" | "6-10" | "11+";
type StackSortId = "recommended" | "budget" | "tools";

interface Option<T extends string> {
  id: T;
  label: string;
  labelEn: string;
}

interface EnrichedStack {
  stack: StackListItem;
  derived: StackListItem["derived"];
}

const STACKS = stackCatalog.stacks as StackListItem[];
const STACK_PERSONAS = stackCatalog.personas as Array<{
  value: StackPersona | "all";
  label: string;
  labelEn: string;
}>;
const STACK_SUB_PROFILES = stackCatalog.subProfiles as Array<{
  value: StackSubProfile | "all";
  label: string;
  labelEn: string;
  personas?: StackPersona[];
}>;
const STACK_TOOLS = stackCatalog.tools as StackCatalogTool[];

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

const TOOL_COUNT_OPTIONS: Option<StackFacetToolCount>[] = [
  { id: "all", label: "Tous", labelEn: "All" },
  { id: "1-5", label: "1–5 outils", labelEn: "1–5 tools" },
  { id: "6-10", label: "6–10 outils", labelEn: "6–10 tools" },
  { id: "11+", label: "11+ outils", labelEn: "11+ tools" },
];

const OBJECTIVE_MULTI_OPTIONS = OBJECTIVE_OPTIONS.filter((option): option is Option<StackFacetObjectiveValue> => option.id !== "all");
const TYPE_MULTI_OPTIONS = TYPE_OPTIONS.filter((option): option is Option<StackFacetTypeValue> => option.id !== "all");

const OBJECTIVE_TAG_CLOUD: Record<StackFacetObjectiveValue, StackSubProfile[]> = {
  content: ["copywriting", "newsletter", "social-content", "video", "podcast", "seo"],
  sell: ["crm-sales", "sales-bd", "ecommerce", "pricing", "cro-conversion", "fundraising"],
  clients: ["client-delivery", "crm-sales", "training", "coaching", "customer-ops", "generalist-consultant"],
  automate: ["automation", "no-code", "ai-automation-consulting", "automation-ops", "ai-ops", "api-integration"],
  produce: ["web", "ui-ux", "brand", "video", "product", "mobile-dev"],
  organize: ["operations", "admin", "agency-ops", "finance-ops", "people-ops", "product-ops"],
};

const QUERY_KEYS = ["profile", "subProfile", "specialty", "objective", "budget", "level", "complexity", "type", "toolCount", "sort", "q"] as const;

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

function uniqueValues<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function parseMultiParam<T extends string>(value: string | null, allowed: T[]): T[] {
  if (!value) return [];
  const allowedSet = new Set(allowed);
  return uniqueValues(value.split(",").map((part) => part.trim()).filter((part): part is T => allowedSet.has(part as T)));
}

function serializeMultiParam<T extends string>(values: T[]) {
  return uniqueValues(values).join(",");
}

function toggleValue<T extends string>(values: T[], id: T): T[] {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
}

function toolCountMatches(count: number, facet: StackFacetToolCount) {
  if (facet === "all") return true;
  if (facet === "1-5") return count >= 1 && count <= 5;
  if (facet === "6-10") return count >= 6 && count <= 10;
  return count >= 11;
}

function matchesStack(enriched: EnrichedStack, filters: {
  profile: StackFacetProfile;
  specialties: StackSubProfile[];
  objectives: StackFacetObjectiveValue[];
  budget: StackFacetBudget;
  level: StackFacetLevel;
  complexity: StackFacetComplexity;
  types: StackFacetTypeValue[];
  toolCount: StackFacetToolCount;
  query: string;
}): boolean {
  const { stack, derived } = enriched;
  if (filters.profile !== "all" && derived.profile !== filters.profile) return false;
  if (filters.specialties.length > 0 && !filters.specialties.some((specialty) => stack.subProfiles.includes(specialty))) return false;
  if (filters.objectives.length > 0 && !filters.objectives.some((objective) => derived.objectives.includes(objective))) return false;
  if (filters.budget !== "all" && derived.budgetRange !== filters.budget) return false;
  if (filters.level !== "all" && derived.level !== filters.level) return false;
  if (filters.complexity !== "all" && derived.complexity !== filters.complexity) return false;
  if (filters.types.length > 0 && !filters.types.includes(derived.stackType)) return false;
  if (!toolCountMatches(derived.toolCount, filters.toolCount)) return false;

  const q = filters.query.trim().toLowerCase();
  if (!q) return true;
  return stack.searchText.includes(q);
}

function truncate(text: string, max = 150) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

/* ─── Filter panel (shared "Plus de filtres" visual language, see
   CatalogToolbar / ToolsPage) ────────────────────────────────────────────── */
interface CatGroupProps<T extends string> {
  label: string;
  options: Option<T>[];
  active: T;
  counts?: Map<T, number>;
  onChange: (id: T) => void;
  lang: "fr" | "en";
  disabledIds?: Set<T>;
}

function CatGroup<T extends string>({ label, options, active, counts, onChange, lang, disabledIds }: CatGroupProps<T>) {
  return (
    <section className="tt-filter-group">
      <h3>{label}</h3>
      <div className="tt-catgrid">
        {options.map((opt) => {
          const isActive = opt.id === active;
          const isDisabled = Boolean(disabledIds?.has(opt.id) && !isActive);
          return (
            <button
              key={opt.id}
              type="button"
              className={`tt-catrow${isActive ? " is-selected" : ""}`}
              onClick={() => onChange(opt.id)}
              aria-pressed={isActive}
              disabled={isDisabled}
            >
              <span>{lang === "fr" ? opt.label : opt.labelEn}</span>
              {counts && <em>{counts.get(opt.id) ?? 0}</em>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface SegmentedGroupProps<T extends string> {
  label: string;
  options: Option<T>[];
  active: T;
  onChange: (id: T) => void;
  lang: "fr" | "en";
  disabledIds?: Set<T>;
}

function SegmentedGroup<T extends string>({ label, options, active, onChange, lang, disabledIds }: SegmentedGroupProps<T>) {
  return (
    <section className="tt-filter-group">
      <h3>{label}</h3>
      <div className="tt-filter-segmented" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const isActive = opt.id === active;
          const isDisabled = Boolean(disabledIds?.has(opt.id) && !isActive);
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={isDisabled}
              className={`tt-pill${isActive ? " tt-pill--active" : ""}`}
              onClick={() => onChange(opt.id)}
            >
              {lang === "fr" ? opt.label : opt.labelEn}
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface FacetGroupProps<T extends string> {
  label: string;
  options: Option<T>[];
  active: T[];
  onToggle: (id: T) => void;
  lang: "fr" | "en";
  disabledIds?: Set<T>;
  emptyHint?: string;
}

function FacetGroup<T extends string>({ label, options, active, onToggle, lang, disabledIds, emptyHint }: FacetGroupProps<T>) {
  return (
    <section className="tt-filter-group">
      <h3>{label}</h3>
      {options.length > 0 ? (
        <div className="tt-filter-facets">
          {options.map((opt) => {
            const isActive = active.includes(opt.id);
            const isDisabled = Boolean(disabledIds?.has(opt.id) && !isActive);
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isActive}
                disabled={isDisabled}
                className={`tt-pill${isActive ? " tt-pill--active" : ""}`}
                onClick={() => onToggle(opt.id)}
              >
                {lang === "fr" ? opt.label : opt.labelEn}
              </button>
            );
          })}
        </div>
      ) : (
        emptyHint && <p className="tt-filter-hint">{emptyHint}</p>
      )}
    </section>
  );
}

interface StackFilterPanelProps {
  lang: "fr" | "en";
  facetProfile: StackFacetProfile;
  facetSpecialties: StackSubProfile[];
  facetObjectives: StackFacetObjectiveValue[];
  facetBudget: StackFacetBudget;
  facetLevel: StackFacetLevel;
  facetComplexity: StackFacetComplexity;
  facetTypes: StackFacetTypeValue[];
  facetToolCount: StackFacetToolCount;
  subProfileOptions: Option<StackSubProfile>[];
  setFacetProfile: (v: StackFacetProfile) => void;
  toggleFacetSpecialty: (v: StackSubProfile) => void;
  toggleFacetObjective: (v: StackFacetObjectiveValue) => void;
  setFacetBudget: (v: StackFacetBudget) => void;
  setFacetLevel: (v: StackFacetLevel) => void;
  setFacetComplexity: (v: StackFacetComplexity) => void;
  toggleFacetType: (v: StackFacetTypeValue) => void;
  setFacetToolCount: (v: StackFacetToolCount) => void;
  disabled: {
    profiles: Set<StackFacetProfile>;
    specialties: Set<StackSubProfile>;
    objectives: Set<StackFacetObjectiveValue>;
    budgets: Set<StackFacetBudget>;
    levels: Set<StackFacetLevel>;
    complexities: Set<StackFacetComplexity>;
    types: Set<StackFacetTypeValue>;
    toolCounts: Set<StackFacetToolCount>;
  };
}

function StackFilterPanel({
  lang,
  facetProfile,
  facetSpecialties,
  facetObjectives,
  facetBudget,
  facetLevel,
  facetComplexity,
  facetTypes,
  facetToolCount,
  subProfileOptions,
  setFacetProfile,
  toggleFacetSpecialty,
  toggleFacetObjective,
  setFacetBudget,
  setFacetLevel,
  setFacetComplexity,
  toggleFacetType,
  setFacetToolCount,
  disabled,
}: StackFilterPanelProps) {
  return (
    <>
      <CatGroup label={lang === "fr" ? "Profil" : "Profile"} options={PROFILE_OPTIONS} active={facetProfile} onChange={setFacetProfile} lang={lang} disabledIds={disabled.profiles} />
      <FacetGroup
        label={lang === "fr" ? "Spécialité" : "Specialty"}
        options={subProfileOptions}
        active={facetSpecialties}
        onToggle={toggleFacetSpecialty}
        lang={lang}
        disabledIds={disabled.specialties}
        emptyHint={facetProfile === "all" ? (lang === "fr" ? "Choisis d’abord un profil." : "Choose a profile first.") : undefined}
      />
      <SegmentedGroup label={lang === "fr" ? "Niveau" : "Level"} options={LEVEL_OPTIONS} active={facetLevel} onChange={setFacetLevel} lang={lang} disabledIds={disabled.levels} />
      <FacetGroup label={lang === "fr" ? "Objectif" : "Objective"} options={OBJECTIVE_MULTI_OPTIONS} active={facetObjectives} onToggle={toggleFacetObjective} lang={lang} disabledIds={disabled.objectives} />
      <SegmentedGroup label={lang === "fr" ? "Budget cible" : "Target budget"} options={BUDGET_OPTIONS} active={facetBudget} onChange={setFacetBudget} lang={lang} disabledIds={disabled.budgets} />
      <SegmentedGroup label={lang === "fr" ? "Complexité" : "Complexity"} options={COMPLEXITY_OPTIONS} active={facetComplexity} onChange={setFacetComplexity} lang={lang} disabledIds={disabled.complexities} />
      <FacetGroup label={lang === "fr" ? "Type de stack" : "Stack type"} options={TYPE_MULTI_OPTIONS} active={facetTypes} onToggle={toggleFacetType} lang={lang} disabledIds={disabled.types} />
      <SegmentedGroup label={lang === "fr" ? "Nombre d’outils" : "Tool count"} options={TOOL_COUNT_OPTIONS} active={facetToolCount} onChange={setFacetToolCount} lang={lang} disabledIds={disabled.toolCounts} />
    </>
  );
}

interface StackSelectionCardProps {
  enriched: EnrichedStack;
  prefix: string;
  lang: "fr" | "en";
  t: (fr: string, en: string) => string;
  tools: StackCatalogTool[];
}

function StackSelectionCard({ enriched, prefix, lang, t, tools }: StackSelectionCardProps) {
  const { stack, derived } = enriched;
  const title = lang === "fr" ? stack.title : stack.titleEn;
  const primarySubProfile = stack.subProfiles[0];
  const budgetText = stack.monthlyBudget > 0 ? `${stack.monthlyBudget}€/mois` : t("Gratuit", "Free");
  const visualTools = [...tools]
    .sort((a, b) => Number(Boolean(b.ogImageUrl)) - Number(Boolean(a.ogImageUrl)))
    .slice(0, 4);
  const roles = stack.tools
    .map((slot) => lang === "fr" ? slot.role : slot.roleEn)
    .filter((role, index, all) => role && all.indexOf(role) === index);

  return (
    <Link to={`${prefix}/stacks/${stack.slug}`} className="sk-card">
      <div className="sk-card-header">
        <div className="sk-card-heading">
          <div className="sk-card-identity">
            <h2 className="sk-card-title">{title}</h2>
            <span className="sk-card-tag">{personaLabel(stack.persona, lang)}</span>
          </div>
          <div className="sk-card-facts">
            <span className="sk-card-fact sk-card-fact--strong">{budgetText}</span>
            <span className="sk-card-fact">{derived.toolCount} {t("outils", "tools")}</span>
            {primarySubProfile && <span className="sk-card-fact">{subProfileLabel(primarySubProfile, lang)}</span>}
          </div>
        </div>
        <span className="sk-card-cta">{t("Voir la stack", "See stack")} <span aria-hidden>→</span></span>
      </div>

      <div className="sk-card-gallery" aria-label={t("Aperçus des outils de la stack", "Stack tool previews") as string}>
        {visualTools.map((tool) => {
          const slot = stack.tools.find((item) => item.slug === tool.slug || item.slug === tool.id);
          return (
            <div key={tool.id} className="sk-card-gallery-item">
              <ToolCardImage tool={tool} logoSize={34} className="sk-card-tool-image" />
              <span className="sk-card-gallery-caption">
                <strong>{tool.name}</strong>
                <small>{lang === "fr" ? slot?.role : slot?.roleEn}</small>
              </span>
            </div>
          );
        })}
        {stack.tools.length > visualTools.length && (
          <div className="sk-card-gallery-more">
            <ToolLogoPile
              tools={tools.slice(visualTools.length)}
              totalCount={stack.tools.length - visualTools.length}
              max={3}
              ariaLabel={t("Autres outils de la stack", "Other stack tools") as string}
              moreLabel={(count) => t(`${count} outils supplémentaires`, `${count} more tools`) as string}
            />
            <span>+{stack.tools.length - visualTools.length}</span>
            <small>{t("autres outils", "more tools")}</small>
          </div>
        )}
      </div>

      <div className="sk-card-roles" aria-label={t("Rôles couverts", "Covered roles") as string}>
        {roles.slice(0, 6).map((role) => <span key={role}>{role}</span>)}
        {roles.length > 6 && <small>+{roles.length - 6}</small>}
      </div>
    </Link>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
const StacksPage = () => {
  const { t, lang, prefix } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();

  const [facetProfile, setFacetProfile] = useState<StackFacetProfile>(() => validParam(searchParams.get("profile"), PROFILE_OPTIONS, "all"));
  const [facetSpecialties, setFacetSpecialties] = useState<StackSubProfile[]>(() => parseMultiParam(
    searchParams.get("specialty") || searchParams.get("subProfile"),
    STACK_SUB_PROFILES.filter((option): option is { value: StackSubProfile; label: string; labelEn: string; personas?: StackPersona[] } => option.value !== "all").map((option) => option.value),
  ));
  const [facetObjectives, setFacetObjectives] = useState<StackFacetObjectiveValue[]>(() => parseMultiParam(
    searchParams.get("objective"),
    OBJECTIVE_MULTI_OPTIONS.map((option) => option.id),
  ));
  const [facetBudget, setFacetBudget] = useState<StackFacetBudget>(() => validParam(searchParams.get("budget"), BUDGET_OPTIONS, "all"));
  const [facetLevel, setFacetLevel] = useState<StackFacetLevel>(() => validParam(searchParams.get("level"), LEVEL_OPTIONS, "all"));
  const [facetComplexity, setFacetComplexity] = useState<StackFacetComplexity>(() => validParam(searchParams.get("complexity"), COMPLEXITY_OPTIONS, "all"));
  const [facetTypes, setFacetTypes] = useState<StackFacetTypeValue[]>(() => parseMultiParam(
    searchParams.get("type"),
    TYPE_MULTI_OPTIONS.map((option) => option.id),
  ));
  const [facetToolCount, setFacetToolCount] = useState<StackFacetToolCount>(() => validParam(searchParams.get("toolCount"), TOOL_COUNT_OPTIONS, "all"));
  const [sortBy, setSortBy] = useState<StackSortId>(() => validParam(searchParams.get("sort"), [
    { id: "recommended", label: "", labelEn: "" },
    { id: "budget", label: "", labelEn: "" },
    { id: "tools", label: "", labelEn: "" },
  ], "recommended"));
  // La recherche n'est plus dans la barre de filtres : elle vit dans le sticky
  // du haut, commun à tout le site. `query` reste alimenté par ?q= dans l'URL.
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  // Gates the (fairly expensive) per-option availability scan below — only
  // worth computing while the filter panel is actually open to see it.
  const [panelOpen, setPanelOpen] = useState(false);
  // Progressive rendering: the catalog has 200+ stacks; rendering them all at
  // once produced a ~116,000px page with 9k+ DOM nodes. Show a page at a time.
  const STACK_LIST_PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(STACK_LIST_PAGE_SIZE);

  const { toolbarStuck, toolbarSentinelRef } = useCatalogStickyToolbar();

  const toolBySlug = useMemo(() => new Map(STACK_TOOLS.map((tool) => [tool.slug || tool.id, tool])), []);
  const enrichedStacks = useMemo<EnrichedStack[]>(() => STACKS.map((stack) => ({ stack, derived: stack.derived })), []);

  const subProfileOptions = useMemo<Option<StackSubProfile>[]>(() => {
    const available = new Set(facetProfile === "all"
      ? STACKS.flatMap((stack) => stack.subProfiles)
      : STACKS.filter((stack) => stack.persona === facetProfile).flatMap((stack) => stack.subProfiles));
    return STACK_SUB_PROFILES
      .filter((option): option is { value: StackSubProfile; label: string; labelEn: string; personas?: StackPersona[] } => option.value !== "all" && available.has(option.value))
      .map((option) => ({ id: option.value, label: option.label, labelEn: option.labelEn }));
  }, [facetProfile]);

  useEffect(() => {
    const allowed = new Set(subProfileOptions.map((option) => option.id));
    setFacetSpecialties((current) => current.filter((specialty) => allowed.has(specialty)));
  }, [subProfileOptions]);

  function handleProfileChange(nextProfile: StackFacetProfile) {
    setFacetProfile(nextProfile);
    setFacetSpecialties([]);
  }

  function toggleFacetSpecialty(id: StackSubProfile) {
    setFacetSpecialties((current) => toggleValue(current, id));
  }

  function toggleFacetObjective(id: StackFacetObjectiveValue) {
    setFacetObjectives((current) => toggleValue(current, id));
  }

  function toggleFacetType(id: StackFacetTypeValue) {
    setFacetTypes((current) => toggleValue(current, id));
  }

  const isFiltered = facetProfile !== "all" || facetSpecialties.length > 0 || facetObjectives.length > 0 || facetBudget !== "all"
    || facetLevel !== "all" || facetComplexity !== "all" || facetTypes.length > 0 || facetToolCount !== "all" || query.trim() !== "";

  // Objectif drives the pill row itself (see toolbarPills below), so — like
  // ToolsPage's category — it isn't counted again on the "More filters"
  // badge; only facets that live exclusively inside the panel are.
  const panelFilterCount = (facetProfile !== "all" ? 1 : 0) + facetSpecialties.length
    + [facetBudget, facetLevel, facetComplexity, facetToolCount].filter((f) => f !== "all").length
    + facetTypes.length;
  const cloudObjective = facetObjectives.length === 1 ? facetObjectives[0] : null;

  const toolbarPills = useMemo<ToolbarPill[]>(() => {
    if (cloudObjective) {
      return [
        { id: "back", label: t("Tout", "All") as string, onClick: () => { setFacetObjectives([]); setFacetSpecialties([]); } },
        ...OBJECTIVE_TAG_CLOUD[cloudObjective].map((specialty) => ({
          id: specialty,
          label: subProfileLabel(specialty, lang),
          active: facetSpecialties.includes(specialty),
          onClick: () => setFacetSpecialties(facetSpecialties.includes(specialty) ? [] : [specialty]),
        })),
      ];
    }
    return [
      { id: "all", label: t("Tout", "All") as string, active: true, onClick: () => setFacetObjectives([]) },
      ...OBJECTIVE_MULTI_OPTIONS.map((objective) => ({
        id: objective.id,
        label: optionLabel(OBJECTIVE_OPTIONS, objective.id, lang),
        onClick: () => { setFacetObjectives([objective.id]); setFacetSpecialties([]); },
      })),
    ];
  }, [cloudObjective, facetSpecialties, lang, t]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    QUERY_KEYS.forEach((key) => next.delete(key));
    if (facetProfile !== "all") next.set("profile", facetProfile);
    if (facetSpecialties.length > 0) next.set("specialty", serializeMultiParam(facetSpecialties));
    if (facetObjectives.length > 0) next.set("objective", serializeMultiParam(facetObjectives));
    if (facetBudget !== "all") next.set("budget", facetBudget);
    if (facetLevel !== "all") next.set("level", facetLevel);
    if (facetComplexity !== "all") next.set("complexity", facetComplexity);
    if (facetTypes.length > 0) next.set("type", serializeMultiParam(facetTypes));
    if (facetToolCount !== "all") next.set("toolCount", facetToolCount);
    if (sortBy !== "recommended") next.set("sort", sortBy);
    if (query.trim()) next.set("q", query.trim());

    const current = searchParams.toString();
    const updated = next.toString();
    if (current !== updated) setSearchParams(next, { replace: true });
  }, [facetProfile, facetSpecialties, facetObjectives, facetBudget, facetLevel, facetComplexity, facetTypes, facetToolCount, sortBy, query, searchParams, setSearchParams]);

  function resetFacets() {
    setFacetProfile("all");
    setFacetSpecialties([]);
    setFacetObjectives([]);
    setFacetBudget("all");
    setFacetLevel("all");
    setFacetComplexity("all");
    setFacetTypes([]);
    setFacetToolCount("all");
    setQuery("");
    setSortBy("recommended");
  }

  const currentFilters = useMemo(() => ({
    profile: facetProfile,
    specialties: facetSpecialties,
    objectives: facetObjectives,
    budget: facetBudget,
    level: facetLevel,
    complexity: facetComplexity,
    types: facetTypes,
    toolCount: facetToolCount,
    query,
  }), [facetProfile, facetSpecialties, facetObjectives, facetBudget, facetLevel, facetComplexity, facetTypes, facetToolCount, query]);

  const hasStackFor = useMemo(() => {
    return (overrides: Partial<typeof currentFilters>) =>
      enrichedStacks.some((enriched) => matchesStack(enriched, { ...currentFilters, ...overrides }));
  }, [currentFilters, enrichedStacks]);

  const disabledFacetIds = useMemo(() => {
    // Availability checks scan the catalogue for every filter option. They are
    // useful only while the filter panel is visible, so keep them off the
    // critical rendering path.
    if (!panelOpen) {
      return {
        profiles: new Set<StackFacetProfile>(),
        specialties: new Set<StackSubProfile>(),
        objectives: new Set<StackFacetObjectiveValue>(),
        budgets: new Set<StackFacetBudget>(),
        levels: new Set<StackFacetLevel>(),
        complexities: new Set<StackFacetComplexity>(),
        types: new Set<StackFacetTypeValue>(),
        toolCounts: new Set<StackFacetToolCount>(),
      };
    }
    return {
      profiles: new Set(PROFILE_OPTIONS.filter((option) => option.id !== "all" && !hasStackFor({ profile: option.id, specialties: [] })).map((option) => option.id)),
      specialties: new Set(subProfileOptions.filter((option) => !facetSpecialties.includes(option.id) && !hasStackFor({ specialties: [option.id] })).map((option) => option.id)),
      objectives: new Set(OBJECTIVE_MULTI_OPTIONS.filter((option) => !facetObjectives.includes(option.id) && !hasStackFor({ objectives: [option.id] })).map((option) => option.id)),
      budgets: new Set(BUDGET_OPTIONS.filter((option) => option.id !== "all" && !hasStackFor({ budget: option.id })).map((option) => option.id)),
      levels: new Set(LEVEL_OPTIONS.filter((option) => option.id !== "all" && !hasStackFor({ level: option.id })).map((option) => option.id)),
      complexities: new Set(COMPLEXITY_OPTIONS.filter((option) => option.id !== "all" && !hasStackFor({ complexity: option.id })).map((option) => option.id)),
      types: new Set(TYPE_MULTI_OPTIONS.filter((option) => !facetTypes.includes(option.id) && !hasStackFor({ types: [option.id] })).map((option) => option.id)),
      toolCounts: new Set(TOOL_COUNT_OPTIONS.filter((option) => option.id !== "all" && !hasStackFor({ toolCount: option.id })).map((option) => option.id)),
    };
  }, [facetObjectives, facetSpecialties, facetTypes, hasStackFor, panelOpen, subProfileOptions]);

  const filteredStacks = useMemo(() => {
    const filtered = enrichedStacks.filter((enriched) => matchesStack(enriched, currentFilters));

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
  }, [enrichedStacks, toolBySlug, currentFilters, sortBy]);

  // Back to the first page whenever the filtered/sorted set changes.
  useEffect(() => { setVisibleCount(STACK_LIST_PAGE_SIZE); }, [filteredStacks]);

  const activeChips = [
    facetProfile !== "all" ? { id: "profile", label: optionLabel(PROFILE_OPTIONS, facetProfile, lang), clear: () => handleProfileChange("all") } : null,
    ...facetSpecialties.map((specialty) => ({ id: `specialty-${specialty}`, label: subProfileLabel(specialty, lang), clear: () => setFacetSpecialties((current) => current.filter((item) => item !== specialty)) })),
    ...facetObjectives.map((objective) => ({ id: `objective-${objective}`, label: optionLabel(OBJECTIVE_OPTIONS, objective, lang), clear: () => setFacetObjectives((current) => current.filter((item) => item !== objective)) })),
    facetBudget !== "all" ? { id: "budget", label: `${t("Budget", "Budget")} ${optionLabel(BUDGET_OPTIONS, facetBudget, lang)}`, clear: () => setFacetBudget("all") } : null,
    facetLevel !== "all" ? { id: "level", label: `${t("Niveau", "Level")} ${optionLabel(LEVEL_OPTIONS, facetLevel, lang).toLowerCase()}`, clear: () => setFacetLevel("all") } : null,
    facetComplexity !== "all" ? { id: "complexity", label: optionLabel(COMPLEXITY_OPTIONS, facetComplexity, lang), clear: () => setFacetComplexity("all") } : null,
    ...facetTypes.map((type) => ({ id: `type-${type}`, label: optionLabel(TYPE_OPTIONS, type, lang), clear: () => setFacetTypes((current) => current.filter((item) => item !== type)) })),
    facetToolCount !== "all" ? { id: "toolCount", label: optionLabel(TOOL_COUNT_OPTIONS, facetToolCount, lang), clear: () => setFacetToolCount("all") } : null,
    query.trim() ? { id: "q", label: query.trim(), clear: () => setQuery("") } : null,
  ].filter((chip): chip is { id: string; label: string; clear: () => void } => Boolean(chip));

  useEffect(() => {
    const title = lang === "fr"
      ? "Stacks SaaS freelance calibrées par profil, budget et niveau | ToolTrim"
      : "Freelance SaaS stacks calibrated by profile, budget and level | ToolTrim";
    const description = lang === "fr"
      ? "Explore des stacks SaaS recommandées selon ton profil, ton budget, ton niveau et tes usages pour savoir quels outils garder, couper ou challenger."
      : "Explore SaaS stacks recommended by profile, budget, level and real usage to know which tools to keep, cut or challenge.";
    setSeoTags({ title, description, url: `${SEO_BASE}/${lang}/stacks`, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/stacks`);
    // A single ItemList of the stacks, each pointing at its own detail page,
    // is the standard schema for a listing page — lighter and more useful for
    // SEO (it surfaces the individual /stacks/<slug> URLs) than the previous
    // CollectionPage that nested every stack's full tool list inline.
    setJsonLd("stacks-jsonld", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: `${SEO_BASE}/${lang}/stacks`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: STACKS.length,
        itemListElement: STACKS.map((stack, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: lang === "fr" ? stack.title : stack.titleEn,
          url: `${SEO_BASE}/${lang}/stacks/${stack.slug}`,
        })),
      },
    });
    return () => cleanupSeo(["stacks-jsonld"]);
  }, [lang]);

  return (
    <div className="tt-catalog-page min-h-screen" style={{ "--page-accent": "#00E572" } as CSSProperties}>
      <section id="stacks" className="sk-section sk-listing-section scroll-mt-20">
        <div className="sk-container">
          {/* ── Compact header: breadcrumb, then one title. ── */}
          <div className="tt-catalog-compact-header">
            <Breadcrumb
              items={cloudObjective
                ? [{ label: t("Stacks", "Stacks") as string, href: `${prefix}/stacks` }, { label: optionLabel(OBJECTIVE_OPTIONS, cloudObjective, lang) }]
                : [{ label: t("Stacks", "Stacks") as string }]}
            />
            <h1 className="tt-catalog-compact-title">{t("Stacks", "Stacks")}</h1>
          </div>

          <div ref={toolbarSentinelRef} aria-hidden="true" style={{ height: 1 }} />

          {/* Filter bar — same shape as ToolsPage: a single pill row (here,
              Objectif, with its specialty drill-down), a "Plus de filtres"
              popover for the long tail, and sort. */}
          <CatalogToolbar
            pills={toolbarPills}
            navLabel={t("Naviguer par besoin", "Browse by need") as string}
            stuck={toolbarStuck}
            panelTitle={t("Filtres", "Filters") as string}
            moreLabel={t("Plus de filtres", "More filters") as string}
            clearLabel={t("Tout effacer", "Clear all") as string}
            activeFilterCount={panelFilterCount}
            onClearFilters={resetFacets}
            onPanelOpenChange={setPanelOpen}
            panel={
              <StackFilterPanel
                lang={lang}
                facetProfile={facetProfile}
                facetSpecialties={facetSpecialties}
                facetObjectives={facetObjectives}
                facetBudget={facetBudget}
                facetLevel={facetLevel}
                facetComplexity={facetComplexity}
                facetTypes={facetTypes}
                facetToolCount={facetToolCount}
                subProfileOptions={subProfileOptions}
                setFacetProfile={handleProfileChange}
                toggleFacetSpecialty={toggleFacetSpecialty}
                toggleFacetObjective={toggleFacetObjective}
                setFacetBudget={setFacetBudget}
                setFacetLevel={setFacetLevel}
                setFacetComplexity={setFacetComplexity}
                toggleFacetType={toggleFacetType}
                setFacetToolCount={setFacetToolCount}
                disabled={disabledFacetIds}
              />
            }
            sort={{
              value: sortBy,
              onChange: (value) => setSortBy(value as StackSortId),
              ariaLabel: t("Trier par", "Sort by") as string,
              title: t("Trier les stacks", "Sort stacks") as string,
              options: [
                { value: "recommended", label: t("Recommandé", "Recommended") as string },
                { value: "budget", label: t("Budget", "Budget") as string },
                { value: "tools", label: t("Nombre d’outils", "Tool count") as string },
              ],
            }}
          />

          <div className="sk-listing-layout">
            <div className="sk-results">
              {activeChips.length > 0 && (
                <div className="sk-active-filters" aria-label={t("Filtres actifs", "Active filters") as string}>
                  {activeChips.map((chip) => (
                    <button key={chip.id} type="button" className="sk-active-chip" onClick={chip.clear} aria-label={t(`Retirer le filtre ${chip.label}`, `Remove filter ${chip.label}`) as string}>
                      {chip.label}<X size={13} aria-hidden />
                    </button>
                  ))}
                  <button type="button" className="sk-active-reset" onClick={resetFacets}>{t("Réinitialiser", "Reset")}</button>
                </div>
              )}

              {filteredStacks.length > 0 ? (
                <>
                <div className="sk-results-grid">
                  {filteredStacks.slice(0, visibleCount).map((enriched) => {
                    const stackTools = enriched.stack.tools
                      .slice(0, 6)
                      .map((slot) => toolBySlug.get(slot.slug))
                      .filter(Boolean) as NonNullable<ReturnType<typeof toolBySlug.get>>[];
                    return (
                      <StackSelectionCard
                        key={enriched.stack.id}
                        enriched={enriched}
                        prefix={prefix}
                        lang={lang}
                        t={t}
                        tools={stackTools}
                      />
                    );
                  })}
                </div>
                {filteredStacks.length > visibleCount && (
                  <div className="sk-load-more">
                    <button
                      type="button"
                      className="sk-load-more-btn"
                      onClick={() => setVisibleCount((c) => c + STACK_LIST_PAGE_SIZE)}
                    >
                      {t("Voir plus de stacks", "Show more stacks")}
                    </button>
                  </div>
                )}
                </>
              ) : (
                <div className="sk-empty-state">
                  <p className="sk-empty-title">{t("Aucune stack ne correspond à cette combinaison.", "No stack matches this combination.")}</p>
                  <p className="sk-empty-desc">
                    {t("Essaie d’élargir ton budget, de retirer une spécialité ou de repartir d’un profil plus large.", "Try widening your budget, removing a specialty, or starting from a broader profile.")}
                  </p>
                  <button type="button" onClick={resetFacets} className="sk-empty-reset">{t("Réinitialiser les filtres", "Reset filters")}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StacksPage;
