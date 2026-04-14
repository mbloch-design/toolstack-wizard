import { useState } from "react";
import type { SessionState } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  t: (fr: string, en: string) => string;
}

const OPTIONS: { label: string; labelEn: string; value: SessionState["apiSpendTranche"] }[] = [
  { label: "Moins de 20€", labelEn: "Less than €20", value: "low" },
  { label: "20€ à 80€", labelEn: "€20 to €80", value: "mid" },
  { label: "80€ à 200€", labelEn: "€80 to €200", value: "high" },
  { label: "Plus de 200€", labelEn: "More than €200", value: "premium" },
  { label: "Je ne sais pas", labelEn: "I don't know", value: "unknown" },
];

export default function DiagStep5ApiCosts({ session, onUpdate, onNext, t }: Props) {
  const [selected, setSelected] = useState<SessionState["apiSpendTranche"]>(
    session.apiSpendTranche || undefined
  );

  const handleSubmit = () => {
    onUpdate({ apiSpendTranche: selected || "unknown" });
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 text-center">
      <div className="space-y-2 max-w-lg">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {t(
            "Tes dépenses en APIs IA ?",
            "Your AI API spending?"
          )}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            "ChatGPT, Claude, Mistral… tu dépenses combien par mois en usage ?",
            "ChatGPT, Claude, Mistral… how much do you spend per month?"
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all
              ${selected === opt.value
                ? "border-primary bg-accent text-accent-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
          >
            {t(opt.label, opt.labelEn)}
          </button>
        ))}
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
