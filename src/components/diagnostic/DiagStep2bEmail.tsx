import { useState } from "react";
import type { SessionState } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  t: (fr: string, en: string) => string;
}

export default function DiagStep2bEmail({ session, onUpdate, onNext, t }: Props) {
  const [email, setEmail] = useState(session.email || "");
  const [prefs, setPrefs] = useState(session.emailPreferences || { summary: true, actions: false, checkIn: false });
  const [error, setError] = useState("");

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleContinueWithEmail = () => {
    if (!isValidEmail(email.trim())) {
      setError(t("Email invalide", "Invalid email"));
      return;
    }
    onUpdate({ email: email.trim(), emailPreferences: prefs });
    onNext();
  };

  const handleSkip = () => {
    onUpdate({ email: undefined, emailPreferences: undefined });
    onNext();
  };

  const togglePref = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {t("Ton email pour recevoir les résultats ?", "Your email to receive results?")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("100% optionnel. Zéro spam.", "100% optional. Zero spam.")}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <input
          id="diagnostic-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleContinueWithEmail()}
          placeholder="sofia@exemple.com"
          maxLength={255}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-base
                     placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring
                     transition-shadow"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="space-y-2 text-left">
          {([
            { key: "summary" as const, fr: "Résumé de mon diagnostic", en: "Diagnostic summary" },
            { key: "actions" as const, fr: "Alertes si action urgente", en: "Alerts for urgent actions" },
            { key: "checkIn" as const, fr: "Check-in mensuel de ma stack", en: "Monthly stack check-in" },
          ]).map((item) => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer py-1">
              <input
                id={`diagnostic-email-pref-${item.key}`}
                name={`email-pref-${item.key}`}
                type="checkbox"
                checked={prefs[item.key]}
                onChange={() => togglePref(item.key)}
                className="rounded border-border text-primary focus:ring-ring h-4 w-4"
              />
              <span className="text-sm text-foreground">{t(item.fr, item.en)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleContinueWithEmail}
          disabled={!email.trim()}
          className="rounded-xl bg-primary px-6 py-3 text-primary-foreground font-semibold
                     disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {t("Continuer avec email", "Continue with email")}
        </button>
        <button
          onClick={handleSkip}
          className="rounded-xl border border-border px-6 py-3 text-muted-foreground font-medium
                     hover:bg-muted transition-colors"
        >
          {t("Passer cette étape →", "Skip this step →")}
        </button>
      </div>
    </div>
  );
}
