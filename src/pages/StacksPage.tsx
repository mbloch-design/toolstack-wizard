import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Boxes, Check, ChevronDown, Search, Sparkles, X } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import { STACK_PERSONAS, STACK_STAGES, STACKS, type StackPersona, type StackStage } from "@/data/stacks";

const STACK_VISUALS: Record<string, string> = {
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

const STACK_PERSONA_FILTERS: { value: StackPersona | "all"; label: string; labelEn: string }[] = [
  { value: "all", label: "Tous les profils", labelEn: "All profiles" },
  { value: "dev", label: "Livrer un site / une app", labelEn: "Ship a site / app" },
  { value: "designer", label: "Vendre du design", labelEn: "Sell design" },
  { value: "consultant", label: "Vendre du conseil", labelEn: "Sell consulting" },
  { value: "content", label: "Produire du contenu", labelEn: "Produce content" },
  { value: "ops", label: "Structurer l'ops", labelEn: "Structure ops" },
  { value: "solo", label: "Démarrer solo", labelEn: "Start solo" },
];

const STACK_STAGE_FILTERS: { value: StackStage | "all"; label: string; labelEn: string }[] = [
  { value: "all", label: "Tous les moments", labelEn: "All stages" },
  { value: "starter", label: "Je démarre", labelEn: "I'm starting" },
  { value: "lean", label: "Je veux alléger", labelEn: "I want to simplify" },
  { value: "scale", label: "Je structure", labelEn: "I'm structuring" },
];

const StacksPage = () => {
  const { t, lang, prefix } = useLang();
  const { tools } = useToolSummaries();
  const [query, setQuery] = useState("");
  const [selectedPersonas, setSelectedPersonas] = useState<StackPersona[]>([]);
  const [selectedStages, setSelectedStages] = useState<StackStage[]>([]);
  const [openFilter, setOpenFilter] = useState<"persona" | "stage" | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);

  const filteredStacks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STACKS.filter((stack) => {
      const matchesPersona = selectedPersonas.length === 0 || selectedPersonas.includes(stack.persona);
      const matchesStage = selectedStages.length === 0 || selectedStages.includes(stack.stage);
      const text = [
        stack.title,
        stack.titleEn,
        stack.subtitle,
        stack.subtitleEn,
        stack.bestFor,
        stack.bestForEn,
        ...stack.tools.map((slot) => `${slot.role} ${slot.roleEn} ${slot.slug}`),
      ].join(" ").toLowerCase();
      return matchesPersona && matchesStage && (!q || text.includes(q));
    });
  }, [query, selectedPersonas, selectedStages]);

  const personaOptions = STACK_PERSONA_FILTERS.filter((option): option is { value: StackPersona; label: string; labelEn: string } => option.value !== "all");
  const stageOptions = STACK_STAGE_FILTERS.filter((option): option is { value: StackStage; label: string; labelEn: string } => option.value !== "all");
  const activeFilters = [
    ...selectedPersonas.map((value) => ({
      type: "persona" as const,
      value,
      label: lang === "fr" ? personaOptions.find((option) => option.value === value)?.label || value : personaOptions.find((option) => option.value === value)?.labelEn || value,
    })),
    ...selectedStages.map((value) => ({
      type: "stage" as const,
      value,
      label: lang === "fr" ? stageOptions.find((option) => option.value === value)?.label || value : stageOptions.find((option) => option.value === value)?.labelEn || value,
    })),
  ];

  const togglePersona = (value: StackPersona) => {
    setSelectedPersonas((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const toggleStage = (value: StackStage) => {
    setSelectedStages((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const clearFilter = (filter: { type: "persona" | "stage"; value: StackPersona | StackStage }) => {
    if (filter.type === "persona") {
      setSelectedPersonas((current) => current.filter((item) => item !== filter.value));
      return;
    }
    setSelectedStages((current) => current.filter((item) => item !== filter.value));
  };

  const clearAllFilters = () => {
    setSelectedPersonas([]);
    setSelectedStages([]);
    setQuery("");
    setOpenFilter(null);
  };

  useEffect(() => {
    if (!openFilter) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenFilter(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openFilter]);

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
        title={t("La stack qu'il te faut, pas celle que tu imagines avoir besoin.", "The stack you need, not the one you think you need.")}
        description={t(
          "Des modèles concrets pour vendre, livrer, produire ou automatiser — sans acheter la stack de quelqu'un d'autre par réflexe.",
          "Practical templates to sell, ship, produce, or automate — without buying someone else's stack out of habit."
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
          <h2 className="max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            {t("Cherche par profil, moment ou outil — et pars avec quelque chose de concret.", "Filter by profile, stage, or tool — and leave with something concrete.")}
          </h2>

          <div ref={filterRef} className="relative z-10 mt-7 flex flex-wrap items-start gap-x-8 gap-y-4">
            <DropdownFilter
              label={t("Objectif", "Goal")}
              isOpen={openFilter === "persona"}
              onToggle={() => setOpenFilter(openFilter === "persona" ? null : "persona")}
              onClose={() => setOpenFilter(null)}
              applyLabel={t("Appliquer", "Apply")}
              options={personaOptions}
              selectedValues={selectedPersonas}
              onToggleValue={togglePersona}
              lang={lang}
            />
            <DropdownFilter
              label={t("Moment", "Stage")}
              isOpen={openFilter === "stage"}
              onToggle={() => setOpenFilter(openFilter === "stage" ? null : "stage")}
              onClose={() => setOpenFilter(null)}
              applyLabel={t("Appliquer", "Apply")}
              options={stageOptions}
              selectedValues={selectedStages}
              onToggleValue={toggleStage}
              lang={lang}
            />
            <label className="relative block min-w-[16rem] flex-1 md:max-w-sm">
              <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Rechercher une stack", "Search a stack")}
                className="h-10 w-full border-0 border-b border-border bg-transparent pl-7 pr-3 text-base font-semibold outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </label>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            {activeFilters.map((filter) => (
              <button
                key={`${filter.type}-${filter.value}`}
                type="button"
                onClick={() => clearFilter(filter)}
                className="inline-flex items-center gap-2 rounded-full border border-foreground/60 bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                aria-label={t(`Retirer ${filter.label}`, `Remove ${filter.label}`)}
              >
                {filter.label}
                <X className="h-4 w-4" />
              </button>
            ))}
            {(activeFilters.length > 0 || query) && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center rounded-full border border-foreground/60 bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                {t("Tout effacer", "Clear all")}
              </button>
            )}
            <span className="px-2 text-sm font-semibold text-muted-foreground">
              {filteredStacks.length} {t("résultats", "results")}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="grid gap-6 lg:grid-cols-3">
          {filteredStacks.map((stack) => {
            const stackTools = stack.tools.map((slot) => ({ slot, tool: toolBySlug.get(slot.slug) })).filter((item) => item.tool);
            return (
              <Link
                key={stack.id}
                to={`${prefix}/stacks/${stack.slug}`}
                className="group flex min-h-[38rem] flex-col rounded-lg bg-secondary/70 p-4 transition-colors hover:bg-secondary md:p-5"
              >
                <div className="relative overflow-hidden rounded-md bg-background/70">
                  <img
                    src={STACK_VISUALS[stack.slug] || STACK_VISUALS["freelance-solo-zero-bloat"]}
                    alt={t(stack.title, stack.titleEn)}
                    className="aspect-[1.18/1] w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                    loading="lazy"
                  />
                  <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {t(personaLabel(stack.persona, "fr"), personaLabel(stack.persona, "en"))}
                  </div>
                  <div className="absolute bottom-3 right-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
                    {stack.monthlyBudget}€/{t("mois", "mo")}
                  </div>
                </div>

                <div className="flex flex-1 flex-col pt-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {t(stageLabel(stack.stage, "fr"), stageLabel(stack.stage, "en"))}
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-[2rem]">
                    {t(stack.title, stack.titleEn)}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    {t(stack.subtitle, stack.subtitleEn)}
                  </p>

                  <div className="mt-6 border-t border-border/70 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {t("Stack recommandée", "Recommended stack")}
                    </p>
                    <div className="mt-3 flex -space-x-2">
                      {stackTools.slice(0, 5).map(({ tool }) => (
                        <span
                          key={`${stack.id}-${tool!.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-secondary bg-background"
                          title={tool!.name}
                        >
                          <ToolLogo tool={tool!} size={22} className="rounded" />
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-4 pt-8">
                    <span className="text-sm font-semibold text-foreground">
                      {t("Économie repère", "Savings baseline")} · {stack.savings}€/{t("mois", "mo")}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary">
                      {t("Voir la stack", "View stack")}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredStacks.length > 0 && (
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                title: t("Reconnais ton cas", "Recognize your case"),
                text: t("Pars du modèle le plus proche, pas du plus complet.", "Start from the closest model, not the most complete one."),
              },
              {
                title: t("Regarde le coût", "Check the cost"),
                text: t("Si ton setup dépasse largement le repère, il y a probablement un doublon.", "If your setup is far above the baseline, there is probably overlap."),
              },
              {
                title: t("Ouvre les usages", "Open the use cases"),
                text: t("La page détail explique quand chaque outil devient réellement utile.", "The detail page explains when each tool becomes genuinely useful."),
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg bg-card p-5">
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        )}
        {filteredStacks.length === 0 && (
          <div className="surface-card p-10 text-center">
            <p className="font-display text-xl font-bold text-foreground">{t("Aucun stack trouvé.", "No stack found.")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("Essaie un autre profil ou enlève la recherche.", "Try another profile or clear the search.")}</p>
          </div>
        )}
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {t("Le bon stack dépend du contexte", "The right stack depends on context")}
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-foreground">
              {t("Tu veux le stack adapté à ton vrai usage ?", "Want the stack that fits your real usage?")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t(
                "Le diagnostic reprend cette logique, mais avec tes outils actuels, ton TJM, tes doublons et tes arbitrages concrets.",
                "The diagnostic uses this logic with your current tools, day rate, duplicates, and concrete trade-offs."
              )}
            </p>
          </div>
          <Button asChild size="lg" className="rounded-lg">
            <Link to={`${prefix}/selector`}>
              {t("Lancer le diagnostic", "Start diagnostic")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

function DropdownFilter<T extends string>({
  label,
  isOpen,
  onToggle,
  onClose,
  applyLabel,
  options,
  selectedValues,
  onToggleValue,
  lang,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  applyLabel: string;
  options: { value: T; label: string; labelEn: string }[];
  selectedValues: T[];
  onToggleValue: (value: T) => void;
  lang: "fr" | "en";
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex min-h-10 items-center gap-3 border-b border-muted-foreground/40 pb-1.5 text-xl font-semibold tracking-tight text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 md:text-2xl"
        aria-expanded={isOpen}
      >
        {label}
        <ChevronDown className={`h-5 w-5 transition-transform md:h-6 md:w-6 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-3 w-[min(24rem,calc(100vw-3rem))] rounded-lg bg-background/95 p-1 shadow-xl ring-1 ring-border backdrop-blur">
          <div className="rounded-md bg-background">
            <div className="max-h-[19rem] space-y-1 overflow-y-auto p-4">
              {options.map((option) => {
                const selected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onToggleValue(option.value)}
                    className="flex w-full items-center gap-3 rounded-md px-1 py-2 text-left text-base font-semibold tracking-tight text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 md:text-lg"
                  >
                    <span
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        selected ? "border-foreground bg-foreground text-background" : "border-foreground bg-background text-transparent"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </span>
                    {lang === "fr" ? option.label : option.labelEn}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border p-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                {applyLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function personaLabel(persona: StackPersona, locale: "fr" | "en") {
  const item = STACK_PERSONAS.find((option) => option.value === persona);
  return locale === "fr" ? item?.label || persona : item?.labelEn || persona;
}

function stageLabel(stage: StackStage, locale: "fr" | "en") {
  const item = STACK_STAGES.find((option) => option.value === stage);
  return locale === "fr" ? item?.label || stage : item?.labelEn || stage;
}

export default StacksPage;
