import { useEffect, useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Euro, Layers, Route, Sparkles } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import { STACK_PERSONAS, STACK_STAGES, STACKS, STACK_USES, type StackPersona, type StackStage } from "@/data/stacks";

const StackDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang, prefix } = useLang();
  const { tools } = useToolSummaries();
  const stack = STACKS.find((item) => item.slug === slug);
  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);

  useEffect(() => {
    if (!stack) return;
    const title = lang === "fr"
      ? `${stack.title} : outils, usages et budget | ToolTrim`
      : `${stack.titleEn}: tools, use cases and budget | ToolTrim`;
    const description = lang === "fr"
      ? `${stack.subtitle} Budget cible : ${stack.monthlyBudget}€/mois. Stack divisée par usages, risques et alternatives.`
      : `${stack.subtitleEn} Target budget: €${stack.monthlyBudget}/month. Stack divided by use cases, risks and alternatives.`;
    setSeoTags({ title, description, url: `${SEO_BASE}/${lang}/stacks/${stack.slug}`, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/stacks/${stack.slug}`);
    setJsonLd("stack-detail-jsonld", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      url: `${SEO_BASE}/${lang}/stacks/${stack.slug}`,
      about: stack.tools.map((slot) => toolBySlug.get(slot.slug)?.name || slot.slug),
    });
    return () => cleanupSeo(["stack-detail-jsonld"]);
  }, [lang, stack, toolBySlug]);

  if (!stack) return <Navigate to={`${prefix}/stacks`} replace />;

  const uses = STACK_USES[stack.id] || [];
  const stackTools = stack.tools.map((slot) => ({ slot, tool: toolBySlug.get(slot.slug) })).filter((item) => item.tool);

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
          <Link to={`${prefix}/stacks`} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {t("Tous les stacks", "All stacks")}
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {t(personaLabel(stack.persona, "fr"), personaLabel(stack.persona, "en"))} · {t(stageLabel(stack.stage, "fr"), stageLabel(stack.stage, "en"))}
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
                {t(stack.title, stack.titleEn)}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                {t(stack.subtitle, stack.subtitleEn)}
              </p>
              <div className="mt-6 max-w-2xl rounded-lg border border-border bg-background p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("En bref", "In short")}</p>
                <p className="mt-2 text-base leading-7 text-foreground">
                  {t(
                    "Je partirais de cette base si je devais livrer proprement sans transformer mon activité solo en mini-boîte SaaS.",
                    "I would start from this baseline if I had to deliver cleanly without turning my solo business into a mini SaaS company."
                  )}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t(
                    "Ce n'est pas une recette universelle. C'est un repère pour sentir quand ton stack devient plus lourd que ton vrai besoin.",
                    "It is not a universal recipe. It is a baseline to feel when your stack becomes heavier than your real need."
                  )}
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-lg">
                  <Link to={`${prefix}/selector`}>
                    {t("Adapter à mon cas", "Adapt to my case")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-lg">
                  <a href="#utilisations">{t("Voir les utilisations", "See use cases")}</a>
                </Button>
              </div>
            </div>

            <aside className="rounded-lg border border-border bg-background p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Repère rapide", "Quick baseline")}</p>
              <div className="mt-4 grid gap-3">
                <Metric icon={<Euro className="h-4 w-4" />} label={t("Budget raisonnable", "Reasonable budget")} value={`${stack.monthlyBudget}€/mois`} />
                <Metric icon={<Sparkles className="h-4 w-4" />} label={t("Si tu dépasses largement", "If you go way above")} value={`+${stack.savings}€/mois`} />
                <Metric icon={<Layers className="h-4 w-4" />} label={t("Outils clés", "Core tools")} value={`${stack.tools.length}`} />
              </div>
              <div className="mt-5 rounded-lg bg-primary/8 p-4 text-sm leading-6 text-muted-foreground">
                <span className="font-semibold text-foreground">{t("Le piège classique : ", "The classic trap: ")}</span>
                {t(stack.risk, stack.riskEn)}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="mb-8 grid gap-3 md:grid-cols-3">
          {[
            {
              title: t("Est-ce que ça remplace une vraie friction ?", "Does it remove real friction?"),
              text: t("Un outil se justifie s'il enlève un blocage que tu rencontres chaque semaine.", "A tool is justified if it removes a blocker you meet every week."),
            },
            {
              title: t("Est-ce que le client comprend le flux ?", "Can the client understand the flow?"),
              text: t("Si tu dois expliquer ton système pendant 20 minutes, il est probablement trop lourd.", "If you need 20 minutes to explain your system, it is probably too heavy."),
            },
            {
              title: t("Est-ce que tu paies déjà l'équivalent ailleurs ?", "Are you already paying for the same thing?"),
              text: t("Le gaspillage commence souvent avec deux outils qui se ressemblent assez pour te rassurer.", "Waste often starts with two tools similar enough to reassure you."),
            },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-semibold leading-5 text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="h-fit rounded-lg border border-border bg-card p-5 lg:sticky lg:top-20">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("La base", "The baseline")}</p>
            <div className="mt-4 space-y-2">
              {stackTools.map(({ slot, tool }) => (
                <Link
                  key={slot.slug}
                  to={`${prefix}/tool/${tool!.slug}`}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-3 transition-colors hover:border-primary/35 hover:bg-primary/5"
                >
                  <ToolLogo tool={tool!} size={34} className="rounded-md" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{tool!.name}</p>
                    <p className="text-xs text-muted-foreground">{t(slot.role, slot.roleEn)}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-background p-3 text-sm leading-6 text-muted-foreground">
              {t(
                "Si un outil de cette liste ne sert pas au moins une fois par semaine, il n'est peut-être pas encore nécessaire.",
                "If one tool in this list is not used at least once a week, it may not be necessary yet."
              )}
            </div>
          </aside>

          <div className="space-y-10">
            <section id="utilisations" className="scroll-mt-24">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Route className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("Utilisations", "Use cases")}</p>
                  <h2 className="font-display text-3xl font-bold text-foreground">
                    {t("Dans la vraie vie, cette stack sert à ça", "In real life, this stack is for this")}
                  </h2>
                </div>
              </div>

              <div className="space-y-5">
                {uses.map((use, index) => {
                  const useTools = use.toolSlugs.map((toolSlug) => toolBySlug.get(toolSlug)).filter(Boolean);
                  return (
                    <article key={use.title} className="overflow-hidden rounded-lg border border-border bg-card">
                      <div className="border-b border-border bg-background/55 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                            {t("Scénario", "Scenario")} {index + 1 < 10 ? `0${index + 1}` : index + 1}
                          </p>
                          <h3 className="mt-1 font-display text-2xl font-bold text-foreground">
                            {t(use.title, use.titleEn)}
                          </h3>
                        </div>
                        <div className="flex -space-x-2">
                          {useTools.map((tool) => (
                            <ToolLogo key={tool!.id} tool={tool!} size={34} className="rounded-md border-2 border-card bg-background" />
                          ))}
                        </div>
                      </div>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                          {t(use.description, use.descriptionEn)}
                        </p>
                      </div>

                      <div className="grid gap-5 p-5 md:grid-cols-[220px_1fr]">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("Outils mobilisés", "Tools involved")}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                        {useTools.map((tool) => (
                          <Link
                            key={tool!.id}
                            to={`${prefix}/tool/${tool!.slug}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/35 hover:bg-primary/5"
                          >
                            <ToolLogo tool={tool!} size={22} className="rounded" />
                            {tool!.name}
                          </Link>
                        ))}
                          </div>
                        </div>
                        <div className="rounded-lg bg-background p-4">
                          <p className="text-sm font-medium leading-7 text-foreground">
                            {t("Le déroulé que je garderais simple :", "The flow I would keep simple:")}
                          </p>
                          <ol className="mt-3 grid gap-3">
                            {(lang === "fr" ? use.workflow : use.workflowEn).map((step, stepIndex) => (
                              <li key={step} className="grid grid-cols-[24px_1fr] gap-3 text-sm leading-6 text-muted-foreground">
                                <span className="font-mono text-xs font-bold text-primary">
                                  {String(stepIndex + 1).padStart(2, "0")}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("Mon avis", "My take")}</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-background p-4">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-semibold text-foreground">{t("Ça vaut le coup si", "It is worth it if")}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(stack.bestFor, stack.bestForEn)}</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <h3 className="mt-3 font-semibold text-foreground">{t("Je ne le copierais pas si", "I would not copy it if")}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(stack.avoidIf, stack.avoidIfEn)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-primary/20 bg-primary/8 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("Diagnostic", "Diagnostic")}</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-foreground">
                {t("Le bon choix dépend toujours de ce que tu utilises déjà.", "The right choice always depends on what you already use.")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t(
                  "Si tu as déjà une partie de cette stack, le sujet n'est pas de tout remplacer. Le sujet, c'est de voir ce qui se recoupe, ce qui dort, et ce qui mérite vraiment sa place.",
                  "If you already have part of this stack, the point is not to replace everything. The point is to see what overlaps, what sleeps, and what truly deserves a seat."
                )}
              </p>
              <Button asChild className="mt-5 rounded-lg">
                <Link to={`${prefix}/selector`}>
                  {t("Analyser ma stack", "Analyze my stack")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-semibold text-foreground">{value}</span>
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

export default StackDetailPage;
