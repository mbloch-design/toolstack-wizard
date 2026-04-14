import { useState } from "react";
import type { SessionState } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  t: (fr: string, en: string) => string;
}

const SPECIALTIES = [
  { id: "motion", fr: "Motion", en: "Motion" },
  { id: "photo", fr: "Photo", en: "Photography" },
  { id: "video", fr: "Vidéo", en: "Video" },
  { id: "ui-ux", fr: "UI/UX", en: "UI/UX" },
  { id: "brand", fr: "Brand", en: "Brand" },
  { id: "web", fr: "Web", en: "Web" },
  { id: "cgi-3d", fr: "CGI / 3D", en: "CGI / 3D" },
  { id: "illustration", fr: "Illustration", en: "Illustration" },
  { id: "direction-artistique", fr: "Direction artistique", en: "Art direction" },
  { id: "sound-design", fr: "Sound design", en: "Sound design" },
];

export default function DiagStep3SofiaSpecialties({ session, onUpdate, onNext, t }: Props) {
  const [primary, setPrimary] = useState<string | null>(session.primarySpecialty || null);
  const [complementary, setComplementary] = useState<string[]>(session.complementarySpecialties || []);

  const toggleComp = (id: string) => {
    setComplementary((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!primary) return;
    onUpdate({
      primarySpecialty: primary,
      complementarySpecialties: complementary.filter((s) => s !== primary),
    });
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {t("Tes spécialités créatives ?", "Your creative specialties?")}
        </h1>
      </div>

      {/* Section 1 - Primary */}
      <div className="w-full max-w-lg space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t("Principale (obligatoire)", "Primary (required)")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SPECIALTIES.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setPrimary(s.id);
                setComplementary((prev) => prev.filter((c) => c !== s.id));
              }}
              className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all
                ${primary === s.id
                  ? "border-primary bg-accent text-accent-foreground shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
            >
              {t(s.fr, s.en)}
            </button>
          ))}
        </div>
      </div>

      {/* Section 2 - Complementary */}
      {primary && (
        <div className="w-full max-w-lg space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t("Complémentaires (optionnel)", "Complementary (optional)")}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SPECIALTIES.filter((s) => s.id !== primary).map((s) => {
              const isSelected = complementary.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleComp(s.id)}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all
                    ${isSelected
                      ? "border-primary/60 bg-accent/60 text-accent-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                    }`}
                >
                  {t(s.fr, s.en)} {isSelected && "✓"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!primary}
        className="rounded-xl bg-primary px-8 py-3 text-primary-foreground font-semibold
                   disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {t("Continuer →", "Continue →")}
      </button>
    </div>
  );
}
