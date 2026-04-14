import { useState } from "react";
import type { SessionState } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  t: (fr: string, en: string) => string;
}

const OPTIONS = [
  { label: "< 300€", value: 250 },
  { label: "300€ – 500€", value: 400 },
  { label: "500€ – 800€", value: 650 },
  { label: "800€ – 1 200€", value: 1000 },
  { label: "> 1 200€", value: 1500 },
] as const;

export default function DiagStep1Tjm({ session, onUpdate, onNext, t }: Props) {
  const [selected, setSelected] = useState<number | null>(session.tjm || null);

  const handleSelect = (val: number) => {
    setSelected(val);
  };

  const handleSubmit = () => {
    onUpdate({ tjm: selected ?? 0 });
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {session.firstName ? `${session.firstName}, ` : ""}
          {t("ton TJM actuel ?", "your daily rate?")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {t(
            "Pas obligatoire mais ça affine le calcul de rentabilité de tes outils.",
            "Optional but it sharpens the ROI calculation for your tools."
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all
              ${selected === opt.value
                ? "border-primary bg-accent text-accent-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
          >
            {opt.label}
          </button>
        ))}

        <button
          onClick={() => handleSelect(0)}
          className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all
            ${selected === 0
              ? "border-primary bg-accent text-accent-foreground shadow-sm"
              : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
        >
          {t("Je ne sais pas", "I don't know")}
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={selected === null}
        className="rounded-xl bg-primary px-8 py-3 text-primary-foreground font-semibold
                   disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {t("Continuer →", "Continue →")}
      </button>
    </div>
  );
}
