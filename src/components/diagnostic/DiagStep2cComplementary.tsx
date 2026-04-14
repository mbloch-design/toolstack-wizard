import { useState } from "react";
import type { SessionState, Persona } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  t: (fr: string, en: string) => string;
}

const PERSONAS: { id: Persona; emoji: string; label: string; labelEn: string }[] = [
  { id: "THEO", emoji: "💻", label: "Tech / Dev", labelEn: "Tech / Dev" },
  { id: "SOFIA", emoji: "🎨", label: "Créatif", labelEn: "Creative" },
  { id: "MARC", emoji: "📊", label: "Conseil", labelEn: "Consulting" },
  { id: "ALIX", emoji: "📝", label: "Content", labelEn: "Content" },
  { id: "CLAIRE", emoji: "⚡", label: "Ops / Business", labelEn: "Ops / Business" },
];

export default function DiagStep2cComplementary({ session, onUpdate, onNext, t }: Props) {
  const [selected, setSelected] = useState<Persona[]>(session.complementarySkills || []);

  const toggle = (id: Persona) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    onUpdate({ complementarySkills: selected });
    onNext();
  };

  const available = PERSONAS.filter((p) => p.id !== session.persona);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {t("Tu as des compétences dans d'autres domaines ?", "Do you have skills in other areas?")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("Sélectionne 0 à 4 profils complémentaires.", "Select 0 to 4 complementary profiles.")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
        {available.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all
                ${isSelected
                  ? "border-primary bg-accent shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
                }`}
            >
              <span className="text-2xl">{p.emoji}</span>
              <span className="font-medium text-xs text-foreground">
                {t(p.label, p.labelEn)}
              </span>
              {isSelected && <span className="text-xs text-primary font-bold">✓</span>}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        className="rounded-xl bg-primary px-8 py-3 text-primary-foreground font-semibold
                   hover:opacity-90 transition-opacity"
      >
        {selected.length > 0
          ? t("Continuer →", "Continue →")
          : t("Passer →", "Skip →")}
      </button>
    </div>
  );
}
