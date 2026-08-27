import { useState } from "react";
import type { SessionState, Persona } from "@/types/diagnostic";
import { BriefcaseBusiness, Code2, Compass, Gauge, Palette, PenLine, Scissors, Sparkles, Workflow } from "@/lib/icons";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  t: (fr: string, en: string) => string;
}

type PersonaChoice = {
  id: Persona;
  Icon: typeof Code2;
  label: string;
  labelEn: string;
  desc: string;
  descEn: string;
  signalsFr: string[];
  signalsEn: string[];
};

const PERSONAS: PersonaChoice[] = [
  {
    id: "THEO",
    Icon: Code2,
    label: "Tech / Dev",
    labelEn: "Tech / Dev",
    desc: "Produit, code, infra, automatisation.",
    descEn: "Product, code, infra, automation.",
    signalsFr: ["API", "déploiement", "analytics"],
    signalsEn: ["API", "deploy", "analytics"],
  },
  {
    id: "SOFIA",
    Icon: Palette,
    label: "Créatif",
    labelEn: "Creative",
    desc: "Design, photo, vidéo, brand, motion.",
    descEn: "Design, photo, video, brand, motion.",
    signalsFr: ["assets", "design", "production"],
    signalsEn: ["assets", "design", "production"],
  },
  {
    id: "MARC",
    Icon: BriefcaseBusiness,
    label: "Conseil",
    labelEn: "Consulting",
    desc: "Clients, vente, livrables, reporting.",
    descEn: "Clients, sales, delivery, reporting.",
    signalsFr: ["CRM", "propositions", "suivi"],
    signalsEn: ["CRM", "proposals", "follow-up"],
  },
  {
    id: "ALIX",
    Icon: PenLine,
    label: "Content / Créateur",
    labelEn: "Content / Creator",
    desc: "Contenu, audience, newsletter, podcast.",
    descEn: "Content, audience, newsletter, podcast.",
    signalsFr: ["publication", "audience", "monétisation"],
    signalsEn: ["publishing", "audience", "monetization"],
  },
  {
    id: "CLAIRE",
    Icon: Workflow,
    label: "Ops / Business",
    labelEn: "Ops / Business",
    desc: "Process, finance, équipe, transmission.",
    descEn: "Process, finance, team, handoff.",
    signalsFr: ["process", "finance", "pilotage"],
    signalsEn: ["process", "finance", "ops"],
  },
];

const CONFIDENCE_OPTIONS: Array<{
  value: NonNullable<SessionState["personaConfidence"]>;
  fr: string;
  en: string;
}> = [
  { value: "clear", fr: "C'est clairement moi", en: "Clearly me" },
  { value: "hybrid", fr: "Je suis hybride", en: "I'm hybrid" },
  { value: "unsure", fr: "J'hésite encore", en: "Still unsure" },
];

const GOAL_OPTIONS: Array<{
  value: NonNullable<SessionState["stackGoal"]>;
  Icon: typeof Scissors;
  fr: string;
  en: string;
}> = [
  { value: "reduce_costs", Icon: Scissors, fr: "Réduire les coûts", en: "Reduce costs" },
  { value: "save_time", Icon: Gauge, fr: "Gagner du temps", en: "Save time" },
  { value: "simplify", Icon: Compass, fr: "Simplifier", en: "Simplify" },
  { value: "quality", Icon: Sparkles, fr: "Mieux choisir", en: "Choose better" },
];

export default function DiagStep2Persona({ session, onUpdate, onNext, t }: Props) {
  const [selected, setSelected] = useState<Persona | null>(session.persona || null);
  const [personaConfidence, setPersonaConfidence] = useState<NonNullable<SessionState["personaConfidence"]>>(
    session.personaConfidence || "clear"
  );
  const [stackGoal, setStackGoal] = useState<NonNullable<SessionState["stackGoal"]>>(
    session.stackGoal || "reduce_costs"
  );

  const handleSubmit = () => {
    if (!selected) return;
    onUpdate({ persona: selected, personaConfidence, stackGoal });
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-7 text-center">
      <div className="space-y-2 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {t("Tu te reconnais le plus dans…", "Which best describes you?")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            "Choisis ton angle principal. Si tu es entre deux profils, on le capte juste après.",
            "Choose your main angle. If you sit between profiles, we'll capture that next."
          )}
        </p>
      </div>

      {/* 3 + 2 grid */}
      <div className="w-full max-w-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {PERSONAS.slice(0, 3).map((p) => (
            <PersonaCard key={p.id} persona={p} selected={selected === p.id} onSelect={setSelected} t={t} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:max-w-[66%] mx-auto">
          {PERSONAS.slice(3).map((p) => (
            <PersonaCard key={p.id} persona={p} selected={selected === p.id} onSelect={setSelected} t={t} />
          ))}
        </div>
      </div>

      <div className="w-full max-w-3xl grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-3 text-left">
        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Confiance profil", "Profile confidence")}
          </p>
          <div className="grid gap-2">
            {CONFIDENCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPersonaConfidence(option.value)}
                className={`min-h-10 rounded-md border px-3 text-sm font-medium text-left transition-colors ${
                  personaConfidence === option.value
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {t(option.fr, option.en)}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Objectif du diagnostic", "Diagnostic goal")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {GOAL_OPTIONS.map((option) => {
              const Icon = option.Icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStackGoal(option.value)}
                  className={`min-h-10 rounded-md border px-3 text-sm font-medium inline-flex items-center gap-2 transition-colors ${
                    stackGoal === option.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t(option.fr, option.en)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="rounded-xl bg-primary px-8 py-3 text-primary-foreground font-semibold
                   disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {t("Continuer →", "Continue →")}
      </button>
    </div>
  );
}

function PersonaCard({
  persona,
  selected,
  onSelect,
  t,
}: {
  persona: (typeof PERSONAS)[number];
  selected: boolean;
  onSelect: (id: Persona) => void;
  t: (fr: string, en: string) => string;
}) {
  const Icon = persona.Icon;
  const signals = t(persona.signalsFr.join(" · "), persona.signalsEn.join(" · "));
  return (
    <button
      onClick={() => onSelect(persona.id)}
      className={`flex min-h-[164px] flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all
        ${selected
          ? "border-primary bg-accent shadow-md scale-[1.02]"
          : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
        }`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${
        selected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
      }`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-semibold text-sm text-foreground">
        {t(persona.label, persona.labelEn)}
      </span>
      <span className="text-xs text-muted-foreground leading-snug">
        {t(persona.desc, persona.descEn)}
      </span>
      <span className="mt-auto text-[11px] leading-snug text-muted-foreground/75">
        {signals}
      </span>
    </button>
  );
}
