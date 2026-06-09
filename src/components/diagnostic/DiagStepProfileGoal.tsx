import { useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Code2, Compass, Gauge, Palette, PenLine, Scissors, Sparkles, Workflow } from "lucide-react";
import type { Persona, SessionState, Tool } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  onPrev: () => void;
  t: (fr: string, en: string) => string;
}

type PersonaMeta = {
  id: Persona;
  Icon: typeof Code2;
  labelFr: string;
  labelEn: string;
  hintFr: string;
  hintEn: string;
};

const PERSONAS: PersonaMeta[] = [
  { id: "THEO", Icon: Code2, labelFr: "Tech / Dev", labelEn: "Tech / Dev", hintFr: "produit, code, infra", hintEn: "product, code, infra" },
  { id: "SOFIA", Icon: Palette, labelFr: "Créatif", labelEn: "Creative", hintFr: "design, vidéo, marque", hintEn: "design, video, brand" },
  { id: "MARC", Icon: BriefcaseBusiness, labelFr: "Conseil", labelEn: "Consulting", hintFr: "clients, vente, livrables", hintEn: "clients, sales, delivery" },
  { id: "ALIX", Icon: PenLine, labelFr: "Content", labelEn: "Content", hintFr: "contenu, audience, newsletter", hintEn: "content, audience, newsletter" },
  { id: "CLAIRE", Icon: Workflow, labelFr: "Ops / Business", labelEn: "Ops / Business", hintFr: "process, finance, pilotage", hintEn: "process, finance, operations" },
];

const GOALS: Array<{
  value: NonNullable<SessionState["stackGoal"]>;
  Icon: typeof Scissors;
  fr: string;
  en: string;
}> = [
  { value: "reduce_costs", Icon: Scissors, fr: "Réduire les coûts", en: "Reduce costs" },
  { value: "simplify", Icon: Compass, fr: "Simplifier", en: "Simplify" },
  { value: "save_time", Icon: Gauge, fr: "Gagner du temps", en: "Save time" },
  { value: "quality", Icon: Sparkles, fr: "Mieux choisir", en: "Choose better" },
];

const TJM_OPTIONS = [
  { label: tLabel("< 300€", "< 300€"), value: 250 },
  { label: tLabel("300€ - 500€", "300€ - 500€"), value: 400 },
  { label: tLabel("500€ - 800€", "500€ - 800€"), value: 650 },
  { label: tLabel("800€ - 1 200€", "800€ - 1,200€"), value: 1000 },
  { label: tLabel("> 1 200€", "> 1,200€"), value: 1500 },
] as const;

function tLabel(fr: string, en: string) {
  return { fr, en };
}

function inferPersona(tools: Tool[]) {
  const scores = new Map<Persona, number>();
  PERSONAS.forEach((persona) => scores.set(persona.id, 0));

  tools.forEach((tool) => {
    PERSONAS.forEach((persona) => {
      const explicit = tool.pertinence_by_persona?.[persona.id] || 0;
      const categoryBoost =
        persona.id === "THEO" && /dev|deploy|code|automation|ai/i.test(tool.category) ? 18 :
        persona.id === "SOFIA" && /design|video|creation|asset/i.test(tool.category) ? 18 :
        persona.id === "MARC" && /crm|sales|client|proposal/i.test(tool.category) ? 18 :
        persona.id === "ALIX" && /content|newsletter|social|creation/i.test(tool.category) ? 18 :
        persona.id === "CLAIRE" && /finance|project|ops|organization/i.test(tool.category) ? 18 :
        0;
      scores.set(persona.id, (scores.get(persona.id) || 0) + explicit + categoryBoost);
    });
  });

  const ranked = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
  const [primary, primaryScore] = ranked[0] || ["THEO", 0];
  const [, secondaryScore] = ranked[1] || ["SOFIA", 0];
  const gap = primaryScore - secondaryScore;
  const confidence: NonNullable<SessionState["personaConfidence"]> =
    tools.length < 3 || gap < 70 ? "hybrid" : "clear";

  return { persona: primary as Persona, confidence, ranked };
}

export default function DiagStepProfileGoal({ session, onUpdate, onNext, onPrev, t }: Props) {
  const inferred = useMemo(() => inferPersona(session.selectedTools), [session.selectedTools]);
  const [firstName, setFirstName] = useState(session.firstName || "");
  const [persona, setPersona] = useState<Persona>(session.persona || inferred.persona);
  const [stackGoal, setStackGoal] = useState<NonNullable<SessionState["stackGoal"]>>(session.stackGoal || "reduce_costs");
  const [tjm, setTjm] = useState<number>(session.tjm || 0);

  const inferredMeta = PERSONAS.find((item) => item.id === inferred.persona) || PERSONAS[0];
  const selectedMeta = PERSONAS.find((item) => item.id === persona) || inferredMeta;

  const handleNext = () => {
    const complementarySkills = inferred.ranked
      .filter(([id]) => id !== persona)
      .slice(0, inferred.confidence === "hybrid" ? 1 : 0)
      .map(([id]) => id as Persona);

    onUpdate({
      firstName: firstName.trim(),
      persona,
      personaConfidence: persona === inferred.persona ? inferred.confidence : "hybrid",
      stackGoal,
      tjm,
      complementarySkills,
    });
    onNext();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:items-end">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {t("Je pense avoir compris ton contexte.", "I think I understand your context.")}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            {t(
              "On confirme l'angle de lecture avant de calculer. Tu peux corriger en un clic.",
              "Let's confirm the lens before calculating. You can correct it in one click."
            )}
          </p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase text-primary">
            {t("Profil détecté", "Detected profile")}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <inferredMeta.Icon className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold text-foreground">{t(inferredMeta.labelFr, inferredMeta.labelEn)}</p>
              <p className="text-xs text-muted-foreground">
                {inferred.confidence === "clear"
                  ? t("Signal assez clair", "Fairly clear signal")
                  : t("Profil probablement hybride", "Probably a hybrid profile")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-5">
        {PERSONAS.map((item) => {
          const Icon = item.Icon;
          const selected = item.id === persona;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPersona(item.id)}
              className={`min-h-[132px] rounded-xl border p-4 text-left transition-colors ${
                selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <Icon className={`h-5 w-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
              <p className="mt-3 text-sm font-semibold text-foreground">{t(item.labelFr, item.labelEn)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t(item.hintFr, item.hintEn)}</p>
            </button>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">{t("Ton objectif principal", "Your main goal")}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {GOALS.map((goal) => {
              const Icon = goal.Icon;
              const selected = goal.value === stackGoal;
              return (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => setStackGoal(goal.value)}
                  className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 text-left text-sm font-medium transition-colors ${
                    selected ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(goal.fr, goal.en)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">{t("Affiner le calcul", "Refine the calculation")}</p>
          <div className="mt-3 grid gap-2">
            <input
              id="diagnostic-first-name-compact"
              name="first-name"
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder={t("Prénom, optionnel", "First name, optional")}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="grid grid-cols-2 gap-2">
              {TJM_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTjm(option.value)}
                  className={`h-9 rounded-md border px-2 text-xs font-medium ${
                    tjm === option.value ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground"
                  }`}
                >
                  {t(option.label.fr, option.label.en)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTjm(0)}
                className={`h-9 rounded-md border px-2 text-xs font-medium ${
                  tjm === 0 ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground"
                }`}
              >
                {t("Pas utile", "Not needed")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="h-11 rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-muted"
        >
          {t("Retour à la stack", "Back to stack")}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground"
        >
          {t(`Analyser comme ${t(selectedMeta.labelFr, selectedMeta.labelEn)}`, `Analyze as ${t(selectedMeta.labelFr, selectedMeta.labelEn)}`)}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
