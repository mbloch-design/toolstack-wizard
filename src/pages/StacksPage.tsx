import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Boxes, Check, ChevronDown, Search, X } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import { STACK_PERSONAS, STACK_STAGES, STACK_SUB_PROFILES, STACKS, type StackBudget, type StackPersona, type StackStage, type StackSubProfile } from "@/data/stacks";

const STACK_VISUALS: Record<string, string> = {
  "freelance": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85",
  "agence-marketing": "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=85",
  "solopreneur": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1000&q=85",
  "ecommerce": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=85",
  "startup-saas": "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=85",
  "developpeur-freelance-shipper": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=85",
  "designer-freelance-solo": "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=1000&q=85",
  "consultant-b2b-propre": "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=85",
  "createur-contenu-operateur": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1000&q=85",
  "ops-manager-fractional-coo": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=85",
  "freelance-solo-zero-bloat": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=85",
  "automatisation-legere-freelance": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85",
  "ia-generative-pour-rediger": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1000&q=85",
  "ia-generative-pour-images": "https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&w=1000&q=85",
  "ia-generative-pour-coder": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1000&q=85",
  "ia-generative-pour-voix-video": "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1000&q=85",
  "ia-generative-pour-recherche-veille": "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1000&q=85",
};

type StackListItem = (typeof STACKS)[number];
type StackFilterKey = "persona" | "subProfile" | "stage" | "budget";
type StackFilterValue = StackPersona | StackSubProfile | StackStage | StackBudget;
type SelectedStackFilters = Record<StackFilterKey, string[]>;
type StackFilterOption = {
  value: StackFilterValue;
  label: string;
  labelEn: string;
  description?: string;
  descriptionEn?: string;
  personas?: StackPersona[];
  matches?: (stack: StackListItem) => boolean;
};
type StackFilterGroup = {
  id: StackFilterKey;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  options: StackFilterOption[];
};

const EMPTY_STACK_FILTERS: SelectedStackFilters = {
  persona: [],
  subProfile: [],
  stage: [],
  budget: [],
};

const STACK_BUDGET_FILTERS: StackFilterOption[] = [
  { value: "free", label: "0€/mois", labelEn: "€0/mo" },
  { value: "under50", label: "Jusqu'à 50€/mois", labelEn: "Up to €50/mo" },
  { value: "under150", label: "Jusqu'à 150€/mois", labelEn: "Up to €150/mo" },
];

const STACK_FILTER_GROUPS: StackFilterGroup[] = [
  {
    id: "persona",
    label: "Profil",
    labelEn: "Profile",
    description: "La base de départ de la stack.",
    descriptionEn: "The stack starting profile.",
    options: STACK_PERSONAS.filter((option): option is { value: StackPersona; label: string; labelEn: string } => option.value !== "all"),
  },
  {
    id: "subProfile",
    label: "Spécialité",
    labelEn: "Specialty",
    description: "Le sous-profil ou le besoin précis.",
    descriptionEn: "The sub-profile or precise need.",
    options: STACK_SUB_PROFILES
      .filter((option): option is { value: StackSubProfile; label: string; labelEn: string; personas?: StackPersona[] } => option.value !== "all")
      .map((option) => ({
        ...option,
        matches: (stack: StackListItem) => stack.subProfiles.includes(option.value),
      })),
  },
  {
    id: "stage",
    label: "Maturité",
    labelEn: "Maturity",
    description: "Où tu en es dans l'usage.",
    descriptionEn: "Where you are in the usage.",
    options: STACK_STAGES.filter((option): option is { value: StackStage; label: string; labelEn: string } => option.value !== "all"),
  },
  {
    id: "budget",
    label: "Coût mensuel",
    labelEn: "Monthly cost",
    description: "Un ordre de grandeur, pas un prix exact.",
    descriptionEn: "A rough range, not an exact price.",
    options: STACK_BUDGET_FILTERS,
  },
];

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
  { persona: "dev", slug: "developpeur-freelance-shipper" },
  { persona: "designer", slug: "designer-freelance-solo" },
  { persona: "consultant", slug: "consultant-b2b-propre" },
  { persona: "content", slug: "createur-contenu-operateur" },
  { persona: "ops", slug: "ops-manager-fractional-coo" },
  { persona: "solo", slug: "freelance-solo-zero-bloat" },
] as const;

const PERSONA_FILTER_GROUP = STACK_FILTER_GROUPS.find((group) => group.id === "persona")!;
const SUB_PROFILE_FILTER_GROUP = STACK_FILTER_GROUPS.find((group) => group.id === "subProfile")!;
const SECONDARY_FILTER_GROUPS = STACK_FILTER_GROUPS.filter((group) => group.id === "stage" || group.id === "budget");

const StacksPage = () => {
  const { t, lang, prefix } = useLang();
  const { tools } = useToolSummaries();
  const [query, setQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<SelectedStackFilters>(EMPTY_STACK_FILTERS);
  const [openProfiles, setOpenProfiles] = useState<string[]>([]);

  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);

  const filteredStacks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STACKS
      .filter((stack) => {
        return stackMatchesFilters(stack, selectedFilters) && stackMatchesQuery(stack, q);
      })
      .sort((a, b) => {
        const aIndex = FEATURED_STACK_SLUGS.indexOf(a.slug);
        const bIndex = FEATURED_STACK_SLUGS.indexOf(b.slug);
        if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
        if (aIndex >= 0) return -1;
        if (bIndex >= 0) return 1;
        return 0;
      });
  }, [query, selectedFilters]);

  const facetCounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const counts: Record<string, number> = {};
    STACK_FILTER_GROUPS.forEach((group) => {
      group.options.forEach((option) => {
        const filtersWithoutCurrent = { ...selectedFilters, [group.id]: [] };
        counts[`${group.id}-${option.value}`] = STACKS.filter((stack) => (
          stackMatchesQuery(stack, q)
          && stackMatchesFilters(stack, filtersWithoutCurrent)
          && stackMatchesFilterOption(stack, group, option)
        )).length;
      });
    });
    return counts;
  }, [query, selectedFilters]);

  const specialtyCounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const counts: Record<string, number> = {};
    PERSONA_FILTER_GROUP.options.forEach((profile) => {
      SUB_PROFILE_FILTER_GROUP.options.forEach((specialty) => {
        counts[`${profile.value}-${specialty.value}`] = STACKS.filter((stack) => (
          stackMatchesQuery(stack, q)
          && stackMatchesFilters(stack, {
            ...selectedFilters,
            persona: [profile.value],
            subProfile: [],
          })
          && stackMatchesFilterOption(stack, SUB_PROFILE_FILTER_GROUP, specialty)
        )).length;
      });
    });
    return counts;
  }, [query, selectedFilters]);

  const activeFilters = STACK_FILTER_GROUPS.flatMap((group) => selectedFilters[group.id]
    .filter((value) => (
      group.id !== "subProfile" || !isSpecialtyCoveredByCompleteProfile(value, selectedFilters)
    ))
    .map((value) => {
      const option = group.options.find((item) => item.value === value);
      return {
        groupId: group.id,
        value,
        label: lang === "fr" ? option?.label || value : option?.labelEn || value,
      };
    }));

  const profileRecommendedStacks = PROFILE_RECOMMENDED_STACKS
    .map(({ persona, slug }) => ({
      persona,
      stack: STACKS.find((item) => item.slug === slug),
    }))
    .filter((item): item is { persona: StackPersona; stack: StackListItem } => Boolean(item.stack));
  const showProfileRecommendations = !query && activeFilters.length === 0;

  const toggleFilter = (groupId: StackFilterKey, value: string) => {
    setSelectedFilters((current) => ({
      ...current,
      [groupId]: current[groupId].includes(value)
        ? current[groupId].filter((item) => item !== value)
        : [...current[groupId], value],
      ...(groupId === "persona" ? { subProfile: [] } : {}),
    }));
  };

  const toggleProfile = (value: string) => {
    const isActive = selectedFilters.persona.includes(value);

    setSelectedFilters((current) => {
      if (current.persona.includes(value)) {
        return removeProfileFilters(current, value);
      }

      return {
        ...current,
        persona: [...current.persona, value],
        subProfile: Array.from(new Set([...current.subProfile, ...getProfileSpecialtyValues(value)])),
      };
    });
    setOpenProfiles((current) => {
      if (isActive) return current.filter((item) => item !== value);
      return current.includes(value) ? current : [...current, value];
    });
  };

  const toggleProfileOpen = (value: string) => {
    setOpenProfiles((current) => (
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    ));
  };

  const clearFilter = (filter: { groupId: StackFilterKey; value: string }) => {
    setSelectedFilters((current) => {
      if (filter.groupId === "persona") return removeProfileFilters(current, filter.value);

      return {
        ...current,
        [filter.groupId]: current[filter.groupId].filter((item) => item !== filter.value),
      };
    });
    if (filter.groupId === "persona") {
      setOpenProfiles((current) => current.filter((item) => item !== filter.value));
    }
  };

  const clearAllFilters = () => {
    setSelectedFilters(EMPTY_STACK_FILTERS);
    setQuery("");
    setOpenProfiles([]);
  };

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
      <PageHero
        maxWidth="xl"
        breadcrumb={[{ label: t("Stacks types", "Stack templates") }]}
        eyebrow={t("Stacks types", "Stack templates")}
        icon={<Boxes className="h-3.5 w-3.5" />}
        title={t("Comparer des stacks types, pas collectionner des outils", "Compare stack templates, not tool collections")}
        description={t(
          "Chaque stack part d'un contexte concret : ce qu'il faut couvrir, le budget cible, les doublons probables et les outils à challenger.",
          "Each stack starts from a concrete context: what to cover, target budget, likely overlaps, and tools to challenge."
        )}
        actions={
          <>
            <Button asChild size="lg" className="rounded-lg">
              <Link to={`${prefix}/selector`}>
                {t("Analyser ma stack actuelle", "Analyze my current stack")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-lg">
              <a href="#stacks">{t("Voir les modèles", "View templates")}</a>
            </Button>
          </>
        }
      />

      <section id="stacks" className="scroll-mt-20 bg-background">
        <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
          <div className="grid gap-6 md:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="rounded-lg border border-border bg-card p-4 md:sticky md:top-24 md:self-start md:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    {t("Filtrer", "Filter")}
                  </p>
                </div>
                {(activeFilters.length > 0 || query) && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-semibold text-primary hover:text-primary/80"
                  >
                    {t("Effacer", "Clear")}
                  </button>
                )}
              </div>

              <div className="mt-5 space-y-6">
                <div>
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-foreground">{t("Profil", "Profile")}</p>
                  </div>
                  <div className="space-y-1.5">
                    {PERSONA_FILTER_GROUP.options.map((profile) => {
                      const active = selectedFilters.persona.includes(profile.value);
                      const open = openProfiles.includes(profile.value);
                      const profileCount = facetCounts[`persona-${profile.value}`] || 0;
                      const specialties = SUB_PROFILE_FILTER_GROUP.options.filter((specialty) => (
                        specialty.personas?.includes(profile.value as StackPersona)
                        && (specialtyCounts[`${profile.value}-${specialty.value}`] || 0) > 0
                      ));

                      return (
                        <div key={`profile-${profile.value}`} className="rounded-md">
                          <div className={`flex min-h-10 items-center rounded-md transition-colors ${
                            active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}>
                            <button
                              type="button"
                              onClick={() => toggleProfile(profile.value)}
                              aria-pressed={active}
                              className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                            >
                              <span className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${active ? "border-primary-foreground bg-primary-foreground text-primary" : "border-muted-foreground/40"}`}>
                                {active && <Check className="h-3 w-3" />}
                              </span>
                              <span className="truncate">{t(profile.label, profile.labelEn)}</span>
                            </button>
                            <span className={`mr-1 shrink-0 rounded-full px-2 py-0.5 text-xs ${active ? "bg-primary-foreground/15" : "bg-background text-muted-foreground"}`}>
                              {profileCount}
                            </span>
                            {specialties.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleProfileOpen(profile.value)}
                                aria-expanded={open}
                                aria-label={t(`Voir les spécialités ${profile.label}`, `View ${profile.labelEn} specialties`)}
                                className={`mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
                                  active ? "text-primary-foreground hover:bg-primary-foreground/10" : "text-muted-foreground hover:bg-background hover:text-foreground"
                                }`}
                              >
                                <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                              </button>
                            )}
                          </div>

                          {open && specialties.length > 0 && (
                            <div className="ml-5 mt-1 space-y-1 border-l border-border pl-2">
                              {specialties.map((specialty) => {
                                const specialtyActive = selectedFilters.subProfile.includes(specialty.value);
                                const count = specialtyCounts[`${profile.value}-${specialty.value}`] || 0;
                                return (
                                  <button
                                    key={`${profile.value}-${specialty.value}`}
                                    type="button"
                                    onClick={() => {
                                      if (!active) {
                                        setSelectedFilters((current) => ({
                                          ...current,
                                          persona: current.persona.includes(profile.value)
                                            ? current.persona
                                            : [...current.persona, profile.value],
                                          subProfile: current.subProfile.includes(specialty.value)
                                            ? current.subProfile
                                            : [...current.subProfile, specialty.value],
                                        }));
                                        return;
                                      }
                                      toggleFilter("subProfile", specialty.value);
                                    }}
                                    aria-pressed={specialtyActive}
                                    className={`flex min-h-9 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
                                      specialtyActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    }`}
                                  >
                                    <span className="flex min-w-0 items-center gap-2">
                                      <span className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${specialtyActive ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                                        {specialtyActive && <Check className="h-3 w-3" />}
                                      </span>
                                      <span className="truncate">{t(specialty.label, specialty.labelEn)}</span>
                                    </span>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${specialtyActive ? "bg-primary/10 text-primary" : "bg-background text-muted-foreground"}`}>
                                      {count}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {SECONDARY_FILTER_GROUPS.map((group) => {
                  const visibleOptions = getVisibleFilterOptions(group, selectedFilters, facetCounts);

                  if (visibleOptions.length === 0) return null;

                  return (
                    <div key={group.id}>
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-foreground">{t(group.label, group.labelEn)}</p>
                      </div>
                      <div className="space-y-1.5">
                        {visibleOptions.map((option) => {
                        const active = selectedFilters[group.id].includes(option.value);
                        const count = facetCounts[`${group.id}-${option.value}`] || 0;
                        return (
                          <button
                            key={`${group.id}-${option.value}`}
                            type="button"
                            onClick={() => toggleFilter(group.id, option.value)}
                            aria-pressed={active}
                            className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
                              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                                {active && <Check className="h-3 w-3" />}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate">{t(option.label, option.labelEn)}</span>
                              {option.description && option.descriptionEn && (
                                <span className="block truncate text-xs font-medium text-muted-foreground">
                                  {t(option.description, option.descriptionEn)}
                                </span>
                              )}
                              </span>
                            </span>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${active ? "bg-primary/10 text-primary" : "bg-background text-muted-foreground"}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>

            <div className="min-w-0">
              <div className="rounded-lg border border-border bg-card p-4 md:p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:items-center">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {filteredStacks.length} {t("stacks affichées", "stacks shown")}
                    </p>
                  </div>
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="stack-search"
                      name="stack-search"
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={t("Rechercher une stack", "Search a stack")}
                      className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm font-semibold outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                    />
                  </label>
                </div>

                {(activeFilters.length > 0 || query) && (
                  <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-border pt-4">
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="inline-flex items-center gap-2 rounded-full border border-foreground/60 bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                      >
                        {t("Recherche", "Search")} : {query}
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {activeFilters.map((filter) => (
                      <button
                        key={`${filter.groupId}-${filter.value}`}
                        type="button"
                        onClick={() => clearFilter(filter)}
                        className="inline-flex items-center gap-2 rounded-full border border-foreground/60 bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                        aria-label={t(`Retirer ${filter.label}`, `Remove ${filter.label}`)}
                      >
                        {filter.label}
                        <X className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {showProfileRecommendations && (
                <div className="mt-4 rounded-lg border border-border bg-card p-4 md:p-5">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        {t("Recommandées par profil", "Recommended by profile")}
                      </p>
                      <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground">
                        {t("Commence par la stack de ton métier", "Start with the stack for your role")}
                      </h2>
                    </div>
                    <p className="max-w-md text-sm leading-6 text-muted-foreground">
                      {t("Une base claire par profil, puis les spécialités pour affiner.", "One clear base per profile, then specialties to refine.")}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {profileRecommendedStacks.map(({ persona, stack }) => (
                      <Link
                        key={`recommended-${stack.id}`}
                        to={`${prefix}/stacks/${stack.slug}`}
                        className="group rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/35 hover:bg-primary/5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                            {t(personaLabel(persona, "fr"), personaLabel(persona, "en"))}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </div>
                        <h3 className="mt-3 text-base font-semibold leading-snug text-foreground">
                          {t(stack.title, stack.titleEn)}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {t(stack.bestFor, stack.bestForEn)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 grid gap-3">
                {filteredStacks.map((stack) => {
                  const stackTools = stack.tools.map((slot) => ({ slot, tool: toolBySlug.get(slot.slug) })).filter((item) => item.tool);
                  const isProfileRecommended = PROFILE_RECOMMENDED_STACKS.some((item) => item.slug === stack.slug);
                  return (
                    <Link
                      key={stack.id}
                      to={`${prefix}/stacks/${stack.slug}`}
                      className="group grid overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/35 hover:bg-primary/5 md:grid-cols-[9.5rem_minmax(0,1fr)]"
                    >
                      <div className="relative min-h-40 overflow-hidden bg-secondary md:min-h-full">
                        <img
                          src={STACK_VISUALS[stack.slug] || STACK_VISUALS["freelance-solo-zero-bloat"]}
                          alt={t(stack.title, stack.titleEn)}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                          loading="lazy"
                        />
                      </div>

                      <div className="grid min-w-0 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_13rem] lg:items-center">
                        <div className="min-w-0">
                          <div className="mb-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
                              {t(personaLabel(stack.persona, "fr"), personaLabel(stack.persona, "en"))}
                            </span>
                            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
                              {t(stageLabel(stack.stage, "fr"), stageLabel(stack.stage, "en"))}
                            </span>
                            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
                              {t(subProfileLabel(stack.subProfiles[0], "fr"), subProfileLabel(stack.subProfiles[0], "en"))}
                            </span>
                            <span className="rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                              {stack.tools.length} {t("outils", "tools")}
                            </span>
                            {isProfileRecommended && (
                              <span className="rounded-full border border-foreground/15 bg-foreground px-3 py-1 text-xs font-semibold text-background">
                                {t("Stack de base", "Base stack")}
                              </span>
                            )}
                          </div>

                          <h2 className="font-display text-xl font-semibold leading-tight tracking-tight text-foreground md:text-2xl">
                            {t(stack.title, stack.titleEn)}
                          </h2>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {t(stack.bestFor, stack.bestForEn)}
                          </p>
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {t(stack.risk, stack.riskEn)}
                          </p>
                        </div>

                        <div className="grid gap-4 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                              {t("Premiers outils", "First tools")}
                            </p>
                            <div className="mt-2 flex -space-x-2">
                              {stackTools.slice(0, 5).map(({ tool }) => (
                                <span
                                  key={`${stack.id}-${tool!.id}`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-background"
                                  title={tool!.name}
                                >
                                  <ToolLogo tool={tool!} size={20} className="rounded" />
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("Coût repère", "Cost range")}</p>
                              <p className="mt-1 font-semibold text-foreground">{stack.monthlyBudget}€/{t("mois", "mo")}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("Économie", "Savings")}</p>
                              <p className="mt-1 font-semibold text-foreground">{stack.savings}€/{t("mois", "mo")}</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                            {t("Voir", "View")}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {filteredStacks.length === 0 && (
                <div className="surface-card p-10 text-center">
                  <p className="font-display text-xl font-bold text-foreground">{t("Aucun stack trouvé.", "No stack found.")}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{t("Essaie un autre profil ou enlève la recherche.", "Try another profile or clear the search.")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

function getStackFilterValue(stack: StackListItem, groupId: StackFilterKey) {
  if (groupId === "subProfile") return "";
  return stack[groupId];
}

function getVisibleFilterOptions(
  group: StackFilterGroup,
  selectedFilters: SelectedStackFilters,
  facetCounts: Record<string, number>
) {
  if (group.id !== "subProfile") return group.options;

  const selectedProfiles = selectedFilters.persona;
  const hasSelectedProfile = selectedProfiles.length > 0;

  return group.options.filter((option) => {
    const count = facetCounts[`${group.id}-${option.value}`] || 0;
    const active = selectedFilters.subProfile.includes(option.value);
    if (active) return true;
    if (!hasSelectedProfile) return false;
    return count > 0 && option.personas?.some((persona) => selectedProfiles.includes(persona));
  });
}

function getProfileSpecialtyValues(profileValue: string) {
  return SUB_PROFILE_FILTER_GROUP.options
    .filter((specialty) => specialty.personas?.includes(profileValue as StackPersona))
    .map((specialty) => specialty.value);
}

function removeProfileFilters(filters: SelectedStackFilters, profileValue: string): SelectedStackFilters {
  const remainingProfiles = filters.persona.filter((item) => item !== profileValue);
  const currentProfileSpecialties = getProfileSpecialtyValues(profileValue);
  const remainingProfileSpecialties = new Set(
    remainingProfiles.flatMap((profile) => getProfileSpecialtyValues(profile))
  );

  return {
    ...filters,
    persona: remainingProfiles,
    subProfile: filters.subProfile.filter((specialtyValue) => (
      !currentProfileSpecialties.includes(specialtyValue) || remainingProfileSpecialties.has(specialtyValue)
    )),
  };
}

function isSpecialtyCoveredByCompleteProfile(specialtyValue: string, filters: SelectedStackFilters) {
  return filters.persona.some((profile) => {
    const profileSpecialties = getProfileSpecialtyValues(profile);
    return profileSpecialties.includes(specialtyValue) && profileSpecialties.every((value) => filters.subProfile.includes(value));
  });
}

function stackMatchesFilterOption(stack: StackListItem, group: StackFilterGroup, option: StackFilterOption) {
  return option.matches ? option.matches(stack) : getStackFilterValue(stack, group.id) === option.value;
}

function stackMatchesFilters(stack: StackListItem, filters: SelectedStackFilters) {
  return STACK_FILTER_GROUPS.every((group) => {
    const selected = filters[group.id];
    return selected.length === 0 || group.options.some((option) => (
      selected.includes(option.value) && stackMatchesFilterOption(stack, group, option)
    ));
  });
}

function stackMatchesQuery(stack: StackListItem, query: string) {
  if (!query) return true;
  const text = [
    stack.title,
    stack.titleEn,
    stack.subtitle,
    stack.subtitleEn,
    stack.bestFor,
    stack.bestForEn,
    stack.risk,
    stack.riskEn,
    ...stack.tools.map((slot) => `${slot.role} ${slot.roleEn} ${slot.slug}`),
  ].join(" ").toLowerCase();
  return text.includes(query);
}

function personaLabel(persona: StackPersona, locale: "fr" | "en") {
  const item = STACK_PERSONAS.find((option) => option.value === persona);
  return locale === "fr" ? item?.label || persona : item?.labelEn || persona;
}

function stageLabel(stage: StackStage, locale: "fr" | "en") {
  const item = STACK_STAGES.find((option) => option.value === stage);
  return locale === "fr" ? item?.label || stage : item?.labelEn || stage;
}

function subProfileLabel(subProfile: StackSubProfile | undefined, locale: "fr" | "en") {
  if (!subProfile) return "";
  const item = STACK_SUB_PROFILES.find((option) => option.value === subProfile);
  return locale === "fr" ? item?.label || subProfile : item?.labelEn || subProfile;
}

export default StacksPage;
