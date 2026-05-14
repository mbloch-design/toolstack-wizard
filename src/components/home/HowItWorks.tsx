import { useLang } from "@/hooks/useLang";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const HowItWorks = () => {
  const { t, prefix } = useLang();

  const steps = [
    {
      num: "01",
      title: t("Décrivez votre contexte", "Describe your context"),
      desc: t(
        "Métier, TJM, taille d'équipe, phase de projet. Ce que la plupart des outils ignorent — et qui change tout à l'analyse.",
        "Job, daily rate, team size, project phase. What most tools ignore — and what changes the entire analysis."
      ),
      proof: t(
        "ToolTrim adapte chaque recommandation à votre situation. Pas un classement générique.",
        "ToolTrim adapts every recommendation to your situation. Not a generic ranking."
      ),
      chips: [
        { label: t("Métier", "Role"), values: [t("Freelance", "Freelancer"), t("Fondateur", "Founder"), "DSI"] },
        { label: "TJM", values: ["< 300€", "300–600€", "600€+"] },
      ],
    },
    {
      num: "02",
      title: t("L'algorithme scanne outil par outil", "The algorithm scans tool by tool"),
      desc: t(
        "Chaque outil est évalué sur ses fonctions réelles, son rapport coût/usage, et sa redondance avec le reste de votre stack.",
        "Each tool is evaluated on its real functions, cost/usage ratio, and redundancy with the rest of your stack."
      ),
      proof: t(
        "Notion + Coda = doublon immédiat. L'algorithme tranche, vous n'avez qu'à valider.",
        "Notion + Coda = immediate duplicate. The algorithm decides, you just confirm."
      ),
      chips: null,
    },
    {
      num: "03",
      title: t("Recevez un plan d'action chiffré", "Get a costed action plan"),
      desc: t(
        "Quoi garder, quoi couper, quoi remplacer — avec les économies mensuelles exactes et les alternatives vérifiées.",
        "What to keep, cut, replace — with exact monthly savings and verified alternatives."
      ),
      proof: t(
        "Liste priorisée, économies par outil, score de santé de votre stack.",
        "Prioritized list, per-tool savings, stack health score."
      ),
      chips: null,
    },
  ];

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24">

        {/* Header — left-aligned like a doc */}
        <div className="mb-16 flex items-end justify-between gap-8">
          <div>
            <span className="section-tag mb-5">{t("Processus", "Process")}</span>
            <h2 className="ts-h2">
              {t("3 étapes. ", "3 steps. ")}
              <span className="text-primary">{t("Aucune approximation.", "No guesswork.")}</span>
            </h2>
          </div>
          <p
            className="hidden md:block max-w-xs text-sm leading-relaxed text-right shrink-0"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {t(
              "Contrairement aux annuaires, chaque recommandation est filtrée par votre contexte réel.",
              "Unlike directories, every recommendation is filtered by your real context."
            )}
          </p>
        </div>

        {/* Steps — open rows, no card backgrounds */}
        <div>
          {steps.map((step, i) => (
            <div
              key={i}
              className="group grid md:grid-cols-[80px_1fr_1fr] gap-0 border-t border-border py-10 transition-colors duration-150"
              style={{ borderColor: "hsl(var(--border))" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderTopColor = "hsl(var(--primary) / 0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderTopColor = "";
              }}
            >
              {/* Step number — large, decorative */}
              <div className="mb-4 md:mb-0 md:pt-0.5">
                <span
                  className="font-display select-none"
                  style={{
                    fontSize: "clamp(2rem, 4vw, 3rem)",
                    fontWeight: 500,
                    letterSpacing: "-0.04em",
                    color: "hsl(var(--foreground) / 0.08)",
                    lineHeight: 1,
                    transition: "color 200ms",
                  }}
                  ref={(el) => {
                    if (!el) return;
                    el.closest(".group")?.addEventListener("mouseenter", () => {
                      el.style.color = "hsl(var(--primary) / 0.25)";
                    });
                    el.closest(".group")?.addEventListener("mouseleave", () => {
                      el.style.color = "hsl(var(--foreground) / 0.08)";
                    });
                  }}
                >
                  {step.num}
                </span>
              </div>

              {/* Left content: title + desc + optional chips */}
              <div className="md:pr-12">
                <h3 className="ts-h3 mb-3">
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {step.desc}
                </p>

                {step.chips && (
                  <div className="mt-5 space-y-2.5">
                    {step.chips.map((row) => (
                      <div key={row.label} className="flex items-center gap-3">
                        <span
                          className="w-10 shrink-0 text-[11px]"
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            letterSpacing: "0.05em",
                            color: "hsl(var(--muted-foreground) / 0.5)",
                          }}
                        >
                          {row.label}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {row.values.map((v, vi) => (
                            <span
                              key={v}
                              className={`rounded-md border px-2.5 py-0.5 text-xs font-medium ${
                                vi === 0
                                  ? "border-primary/25 bg-primary/8 text-primary"
                                  : "border-border bg-card text-muted-foreground/50"
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

              {/* Right: proof — short, direct, no label noise */}
              <div
                className="mt-6 md:mt-0 md:pl-10 md:border-l border-border flex items-start"
              >
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: "hsl(var(--foreground) / 0.55)",
                    fontStyle: "italic",
                  }}
                >
                  {step.proof}
                </p>
              </div>
            </div>
          ))}

          {/* Last border */}
          <div className="border-t border-border" />
        </div>

        {/* CTA — inline, not centered, cohérent avec le style doc */}
        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            to={`${prefix}/selector`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
          >
            {t("Lancer mon analyse gratuite", "Start my free analysis")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <p className="ts-mono-badge uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}>
            {t("Gratuit · Sans inscription · 3 minutes", "Free · No signup · 3 minutes")}
          </p>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
