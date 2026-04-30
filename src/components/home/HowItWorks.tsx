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
    <section className="py-24 px-6 border-t border-border">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="label-section mb-4">{t("Processus", "Process")}</p>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.6rem)", fontWeight: 600, letterSpacing: "-0.022em" }}>
            {t("3 étapes. ", "3 steps. ")}
            <em className="text-primary not-italic">{t("Aucune approximation.", "No guesswork.")}</em>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
            {t(
              "Contrairement aux annuaires génériques, chaque recommandation est filtrée par votre contexte réel.",
              "Unlike generic directories, every recommendation is filtered by your real context."
            )}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="group border border-border bg-card overflow-hidden transition-colors duration-150"
                style={{ borderRadius: "2px" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.5)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ""; }}
              >
                <div className="grid md:grid-cols-[72px_1fr_1fr] items-stretch">

                  {/* Step number */}
                  <div className="hidden md:flex items-center justify-center border-r border-border/40">
                    <span
                      className="text-primary/15 group-hover:text-primary/35 transition-colors duration-200"
                      style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.03em" }}
                    >
                      {step.num}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-border/40">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-9 w-9 items-center justify-center bg-primary/10 text-primary" style={{ borderRadius: "2px" }}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="md:hidden text-xs font-semibold text-primary/40">{step.num}</span>
                    </div>
                    <h3 className="mb-3" style={{ fontSize: "1rem", fontWeight: 500, letterSpacing: "-0.012em" }}>
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {step.desc}
                    </p>

                    {step.chips && (
                      <div className="mt-5 space-y-2">
                        {step.chips.map((row) => (
                          <div key={row.label} className="flex items-center gap-2">
                            <span className="w-12 shrink-0 text-[11px]" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}>
                              {row.label}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {row.values.map((v, vi) => (
                                <span
                                  key={v}
                                  className={`border px-2 py-0.5 text-xs font-mono ${
                                    vi === 0
                                      ? "border-primary/20 bg-primary/10 text-primary"
                                      : "border-border/40 bg-secondary/50 text-muted-foreground/40"
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

                  {/* Insight */}
                  <div className="p-8 md:p-10 flex flex-col justify-center" style={{ background: "hsl(var(--secondary) / 0.4)" }}>
                    <p className="label-section mb-3 text-primary">{t("Pourquoi c'est différent", "Why it's different")}</p>
                    <p className="text-sm leading-relaxed text-foreground/80">{step.detail}</p>
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
            className="inline-flex items-center gap-2 bg-primary px-7 py-3.5 text-sm font-mono font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
            style={{ borderRadius: "2px" }}
          >
            {t("Lancer mon analyse gratuite", "Start my free analysis")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <p className="mt-3 text-xs" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}>
            {t("Gratuit · Sans inscription · Résultats en 3 minutes", "Free · No signup · Results in 3 minutes")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
