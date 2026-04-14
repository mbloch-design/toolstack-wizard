import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { ArrowRight, User, ScanSearch, FileCheck } from "lucide-react";

const HowItWorks = () => {
  const { t, prefix } = useLang();

  const steps = [
    {
      num: "01",
      icon: User,
      title: t("Décrivez votre contexte", "Describe your context"),
      desc: t(
        "Métier, TJM, phase de projet, taille d'équipe. Ce que la plupart des outils ignorent — et qui change tout à l'analyse.",
        "Job, daily rate, project phase, team size. What most tools ignore — and what changes the entire analysis."
      ),
      detail: t(
        "ToolTrim ne vous recommande pas « les meilleurs outils ». Il vous dit quels outils sont justifiés pour votre situation spécifique.",
        "ToolTrim doesn't recommend 'the best tools'. It tells you which tools are justified for your specific situation."
      ),
      chips: [
        { label: t("Métier", "Job"), values: [t("Freelance", "Freelancer"), t("Fondateur", "Founder"), "DSI"] },
        { label: "TJM", values: ["< 300€", "300–600€", "600€+"] },
      ],
    },
    {
      num: "02",
      icon: ScanSearch,
      title: t("L'algorithme analyse outil par outil", "The algorithm analyzes tool by tool"),
      desc: t(
        "Chaque outil est évalué sur ses fonctions réelles, son rapport coût/usage, et sa complémentarité avec le reste de votre stack.",
        "Each tool is evaluated on its real functions, cost/usage ratio, and complementarity with your stack."
      ),
      detail: t(
        "Notion + Coda dans la même stack = signal doublon immédiat. L'algorithme garde le mieux noté, annule l'autre.",
        "Notion + Coda in the same stack = immediate duplicate signal. The algorithm keeps the better rated one, cancels the other."
      ),
      chips: null,
    },
    {
      num: "03",
      icon: FileCheck,
      title: t("Recevez un plan d'action", "Get your action plan"),
      desc: t(
        "Quoi garder, quoi couper, quoi remplacer — avec les économies mensuelles et les alternatives concrètes.",
        "What to keep, cut, replace — with monthly savings and concrete alternatives."
      ),
      detail: t(
        "Liste priorisée d'actions, économies estimées par outil, et un score de santé de votre stack.",
        "Prioritized action list, estimated savings per tool, and a stack health score."
      ),
      chips: null,
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-5">
            {t("Processus", "Process")}
          </span>
          <h2 className="text-4xl font-extrabold tracking-[-1.5px] md:text-[44px]">
            {t("3 étapes. ", "3 steps. ")}<em className="text-primary italic">{t("Aucune approximation.", "No guesswork.")}</em>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground leading-relaxed">
            {t(
              "Contrairement aux annuaires génériques, chaque recommandation est filtrée par votre contexte réel.",
              "Unlike generic directories, every recommendation is filtered by your real context."
            )}
          </p>
        </div>

        {/* Steps — vertical flow, Elevo-inspired */}
        <div className="space-y-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="group rounded-2xl border border-border bg-card transition-all hover:border-primary/20 hover:shadow-sm"
              >
                <div className="grid md:grid-cols-[80px_1fr_1fr] items-stretch">
                  {/* Step number */}
                  <div className="hidden md:flex items-center justify-center border-r border-border">
                    <span className="text-3xl font-extrabold tracking-[-2px] text-primary/20 group-hover:text-primary/40 transition-colors">
                      {step.num}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="md:hidden text-sm font-bold text-primary/40">{step.num}</span>
                    </div>
                    <h3 className="text-xl font-bold tracking-[-0.5px] mb-3">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>

                    {/* Chips preview for step 1 */}
                    {step.chips && (
                      <div className="mt-5 space-y-2.5">
                        {step.chips.map((row) => (
                          <div key={row.label} className="flex items-center gap-2">
                            <span className="w-12 shrink-0 text-[11px] text-muted-foreground/50">{row.label}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {row.values.map((v, vi) => (
                                <span
                                  key={v}
                                  className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                                    vi === 0
                                      ? "border-primary/20 bg-primary/10 text-primary"
                                      : "border-border bg-secondary text-muted-foreground/50"
                                  }`}
                                >
                                  {v}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Insight panel */}
                  <div className="p-8 md:p-10 bg-secondary/30 flex flex-col justify-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary mb-3">
                      {t("Pourquoi c'est différent", "Why it's different")}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            to={`${prefix}/selector`}
            className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
          >
            {t("Lancer mon analyse gratuite", "Start my free analysis")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("Gratuit · Sans inscription · Résultats en 3 minutes", "Free · No signup · Results in 3 minutes")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
