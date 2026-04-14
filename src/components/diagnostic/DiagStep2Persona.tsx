import { useState } from "react";
import type { SessionState, Persona } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  t: (fr: string, en: string) => string;
}

const PERSONAS: { id: Persona; emoji: string; label: string; labelEn: string; desc: string; descEn: string }[] = [
  { id: "THEO", emoji: "💻", label: "Tech / Dev", labelEn: "Tech / Dev", desc: "Développeur indie", descEn: "Indie developer" },
  { id: "SOFIA", emoji: "🎨", label: "Créatif", labelEn: "Creative", desc: "Designer, photo, motion", descEn: "Designer, photo, motion" },
  { id: "MARC", emoji: "📊", label: "Conseil", labelEn: "Consulting", desc: "Consultant, formateur", descEn: "Consultant, trainer" },
  { id: "ALIX", emoji: "📝", label: "Content / Créateur", labelEn: "Content / Creator", desc: "Newsletter, podcast", descEn: "Newsletter, podcast" },
  { id: "CLAIRE", emoji: "⚡", label: "Ops / Business", labelEn: "Ops / Business", desc: "Ops mgr, EA, COO fract.", descEn: "Ops mgr, EA, fractional COO" },
];

export default function DiagStep2Persona({ session, onUpdate, onNext, t }: Props) {
  const [selected, setSelected] = useState<Persona | null>(session.persona || null);

  const handleSubmit = () => {
    if (!selected) return;
    onUpdate({ persona: selected });
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {t("Tu te reconnais le plus dans…", "Which best describes you?")}
        </h1>
      </div>

      {/* 3 + 2 grid */}
      <div className="w-full max-w-xl">
        <div className="grid grid-cols-3 gap-3 mb-3">
          {PERSONAS.slice(0, 3).map((p) => (
            <PersonaCard key={p.id} persona={p} selected={selected === p.id} onSelect={setSelected} t={t} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-[66%] mx-auto">
          {PERSONAS.slice(3).map((p) => (
            <PersonaCard key={p.id} persona={p} selected={selected === p.id} onSelect={setSelected} t={t} />
          ))}
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
  return (
    <button
      onClick={() => onSelect(persona.id)}
      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all
        ${selected
          ? "border-primary bg-accent shadow-md scale-[1.02]"
          : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
        }`}
    >
      <span className="text-3xl">{persona.emoji}</span>
      <span className="font-semibold text-sm text-foreground">
        {t(persona.label, persona.labelEn)}
      </span>
      <span className="text-xs text-muted-foreground">
        {t(persona.desc, persona.descEn)}
      </span>
    </button>
  );
}
