import { useState, useMemo } from "react";
import type { SessionState } from "@/types/diagnostic";
import { formatMonthlyTotal } from "@/utils/diagnosticPricing";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  onPrev: () => void;
  t: (fr: string, en: string) => string;
}

export default function DiagStep6bEmailRecap({ session, onUpdate, onNext, onPrev, t }: Props) {
  const [email, setEmail] = useState(session.email || "");
  const [error, setError] = useState("");

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const totalCostLabel = useMemo(
    () => formatMonthlyTotal(session.selectedTools, t),
    [session.selectedTools, t]
  );

  const handleSend = () => {
    if (!isValidEmail(email.trim())) {
      setError(t("Email invalide", "Invalid email"));
      return;
    }
    onUpdate({
      email: email.trim(),
      emailPreferences: {
        summary: true,
        actions: session.emailPreferences?.actions ?? false,
        checkIn: session.emailPreferences?.checkIn ?? false,
      },
    });
    onNext();
  };

  const handleSkip = () => {
    onUpdate({
      emailPreferences: session.emailPreferences
        ? { ...session.emailPreferences, summary: false }
        : { summary: false, actions: false, checkIn: false },
    });
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 text-center">
      {/* Recap stats */}
      <div className="flex flex-wrap justify-center gap-6">
        <div className="space-y-1">
          <p className="text-3xl font-bold font-mono text-foreground">{session.selectedTools.length}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {t("outils analysés", "tools analyzed")}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold font-mono text-foreground">{totalCostLabel}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            /{t("mois", "mo")}
          </p>
        </div>
      </div>

      {/* Email prompt */}
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          {t("Tu veux recevoir ton rapport par email ?", "Want your report by email?")}
        </h2>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <input
          id="diagnostic-report-email"
          name="report-email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="sofia@exemple.com"
          maxLength={255}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-base
                     placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring
                     transition-shadow"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onPrev}
          className="rounded-xl border border-border px-6 py-3 text-muted-foreground font-medium
                     hover:bg-muted transition-colors"
        >
          ← {t("Précédent", "Previous")}
        </button>
        <button
          onClick={handleSend}
          disabled={!email.trim()}
          className="rounded-xl bg-primary px-6 py-3 text-primary-foreground font-semibold
                     disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          ✓ {t("Envoyer rapport", "Send report")}
        </button>
        <button
          onClick={handleSkip}
          className="rounded-xl border border-border px-6 py-3 text-muted-foreground font-medium
                     hover:bg-muted transition-colors"
        >
          {t("Non, continuer", "No, continue")}
        </button>
      </div>
    </div>
  );
}
