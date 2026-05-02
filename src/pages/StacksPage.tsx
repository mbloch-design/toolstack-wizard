import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Boxes, CheckCircle2, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import { STACK_PERSONAS, STACK_STAGES, STACKS, type StackPersona, type StackStage } from "@/data/stacks";

const StacksPage = () => {
  const { t, lang, prefix } = useLang();
  const { tools } = useToolSummaries();
  const [query, setQuery] = useState("");
  const [persona, setPersona] = useState<StackPersona | "all">("all");
  const [stage, setStage] = useState<StackStage | "all">("all");

  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);

  const filteredStacks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STACKS.filter((stack) => {
      const matchesPersona = persona === "all" || stack.persona === persona;
      const matchesStage = stage === "all" || stack.stage === stage;
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
  }, [persona, query, stage]);

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
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
              <Boxes className="h-3.5 w-3.5" />
              {t("Stacks types", "Stack templates")}
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
              {t("Choisis un point de départ. Coupe le reste.", "Choose a starting point. Cut the rest.")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {t(
                "Ces stacks ne sont pas des listes d'outils à copier bêtement. Ce sont des repères pour comprendre ce qui suffit, ce qui se chevauche, et ce qui mérite un diagnostic.",
                "These stacks are not tool lists to copy blindly. They are baselines to understand what is enough, what overlaps, and what deserves a diagnostic."
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-lg">
                <Link to={`${prefix}/selector`}>
                  {t("Analyser ma stack actuelle", "Analyze my current stack")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-lg">
                <a href="#stacks">{t("Voir les modèles", "View templates")}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            {[
              {
                title: t("Tu reconnais ton cas", "You recognize your case"),
                text: t("Pars du modèle le plus proche, pas du stack le plus complet.", "Start from the closest model, not the most complete stack."),
              },
              {
                title: t("Tu regardes le budget", "You check the budget"),
                text: t("Si ton setup dépasse largement le repère, il y a sûrement un doublon.", "If your setup is far above the baseline, there is probably overlap."),
              },
              {
                title: t("Tu ouvres les usages", "You open the use cases"),
                text: t("La page détail explique quand chaque outil devient vraiment utile.", "The detail page explains when each tool becomes truly useful."),
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-card p-4">
                <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Chercher un stack, un outil, un usage...", "Search a stack, tool, use case...")}
                className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </label>

            <SegmentedFilter
              icon={<Sparkles className="h-3.5 w-3.5" />}
              options={STACK_PERSONAS}
              value={persona}
              onChange={(value) => setPersona(value as StackPersona | "all")}
              lang={lang}
            />
            <SegmentedFilter
              icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
              options={STACK_STAGES}
              value={stage}
              onChange={(value) => setStage(value as StackStage | "all")}
              lang={lang}
            />
          </div>
        </div>
      </section>

      <section id="stacks" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-10 md:py-14">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("Modèles de départ", "Starting templates")}</p>
            <h2 className="mt-1 font-display text-3xl font-bold text-foreground">{t("Quel problème tu veux simplifier ?", "Which problem do you want to simplify?")}</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            {t("Ouvre un stack seulement si le contexte ressemble au tien. Sinon, le diagnostic sera plus utile qu'un modèle.", "Open a stack only if the context looks like yours. Otherwise, the diagnostic will be more useful than a model.")}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {filteredStacks.map((stack) => {
            const stackTools = stack.tools.map((slot) => ({ slot, tool: toolBySlug.get(slot.slug) })).filter((item) => item.tool);
            return (
              <article key={stack.id} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {t(personaLabel(stack.persona, "fr"), personaLabel(stack.persona, "en"))} · {t(stageLabel(stack.stage, "fr"), stageLabel(stack.stage, "en"))}
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
                      {t(stack.title, stack.titleEn)}
                    </h2>
                  </div>
                  <div className="rounded-lg border border-border bg-background px-3 py-2 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("Budget", "Budget")}</p>
                    <p className="mt-0.5 whitespace-nowrap text-sm font-bold text-foreground">
                      {stack.monthlyBudget}€/{t("mois", "mo")}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">{t(stack.subtitle, stack.subtitleEn)}</p>

                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <InfoBlock label={t("Utile si", "Useful if")} value={t(stack.bestFor, stack.bestForEn)} />
                  <div className="rounded-lg border border-primary/20 bg-primary/8 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{t("Évite", "Avoids")}</p>
                    <p className="mt-1 whitespace-nowrap text-sm font-bold text-foreground">{stack.savings}€/{t("mois", "mo")}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {stackTools.map(({ slot, tool }) => (
                    <Link
                      key={`${stack.id}-${slot.slug}`}
                      to={`${prefix}/tool/${tool!.slug}`}
                      className="group inline-flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 transition-colors hover:border-primary/35 hover:bg-primary/5"
                    >
                      <ToolLogo tool={tool!} size={24} className="rounded-md" />
                      <span className="text-sm font-medium text-foreground">{tool!.name}</span>
                      <span className="hidden text-xs text-muted-foreground sm:inline">{t(slot.role, slot.roleEn)}</span>
                    </Link>
                  ))}
                </div>

                <div className="mt-5 rounded-lg bg-background px-3 py-3 text-sm leading-6 text-muted-foreground">
                  <span className="font-semibold text-foreground">{t("N'ouvre pas si : ", "Skip if: ")}</span>
                  {t(stack.avoidIf, stack.avoidIfEn)}
                </div>

                <Button asChild variant="outline" className="mt-5 w-full rounded-lg">
                  <Link to={`${prefix}/stacks/${stack.slug}`}>
                    {t("Voir les usages concrets", "View concrete use cases")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>

        {filteredStacks.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <p className="font-display text-xl font-bold text-foreground">{t("Aucun stack trouvé.", "No stack found.")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("Essaie un autre profil ou enlève la recherche.", "Try another profile or clear the search.")}</p>
          </div>
        )}
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-[1fr_auto] md:items-center">
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

function SegmentedFilter({
  icon,
  options,
  value,
  onChange,
  lang,
}: {
  icon: ReactNode;
  options: { value: string; label: string; labelEn: string }[];
  value: string;
  onChange: (value: string) => void;
  lang: "fr" | "en";
}) {
  return (
    <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
      <span className="hidden shrink-0 px-2 text-muted-foreground sm:inline-flex">{icon}</span>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-primary/8 hover:text-foreground"
          }`}
        >
          {lang === "fr" ? option.label : option.labelEn}
        </button>
      ))}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm leading-5 text-foreground">{value}</p>
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
