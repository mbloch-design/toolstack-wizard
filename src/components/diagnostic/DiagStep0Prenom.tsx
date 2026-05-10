import { useState } from "react";
import type { SessionState } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  t: (fr: string, en: string) => string;
  fromTool?: string;
}

export default function DiagStep0Prenom({ session, onUpdate, onNext, t, fromTool }: Props) {
  const [value, setValue] = useState(session.firstName);
  const [error, setError] = useState("");

  const validate = (v: string) => {
    if (v.trim().length < 2) return t("Minimum 2 caractères", "Minimum 2 characters");
    if (/\d/.test(v)) return t("Pas de chiffres", "No numbers allowed");
    if (v.length > 50) return t("Maximum 50 caractères", "Maximum 50 characters");
    return "";
  };

  const handleSubmit = () => {
    const err = validate(value);
    if (err) { setError(err); return; }
    onUpdate({ firstName: value.trim() });
    onNext();
  };

  const toolName = fromTool
    ? fromTool.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 text-center">
      {toolName && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm text-muted-foreground max-w-sm">
          {t(
            `Tu viens d'analyser ${toolName} — on va voir si ça mérite sa place dans ta stack.`,
            `You just looked at ${toolName} — let's see if it deserves a place in your stack.`
          )}
        </div>
      )}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {t("Comment tu t'appelles ?", "What's your name?")}
        </h1>
        <p className="text-muted-foreground">
          {t("On personnalise tout le diagnostic pour toi.", "We'll personalize the entire diagnostic for you.")}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <input
          id="diagnostic-first-name"
          name="first-name"
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Sofia"
          maxLength={50}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-center text-lg font-medium
                     placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring
                     transition-shadow"
          autoFocus
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={value.trim().length < 2}
        className="rounded-xl bg-primary px-8 py-3 text-primary-foreground font-semibold
                   disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {t("Continuer →", "Continue →")}
      </button>
    </div>
  );
}
