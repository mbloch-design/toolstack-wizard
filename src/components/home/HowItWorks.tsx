import { useState } from "react";
import { useLang } from "@/hooks/useLang";

const HowItWorks = () => {
  const { t } = useLang();
  const [active, setActive] = useState(0);

  const steps = [
    {
      tab: t("01 · Votre profil", "01 · Your profile"),
      num: t("Étape 01 sur 03", "Step 01 of 03"),
      title: t("Posez votre contexte une fois, pour tout changer", "Set your context once, to change everything"),
      desc: t(
        "Métier, TJM, phase de projet, taille d'équipe. Ce que la plupart des outils ignorent — et qui change tout à l'analyse.",
        "Job, daily rate, project phase, team size. What most tools ignore — and what changes the entire analysis."
      ),
      insight: t(
        "ToolTrim ne vous recommande pas « les meilleurs outils ». Il vous dit quels outils sont justifiés pour votre situation spécifique.",
        "ToolTrim doesn't recommend 'the best tools'. It tells you which tools are justified for your specific situation."
      ),
      visual: (
        <div className="space-y-3">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/40">{t("Votre profil", "Your profile")}</p>
          {[
            { label: t("Métier", "Job"), chips: [t("Freelance", "Freelancer"), t("Fondateur", "Founder"), "DSI"], activeIdx: 0 },
            { label: "TJM", chips: ["< 300€", "300–600€", "600€+"], activeIdx: 1 },
            { label: "Phase", chips: [t("Lancement", "Launch"), t("Croissance", "Growth"), t("Maturité", "Maturity")], activeIdx: 1 },
            { label: t("Équipe", "Team"), chips: ["Solo", "2–5", "5–20"], activeIdx: 0 },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2.5">
              <span className="w-16 shrink-0 text-[11px] text-muted-foreground/40">{row.label}</span>
              <div className="flex flex-wrap gap-1.5">
                {row.chips.map((chip, ci) => (
                  <span
                    key={chip}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      ci === row.activeIdx
                        ? "border-primary/25 bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground/60"
                    }`}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      tab: t("02 · L'analyse", "02 · The analysis"),
      num: t("Étape 02 sur 03", "Step 02 of 03"),
      title: t("L'algorithme lit votre stack outil par outil", "The algorithm reads your stack tool by tool"),
      desc: t(
        "Chaque outil est évalué sur ses fonctions réelles, son rapport coût/usage, et sa complémentarité avec le reste de votre stack.",
        "Each tool is evaluated on its real functions, cost/usage ratio, and complementarity with your stack."
      ),
      insight: t(
        "Notion + Coda dans la même stack = signal doublon immédiat. L'algorithme garde le mieux noté, annule l'autre.",
        "Notion + Coda in the same stack = immediate duplicate signal. The algorithm keeps the better rated one, cancels the other."
      ),
      visual: (
        <div className="relative mx-auto aspect-square max-w-[260px]">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
          <div className="absolute bottom-0 left-1/2 top-0 w-px bg-border" />
          <span className="absolute left-1/2 top-1 -translate-x-1/2 text-[10px] text-muted-foreground/40">{t("Valeur élevée", "High value")}</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/40">{t("Valeur faible", "Low value")}</span>
          {/* Dots */}
          <div className="absolute left-[28%] top-[25%] h-3.5 w-3.5 rounded-full bg-keep/80" title="Figma Pro" />
          <div className="absolute left-[62%] top-[30%] h-3.5 w-3.5 rounded-full bg-keep/80" title="Notion" />
          <div className="absolute left-[68%] top-[72%] h-3.5 w-3.5 rounded-full bg-destructive/80" title="Coda" />
          <div className="absolute left-[72%] top-[68%] h-2.5 w-2.5 rounded-full bg-destructive/60" title="Loom" />
          <div className="absolute left-[35%] top-[62%] h-3 w-3 rounded-full bg-amber-500/80" title="Zapier" />
        </div>
      ),
    },
    {
      tab: t("03 · Le plan d'action", "03 · The action plan"),
      num: t("Étape 03 sur 03", "Step 03 of 03"),
      title: t("Un plan d'action, pas juste un score", "An action plan, not just a score"),
      desc: t(
        "Quoi garder, quoi couper, quoi remplacer — avec les économies mensuelles et les alternatives concrètes.",
        "What to keep, cut, replace — with monthly savings and concrete alternatives."
      ),
      insight: t(
        "Liste priorisée d'actions, économies estimées par outil, et un score de santé de votre stack.",
        "Prioritized action list, estimated savings per tool, and a stack health score."
      ),
      visual: (
        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/40">{t("Votre rapport", "Your report")}</p>
          <div className="space-y-2">
            {[
              { name: "Figma Pro", verdict: t("Garder", "Keep"), cls: "bg-keep/10 text-keep", save: "—" },
              { name: "Notion", verdict: t("Garder", "Keep"), cls: "bg-keep/10 text-keep", save: "—" },
              { name: "Coda", verdict: t("Couper", "Cut"), cls: "bg-destructive/10 text-destructive", save: "−14€/m" },
              { name: "Zapier", verdict: "→ Make", cls: "bg-amber-500/10 text-amber-500", save: "−39€/m" },
              { name: "Loom", verdict: t("Couper", "Cut"), cls: "bg-destructive/10 text-destructive", save: "−12€/m" },
            ].map((r) => (
              <div key={r.name} className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">{r.name}</span>
                <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${r.cls}`}>{r.verdict}</span>
                <span className="text-[11px] text-muted-foreground/40">{r.save}</span>
              </div>
            ))}
          </div>
          <div className="mt-3.5 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <span className="text-3xl font-extrabold tracking-[-1px] text-primary">68</span>
            <div>
              <p className="text-xs text-muted-foreground">Stack Health Score</p>
              <p className="text-[11px] text-primary">{t("+24 pts après optimisation", "+24 pts after optimization")}</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-[1100px]">
        <div className="text-center mb-16">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-primary mb-3">
            {t("Processus", "Process")}
          </p>
          <h2 className="text-[42px] font-extrabold tracking-[-2px] leading-tight">
            {t("3 étapes.", "3 steps.")}{" "}
            <span className="text-muted-foreground/25">{t("Aucune approximation.", "No guesswork.")}</span>
          </h2>
          <p className="mx-auto mt-3.5 max-w-[480px] text-[15px] leading-relaxed text-muted-foreground/60">
            {t(
              "Contrairement aux annuaires génériques, chaque recommandation est filtrée par votre contexte réel.",
              "Unlike generic directories, every recommendation is filtered by your real context."
            )}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-10 flex gap-1 rounded-xl border border-border bg-secondary/50 p-1">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all ${
                active === i
                  ? "border border-border bg-card text-foreground shadow-sm"
                  : "text-muted-foreground/40 hover:text-muted-foreground/60"
              }`}
            >
              {s.tab}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="grid items-center gap-12 md:grid-cols-2 animate-in fade-in duration-200" key={active}>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/40 mb-4">{steps[active].num}</p>
            <h3 className="text-[28px] font-bold tracking-[-1px] leading-snug">{steps[active].title}</h3>
            <p className="mt-3.5 text-sm leading-relaxed text-muted-foreground/60">{steps[active].desc}</p>
            <div className="mt-6 rounded-[10px] border border-primary/20 bg-primary/5 p-4">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-primary">
                {t("Pourquoi c'est différent", "Why it's different")}
              </p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{steps[active].insight}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            {steps[active].visual}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
