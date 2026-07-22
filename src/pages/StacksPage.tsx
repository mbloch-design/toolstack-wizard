import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { X, SlidersHorizontal } from "lucide-react";
import ToolLogoPile from "@/components/ToolLogoPile";
import Breadcrumb from "@/components/Breadcrumb";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import FilterDropdown from "@/components/filters/FilterDropdown";
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
}, toolNames: string[]): boolean {
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
interface SingleFacetGroupProps<T extends string> {
  label: string;
  options: Option<T>[];
  active: T;
  onChange: (id: T) => void;
  lang: "fr" | "en";
  disabledIds?: Set<T>;
}

function SingleFacetGroup<T extends string>({ label, options, active, onChange, lang, disabledIds }: SingleFacetGroupProps<T>) {
  return (
    <div className="sk-facet-group">
      <p className="sk-facet-group-label">{label}</p>
      <div className="sk-facet-options">
        {options.map((opt) => {
          const isActive = opt.id === active;
          const isDisabled = Boolean(disabledIds?.has(opt.id) && !isActive);
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isActive}
              disabled={isDisabled}
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

interface MultiFacetGroupProps<T extends string> {
  label: string;
  options: Option<T>[];
  active: T[];
  onToggle: (id: T) => void;
  lang: "fr" | "en";
  disabledIds?: Set<T>;
}

function MultiFacetGroup<T extends string>({ label, options, active, onToggle, lang, disabledIds }: MultiFacetGroupProps<T>) {
  return (
    <div className="sk-facet-group">
      <p className="sk-facet-group-label">{label}</p>
      <div className="sk-facet-options">
        {options.map((opt) => {
          const isActive = active.includes(opt.id);
          const isDisabled = Boolean(disabledIds?.has(opt.id) && !isActive);
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isActive}
              disabled={isDisabled}
              onClick={() => onToggle(opt.id)}
              className={`sk-facet-option sk-facet-option--multi${isActive ? " sk-facet-option--active" : ""}`}
            >
              <span className="sk-facet-check" aria-hidden />
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
  onReset: () => void;
  isFiltered: boolean;
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

function SidebarContent({
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
  onReset,
  isFiltered,
  disabled,
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

      <div className="sk-facet-section">
        <p className="sk-facet-section-title">{lang === "fr" ? "TON CONTEXTE" : "YOUR CONTEXT"}</p>
        <SingleFacetGroup label={lang === "fr" ? "Profil" : "Profile"} options={PROFILE_OPTIONS} active={facetProfile} onChange={setFacetProfile} lang={lang} disabledIds={disabled.profiles} />
        {facetProfile === "all" ? (
          <div className="sk-facet-group">
            <p className="sk-facet-group-label">{lang === "fr" ? "Spécialité" : "Specialty"}</p>
            <p className="sk-facet-empty">{lang === "fr" ? "Choisis d’abord un profil." : "Choose a profile first."}</p>
          </div>
        ) : (
          <MultiFacetGroup label={lang === "fr" ? "Spécialité" : "Specialty"} options={subProfileOptions} active={facetSpecialties} onToggle={toggleFacetSpecialty} lang={lang} disabledIds={disabled.specialties} />
        )}
        <SingleFacetGroup label={lang === "fr" ? "Niveau" : "Level"} options={LEVEL_OPTIONS} active={facetLevel} onChange={setFacetLevel} lang={lang} disabledIds={disabled.levels} />
      </div>

      <div className="sk-facet-section">
        <p className="sk-facet-section-title">{lang === "fr" ? "TON BESOIN" : "YOUR NEED"}</p>
        <MultiFacetGroup label={lang === "fr" ? "Objectif" : "Objective"} options={OBJECTIVE_MULTI_OPTIONS} active={facetObjectives} onToggle={toggleFacetObjective} lang={lang} disabledIds={disabled.objectives} />
        <SingleFacetGroup label={lang === "fr" ? "Budget cible" : "Target budget"} options={BUDGET_OPTIONS} active={facetBudget} onChange={setFacetBudget} lang={lang} disabledIds={disabled.budgets} />
      </div>

      <div className="sk-facet-section">
        <p className="sk-facet-section-title">{lang === "fr" ? "AFFINER" : "REFINE"}</p>
        <SingleFacetGroup label={lang === "fr" ? "Complexité" : "Complexity"} options={COMPLEXITY_OPTIONS} active={facetComplexity} onChange={setFacetComplexity} lang={lang} disabledIds={disabled.complexities} />
        <MultiFacetGroup label={lang === "fr" ? "Type de stack" : "Stack type"} options={TYPE_MULTI_OPTIONS} active={facetTypes} onToggle={toggleFacetType} lang={lang} disabledIds={disabled.types} />
        <SingleFacetGroup label={lang === "fr" ? "Nombre d’outils" : "Tool count"} options={TOOL_COUNT_OPTIONS} active={facetToolCount} onChange={setFacetToolCount} lang={lang} disabledIds={disabled.toolCounts} />
      </div>

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
  t: (fr: string, en: string) => string;
  tools: NonNullable<ReturnType<typeof useToolSummaries>["tools"]>[number][];
}

function StackSelectionCard({ enriched, prefix, lang, t, tools }: StackSelectionCardProps) {
  const { stack, derived } = enriched;
  const title = lang === "fr" ? stack.title : stack.titleEn;
  const verdict = lang === "fr" ? derived.verdict : derived.verdictEn;
  const primarySubProfile = stack.subProfiles[0];
  const budgetText = stack.monthlyBudget > 0 ? `${stack.monthlyBudget}€/mois` : t("Gratuit", "Free");

  return (
    <Link to={`${prefix}/stacks/${stack.slug}`} className="sk-card">
      <span className="sk-card-tag">
        {personaLabel(stack.persona, lang)}
        {primarySubProfile ? ` · ${subProfileLabel(primarySubProfile, lang)}` : ""}
      </span>

      <h2 className="sk-card-title">{title}</h2>
      <p className="sk-card-verdict">{truncate(verdict, 96)}</p>

      {/* Tools = the visual heart of a stack, shown as a clear row */}
      <ToolLogoPile
        tools={tools}
        totalCount={stack.tools.length}
        max={6}
        ariaLabel={t("Outils de la stack", "Stack tools") as string}
        moreLabel={(count) => t(`${count} outils supplémentaires`, `${count} more tools`) as string}
        className="sk-card-tools"
      />

      <div className="sk-card-footer">
        <div className="sk-card-stats">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="sk-card-stat sk-card-stat--strong">{budgetText}</span>
            </TooltipTrigger>
            <TooltipContent>{t("Budget mensuel cible", "Target monthly budget")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="sk-card-stat">{derived.toolCount} {t("outils", "tools")}</span>
            </TooltipTrigger>
            <TooltipContent>{t("Nombre d'outils dans la stack", "Number of tools in the stack")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="sk-card-stat">{optionLabel(LEVEL_OPTIONS, derived.level, lang)}</span>
            </TooltipTrigger>
            <TooltipContent>{t("Niveau d'expérience recommandé", "Recommended experience level")}</TooltipContent>
          </Tooltip>
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
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [mobileOpen, setMobileOpen] = useState(false);
  // Progressive rendering: the catalog has 200+ stacks; rendering them all at
  // once produced a ~116,000px page with 9k+ DOM nodes. Show a page at a time.
  const STACK_LIST_PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(STACK_LIST_PAGE_SIZE);

  const panelRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLButtonElement>(null);
  const [panelCoords, setPanelCoords] = useState({ top: 0, left: 0 });
  const [toolbarStuck, setToolbarStuck] = useState(false);
  const toolbarSentinelRef = useRef<HTMLDivElement>(null);

  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);
  const enrichedStacks = useMemo<EnrichedStack[]>(() => STACKS.map((stack) => ({ stack, derived: getStackDerivedFields(stack) })), []);

  const subProfileOptions = useMemo<Option<StackSubProfile>[]>(() => {
    if (facetProfile === "all") return [];
    const available = new Set(
      STACKS.filter((stack) => stack.persona === facetProfile).flatMap((stack) => stack.subProfiles),
    );
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

  const activeFilterCount = (facetProfile !== "all" ? 1 : 0) + facetSpecialties.length + facetObjectives.length
    + [facetBudget, facetLevel, facetComplexity, facetToolCount].filter((f) => f !== "all").length
    + facetTypes.length + (query.trim() ? 1 : 0);

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

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (filtersRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [mobileOpen]);

  // Panel is portaled to document.body (the filter bar scrolls horizontally
  // on narrow widths, which would otherwise clip an absolutely-positioned
  // panel's vertical overflow) — position it with fixed coordinates computed
  // from the trigger's own rect, clamped so it never spills off either edge.
  useLayoutEffect(() => {
    if (!mobileOpen || !filtersRef.current) return;
    const rect = filtersRef.current.getBoundingClientRect();
    const panelWidth = Math.min(720, window.innerWidth - 32);
    let left = rect.left;
    if (left + panelWidth > window.innerWidth - 16) left = window.innerWidth - 16 - panelWidth;
    if (left < 16) left = 16;
    setPanelCoords({ top: rect.bottom + 8, left });
  }, [mobileOpen]);

  // Toggle the sticky toolbar's "stuck" border once its sentinel (placed
  // right above it) scrolls out of view — .asv2-content is the real scroll
  // container on desktop, not the window, so it must be the observer's root.
  useEffect(() => {
    const sentinel = toolbarSentinelRef.current;
    if (!sentinel) return;
    const scrollRoot = sentinel.closest(".asv2-content");
    const observer = new IntersectionObserver(
      ([entry]) => setToolbarStuck(!entry.isIntersecting),
      { root: scrollRoot, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

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
    return (overrides: Partial<typeof currentFilters>) => enrichedStacks.some((enriched) => {
      const toolNames = enriched.stack.tools.map((slot) => toolBySlug.get(slot.slug)?.name || slot.slug);
      return matchesStack(enriched, { ...currentFilters, ...overrides }, toolNames);
    });
  }, [currentFilters, enrichedStacks, toolBySlug]);

  const disabledFacetIds = useMemo(() => ({
    profiles: new Set(PROFILE_OPTIONS.filter((option) => option.id !== "all" && !hasStackFor({ profile: option.id, specialties: [] })).map((option) => option.id)),
    specialties: new Set(subProfileOptions.filter((option) => !facetSpecialties.includes(option.id) && !hasStackFor({ specialties: [option.id] })).map((option) => option.id)),
    objectives: new Set(OBJECTIVE_MULTI_OPTIONS.filter((option) => !facetObjectives.includes(option.id) && !hasStackFor({ objectives: [option.id] })).map((option) => option.id)),
    budgets: new Set(BUDGET_OPTIONS.filter((option) => option.id !== "all" && !hasStackFor({ budget: option.id })).map((option) => option.id)),
    levels: new Set(LEVEL_OPTIONS.filter((option) => option.id !== "all" && !hasStackFor({ level: option.id })).map((option) => option.id)),
    complexities: new Set(COMPLEXITY_OPTIONS.filter((option) => option.id !== "all" && !hasStackFor({ complexity: option.id })).map((option) => option.id)),
    types: new Set(TYPE_MULTI_OPTIONS.filter((option) => !facetTypes.includes(option.id) && !hasStackFor({ types: [option.id] })).map((option) => option.id)),
    toolCounts: new Set(TOOL_COUNT_OPTIONS.filter((option) => option.id !== "all" && !hasStackFor({ toolCount: option.id })).map((option) => option.id)),
  }), [facetObjectives, facetSpecialties, facetTypes, hasStackFor, subProfileOptions]);

  const filteredStacks = useMemo(() => {
    const filtered = enrichedStacks.filter((enriched) => {
      const toolNames = enriched.stack.tools.map((slot) => toolBySlug.get(slot.slug)?.name || slot.slug);
      return matchesStack(enriched, currentFilters, toolNames);
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
  }, [lang, toolBySlug]);

  return (
    <div className="tt-catalog-page min-h-screen" style={{ "--page-accent": "#00E572" } as CSSProperties}>
      <section id="stacks" className="sk-section sk-listing-section scroll-mt-20">
        <div className="sk-container">
          {/* ── Compact header: breadcrumb + title, no banner artwork —
              same pattern as ToolsPage, replacing the tall gradient hero. ── */}
          <div className="tt-catalog-compact-header">
            <Breadcrumb items={[{ label: t("Stacks", "Stacks") }]} />
            <h1 className="tt-catalog-compact-title">{t("Trouver une stack claire.", "Find a clear stack.")}</h1>
          </div>

          <div ref={toolbarSentinelRef} aria-hidden="true" style={{ height: 1 }} />

          {/* Filter bar — same shape as ToolsPage's .tt-filter-bar: quick
              pills for the 2 most decision-relevant facets (Profil, Budget),
              a "Filtres" trigger for the long tail (Spécialité, Objectif,
              Niveau, Complexité, Type, Nb d'outils), reusing the same panel
              at every breakpoint instead of only on mobile. */}
          <div className={`sk-mobile-trigger-row${toolbarStuck ? " sk-mobile-trigger-row--stuck" : ""}`}>
            <FilterDropdown
              label={t("Tous les profils", "All profiles") as string}
              allLabel={t("Tous les profils", "All profiles") as string}
              options={PROFILE_OPTIONS.filter((opt) => opt.id !== "all").map((opt) => ({ id: opt.id, label: optionLabel(PROFILE_OPTIONS, opt.id, lang) }))}
              value={facetProfile}
              onChange={(id) => handleProfileChange(id as StackFacetProfile)}
            />
            <FilterDropdown
              label={t("Tous les budgets", "All budgets") as string}
              allLabel={t("Tous les budgets", "All budgets") as string}
              options={BUDGET_OPTIONS.filter((opt) => opt.id !== "all").map((opt) => ({ id: opt.id, label: optionLabel(BUDGET_OPTIONS, opt.id, lang) }))}
              value={facetBudget}
              onChange={(id) => setFacetBudget(id as StackFacetBudget)}
            />
            <button type="button" ref={filtersRef} onClick={() => setMobileOpen((o) => !o)} className={`sk-mobile-trigger${mobileOpen ? " tf-dd-trigger--open" : ""}`} aria-label={t("Ouvrir les filtres", "Open filters") as string} aria-expanded={mobileOpen}>
              <SlidersHorizontal size={15} aria-hidden />
              {activeFilterCount > 0 ? t(`Filtres (${activeFilterCount})`, `Filters (${activeFilterCount})`) : t("Plus de filtres", "More filters")}
            </button>
            {mobileOpen && createPortal(
              <div className="sk-filters-panel" role="dialog" aria-label={t("Filtres", "Filters") as string} ref={panelRef} style={{ position: "fixed", top: panelCoords.top, left: panelCoords.left }}>
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
                    onReset={resetFacets}
                    isFiltered={isFiltered}
                    disabled={disabledFacetIds}
                  />
                </div>
              </div>,
              document.body,
            )}
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Rechercher…", "Search…") as string} className="sk-search-input" />
          </div>

          <div className="sk-listing-layout">
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
                    <span className="sk-load-more-count">
                      {t(
                        `${Math.min(visibleCount, filteredStacks.length)} sur ${filteredStacks.length}`,
                        `${Math.min(visibleCount, filteredStacks.length)} of ${filteredStacks.length}`,
                      )}
                    </span>
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
